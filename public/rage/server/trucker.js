const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'trucker_data.json');
const S = Object.assign({ base: null, spot: null, depot: null, stats: {} }, (function () { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch (e) { return {}; } })());
let dirty = false;
setInterval(function () { if (dirty) { dirty = false; try { fs.writeFileSync(FILE, JSON.stringify(S)); } catch (e) {} } }, 5000);

function J() { return global.JobSystem; }
function notify(p, type, text) { if (typeof global.hudNotify === 'function') global.hudNotify(p, type, text); else p.outputChatBox(text); }
function sid(p) { const a = p.account || p.admAcc; return a && a.id ? Number(a.id) : 0; }
function admLvl(p) { return global.AdminSystem && global.AdminSystem.realLvl ? global.AdminSystem.realLvl(p) : 0; }
function charLvl(p) { return global.UiSystem && global.UiSystem.lvlOf ? global.UiSystem.lvlOf(p) : 1; }
function cats(p) { return global.UiSystem && global.UiSystem.driveCats ? global.UiSystem.driveCats(p) : ['B', 'C']; }

const BASE_DEF = { x: 1196.0, y: -3253.0, z: 7.1 };
const SPOT_DEF = { x: 1180.0, y: -3240.0, z: 6.0, h: 90 };
const DEPOT_DEF = { x: 1186.0, y: -3290.0, z: 6.0 };
function basePt() { return S.base || BASE_DEF; }
function spotPt() { return S.spot || SPOT_DEF; }
function depotPt() { return S.depot || DEPOT_DEF; }

const LV = [0, 10, 30, 70, 140];

const TIERS = [
    { id: 'van', lvl: 1, cargo: 'shop', n: '🚐 Продукты · фургон', truck: 'mule', units: 120, rate: 1.0, cat: 'B', d: 'Небольшие партии продуктов в магазины 24/7' },
    { id: 'box', lvl: 3, cargo: 'shop', n: '🚚 Продукты · грузовик', truck: 'pounder', units: 300, rate: 1.35, cat: 'C', d: 'Крупные партии товара в магазины и оружейные' },
    { id: 'tank', lvl: 5, cargo: 'fuel', n: '⛽ Топливо · бензовоз', truck: 'phantom', trailer: 'tanker', liters: 1500, rate: 1.7, cat: 'C', d: 'Цистерна с топливом для АЗС — груз опасный, едь аккуратно' },
    { id: 'tank2', lvl: 10, cargo: 'fuel', n: '🛢 Топливо · дальний рейс', truck: 'hauler', trailer: 'tanker2', liters: 3000, rate: 2.2, cat: 'C', d: 'Большая цистерна, лучшие ставки. Для опытных водителей' }
];

function tierOk(p, t, lv) {
    if (charLvl(p) < t.lvl && admLvl(p) < 1) return 'Нужен ' + t.lvl + ' уровень персонажа';
    if (cats(p).indexOf(t.cat) < 0 && admLvl(p) < 1) return 'Нужны права категории ' + t.cat;
    return null;
}

function sendTo(p) {
    const B = basePt(), D = depotPt();
    p.call('truck:static', [B.x, B.y, B.z, D.x, D.y, D.z]);
}

async function pickOrder(t, pos) {
    const isFuel = t.cargo === 'fuel';
    const sys = isFuel ? global.FuelSystem : global.ShopSystem;
    if (!sys) return null;
    let rows = [];
    try { rows = await sys.pendingOrders(); } catch (e) { rows = []; }
    if (!isFuel && t.id === 'van') rows = rows.filter(function (r) { return r.kind === 'shop'; });
    if (rows.length) {
        const r = rows[Math.floor(Math.random() * Math.min(rows.length, 4))];
        return { order: r.id, target: r.station_id || r.shop_id, name: r.name, x: Number(r.x), y: Number(r.y), z: Number(r.z), qty: Number(isFuel ? r.liters : r.units), real: true };
    }
    const list = (sys.list() || []).filter(function (b) {
        if (!isFuel && t.id === 'van' && b.kind !== 'shop') return false;
        return b.stock < b.max * 0.85;
    });
    const pool = list.length ? list : (sys.list() || []).filter(function (b) { return isFuel || t.id !== 'van' || b.kind === 'shop'; });
    if (!pool.length) return null;
    pool.sort(function (a, b) { return a.stock / a.max - b.stock / b.max; });
    const b = pool[Math.floor(Math.random() * Math.min(pool.length, 5))];
    const qty = isFuel ? t.liters : t.units;
    return { order: 0, target: b.id, name: b.name, x: b.x, y: b.y, z: b.z, qty: qty, real: false };
}

function stepLoad(p, s) {
    const D = depotPt();
    s.phase = 'load';
    p.call('job:point', [D.x, D.y, D.z, 6, s.t.cargo === 'fuel' ? 'Налив топлива на терминале' : 'Погрузка товара на складе', 'bus', 'nosnap']);
    J().quest(p, 'Дальнобойщик · ' + s.t.n, [{ t: 'Подъехать к ' + (s.t.cargo === 'fuel' ? 'терминалу налива' : 'складу погрузки') + ' и остановиться в круге', done: false }, { t: 'Доставить груз', done: false }]);
}

async function stepRoute(p, s) {
    const o = await pickOrder(s.t, p.position);
    if (!mp.players.exists(p) || p.job !== s) return;
    if (!o) { notify(p, 'warn', 'Сейчас нет заказов — попробуйте позже'); return J().stop(p); }
    if (o.real) {
        const sys = s.t.cargo === 'fuel' ? global.FuelSystem : global.ShopSystem;
        const ok = sys.takeOrder ? await sys.takeOrder(o.order, sid(p)) : true;
        if (!ok) return stepRoute(p, s);
    }
    o.ox = o.x; o.oy = o.y;
    s.o = o;
    s.phase = 'go';
    const B = basePt();
    const km = Math.hypot(o.x - B.x, o.y - B.y) / 1000;
    const L = J().level(p, 'trucker');
    const unitPay = s.t.cargo === 'fuel' ? 0.12 : 0.9;
    s.price = Math.round((120 + km * 140 + o.qty * unitPay * 0.4) * s.t.rate * L.mult);
    p.call('job:point', [o.x, o.y, o.z, 9, 'Доставка: ' + o.name, 'bus', '']);
    J().quest(p, 'Дальнобойщик · ' + s.t.n, [{ t: 'Груз: ' + (s.t.cargo === 'fuel' ? o.qty + ' л топлива' : o.qty + ' шт. товара'), done: true }, { t: 'Доставить: ' + o.name + ' (' + km.toFixed(1) + ' км)', done: false }, { t: 'Оплата: $' + s.price, done: false }]);
    notify(p, 'ok', 'Груз принят. Везите в «' + o.name + '» — оплата $' + s.price);
}

function untake(s) {
    if (!s || !s.o || !s.o.real) return;
    const sys = s.t.cargo === 'fuel' ? global.FuelSystem : global.ShopSystem;
    if (sys && sys.untake) sys.untake(s.o.order);
}

function vehOk(p, s) {
    const v = p.vehicle;
    if (!v || v !== s.veh) return false;
    if (s.trl && (!mp.vehicles.exists(s.trl) || Math.hypot(s.trl.position.x - v.position.x, s.trl.position.y - v.position.y) > 16)) return 'trailer';
    return true;
}

async function arrive(p, s) {
    if (s.busy) return;
    const ok = vehOk(p, s);
    if (!ok) return;
    if (ok === 'trailer') return notify(p, 'warn', 'Прицеп-цистерна отцеплен — вернитесь за ним');
    const v = p.vehicle;
    let spd = 0;
    try { spd = Math.hypot(v.velocity.x, v.velocity.y); } catch (e) {}
    if (spd > 3) return;
    if (s.phase === 'load') {
        const D = depotPt();
        if (Math.hypot(v.position.x - D.x, v.position.y - D.y) > 10) return;
        s.busy = true;
        notify(p, 'ok', s.t.cargo === 'fuel' ? 'Налив топлива…' : 'Погрузка товара…');
        p.call('job:busStop', [6000]);
        setTimeout(function () { if (!mp.players.exists(p) || p.job !== s) return; s.busy = false; stepRoute(p, s); }, 6000);
        return;
    }
    if (s.phase === 'go' && s.o) {
        const o = s.o;
        if (Math.hypot(v.position.x - o.x, v.position.y - o.y) > 22 && Math.hypot(v.position.x - o.ox, v.position.y - o.oy) > 22) return;
        s.busy = true;
        notify(p, 'ok', s.t.cargo === 'fuel' ? 'Слив топлива в резервуар АЗС…' : 'Разгрузка товара…');
        p.call('job:busStop', [7000]);
        setTimeout(async function () {
            if (!mp.players.exists(p) || p.job !== s) return;
            s.busy = false;
            const sys = s.t.cargo === 'fuel' ? global.FuelSystem : global.ShopSystem;
            if (o.real) { try { await sys.deliver(o.order, sid(p)); } catch (e) {} }
            else if (sys && sys.supply) sys.supply(o.target, o.qty);
            let sum = s.price;
            const hp = v.bodyHealth !== undefined ? Number(v.bodyHealth) : 1000;
            if (hp < 700) { sum = Math.round(sum * 0.75); notify(p, 'warn', 'Груз частично повреждён — оплата снижена на 25%'); }
            J().pay(p, sum, 'trucker');
            J().addXp(p, 'trucker', 1);
            const st = S.stats[sid(p)] || (S.stats[sid(p)] = { n: 0, earn: 0 });
            st.n++; st.earn += sum; dirty = true;
            notify(p, 'ok', 'Груз доставлен! +$' + sum + '. Возвращайтесь за новым грузом');
            s.o = null;
            stepLoad(p, s);
        }, 7000);
    }
}
setInterval(function () { mp.players.forEach(function (p) { if (p.job && p.job.id === 'trucker') arrive(p, p.job); }); }, 800);
mp.events.add('srv:job:busAt', function (p) { if (p.job && p.job.id === 'trucker') arrive(p, p.job); });
mp.events.add('srv:job:busfix', function (p, x, y) {
    const s = p.job;
    if (!s || s.id !== 'trucker' || !s.o) return;
    x = Number(x); y = Number(y);
    if (!isFinite(x) || !isFinite(y) || Math.hypot(s.o.ox - x, s.o.oy - y) > 80) return;
    s.o.x = x; s.o.y = y;
});

function jobDef() {
    return {
        n: 'Дальнобойщик', i: '🚛', lvl: 0, lv: LV,
        pay: 'от 200$ за рейс, зависит от груза, расстояния и уровня',
        d: 'Развозите продукты по магазинам и топливо на АЗС. Чем выше уровень персонажа — тем серьёзнее груз и выше оплата: фургон с 1 ур., грузовик с 3 ур., бензовоз с 5 ур., дальние рейсы с 10 ур. Для грузовиков нужны права категории C.',
        base: basePt(), blip: 477, color: 17, car: 'mule', carPos: spotPt(),
        opts: function (p, lv) {
            return TIERS.map(function (t) {
                const why = tierOk(p, t, lv);
                const sub = t.d + ' · ×' + (t.rate * lv.mult).toFixed(2) + ' к оплате · права ' + t.cat;
                return { id: t.id, n: t.n, sub: why ? why : sub, need: t.lvl, locked: !!why };
            });
        },
        start: function (p, s, opt) {
            const t = TIERS.find(function (x) { return x.id === opt; }) || TIERS[0];
            const why = tierOk(p, t);
            if (why) return why;
            s.t = t;
            const sp = spotPt();
            s.veh = J().jobVeh(p, { car: t.truck, carPos: sp }, null);
            s.veh.setVariable('fuel', 100);
            if (t.trailer) {
                const h = (sp.h || 0) * Math.PI / 180;
                const tx = sp.x + Math.sin(h) * 10, ty = sp.y - Math.cos(h) * 10;
                s.trl = mp.vehicles.new(mp.joaat(t.trailer), new mp.Vector3(tx, ty, sp.z + 0.5), { heading: sp.h || 0, numberPlate: 'TRL' + String(p.id).padStart(4, '0'), dimension: 0 });
                s.trl.jobOwner = p.id;
                setTimeout(function () { if (mp.players.exists(p) && s.veh && s.trl && mp.vehicles.exists(s.trl)) p.call('truck:attach', [s.veh.id, s.trl.id]); }, 1800);
            }
            stepLoad(p, s);
            return null;
        },
        stop: function (p, s) {
            untake(s);
            if (s.trl && mp.vehicles.exists(s.trl)) s.trl.destroy();
        }
    };
}

mp.events.addCommand('truckpt', function (p, full) {
    if (admLvl(p) < 5) return p.outputChatBox('!{#e05555}Доступно со Старшей администрации (5)');
    const a = String(full || '').trim();
    const e = p.vehicle || p;
    const pos = { x: e.position.x, y: e.position.y, z: e.position.z };
    if (a === 'base') S.base = pos;
    else if (a === 'car') S.spot = { x: pos.x, y: pos.y, z: pos.z + 0.3, h: e.heading || p.heading || 0 };
    else if (a === 'load') S.depot = pos;
    else if (a === 'reset') { S.base = null; S.spot = null; S.depot = null; }
    else return p.outputChatBox('!{#ffcc66}/truckpt [base/car/load/reset] — base: где устраиваться, car: где появляется грузовик, load: точка погрузки/налива');
    dirty = true;
    register(true);
    p.outputChatBox('!{#8fd14f}Точка сохранена');
});
mp.events.addCommand('truckstats', function (p) {
    const x = S.stats[sid(p)];
    p.outputChatBox('!{#ffb357}[Дальнобойщик] !{#ffffff}' + (x ? 'Рейсов: ' + x.n + ' · заработано $' + x.earn : 'Вы ещё не делали рейсов'));
});

mp.events.add('playerReady', function (p) { setTimeout(function () { if (mp.players.exists(p)) sendTo(p); }, 4600); });

global.TruckerSystem = {
    get active() { return mp.players.toArray().some(function (p) { return p.job && p.job.id === 'trucker'; }); }
};

function register(force) {
    if (!J() || !J().JOBS) return setTimeout(register, 1000);
    J().JOBS.trucker = jobDef();
    if (J().sendBases) J().sendBases();
    mp.players.forEach(sendTo);
}
register();
console.log('[trucker] работа «Дальнобойщик» загружена');

/* ---------- метки в редакторе /points ---------- */
const PR = global.PointReg || require('./points.js');
[['base', 'Устройство на работу', basePt], ['spot', 'Выдача грузовика', spotPt], ['depot', 'Погрузка / налив', depotPt]].forEach(function (a) {
    PR.add('truck.' + a[0], { g: 'Работа: Дальнобойщик', n: a[1], get: a[2], set: function (v) { S[a[0]] = v; dirty = true; register(true); }, reset: function () { S[a[0]] = null; dirty = true; register(true); } });
});
