const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'jobs_data.json');
const store = (function () { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { return {}; } })();
let dirty = false;
setInterval(function () { if (dirty) { dirty = false; try { fs.writeFileSync(FILE, JSON.stringify(store)); } catch (e) {} } }, 10000);

const JOBS = {
    farm: {
        n: 'Ферма', i: '🌾', lvl: 0, pay: 'от 12$ за единицу урожая', d: 'Собирай урожай и сдавай фермеру. С каждым уровнем мастерства открываются новые культуры — дороже и сложнее в сборе.',
        base: { x: 2029.8, y: 4980.6, z: 42.1 }, blip: 85, color: 2
    },
    courier: {
        n: 'Курьер', i: '📦', lvl: 0, pay: '60–140$ за доставку + бонус за полный фургон', d: 'Отсортируй посылки на складе Post OP, загрузи до 4 ящиков в фургон и развези по адресам. Чем дальше адрес — тем выше оплата.',
        base: { x: -424.9, y: -2789.4, z: 6.0 }, blip: 478, color: 5, car: 'boxville2', carPos: { x: -431.6, y: -2794.6, z: 5.6, h: 45 }
    },
    bus: {
        n: 'Водитель автобуса', i: '🚌', lvl: 0, pay: 'от 14$ за остановку + бонус за круг', d: 'Возьми автобус в депо и проезжай остановки: мэрия, полиция, больницы. Чем больше остановок за плечами — тем длиннее и дороже маршруты.',
        base: { x: 453.2, y: -600.9, z: 28.6 }, blip: 513, color: 3, car: 'bus', carPos: { x: 462.2, y: -605.5, z: 28.5, h: 214 }, lic: 'drive'
    }
};

const FARM_DROP = { x: 2029.8, y: 4980.6, z: 42.1 };

const FARM_LV = [0, 40, 120, 280, 550];
const BUS_LV = [0, 30, 90, 200, 400];
const MASTER = [1, 1.15, 1.3, 1.5, 1.75];

function grid(cx, cy, z, rows, cols, step) {
    const out = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const u = (r - (rows - 1) / 2) * step, w = (c - (cols - 1) / 2) * step;
        out.push([cx + (u + w) * 0.7071, cy + (w - u) * 0.7071, z]);
    }
    return out;
}
const CROPS = {
    lettuce: { n: 'Салат', i: '🥬', lvl: 1, ms: 3000, cap: 6, pay: [12, 16], qte: 0, model: 'prop_veg_crop_04_leaf', field: grid(2026.5, 4918.0, 41.0, 3, 5, 8) },
    cabbage: { n: 'Капуста', i: '🥦', lvl: 2, ms: 3500, cap: 6, pay: [18, 24], qte: 0, model: 'prop_veg_crop_03_cab', field: grid(2049.0, 4895.0, 41.0, 3, 5, 7) },
    corn: { n: 'Кукуруза', i: '🌽', lvl: 3, ms: 4000, cap: 8, pay: [26, 34], qte: 1, model: 'prop_veg_corn_01', field: grid(2004.0, 4941.0, 41.0, 3, 5, 7) },
    pumpkin: { n: 'Тыква', i: '🎃', lvl: 4, ms: 4500, cap: 5, pay: [58, 72], qte: 2, model: 'prop_veg_crop_03_pump_01', field: grid(2071.0, 4873.0, 41.0, 3, 4, 8) },
    orange: { n: 'Апельсины', i: '🍊', lvl: 5, ms: 5000, cap: 10, pay: [44, 54], qte: 3, model: 'prop_veg_crop_orange', field: grid(1982.0, 4963.0, 42.0, 3, 4, 9) }
};
if (!store._fields) store._fields = {};
function cropField(k) { const f = store._fields[k]; return f && f.length >= 3 ? f : CROPS[k].field; }

const COURIER_DEST = [
    ['Vinewood Hills, особняк', -1286.4, 438.1, 97.4], ['Rockford Hills, офис', -1379.8, -478.3, 31.6], ['Del Perro, кафе', -1197.0, -891.3, 13.9],
    ['Vespucci, пляжный дом', -1149.6, -1521.9, 4.4], ['Little Seoul, магазин', -712.5, -916.4, 19.2], ['Mission Row, аптека', 316.0, -1078.3, 29.4],
    ['Strawberry, гараж', 247.6, -1373.4, 29.6], ['Mirror Park, дом', 1265.1, -703.8, 64.6], ['La Mesa, мастерская', 728.3, -1088.9, 22.2],
    ['Davis, частный дом', 115.9, -1945.2, 20.7], ['Burton, бутик', -159.5, -305.4, 39.7], ['Pillbox, клиника', 357.4, -593.7, 28.8],
    ['Downtown, небоскрёб', -70.4, -800.5, 44.2], ['Textile City, склад', 431.9, -808.9, 29.5], ['Chamberlain Hills, дом', -150.5, -1622.6, 33.7]
];

const DEPOT = ['Автовокзал (депо)', 433.6, -647.4, 28.7];
const DEPOT_END = ['Депо — конец круга', 450.0, -625.0, 28.5];
const ROUTES = {
    r1: { n: '№1 «Центр»', lvl: 1, stopPay: 14, bonus: 120, stops: [
        DEPOT, ['Больница Pillbox', 298.0, -603.0, 43.0], ['Legion Square', 237.3, -862.0, 29.9], ['ЛСПД Mission Row', 404.4, -995.4, 29.3], DEPOT_END
    ] },
    r2: { n: '№2 «Мэрия»', lvl: 2, stopPay: 20, bonus: 260, stops: [
        DEPOT, ['Больница Pillbox', 298.0, -603.0, 43.0], ['Burton', -258.5, -338.8, 30.0], ['Мэрия', -520.0, -263.0, 35.5],
        ['Little Seoul', -713.0, -827.0, 23.4], ['Legion Square', 237.3, -862.0, 29.9], ['ЛСПД Mission Row', 404.4, -995.4, 29.3], DEPOT_END
    ] },
    r3: { n: '№3 «Больницы и полиция»', lvl: 3, stopPay: 26, bonus: 450, stops: [
        DEPOT, ['ЛСПД Mission Row', 404.4, -995.4, 29.3], ['Больница Central LS', 297.0, -1390.0, 31.8], ['Шериф Davis', 370.0, -1600.0, 29.3],
        ['ЛСПД Vespucci', -1075.0, -790.0, 19.2], ['Del Perro', -1214.5, -603.9, 26.6], ['Мэрия', -520.0, -263.0, 35.5],
        ['Больница Pillbox', 298.0, -603.0, 43.0], DEPOT_END
    ] },
    r4: { n: '№4 «Междугородний»', lvl: 4, stopPay: 45, bonus: 1200, stops: [
        DEPOT, ['Mirror Park', 1043.2, -479.4, 63.9], ['Route 68', 1205.8, 2683.7, 37.7], ['Больница Sandy Shores', 1830.0, 3680.0, 34.2],
        ['Шериф Sandy Shores', 1853.0, 3700.0, 34.0], ['Grapeseed', 1697.2, 4850.2, 42.0], ['Шериф Paleto Bay', -440.0, 6030.0, 31.3],
        ['Больница Paleto Bay', -240.0, 6320.0, 31.4], ['Great Ocean Hwy', -2190.0, 4280.0, 49.0], ['Del Perro', -1214.5, -603.9, 26.6],
        ['Мэрия', -520.0, -263.0, 35.5], DEPOT_END
    ] }
};
if (!store._routes) store._routes = {};
function routeStops(k) { const c = store._routes[k]; return c && c.length >= 3 ? c : ROUTES[k].stops; }

function V(x, y, z) { return new mp.Vector3(x, y, z); }
function accOf(p) { return p.account || p.admAcc || null; }
function key(p) { const a = accOf(p); return a && a.id ? 'a' + a.id : 'n' + p.name; }
function rec(p) { const k = key(p); if (!store[k]) store[k] = { job: null, earned: {}, done: {} }; if (!store[k].xp) store[k].xp = {}; return store[k]; }
function lvlInfo(p, id) {
    const T = id === 'farm' ? FARM_LV : id === 'bus' ? BUS_LV : (JOBS[id] && JOBS[id].lv) || null;
    if (!T) return null;
    const r = rec(p);
    if (r.xp[id] === undefined) r.xp[id] = id === 'farm' ? (r.done.farm || 0) * 5 : (r.done[id] || 0);
    const xp = r.xp[id];
    let l = 1;
    for (let i = 0; i < T.length; i++) if (xp >= T[i]) l = i + 1;
    return { lvl: l, xp: xp, cur: T[l - 1], next: T[l] === undefined ? null : T[l], max: T.length, mult: MASTER[l - 1] };
}
function addXp(p, id, n) {
    const before = lvlInfo(p, id).lvl;
    rec(p).xp[id] += n;
    dirty = true;
    const now = lvlInfo(p, id);
    if (now.lvl > before) {
        notify(p, 'ok', 'Новый уровень мастерства: ' + now.lvl + '! Оплата ×' + now.mult.toFixed(2) + (id === 'farm' ? '. Открыта новая культура' : '. Открыт новый маршрут'));
        if (global.SLog) global.SLog.add('job', { actor: p, action: 'level-up', details: id + ' → ' + now.lvl });
    }
}
function notify(p, type, text) { if (typeof global.hudNotify === 'function') global.hudNotify(p, type, text); else p.outputChatBox(text); }
function quest(p, title, tasks) { if (typeof global.hudQuest === 'function') global.hudQuest(p, title, tasks); }
function pay(p, sum, jobId) {
    sum = Math.round(sum);
    if (global.Treasury) sum -= global.Treasury.jobTax(sum);
    if (global.MoneySystem) global.MoneySystem.add(p, sum);
    else if (p.account) p.account.money = (Number(p.account.money) || 0) + sum;
    const r = rec(p);
    r.earned[jobId] = (r.earned[jobId] || 0) + sum;
    r.done[jobId] = (r.done[jobId] || 0) + 1;
    dirty = true;
    p.call('job:paid', [sum]);
    if (global.QuestSystem) try { global.QuestSystem.onJob(p, jobId); } catch (e) {}
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
    if (JOBS[s.id] && JOBS[s.id].stop) try { JOBS[s.id].stop(p, s); } catch (e) {}
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
    if (j.start) { const er = j.start(p, s, opt); if (er) { p.job = null; return er; } notify(p, 'ok', 'Вы начали работу: ' + j.n + '. Закончить — /quitjob или в телефоне'); return null; }
    if (id === 'farm') {
        const lv = lvlInfo(p, 'farm').lvl;
        const ck = CROPS[opt] ? opt : 'lettuce';
        if (CROPS[ck].lvl > lv) { p.job = null; return 'Культура «' + CROPS[ck].n + '» откроется на ' + CROPS[ck].lvl + ' уровне мастерства'; }
        s.crop = ck; s.carry = 0; s.units = [];
        nextFarm(p);
    }
    if (id === 'courier' || id === 'bus') {
        if (id === 'bus') {
            const lv = lvlInfo(p, 'bus').lvl;
            const rk = ROUTES[opt] ? opt : 'r1';
            if (ROUTES[rk].lvl > lv) { p.job = null; return 'Маршрут ' + ROUTES[rk].n + ' откроется на ' + ROUTES[rk].lvl + ' уровне мастерства'; }
            s.route = rk; s.stop = 1;
        }
        s.has = false;
        if (id === 'courier') { s.loaded = []; s.hands = null; }
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
    const c = CROPS[s.crop];
    if (s.carry >= c.cap) {
        p.call('job:point', [FARM_DROP.x, FARM_DROP.y, FARM_DROP.z, 2.5, 'Сдать урожай фермеру (E)', 'drop', '']);
        quest(p, 'Ферма · ' + c.n, ['Урожай: ' + s.carry + '/' + c.cap, 'Отнесите урожай фермеру — метка на карте']);
        return;
    }
    const F = cropField(s.crop);
    let i;
    do { i = Math.floor(Math.random() * F.length); } while (i === s.last && F.length > 1);
    s.last = i;
    const f = F[i];
    s.pt = f;
    p.call('job:point', [f[0], f[1], f[2], 1.6, 'Собрать: ' + c.n + ' (E)', 'pick', c.model]);
    quest(p, 'Ферма · ' + c.n, ['Собрано: ' + s.carry + '/' + c.cap, c.qte ? 'Нажмите E, когда ползунок в зелёной зоне' : 'Подойдите к растению и нажмите E']);
}
function farmPicked(p, s, ok) {
    const c = CROPS[s.crop];
    s.busy = false; s.qte = null;
    if (!ok) { notify(p, 'warn', c.n + ': растение повреждено, урожай пропал'); return nextFarm(p); }
    s.carry++;
    s.units.push(c.pay[0] + Math.random() * (c.pay[1] - c.pay[0]));
    addXp(p, 'farm', 1);
    notify(p, 'ok', c.i + ' ' + c.n + ': ' + s.carry + '/' + c.cap);
    if (Math.random() < 0.03 && global.UiSystem) {
        const left = global.UiSystem.addItem(p, 'ukrop_seed', 1);
        if (!left) { global.UiSystem.sendInv(p); notify(p, 'warn', '🌱 Среди урожая вы нашли странное семечко… (семена укропа)'); }
    }
    nextFarm(p);
}
mp.events.add('srv:job:qte', function (p, ok) {
    const s = p.job;
    if (!s || s.id !== 'farm' || !s.qte) return;
    clearTimeout(s.qte);
    farmPicked(p, s, !!ok && ok !== 'false' && ok !== '0');
});

/* ---------- курьер ---------- */
const VAN_CAP = 4;
function vanRear(v) {
    const h = (v.heading || 0) * Math.PI / 180;
    return { x: v.position.x + Math.sin(h) * 4.3, y: v.position.y - Math.cos(h) * 4.3, z: v.position.z };
}
function nearRear(p, s) {
    if (!s.veh || !mp.vehicles.exists(s.veh)) return false;
    const r = vanRear(s.veh);
    return Math.hypot(p.position.x - r.x, p.position.y - r.y) < 3 && Math.abs(p.position.z - r.z) < 3;
}
function courierPick(p) {
    const j = JOBS.courier;
    const s = p.job;
    s.phase = 'load';
    if (!s.loaded) s.loaded = [];
    s.hands = null;
    if (s.veh && mp.vehicles.exists(s.veh)) p.call('job:van', [s.veh.id]);
    p.call('job:point', [j.base.x, j.base.y, j.base.z, 2.5, 'Отсортировать и взять ящик (E)', 'pick', '']);
    quest(p, 'Курьер · погрузка', ['В фургоне: ' + s.loaded.length + '/' + VAN_CAP, 'Возьмите ящик на складе (E) и отнесите к задним дверям фургона',
        s.loaded.length ? 'Можно ехать — просто сядьте за руль' : 'Полный фургон = бонус 15%']);
}
function courierToTrunk(p) {
    const s = p.job;
    const r = vanRear(s.veh);
    p.call('job:point', [r.x, r.y, r.z, 1.4, 'Погрузить ящик в фургон (E)', 'trunk', '']);
    quest(p, 'Курьер · погрузка', ['Ящик в руках — несите к задним дверям фургона', 'В фургоне: ' + s.loaded.length + '/' + VAN_CAP, 'С ящиком в руках за руль сесть нельзя']);
}
function dp(s) { const d = s.dest; return s.destFix && s.destFix.d === d ? s.destFix : { x: d[1], y: d[2], z: d[3] }; }
mp.events.add('srv:job:dropfix', function (p, x, y, z) {
    const s = p.job;
    if (!s || s.id !== 'courier' || !s.dest) return;
    x = Number(x); y = Number(y); z = Number(z);
    if (!isFinite(x) || !isFinite(y) || !isFinite(z)) return;
    if (Math.hypot(s.dest[1] - x, s.dest[2] - y) > 70) return;
    s.destFix = { x: x, y: y, z: z, d: s.dest };
});
function courierRoute(p) {
    const s = p.job;
    s.phase = 'deliver';
    if (!s.loaded.length) return courierPick(p);
    const pos = s.veh && mp.vehicles.exists(s.veh) ? s.veh.position : p.position;
    s.loaded.sort(function (a, b) { return dist(pos, a.d[1], a.d[2], a.d[3]) - dist(pos, b.d[1], b.d[2], b.d[3]); });
    const t = s.loaded[0];
    if (s.dest !== t.d) s.destFix = null;
    s.dest = t.d; s.price = t.price;
    if (s.hands === 'deliver') {
        p.call('job:point', [dp(s).x, dp(s).y, dp(s).z, 2.5, 'Отдать посылку (E)', 'drop', s.destFix ? 'fixed' : 'snap']);
        quest(p, 'Курьер · доставка', ['Отнесите посылку: ' + t.d[0], 'Оплата: $' + t.price]);
    } else {
        p.call('job:point', [dp(s).x, dp(s).y, dp(s).z, 2.5, 'Адрес: ' + t.d[0], 'drop', s.destFix ? 'fixed' : 'snap']);
        quest(p, 'Курьер · доставка', ['Адрес: ' + t.d[0] + ' ($' + t.price + ')', 'На месте достаньте посылку из задних дверей фургона (E)', 'Осталось посылок: ' + s.loaded.length]);
    }
}
function newParcel(s) {
    let d, tries = 0;
    do { d = COURIER_DEST[Math.floor(Math.random() * COURIER_DEST.length)]; tries++; }
    while (tries < 20 && s.loaded.some(function (x) { return x.d === d; }));
    return { d: d, price: Math.round(Math.max(60, Math.min(140, 50 + dist(JOBS.courier.base, d[1], d[2], d[3]) / 45))) };
}
mp.events.add('srv:job:boxres', function (p, ok) {
    const s = p.job;
    if (!s || s.id !== 'courier' || !s.sorting) return;
    clearTimeout(s.sorting); s.sorting = null; s.busy = false;
    if (!ok || ok === '0' || ok === 'false') { notify(p, 'warn', 'Посылка ушла не в ту ячейку — попробуйте ещё раз'); return; }
    s.hands = 'load';
    p.call('job:anim', ['box', 0]);
    courierToTrunk(p);
});
mp.events.add('srv:job:trunk', function (p) {
    const s = p.job;
    if (!s || s.id !== 'courier' || s.busy || p.vehicle) return;
    if (!nearRear(p, s)) return;
    if (s.phase === 'load' && s.hands === 'load') {
        s.busy = true;
        p.call('job:anim', ['put', 1200]);
        setTimeout(function () {
            if (!mp.players.exists(p) || p.job !== s) return;
            s.busy = false; s.hands = null;
            s.loaded.push(newParcel(s));
            notify(p, 'ok', '📦 Ящик в фургоне: ' + s.loaded.length + '/' + VAN_CAP);
            if (s.loaded.length >= VAN_CAP) { notify(p, 'ok', 'Фургон полный! Садитесь за руль'); courierRoute(p); }
            else courierPick(p);
        }, 1200);
    } else if (s.phase === 'deliver' && !s.hands) {
        const d = s.dest;
        if (!d || Math.hypot(s.veh.position.x - dp(s).x, s.veh.position.y - dp(s).y) > 60) return notify(p, 'warn', 'Подъедьте ближе к адресу доставки');
        s.busy = true;
        p.call('job:anim', ['box', 0]);
        setTimeout(function () { if (!mp.players.exists(p) || p.job !== s) return; s.busy = false; s.hands = 'deliver'; courierRoute(p); }, 700);
    } else if (s.phase === 'deliver' && s.hands === 'deliver') {
        s.busy = true;
        p.call('job:anim', ['put', 1200]);
        setTimeout(function () { if (!mp.players.exists(p) || p.job !== s) return; s.busy = false; s.hands = null; notify(p, 'warn', 'Посылка возвращена в фургон'); courierRoute(p); }, 1200);
    }
});

/* ---------- автобус ---------- */
function busNext(p) {
    const s = p.job;
    const r = ROUTES[s.route];
    const S = routeStops(s.route);
    const st = S[s.stop];
    s.cur = { n: st[0], x: st[1], y: st[2], z: st[3], ox: st[1], oy: st[2] };
    p.call('job:point', [st[1], st[2], st[3], 7, 'Остановка: ' + st[0], 'bus', store._routes[s.route] ? 'nosnap' : '']);
    const nx = S[s.stop + 1];
    quest(p, 'Автобус ' + r.n, ['Остановка ' + s.stop + '/' + (S.length - 1) + ': ' + st[0], nx ? 'Следующая: ' + nx[0] : 'Последняя — возврат в депо', 'Остановитесь в круге — пассажиры сядут сами']);
}
mp.events.add('srv:job:busfix', function (p, x, y, z) {
    const s = p.job;
    if (!s || s.id !== 'bus' || !s.cur) return;
    x = Number(x); y = Number(y); z = Number(z);
    if (!isFinite(x) || !isFinite(y) || !isFinite(z)) return;
    if (Math.hypot(s.cur.ox - x, s.cur.oy - y) > 80) return;
    s.cur.x = x; s.cur.y = y; s.cur.z = z;
});

/* ---------- действие игрока в точке ---------- */
mp.events.add('srv:job:here', function (p) {
    const s = p.job;
    if (!s || s.busy) return;
    if (JOBS[s.id] && JOBS[s.id].here) return JOBS[s.id].here(p, s);
    if (s.id === 'farm') {
        if (p.vehicle) return notify(p, 'warn', 'Выйдите из транспорта');
        const c = CROPS[s.crop];
        if (s.carry >= c.cap) {
            if (dist(p.position, FARM_DROP.x, FARM_DROP.y, FARM_DROP.z) > 4) return;
            const lv = lvlInfo(p, 'farm');
            const sum = Math.round(s.units.reduce(function (a, b) { return a + b; }, 0) * lv.mult);
            const n = s.carry;
            s.carry = 0; s.units = [];
            pay(p, sum, 'farm');
            notify(p, 'ok', 'Фермер заплатил $' + sum + ' за ' + n + ' шт. (' + c.n + ', ур. ' + lv.lvl + ', ×' + lv.mult.toFixed(2) + ')');
            return nextFarm(p);
        }
        const f = s.pt;
        if (!f || Math.hypot(p.position.x - f[0], p.position.y - f[1]) > 3) return;
        s.busy = true;
        p.call('job:anim', ['pick', c.ms]);
        setTimeout(function () {
            if (!mp.players.exists(p) || p.job !== s) return;
            if (!c.qte) return farmPicked(p, s, true);
            p.call('job:qte', [c.qte]);
            s.qte = setTimeout(function () { if (mp.players.exists(p) && p.job === s) farmPicked(p, s, false); }, 9000);
        }, c.ms);
    } else if (s.id === 'courier') {
        if (p.vehicle) return notify(p, 'warn', 'Выйдите из фургона и подойдите пешком');
        if (s.phase === 'load') {
            if (s.hands) return notify(p, 'warn', 'Сначала погрузите ящик в фургон');
            if (s.loaded.length >= VAN_CAP) return notify(p, 'warn', 'Фургон полный — садитесь за руль');
            if (dist(p.position, JOBS.courier.base.x, JOBS.courier.base.y, JOBS.courier.base.z) > 4) return;
            s.busy = true;
            const n = 3 + Math.min(3, Math.floor(s.loaded.length / 2) + Math.floor(Math.random() * 2));
            p.call('job:sort', [n]);
            s.sorting = setTimeout(function () { if (mp.players.exists(p) && p.job === s && s.sorting) { s.sorting = null; s.busy = false; } }, 15000);
        } else {
            const d = s.dest;
            if (!d) return;
            const pt = dp(s);
            if (Math.hypot(p.position.x - pt.x, p.position.y - pt.y) > 4.5) return;
            if (s.hands !== 'deliver') return notify(p, 'warn', 'Сначала достаньте посылку из задних дверей фургона');
            s.busy = true;
            p.call('job:anim', ['give', 2000]);
            setTimeout(function () {
                if (!mp.players.exists(p) || p.job !== s) return;
                s.busy = false; s.hands = null;
                const it = s.loaded.shift();
                let sum = it.price;
                if (s.fullRun) sum = Math.round(sum * 1.15);
                pay(p, sum, 'courier');
                notify(p, 'ok', 'Доставлено! +$' + sum + (s.fullRun ? ' (бонус за полный фургон)' : ''));
                if (s.loaded.length) courierRoute(p);
                else { s.fullRun = false; notify(p, 'ok', 'Все посылки доставлены — возвращайтесь на склад'); courierPick(p); }
            }, 2000);
        }
    }
});
function busArrive(p, cx, cy) {
    const s = p.job;
    if (!s || s.id !== 'bus' || s.busy) return;
    const v = p.vehicle;
    if (!v || !s.veh || !mp.vehicles.exists(s.veh) || v.id !== s.veh.id) return;
    const r = ROUTES[s.route];
    const S = routeStops(s.route);
    const st = s.cur;
    if (!st) return;
    let ok = Math.hypot(v.position.x - st.x, v.position.y - st.y) <= 12 || Math.hypot(v.position.x - st.ox, v.position.y - st.oy) <= 12;
    if (!ok && isFinite(cx) && isFinite(cy) && Math.hypot(cx - st.ox, cy - st.oy) <= 80 && Math.hypot(v.position.x - cx, v.position.y - cy) <= 14) ok = true;
    if (!ok) return;
    let spd = 0;
    try { spd = v.velocity ? Math.hypot(v.velocity.x, v.velocity.y) : 0; } catch (e) {}
    if (spd > 5) return;
    s.busy = true;
    notify(p, 'ok', 'Остановка «' + st.n + '» — посадка пассажиров…');
    p.call('job:busStop', [5000]);
    setTimeout(function () {
        if (!mp.players.exists(p) || p.job !== s) return;
        s.busy = false;
        const lv = lvlInfo(p, 'bus');
        pay(p, r.stopPay * lv.mult, 'bus');
        addXp(p, 'bus', 1);
        s.stop++;
        if (s.stop >= S.length) {
            const b = Math.round(r.bonus * lvlInfo(p, 'bus').mult);
            pay(p, b, 'bus');
            notify(p, 'ok', 'Круг пройден! Бонус $' + b + '. Начинаем новый круг');
            s.stop = 1;
        }
        busNext(p);
    }, 5000);
}
mp.events.add('srv:job:busAt', function (p, x, y) {
    if (p._busAt && Date.now() - p._busAt < 800) return;
    p._busAt = Date.now();
    busArrive(p, Number(x), Number(y));
});
setInterval(function () { mp.players.forEach(function (p) { if (p.job && p.job.id === 'bus') busArrive(p, NaN, NaN); }); }, 700);

/* ---------- потеря машины / выход ---------- */
mp.events.add('playerExitVehicle', function (p, v) {
    const s = p.job;
    if (!s || !s.veh || v !== s.veh || s.id !== 'bus') return;
    notify(p, 'warn', 'Вернитесь в автобус в течение 60 секунд, иначе смена закончится');
    s.leftAt = Date.now();
});
mp.events.add('playerEnterVehicle', function (p, v) {
    if (p.job && v === p.job.veh) p.job.leftAt = 0;
    const cs = p.job;
    if (cs && cs.id === 'courier' && v === cs.veh) {
        if (cs.hands) { try { p.removeFromVehicle(); } catch (e) {} notify(p, 'warn', 'Сначала положите ящик в фургон'); return; }
        if (cs.phase === 'load' && cs.loaded && cs.loaded.length) { cs.fullRun = cs.loaded.length >= VAN_CAP; courierRoute(p); }
    }
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

/* ---------- настройка полей и маршрутов (админ 5+) ---------- */
function admLv(p) { return global.AdminSystem && global.AdminSystem.realLvl ? global.AdminSystem.realLvl(p) : 0; }
mp.events.addCommand('farmpt', function (p, full) {
    if (admLv(p) < 5) return p.outputChatBox('!{#e05555}Доступно со Старшей администрации (5)');
    const a = String(full || '').trim().split(/\s+/);
    const k = a[0];
    if (!CROPS[k]) return p.outputChatBox('!{#ffcc66}/farmpt [' + Object.keys(CROPS).join('/') + '] — добавить точку грядки здесь. /farmpt [культура] clear — вернуть стандартное поле');
    if (a[1] === 'clear') { delete store._fields[k]; dirty = true; return p.outputChatBox('!{#8fd14f}Поле «' + CROPS[k].n + '» сброшено к стандартному'); }
    const L = store._fields[k] || (store._fields[k] = []);
    L.push([p.position.x, p.position.y, p.position.z]);
    dirty = true;
    p.outputChatBox('!{#8fd14f}Точка ' + L.length + ' для «' + CROPS[k].n + '» добавлена' + (L.length < 3 ? ' (поле включится от 3 точек)' : ''));
});
mp.events.addCommand('busstop', function (p, full) {
    if (admLv(p) < 5) return p.outputChatBox('!{#e05555}Доступно со Старшей администрации (5)');
    const m = String(full || '').trim().match(/^(\S+)\s*(.*)$/);
    const k = m && m[1];
    if (!k || !ROUTES[k]) return p.outputChatBox('!{#ffcc66}/busstop [r1-r4] [название] — добавить остановку на месте автобуса (по порядку). /busstop [маршрут] clear — сброс, /busstop [маршрут] list — список');
    const arg = m[2];
    if (arg === 'clear') { delete store._routes[k]; dirty = true; return p.outputChatBox('!{#8fd14f}Маршрут ' + ROUTES[k].n + ' сброшен к стандартному'); }
    if (arg === 'list') return routeStops(k).forEach(function (st, i) { p.outputChatBox('!{#ffffff}' + i + '. ' + st[0] + ' !{#888}(' + st[1].toFixed(1) + ', ' + st[2].toFixed(1) + ')'); });
    if (!arg) return p.outputChatBox('!{#ffcc66}Укажите название остановки');
    const L = store._routes[k] || (store._routes[k] = []);
    const e = p.vehicle || p;
    L.push([arg.slice(0, 40), e.position.x, e.position.y, e.position.z]);
    dirty = true;
    p.outputChatBox('!{#8fd14f}Остановка ' + L.length + ' «' + arg + '» добавлена в ' + ROUTES[k].n + (L.length < 3 ? ' (маршрут включится от 3 точек; первая — депо, последняя — конец круга)' : ''));
});

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
        earned: r.earned[id] || 0, done: r.done[id] || 0, lv: lvlInfo(p, id),
        opts: optsFor(p, id)
    };
}
function optsFor(p, id) {
    const lv = lvlInfo(p, id);
    if (JOBS[id] && JOBS[id].opts) return JOBS[id].opts(p, lv);
    if (id === 'farm') return Object.keys(CROPS).map(function (k) {
        const c = CROPS[k];
        return { id: k, n: c.i + ' ' + c.n, sub: 'по ' + c.cap + ' шт. · ' + Math.round(c.pay[0] * lv.mult) + '–' + Math.round(c.pay[1] * lv.mult) + '$ за шт.' + (c.qte ? ' · сложность ' + '★'.repeat(c.qte) : ''), need: c.lvl, locked: c.lvl > lv.lvl };
    });
    if (id === 'bus') return Object.keys(ROUTES).map(function (k) {
        const r = ROUTES[k];
        return { id: k, n: '🚌 ' + r.n, sub: (routeStops(k).length - 1) + ' ост. · ' + Math.round(r.stopPay * lv.mult) + '$ за остановку · бонус ' + Math.round(r.bonus * lv.mult) + '$', need: r.lvl, locked: r.lvl > lv.lvl };
    });
    return null;
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
        list: Object.keys(JOBS).map(function (k) { const j = JOBS[k]; const L = lvlInfo(p, k); return { id: k, n: j.n + (L ? ' · ур. ' + L.lvl : ''), i: j.i, d: j.d, pay: j.pay, off: jobOff(k), earned: r.earned[k] || 0, done: r.done[k] || 0, x: j.base.x, y: j.base.y }; }),
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

global.JobSystem = { pay: pay, addXp: addXp, jobVeh: jobVeh, quest: quest, notify: notify, sendBases: function () { mp.players.forEach(sendBases); }, level: lvlInfo, JOBS: JOBS, stop: stopJob, phone: phoneJobs, current: function (p) { return p.job ? p.job.id : null; } };
console.log('[jobs] работы загружены: ' + Object.keys(JOBS).join(', '));
