const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'dealer.json');
const MIN_LVL = 8;
let S = { seq: 1, salons: [] };
try { S = Object.assign(S, JSON.parse(fs.readFileSync(FILE, 'utf8'))); } catch (e) {}
if (!S.salons.length) {
    S.salons.push({
        id: S.seq++, n: 'Premium Deluxe Motorsport', on: true,
        x: -56.5, y: -1096.6, z: 26.4, sx: -31.5, sy: -1090.5, sz: 26.4, sh: 340,
        cars: [
            { m: 'blista', n: 'Dinka Blista', price: 18000, stock: 5 },
            { m: 'asea', n: 'Declasse Asea', price: 15000, stock: 5 },
            { m: 'sultan', n: 'Karin Sultan', price: 45000, stock: 3 }
        ]
    });
}
let dirty = true;
function mark() { dirty = true; }
setInterval(function () { if (!dirty) return; dirty = false; try { fs.writeFileSync(FILE, JSON.stringify(S, null, 1)); } catch (e) {} }, 3000);

function notify(p, t, x) { if (typeof global.hudNotify === 'function') global.hudNotify(p, t, x); else p.outputChatBox(x); }
function VS() { return global.VehStore; }
function A() { return global.AdminCore; }
function lvlOf(p) { const a = A(); return a && a.lvl ? a.lvl(p) : 0; }
function nameOf(p) { const a = A(); return a && a.login ? a.login(p) : p.name; }
function salon(id) { return S.salons.find(function (s) { return s.id === Number(id); }) || null; }
function money(n) { return '$' + String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function clean(s, n) { return String(s == null ? '' : s).replace(/[<>"'`\\]/g, '').trim().slice(0, n || 40); }
function int(v, min, max) { v = Math.floor(Number(v) || 0); return Math.max(min, Math.min(max, v)); }

function points() {
    return S.salons.filter(function (s) { return s.on; }).map(function (s) { return [s.id, s.n, s.x, s.y, s.z]; });
}
function sendPoints(p) { try { p.call('dealer:points', [JSON.stringify(points())]); } catch (e) {} }
function sendAll() { mp.players.forEach(sendPoints); }
mp.events.add('playerReady', function (p) { setTimeout(function () { if (mp.players.exists(p)) sendPoints(p); }, 2500); });
setTimeout(sendAll, 3000);

function near(p, s) {
    const d = p.position;
    return Math.hypot(d.x - s.x, d.y - s.y) < 6 && Math.abs(d.z - s.z) < 5 && p.dimension === 0;
}
function view(p, s) {
    const st = VS();
    return {
        id: s.id, n: s.n,
        money: st ? st.money(p) : 0, bank: st ? st.bank(p) : 0,
        home: st ? !!st.hasHousing(p) : true, td: TD_MIN,
        cars: s.cars.map(function (c, i) { return { i: i, m: c.m, n: c.n || c.m, price: c.price, stock: c.stock }; })
    };
}
mp.events.add('srv:dealer:open', function (p, id) {
    const s = salon(id);
    if (!s || !s.on || !near(p, s)) return;
    p.call('dealer:open', [JSON.stringify(view(p, s))]);
});

const busy = {};
mp.events.add('srv:dealer:buy', async function (p, id, idx, pay) {
    const s = salon(id), st = VS();
    if (!s || !s.on || !st || !near(p, s)) return;
    const c = s.cars[Number(idx)];
    const reply = function (err) { if (err) notify(p, 'error', err); if (mp.players.exists(p)) p.call('dealer:open', [JSON.stringify(Object.assign(view(p, s), { err: err || '' }))]); };
    if (!c) return reply('Этой машины уже нет в салоне');
    if (c.stock <= 0) return reply('Нет в наличии — ждите поставку');
    const aid = st.accId(p);
    if (!aid) return reply('Аккаунт не загружен');
    if (!st.hasHousing(p)) return reply('Нужно жильё (дом, квартира или гостиница), чтобы купить личный транспорт');
    if (busy[aid]) return;
    const cash = pay === 'cash';
    const m = st.money(p), b = st.bank(p);
    if ((cash ? m : b) < c.price) return reply('Недостаточно денег ' + (cash ? 'наличными' : 'на карте') + ': нужно ' + money(c.price));
    busy[aid] = true;
    try {
        c.stock -= 1; mark();
        global.__moneyWhy = 'Автосалон: ' + (c.n || c.m);
        if (cash) st.setMB(p, m - c.price, b); else st.setMB(p, m, b - c.price);
        global.__moneyWhy = null;
        if (!cash && st.tx) { try { st.tx(aid, 'out', c.price, 'Автосалон: ' + (c.n || c.m)); } catch (e) {} }
        await st.cols();
        const plate = ('AM' + Math.floor(100000 + Math.random() * 899999)).slice(0, 8);
        const col = Math.floor(Math.random() * 12);
        const res = await st.q('INSERT INTO vehicles (owner_id, model, plate, color1, color2, pos_x, pos_y, pos_z, heading) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [aid, c.m, plate, col, col, s.sx, s.sy, s.sz, s.sh || 0]);
        const vid = (res && res.insertId) || (res && res[0] && res[0].insertId) || 0;
        let v = null;
        if (vid) {
            const row = (await st.q('SELECT * FROM vehicles WHERE id = ? LIMIT 1', [vid]))[0];
            if (row && mp.players.exists(p)) v = st.spawn(row, aid, { x: s.sx, y: s.sy, z: s.sz, h: s.sh || 0, dim: 0 });
        }
        if (mp.players.exists(p)) {
            p.call('dealer:close');
            notify(p, 'ok', 'Поздравляем с покупкой ' + (c.n || c.m) + '! Номер ' + plate + '. Машина ждёт у салона');
            if (v) setTimeout(function () { try { if (mp.players.exists(p) && mp.vehicles.exists(v)) p.putIntoVehicle(v, 0); } catch (e) {} }, 400);
        }
        if (global.SLog && global.SLog.add) { try { global.SLog.add('vehicle', { actor: nameOf(p), action: 'dealer_buy', details: c.m + ' ' + plate + ' | «' + s.n + '» | $' + c.price }); } catch (e) {} }
        console.log('[dealer] ' + nameOf(p) + ' купил ' + c.m + ' (' + plate + ') за ' + c.price + ' в ' + s.n);
    } finally { delete busy[aid]; }
});

const TD_MIN = 3, TD_CD = 5 * 60000, tdLast = {};
function tdEnd(p, why) {
    const t = p && p.testDrive;
    if (!t) return;
    p.testDrive = null;
    clearTimeout(t.timer); clearInterval(t.tick);
    try { if (mp.vehicles.exists(t.v)) t.v.destroy(); } catch (e) {}
    if (!mp.players.exists(p)) return;
    p.call('dealer:td', ['']);
    const s = salon(t.sid);
    if (s) { p.position = new mp.Vector3(s.x, s.y, s.z + 0.5); p.dimension = 0; }
    if (why) notify(p, 'ok', why);
}
mp.events.add('srv:dealer:test', function (p, id, idx) {
    const s = salon(id), st = VS();
    if (!s || !s.on || !near(p, s) || p.testDrive) return;
    const c = s.cars[Number(idx)];
    if (!c) return;
    if (c.stock <= 0) return notify(p, 'error', 'Нет в наличии — тест-драйв недоступен');
    const aid = st ? st.accId(p) : 0;
    const left = (tdLast[aid] || 0) + TD_CD - Date.now();
    if (left > 0) return notify(p, 'error', 'Следующий тест-драйв через ' + Math.ceil(left / 60000) + ' мин');
    tdLast[aid] = Date.now();
    let v;
    try {
        v = mp.vehicles.new(mp.joaat(c.m), new mp.Vector3(s.sx, s.sy, s.sz + 0.3), { heading: s.sh || 0, numberPlate: 'TEST', dimension: 0, locked: false, engine: true });
    } catch (e) { return notify(p, 'error', 'Не удалось подать машину'); }
    v.setVariable('testDrive', true); v.setVariable('rent', true); v.setVariable('fuel', 100);
    p.call('dealer:close');
    const until = Date.now() + TD_MIN * 60000;
    p.testDrive = { v: v, sid: s.id, out: 0 };
    p.testDrive.timer = setTimeout(function () { tdEnd(p, 'Тест-драйв окончен. Понравилась машина? Купить можно в салоне'); }, TD_MIN * 60000);
    p.testDrive.tick = setInterval(function () {
        const t = p.testDrive;
        if (!t || !mp.players.exists(p)) return;
        if (!mp.vehicles.exists(t.v)) return tdEnd(p, 'Тест-драйв прерван');
        if (p.vehicle !== t.v) { t.out += 1; if (t.out >= 5) tdEnd(p, 'Вы покинули машину — тест-драйв завершён'); } else t.out = 0;
    }, 1000);
    setTimeout(function () { try { if (mp.players.exists(p) && mp.vehicles.exists(v)) p.putIntoVehicle(v, 0); } catch (e) {} }, 300);
    p.call('dealer:td', [JSON.stringify({ n: c.n || c.m, until: until })]);
    notify(p, 'ok', 'Тест-драйв ' + (c.n || c.m) + ': ' + TD_MIN + ' мин. Выйдете из машины — тест закончится');
});
mp.events.add('srv:dealer:tdstop', function (p) { tdEnd(p, 'Тест-драйв завершён'); });
mp.events.add('playerQuit', function (p) { if (p.testDrive) tdEnd(p); });
mp.events.add('playerDeath', function (p) { if (p.testDrive) tdEnd(p); });

function admView() {
    return S.salons.map(function (s) {
        return { id: s.id, n: s.n, on: s.on, pos: [s.x, s.y, s.z].map(function (x) { return Math.round(x * 10) / 10; }), spawn: [s.sx, s.sy, s.sz].map(function (x) { return Math.round(x * 10) / 10; }), cars: s.cars };
    });
}
function admAct(p, d) {
    if (lvlOf(p) < MIN_LVL) return { err: 'Автосалонами управляет ГА (8) и выше' };
    const op = String(d.op || '');
    const pos = p.vehicle ? p.vehicle.position : p.position;
    const head = p.vehicle ? p.vehicle.heading : p.heading;
    if (op === 'create') {
        const n = clean(d.n, 40);
        if (!n) return { err: 'Введите название салона' };
        const s = { id: S.seq++, n: n, on: true, x: p.position.x, y: p.position.y, z: p.position.z, sx: p.position.x + 4, sy: p.position.y, sz: p.position.z, sh: p.heading || 0, cars: [] };
        S.salons.push(s); mark(); sendAll();
        return { ok: 'Салон «' + n + '» создан на вашей позиции. Не забудьте задать место выдачи машин' };
    }
    const s = salon(d.sid);
    if (!s) return { err: 'Салон не найден' };
    if (op === 'del') { S.salons = S.salons.filter(function (x) { return x !== s; }); mark(); sendAll(); return { ok: 'Салон удалён' }; }
    if (op === 'rename') { const n = clean(d.n, 40); if (!n) return { err: 'Пустое название' }; s.n = n; mark(); sendAll(); return { ok: 'Название сохранено' }; }
    if (op === 'toggle') { s.on = !s.on; mark(); sendAll(); return { ok: s.on ? 'Салон открыт' : 'Салон закрыт' }; }
    if (op === 'here') { s.x = p.position.x; s.y = p.position.y; s.z = p.position.z; mark(); sendAll(); return { ok: 'Точка входа перенесена на вашу позицию' }; }
    if (op === 'spawn') { s.sx = pos.x; s.sy = pos.y; s.sz = pos.z; s.sh = head || 0; mark(); return { ok: 'Место выдачи купленных машин сохранено' }; }
    if (op === 'tp') { p.position = new mp.Vector3(s.x, s.y, s.z + 0.5); p.dimension = 0; return { ok: 'Телепорт в «' + s.n + '»' }; }
    if (op === 'caradd') {
        const m = clean(d.m, 30).toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (!m) return { err: 'Введите модель (например, sultan)' };
        if (s.cars.some(function (c) { return c.m === m; })) return { err: 'Эта модель уже есть в салоне — измените её в списке' };
        s.cars.push({ m: m, n: clean(d.n, 40) || m, price: int(d.price, 1, 1e9), stock: int(d.stock, 0, 9999) });
        mark();
        return { ok: 'Добавлено: ' + m };
    }
    const c = s.cars[Number(d.i)];
    if (!c) return { err: 'Машина не найдена' };
    if (op === 'caredit') {
        if (d.n !== undefined) c.n = clean(d.n, 40) || c.m;
        if (d.price !== undefined) c.price = int(d.price, 1, 1e9);
        if (d.stock !== undefined) c.stock = int(d.stock, 0, 9999);
        mark(); return { ok: 'Сохранено: ' + (c.n || c.m) };
    }
    if (op === 'stock') { c.stock = int(c.stock + Number(d.v || 0), 0, 9999); mark(); return { ok: (c.n || c.m) + ': в наличии ' + c.stock + ' шт.' }; }
    if (op === 'cardel') { s.cars.splice(Number(d.i), 1); mark(); return { ok: 'Машина убрана из салона' }; }
    if (op === 'up' || op === 'down') {
        const i = Number(d.i), j = op === 'up' ? i - 1 : i + 1;
        if (j < 0 || j >= s.cars.length) return {};
        const t = s.cars[i]; s.cars[i] = s.cars[j]; s.cars[j] = t; mark(); return {};
    }
    return { err: 'Неизвестное действие' };
}

mp.events.addCommand('endtest', function (p) { if (p.testDrive) tdEnd(p, 'Тест-драйв завершён'); else p.outputChatBox('!{#ffcc66}Вы не на тест-драйве'); });

global.DealerSystem = { admView: admView, admAct: admAct, list: function () { return S.salons; }, MIN_LVL: MIN_LVL };
console.log('[dealer] Автосалонов: ' + S.salons.length);
