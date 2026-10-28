function J() { return global.JobSystem; }
function notify(p, t, x) { if (typeof global.hudNotify === 'function') global.hudNotify(p, t, x); else p.outputChatBox(x); }
function d2(a, x, y) { return Math.hypot(a.x - x, a.y - y); }
function rnd(a, b) { return a + Math.random() * (b - a); }
function pick(arr, not) { let x, n = 0; do { x = arr[Math.floor(Math.random() * arr.length)]; n++; } while (x === not && n < 10); return x; }

/* ======================= СТРОЙКА (1+ ур.) ======================= */
const BUILD_BASE = { x: -97.0, y: -1013.5, z: 27.3 };
const BUILD_LV = [0, 30, 90, 200, 400];
const BUILD_TASKS = {
    bricks: { n: '🧱 Носить кирпичи', lvl: 1, pay: [9, 13], ms: 2500, from: [[-108.6, -1014.0, 27.3], [-111.0, -1010.0, 27.3]], to: [[-141.5, -1036.0, 27.3], [-155.6, -1040.6, 27.3], [-138.0, -1052.0, 27.3]] },
    cement: { n: '🪣 Мешать цемент', lvl: 2, pay: [14, 19], ms: 4500, from: [[-120.3, -1035.5, 27.3]], to: [[-162.0, -1012.0, 27.3], [-171.5, -1022.6, 27.3]] },
    weld: { n: '🔥 Сварка каркаса', lvl: 3, pay: [22, 30], ms: 6000, from: [[-97.0, -1013.5, 27.3]], to: [[-148.0, -969.0, 114.1], [-155.0, -955.6, 114.1], [-142.5, -963.2, 269.1], [-160.4, -960.0, 269.1]] }
};
function buildDef() {
    return {
        n: 'Стройка', i: '🏗️', lvl: 0, lv: BUILD_LV, minLvl: 1,
        pay: 'от 9$ за ходку · для новичков',
        d: 'Работа для новичков без требований. Берите материалы на складе и несите на стройплощадку. С ростом мастерства — цемент и сварка каркаса на высоте за двойную плату.',
        base: BUILD_BASE, blip: 566, color: 47,
        opts: function (p, lv) {
            return Object.keys(BUILD_TASKS).map(function (k) { const t = BUILD_TASKS[k]; return { id: k, n: t.n, sub: Math.round(t.pay[0] * lv.mult) + '–' + Math.round(t.pay[1] * lv.mult) + '$ за ходку', need: t.lvl, locked: t.lvl > lv.lvl }; });
        },
        start: function (p, s, opt) {
            const lv = J().level(p, 'build').lvl;
            const k = BUILD_TASKS[opt] ? opt : 'bricks';
            if (BUILD_TASKS[k].lvl > lv) return 'Откроется на ' + BUILD_TASKS[k].lvl + ' уровне мастерства';
            s.task = k; s.carry = false; s.n = 0; s.T = BUILD_TASKS; s.jid = 'build';
            buildNext(p, s);
            return null;
        },
        here: function (p, s) {
            if (p.vehicle || s.busy) return;
            const t = (s.T || BUILD_TASKS)[s.task], jid = s.jid || 'build';
            if (!s.pt || d2(p.position, s.pt[0], s.pt[1]) > 3) return;
            s.busy = true;
            p.call('job:anim', [s.carry ? 'put' : (s.task === 'bricks' || jid === 'loader' ? 'box' : 'pick'), t.ms]);
            setTimeout(function () {
                if (!mp.players.exists(p) || p.job !== s) return;
                s.busy = false;
                if (!s.carry) { s.carry = true; if (s.task !== 'bricks' && jid !== 'loader') p.call('job:anim', ['box', 0]); return buildNext(p, s); }
                s.carry = false; s.n++;
                const L = J().level(p, jid);
                const sum = Math.round(rnd(t.pay[0], t.pay[1]) * L.mult);
                J().pay(p, sum, jid);
                J().addXp(p, jid, 1);
                if (global.UiSystem && global.UiSystem.addExp) global.UiSystem.addExp(p, 4);
                notify(p, 'ok', (jid === 'loader' ? 'Бригадир' : 'Прораб') + ': +$' + sum + ' · ходок за смену: ' + s.n);
                buildNext(p, s);
            }, t.ms);
        },
        stop: function (p) { p.call('job:state', ['']); }
    };
}
function buildNext(p, s) {
    const t = (s.T || BUILD_TASKS)[s.task];
    const pt = s.carry ? pick(t.to, s.pt) : pick(t.from, s.pt);
    s.pt = pt;
    p.call('job:point', [pt[0], pt[1], pt[2], 1.4, s.carry ? 'Отнести на площадку (E)' : 'Взять материалы (E)', 'pick', '']);
    J().quest(p, (s.jid === 'loader' ? 'Грузчик · ' : 'Стройка · ') + t.n.slice(2), [s.carry ? 'Несите материал на отмеченную точку' : 'Возьмите материал на складе', 'Ходок за смену: ' + s.n]);
}

/* ======================= МУСОРОВОЗ (4+ ур.) ======================= */
const GARB_BASE = { x: -321.7, y: -1545.8, z: 31.0 };
const GARB_CAR = { x: -335.0, y: -1563.0, z: 25.2, h: 60 };
const GARB_DUMP = [-349.6, -1557.0, 25.2];
const GARB_LV = [0, 25, 70, 160, 320];
const BINS = [
    [-171.3, -1610.6, 33.7], [-60.8, -1517.8, 33.4], [43.4, -1476.5, 29.3], [140.0, -1460.0, 29.3], [236.8, -1508.3, 29.3],
    [309.7, -1623.2, 31.5], [384.0, -1754.0, 29.3], [292.3, -1885.6, 26.9], [129.8, -1940.0, 20.8], [-30.6, -1838.6, 25.4],
    [-112.4, -1777.6, 29.8], [-205.9, -1686.6, 34.0], [-259.6, -1503.6, 31.6], [-198.4, -1384.2, 31.3], [-37.8, -1393.0, 29.3]
];
const GARB_LOAD = 8;
function garbDef() {
    return {
        n: 'Мусоровоз', i: '🗑️', lvl: 0, lv: GARB_LV, minLvl: 4,
        pay: 'от 18$ за бак + 120$ за выгрузку',
        d: 'Объезжайте баки в южном Лос-Сантосе: остановитесь, выйдите и закиньте мешок в кузов. Полный кузов (8 баков) везите на свалку. Нужны права категории C.',
        base: GARB_BASE, blip: 318, color: 25, car: 'trash', carPos: GARB_CAR, lic: 'drive',
        opts: function (p, lv) { return [{ id: 'go', n: '🗑️ Начать маршрут', sub: GARB_LOAD + ' баков · ' + Math.round(18 * lv.mult) + '$ за бак · ×' + lv.mult.toFixed(2), need: 1, locked: false }]; },
        start: function (p, s) {
            const U = global.UiSystem;
            if (U && U.driveCats && U.driveCats(p).indexOf('C') < 0) return 'Нужны права категории C (грузовые)';
            s.veh = J().jobVeh(p, { car: 'trash', carPos: GARB_CAR }, null);
            s.load = 0; s.sum = 0; s.done = [];
            garbNext(p, s);
            return null;
        },
        here: function (p, s) {
            if (s.busy) return;
            if (s.load >= GARB_LOAD) {
                if (!s.veh || !mp.vehicles.exists(s.veh) || d2(s.veh.position, GARB_DUMP[0], GARB_DUMP[1]) > 12) return notify(p, 'warn', 'Пригоните мусоровоз к свалке');
                const L = J().level(p, 'garbage');
                const sum = Math.round((s.sum + 120) * L.mult);
                J().pay(p, sum, 'garbage');
                J().addXp(p, 'garbage', 3);
                if (global.UiSystem && global.UiSystem.addExp) global.UiSystem.addExp(p, 20);
                notify(p, 'ok', 'Кузов выгружен: +$' + sum);
                s.load = 0; s.sum = 0; s.done = [];
                return garbNext(p, s);
            }
            if (p.vehicle) return notify(p, 'warn', 'Выйдите из машины и подойдите к баку');
            if (!s.pt || d2(p.position, s.pt[0], s.pt[1]) > 3) return;
            if (!s.veh || !mp.vehicles.exists(s.veh) || d2(s.veh.position, p.position.x, p.position.y) > 25) return notify(p, 'warn', 'Мусоровоз слишком далеко');
            s.busy = true;
            p.call('job:anim', ['box', 0]);
            setTimeout(function () {
                if (!mp.players.exists(p) || p.job !== s) return;
                p.call('job:anim', ['put', 1200]);
                s.busy = false; s.load++; s.sum += rnd(18, 26); s.done.push(s.pt);
                J().addXp(p, 'garbage', 1);
                notify(p, 'ok', 'Мешок в кузове: ' + s.load + '/' + GARB_LOAD);
                garbNext(p, s);
            }, 1800);
        }
    };
}
function garbNext(p, s) {
    if (s.load >= GARB_LOAD) {
        s.pt = GARB_DUMP;
        p.call('job:point', [GARB_DUMP[0], GARB_DUMP[1], GARB_DUMP[2], 4, 'Свалка — выгрузить (E)', 'drop', 'fixed']);
        return J().quest(p, 'Мусоровоз', ['Кузов полон: ' + s.load + '/' + GARB_LOAD, 'Езжайте на свалку и нажмите E у метки']);
    }
    const left = BINS.filter(function (b) { return s.done.indexOf(b) < 0; });
    const from = s.veh && mp.vehicles.exists(s.veh) ? s.veh.position : p.position;
    left.sort(function (a, b) { return d2(from, a[0], a[1]) - d2(from, b[0], b[1]); });
    s.pt = left[Math.min(left.length - 1, Math.floor(Math.random() * 3))];
    p.call('job:point', [s.pt[0], s.pt[1], s.pt[2], 1.6, 'Мусорный бак (E)', 'pick', '']);
    J().quest(p, 'Мусоровоз', ['Кузов: ' + s.load + '/' + GARB_LOAD, 'Подъедьте к баку, выйдите и нажмите E']);
}

/* ======================= ИНКАССАТОР (8+ ур.) ======================= */
const COL_BASE = { x: 254.6, y: 225.6, z: 106.3 };
const COL_CAR = { x: 220.2, y: 197.8, z: 105.3, h: 250 };
const COL_LV = [0, 15, 45, 100, 200];
const ATMS = [
    ['Fleeca Legion', 147.4, -1035.8, 29.3], ['Fleeca Burton', -351.5, -49.5, 49.0], ['Fleeca Rockford', -1212.9, -330.8, 37.8],
    ['Fleeca Great Ocean', -2962.6, 482.6, 15.7], ['Fleeca Hawick', 313.9, -278.9, 54.2], ['Fleeca Route 68', 1175.0, 2706.6, 38.1],
    ['Blaine County Savings', -112.2, 6469.3, 31.6], ['Банкомат Del Perro', -1305.5, -706.4, 25.3], ['Банкомат Vinewood', 236.6, 219.0, 106.3],
    ['Банкомат Mirror Park', 1138.3, -468.9, 66.7], ['Банкомат Sandy', 1968.0, 3743.6, 32.3], ['Банкомат Chumash', -3240.5, 997.6, 12.6]
];
const fs = require('fs');
const COL_FILE = require('path').join(__dirname, 'jobs2_data.json');
const X = (function () { try { return JSON.parse(fs.readFileSync(COL_FILE, 'utf8')) || {}; } catch (e) { return {}; } })();
function colCar() { return X.colCar || COL_CAR; }
mp.events.addCommand('setcolcar', function (p, full) {
    if (!global.AdminSystem || global.AdminSystem.realLvl(p) < 5) return;
    if (String(full || '').trim() === 'reset') delete X.colCar;
    else { const e = p.vehicle || p; X.colCar = { x: e.position.x, y: e.position.y, z: e.position.z + 0.3, h: e.heading !== undefined ? e.heading : p.heading }; }
    fs.writeFile(COL_FILE, JSON.stringify(X), function () {});
    notify(p, 'ok', X.colCar ? 'Точка выдачи фургона инкассатора сохранена' : 'Точка сброшена');
});
function colDef() {
    return {
        n: 'Инкассатор', i: '💰', lvl: 0, lv: COL_LV, minLvl: 8,
        pay: '250–600$ за точку · риск ограбления',
        d: 'Бронированный фургон банка Pacific Standard. Забирайте выручку из отделений Fleeca и банкоматов и сдавайте в хранилище. Чем дальше точка — тем выше оплата. Будьте начеку: банды могут напасть.',
        base: COL_BASE, blip: 67, color: 2, lic: 'drive',
        opts: function (p, lv) { return [{ id: 'go', n: '💰 Выехать на маршрут', sub: '3 точки за рейс · ×' + lv.mult.toFixed(2) + ' к оплате', need: 1, locked: false }]; },
        start: function (p, s) {
            const U = global.UiSystem;
            if (U && U.driveCats && U.driveCats(p).indexOf('C') < 0) return 'Нужны права категории C';
            if (global.WantedSystem && global.WantedSystem.get && global.WantedSystem.get(p) > 0) return 'Банк не берёт на работу людей в розыске';
            s.veh = J().jobVeh(p, { car: 'stockade', carPos: colCar() }, null);
            try { s.veh.dimension = 0; } catch (e) {}
            s.route = []; while (s.route.length < 3) { const a = pick(ATMS); if (s.route.indexOf(a) < 0) s.route.push(a); }
            s.bags = 0; s.sum = 0;
            colNext(p, s);
            return null;
        },
        here: function (p, s) {
            if (s.busy) return;
            if (p.vehicle) return notify(p, 'warn', 'Выйдите из фургона');
            if (!s.pt || d2(p.position, s.pt[1], s.pt[2]) > 3.5) return;
            if (s.pt === 'vault' || s.pt[0] === 'Хранилище банка') {
                const L = J().level(p, 'collector');
                const sum = Math.round(s.sum * L.mult);
                J().pay(p, sum, 'collector');
                J().addXp(p, 'collector', 3);
                if (global.UiSystem && global.UiSystem.addExp) global.UiSystem.addExp(p, 40);
                notify(p, 'ok', 'Выручка сдана в хранилище: +$' + sum);
                s.route = []; while (s.route.length < 3) { const a = pick(ATMS); if (s.route.indexOf(a) < 0) s.route.push(a); }
                s.bags = 0; s.sum = 0;
                return colNext(p, s);
            }
            s.busy = true;
            p.call('job:anim', ['pick', 5000]);
            setTimeout(function () {
                if (!mp.players.exists(p) || p.job !== s) return;
                s.busy = false; s.bags++;
                s.sum += Math.round(Math.max(250, Math.min(600, 200 + d2(COL_BASE, s.pt[1], s.pt[2]) / 12)));
                s.route.shift();
                J().addXp(p, 'collector', 1);
                notify(p, 'ok', 'Мешок с выручкой загружен (' + s.bags + '/3)');
                colNext(p, s);
            }, 5000);
        }
    };
}
function colNext(p, s) {
    if (!s.route.length) {
        s.pt = ['Хранилище банка', COL_BASE.x, COL_BASE.y, COL_BASE.z];
        p.call('job:point', [COL_BASE.x, COL_BASE.y, COL_BASE.z, 1.6, 'Сдать выручку в хранилище (E)', 'drop', 'fixed']);
        return J().quest(p, 'Инкассатор', ['Мешков: ' + s.bags + ' на $' + s.sum, 'Везите выручку в Pacific Standard']);
    }
    s.pt = s.route[0];
    p.call('job:point', [s.pt[1], s.pt[2], s.pt[3], 1.6, 'Забрать выручку: ' + s.pt[0] + ' (E)', 'drop', 'fixed']);
    J().quest(p, 'Инкассатор', ['Точка: ' + s.pt[0], 'Осталось точек: ' + s.route.length, 'Мешков в фургоне: ' + s.bags]);
}

/* ======================= ГРУЗЧИК (1+ ур.) ======================= */
const LOAD_BASE = { x: 153.8, y: -3077.0, z: 5.9 };
const LOAD_LV = [0, 30, 90, 200, 400];
const LOAD_TASKS = {
    boxes: { n: '📦 Ящики со склада', lvl: 1, pay: [10, 14], ms: 2200, from: [[160.6, -3084.5, 5.9], [165.0, -3084.5, 5.9]], to: [[123.0, -3106.6, 5.9], [131.5, -3106.6, 5.9], [139.6, -3106.6, 5.9]] },
    port: { n: '🚢 Разгрузка контейнера', lvl: 2, pay: [15, 20], ms: 3200, from: [[180.0, -3120.0, 5.8], [186.0, -3120.0, 5.8]], to: [[123.0, -3106.6, 5.9], [139.6, -3106.6, 5.9]] },
    heavy: { n: '🏋️ Тяжёлый груз', lvl: 3, pay: [24, 31], ms: 4200, from: [[214.0, -3093.0, 5.8]], to: [[123.0, -3106.6, 5.9], [131.5, -3106.6, 5.9]] }
};
function loaderDef() {
    const d = buildDef();
    return Object.assign(d, {
        n: 'Грузчик', i: '📦', lv: LOAD_LV, minLvl: 1,
        pay: 'от 10$ за ходку · для новичков',
        d: 'Работа для новичков в порту Лос-Сантоса. Носите ящики со склада на погрузку, с ростом мастерства — разгрузка контейнеров и тяжёлые грузы за повышенную плату.',
        base: LOAD_BASE, blip: 478, color: 17,
        opts: function (p, lv) {
            return Object.keys(LOAD_TASKS).map(function (k) { const t = LOAD_TASKS[k]; return { id: k, n: t.n, sub: Math.round(t.pay[0] * lv.mult) + '–' + Math.round(t.pay[1] * lv.mult) + '$ за ходку', need: t.lvl, locked: t.lvl > lv.lvl }; });
        },
        start: function (p, s, opt) {
            const lv = J().level(p, 'loader').lvl;
            const k = LOAD_TASKS[opt] ? opt : 'boxes';
            if (LOAD_TASKS[k].lvl > lv) return 'Откроется на ' + LOAD_TASKS[k].lvl + ' уровне мастерства';
            s.task = k; s.carry = false; s.n = 0; s.T = LOAD_TASKS; s.jid = 'loader';
            buildNext(p, s);
            return null;
        }
    });
}

function register() {
    if (!J() || !J().JOBS) return setTimeout(register, 1000);
    J().JOBS.build = buildDef();
    J().JOBS.loader = loaderDef();
    J().JOBS.garbage = garbDef();
    J().JOBS.collector = colDef();
    if (J().sendBases) J().sendBases();
}
register();
console.log('[jobs2] работы: стройка, грузчик, мусоровоз, инкассатор');
