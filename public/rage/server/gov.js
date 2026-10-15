const fs = require('fs');
const path = require('path');
let db = null;
try { db = require('../database'); } catch (e) { try { db = require('./database'); } catch (e2) { db = null; } }

const FILE = path.join(__dirname, 'gov_data.json');
const G = Object.assign({ fac: {}, fines: [], seq: 1, records: {}, notes: {} }, (function () { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch (e) { return {}; } })());
let dirty = false;
setInterval(function () { if (dirty) { dirty = false; try { fs.writeFileSync(FILE, JSON.stringify(G)); } catch (e) {} } }, 5000);
function mark() { dirty = true; }

const POLICE = ['lspd', 'sheriff', 'fib'];
const NAMES = { lspd: 'LSPD', sheriff: 'Шериф', fib: 'FIB', army: 'Армия', gov: 'Правительство', news: 'Weazel News', medic: 'EMS', ems: 'EMS' };
const DEF_RANKS = {
    lspd: ['Кадет', 'Офицер I', 'Офицер II', 'Офицер III', 'Сержант I', 'Сержант II', 'Лейтенант', 'Капитан', 'Заместитель шефа', 'Шеф полиции'],
    sheriff: ['Кадет', 'Помощник шерифа', 'Старший помощник', 'Капрал', 'Сержант', 'Лейтенант', 'Капитан', 'Майор', 'Заместитель шерифа', 'Шериф'],
    fib: ['Стажёр', 'Агент', 'Специальный агент', 'Старший агент', 'Инспектор', 'Старший инспектор', 'Руководитель отдела', 'Заместитель директора', 'Первый заместитель', 'Директор FIB'],
    army: ['Рядовой', 'Ефрейтор', 'Младший сержант', 'Сержант', 'Старшина', 'Лейтенант', 'Капитан', 'Майор', 'Полковник', 'Генерал'],
    gov: ['Стажёр', 'Секретарь', 'Юрист', 'Адвокат', 'Прокурор', 'Судья', 'Министр', 'Вице-губернатор', 'Заместитель губернатора', 'Губернатор'],
    news: ['Стажёр', 'Курьер', 'Оператор', 'Репортёр', 'Журналист', 'Ведущий', 'Редактор', 'Главный редактор', 'Заместитель директора', 'Директор']
};

const ARMORY_ITEMS = {
    cuffs: { n: 'Наручники', i: '⛓️', ammo: 0, r: 1 },
    g_stungun: { n: 'Тайзер', i: '⚡', r: 1 },
    g_pistol: { n: 'Пистолет', i: '🔫', r: 2 },
    g_carbine: { n: 'Автомат', i: '🔫', r: 5 },
    ammo_pistol: { n: 'Патроны 9 мм (x30)', i: '🟡', pack: 30, r: 2 },
    ammo_rifle: { n: 'Патроны 5,56 (x60)', i: '🔴', pack: 60, r: 5 },
    g_armour: { n: 'Бронежилет', i: '🦺', r: 1 }
};
const SUPPLY_PACK = { g_stungun: 10, g_pistol: 10, g_carbine: 5, ammo_pistol: 30, ammo_rifle: 20, g_armour: 15, cuffs: 20 };
const GOV_KEYS = Object.keys(ARMORY_ITEMS).filter(function (k) { return k.indexOf('ammo_') !== 0; }).concat(['ammo_pistol', 'ammo_rifle']);

const UNIFORMS = {
    m: [
        { n: 'Патрульная форма', c: { 11: [55, 0], 8: [58, 0], 3: [0, 0], 4: [35, 0], 6: [25, 0] }, p: {} },
        { n: 'Форма с курткой', c: { 11: [53, 0], 8: [58, 0], 3: [0, 0], 4: [35, 0], 6: [25, 0] }, p: {} },
        { n: 'Тактическая (SWAT)', c: { 11: [49, 0], 8: [15, 0], 3: [17, 0], 4: [31, 0], 6: [25, 0], 9: [16, 0] }, p: { 0: [39, 0] } },
        { n: 'Парадная', c: { 11: [118, 0], 8: [58, 0], 3: [4, 0], 4: [25, 0], 6: [10, 0] }, p: { 0: [46, 0] } }
    ],
    f: [
        { n: 'Патрульная форма', c: { 11: [48, 0], 8: [35, 0], 3: [14, 0], 4: [34, 0], 6: [25, 0] }, p: {} },
        { n: 'Форма с курткой', c: { 11: [43, 0], 8: [35, 0], 3: [14, 0], 4: [34, 0], 6: [25, 0] }, p: {} },
        { n: 'Тактическая (SWAT)', c: { 11: [42, 0], 8: [14, 0], 3: [18, 0], 4: [30, 0], 6: [25, 0], 9: [18, 0] }, p: { 0: [38, 0] } },
        { n: 'Парадная', c: { 11: [111, 0], 8: [35, 0], 3: [3, 0], 4: [34, 0], 6: [29, 0] }, p: { 0: [45, 0] } }
    ]
};

const DEF_POINTS = {
    lspd: { armory: [452.1, -980.1, 30.69], locker: [458.2, -992.9, 30.69], garage: [454.6, -1017.4, 28.4], spawns: [[446.0, -1025.0, 28.6, 2], [442.4, -1025.6, 28.7, 2], [438.6, -1026.0, 28.8, 2], [434.9, -1026.5, 28.9, 2], [431.2, -1027.0, 29.0, 2]] },
    sheriff: { armory: [1851.1, 3690.0, 34.27], locker: [1849.2, 3694.5, 34.27], garage: [1866.0, 3695.0, 33.9], spawns: [[1870.0, 3700.0, 33.6, 210], [1873.0, 3703.0, 33.6, 210]] },
    fib: { armory: [118.9, -729.3, 242.15], locker: [121.5, -733.8, 242.15], garage: [130.0, -712.0, 33.1], spawns: [[136.0, -705.0, 33.1, 160], [140.0, -707.0, 33.1, 160]] },
    army: { armory: [-2350.0, 3270.0, 32.8], locker: [-2347.0, 3264.0, 32.8], garage: [-2400.0, 3300.0, 32.8], spawns: [[-2405.0, 3310.0, 32.8, 240], [-2410.0, 3316.0, 32.8, 240]] }
};
const DEF_FLEET = {
    lspd: [['police', 1], ['police2', 2], ['police3', 3], ['policeb', 3], ['police4', 6], ['policet', 4], ['riot', 7], ['polmav', 8]],
    sheriff: [['sheriff', 1], ['sheriff2', 3], ['policeb', 3], ['riot', 7]],
    fib: [['fbi', 1], ['fbi2', 3], ['riot', 6]],
    army: [['mesa3', 1], ['crusader', 2], ['barracks', 4], ['insurgent', 6]]
};

function F(f) {
    if (!G.fac[f]) G.fac[f] = {};
    const x = G.fac[f];
    if (!x.ranks) x.ranks = (DEF_RANKS[f] || DEF_RANKS.lspd).slice();
    if (!x.deps) x.deps = [];
    if (!x.squads) x.squads = [];
    if (!x.stock) x.stock = {};
    if (!x.points) x.points = DEF_POINTS[f] ? JSON.parse(JSON.stringify(DEF_POINTS[f])) : null;
    if (!x.log) x.log = [];
    return x;
}

function acc(p) { return p.account || null; }
function sid(p) { const a = acc(p); return a && a.id ? Number(a.id) : 0; }
function nick(p) { const a = acc(p); return String((a && a.nick) || p.name).replace(/_/g, ' '); }
function fac(p) { const a = acc(p); return a && a.job ? String(a.job) : ''; }
function rank(p) { const a = acc(p); if (!a) return 0; if (Number(a.leader) === 1) return 99; return Number(a.job_rank) || 0; }
function isLeader(p) { const a = acc(p); return !!(a && (Number(a.leader) === 1 || Number(a.job_rank) >= 10)); }
function isDep(p) { const f = fac(p); return !!f && F(f).deps.indexOf(sid(p)) >= 0; }
function canManage(p) { return isLeader(p) || isDep(p); }
function admLvl(p) { return global.AdminSystem && global.AdminSystem.realLvl ? global.AdminSystem.realLvl(p) : 0; }
function isGovF(f) { return !!DEF_RANKS[f]; }
function isPolice(p) { return POLICE.indexOf(fac(p)) >= 0; }
function notify(p, type, text) { if (typeof global.hudNotify === 'function') global.hudNotify(p, type, text); else p.outputChatBox(text); }
function V(x, y, z) { return new mp.Vector3(Number(x), Number(y), Number(z)); }
function near(p, pt, r) { return pt && Math.hypot(p.position.x - pt[0], p.position.y - pt[1]) <= (r || 2.5) && Math.abs(p.position.z - pt[2]) < 4 && p.dimension === 0; }
function online(id) { return mp.players.toArray().find(function (x) { return sid(x) === Number(id); }) || null; }
function U() { return global.UiSystem; }
function rankName(f, r) { const R = F(f).ranks; return R[Math.max(0, Math.min(R.length, r) - 1)] || ('Ранг ' + r); }
function flog(f, text) { const x = F(f); x.log.unshift({ t: Date.now(), x: text }); if (x.log.length > 120) x.log.length = 120; mark(); }
function money(n) { return '$' + String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
async function q(sql, args) { if (!db) return []; try { const r = await db.query(sql, args || []); return Array.isArray(r) && Array.isArray(r[0]) ? r[0] : r; } catch (e) { console.log('[gov] db: ' + e.message); return []; } }

/* ================= СКЛАД ================= */
function armoryOpen(p) {
    const f = fac(p), x = F(f);
    p.call('gov:menu', [JSON.stringify({
        t: 'armory', f: NAMES[f] || f, rank: rank(p),
        items: Object.keys(ARMORY_ITEMS).map(function (k) { const a = ARMORY_ITEMS[k]; return { k: k, n: a.n, i: a.i, r: a.r, left: x.stock[k] || 0, has: U() ? U().countItem(p, k) : 0 }; })
    })]);
}
mp.events.add('srv:gov:take', function (p, k) {
    const f = fac(p), x = F(f), a = ARMORY_ITEMS[k];
    if (!a || !x.points || !near(p, x.points.armory, 3)) return;
    if (rank(p) < a.r) return notify(p, 'warn', 'Доступно с ранга «' + rankName(f, a.r) + '»');
    if ((x.stock[k] || 0) <= 0) return notify(p, 'error', 'На складе закончилось: ' + a.n + '. Ждите поставку от армии');
    const u = U(); if (!u) return;
    if (k.indexOf('ammo_') !== 0 && u.countItem(p, k) > 0) return notify(p, 'warn', 'У вас уже есть ' + a.n);
    x.stock[k]--;
    u.addItem(p, k, a.pack || 1);
    mark();
    notify(p, 'ok', 'Получено: ' + a.n);
    armoryOpen(p);
});
mp.events.add('srv:gov:return', function (p) {
    const f = fac(p), x = F(f);
    if (!x.points || !near(p, x.points.armory, 3)) return;
    const u = U(); if (!u) return;
    let back = 0;
    Object.keys(ARMORY_ITEMS).forEach(function (k) {
        const n = u.govStrip(p, [k]);
        if (!n) return;
        const a = ARMORY_ITEMS[k];
        x.stock[k] = (x.stock[k] || 0) + (a.pack ? Math.floor(n / a.pack) : n);
        back += n;
    });
    mark();
    notify(p, back ? 'ok' : 'warn', back ? 'Снаряжение сдано на склад' : 'Нечего сдавать');
    armoryOpen(p);
});

/* поставки армии */
let supplyVeh = {};
function supplyLoad(p) {
    if (fac(p) !== 'army') return;
    const x = F('army');
    if (!x.points || !near(p, x.points.armory, 6)) return notify(p, 'warn', 'Загрузка у склада армии');
    const v = p.vehicle;
    if (!v || ['barracks', 'mesa3', 'crusader', 'insurgent'].indexOf(v.getVariable('govModel') || '') < 0) return notify(p, 'warn', 'Подъедьте на армейском грузовике (Barracks/Mesa/Crusader)');
    if (v.getVariable('supply')) return notify(p, 'warn', 'Грузовик уже загружен');
    v.setVariable('supply', 1);
    supplyVeh[v.id] = sid(p);
    notify(p, 'ok', 'Груз оружия загружен. Доставьте на склад LSPD, шерифа или FIB и введите /supply');
}
mp.events.addCommand('supply', function (p) {
    if (fac(p) !== 'army') return notify(p, 'warn', 'Поставки выполняет только армия');
    const v = p.vehicle;
    if (!v) {
        const x = F('army');
        if (x.points && near(p, x.points.armory, 6)) return notify(p, 'warn', 'Сядьте в армейский грузовик и введите /supply для загрузки');
        return notify(p, 'warn', 'Сядьте в армейский грузовик');
    }
    if (!v.getVariable('supply')) return supplyLoad(p);
    const to = POLICE.find(function (f) { const x = F(f); return x.points && Math.hypot(p.position.x - x.points.armory[0], p.position.y - x.points.armory[1]) < 60; });
    if (!to) return notify(p, 'warn', 'Подъедьте к складу LSPD, шерифа или FIB (не дальше 60 м)');
    const x = F(to);
    Object.keys(SUPPLY_PACK).forEach(function (k) { x.stock[k] = (x.stock[k] || 0) + SUPPLY_PACK[k]; });
    v.setVariable('supply', 0);
    delete supplyVeh[v.id];
    mark();
    flog(to, 'Армия (' + nick(p) + ') доставила поставку оружия');
    const pay = 4000;
    if (global.MoneySystem) global.MoneySystem.addBank(p, pay);
    notify(p, 'ok', 'Поставка доставлена в ' + NAMES[to] + '. Премия ' + money(pay) + ' на счёт');
    mp.players.forEach(function (o) { if (fac(o) === to) notify(o, 'ok', 'Армия доставила поставку оружия на склад'); });
});

/* ================= РАЗДЕВАЛКА ================= */
function female(p) { return p.model === mp.joaat('mp_f_freemode_01'); }
function lockerOpen(p) {
    const list = UNIFORMS[female(p) ? 'f' : 'm'];
    p.call('gov:menu', [JSON.stringify({ t: 'locker', f: NAMES[fac(p)], on: !!p.getVariable('duty'), list: list.map(function (u, i) { return { i: i, n: u.n }; }) })]);
}
function setDuty(p, on, idx) {
    p.setVariable('duty', !!on);
    if (on) {
        const u = UNIFORMS[female(p) ? 'f' : 'm'][idx || 0];
        if (!u) return;
        Object.keys(u.c).forEach(function (c) { try { p.setClothes(Number(c), u.c[c][0], u.c[c][1], 0); } catch (e) {} });
        Object.keys(u.p).forEach(function (c) { try { p.setProp(Number(c), u.p[c][0], u.p[c][1]); } catch (e) {} });
    } else {
        try { p.setClothes(9, 0, 0, 0); p.setProp(0, -1, 0); p.call('inv:clearProp', [0]); } catch (e) {}
        if (U() && U().redress) U().redress(p);
    }
}
mp.events.add('srv:gov:uniform', function (p, i) {
    const x = F(fac(p));
    if (!x.points || !near(p, x.points.locker, 3)) return;
    i = Number(i);
    if (i < 0) { setDuty(p, false); notify(p, 'ok', 'Вы переоделись в гражданское. Смена окончена'); }
    else { setDuty(p, true, i); notify(p, 'ok', 'Вы на смене. Форма надета'); }
    lockerOpen(p);
});

/* ================= АВТОПАРК ================= */
const fleetCars = {};
function fleetOf(f) {
    const C = global.FactionCfg;
    const list = C && C.fleet(f) && C.fleet(f).length ? C.fleet(f).map(function (c) { return [c.m, c.r || 1, c.on !== false]; }) : (DEF_FLEET[f] || []).map(function (c) { return [c[0], c[1], true]; });
    return list.filter(function (c) { return c[2]; });
}
function garageOpen(p) {
    const f = fac(p);
    const mine = fleetCars[sid(p)];
    p.call('gov:menu', [JSON.stringify({ t: 'garage', f: NAMES[f], rank: rank(p), out: mine && mp.vehicles.exists(mine) ? mine.getVariable('govModel') : null,
        list: fleetOf(f).map(function (c) { return { m: c[0], r: c[1], rn: rankName(f, c[1]) }; }) })]);
}
mp.events.add('srv:gov:car', function (p, m) {
    const f = fac(p), x = F(f);
    if (!x.points || !near(p, x.points.garage, 3)) return;
    const s = sid(p);
    if (m === '__back') {
        const v = fleetCars[s];
        if (v && mp.vehicles.exists(v)) { if (v.position.subtract(p.position).length() > 40) return notify(p, 'warn', 'Пригоните машину к гаражу'); v.destroy(); }
        delete fleetCars[s];
        notify(p, 'ok', 'Служебный транспорт сдан');
        return garageOpen(p);
    }
    const c = fleetOf(f).find(function (z) { return z[0] === m; });
    if (!c) return;
    if (rank(p) < c[1]) return notify(p, 'warn', 'Доступно с ранга «' + rankName(f, c[1]) + '»');
    if (fleetCars[s] && mp.vehicles.exists(fleetCars[s])) return notify(p, 'warn', 'Сначала сдайте прошлую машину');
    const sp = (x.points.spawns || []).find(function (z) { return !mp.vehicles.toArray().some(function (v) { return v.dimension === 0 && Math.hypot(v.position.x - z[0], v.position.y - z[1]) < 3; }); });
    if (!sp) return notify(p, 'warn', 'Все парковочные места заняты');
    const v = mp.vehicles.new(mp.joaat(m), V(sp[0], sp[1], sp[2]), { heading: sp[3] || 0, numberPlate: (NAMES[f] || 'GOV').slice(0, 4).toUpperCase() + String(s).padStart(4, '0'), dimension: 0, locked: false, engine: false });
    v.setVariable('faction', f); v.setVariable('gov', f); v.setVariable('govModel', m); v.setVariable('govOwner', s);
    try { v.setColor(f === 'fib' ? 0 : 111, f === 'fib' ? 0 : 0); } catch (e) {}
    v.adminSpawned = false;
    fleetCars[s] = v;
    p.call('phone:gps', [sp[0], sp[1], 'Служебная машина']);
    notify(p, 'ok', 'Машина ждёт на парковке — метка на карте');
    p.call('house:menuClose');
});
mp.events.add('playerEnterVehicle', function (p, v, seat) {
    const f = v.getVariable('gov');
    if (!f || !isGovF(f) || seat !== 0 && seat !== -1) return;
    if (fac(p) !== f && admLvl(p) < 1) { try { p.removeFromVehicle(); } catch (e) {} notify(p, 'error', 'Служебный транспорт ' + (NAMES[f] || f)); }
});
mp.events.add('playerQuit', function (p) {
    const v = fleetCars[sid(p)];
    if (v && mp.vehicles.exists(v)) setTimeout(function () { if (mp.vehicles.exists(v) && !(v.getOccupants && v.getOccupants().length)) v.destroy(); }, 60000);
});

/* ================= ТОЧКИ ВЗАИМОДЕЙСТВИЯ ================= */
function points() {
    const out = [];
    Object.keys(DEF_RANKS).forEach(function (f) {
        const x = F(f);
        if (!x.points) return;
        ['armory', 'locker', 'garage'].forEach(function (k) { const pt = x.points[k]; if (pt) out.push([f, k, pt[0], pt[1], pt[2]]); });
    });
    return out;
}
function sendPoints(p) { p.call('gov:points', [JSON.stringify(points())]); }
mp.events.add('srv:gov:point', function (p, f, k) {
    if (fac(p) !== f || p.vehicle) return;
    const x = F(f);
    if (!x.points || !near(p, x.points[k], 3)) return;
    if (k === 'armory') { if (f === 'army') return notify(p, 'ok', 'Склад армии: подгоните армейский грузовик сюда и введите /supply — загрузка. Доставка на склад LSPD/шерифа/FIB — снова /supply'); return armoryOpen(p); }
    if (k === 'locker') return lockerOpen(p);
    if (k === 'garage') return garageOpen(p);
});
mp.events.addCommand('govpoint', function (p, full) {
    if (admLvl(p) < 7) return;
    const a = String(full || '').trim().split(/\s+/);
    const f = a[0], k = a[1];
    if (!DEF_RANKS[f] || ['armory', 'locker', 'garage', 'spawn', 'clearspawns'].indexOf(k) < 0) return p.outputChatBox('!{#ffcc66}/govpoint [' + Object.keys(DEF_RANKS).join('/') + '] [armory/locker/garage/spawn/clearspawns]');
    const x = F(f);
    if (!x.points) x.points = { spawns: [] };
    const pos = [p.position.x, p.position.y, p.position.z];
    if (k === 'spawn') { x.points.spawns.push([pos[0], pos[1], pos[2], p.heading || 0]); }
    else if (k === 'clearspawns') x.points.spawns = [];
    else x.points[k] = pos;
    mark();
    mp.players.forEach(sendPoints);
    p.outputChatBox('!{#8fd14f}Точка ' + k + ' для ' + f + ' сохранена');
});
mp.events.addCommand('govstock', function (p, full) {
    if (admLvl(p) < 6) return;
    const a = String(full || '').trim().split(/\s+/);
    if (!DEF_RANKS[a[0]]) return p.outputChatBox('!{#ffcc66}/govstock [фракция] — пополнить склад стандартной поставкой');
    const x = F(a[0]);
    Object.keys(SUPPLY_PACK).forEach(function (k) { x.stock[k] = (x.stock[k] || 0) + SUPPLY_PACK[k]; });
    mark();
    flog(a[0], 'Администрация пополнила склад');
    p.outputChatBox('!{#8fd14f}Склад ' + a[0] + ' пополнен');
});

/* ================= ПЛАНШЕТ ================= */
async function members(f) {
    const rows = await q('SELECT id, nick, login, job_rank, leader, last_login FROM accounts WHERE job = ? ORDER BY job_rank DESC LIMIT 200', [f]);
    const x = F(f);
    return rows.map(function (r) {
        const o = online(r.id);
        const sq = x.squads.find(function (s) { return s.m.indexOf(Number(r.id)) >= 0; });
        return { id: Number(r.id), n: String(r.nick || r.login || '#' + r.id).replace(/_/g, ' '), r: Number(r.job_rank) || 1, rn: Number(r.leader) === 1 ? x.ranks[x.ranks.length - 1] : rankName(f, Number(r.job_rank) || 1), lead: Number(r.leader) === 1, dep: x.deps.indexOf(Number(r.id)) >= 0,
            on: !!o, pid: o ? o.id : -1, duty: o ? !!o.getVariable('duty') : false, sq: sq ? sq.n : '', last: r.last_login ? new Date(r.last_login).getTime() : 0 };
    });
}
function finesOf(id) { return G.fines.filter(function (x) { return x.s === Number(id) && !x.paid; }); }
async function tabletData(p) {
    const f = fac(p), x = F(f);
    const pol = isPolice(p);
    const W = global.WantedSystem;
    const mem = await members(f);
    const out = {
        f: f, fn: NAMES[f] || f, me: { id: sid(p), n: nick(p), r: rank(p), rn: isLeader(p) ? x.ranks[x.ranks.length - 1] : rankName(f, rank(p)), lead: isLeader(p), dep: isDep(p), manage: canManage(p) },
        ranks: x.ranks, squads: x.squads.map(function (s, i) { return { i: i, n: s.n, lead: s.l, m: s.m, minR: s.r || 1 }; }),
        members: mem, stock: Object.keys(ARMORY_ITEMS).map(function (k) { return { n: ARMORY_ITEMS[k].n, c: x.stock[k] || 0 }; }), log: x.log.slice(0, 40), police: pol
    };
    if (pol && W) {
        const wl = W.list();
        const ids = wl.map(function (w) { return w.s; });
        const nm = ids.length ? await q('SELECT id, nick, login FROM accounts WHERE id IN (' + ids.map(Number).join(',') + ')') : [];
        out.wanted = wl.map(function (w) {
            const r = nm.find(function (z) { return Number(z.id) === w.s; });
            const o = online(w.s);
            return { s: w.s, n: r ? String(r.nick || r.login).replace(/_/g, ' ') : '#' + w.s, stars: w.stars, r: w.r, by: w.by, d: w.d, on: !!o, pid: o ? o.id : -1, fines: finesOf(w.s).length };
        }).sort(function (a, b) { return b.stars - a.stars; });
        out.fines = G.fines.filter(function (z) { return !z.paid; }).slice(-60).reverse();
    }
    return out;
}
async function sendTablet(p) {
    const d = await tabletData(p);
    if (mp.players.exists(p)) p.call('gov:tablet', [JSON.stringify(d)]);
}
mp.events.add('srv:tab:open', function (p) {
    if (!isGovF(fac(p))) return notify(p, 'warn', 'Планшет доступен только сотрудникам гос. структур');
    sendTablet(p);
});
mp.events.addCommand('tablet', function (p) { mp.events.call('srv:tab:open', p); });

function tabErr(p, t) { p.call('gov:tabToast', [t, 0]); }
mp.events.add('srv:tab:act', async function (p, json) {
    let d; try { d = JSON.parse(json); } catch (e) { return; }
    const f = fac(p);
    if (!isGovF(f)) return;
    const x = F(f);
    const a = d.a;
    const mgr = canManage(p);
    const done = function (t) { if (t) p.call('gov:tabToast', [t, 1]); sendTablet(p); };

    if (['rankup', 'rankdown', 'fire', 'dep', 'invite', 'rname', 'radd', 'rdel', 'sqadd', 'sqdel', 'sqjoin', 'sqkick', 'sqlead', 'sqren'].indexOf(a) >= 0 && !mgr) return tabErr(p, 'Только лидер или заместитель');

    if (a === 'invite') {
        const t = mp.players.at(Number(d.id));
        if (!t || !mp.players.exists(t) || !t.account) return tabErr(p, 'Игрок не найден');
        if (t.position.subtract(p.position).length() > 5) return tabErr(p, 'Игрок должен стоять рядом');
        if (t.account.job) return tabErr(p, 'Игрок уже состоит в организации');
        t.inviteGov = { f: f, by: sid(p), at: Date.now() };
        t.call('social:offer', [nick(p) + ' приглашает вас в ' + (NAMES[f] || f) + '. /accept — принять', 20000]);
        notify(t, 'warn', 'Приглашение в ' + (NAMES[f] || f) + '. Введите /accept чтобы принять');
        return done('Приглашение отправлено');
    }
    if (['rankup', 'rankdown', 'fire', 'dep'].indexOf(a) >= 0) {
        const id = Number(d.id);
        const rows = await q('SELECT id, nick, login, job, job_rank, leader FROM accounts WHERE id = ? LIMIT 1', [id]);
        const r = rows[0];
        if (!r || r.job !== f) return tabErr(p, 'Сотрудник не найден');
        if (id === sid(p)) return tabErr(p, 'Нельзя изменить самого себя');
        if (Number(r.leader) === 1) return tabErr(p, 'Нельзя изменить лидера');
        const tr = Number(r.job_rank) || 1, myR = rank(p);
        if (!isLeader(p) && (tr >= myR || x.deps.indexOf(id) >= 0)) return tabErr(p, 'Нельзя управлять равным или старшим по рангу');
        const name = String(r.nick || r.login).replace(/_/g, ' ');
        const t = online(id);
        if (a === 'dep') {
            if (!isLeader(p)) return tabErr(p, 'Заместителей назначает только лидер');
            const i = x.deps.indexOf(id);
            if (i >= 0) x.deps.splice(i, 1); else { if (x.deps.length >= 3) return tabErr(p, 'Максимум 3 заместителя'); x.deps.push(id); }
            mark(); flog(f, nick(p) + (i >= 0 ? ' снял заместителя ' : ' назначил заместителем ') + name);
            if (t) notify(t, 'ok', i >= 0 ? 'Вы больше не заместитель' : 'Вы назначены заместителем лидера');
            return done(i >= 0 ? 'Заместитель снят' : 'Заместитель назначен');
        }
        if (a === 'fire') {
            await q('UPDATE accounts SET job = NULL, job_rank = 0 WHERE id = ?', [id]);
            const di = x.deps.indexOf(id); if (di >= 0) x.deps.splice(di, 1);
            x.squads.forEach(function (s) { s.m = s.m.filter(function (z) { return z !== id; }); });
            if (t) {
                t.account.job = null; t.account.job_rank = 0;
                if (t.getVariable('duty')) setDuty(t, false);
                if (U()) U().govStrip(t, GOV_KEYS);
                notify(t, 'warn', 'Вы уволены из ' + (NAMES[f] || f) + (d.reason ? '. Причина: ' + d.reason : ''));
            }
            mark(); flog(f, nick(p) + ' уволил ' + name + (d.reason ? ' (' + d.reason + ')' : ''));
            return done('Сотрудник уволен');
        }
        const nr = a === 'rankup' ? tr + 1 : tr - 1;
        if (nr < 1 || nr > x.ranks.length - 1) return tabErr(p, 'Недопустимый ранг');
        if (!isLeader(p) && nr >= rank(p)) return tabErr(p, 'Нельзя повысить до своего ранга');
        await q('UPDATE accounts SET job_rank = ? WHERE id = ?', [nr, id]);
        if (t) { t.account.job_rank = nr; notify(t, a === 'rankup' ? 'ok' : 'warn', (a === 'rankup' ? 'Вас повысили до ' : 'Вас понизили до ') + rankName(f, nr)); }
        flog(f, nick(p) + (a === 'rankup' ? ' повысил ' : ' понизил ') + name + ' → ' + rankName(f, nr));
        return done('Ранг изменён: ' + rankName(f, nr));
    }
    if (a === 'rname') {
        if (!isLeader(p)) return tabErr(p, 'Ранги меняет только лидер');
        const i = Number(d.i), n = String(d.n || '').trim().slice(0, 32);
        if (!x.ranks[i] || !n) return;
        x.ranks[i] = n; mark(); return done('Ранг переименован');
    }
    if (a === 'radd') {
        if (!isLeader(p)) return tabErr(p, 'Ранги меняет только лидер');
        const n = String(d.n || '').trim().slice(0, 32);
        if (!n || x.ranks.length >= 15) return tabErr(p, 'Максимум 15 рангов');
        x.ranks.splice(x.ranks.length - 1, 0, n); mark(); return done('Ранг добавлен');
    }
    if (a === 'rdel') {
        if (!isLeader(p)) return tabErr(p, 'Ранги меняет только лидер');
        if (x.ranks.length <= 3) return tabErr(p, 'Минимум 3 ранга');
        const i = Number(d.i);
        if (i <= 0 || i >= x.ranks.length - 1) return tabErr(p, 'Нельзя удалить первый и высший ранг');
        x.ranks.splice(i, 1); mark(); return done('Ранг удалён');
    }
    if (a === 'sqadd') {
        const n = String(d.n || '').trim().slice(0, 32);
        if (!n) return;
        if (x.squads.length >= 12) return tabErr(p, 'Максимум 12 отрядов');
        x.squads.push({ n: n, l: 0, m: [], r: Math.max(1, Number(d.r) || 1) }); mark(); flog(f, nick(p) + ' создал отряд «' + n + '»');
        return done('Отряд создан');
    }
    const sq = x.squads[Number(d.i)];
    if (a === 'sqdel' && sq) { x.squads.splice(Number(d.i), 1); mark(); flog(f, nick(p) + ' расформировал отряд «' + sq.n + '»'); return done('Отряд удалён'); }
    if (a === 'sqren' && sq) { const n = String(d.n || '').trim().slice(0, 32); if (n) { sq.n = n; mark(); } return done('Готово'); }
    if (a === 'sqjoin' && sq) {
        const id = Number(d.id);
        x.squads.forEach(function (s) { s.m = s.m.filter(function (z) { return z !== id; }); if (s.l === id) s.l = 0; });
        sq.m.push(id); mark();
        const t = online(id); if (t) notify(t, 'ok', 'Вы зачислены в отряд «' + sq.n + '»');
        return done('Добавлен в отряд');
    }
    if (a === 'sqkick' && sq) { const id = Number(d.id); sq.m = sq.m.filter(function (z) { return z !== id; }); if (sq.l === id) sq.l = 0; mark(); return done('Исключён из отряда'); }
    if (a === 'sqlead' && sq) { const id = Number(d.id); if (sq.m.indexOf(id) < 0) sq.m.push(id); sq.l = id; mark(); return done('Командир отряда назначен'); }

    /* ---- полиция ---- */
    if (!isPolice(p)) return;
    if (a === 'search') {
        const s = String(d.q || '').trim();
        if (s.length < 2) return tabErr(p, 'Введите минимум 2 символа');
        let rows;
        const byPhone = /^\d{3}-\d{3}$/.test(s) && U() && U().sidByPhone ? U().sidByPhone(s) : 0;
        if (byPhone) rows = await q('SELECT id, nick, login, job, job_rank, created_at, gender FROM accounts WHERE id = ? LIMIT 1', [byPhone]);
        else if (/^#?\d+$/.test(s)) rows = await q('SELECT id, nick, login, job, job_rank, created_at, gender FROM accounts WHERE id = ? LIMIT 1', [Number(s.replace('#', ''))]);
        else rows = await q('SELECT id, nick, login, job, job_rank, created_at, gender FROM accounts WHERE nick LIKE ? LIMIT 10', ['%' + s.replace(/%/g, '').replace(/\s+/g, '_') + '%']);
        const W = global.WantedSystem;
        const res = [];
        for (const r of rows) {
            const id = Number(r.id);
            const docs = U() && U().docsOf ? U().docsOf('a' + id) : [];
            const veh = await q('SELECT model, plate FROM vehicles WHERE owner_id = ? LIMIT 10', [id]);
            const H = global.HouseSystem;
            const w = W ? W.info(id) : null;
            res.push({
                s: id, n: String(r.nick || r.login).replace(/_/g, ' '), g: Number(r.gender) === 1 ? 'Ж' : 'М',
                job: r.job ? (NAMES[r.job] || r.job) : 'Безработный', phone: U() && U().phoneOf ? U().phoneOf('a' + id) : null,
                docs: docs.map(function (z) { return { t: z.t, num: z.num || '', until: z.until || '' }; }),
                veh: veh.map(function (v) { return v.model + ' · ' + v.plate; }),
                house: H && H.byOwner ? H.byOwner(id) : null,
                wanted: w ? { stars: w.s, r: w.r, by: w.by } : null,
                fines: G.fines.filter(function (z) { return z.s === id; }).slice(-20).reverse(),
                notes: (G.records[id] || []).slice(-20).reverse(),
                on: !!online(id)
            });
        }
        if (!res.length) return tabErr(p, 'Ничего не найдено');
        return p.call('gov:tabSearch', [JSON.stringify(res)]);
    }
    if (a === 'plate') {
        const s = String(d.q || '').trim().toUpperCase().slice(0, 8);
        const live = mp.vehicles.toArray().find(function (v) { return String(v.numberPlate || '').trim().toUpperCase() === s; });
        const rows = await q('SELECT v.model, v.plate, a.id, a.nick, a.login FROM vehicles v LEFT JOIN accounts a ON a.id = v.owner_id WHERE UPPER(v.plate) = ? LIMIT 1', [s]);
        if (!rows[0] && !live) return tabErr(p, 'Номер не найден в базе');
        const r = rows[0];
        const gf = live && live.getVariable('gov');
        return p.call('gov:tabPlate', [JSON.stringify({ plate: s, model: r ? r.model : (live && live.getVariable('govModel')) || '—', owner: r ? String(r.nick || r.login).replace(/_/g, ' ') : gf ? 'Служебный транспорт ' + (NAMES[gf] || gf) : 'Неизвестно', s: r ? Number(r.id) : 0 })]);
    }
    if (a === 'wanted') {
        const id = Number(d.s), n = Math.max(0, Math.min(5, Number(d.stars) || 0));
        if (!id) return;
        if (n && !String(d.r || '').trim()) return tabErr(p, 'Укажите причину');
        const W = global.WantedSystem; if (!W) return;
        W.setById(id, n, String(d.r || '').slice(0, 80), nick(p));
        addRecord(id, p, n ? 'Объявлен в розыск ' + n + '★: ' + d.r : 'Розыск снят');
        flog(f, nick(p) + (n ? ' объявил в розыск #' + id + ' (' + n + '★)' : ' снял розыск с #' + id));
        const t = online(id); if (t) notify(t, n ? 'warn' : 'ok', n ? 'Вы объявлены в розыск: ' + n + '★ · ' + d.r : 'Ваш розыск снят');
        return done(n ? 'Розыск объявлен' : 'Розыск снят');
    }
    if (a === 'fine') {
        const id = Number(d.s), sum = Math.floor(Number(d.sum));
        const why = String(d.r || '').trim().slice(0, 80);
        if (!id || !(sum >= 50 && sum <= 100000) || !why) return tabErr(p, 'Сумма $50–100 000 и причина обязательны');
        const fn = { id: G.seq++, s: id, sum: sum, r: why, by: nick(p), f: f, at: Date.now(), paid: false };
        G.fines.push(fn);
        if (G.fines.length > 3000) G.fines.splice(0, G.fines.length - 3000);
        addRecord(id, p, 'Штраф ' + money(sum) + ': ' + why);
        mark();
        const t = online(id); if (t) notify(t, 'warn', 'Вам выписан штраф ' + money(sum) + ': ' + why + '. Оплатить: /fines');
        return done('Штраф выписан');
    }
    if (a === 'note') {
        const id = Number(d.s), t = String(d.t || '').trim().slice(0, 200);
        if (!id || !t) return;
        addRecord(id, p, t);
        return done('Запись добавлена в досье');
    }
    if (a === 'track') {
        const t = online(Number(d.s));
        if (!t) return tabErr(p, 'Абонент вне сети — отследить невозможно');
        if (t.dimension !== 0) return tabErr(p, 'Сигнал потерян (абонент в помещении). Попробуйте позже');
        if (p.lastTrack && Date.now() - p.lastTrack < 30000) return tabErr(p, 'Повторное отслеживание через ' + Math.ceil((30000 - (Date.now() - p.lastTrack)) / 1000) + ' сек');
        p.lastTrack = Date.now();
        const ang = Math.random() * Math.PI * 2, off = 80 + Math.random() * 170;
        const cx = t.position.x + Math.cos(ang) * off, cy = t.position.y + Math.sin(ang) * off;
        p.call('gov:track', [cx, cy, 300, nick(t)]);
        flog(f, nick(p) + ' отследил сигнал #' + sid(t));
        return notify(p, 'ok', 'Сигнал засечён: ' + nick(t) + ' где-то в красной зоне (~300 м). Ищите сами');
    }
});
function addRecord(id, p, text) {
    if (!G.records[id]) G.records[id] = [];
    G.records[id].push({ t: Date.now(), x: text, by: nick(p), f: NAMES[fac(p)] || fac(p) });
    if (G.records[id].length > 60) G.records[id].splice(0, G.records[id].length - 60);
    mark();
}

/* ---- приглашение ---- */
mp.events.addCommand('accept', async function (p) {
    const inv = p.inviteGov;
    if (!inv || Date.now() - inv.at > 60000) return notify(p, 'warn', 'Нет активных приглашений');
    p.inviteGov = null;
    if (p.account.job) return notify(p, 'error', 'Вы уже состоите в организации');
    await q('UPDATE accounts SET job = ?, job_rank = 1 WHERE id = ?', [inv.f, sid(p)]);
    p.account.job = inv.f; p.account.job_rank = 1;
    if (U() && U().giveDoc) try { U().giveDoc(p, 'faction', { f: inv.f === 'sheriff' ? 'lspd' : inv.f, pos: rankName(inv.f, 1) }, NAMES[inv.f]); } catch (e) {}
    flog(inv.f, nick(p) + ' принят в организацию');
    notify(p, 'ok', 'Вы приняты в ' + (NAMES[inv.f] || inv.f) + '. Планшет — F6');
    const by = online(inv.by); if (by) notify(by, 'ok', nick(p) + ' принял приглашение');
});

/* ---- штрафы ---- */
mp.events.addCommand('fines', function (p, full) {
    const my = finesOf(sid(p));
    const arg = String(full || '').trim();
    if (!arg) {
        if (!my.length) return notify(p, 'ok', 'Неоплаченных штрафов нет');
        p.outputChatBox('!{#ffcc66}Неоплаченные штрафы:');
        my.forEach(function (z) { p.outputChatBox('!{#ffffff}#' + z.id + ' · ' + money(z.sum) + ' · ' + z.r + ' (' + z.by + ')'); });
        return p.outputChatBox('!{#ffcc66}Оплатить: /fines pay [номер] или /fines pay all (со счёта в банке)');
    }
    const a = arg.split(/\s+/);
    if (a[0] !== 'pay') return;
    const list = a[1] === 'all' ? my : my.filter(function (z) { return z.id === Number(a[1]); });
    if (!list.length) return notify(p, 'warn', 'Штраф не найден');
    const sum = list.reduce(function (s, z) { return s + z.sum; }, 0);
    const M = global.MoneySystem;
    if (!M || M.bank(p) < sum) return notify(p, 'error', 'На счёте недостаточно денег: нужно ' + money(sum));
    M.addBank(p, -sum);
    list.forEach(function (z) { z.paid = true; z.paidAt = Date.now(); });
    if (global.GovSystem) global.GovSystem.add(sum, 'Оплата штрафов: ' + nick(p));
    mark();
    notify(p, 'ok', 'Оплачено штрафов на ' + money(sum));
});

mp.events.add('playerReady', function (p) { setTimeout(function () { if (mp.players.exists(p)) sendPoints(p); }, 5000); });
setTimeout(function () { mp.players.forEach(sendPoints); }, 3000);

global.GovFaction = { rankName: rankName, isLeader: isLeader, canManage: canManage, fines: finesOf, F: F, NAMES: NAMES };
console.log('[gov] госструктуры: склад, раздевалка, автопарк, планшет загружены');
