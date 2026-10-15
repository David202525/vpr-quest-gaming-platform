const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'wanted_data.json');
const store = (function () { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch (e) { return {}; } })();
let dirty = false;
setInterval(function () { if (dirty) { dirty = false; try { fs.writeFileSync(FILE, JSON.stringify(store)); } catch (e) {} } }, 5000);

const MAX = 5;
const MIN_PER_STAR = 10;
const COPS = ['lspd', 'sheriff', 'fib'];
const STATIONS = [[441.0, -982.0, 30.7], [1853.0, 3686.0, 34.3], [-447.0, 6013.0, 31.7], [-1092.0, -809.0, 19.3], [370.0, -1608.0, 29.3]];

function acc(p) { return p.account || p.admAcc || null; }
function sid(p) { const a = acc(p); return a && a.id ? Number(a.id) : 0; }
function nick(p) { const a = acc(p); return String((a && a.nick) || p.name).replace(/_/g, ' '); }
function A() { return global.AdminCore || {}; }
function admLvl(p) { return global.AdminSystem && global.AdminSystem.lvl ? global.AdminSystem.lvl(p) : (A().lvl ? A().lvl(p) : 0); }
function login(p) { return A().login ? A().login(p) : p.name; }
function notify(p, type, text) { if (typeof global.hudNotify === 'function') global.hudNotify(p, type, text); else p.outputChatBox(text); }
function slog(p, action, details) { if (global.SLog) try { global.SLog.add('wanted', { actor: p, action: action, details: details }); } catch (e) {} }
function isCop(p) { const a = acc(p); return !!(a && COPS.indexOf(a.job) >= 0); }
function find(s) {
    s = String(s || '').trim();
    if (!s) return null;
    if (s[0] === '#') { const id = Number(s.slice(1)); return mp.players.toArray().find(function (x) { return sid(x) === id; }) || null; }
    const n = Number(s);
    if (String(n) === s) { const p = mp.players.at(n); return p && mp.players.exists(p) ? p : null; }
    return mp.players.toArray().find(function (x) { return x.name.toLowerCase() === s.toLowerCase(); }) || null;
}

function get(p) { const r = store[sid(p)]; return r ? r.s : 0; }
function sync(p) {
    const s = get(p);
    if (p.getVariable('wanted') !== s) p.setVariable('wanted', s);
    p.call('hud:wanted', [s]);
}
function set(p, stars, reason, by) {
    const id = sid(p);
    if (!id) return 'У игрока нет аккаунта';
    stars = Math.max(0, Math.min(MAX, Math.floor(Number(stars) || 0)));
    if (!stars) delete store[id];
    else store[id] = { s: stars, r: String(reason || 'без причины').slice(0, 80), by: by || '', d: Date.now() };
    dirty = true;
    sync(p);
    return null;
}
function add(p, n, reason, by) { return set(p, get(p) + n, reason, by); }

function cuff(p, on) {
    p.setVariable('cuffed', !!on);
    if (on && p.vehicle && p.seat === 0) try { p.removeFromVehicle(); } catch (e) {}
    if (on) try { p.removeAllWeapons(); } catch (e) {}
}

function arrest(officer, t) {
    const s = get(t);
    if (!s) return 'У задержанного нет розыска';
    if (!global.JailSystem || !global.JailSystem.prison) return 'Модуль тюрьмы не загружен';
    const min = s * MIN_PER_STAR;
    const r = store[sid(t)] ? store[sid(t)].r : 'розыск';
    const e = global.JailSystem.prison(officer, t, min, r + ' (' + s + '★)');
    if (e) return e;
    cuff(t, false);
    set(t, 0);
    return null;
}

/* ---------- панель администратора ---------- */
function pact(p, d, t) {
    const a = d.action;
    if (['wantedset', 'wantedclear', 'cuff', 'uncuff', 'prisonrelease'].indexOf(a) < 0) return false;
    const T = function (e, ok) { if (A().toast) A().toast(p, e, ok); if (A().sendPanel) A().sendPanel(p); return true; };
    if (admLvl(p) < 3) return T('Доступно с 3 уровня администрации', false);
    if (!t) return T('Игрок не найден', false);
    if (a === 'wantedset') {
        const n = Math.max(1, Math.min(MAX, Number(d.stars) || 1));
        const e = set(t, n, d.reason || 'выдано администрацией', login(p));
        if (!e) { notify(t, 'warn', 'Вы объявлены в розыск: ' + n + '★ · ' + (d.reason || '')); slog(p, 'wanted-set', nick(t) + ' → ' + n + '★ · ' + (d.reason || '')); }
        return T(e || 'Розыск ' + n + '★ выдан', !e);
    }
    if (a === 'wantedclear') {
        set(t, 0);
        notify(t, 'ok', 'Розыск снят администрацией');
        slog(p, 'wanted-clear', nick(t));
        return T('Розыск снят', true);
    }
    if (a === 'cuff' || a === 'uncuff') {
        cuff(t, a === 'cuff');
        notify(t, a === 'cuff' ? 'warn' : 'ok', a === 'cuff' ? 'На вас надели наручники' : 'С вас сняли наручники');
        slog(p, a, nick(t));
        return T(a === 'cuff' ? 'Наручники надеты' : 'Наручники сняты', true);
    }
    if (a === 'prisonrelease') {
        const j = global.JailSystem && global.JailSystem.info(t);
        if (!j || j.type !== 'prison' || !j.officer) return T('Игрок не в тюрьме от сотрудника', false);
        global.JailSystem.release(t, 'освобождён администрацией');
        slog(p, 'prison-release', nick(t));
        return T('Выпущен из тюрьмы', true);
    }
    return false;
}

/* ---------- команды полиции ---------- */
function copOnly(p) { if (!isCop(p)) { notify(p, 'error', 'Доступно только сотрудникам полиции'); return false; } return true; }
function near(p, t, m) { return t && t !== p && t.dimension === p.dimension && p.position.subtract(t.position).length() <= m; }
mp.events.addCommand('su', function (p, full) {
    if (!copOnly(p)) return;
    const a = String(full || '').trim().split(/\s+/);
    const t = find(a[0]), n = Math.floor(Number(a[1]));
    const reason = a.slice(2).join(' ');
    if (!t || !(n >= 1 && n <= MAX) || !reason) return notify(p, 'warn', '/su [id] [1-5] [причина]');
    if (t === p) return;
    set(t, Math.max(get(t), n), reason, nick(p));
    notify(t, 'warn', 'Вы объявлены в розыск: ' + get(t) + '★ · ' + reason);
    notify(p, 'ok', nick(t) + ' объявлен в розыск: ' + get(t) + '★');
    slog(p, 'su', nick(t) + ' → ' + n + '★ · ' + reason);
});
mp.events.addCommand('clear', function (p, full) {
    if (!copOnly(p)) return;
    const t = find(full);
    if (!t) return notify(p, 'warn', '/clear [id]');
    set(t, 0);
    notify(t, 'ok', 'Ваш розыск снят офицером ' + nick(p));
    notify(p, 'ok', 'Розыск снят');
    slog(p, 'clear', nick(t));
});
mp.events.addCommand('cuff', function (p, full) {
    if (!copOnly(p)) return;
    const t = find(full);
    if (!near(p, t, 2.5)) return notify(p, 'warn', '/cuff [id] — подойдите к человеку вплотную');
    if (t.vehicle) return notify(p, 'warn', 'Человек в транспорте');
    cuff(t, true);
    notify(t, 'warn', 'Офицер ' + nick(p) + ' надел на вас наручники');
    notify(p, 'ok', 'Наручники надеты');
});
mp.events.addCommand('uncuff', function (p, full) {
    if (!copOnly(p)) return;
    const t = find(full);
    if (!near(p, t, 3)) return notify(p, 'warn', '/uncuff [id] — подойдите ближе');
    cuff(t, false);
    notify(t, 'ok', 'С вас сняли наручники');
    notify(p, 'ok', 'Наручники сняты');
});
mp.events.addCommand('arrest', function (p, full) {
    if (!copOnly(p)) return;
    const t = find(full);
    if (!near(p, t, 4)) return notify(p, 'warn', '/arrest [id] — задержанный должен быть рядом');
    if (!t.getVariable('cuffed')) return notify(p, 'warn', 'Сначала наденьте наручники (/cuff)');
    const st = STATIONS.some(function (s) { return Math.hypot(p.position.x - s[0], p.position.y - s[1]) < 35; });
    if (!st) return notify(p, 'warn', 'Арестовать можно только у полицейского участка');
    const e = arrest(p, t);
    if (e) return notify(p, 'error', e);
    notify(p, 'ok', 'Задержанный отправлен в тюрьму');
    slog(p, 'arrest', nick(t));
});

mp.events.add('playerReady', function (p) { setTimeout(function () { if (mp.players.exists(p)) sync(p); }, 5000); });
mp.events.add('playerSpawn', function (p) { setTimeout(function () { if (mp.players.exists(p)) sync(p); }, 1500); });
mp.events.add('playerQuit', function (p) { if (p.getVariable && p.getVariable('cuffed') && get(p)) add(p, 1, 'уход от задержания', 'система'); });
setInterval(function () { mp.players.forEach(function (p) { if (sid(p) && p.getVariable('wanted') !== get(p)) sync(p); }); }, 5000);

global.WantedSystem = { get: get, set: set, add: add, cuff: cuff, arrest: arrest, pact: pact, MIN_PER_STAR: MIN_PER_STAR };
console.log('[wanted] розыск и наручники загружены');
