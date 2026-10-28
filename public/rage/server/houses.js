const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'houses.json');
const SELL_BACK = 0.6;
const DIM_HOUSE = 10000;
const DIM_FAC = 30000;
const DIM_HOTEL = 100000;

const INTS = {
    low: { n: 'Эконом', x: 266.1, y: -1007.5, z: -101.0, h: 0 },
    med: { n: 'Стандарт', x: 346.6, y: -1012.7, z: -99.2, h: 0 },
    apt: { n: 'Апартаменты', x: -18.07, y: -583.67, z: 79.47, h: 160 },
    trailer: { n: 'Трейлер', x: 1973.0, y: 3816.5, z: 33.4, h: 30 },
    hill1: { n: 'Вилла «Wild Oats»', x: -174.32, y: 497.38, z: 137.66, h: 190 },
    hill2: { n: 'Вилла «North Conker»', x: 341.97, y: 437.77, z: 149.39, h: 110 },
    hill3: { n: 'Вилла «Hillcrest»', x: -682.0, y: 592.4, z: 145.4, h: 220 },
    hill4: { n: 'Вилла «Hillcrest II»', x: -758.4, y: 619.0, z: 144.1, h: 110 },
    hill5: { n: 'Вилла «Milton»', x: -572.6, y: 653.1, z: 145.6, h: 180 }
};

const DEF = [
    ['Grove Street, 1', 114.8, -1961.2, 21.3, 'low', 65000], ['Grove Street, 2', 85.9, -1959.6, 21.1, 'low', 65000], ['Grove Street, 3', 76.4, -1948.1, 21.2, 'low', 60000],
    ['Grove Street, 4', 126.6, -1929.9, 21.4, 'low', 70000], ['Grove Street, 5', 118.3, -1921.0, 21.3, 'low', 70000], ['Grove Street, 6', 100.9, -1912.2, 21.4, 'low', 65000],
    ['Grove Street, 7', 72.0, -1938.9, 21.4, 'low', 60000], ['Grove Street, 8', 56.6, -1922.6, 21.9, 'low', 60000], ['Grove Street, 9', 39.0, -1911.6, 21.9, 'low', 60000],
    ['Forum Drive, 12', -14.3, -1441.2, 31.1, 'med', 120000], ['El Burro Heights', 1275.3, -1721.4, 54.66, 'med', 110000],
    ['Mirror Park, 1', 1100.9, -411.4, 67.6, 'med', 180000], ['Mirror Park, 2', 1060.5, -378.2, 68.2, 'med', 175000], ['Mirror Park, 3', 1029.5, -408.9, 66.0, 'med', 170000],
    ['Mirror Park, 4', 1014.4, -469.4, 64.3, 'med', 165000], ['Mirror Park, 5', 970.6, -502.0, 62.1, 'med', 160000], ['Mirror Park, 6', 945.9, -519.0, 60.6, 'med', 160000],
    ['Mirror Park, 7', 1229.0, -725.4, 60.9, 'med', 190000], ['Mirror Park, 8', 1265.1, -703.8, 64.6, 'med', 200000],
    ['Whispymound Dr, 3671', 7.6, 538.4, 176.0, 'hill1', 1200000], ['Whispymound Dr, 3677', 120.5, 549.4, 184.1, 'hill2', 950000],
    ['Wild Oats Dr, 3655', -174.6, 502.6, 137.4, 'hill1', 900000], ['North Conker Ave, 2044', 346.5, 440.6, 147.7, 'hill2', 850000],
    ['Hillcrest Ave, 2862', -686.1, 596.0, 143.6, 'hill3', 800000], ['Hillcrest Ave, 2868', -752.8, 620.5, 142.7, 'hill4', 780000],
    ['Milton Rd, 2117', -559.4, 664.2, 145.5, 'hill5', 750000], ['Mad Wayne Thunder Dr, 2113', -1294.4, 454.6, 97.4, 'hill3', 700000],
    ['Kimble Hill Dr, 2874', -853.3, 695.6, 148.8, 'hill4', 820000],
    ['Sandy Shores, трейлер', 1973.9, 3815.6, 33.4, 'trailer', 35000], ['Sandy Shores, 1', 1880.6, 3810.4, 32.78, 'low', 45000],
    ['Sandy Shores, 2', 1843.4, 3778.0, 33.6, 'low', 45000], ['Sandy Shores, 3', 1915.6, 3909.2, 33.4, 'low', 40000],
    ['Paleto Bay, 1', -437.7, 6272.5, 30.07, 'low', 50000], ['Paleto Bay, 2', -379.5, 6252.9, 31.85, 'low', 50000],
    ['Paleto Bay, 3', -347.8, 6224.9, 31.5, 'med', 90000], ['Paleto Bay, 4', -15.0, 6557.3, 33.2, 'med', 95000]
];
const FLATS = [
    ['Integrity Way', -47.4, -585.9, 37.95, 'apt', 380000, 4], ['Del Perro Heights', -1447.06, -537.8, 34.74, 'apt', 420000, 4],
    ['Tinsel Towers', -619.0, 37.9, 43.6, 'apt', 450000, 3], ['Eclipse Towers', -773.9, 311.6, 85.7, 'apt', 520000, 4],
    ['Richards Majestic', -936.4, -378.9, 38.96, 'apt', 400000, 3], ['Alta Street', -271.0, -957.0, 31.2, 'med', 210000, 4]
];

const FAC_INT = [
    { k: 'sheriff', f: ['sheriff'], n: 'Офис шерифа', out: [1853.2, 3686.4, 34.27, 210], in: [-1392.667, -480.474, 72.042, 0], ipl: 'ex_sm_15_office_02b', pub: true },
    { k: 'fib', f: ['fib'], n: 'Штаб FIB', out: [105.6, -744.9, 45.75, 160], in: [136.0, -749.6, 258.15, 70], pub: false },
    { k: 'army', f: ['army'], n: 'Штаб армии', out: [-2344.0, 3267.0, 32.8, 240], in: [-141.199, -620.913, 168.820, 0], ipl: 'ex_dt1_02_office_02b', pub: false },
    { k: 'gov', f: ['gov'], n: 'Мэрия Лос-Сантоса', out: [-545.2, -204.0, 38.2, 210], in: [-75.847, -826.989, 243.386, 0], ipl: 'ex_dt1_11_office_01a', pub: true },
    { k: 'news', f: ['news'], n: 'Weazel News', out: [-598.0, -929.9, 23.9, 90], in: [-1579.756, -565.066, 108.523, 0], ipl: 'ex_sm_13_office_01a', pub: false }
];

let D = (function () { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { return null; } })();
if (!D || !Array.isArray(D.houses)) {
    D = { seq: 1, houses: [], fac: {} };
    DEF.forEach(function (h) { D.houses.push({ id: D.seq++, n: h[0], x: h[1], y: h[2], z: h[3], h: 0, int: h[4], price: h[5], owner: 0, on: '', locked: true }); });
    FLATS.forEach(function (b) { for (let i = 1; i <= b[6]; i++) D.houses.push({ id: D.seq++, n: b[0] + ', кв. ' + i, x: b[1], y: b[2], z: b[3], h: 0, int: b[4], price: b[5] + i * 10000, owner: 0, on: '', locked: true, flat: 1 }); });
}
if (!D.fac) D.fac = {};
Object.keys(D.fac).forEach(function (k) { if (/^\d+$/.test(k)) delete D.fac[k]; });
if (!D.ints) D.ints = {};
let dirty = true;
setInterval(function () { if (dirty) { dirty = false; try { fs.writeFileSync(FILE, JSON.stringify(D)); } catch (e) {} } }, 5000);

function sid(p) { const a = p.account || p.admAcc; return a && a.id ? Number(a.id) : 0; }
function nick(p) { const a = p.account; return String((a && a.nick) || p.name).replace(/_/g, ' '); }
function V(x, y, z) { return new mp.Vector3(Number(x), Number(y), Number(z)); }
function notify(p, type, text) { if (typeof global.hudNotify === 'function') global.hudNotify(p, type, text); else p.outputChatBox(text); }
function admLvl(p) { return global.AdminSystem && global.AdminSystem.realLvl ? global.AdminSystem.realLvl(p) : 0; }
function M() { return global.MoneySystem; }
function intOf(k) { return Object.assign({}, INTS[k] || INTS.low, D.ints[k] || {}); }
function facInt(i) { const f = FAC_INT[i]; const o = D.fac[f.k] || {}; return { f: f.f, n: f.n, pub: f.pub, ipl: f.ipl, out: o.out || f.out, in: o.in || f.in, dim: DIM_FAC + 100 + i }; }
function byId(id) { return D.houses.find(function (h) { return h.id === Number(id); }) || null; }
function mine(p) { const s = sid(p); return s ? D.houses.find(function (h) { return h.owner === s; }) || null : null; }
function near(p, x, y, z, r) { return Math.hypot(p.position.x - x, p.position.y - y) <= r && Math.abs(p.position.z - z) < 4; }
function money(n) { return '$' + String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function slog(p, a, d) { if (global.SLog) try { global.SLog.add('house', { actor: p, action: a, details: d }); } catch (e) {} }

function listFor(p) {
    const s = sid(p);
    return D.houses.map(function (h) { return [h.id, Math.round(h.x * 10) / 10, Math.round(h.y * 10) / 10, Math.round(h.z * 10) / 10, h.owner ? (h.owner === s ? 2 : 1) : 0]; });
}
function sendList(p) { p.call('house:list', [JSON.stringify(listFor(p))]); }
function broadcastList() { mp.players.forEach(function (p) { if (sid(p)) sendList(p); }); }
function sendStatic(p) {
    const ints = Object.keys(INTS).map(function (k) { const i = intOf(k); return [i.x, i.y, i.z]; });
    const fac = FAC_INT.map(function (f, i) { const x = facInt(i); return [x.n, x.out[0], x.out[1], x.out[2], x.in[0], x.in[1], x.in[2], x.dim, x.ipl || '']; });
    p.call('house:static', [JSON.stringify({ ints: ints, fac: fac })]);
}

/* ---------- меню дома ---------- */
function menuFor(p, h) {
    const s = sid(p);
    const group = D.houses.filter(function (x) { return Math.hypot(x.x - h.x, x.y - h.y) < 2 && Math.abs(x.z - h.z) < 3; });
    const my = mine(p);
    return {
        title: group.length > 1 ? h.n.replace(/, кв\. \d+$/, '') : h.n,
        list: group.map(function (x) {
            const i = intOf(x.int);
            return { id: x.id, n: x.n, int: i.n, price: x.price, owner: x.owner ? x.on : '', mine: x.owner === s, locked: x.locked, canBuy: false, agency: !x.owner, auction: !!(global.Realty && global.Realty.locked('house', x.id)) };
        }),
        money: M() ? M().get(p) : 0, bank: M() ? M().bank(p) : 0, hasHome: !!my
    };
}
mp.events.add('srv:house:menu', function (p, id) {
    const h = byId(id);
    if (!h || p.vehicle || !near(p, h.x, h.y, h.z, 3)) return;
    p.call('house:menu', [JSON.stringify(menuFor(p, h))]);
});
function enterHouse(p, h) {
    const i = intOf(h.int);
    p.dimension = DIM_HOUSE + h.id;
    p.position = V(i.x, i.y, i.z);
    p.heading = i.h;
    p.call('house:inside', [h.n]);
}
mp.events.add('srv:house:act', function (p, act, id) {
    const h = byId(id);
    if (!h || !p.account) return;
    if (!near(p, h.x, h.y, h.z, 3)) return notify(p, 'warn', 'Подойдите к двери');
    const s = sid(p);
    const done = function () { p.call('house:menu', [JSON.stringify(menuFor(p, h))]); };
    if (act === 'buy') return notify(p, 'warn', 'Жильё продаётся только через риэлторское агентство (Карты → Места → Агентство недвижимости)');
    if (act === 'enter') {
        if (h.owner !== s && (h.locked || !h.owner)) return notify(p, 'warn', h.owner ? 'Дверь заперта' : 'Дом продаётся — сначала купите его');
        p.call('house:menuClose');
        return enterHouse(p, h);
    }
    if (act === 'lock') {
        if (h.owner !== s) return;
        h.locked = !h.locked; dirty = true;
        notify(p, 'ok', h.locked ? 'Дверь заперта' : 'Дверь открыта для гостей');
        return done();
    }
    if (act === 'knock') {
        const o = mp.players.toArray().find(function (x) { return sid(x) === h.owner && x.dimension === DIM_HOUSE + h.id; });
        if (o) notify(o, 'warn', nick(p) + ' стучит в дверь');
        return notify(p, 'ok', o ? 'Вы постучали в дверь' : 'Никто не открывает');
    }
    if (act === 'sell') {
        if (h.owner !== s) return;
        if (global.Realty && global.Realty.locked('house', h.id)) return notify(p, 'error', 'Жильё выставлено на аукцион — продать государству нельзя');
        const back = Math.round(h.price * SELL_BACK);
        mp.players.forEach(function (x) { if (x.dimension === DIM_HOUSE + h.id) { x.dimension = 0; x.position = V(h.x, h.y, h.z); } });
        h.owner = 0; h.on = ''; h.locked = true; dirty = true;
        if (M()) M().addBank(p, back);
        notify(p, 'ok', 'Дом продан государству. На счёт зачислено ' + money(back));
        slog(p, 'sell', h.n + ' ' + back);
        broadcastList();
        return done();
    }
});
mp.events.add('srv:house:exit', function (p) {
    const d = p.dimension;
    if (d >= DIM_HOUSE && d < DIM_FAC) {
        const h = byId(d - DIM_HOUSE);
        if (!h) return;
        const i = intOf(h.int);
        if (!near(p, i.x, i.y, i.z, 3)) return;
        p.dimension = 0; p.position = V(h.x, h.y, h.z); p.heading = (h.h || 0) + 180;
        return p.call('house:inside', ['']);
    }
    if (d >= DIM_HOTEL) {
        const i = intOf('low');
        if (!near(p, i.x, i.y, i.z, 3)) return;
        const r = hotelDoor();
        p.dimension = 0; p.position = V(r.x, r.y, r.z);
        return p.call('house:inside', ['']);
    }
    if (d >= DIM_FAC && d < DIM_HOTEL) {
        const idx = FAC_INT.findIndex(function (f, i) { return facInt(i).dim === d; });
        if (idx < 0) return;
        const f = facInt(idx);
        if (!near(p, f.in[0], f.in[1], f.in[2], 3)) return;
        p.dimension = 0; p.position = V(f.out[0], f.out[1], f.out[2]); p.heading = f.out[3] || 0;
    }
});

/* ---------- отель ---------- */
function hotelDoor() {
    const S = global.SpawnSystem;
    return S && S.hotelPos ? S.hotelPos() : { x: 313.2, y: -225.8, z: 54.2, n: 'Мотель Pink Cage' };
}
function hotelRoom(p) { const i = intOf('low'); return { x: i.x, y: i.y, z: i.z, h: i.h, dim: DIM_HOTEL + sid(p) }; }
mp.events.add('srv:hotel:enter', function (p) {
    const r = hotelDoor();
    if (!near(p, r.x, r.y, r.z, 3) || p.vehicle) return;
    const S = global.SpawnSystem;
    const left = S && S.hotelLeft ? S.hotelLeft(p) : 0;
    if (!left) return p.call('house:hotel', [JSON.stringify({ n: r.n, price: S && S.HOTEL_DAY || 150, max: S && S.HOTEL_MAX || 14, money: M() ? M().get(p) : 0 })]);
    const rm = hotelRoom(p);
    p.dimension = rm.dim; p.position = V(rm.x, rm.y, rm.z); p.heading = rm.h;
    p.call('house:inside', ['Номер в ' + r.n]);
});

/* ---------- фракции ---------- */
function facOf(p) { const a = p.account; return a ? a.job : null; }
mp.events.add('srv:fac:enter', function (p, i) {
    i = Number(i);
    if (!FAC_INT[i]) return;
    const f = facInt(i);
    if (!near(p, f.out[0], f.out[1], f.out[2], 3) || p.vehicle) return;
    if (!f.pub && f.f.indexOf(facOf(p)) < 0 && admLvl(p) < 1) return notify(p, 'warn', 'Вход только для сотрудников: ' + f.n);
    p.dimension = f.dim; p.position = V(f.in[0], f.in[1], f.in[2]); p.heading = f.in[3] || 0;
    p.call('house:inside', [f.n]);
});

/* ---------- телефон ---------- */
mp.events.add('srv:house:phone', function (p) {
    const my = mine(p), pos = p.position, r = hotelDoor();
    const S = global.SpawnSystem;
    p.call('house:phone', [JSON.stringify({
        my: my ? { id: my.id, n: my.n, int: intOf(my.int).n, price: my.price, locked: my.locked } : null,
        hotel: { n: r.n, left: S && S.hotelLeft ? Math.ceil(S.hotelLeft(p) / 86400000) : 0, price: S && S.HOTEL_DAY || 150 },
        fac: FAC_INT.map(function (f, i) { return { i: i, n: facInt(i).n }; })
    })]);
});
mp.events.add('srv:house:gps', function (p, kind, id) {
    if (kind === 'house') { const h = byId(id); if (h) p.call('phone:gps', [h.x, h.y, h.n]); }
    else if (kind === 'hotel') { const r = hotelDoor(); p.call('phone:gps', [r.x, r.y, r.n]); }
    else if (kind === 'fac') { const f = FAC_INT[Number(id)] ? facInt(Number(id)) : null; if (f) p.call('phone:gps', [f.out[0], f.out[1], f.n]); }
});

/* ---------- админ ---------- */
function adm(p, need) { if (admLvl(p) < need) { p.outputChatBox('!{#e05555}Нужен ' + need + ' уровень администрации'); return false; } return true; }
mp.events.addCommand('addhouse', function (p, full) {
    if (!adm(p, 7)) return;
    const a = String(full || '').trim().split(/\s+/);
    const price = Math.floor(Number(a[0])), int = a[1], name = a.slice(2).join(' ');
    if (!(price > 0) || !INTS[int] || !name) return p.outputChatBox('!{#ffcc66}/addhouse [цена] [' + Object.keys(INTS).join('/') + '] [название] — встаньте у двери');
    D.houses.push({ id: D.seq++, n: name.slice(0, 48), x: p.position.x, y: p.position.y, z: p.position.z, h: p.heading || 0, int: int, price: price, owner: 0, on: '', locked: true });
    dirty = true; broadcastList();
    p.outputChatBox('!{#8fd14f}Дом «' + name + '» добавлен (#' + (D.seq - 1) + ')');
});
mp.events.addCommand('delhouse', function (p, full) {
    if (!adm(p, 7)) return;
    const h = byId(full) || D.houses.slice().sort(function (a, b) { return Math.hypot(p.position.x - a.x, p.position.y - a.y) - Math.hypot(p.position.x - b.x, p.position.y - b.y); })[0];
    if (!h || (!byId(full) && Math.hypot(p.position.x - h.x, p.position.y - h.y) > 5)) return p.outputChatBox('!{#ffcc66}/delhouse [id] или встаньте у двери');
    D.houses = D.houses.filter(function (x) { return x !== h; });
    dirty = true; broadcastList();
    p.outputChatBox('!{#8fd14f}Дом #' + h.id + ' «' + h.n + '» удалён');
});
mp.events.addCommand('houseinfo', function (p) {
    if (!adm(p, 3)) return;
    const h = D.houses.slice().sort(function (a, b) { return Math.hypot(p.position.x - a.x, p.position.y - a.y) - Math.hypot(p.position.x - b.x, p.position.y - b.y); })[0];
    if (h) p.outputChatBox('!{#7fd4ff}#' + h.id + ' ' + h.n + ' · ' + money(h.price) + ' · интерьер ' + h.int + ' · владелец: ' + (h.on || 'нет'));
});
mp.events.addCommand('setint', function (p, full) {
    if (!adm(p, 7)) return;
    const k = String(full || '').trim();
    if (!INTS[k]) return p.outputChatBox('!{#ffcc66}/setint [' + Object.keys(INTS).join('/') + '] — встаньте у выхода внутри интерьера');
    D.ints[k] = { x: p.position.x, y: p.position.y, z: p.position.z, h: p.heading || 0 };
    dirty = true;
    mp.players.forEach(sendStatic);
    p.outputChatBox('!{#8fd14f}Точка интерьера «' + k + '» сохранена');
});
mp.events.addCommand('facdoor', function (p, full) {
    if (!adm(p, 7)) return;
    const a = String(full || '').trim().split(/\s+/);
    const i = Number(a[0]);
    if (!FAC_INT[i] || (a[1] !== 'in' && a[1] !== 'out')) return p.outputChatBox('!{#ffcc66}/facdoor [номер] [out/in] — ' + FAC_INT.map(function (f, k) { return k + ' ' + f.n; }).join(', '));
    const fk = FAC_INT[i].k;
    if (!D.fac[fk]) D.fac[fk] = {};
    D.fac[fk][a[1]] = [p.position.x, p.position.y, p.position.z, p.heading || 0];
    dirty = true;
    mp.players.forEach(sendStatic);
    p.outputChatBox('!{#8fd14f}Точка ' + a[1] + ' для «' + FAC_INT[i].n + '» сохранена');
});


/* ---------- метки в редакторе /points ---------- */
const PR = global.PointReg || require('./points.js');
PR.provider(function () {
    const out = [];
    FAC_INT.forEach(function (f, i) {
        const g = 'Здание: ' + f.n;
        ['out', 'in'].forEach(function (k) {
            out.push({ id: 'facint.' + f.k + '.' + k, g: g, n: k === 'out' ? 'Вход с улицы' : 'Выход внутри', dim: k === 'in' ? function () { return facInt(i).dim; } : 0,
                get: function () { return facInt(i)[k]; },
                set: function (v) { if (!D.fac[f.k]) D.fac[f.k] = {}; D.fac[f.k][k] = [v.x, v.y, v.z, v.h]; dirty = true; mp.players.forEach(sendStatic); },
                reset: function () { if (D.fac[f.k]) delete D.fac[f.k][k]; dirty = true; mp.players.forEach(sendStatic); } });
        });
    });
    Object.keys(INTS).forEach(function (k) {
        out.push({ id: 'hint.' + k, g: 'Интерьеры домов', n: 'Выход: ' + INTS[k].n, get: function () { return intOf(k); },
            set: function (v) { D.ints[k] = v; dirty = true; mp.players.forEach(sendStatic); },
            reset: function () { delete D.ints[k]; dirty = true; mp.players.forEach(sendStatic); } });
    });
    D.houses.forEach(function (h) {
        out.push({ id: 'house.' + h.id, g: 'Дома', n: '#' + h.id + ' ' + h.n, get: function () { return h; },
            set: function (v) { h.x = v.x; h.y = v.y; h.z = v.z; h.h = v.h; dirty = true; mp.players.forEach(sendList); } });
    });
    return out;
});

mp.events.add('playerReady', function (p) { setTimeout(function () { if (mp.players.exists(p)) { sendStatic(p); sendList(p); } }, 4500); });
setTimeout(function () { mp.players.forEach(function (p) { sendStatic(p); sendList(p); }); }, 3000);

global.HouseSystem = {
    home: function (p) {
        const h = mine(p);
        if (!h) return null;
        const i = intOf(h.int);
        return { x: i.x, y: i.y, z: i.z, h: i.h, dim: DIM_HOUSE + h.id, n: h.flat ? 'Моя квартира' : 'Мой дом', d: h.n, flat: !!h.flat };
    },
    hotelRoom: hotelRoom,
    allOwned: function (id) { return D.houses.filter(function (x) { return x.owner === Number(id); }).map(function (x) { return { id: x.id, n: x.n, price: x.price, flat: !!x.flat }; }); },
    byOwner: function (id) { const h = D.houses.find(function (x) { return x.owner === Number(id); }); return h ? h.n : null; },
    mine: mine,
    facDim: function (k) { const i = FAC_INT.findIndex(function (f) { return f.k === k; }); return i < 0 ? -1 : facInt(i).dim; },
    refresh: sendList,
    byId: byId,
    intName: function (k) { return intOf(k).n; },
    free: function () { return D.houses.filter(function (h) { return !h.owner; }); },
    buyState: function (p, id) {
        const h = byId(id);
        if (!h) return 'Объект не найден';
        if (h.owner) return 'Объект уже продан';
        if (global.Realty && global.Realty.locked('house', h.id)) return 'Объект выставлен на аукцион';
        if (mine(p)) return 'У вас уже есть жильё. Сначала продайте его';
        if (global.UiSystem && global.UiSystem.hasDoc && !global.UiSystem.hasDoc(p, 'passport') && admLvl(p) < 1) return 'Нужен паспорт. Оформите его в мэрии (паспортный стол)';
        const m = M();
        if (!m) return 'Ошибка';
        const cash = m.get(p), bank = m.bank(p);
        if (cash + bank < h.price) return 'Не хватает денег: нужно ' + money(h.price);
        const fromBank = Math.max(0, h.price - cash);
        m.set(p, cash - (h.price - fromBank), bank - fromBank, 'house-buy');
        if (m.gov) m.gov(h.price, 'Продажа жилья: ' + h.n);
        h.owner = sid(p); h.on = nick(p); h.locked = true;
        dirty = true;
        slog(p, 'buy', h.n + ' ' + h.price);
        broadcastList();
        return null;
    },
    transfer: function (id, toId, toName) {
        const h = byId(id);
        if (!h) return false;
        mp.players.forEach(function (x) { if (x.dimension === DIM_HOUSE + h.id) { x.dimension = 0; x.position = V(h.x, h.y, h.z); } });
        if (toId) { h.owner = Number(toId); h.on = toName; } else { h.owner = 0; h.on = ''; }
        h.locked = true; dirty = true;
        broadcastList();
        return true;
    }
};
console.log('[houses] домов: ' + D.houses.length + ', интерьеров фракций: ' + FAC_INT.length);
