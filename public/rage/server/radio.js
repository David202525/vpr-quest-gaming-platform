const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'radio_data.json');
const DB = (function () { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch (e) { return {}; } })();
if (!DB.inner) DB.inner = {};
let dirty = false;
setInterval(function () { if (!dirty) return; dirty = false; fs.writeFile(FILE, JSON.stringify(DB), function () {}); }, 5000);

const FACS = {
    lspd: { n: 'LSPD', pub: '101.1' },
    sheriff: { n: 'Шериф', pub: '102.2' },
    fib: { n: 'FIB', pub: '103.3' },
    army: { n: 'Армия', pub: '104.4' },
    gov: { n: 'Мэрия', pub: '105.5' },
    medic: { n: 'EMS', pub: '106.6' },
    lic: { n: 'Лиц. центр', pub: '107.7' }
};
const POLICE = ['lspd', 'sheriff', 'fib', 'army'];
const DROP_CHANCE = 0.15;

function U() { return global.UiSystem; }
function G() { return global.GovFaction; }
function notify(p, t, x) { if (typeof global.hudNotify === 'function') global.hudNotify(p, t, x); else p.outputChatBox(x); }
function fac(p) { const j = p.account && p.account.job ? String(p.account.job) : ''; return FACS[j] ? j : ''; }
function nick(p) { return String((p.account && p.account.nick) || p.name).replace(/_/g, ' '); }
function isBoss(p) { return !!(fac(p) && G() && G().canManage && G().canManage(p)); }
function count(p, k) { return U() && U().countItem ? U().countItem(p, k) : 0; }
function hasRadio(p) { return count(p, 'radio') > 0 || count(p, 'radio_t') > 0; }
function trophyOnly(p) { return count(p, 'radio') === 0 && count(p, 'radio_t') > 0; }
function norm(f) {
    const n = Number(String(f || '').replace(',', '.'));
    if (!isFinite(n) || n < 30 || n > 999.9) return null;
    return n.toFixed(1);
}
function admLvl(p) { return global.AdminSystem && global.AdminSystem.realLvl ? global.AdminSystem.realLvl(p) : 0; }

function innerOf(f) {
    if (!DB.inner[f]) {
        let v;
        do { v = (200 + Math.floor(Math.random() * 7000) / 10).toFixed(1); } while (whoOwns(v));
        DB.inner[f] = v; dirty = true;
    }
    return DB.inner[f];
}
function whoOwns(fq) {
    for (const f in FACS) {
        if (FACS[f].pub === fq) return { f: f, kind: 'pub' };
        if (DB.inner[f] === fq) return { f: f, kind: 'inner' };
    }
    return null;
}

function access(p, fq) {
    const o = whoOwns(fq);
    const my = fac(p);
    const tro = trophyOnly(p);
    if (!o) return tro ? 'listen' : 'talk';
    if (o.f === my) return 'talk';
    if (tro) return 'listen';
    if (o.kind === 'pub' && isBoss(p)) return 'talk';
    return null;
}

function chName(p, fq) {
    const o = whoOwns(fq);
    if (!o) return 'Открытый канал';
    if (o.kind === 'pub') return 'Дежурный канал ' + FACS[o.f].n;
    return o.f === fac(p) ? 'Внутренний канал ' + FACS[o.f].n : 'Закрытый канал';
}

function tune(p, fq, silent) {
    fq = norm(fq);
    if (!fq) return notify(p, 'error', 'Частота должна быть от 30.0 до 999.9');
    if (!hasRadio(p)) return notify(p, 'error', 'У вас нет рации');
    const a = access(p, fq);
    if (!a) {
        p.radio = { fq: fq, mode: 'none' };
        sendState(p);
        return notify(p, 'warn', fq + ' МГц: шифрованный канал, доступа нет');
    }
    p.radio = { fq: fq, mode: a };
    stopTx(p);
    sendState(p);
    if (!silent) notify(p, 'ok', 'Рация: ' + fq + ' МГц · ' + chName(p, fq) + (a === 'listen' ? ' (только прослушка)' : ''));
}
function off(p) {
    stopTx(p);
    p.radio = null;
    sendState(p);
}

function sendState(p) {
    if (!mp.players.exists(p)) return;
    const r = p.radio;
    p.call('radio:state', [JSON.stringify(r && r.mode !== 'none' ? { fq: r.fq, mode: r.mode, n: chName(p, r.fq) } : null)]);
}

function panel(p, msg) {
    if (!hasRadio(p)) return notify(p, 'error', 'У вас нет рации');
    const f = fac(p);
    const r = p.radio;
    const pubs = Object.keys(FACS).map(function (k) {
        return { f: k, n: FACS[k].n, fq: FACS[k].pub, ok: k === f || isBoss(p) || trophyOnly(p) };
    });
    p.call('radio:panel', [JSON.stringify({
        fq: r ? r.fq : '', mode: r ? r.mode : 'off', ch: r ? chName(p, r.fq) : '',
        fac: f ? FACS[f].n : '', inner: f ? innerOf(f) : '', boss: isBoss(p), tro: trophyOnly(p),
        pubs: pubs, err: msg && msg.err, ok: msg && msg.ok
    })]);
}

function listeners(fq, except) {
    return mp.players.toArray().filter(function (x) {
        return x !== except && x.radio && x.radio.fq === fq && x.radio.mode !== 'none' && x.radioHas;
    });
}

function stopTx(p) {
    if (!p.radioTx) return;
    p.radioTx = false;
    try { p.setVariable('radioTx', ''); } catch (e) {}
}
mp.events.add('srv:radio:tx', function (p, on) {
    on = !!Number(on);
    if (!on) return stopTx(p);
    const r = p.radio;
    if (!r || r.mode !== 'talk' || !p.radioHas) return;
    if (p.account && p.account.downed) return;
    if (p.getVariable('cuffed')) return notify(p, 'warn', 'В наручниках рацией не воспользоваться');
    p.radioTx = true;
    p.setVariable('radioTx', r.fq);
    const own = whoOwns(r.fq);
    const name = nick(p);
    listeners(r.fq, p).forEach(function (l) {
        const show = !own || (fac(l) && fac(l) === fac(p)) || (own.kind === 'pub' && isBoss(l));
        l.call('radio:talk', [show ? name : '']);
    });
});

function targets(s) {
    if (!s.radioTx || !s.radio) return [];
    return listeners(s.radio.fq, s).map(function (x) { return x.id; });
}

setInterval(function () {
    mp.players.forEach(function (p) {
        if (!p.account) return;
        const f = fac(p);
        if (f && count(p, 'radio') < 1 && U() && U().addItem) { U().addItem(p, 'radio', 1); notify(p, 'ok', 'Вам выдана служебная рация. Используйте её в инвентаре или /radio'); }
        if (!f && count(p, 'radio') > 0 && U() && U().takeItems) { U().takeItems(p, 'radio', 99); if (p.radio && !count(p, 'radio_t')) off(p); }
        p.radioHas = hasRadio(p);
        if (!p.radioHas && p.radio) { off(p); return; }
        if (p.radio) {
            const a = access(p, p.radio.fq) || 'none';
            if (a !== p.radio.mode) {
                p.radio.mode = a;
                if (a !== 'talk') stopTx(p);
                sendState(p);
                if (a === 'none') notify(p, 'warn', 'Рация: канал ' + p.radio.fq + ' стал недоступен');
            }
        }
    });
}, 2000);

mp.events.add('playerDeath', function (p, reason, killer) {
    stopTx(p);
    const C = global.CrimeSystem;
    if (!killer || killer === p || !killer.account || !C || !C.org) return;
    const k = C.org(killer);
    if (!k || !C.ORGS[k] || POLICE.indexOf(fac(p)) < 0) return;
    if (count(p, 'radio') < 1 || Math.random() > DROP_CHANCE) return;
    if (U() && U().dropAt) {
        U().dropAt(p, { k: 'radio_t', c: 1 });
        notify(killer, 'ok', 'С тела выпала служебная рация. Подберите её, пока не поздно');
        if (G() && G().flog) try { G().flog(fac(p), 'Утеряна служебная рация: ' + nick(p)); } catch (e) {}
    }
});
mp.events.add('playerQuit', function (p) { p.radio = null; p.radioTx = false; });

mp.events.add('srv:radio:open', function (p) { panel(p); });
mp.events.add('srv:radio:act', function (p, a, v) {
    a = String(a); v = String(v || '');
    if (a === 'tune') { tune(p, v); return panel(p); }
    if (a === 'inner') { const f = fac(p); if (!f) return panel(p, { err: 'Вы не состоите во фракции' }); tune(p, innerOf(f)); return panel(p); }
    if (a === 'off') { off(p); notify(p, 'warn', 'Рация выключена'); return panel(p); }
    if (a === 'setInner') {
        const f = fac(p);
        if (!f || !isBoss(p)) return panel(p, { err: 'Менять частоту может только лидер или заместитель' });
        const fq = norm(v);
        if (!fq) return panel(p, { err: 'Частота должна быть от 30.0 до 999.9' });
        const o = whoOwns(fq);
        if (o && !(o.f === f && o.kind === 'inner')) return panel(p, { err: 'Эта частота уже занята' });
        const old = DB.inner[f];
        DB.inner[f] = fq; dirty = true;
        mp.players.forEach(function (x) {
            if (fac(x) !== f) {
                if (x.radio && x.radio.fq === old && x.radio.mode === 'listen') { notify(x, 'warn', 'Рация: эфир на ' + old + ' пропал'); off(x); }
                return;
            }
            notify(x, 'ok', 'Рация: внутренняя частота ' + FACS[f].n + ' изменена на ' + fq + ' МГц');
            if (x.radio && x.radio.fq === old) tune(x, fq, true);
        });
        if (G() && G().flog) try { G().flog(f, nick(p) + ' сменил внутреннюю частоту рации'); } catch (e) {}
        return panel(p, { ok: 'Новая внутренняя частота: ' + fq });
    }
});

mp.events.addCommand('radio', function (p, full) {
    const v = String(full || '').trim();
    if (!v) return panel(p);
    if (v === 'off') return off(p);
    tune(p, v);
});
mp.events.addCommand('radiofreqs', function (p) {
    if (admLvl(p) < 6) return;
    Object.keys(FACS).forEach(function (f) { p.outputChatBox('!{#7fd4ff}' + FACS[f].n + ': дежурная ' + FACS[f].pub + ', внутренняя ' + innerOf(f)); });
});

setTimeout(function () {
    const I = U() && U().ITEMS;
    if (I) {
        if (!I.radio) I.radio = { n: 'Служебная рация', i: '📻', w: 0.3, s: 1, gov: 1, use: 'radio' };
        if (!I.radio_t) I.radio_t = { n: 'Трофейная рация', i: '📻', w: 0.3, s: 1, ill: 1, use: 'radio' };
    }
    Object.keys(FACS).forEach(innerOf);
}, 1000);

global.RadioSystem = { targets: targets, open: panel, FACS: FACS };
console.log('[radio] рации фракций загружены');
