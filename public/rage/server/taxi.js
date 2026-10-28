const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'taxi_data.json');
const S = Object.assign({ park: null, stats: {} }, (function () { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch (e) { return {}; } })());
let dirty = false;
setInterval(function () { if (dirty) { dirty = false; fs.writeFile(FILE, JSON.stringify(S), function () {}); } }, 5000);

const CFG = { start: 30, perKm: 45, perMin: 6, rent: 250, rentMin: 60, driverLvl: 4, freeLvl: 3, freeMax: 900, fee: 0 };
const PARK_DEF = { x: 895.5, y: -179.3, z: 74.7, h: 238 };
const SPOTS = [[903.2, -191.6, 73.4, 58], [906.5, -186.3, 73.4, 58], [910.0, -181.0, 73.4, 58], [913.5, -175.6, 73.4, 58]];

function notify(p, t, x) { if (typeof global.hudNotify === 'function') global.hudNotify(p, t, x); else p.outputChatBox(x); }
function sid(p) { return p && p.account && p.account.id ? Number(p.account.id) : 0; }
function nick(p) { return String((p.account && p.account.nick) || p.name).replace(/_/g, ' '); }
function lvl(p) { return global.UiSystem && global.UiSystem.lvlOf ? global.UiSystem.lvlOf(p) : 1; }
function M() { return global.MoneySystem; }
function money(n) { return '$' + String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function admLvl(p) { return global.AdminSystem && global.AdminSystem.realLvl ? global.AdminSystem.realLvl(p) : 0; }
function park() { return S.park || PARK_DEF; }
function phoneOf(p) { const U = global.UiPhone; try { return U && U.data ? U.data(p).number || '' : ''; } catch (e) { return ''; } }
function hasB(p) { const U = global.UiSystem; return !U || !U.driveCats || U.driveCats(p).indexOf('B') >= 0; }
function st(p) { const k = sid(p); if (!S.stats[k]) S.stats[k] = { rides: 0, earned: 0, rate: 0, votes: 0 }; return S.stats[k]; }

const drivers = {};
const orders = {};
let oSeq = 1;
const rents = {};

function D(p) { return drivers[p.id]; }
function myOrder(p) { return Object.values(orders).find(function (o) { return o.cl === p; }) || null; }
function rideOf(p) { return Object.values(orders).find(function (o) { return o.dr === p || o.cl === p; }) || null; }

/* ---------- данные для приложения ---------- */
function appData(p) {
    const d = D(p), o = rideOf(p), s = st(p);
    const free = lvl(p) <= CFG.freeLvl;
    return {
        lvl: lvl(p), canDrive: lvl(p) >= CFG.driverLvl, hasB: hasB(p), free: free,
        tariff: { start: CFG.start, km: CFG.perKm, min: CFG.perMin, rent: CFG.rent, rentMin: CFG.rentMin, freeLvl: CFG.freeLvl, drvLvl: CFG.driverLvl },
        driver: d ? { on: true, rent: !!(rents[sid(p)] && mp.vehicles.exists(rents[sid(p)].v)), own: d.own } : null,
        stats: { rides: s.rides, earned: s.earned, rate: s.votes ? (s.rate / s.votes).toFixed(1) : '—' },
        online: Object.keys(drivers).length,
        order: o ? { id: o.id, st: o.st, me: o.cl === p ? 'cl' : 'dr', drv: o.dr ? nick(o.dr) : '', drvPhone: o.dr ? phoneOf(o.dr) : '', car: o.car || '', cl: nick(o.cl), clPhone: phoneOf(o.cl), free: o.free, note: o.note, sum: o.sum || 0 } : null,
        queue: d && !o ? Object.values(orders).filter(function (x) { return x.st === 'wait'; }).map(function (x) { return { id: x.id, cl: nick(x.cl), note: x.note, free: x.free, dist: Math.round(Math.hypot(p.position.x - x.pos.x, p.position.y - x.pos.y)), ago: Math.round((Date.now() - x.at) / 1000) }; }) : []
    };
}
function push(p) { if (p && mp.players.exists(p)) p.call('taxi:app', [JSON.stringify(appData(p))]); }
function pushDrivers() { Object.keys(drivers).forEach(function (id) { const p = mp.players.at(Number(id)); if (p) push(p); }); }
mp.events.add('srv:taxi:app', function (p) { push(p); });

/* ---------- водитель ---------- */
function taxiCar(v) { return !!(v && mp.vehicles.exists(v) && (v.getVariable('taxiRent') || v.getVariable('taxiOwn'))); }
mp.events.add('srv:taxi:duty', function (p, on) {
    on = on === true || on === 1 || on === '1' || on === 'true';
    if (!on) { goOff(p, 'Вы вышли с линии'); return push(p); }
    if (D(p)) return push(p);
    if (lvl(p) < CFG.driverLvl && admLvl(p) < 1) return notify(p, 'error', 'Работать в такси можно с ' + CFG.driverLvl + ' уровня');
    if (!hasB(p)) return notify(p, 'error', 'Нужны права категории B');
    const v = p.vehicle;
    const r = rents[sid(p)];
    if (r && mp.vehicles.exists(r.v)) {
        drivers[p.id] = { own: false };
    } else {
        if (!v) return notify(p, 'warn', 'Сядьте за руль своей машины или арендуйте такси в автопарке (Downtown Cab Co.)');
        if (p.seat !== 0 && p.seat !== -1 && p.seat !== undefined) return notify(p, 'warn', 'Сядьте за руль');
        const own = Number(v.getVariable('ownerId') || 0);
        if (own !== sid(p)) return notify(p, 'warn', 'Это не ваша машина. Работать можно на личном авто или арендованном такси');
        v.setVariable('taxiOwn', sid(p));
        drivers[p.id] = { own: true, v: v };
    }
    p.setVariable('taxiDrv', 1);
    notify(p, 'ok', '🚕 Вы на линии. Заказы появятся в приложении «Такси»');
    push(p);
});
function goOff(p, why) {
    const d = D(p);
    if (!d) return;
    const o = rideOf(p);
    if (o && o.dr === p) cancel(o, 'Водитель вышел с линии');
    if (d.own && d.v && mp.vehicles.exists(d.v)) d.v.setVariable('taxiOwn', 0);
    delete drivers[p.id];
    try { p.setVariable('taxiDrv', 0); } catch (e) {}
    p.call('taxi:meter', ['']);
    if (why) notify(p, 'warn', why);
}

/* ---------- аренда ---------- */
mp.events.add('srv:taxi:rent', function (p) {
    if (lvl(p) < CFG.driverLvl && admLvl(p) < 1) return notify(p, 'error', 'Аренда такси с ' + CFG.driverLvl + ' уровня');
    if (!hasB(p)) return notify(p, 'error', 'Нужны права категории B');
    const P = park();
    if (Math.hypot(p.position.x - P.x, p.position.y - P.y) > 8) { p.call('phone:gps', [P.x, P.y, 'Таксопарк Downtown Cab Co.']); return notify(p, 'warn', 'Арендовать можно в таксопарке — метка на карте'); }
    const k = sid(p);
    if (rents[k] && mp.vehicles.exists(rents[k].v)) return notify(p, 'warn', 'У вас уже есть арендованное такси');
    if (!M() || M().get(p) < CFG.rent) return notify(p, 'error', 'Аренда стоит ' + money(CFG.rent) + ' наличными');
    const SP = S.spots && S.spots.length ? S.spots : SPOTS;
    const sp = SP.find(function (s) { return !mp.vehicles.toArray().some(function (v) { return Math.hypot(v.position.x - s[0], v.position.y - s[1]) < 2.5; }); }) || SP[0];
    const v = mp.vehicles.new(mp.joaat('taxi'), new mp.Vector3(sp[0], sp[1], sp[2]), { heading: sp[3], numberPlate: 'TAXI' + String(p.id).padStart(3, '0'), dimension: 0, engine: false, locked: false });
    if (!v || !mp.vehicles.exists(v)) return notify(p, 'error', 'Не удалось выдать машину — сообщите администрации');
    M().add(p, -CFG.rent);
    v.dimension = 0;
    v.setVariable('taxiRent', k);
    v.setVariable('pub', 1);
    try { v.setColor(88, 88); } catch (e) {}
    rents[k] = { v: v, until: Date.now() + CFG.rentMin * 60000 };
    setTimeout(function () { if (mp.players.exists(p) && mp.vehicles.exists(v)) try { p.putIntoVehicle(v, 0); } catch (e) {} }, 400);
    notify(p, 'ok', '🚕 Такси арендовано на ' + CFG.rentMin + ' мин за ' + money(CFG.rent) + '. Выходите на линию в приложении');
    push(p);
});
function rentEnd(k, why) {
    const r = rents[k];
    if (!r) return;
    delete rents[k];
    const p = mp.players.toArray().find(function (x) { return sid(x) === k; });
    if (p && D(p) && !D(p).own) goOff(p);
    if (r.v && mp.vehicles.exists(r.v)) r.v.destroy();
    if (p && why) notify(p, 'warn', why);
    if (p) push(p);
}
mp.events.add('srv:taxi:rentEnd', function (p) { rentEnd(sid(p), 'Аренда такси завершена'); });
setInterval(function () {
    Object.keys(rents).forEach(function (k) {
        const r = rents[k];
        if (!mp.vehicles.exists(r.v)) return rentEnd(Number(k));
        if (Date.now() > r.until) {
            const busy = Object.values(orders).some(function (o) { return o.v === r.v && o.st === 'ride'; });
            if (!busy) rentEnd(Number(k), 'Время аренды такси вышло');
        }
    });
}, 30000);

/* ---------- заказ клиента ---------- */
mp.events.add('srv:taxi:call', function (p, note) {
    if (!sid(p)) return;
    if (D(p)) return notify(p, 'warn', 'Вы сами на линии такси');
    if (rideOf(p)) return notify(p, 'warn', 'У вас уже есть активный заказ');
    const free = lvl(p) <= CFG.freeLvl;
    if (!free && M() && M().get(p) + M().bank(p) < CFG.start) return notify(p, 'error', 'Недостаточно денег на поездку');
    const o = { id: oSeq++, cl: p, dr: null, st: 'wait', at: Date.now(), pos: { x: p.position.x, y: p.position.y, z: p.position.z }, note: String(note || '').replace(/[<>]/g, '').slice(0, 60), free: free };
    orders[o.id] = o;
    notify(p, 'ok', '🚕 Заказ отправлен. Водителей на линии: ' + Object.keys(drivers).length + (free ? ' · для вас поездка бесплатна (оплачивает мэрия)' : ''));
    Object.keys(drivers).forEach(function (id) { const d = mp.players.at(Number(id)); if (d) { notify(d, 'ok', '🚕 Новый заказ от ' + nick(p) + (o.note ? ': ' + o.note : '')); try { d.call('taxi:ping', []); } catch (e) {} } });
    push(p); pushDrivers();
    setTimeout(function () { if (orders[o.id] && o.st === 'wait') cancel(o, 'Свободных водителей не нашлось. Попробуйте позже'); }, 5 * 60000);
});
mp.events.add('srv:taxi:accept', function (p, id) {
    const o = orders[Number(id)];
    if (!D(p)) return;
    if (!o || o.st !== 'wait') { push(p); return notify(p, 'warn', 'Заказ уже принят другим водителем'); }
    if (rideOf(p)) return notify(p, 'warn', 'Сначала завершите текущий заказ');
    const v = D(p).own ? D(p).v : rents[sid(p)] && rents[sid(p)].v;
    o.dr = p; o.st = 'go'; o.v = v; o.car = v && mp.vehicles.exists(v) ? (v.numberPlate || 'такси') : '';
    p.call('taxi:gps', [o.pos.x, o.pos.y, o.pos.z, 'Клиент: ' + nick(o.cl)]);
    o.cl.call('taxi:drvBlip', [p.id]);
    notify(o.cl, 'ok', '🚕 Водитель ' + nick(p) + ' едет к вам · номер ' + o.car);
    notify(p, 'ok', 'Заказ принят — метка клиента на карте');
    push(p); push(o.cl); pushDrivers();
});
function cancel(o, why) {
    if (!orders[o.id]) return;
    delete orders[o.id];
    [o.cl, o.dr].forEach(function (x) { if (x && mp.players.exists(x)) { x.call('taxi:meter', ['']); x.call('taxi:gps', [0, 0, 0, '']); if (why) notify(x, 'warn', '🚕 ' + why); push(x); } });
    pushDrivers();
}
mp.events.add('srv:taxi:cancel', function (p) {
    const o = rideOf(p);
    if (!o) return;
    if (o.st === 'ride') return notify(p, 'warn', 'Поездка уже идёт — завершите её');
    cancel(o, (o.cl === p ? 'Клиент' : 'Водитель') + ' отменил заказ');
});

/* ---------- таксометр ---------- */
function fare(o) {
    const km = o.km || 0, min = (Date.now() - o.t0) / 60000;
    return Math.round(CFG.start + km * CFG.perKm + min * CFG.perMin);
}
function meterData(o, who) { return JSON.stringify({ sum: fare(o), km: (o.km || 0).toFixed(2), min: Math.floor((Date.now() - o.t0) / 60000), sec: Math.floor((Date.now() - o.t0) / 1000) % 60, free: o.free, who: who, drv: nick(o.dr), cl: nick(o.cl), tar: CFG }); }
mp.events.add('srv:taxi:start', function (p) {
    const o = rideOf(p);
    if (!o || o.dr !== p || o.st !== 'go') return;
    const c = o.cl;
    if (!c.vehicle || c.vehicle !== p.vehicle) return notify(p, 'warn', 'Клиент должен сесть в вашу машину');
    o.st = 'ride'; o.t0 = Date.now(); o.km = 0; o.last = { x: p.position.x, y: p.position.y };
    p.call('taxi:gps', [0, 0, 0, '']);
    c.call('taxi:drvBlip', [-1]);
    notify(c, 'ok', '🚕 Счётчик включён. Тариф: ' + money(CFG.start) + ' посадка + ' + money(CFG.perKm) + '/км + ' + money(CFG.perMin) + '/мин' + (o.free ? ' · вам бесплатно' : ''));
    push(p); push(c);
});
setInterval(function () {
    Object.values(orders).forEach(function (o) {
        if (o.st !== 'ride') return;
        if (!mp.players.exists(o.dr) || !mp.players.exists(o.cl)) return;
        const pos = o.dr.position;
        const d = Math.hypot(pos.x - o.last.x, pos.y - o.last.y);
        if (d < 400) o.km += d / 1000;
        o.last = { x: pos.x, y: pos.y };
        o.dr.call('taxi:meter', [meterData(o, 'dr')]);
        o.cl.call('taxi:meter', [meterData(o, 'cl')]);
    });
}, 1000);
mp.events.add('srv:taxi:finish', function (p) {
    const o = rideOf(p);
    if (!o || o.dr !== p || o.st !== 'ride') return;
    const sum = fare(o), c = o.cl;
    let paid = sum, by = 'клиент';
    if (o.free) {
        paid = Math.min(sum, CFG.freeMax);
        if (global.GovSystem && global.GovSystem.add) global.GovSystem.add(-paid, 'Такси для новичков: поездка ' + nick(c));
        by = 'мэрия (льгота новичкам)';
    } else if (M()) {
        if (M().get(c) >= sum) M().add(c, -sum);
        else { const b = Math.min(M().bank(c), sum - M().get(c)); const cash = M().get(c); M().set(c, 0, M().bank(c) - b); paid = cash + b; }
    }
    let net = paid;
    if (global.Treasury && global.Treasury.jobTax) net -= global.Treasury.jobTax(paid);
    if (M()) M().add(p, net);
    const s = st(p); s.rides++; s.earned += net; dirty = true;
    if (global.UiSystem && global.UiSystem.addExp) global.UiSystem.addExp(p, 10 + Math.round(o.km * 4));
    delete orders[o.id];
    p.call('taxi:meter', ['']); c.call('taxi:meter', ['']);
    notify(p, 'ok', '🚕 Поездка завершена: ' + money(net) + ' (платит ' + by + ')');
    notify(c, 'ok', '🚕 Поездка: ' + (o.km || 0).toFixed(1) + ' км · ' + money(sum) + (o.free ? ' — оплатила мэрия' : paid < sum ? ' · списано ' + money(paid) + ' (не хватило денег)' : ''));
    c.taxiRate = sid(p);
    c.call('taxi:rate', [JSON.stringify({ drv: nick(p), id: sid(p) })]);
    push(p); push(c); pushDrivers();
});
mp.events.addCommand('trate', function (p, full) {
    if (!p.taxiRate) return notify(p, 'warn', 'Нет поездки для оценки');
    const id = p.taxiRate; p.taxiRate = 0;
    rateDrv(p, id, Number(full));
});
function rateDrv(p, id, n) {
    n = Math.max(1, Math.min(5, Number(n) || 5));
    const k = Number(id);
    if (!S.stats[k]) return;
    S.stats[k].rate += n; S.stats[k].votes++; dirty = true;
    notify(p, 'ok', 'Спасибо за оценку!');
}

/* ---------- выход / отключение ---------- */
mp.events.add('playerQuit', function (p) {
    const o = rideOf(p);
    if (o) cancel(o, o.cl === p ? 'Клиент покинул город' : 'Водитель покинул город');
    if (D(p)) goOff(p);
    const k = sid(p);
    if (rents[k]) rentEnd(k);
});
mp.events.add('playerExitVehicle', function (p, v) {
    const o = rideOf(p);
    if (o && o.st === 'ride' && o.cl === p && o.dr && o.dr.vehicle === v) notify(o.dr, 'warn', 'Клиент вышел из машины — завершите поездку в приложении');
});

/* ---------- точка аренды ---------- */
function sendPark(p) { const P = park(); p.call('taxi:park', [P.x, P.y, P.z]); }
mp.events.add('playerReady', function (p) { setTimeout(function () { if (mp.players.exists(p)) sendPark(p); }, 4500); });
setTimeout(function () { mp.players.forEach(sendPark); }, 3000);
mp.events.addCommand('taxipark', function (p) {
    if (admLvl(p) < 5) return;
    S.park = { x: p.position.x, y: p.position.y, z: p.position.z, h: p.heading }; dirty = true;
    mp.players.forEach(sendPark);
    notify(p, 'ok', 'Точка таксопарка сохранена');
});
mp.events.addCommand('taxispot', function (p, full) {
    if (admLvl(p) < 5) return;
    if (String(full || '').trim() === 'reset') { S.spots = []; dirty = true; return notify(p, 'ok', 'Места выдачи такси сброшены'); }
    const e = p.vehicle || p;
    if (!S.spots) S.spots = [];
    S.spots.push([e.position.x, e.position.y, e.position.z + 0.3, e.heading !== undefined ? e.heading : p.heading]);
    dirty = true;
    notify(p, 'ok', 'Место выдачи такси добавлено (' + S.spots.length + '). Сброс: /taxispot reset');
});
mp.events.addCommand('taxi', function (p) { p.call('taxi:openApp', []); });

global.TaxiSystem = { CFG: CFG, data: appData };
console.log('[taxi] такси: приложение, аренда, таксометр, льгота новичкам');
module.exports = global.TaxiSystem;
