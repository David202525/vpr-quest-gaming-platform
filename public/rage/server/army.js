const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'army_data.json');
const TRUCKS = { barracks: 12, barracks3: 12 };
const GATE_MODELS = { gate: 'prop_gate_military_01', fence: 'prop_facgate_07b', bar: 'prop_sec_barrier_ld_01a', big: 'prop_facgate_01' };
const S = Object.assign({ intervalH: 168, count: 24, next: 0, left: 0, pile: [-2340.0, 3262.0, 32.8], gates: [], delivered: 0 },
    (function () { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch (e) { return {}; } })());
if (!S.next) S.next = Date.now() + 60000;
let dirty = false;
function save() { dirty = true; }
setInterval(function () { if (dirty) { dirty = false; try { fs.writeFileSync(FILE, JSON.stringify(S)); } catch (e) {} } }, 5000);

function GF() { return global.GovFaction; }
function isArmy(p) { return !!p.account && p.account.job === 'army'; }
function admLvl(p) { return global.AdminSystem && global.AdminSystem.realLvl ? global.AdminSystem.realLvl(p) : (global.AdminSystem && global.AdminSystem.lvl ? global.AdminSystem.lvl(p) : 0); }
function can(p, k) { const g = GF(); return !!(g && g.can(p, k)); }
function notify(p, type, text) { if (typeof global.hudNotify === 'function') global.hudNotify(p, type, text); else p.outputChatBox(text); }
function msg(p, t, c) { p.outputChatBox('!{' + (c || '#9bd36a') + '}[АРМИЯ] !{#ffffff}' + t); }
function V(x, y, z) { return new mp.Vector3(Number(x), Number(y), Number(z)); }
function money(n) { return '$' + String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function vmodel(v) { return v && mp.vehicles.exists(v) ? String(v.getVariable('govModel') || '') : ''; }
function permDeny(p, k) {
    const g = GF();
    const r = g ? g.F('army').perms[k] : 1;
    return 'Недоступно для вашего ранга (с ранга «' + require_rankName(r) + '», настраивает лидер)';
}
function require_rankName(r) { const g = GF(); return g && g.rankName ? g.rankName('army', r) : 'Ранг ' + r; }

/* ================= ЯЩИКИ ================= */
let crateObjs = [];
function drawPile() {
    crateObjs.forEach(function (o) { try { o.destroy(); } catch (e) {} });
    crateObjs = [];
    if (!S.pile) return;
    const n = Math.min(S.left, 30);
    for (let i = 0; i < n; i++) {
        const col = i % 4, row = Math.floor(i / 4) % 3, lay = Math.floor(i / 12);
        try { crateObjs.push(mp.objects.new(mp.joaat('prop_box_ammo04a'), V(S.pile[0] + col * 0.9 - 1.35, S.pile[1] + row * 0.7 - 0.7, S.pile[2] - 1 + lay * 0.55), { rotation: V(0, 0, 0), dimension: 0 })); } catch (e) {}
    }
}
function pub() { return JSON.stringify({ pile: S.pile, left: S.left, gates: S.gates.map(function (g, i) { return { i: i, x: g.x, y: g.y, z: g.z, h: g.h }; }) }); }
function sendAll() { const j = pub(); mp.players.forEach(function (p) { p.call('army:data', [j]); }); }
mp.events.add('playerReady', function (p) { setTimeout(function () { if (mp.players.exists(p)) p.call('army:data', [pub()]); }, 3500); });

function dropSupply(by) {
    if (!S.pile) { S.next = Date.now() + S.intervalH * 3600000; save(); return; }
    S.left = S.count;
    S.next = Date.now() + S.intervalH * 3600000;
    save(); drawPile(); sendAll();
    const g = GF(); if (g) g.flog('army', 'Прибыла поставка: ' + S.count + ' ящиков' + (by ? ' (досрочно, ' + by + ')' : ''));
    mp.players.forEach(function (p) { if (isArmy(p)) { notify(p, 'ok', '📦 На базу прибыла поставка: ' + S.count + ' ящиков. Грузите в Barracks!'); p.call('phone:gps', [S.pile[0], S.pile[1], 'Ящики поставки']); } });
}
setInterval(function () { if (Date.now() >= S.next) dropSupply(); }, 30000);

function setCarry(p, on) {
    p.armyCarry = !!on;
    p.setVariable('armyCarry', !!on);
    p.call('job:anim', [on ? 'box' : 'put', 700]);
}
function returnCrate(p) {
    if (!p.armyCarry) return;
    p.armyCarry = false;
    try { p.setVariable('armyCarry', false); p.call('job:anim', ['put', 500]); } catch (e) {}
    S.left++; save(); drawPile(); sendAll();
}
mp.events.add('playerQuit', function (p) { if (p.armyCarry) { p.armyCarry = false; S.left++; save(); drawPile(); sendAll(); } });
mp.events.add('playerDeath', function (p) { returnCrate(p); });
mp.events.add('playerEnterVehicle', function (p) { if (p.armyCarry) { returnCrate(p); notify(p, 'warn', 'Ящик вернулся на склад — с ним нельзя садиться в транспорт'); } });

mp.events.add('srv:army:pick', function (p) {
    if (!isArmy(p) || p.vehicle || !S.pile) return;
    if (Math.hypot(p.position.x - S.pile[0], p.position.y - S.pile[1]) > 5) return;
    if (!can(p, 'crates')) return notify(p, 'warn', permDeny(p, 'crates'));
    if (p.armyCarry) { returnCrate(p); return notify(p, 'ok', 'Ящик положен обратно'); }
    if (S.left <= 0) return notify(p, 'warn', 'Ящиков нет. Следующая поставка — ' + left(S.next));
    S.left--; save(); drawPile(); sendAll();
    setCarry(p, true);
    notify(p, 'ok', 'Ящик в руках. Отнесите к кузову армейского Barracks — E');
});
mp.events.add('srv:army:load', function (p, vid) {
    if (!p.armyCarry) return;
    const v = mp.vehicles.at(Number(vid));
    if (!v || !mp.vehicles.exists(v) || v.getVariable('gov') !== 'army') return notify(p, 'warn', 'Грузить можно только в армейский Barracks');
    const m = vmodel(v), cap = TRUCKS[m];
    if (!cap) return notify(p, 'warn', 'Ящики грузят только в Barracks или Barracks 3');
    if (v.position.subtract(p.position).length() > 8) return;
    const n = Number(v.getVariable('crates')) || 0;
    if (n >= cap) return notify(p, 'warn', 'Кузов полон (' + cap + ' ящиков)');
    v.setVariable('crates', n + 1);
    p.armyCarry = false; p.setVariable('armyCarry', false);
    p.call('job:anim', ['put', 700]);
    notify(p, 'ok', 'Ящик погружен: ' + (n + 1) + '/' + cap);
});
mp.events.add('srv:army:unload', function (p, vid) {
    if (!isArmy(p) || p.armyCarry || p.vehicle) return;
    const v = mp.vehicles.at(Number(vid));
    if (!v || !mp.vehicles.exists(v) || !TRUCKS[vmodel(v)] || v.position.subtract(p.position).length() > 8) return;
    const n = Number(v.getVariable('crates')) || 0;
    if (!n) return;
    if (!S.pile || Math.hypot(p.position.x - S.pile[0], p.position.y - S.pile[1]) > 40) return notify(p, 'warn', 'Разгружать обратно можно только у склада базы');
    v.setVariable('crates', n - 1);
    setCarry(p, true);
    notify(p, 'ok', 'Ящик снят с кузова (' + (n - 1) + ' осталось). Отнесите к штабелю — E');
});

mp.events.addCommand('supply', function (p) {
    if (!isArmy(p)) return notify(p, 'warn', 'Поставки выполняет только армия');
    const v = p.vehicle;
    if (!v || !TRUCKS[vmodel(v)]) return notify(p, 'warn', 'Сядьте за руль загруженного армейского Barracks');
    if (!can(p, 'deliver')) return notify(p, 'warn', permDeny(p, 'deliver'));
    const n = Number(v.getVariable('crates')) || 0;
    if (!n) return notify(p, 'warn', 'Кузов пуст. Загрузите ящики на базе');
    const g = GF();
    const to = g.POLICE.find(function (f) { const x = g.F(f); return x.points && Math.hypot(p.position.x - x.points.armory[0], p.position.y - x.points.armory[1]) < 60; });
    if (!to) return notify(p, 'warn', 'Подъедьте к складу LSPD, шерифа или FIB (не дальше 60 м)');
    const x = g.F(to);
    Object.keys(g.SUPPLY_PACK).forEach(function (k) { x.stock[k] = (x.stock[k] || 0) + Math.max(1, Math.round(g.SUPPLY_PACK[k] * n / 6)); });
    v.setVariable('crates', 0);
    g.mark();
    S.delivered += n; save();
    const NM = { lspd: 'LSPD', sheriff: 'Шериф', fib: 'FIB' };
    g.flog(to, 'Армия (' + g.nick(p) + ') доставила ' + n + ' ящиков снаряжения');
    g.flog('army', g.nick(p) + ' доставил ' + n + ' ящиков в ' + NM[to]);
    const pay = n * 400;
    if (global.MoneySystem) global.MoneySystem.addBank(p, pay);
    notify(p, 'ok', 'Доставлено ' + n + ' ящиков в ' + NM[to] + '. Премия ' + money(pay) + ' на счёт');
    mp.players.forEach(function (o) { if (o.account && o.account.job === to) notify(o, 'ok', 'Армия доставила ' + n + ' ящиков снаряжения на склад'); });
});

function left(t) {
    const ms = t - Date.now();
    if (ms <= 0) return 'скоро';
    const h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000);
    return h >= 24 ? 'через ' + Math.floor(h / 24) + ' д ' + (h % 24) + ' ч' : 'через ' + h + ' ч ' + m + ' мин';
}

mp.events.addCommand('armysupply', function (p, full) {
    if (admLvl(p) < 5) return notify(p, 'error', 'Доступно с 5 уровня администрации');
    const a = String(full || '').trim().split(/\s+/);
    if (a[0] === 'now') { dropSupply(p.account ? p.account.login : 'admin'); return msg(p, 'Поставка запущена досрочно. Следующая — ' + left(S.next)); }
    if (a[0] === 'interval') {
        const h = Number(a[1]);
        if (!(h >= 1 && h <= 720)) return msg(p, '/armysupply interval [часы 1-720] — сейчас ' + S.intervalH + ' ч');
        S.intervalH = h; S.next = Date.now() + h * 3600000; save();
        return msg(p, 'Интервал поставок: ' + h + ' ч. Следующая — ' + left(S.next));
    }
    if (a[0] === 'count') {
        const n = Math.floor(Number(a[1]));
        if (!(n >= 1 && n <= 60)) return msg(p, '/armysupply count [1-60] — сейчас ' + S.count);
        S.count = n; save();
        return msg(p, 'Ящиков в поставке: ' + n);
    }
    if (a[0] === 'here') { S.pile = [p.position.x, p.position.y, p.position.z]; save(); drawPile(); sendAll(); return msg(p, 'Место появления ящиков перенесено сюда'); }
    if (a[0] === 'clear') { S.left = 0; save(); drawPile(); sendAll(); return msg(p, 'Ящики убраны'); }
    if (a[0] === 'del' || a[0] === 'off') { S.left = 0; S.pile = null; save(); drawPile(); sendAll(); return msg(p, 'Точка поставок удалена, поставки отключены. Поставить заново: /armysupply here'); }
    if (!S.pile) return msg(p, 'Поставки отключены (точки нет). Поставить точку там, где стоите: /armysupply here');
    msg(p, 'Ящиков сейчас: ' + S.left + ' · в поставке: ' + S.count + ' · интервал: ' + S.intervalH + ' ч · следующая: ' + left(S.next));
    msg(p, '/armysupply now · interval [ч] · count [шт] · here — перенести сюда · clear — убрать ящики · del — удалить точку');
});

/* ================= ВОРОТА ================= */
const gateObjs = [];
function spawnGate(i) {
    const g = S.gates[i];
    try { if (gateObjs[i]) gateObjs[i].destroy(); } catch (e) {}
    try {
        const o = mp.objects.new(mp.joaat(g.m), V(g.x, g.y, g.z), { rotation: V(0, 0, g.h), dimension: 0 });
        o.setVariable('armyGate', i + 1);
        o.gOpen = false;
        gateObjs[i] = o;
    } catch (e) { console.log('[army] gate: ' + e.message); }
}
function respawnGates() { gateObjs.forEach(function (o) { try { o.destroy(); } catch (e) {} }); gateObjs.length = 0; S.gates.forEach(function (g, i) { spawnGate(i); }); }
respawnGates();

function slide(o, g, open, cb) {
    const r = g.h * Math.PI / 180, dx = Math.cos(r), dy = Math.sin(r);
    const dist = g.slide || 7.5;
    let k = 0;
    const t = setInterval(function () {
        k++;
        const f = open ? k / 15 : 1 - k / 15;
        try { o.position = V(g.x + dx * dist * f, g.y + dy * dist * f, g.z); } catch (e) { clearInterval(t); return; }
        if (k >= 15) { clearInterval(t); if (cb) cb(); }
    }, 100);
}
function blocked(g) {
    let b = false;
    mp.players.forEach(function (p) { const e = p.vehicle || p; if (Math.hypot(e.position.x - g.x, e.position.y - g.y) < 6) b = true; });
    return b;
}
function openGate(p, i) {
    const g = S.gates[i], o = gateObjs[i];
    if (!g || !o) return;
    if (!(isArmy(p) && can(p, 'gate')) && admLvl(p) < 2) return notify(p, 'error', isArmy(p) ? permDeny(p, 'gate') : 'Ворота открываются только сотрудниками армии');
    if (o.gOpen || o.busy) return;
    o.busy = true;
    slide(o, g, true, function () {
        o.busy = false; o.gOpen = true;
        const tryClose = function () {
            if (!mp.objects.exists(o)) return;
            if (blocked(g)) return setTimeout(tryClose, 2000);
            o.busy = true;
            slide(o, g, false, function () { o.busy = false; o.gOpen = false; });
        };
        setTimeout(tryClose, 9000);
    });
    notify(p, 'ok', 'Ворота открываются');
}
function nearestGate(p, r) {
    let best = -1, bd = r || 12;
    S.gates.forEach(function (g, i) { const d = Math.hypot(p.position.x - g.x, p.position.y - g.y); if (d < bd) { bd = d; best = i; } });
    return best;
}
mp.events.add('srv:army:gate', function (p) { const i = nearestGate(p, 14); if (i >= 0) openGate(p, i); });
mp.events.addCommand('gate', function (p) {
    const i = nearestGate(p, 14);
    if (i < 0) return notify(p, 'warn', 'Рядом нет ворот');
    openGate(p, i);
});
mp.events.addCommand('armygate', function (p, full) {
    if (admLvl(p) < 5) return notify(p, 'error', 'Доступно с 5 уровня администрации');
    const a = String(full || '').trim().split(/\s+/);
    if (a[0] === 'add') {
        const m = GATE_MODELS[a[1]] || GATE_MODELS.gate;
        const r = p.heading * Math.PI / 180;
        S.gates.push({ m: m, x: p.position.x - Math.sin(r) * 3, y: p.position.y + Math.cos(r) * 3, z: p.position.z - 1, h: (p.heading + 90) % 360, slide: Number(a[2]) || 7.5 });
        save(); spawnGate(S.gates.length - 1); sendAll();
        return msg(p, 'Ворота №' + S.gates.length + ' поставлены в 3 м перед вами. Повернуть: /armygate rot ' + S.gates.length + ' [градусы]');
    }
    if (a[0] === 'rot' || a[0] === 'move' || a[0] === 'dist') {
        const i = Number(a[1]) - 1, g = S.gates[i];
        if (!g) return msg(p, 'Нет ворот с таким номером');
        if (a[0] === 'rot') g.h = (Number(a[2]) || 0) % 360;
        if (a[0] === 'move') { g.x = p.position.x; g.y = p.position.y; g.z = p.position.z - 1; }
        if (a[0] === 'dist') g.slide = Math.max(2, Math.min(20, Number(a[2]) || 7.5));
        save(); spawnGate(i); sendAll();
        return msg(p, 'Ворота №' + (i + 1) + ' обновлены');
    }
    if (a[0] === 'clear') { S.gates = []; save(); respawnGates(); sendAll(); return msg(p, 'Все ворота армии удалены'); }
    if (a[0] === 'del') {
        const i = a[1] ? Number(a[1]) - 1 : nearestGate(p, 30);
        if (!S.gates[i]) return msg(p, a[1] ? 'Нет ворот с таким номером' : 'Рядом (30 м) нет ворот. Номера: /armygate list');
        S.gates.splice(i, 1); save(); respawnGates(); sendAll();
        return msg(p, 'Ворота удалены');
    }
    if (a[0] === 'list') return S.gates.forEach(function (g, i) { msg(p, (i + 1) + '. ' + g.m + ' (' + g.x.toFixed(0) + ', ' + g.y.toFixed(0) + ') · угол ' + g.h.toFixed(0) + ' · ход ' + (g.slide || 7.5) + ' м'); });
    if (a[0] === 'list' || !S.gates.length) { if (!S.gates.length) return msg(p, 'Ворот нет. /armygate add [gate/fence/bar/big]'); }
    msg(p, '/armygate add [gate/fence/bar/big] [ход м] · rot [№] [угол] · move [№] · dist [№] [м] · del — ближайшие · del [№] · clear — все · list');
});

global.ArmySystem = {
    info: function () { return { left: S.left, count: S.count, next: S.next, intervalH: S.intervalH, delivered: S.delivered, gates: S.gates.length, trucks: mp.vehicles.toArray().filter(function (v) { return TRUCKS[vmodel(v)] && v.getVariable('gov') === 'army'; }).map(function (v) { return { m: vmodel(v), c: Number(v.getVariable('crates')) || 0, cap: TRUCKS[vmodel(v)] }; }) }; }
};
drawPile();
console.log('[army] поставки: ящиков ' + S.left + ', интервал ' + S.intervalH + ' ч, ворот ' + S.gates.length);
