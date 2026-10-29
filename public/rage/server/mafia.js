const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'mafia_data.json');
const S = Object.assign({ biz: {}, wars: [], hist: [], atk: {} }, (function () { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch (e) { return {}; } })());
let dirty = false;
function mark() { dirty = true; }
setInterval(function () { if (dirty) { dirty = false; try { fs.writeFileSync(FILE, JSON.stringify(S)); } catch (e) {} } }, 5000);

const PREP_MS = 15 * 60000;
const LIVE_MS = 10 * 60000;
const FREE_PREP_MS = 5 * 60000;
const FREE_LIVE_MS = 5 * 60000;
const BIZ_CD = 3 * 3600000;
const ATK_CD = 60 * 60000;
const RADIUS = 70;
const HOURS = [15, 23];
const MIN_ATK = 3, MIN_DEF = 2;
const INCOME = { fuel: 260, shop: 160, gun: 320, atm: 90 };
const TICK_PTS = 1, KILL_PTS = 2;

function C() { return global.CrimeSystem; }
function B() { return global.BizSystem; }
function ORGS() { return C().ORGS; }
function notify(p, t, x) { if (typeof global.hudNotify === 'function') global.hudNotify(p, t, x); else p.outputChatBox(x); }
function org(p) { return C() ? C().org(p) : ''; }
function isMafia(k) { return !!k && !!ORGS()[k] && ORGS()[k].t === 'mafia'; }
function mafias() { return Object.keys(ORGS()).filter(isMafia); }
function key(kind, id) { return kind + ':' + id; }
function money(n) { return '$' + String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function nick(p) { return String((p.account && p.account.nick) || p.name).replace(/_/g, ' '); }
function admLvl(p) { return C() ? C().admLvl(p) : 0; }
function mskHour() { return new Date(Date.now() + 3 * 3600000).getUTCHours(); }
function hourOk() { const h = mskHour(); return h >= HOURS[0] && h < HOURS[1]; }
function members(k) { return mp.players.toArray().filter(function (x) { return x.account && org(x) === k; }); }
function inZone(p, b) { return (p.dimension || 0) === 0 && Math.hypot(p.position.x - b.x, p.position.y - b.y) < RADIUS && Math.abs(p.position.z - b.z) < 40; }
function alive(p) { try { return p.health > 0; } catch (e) { return true; } }

function bizList() {
    const all = B() && B().all ? B().all() : [];
    return all.map(function (b) {
        const st = S.biz[key(b.kind, b.id)] || {};
        return { k: key(b.kind, b.id), kind: b.kind, id: b.id, n: b.name, kn: b.kn, i: b.i, x: b.x, y: b.y, z: b.z, own: b.ownerName, m: isMafia(st.m) ? st.m : '', since: st.since || 0, cd: st.cd || 0, inc: INCOME[b.kind] || 100 };
    });
}
function bizBy(k) { return bizList().find(function (b) { return b.k === k; }) || null; }
function warOf(k) { return S.wars.find(function (w) { return w.b === k; }) || null; }
function busy(m) { return S.wars.find(function (w) { return w.a === m || w.d === m; }) || null; }

function canDeclare(p) {
    const k = org(p);
    if (!isMafia(k)) return false;
    return C().mgr(p) || C().rank(p) >= 5 || admLvl(p) >= 6;
}
function declareCheck(p, b) {
    const k = org(p);
    if (!isMafia(k)) return 'Войны за бизнес ведут только мафии';
    if (!canDeclare(p)) return 'Забить стрелу может «' + C().rankName(k, 5) + '» и выше';
    if (!b) return 'Бизнес не найден';
    if (b.m === k) return 'Этот бизнес уже под вашей крышей';
    if (warOf(b.k)) return 'За этот бизнес уже идёт война';
    if (busy(k)) return 'Ваша семья уже участвует в войне за бизнес';
    if (b.m && busy(b.m)) return ORGS()[b.m].n + ' уже заняты другой войной';
    if (b.cd > Date.now()) return 'Бизнес недавно переходил из рук в руки. Ещё ' + Math.ceil((b.cd - Date.now()) / 60000) + ' мин';
    if (admLvl(p) < 6) {
        if (!hourOk()) return 'Войны за бизнес разрешены с ' + HOURS[0] + ':00 до ' + HOURS[1] + ':00 по МСК';
        const left = (S.atk[k] || 0) + ATK_CD - Date.now();
        if (left > 0) return 'Ваша семья недавно нападала. Следующая стрела через ' + Math.ceil(left / 60000) + ' мин';
        if (members(k).length < MIN_ATK) return 'Нужно минимум ' + MIN_ATK + ' членов семьи в сети';
        if (b.m && members(b.m).length < MIN_DEF) return 'У ' + ORGS()[b.m].n + ' в сети меньше ' + MIN_DEF + ' человек — нападать на них сейчас нельзя';
    }
    return '';
}
function toMafia(k, line) { if (k && C()) C().toOrg(k, line); }
function declare(p, b) {
    const k = org(p), now = Date.now(), free = !b.m;
    const w = { b: b.k, n: b.n, kind: b.kind, x: b.x, y: b.y, z: b.z, a: k, d: b.m || '', by: nick(p), at: now, start: now + (free ? FREE_PREP_MS : PREP_MS), end: now + (free ? FREE_PREP_MS + FREE_LIVE_MS : PREP_MS + LIVE_MS), sa: 0, sd: 0, ka: 0, kd: 0 };
    S.wars.push(w); S.atk[k] = now; mark();
    const mins = Math.round((w.start - now) / 60000);
    const A = ORGS()[k];
    toMafia(k, '!{' + A.c + '}[' + A.n + '] !{#ffffff}' + nick(p) + ' забил стрелу за «' + b.n + '»' + (w.d ? ' с ' + ORGS()[w.d].n : '') + '. Сбор через ' + mins + ' мин — метка на карте');
    if (w.d) toMafia(w.d, '!{#ff5555}[СТРЕЛА] !{#ffffff}' + A.n + ' претендуют на вашу крышу «' + b.n + '». Защищайте бизнес через ' + mins + ' мин — метка на карте');
    [k, w.d].forEach(function (m) { if (m) members(m).forEach(function (x) { x.call('phone:gps', [b.x, b.y, 'Стрела: ' + b.n]); }); });
    C().olog(k, 'Стрела за «' + b.n + '»' + (w.d ? ' против ' + ORGS()[w.d].n : '') + ' (' + nick(p) + ')');
    if (w.d) C().olog(w.d, A.n + ' забили стрелу за «' + b.n + '»');
    if (global.SLog) try { global.SLog.add('crime', { actor: p, action: 'bizwar', details: b.n + ' vs ' + (w.d ? ORGS()[w.d].n : 'свободный') }); } catch (e) {}
    sendZonesAll();
}

function hudData(w, me, now) {
    const A = ORGS()[w.a], D = w.d ? ORGS()[w.d] : null;
    const live = now >= w.start;
    const inA = members(w.a).filter(function (x) { return inZone(x, w); }).length;
    const inD = w.d ? members(w.d).filter(function (x) { return inZone(x, w); }).length : 0;
    return { ak: w.a, dk: w.d, ac: A.c, dc: D ? D.c : '#9aa4b8', me: me, n: (live ? 'БИЗВАР · ' : 'СБОР · ') + w.n, a: A.n, d: D ? D.n : 'без крыши', ka: w.sa, kd: w.sd, ia: inA, id: inD, left: Math.max(0, Math.ceil(((live ? w.end : w.start) - now) / 1000)) };
}
function finish(w, now) {
    const win = w.sa > w.sd ? w.a : (w.d || (w.sa > 0 ? w.a : ''));
    const prev = w.d;
    const st = S.biz[w.b] || (S.biz[w.b] = {});
    if (win) { if (st.m !== win) st.since = now; st.m = win; }
    st.cd = now + BIZ_CD;
    const A = ORGS()[w.a], D = w.d ? ORGS()[w.d] : null;
    const res = !win ? 'никто не пришёл — бизнес остался без крыши' : win === w.a ? A.n + ' забрали крышу' : D.n + ' отстояли крышу';
    [w.a, w.d].forEach(function (m) {
        if (!m) return;
        members(m).forEach(function (x) { x.outputChatBox('!{#ffd24d}[БИЗВАР] !{#ffffff}«' + w.n + '»: ' + res + ' (' + w.sa + ' : ' + w.sd + ', убийств ' + w.ka + ' : ' + w.kd + ')'); x.call('crime:war', ['']); });
        C().olog(m, 'Бизвар «' + w.n + '»: ' + (win === m ? 'победа' : 'поражение') + ' ' + w.sa + ':' + w.sd);
    });
    S.hist.unshift({ t: now, n: w.n, a: w.a, d: prev, w: win, sa: w.sa, sd: w.sd, ka: w.ka, kd: w.kd });
    S.hist = S.hist.slice(0, 80);
}
function cancel(w, by) {
    S.wars = S.wars.filter(function (x) { return x !== w; });
    [w.a, w.d].forEach(function (m) {
        if (!m) return;
        members(m).forEach(function (x) { x.outputChatBox('!{#ff9f43}[БИЗВАР] !{#ffffff}Война за «' + w.n + '» отменена администрацией (' + by + '). Крыша не меняется'); x.call('crime:war', ['']); });
        C().olog(m, 'Бизвар «' + w.n + '» отменён администрацией');
    });
    S.atk[w.a] = 0;
    mark(); sendZonesAll();
}

let tick = 0;
setInterval(function () {
    if (!C()) return;
    const now = Date.now();
    tick++;
    S.wars = S.wars.filter(function (w) {
        if (!ORGS()[w.a]) return false;
        const live = now >= w.start;
        if (live && !w.liveSent) {
            w.liveSent = true;
            [w.a, w.d].forEach(function (m) { if (m) members(m).forEach(function (x) { x.outputChatBox('!{#ff5555}[БИЗВАР] !{#ffffff}Война за «' + w.n + '» началась! Держите территорию вокруг бизнеса ' + Math.round((w.end - w.start) / 60000) + ' мин'); }); });
            sendZonesAll();
        }
        if (live && tick % 3 === 0) {
            const inA = members(w.a).filter(function (x) { return inZone(x, w) && alive(x); }).length;
            const inD = w.d ? members(w.d).filter(function (x) { return inZone(x, w) && alive(x); }).length : 0;
            if (inA > inD) w.sa += TICK_PTS; else if (inD > inA) w.sd += TICK_PTS;
        }
        [w.a, w.d].forEach(function (m) { if (m) { const h = JSON.stringify(hudData(w, m, now)); members(m).forEach(function (x) { x.call('crime:war', [h]); }); } });
        if (now < w.end) return true;
        finish(w, now);
        setTimeout(sendZonesAll, 200);
        return false;
    });
    mark();
}, 3000);

mp.events.add('playerDeath', function (p, reason, killer) {
    if (!killer || !killer.account || killer === p || !C()) return;
    const kk = org(killer), pk = org(p);
    S.wars.forEach(function (w) {
        if (Date.now() < w.start || !inZone(p, w)) return;
        if (kk === w.a && pk === w.d && pk) { w.ka++; w.sa += KILL_PTS; mark(); }
        else if (kk === w.d && pk === w.a && kk) { w.kd++; w.sd += KILL_PTS; mark(); }
    });
});

setInterval(function () {
    if (!C()) return;
    const cnt = {}, sum = {};
    bizList().forEach(function (b) { if (b.m) { cnt[b.m] = (cnt[b.m] || 0) + 1; sum[b.m] = (sum[b.m] || 0) + b.inc; } });
    Object.keys(sum).forEach(function (k) {
        C().O(k).bank += sum[k];
        C().olog(k, 'Крыша (' + cnt[k] + ' бизн.): +' + money(sum[k]));
        toMafia(k, '!{' + ORGS()[k].c + '}[' + ORGS()[k].n + '] !{#ffffff}Доля с ' + cnt[k] + ' бизнесов под крышей: +' + money(sum[k]) + ' в общак');
    });
    C().mark();
}, 3600000);

function zonesFor(p) {
    const k = org(p), adm = admLvl(p) >= 5;
    return S.wars.filter(function (w) { return adm || w.a === k || w.d === k; }).map(function (w) { return [w.x, w.y, w.z, RADIUS, Date.now() >= w.start ? 1 : 0, ORGS()[w.a].c, w.n]; });
}
function sendZones(p) { try { p.call('mafia:zones', [JSON.stringify(zonesFor(p))]); } catch (e) {} }
function sendZonesAll() { mp.players.forEach(function (p) { if (p.account) sendZones(p); }); }
mp.events.add('playerReady', function (p) { setTimeout(function () { if (mp.players.exists(p)) sendZones(p); }, 6000); });
mp.events.add('playerSpawn', function (p) { setTimeout(function () { if (mp.players.exists(p) && p.account) sendZones(p); }, 2000); });

function tabData(p) {
    const k = org(p), now = Date.now(), pos = p.position;
    const orgs = {};
    mafias().forEach(function (m) { orgs[m] = { n: ORGS()[m].n, c: ORGS()[m].c, on: members(m).length, busy: !!busy(m) }; });
    const list = bizList().map(function (b) {
        const w = warOf(b.k);
        return { k: b.k, n: b.n, kn: b.kn, i: b.i, kind: b.kind, m: b.m, own: b.own, inc: b.inc, cd: b.cd > now ? Math.ceil((b.cd - now) / 60000) : 0, d: Math.round(Math.hypot(pos.x - b.x, pos.y - b.y)), since: b.since,
            w: w ? { a: w.a, d: w.d, live: now >= w.start, left: Math.max(0, Math.ceil(((now >= w.start ? w.end : w.start) - now) / 1000)) } : null };
    });
    const mine = list.filter(function (b) { return b.m === k; });
    return {
        me: k, meN: ORGS()[k].n, meC: ORGS()[k].c, can: canDeclare(p), hourOk: hourOk() || admLvl(p) >= 6, hours: HOURS,
        atkLeft: Math.max(0, Math.ceil(((S.atk[k] || 0) + ATK_CD - now) / 60000)), prep: Math.round(PREP_MS / 60000), live: Math.round(LIVE_MS / 60000), r: RADIUS,
        bank: C().O(k).bank, income: mine.reduce(function (a, b) { return a + b.inc; }, 0), orgs: orgs, list: list,
        wars: S.wars.map(function (w) { return { n: w.n, a: w.a, d: w.d, sa: w.sa, sd: w.sd, ka: w.ka, kd: w.kd, live: now >= w.start, left: Math.max(0, Math.ceil(((now >= w.start ? w.end : w.start) - now) / 1000)), by: w.by, b: w.b }; }),
        hist: S.hist.slice(0, 40)
    };
}
function open(p) {
    if (!isMafia(org(p))) return notify(p, 'warn', 'Планшет семьи доступен только мафиям');
    p.call('mafia:tab', [JSON.stringify(tabData(p))]);
}
mp.events.addCommand('bizwar', open);
mp.events.add('srv:mafia:open', open);
mp.events.add('srv:mafia:act', function (p, json) {
    let d; try { d = JSON.parse(json); } catch (e) { return; }
    if (!isMafia(org(p))) return;
    if (d.op === 'gps') { const b = bizBy(String(d.k)); if (b) { p.call('phone:gps', [b.x, b.y, b.n]); p.call('mafia:msg', ['Метка поставлена: ' + b.n, 1]); } return; }
    if (d.op === 'declare') {
        const b = bizBy(String(d.k));
        const err = declareCheck(p, b);
        if (err) return p.call('mafia:msg', [err, 0]);
        declare(p, b);
        p.call('mafia:tab', [JSON.stringify(tabData(p))]);
        p.call('mafia:msg', ['Стрела забита: «' + b.n + '». Сбор через ' + Math.round((warOf(b.k).start - Date.now()) / 60000) + ' мин', 1]);
        return;
    }
    if (d.op === 'refresh') p.call('mafia:tab', [JSON.stringify(tabData(p))]);
});

function admView() {
    const now = Date.now();
    const orgs = {};
    mafias().forEach(function (m) { orgs[m] = { n: ORGS()[m].n, c: ORGS()[m].c, on: members(m).length }; });
    return {
        orgs: orgs,
        list: bizList().map(function (b) { return { k: b.k, n: b.n, kn: b.kn, kind: b.kind, m: b.m, cd: b.cd > now ? Math.ceil((b.cd - now) / 60000) : 0, w: !!warOf(b.k) }; }),
        wars: S.wars.map(function (w) { return { b: w.b, n: w.n, a: w.a, d: w.d, sa: w.sa, sd: w.sd, ka: w.ka, kd: w.kd, live: now >= w.start, left: Math.max(0, Math.ceil(((now >= w.start ? w.end : w.start) - now) / 1000)), by: w.by }; }),
        hist: S.hist.slice(0, 20)
    };
}
function admAct(by, d) {
    const op = String(d.op || '');
    if (op === 'cancel') { const w = warOf(String(d.b)); if (!w) return { err: 'Эта война уже закончилась' }; cancel(w, by); return { ok: 'Война за «' + w.n + '» отменена' }; }
    if (op === 'cancelall') { const n = S.wars.length; S.wars.slice().forEach(function (w) { cancel(w, by); }); return { ok: 'Отменено войн: ' + n }; }
    if (op === 'setm') {
        const ks = (Array.isArray(d.ks) ? d.ks : [d.k]).map(String), m = String(d.m || '');
        if (m && !isMafia(m)) return { err: 'Мафия не найдена' };
        let n = 0;
        ks.forEach(function (k) {
            if (!bizBy(k)) return;
            const w = warOf(k); if (w) cancel(w, by);
            const st = S.biz[k] || (S.biz[k] = {});
            st.m = m || ''; st.since = Date.now(); st.cd = 0; n++;
        });
        mark(); sendZonesAll();
        if (m) C().olog(m, 'Администрация передала крышу: ' + n + ' бизн.');
        return { ok: n + ' бизн. → ' + (m ? ORGS()[m].n : 'без крыши') };
    }
    if (op === 'swap') {
        const from = String(d.from || ''), to = String(d.to || '');
        if (!isMafia(from) || from === to || (to && !isMafia(to))) return { err: 'Выберите две разные мафии' };
        let n = 0;
        Object.keys(S.biz).forEach(function (k) { if (S.biz[k].m === from) { S.biz[k].m = to; S.biz[k].since = Date.now(); S.biz[k].cd = 0; n++; } });
        S.wars.slice().forEach(function (w) { if (w.a === from || w.d === from) cancel(w, by); });
        mark();
        return { ok: ORGS()[from].n + ': ' + n + ' бизн. → ' + (to ? ORGS()[to].n : 'без крыши') };
    }
    if (op === 'cd') { const st = S.biz[String(d.k)]; if (st) st.cd = 0; Object.keys(S.atk).forEach(function (k) { if (d.all) S.atk[k] = 0; }); mark(); return { ok: 'Откат сброшен' }; }
    return { err: 'Неизвестное действие' };
}

global.MafiaSystem = { open: open, admView: admView, admAct: admAct, isMafia: function (p) { return isMafia(org(p)); } };
console.log('[mafia] войны за бизнес загружены, крыш: ' + Object.keys(S.biz).filter(function (k) { return S.biz[k].m; }).length);
