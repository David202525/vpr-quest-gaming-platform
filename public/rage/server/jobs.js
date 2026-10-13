const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'jobs_data.json');
const store = (function () { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { return {}; } })();
let dirty = false;
setInterval(function () { if (dirty) { dirty = false; try { fs.writeFileSync(FILE, JSON.stringify(store)); } catch (e) {} } }, 10000);

const JOBS = {
    farm: {
        n: 'Ферма', i: '🌾', lvl: 0, pay: '15–25$ за пучок', d: 'Собирай урожай на поле и сдавай фермеру. Без машины и опыта — лучшее начало.',
        base: { x: 2029.8, y: 4980.6, z: 42.1 }, blip: 85, color: 2
    },
    courier: {
        n: 'Курьер', i: '📦', lvl: 0, pay: '60–140$ за доставку', d: 'Забери посылку на складе Post OP и доставь клиенту. Чем дальше адрес — тем выше оплата.',
        base: { x: -424.9, y: -2789.4, z: 6.0 }, blip: 478, color: 5, car: 'boxville2', carPos: { x: -431.6, y: -2794.6, z: 5.6, h: 45 }
    },
    bus: {
        n: 'Водитель автобуса', i: '🚌', lvl: 0, pay: '20$ за остановку + бонус за круг', d: 'Возьми автобус в депо, выбери маршрут и проезжай остановки. Права не нужны — достаточно не иметь запрета.',
        base: { x: 453.2, y: -600.9, z: 28.6 }, blip: 513, color: 3, car: 'bus', carPos: { x: 462.2, y: -605.5, z: 28.5, h: 214 }, lic: 'drive'
    }
};

const FIELD = [
    [2034.5, 4927.0, 41.0], [2042.3, 4918.4, 41.0], [2050.9, 4910.2, 41.0], [2026.8, 4934.9, 41.0], [2019.6, 4942.7, 41.0],
    [2010.7, 4934.1, 41.0], [2018.3, 4925.9, 41.0], [2026.1, 4917.6, 41.0], [2034.7, 4909.6, 41.0], [2043.1, 4901.2, 41.0],
    [2002.3, 4926.0, 41.0], [2009.9, 4917.7, 41.0], [2017.8, 4909.5, 41.0], [2026.2, 4901.1, 41.0], [2034.4, 4892.9, 41.0]
];
const FARM_DROP = { x: 2029.8, y: 4980.6, z: 42.1 };

const COURIER_DEST = [
    ['Vinewood Hills, особняк', -1286.4, 438.1, 97.4], ['Rockford Hills, офис', -1379.8, -478.3, 31.6], ['Del Perro, кафе', -1197.0, -891.3, 13.9],
    ['Vespucci, пляжный дом', -1149.6, -1521.9, 4.4], ['Little Seoul, магазин', -712.5, -916.4, 19.2], ['Mission Row, аптека', 316.0, -1078.3, 29.4],
    ['Strawberry, гараж', 247.6, -1373.4, 29.6], ['Mirror Park, дом', 1265.1, -703.8, 64.6], ['La Mesa, мастерская', 728.3, -1088.9, 22.2],
    ['Davis, частный дом', 115.9, -1945.2, 20.7], ['Burton, бутик', -159.5, -305.4, 39.7], ['Pillbox, клиника', 357.4, -593.7, 28.8],
    ['Downtown, небоскрёб', -70.4, -800.5, 44.2], ['Textile City, склад', 431.9, -808.9, 29.5], ['Chamberlain Hills, дом', -150.5, -1622.6, 33.7]
];

const ROUTES = {
    city: { n: 'Маршрут №1 «Центр»', bonus: 250, stops: [
        ['Депо', 433.6, -647.4, 28.7], ['Pillbox', 307.4, -766.8, 29.3], ['Legion Square', 237.3, -862.0, 29.9], ['Alta St', 116.2, -785.0, 31.4],
        ['Mission Row', 404.4, -995.4, 29.3], ['Strawberry', 266.5, -1222.6, 29.3], ['Davis', 115.5, -1621.5, 29.2], ['Депо (конец)', 450.0, -625.0, 28.5]
    ] },
    beach: { n: 'Маршрут №2 «Побережье»', bonus: 400, stops: [
        ['Депо', 433.6, -647.4, 28.7], ['Burton', -258.5, -338.8, 30.0], ['Rockford Hills', -684.8, -381.8, 34.4], ['Del Perro', -1214.5, -603.9, 26.6],
        ['Vespucci Beach', -1167.3, -1452.6, 4.4], ['Vespucci Canals', -1048.8, -1053.1, 2.1], ['Little Seoul', -713.0, -827.0, 23.4], ['Депо (конец)', 450.0, -625.0, 28.5]
    ] },
    sandy: { n: 'Маршрут №3 «Междугородний»', bonus: 900, stops: [
        ['Депо', 433.6, -647.4, 28.7], ['Mirror Park', 1043.2, -479.4, 63.9], ['Route 68', 1205.8, 2683.7, 37.7], ['Harmony', 557.6, 2680.6, 42.1],
        ['Sandy Shores', 1852.0, 3696.8, 34.2], ['Grapeseed', 1697.2, 4850.2, 42.0], ['Route 68 (обратно)', 1183.2, 2700.4, 37.9], ['Депо (конец)', 450.0, -625.0, 28.5]
    ] }
};
const BUS_STOP_PAY = 20;

function V(x, y, z) { return new mp.Vector3(x, y, z); }
function accOf(p) { return p.account || p.admAcc || null; }
function key(p) { const a = accOf(p); return a && a.id ? 'a' + a.id : 'n' + p.name; }
function rec(p) { const k = key(p); if (!store[k]) store[k] = { job: null, earned: {}, done: {} }; return store[k]; }
function notify(p, type, text) { if (typeof global.hudNotify === 'function') global.hudNotify(p, type, text); else p.outputChatBox(text); }
function quest(p, title, tasks) { if (typeof global.hudQuest === 'function') global.hudQuest(p, title, tasks); }
function pay(p, sum, jobId) {
    sum = Math.round(sum);
    if (global.MoneySystem) global.MoneySystem.add(p, sum);
    else if (p.account) p.account.money = (Number(p.account.money) || 0) + sum;
    const r = rec(p);
    r.earned[jobId] = (r.earned[jobId] || 0) + sum;
    r.done[jobId] = (r.done[jobId] || 0) + 1;
    dirty = true;
    p.call('job:paid', [sum]);
}
function jobOff(id) { return !!(global.AdminSystem && global.AdminSystem.jobOff && global.AdminSystem.jobOff(id)); }
function hasLic(p, t) {
    return !(global.AdminSystem && global.AdminSystem.licBlocked && global.AdminSystem.licBlocked(p, t));
}
function dist(a, x, y, z) { const dx = a.x - x, dy = a.y - y, dz = a.z - z; return Math.sqrt(dx * dx + dy * dy + dz * dz); }

/* ---------- старт / увольнение ---------- */
function stopJob(p, silent) {
    const s = p.job;
    if (!s) return;
    if (s.veh && mp.vehicles.exists(s.veh)) s.veh.destroy();
    p.job = null;
    p.call('job:state', ['']);
    quest(p, '', []);
    if (!silent) notify(p, 'warn', 'Вы закончили смену: ' + JOBS[s.id].n);
}
if (!store._spots) store._spots = {};
function carSpot(id) { return store._spots[id] || JOBS[id].carPos; }
function jobVeh(p, j, spot) {
    const c = spot || j.carPos;
    const v = mp.vehicles.new(mp.joaat(j.car), V(c.x, c.y, c.z), { heading: c.h, numberPlate: 'JOB' + String(p.id).padStart(4, '0'), dimension: 0, locked: false, engine: false });
    v.jobOwner = p.id;
    v.setVariable('jobVeh', p.id);
    v.setVariable('pub', 1);
    v.spawnPos = { x: c.x, y: c.y, z: c.z, h: c.h };
    setTimeout(function () { if (mp.players.exists(p) && mp.vehicles.exists(v)) try { p.putIntoVehicle(v, 0); } catch (e) {} }, 400);
    return v;
}
function startJob(p, id, opt) {
    const j = JOBS[id];
    if (!j) return 'Нет такой работы';
    if (jobOff(id)) return 'Работа временно отключена администрацией';
    if (p.job) return 'Сначала закончите текущую смену (/quitjob)';
    if (dist(p.position, j.base.x, j.base.y, j.base.z) > 12) return 'Устроиться можно только на месте работы — поставьте метку в телефоне (Карты → Работы)';
    if (j.lic && !hasLic(p, j.lic)) return 'Ваши права отобраны администрацией — работа водителем недоступна';
    if (id === 'bus' && !hasLic(p, 'bus')) return 'Лицензия на автобус отобрана администрацией';
    const s = { id: id, step: 0, since: Date.now() };
    p.job = s;
    if (id === 'farm') { s.carry = 0; nextFarm(p); }
    if (id === 'courier' || id === 'bus') {
        if (id === 'bus') { s.route = ROUTES[opt] ? opt : 'city'; s.stop = 1; }
        s.has = false;
        const saved = store._spots[id];
        const go = function (spot) {
            if (!mp.players.exists(p) || p.job !== s || s.veh) return;
            s.veh = jobVeh(p, j, spot);
            if (id === 'courier') courierPick(p); else busNext(p);
        };
        if (saved) go(saved);
        else {
            s.spotCb = go;
            p.call('job:findSpot', [j.carPos.x, j.carPos.y, j.carPos.z, j.carPos.h]);
            setTimeout(function () { if (s.spotCb) { s.spotCb = null; go(null); } }, 2500);
        }
    }
    notify(p, 'ok', 'Вы начали работу: ' + j.n + '. Закончить — /quitjob или в телефоне');
    return null;
}

mp.events.add('srv:job:spot', function (p, x, y, z, h) {
    const s = p.job;
    if (!s || !s.spotCb) return;
    const cb = s.spotCb; s.spotCb = null;
    x = Number(x); y = Number(y); z = Number(z); h = Number(h);
    const c = JOBS[s.id].carPos;
    if (!isFinite(x) || !isFinite(z) || dist({ x: x, y: y, z: z }, c.x, c.y, c.z) > 120) return cb(null);
    cb({ x: x, y: y, z: z + 0.4, h: isFinite(h) ? h : c.h });
});
mp.events.addCommand('setjobcar', function (p, full) {
    const lv = global.AdminSystem && global.AdminSystem.realLvl ? global.AdminSystem.realLvl(p) : 0;
    if (lv < 5) return p.outputChatBox('!{#e05555}Доступно со Старшей администрации (5)');
    const id = String(full || '').trim().toLowerCase();
    if (!JOBS[id] || !JOBS[id].car) return p.outputChatBox('!{#ffcc66}/setjobcar [courier/bus] — встаньте (или сядьте в машину) на нужное место, лицом к выезду. /setjobcar [работа] reset — сброс');
    const ent = p.vehicle || p;
    store._spots[id] = { x: ent.position.x, y: ent.position.y, z: ent.position.z + 0.3, h: ent.heading !== undefined ? ent.heading : p.heading };
    dirty = true;
    p.outputChatBox('!{#8fd14f}Точка появления транспорта для работы «' + JOBS[id].n + '» сохранена');
});
mp.events.addCommand('resetjobcar', function (p, full) {
    const lv = global.AdminSystem && global.AdminSystem.realLvl ? global.AdminSystem.realLvl(p) : 0;
    if (lv < 5) return;
    delete store._spots[String(full || '').trim().toLowerCase()];
    dirty = true;
    p.outputChatBox('!{#8fd14f}Точка сброшена — транспорт будет ставиться на ближайшую дорогу');
});

/* ---------- ферма ---------- */
function nextFarm(p) {
    const s = p.job;
    if (s.carry >= 5) {
        p.call('job:point', [FARM_DROP.x, FARM_DROP.y, FARM_DROP.z, 2.5, 'Сдать урожай фермеру (E)', 'drop']);
        quest(p, 'Ферма', ['Урожай в руках: ' + s.carry + '/5', 'Отнесите урожай фермеру — метка на карте']);
        return;
    }
    let i;
    do { i = Math.floor(Math.random() * FIELD.length); } while (i === s.last && FIELD.length > 1);
    s.last = i;
    const f = FIELD[i];
    p.call('job:point', [f[0], f[1], f[2], 1.6, 'Собрать урожай (E)', 'pick']);
    quest(p, 'Ферма', ['Соберите урожай: ' + s.carry + '/5', 'Метка на поле — подойдите и нажмите E']);
}

/* ---------- курьер ---------- */
function courierPick(p) {
    const j = JOBS.courier;
    p.job.has = false;
    p.call('job:point', [j.base.x, j.base.y, j.base.z, 2.5, 'Забрать посылку на складе (E)', 'pick']);
    quest(p, 'Курьер', ['Заберите посылку на складе Post OP', 'Фургон — у склада']);
}
function courierDrop(p) {
    const d = COURIER_DEST[Math.floor(Math.random() * COURIER_DEST.length)];
    const s = p.job;
    s.has = true;
    s.dest = d;
    s.price = Math.round(Math.max(60, Math.min(140, 50 + dist(JOBS.courier.base, d[1], d[2], d[3]) / 45)));
    p.call('job:point', [d[1], d[2], d[3], 2.5, 'Доставить посылку (E)', 'drop']);
    quest(p, 'Курьер', ['Доставьте посылку: ' + d[0], 'Оплата: $' + s.price]);
}

/* ---------- автобус ---------- */
function busNext(p) {
    const s = p.job;
    const r = ROUTES[s.route];
    const st = r.stops[s.stop];
    p.call('job:point', [st[1], st[2], st[3], 6, 'Остановка: ' + st[0], 'bus']);
    quest(p, r.n, ['Остановка ' + s.stop + '/' + (r.stops.length - 1) + ': ' + st[0], 'Остановитесь в круге на автобусе — пассажиры сядут сами']);
}

/* ---------- действие игрока в точке ---------- */
mp.events.add('srv:job:here', function (p) {
    const s = p.job;
    if (!s || s.busy) return;
    if (s.id === 'farm') {
        if (p.vehicle) return notify(p, 'warn', 'Выйдите из транспорта');
        if (s.carry >= 5) {
            if (dist(p.position, FARM_DROP.x, FARM_DROP.y, FARM_DROP.z) > 4) return;
            const sum = s.carry * (15 + Math.floor(Math.random() * 11));
            s.carry = 0;
            pay(p, sum, 'farm');
            notify(p, 'ok', 'Фермер заплатил $' + sum);
            return nextFarm(p);
        }
        const f = FIELD[s.last];
        if (!f || dist(p.position, f[0], f[1], f[2]) > 3) return;
        s.busy = true;
        p.call('job:anim', ['pick', 4000]);
        setTimeout(function () {
            if (!mp.players.exists(p) || p.job !== s) return;
            s.busy = false;
            s.carry++;
            notify(p, 'ok', 'Собрано: ' + s.carry + '/5');
            nextFarm(p);
        }, 4000);
    } else if (s.id === 'courier') {
        if (p.vehicle) return notify(p, 'warn', 'Выйдите из фургона и подойдите пешком');
        if (!s.has) {
            if (dist(p.position, JOBS.courier.base.x, JOBS.courier.base.y, JOBS.courier.base.z) > 4) return;
            s.busy = true;
            p.call('job:anim', ['box', 2500]);
            setTimeout(function () { if (mp.players.exists(p) && p.job === s) { s.busy = false; courierDrop(p); notify(p, 'ok', 'Посылка у вас. Адрес отмечен на карте'); } }, 2500);
        } else {
            const d = s.dest;
            if (dist(p.position, d[1], d[2], d[3]) > 4) return;
            s.busy = true;
            p.call('job:anim', ['give', 2000]);
            setTimeout(function () {
                if (!mp.players.exists(p) || p.job !== s) return;
                s.busy = false;
                pay(p, s.price, 'courier');
                notify(p, 'ok', 'Доставлено! +$' + s.price);
                courierPick(p);
            }, 2000);
        }
    }
});
setInterval(function () {
    mp.players.forEach(function (p) {
        const s = p.job;
        if (!s || s.id !== 'bus' || s.busy) return;
        const v = p.vehicle;
        if (!v || v !== s.veh) return;
        const r = ROUTES[s.route];
        const st = r.stops[s.stop];
        if (dist(v.position, st[1], st[2], st[3]) > 7) return;
        s.busy = true;
        notify(p, 'ok', 'Остановка «' + st[0] + '» — посадка пассажиров…');
        p.call('job:busStop', [5000]);
        setTimeout(function () {
            if (!mp.players.exists(p) || p.job !== s) return;
            s.busy = false;
            pay(p, BUS_STOP_PAY, 'bus');
            s.stop++;
            if (s.stop >= r.stops.length) {
                pay(p, r.bonus, 'bus');
                notify(p, 'ok', 'Маршрут пройден! Бонус $' + r.bonus + '. Начинаем новый круг');
                s.stop = 1;
            }
            busNext(p);
        }, 5000);
    });
}, 700);

/* ---------- потеря машины / выход ---------- */
mp.events.add('playerExitVehicle', function (p, v) {
    const s = p.job;
    if (!s || !s.veh || v !== s.veh || s.id !== 'bus') return;
    notify(p, 'warn', 'Вернитесь в автобус в течение 60 секунд, иначе смена закончится');
    s.leftAt = Date.now();
});
mp.events.add('playerEnterVehicle', function (p, v) {
    if (p.job && v === p.job.veh) p.job.leftAt = 0;
    if (v.jobOwner !== undefined && v.jobOwner !== p.id && p.seat === 0) { try { p.removeFromVehicle(); } catch (e) {} notify(p, 'warn', 'Это рабочий транспорт другого игрока'); }
});
setInterval(function () {
    mp.players.forEach(function (p) {
        const s = p.job;
        if (!s) return;
        if (jobOff(s.id)) { stopJob(p, true); return notify(p, 'warn', 'Работа отключена администрацией'); }
        if (s.veh && !mp.vehicles.exists(s.veh)) { stopJob(p, true); return notify(p, 'warn', 'Рабочий транспорт пропал — смена окончена'); }
        if (s.leftAt && Date.now() - s.leftAt > 60000) stopJob(p);
    });
}, 3000);
mp.events.add('playerQuit', function (p) { stopJob(p, true); });
mp.events.add('playerDeath', function (p) { if (p.job) stopJob(p); });

/* ---------- старт у NPC/места ---------- */
mp.events.add('srv:job:base', function (p, id) {
    const j = JOBS[id];
    if (!j) return;
    if (dist(p.position, j.base.x, j.base.y, j.base.z) > 12) return;
    p.call('job:menu', [JSON.stringify(menuData(p, id))]);
});
function menuData(p, id) {
    const j = JOBS[id], r = rec(p);
    return {
        id: id, n: j.n, i: j.i, d: j.d, pay: j.pay, off: jobOff(id), working: p.job ? p.job.id : null,
        earned: r.earned[id] || 0, done: r.done[id] || 0,
        routes: id === 'bus' ? Object.keys(ROUTES).map(function (k) { return { id: k, n: ROUTES[k].n, stops: ROUTES[k].stops.length - 1, bonus: ROUTES[k].bonus }; }) : null
    };
}
mp.events.add('srv:job:start', function (p, id, opt) {
    const e = startJob(p, String(id), String(opt || ''));
    if (e) notify(p, 'error', e);
    p.call('job:menuClose');
});
mp.events.add('srv:job:quit', function (p) { stopJob(p); });
mp.events.addCommand('quitjob', function (p) { if (!p.job) return notify(p, 'warn', 'Вы не на смене'); stopJob(p); });
mp.events.addCommand('jobs', function (p) {
    p.outputChatBox('!{#8fd14f}Работы для новичков (метки в телефоне → Карты → Работы):');
    Object.keys(JOBS).forEach(function (k) { const j = JOBS[k]; p.outputChatBox('!{#ffffff}' + j.i + ' ' + j.n + ' — ' + j.pay + (jobOff(k) ? ' !{#e05555}(закрыто)' : '')); });
});

/* ---------- для телефона ---------- */
function phoneJobs(p) {
    const r = rec(p);
    return {
        working: p.job ? { id: p.job.id, n: JOBS[p.job.id].n, since: p.job.since } : null,
        list: Object.keys(JOBS).map(function (k) { const j = JOBS[k]; return { id: k, n: j.n, i: j.i, d: j.d, pay: j.pay, off: jobOff(k), earned: r.earned[k] || 0, done: r.done[k] || 0, x: j.base.x, y: j.base.y }; }),
        total: Object.keys(r.earned).reduce(function (s, k) { return s + r.earned[k]; }, 0)
    };
}
mp.events.add('srv:job:gps', function (p, id) {
    const j = JOBS[id];
    if (j) p.call('phone:gps', [j.base.x, j.base.y, j.n]);
});
mp.events.add('srv:job:phone', function (p) { p.call('job:phone', [JSON.stringify(phoneJobs(p))]); });

/* ---------- метки на карте ---------- */
function sendBases(p) {
    const list = Object.keys(JOBS).map(function (k) { const j = JOBS[k]; return [k, j.n, j.base.x, j.base.y, j.base.z, j.blip, j.color]; });
    p.call('job:bases', [JSON.stringify(list)]);
}
mp.events.add('playerReady', function (p) { setTimeout(function () { if (mp.players.exists(p)) sendBases(p); }, 4000); });
setTimeout(function () { mp.players.forEach(sendBases); }, 3000);

global.JobSystem = { JOBS: JOBS, stop: stopJob, phone: phoneJobs, current: function (p) { return p.job ? p.job.id : null; } };
console.log('[jobs] работы загружены: ' + Object.keys(JOBS).join(', '));
