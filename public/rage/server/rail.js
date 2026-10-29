function J() { return global.JobSystem; }
function notify(p, t, x) { if (typeof global.hudNotify === 'function') global.hudNotify(p, t, x); else p.outputChatBox(x); }
function admLvl(p) { return global.AdminSystem && global.AdminSystem.realLvl ? global.AdminSystem.realLvl(p) : 0; }

const METRO_ST = [
    ['Strawberry', 258.7, -1210.0, 38.1], ['Burton', -287.2, -332.1, 9.2], ['Portola Drive', -818.0, -130.5, 19.1],
    ['Del Perro', -1359.2, -467.1, 14.2], ['Little Seoul', -502.6, -680.8, 10.9], ['Pillbox South', -218.1, -1032.5, 29.3, 50],
    ['Davis', 113.0, -1729.4, 29.1], ['Pillbox South (обратно)', -208.0, -1032.2, 29.3], ['Little Seoul (обратно)', -500.6, -665.5, 10.9],
    ['Del Perro (обратно)', -1345.6, -459.9, 14.2], ['Portola Drive (обратно)', -810.7, -143.7, 19.1], ['Burton (обратно)', -302.2, -332.0, 9.2],
    ['Strawberry (обратно)', 263.1, -1198.5, 38.1], ['Депо Puerto Del Sol', -545.3, -1281.1, 25.9]
];
const FREIGHT_ST = [
    ['Карьер Iron Mines', 2612.4, 2930.6, 39.9, 0, 'load'], ['Paleto Bay', -139.8, 6142.5, 31.6, 0, 'unload'],
    ['Карьер Iron Mines', 2607.4, 2934.0, 40.0, 0, 'load'], ['Mirror Park', 664.6, -898.7, 22.2, 0, 'unload'],
    ['Переезд', 556.2, -1496.7, 21.5, 50, 'pass'], ['Мост в порт', 146.6, -2055.7, 18.3, 130, 'pass'],
    ['Подход к порту', 692.1, -2566.1, 12.1, 180, 'pass'], ['Подход к терминалу', 2610.8, 1467.5, 31.9, 45, 'pass'],
    ['Главный терминал', 2611.1, 1698.0, 26.8, 0, 'end']
];

const KINDS = {
    metro: {
        n: 'Машинист метро', i: '🚇', minLvl: 3, lv: [0, 5, 15, 35, 70], blip: 795, color: 3,
        base: { x: -532.6, y: -1264.7, z: 26.9 }, rail: { x: -530.1, y: -1270.5, z: 25.9 }, dir: 1,
        pay: 'от 70$ за станцию + бонус за круг и пассажиров',
        d: 'Водите метро по городской линии: остановка у каждой платформы, открыть и закрыть двери, соблюдать скорость. Игроки могут ездить пассажирами — за каждого бонус.',
        tiers: [
            { id: 'm4', lvl: 1, n: '🚇 Состав из 2 вагонов', vars: [25], max: 80, stopPay: 70, bonus: 600 },
            { id: 'm6', lvl: 3, n: '🚇 Сдвоенный состав', vars: [24], max: 90, stopPay: 95, bonus: 900 }
        ],
        stations: METRO_ST, wait: 8
    },
    freight: {
        n: 'Машинист грузового поезда', i: '🚂', minLvl: 6, lv: [0, 4, 12, 28, 55], blip: 795, color: 17,
        base: { x: 2618.8, y: 1692.9, z: 27.6 }, rail: { x: 2610.9, y: 1691.5, z: 26.9 }, dir: 0,
        pay: 'от 2 500$ за рейс, растёт с числом вагонов',
        d: 'Ведите грузовой состав по всему штату: погрузка на карьере, выгрузка в Paleto Bay и Mirror Park. Чем длиннее состав, тем тяжелее разгон и торможение, но выше оплата.',
        tiers: [
            { id: 'f1', lvl: 1, n: '🚂 Короткий состав', vars: [2, 5, 6], max: 110, wagonPay: 55, bonus: 1200 },
            { id: 'f2', lvl: 2, n: '🚂 Средний состав', vars: [9, 10, 11, 12], max: 120, wagonPay: 70, bonus: 1800 },
            { id: 'f3', lvl: 4, n: '🚂 Тяжёлый длинный состав', vars: [19, 20, 24], max: 130, wagonPay: 90, bonus: 2800 }
        ],
        stations: FREIGHT_ST, wait: 15
    }
};

function dist2(a, x, y) { return Math.hypot(a.x - x, a.y - y); }

function startRail(kind, p, s, opt) {
    const K = KINDS[kind];
    const lv = J().level(p, kind) || { lvl: 1, mult: 1 };
    const t = K.tiers.find(function (x) { return x.id === opt; }) || K.tiers[0];
    if (t.lvl > lv.lvl && admLvl(p) < 1) return 'Этот состав откроется на ' + t.lvl + ' уровне мастерства';
    s.rail = { kind: kind, t: t, i: 0, earned: 0, fines: 0, wagons: 0, pax: {}, paxPaid: 0, lastAt: Date.now(), mult: lv.mult, var: t.vars[Math.floor(Math.random() * t.vars.length)] };
    const cfg = {
        kind: kind, n: t.n, var: s.rail.var, dir: K.dir, max: t.max, wait: K.wait,
        rail: [K.rail.x, K.rail.y, K.rail.z],
        st: K.stations.map(function (x) { return { n: x[0], x: x[1], y: x[2], z: x[3], lim: x[4] || 0, k: x[5] || 'stop' }; })
    };
    p.call('rail:start', [JSON.stringify(cfg)]);
    quest(p, s);
    return null;
}
function quest(p, s) {
    const r = s.rail, K = KINDS[r.kind], st = K.stations, cur = st[r.i];
    const tasks = [];
    if (cur) tasks.push({ t: (cur[5] === 'load' ? 'Погрузка: ' : cur[5] === 'unload' ? 'Выгрузка: ' : cur[5] === 'pass' ? 'Проследовать: ' : cur[5] === 'end' ? 'Конечная: ' : 'Станция: ') + cur[0], done: false });
    tasks.push({ t: 'Заработано за рейс: $' + Math.round(r.earned) + (r.fines ? ' · нарушений: ' + r.fines : ''), done: false });
    J().quest(p, K.i + ' ' + K.n + ' · ' + r.t.n, tasks);
}

mp.events.add('srv:rail:wagons', function (p, n) {
    const s = p.job; if (!s || !s.rail) return;
    s.rail.wagons = Math.max(1, Math.min(40, Number(n) || 1));
});
mp.events.add('srv:rail:pos', function (p, x, y, z, sp) {
    const s = p.job; if (!s || !s.rail) return;
    s.rail.pos = { x: Number(x), y: Number(y), z: Number(z), sp: Number(sp) || 0, at: Date.now() };
});
mp.events.add('srv:rail:fine', function (p, why) {
    const s = p.job; if (!s || !s.rail) return;
    s.rail.fines += 1;
    notify(p, 'warn', String(why || 'Нарушение') + '. Бонус за рейс уменьшен');
    quest(p, s);
});
mp.events.add('srv:rail:station', function (p, idx) {
    const s = p.job; if (!s || !s.rail) return;
    const r = s.rail, K = KINDS[r.kind], st = K.stations[r.i];
    if (!st || Number(idx) !== r.i) return;
    const pos = r.pos && Date.now() - r.pos.at < 5000 ? r.pos : p.position;
    if (dist2(pos, st[1], st[2]) > 90) return notify(p, 'warn', 'Сервер не видит поезд у станции — подъедьте ближе');
    if (Date.now() - r.lastAt < (st[5] === 'pass' ? 3000 : 12000) && admLvl(p) < 1) return;
    r.lastAt = Date.now();
    let sum = 0;
    if (r.kind === 'metro') {
        sum = r.t.stopPay;
        const riders = Object.keys(r.pax).filter(function (id) { const x = mp.players.at(Number(id)); return x && mp.players.exists(x) && x.railRide === p.id; });
        if (riders.length) { sum += riders.length * 25; r.paxPaid += riders.length; }
    } else if (st[5] === 'load' || st[5] === 'unload') sum = r.t.wagonPay * Math.max(1, r.wagons) * (st[5] === 'unload' ? 1.4 : 0.6);
    sum = Math.round(sum * r.mult);
    r.i += 1;
    const last = r.i >= K.stations.length;
    if (last) {
        const cut = Math.max(0, 1 - r.fines * 0.25);
        const bonus = Math.round((r.t.bonus + (r.kind === 'freight' ? r.wagons * 40 : r.paxPaid * 10)) * r.mult * cut);
        sum += bonus;
        notify(p, 'ok', 'Рейс завершён! Бонус $' + bonus + (r.fines ? ' (снижен за нарушения: ' + r.fines + ')' : ''));
    }
    if (sum > 0) { J().pay(p, sum, r.kind); r.earned += sum; notify(p, 'ok', (st[5] === 'pass' ? '' : st[0] + ': ') + '+$' + sum); }
    p.call('rail:next', [r.i]);
    if (last) {
        J().addXp(p, r.kind, 1);
        r.i = 0; r.fines = 0; r.paxPaid = 0; r.lastAt = Date.now();
        notify(p, 'ok', 'Можно начинать следующий рейс — первая станция отмечена на карте. Закончить смену — /quitjob');
        p.call('rail:next', [0]);
    }
    quest(p, s);
});

mp.events.add('srv:rail:skip', function (p, idx) {
    const s = p.job; if (!s || !s.rail) return;
    const r = s.rail, K = KINDS[r.kind];
    if (Number(idx) !== r.i || !K.stations[r.i]) return;
    r.fines += 1;
    notify(p, 'warn', 'Станция «' + K.stations[r.i][0] + '» пропущена — без оплаты, бонус за рейс уменьшен');
    r.i += 1;
    if (r.i >= K.stations.length) { r.i = 0; r.fines = 0; r.paxPaid = 0; notify(p, 'warn', 'Рейс окончен без бонуса. Начинайте новый круг'); }
    r.lastAt = Date.now();
    p.call('rail:next', [r.i]);
    quest(p, s);
});
mp.events.add('srv:rail:board', function (p, driverId) {
    const d = mp.players.at(Number(driverId));
    if (!d || !mp.players.exists(d) || !d.job || !d.job.rail) { p.railRide = null; return; }
    if (d === p) return;
    p.railRide = d.id;
    d.job.rail.pax[p.id] = 1;
    notify(d, 'ok', 'В поезд сел пассажир');
});
mp.events.add('srv:rail:leave', function (p) { p.railRide = null; });

setInterval(function () {
    const trains = [];
    mp.players.forEach(function (p) {
        const r = p.job && p.job.rail;
        if (r && r.pos && Date.now() - r.pos.at < 4000) trains.push({ p: p, d: [p.id, r.var, KINDS[r.kind].dir, Math.round(r.pos.x * 10) / 10, Math.round(r.pos.y * 10) / 10, Math.round(r.pos.z * 10) / 10, Math.round(r.pos.sp * 100) / 100] });
    });
    mp.players.forEach(function (p) {
        if (!p.railSeen && !trains.length) return;
        const list = trains.filter(function (t) { return t.p !== p && p.dimension === 0 && dist2(p.position, t.d[3], t.d[4]) < 450; }).map(function (t) { return t.d; });
        if (!list.length && !p.railSeen) return;
        p.railSeen = list.length > 0;
        p.call('rail:sync', [JSON.stringify(list)]);
    });
}, 500);

function jobDef(kind) {
    const K = KINDS[kind];
    return {
        n: K.n, i: K.i, lvl: 0, minLvl: K.minLvl, lv: K.lv, pay: K.pay, d: K.d,
        base: K.base, blip: K.blip, color: K.color,
        opts: function (p, lv) {
            return K.tiers.map(function (t) {
                const lock = t.lvl > lv.lvl && admLvl(p) < 1;
                const sub = kind === 'metro' ? 'Лимит ' + t.max + ' км/ч · $' + t.stopPay + ' за станцию' : 'Лимит ' + t.max + ' км/ч · $' + t.wagonPay + ' за вагон на выгрузке';
                return { id: t.id, n: t.n, sub: lock ? 'Откроется на ' + t.lvl + ' уровне мастерства' : sub + ' · ×' + lv.mult.toFixed(2), need: t.lvl, locked: lock };
            });
        },
        start: function (p, s, opt) { return startRail(kind, p, s, opt); },
        stop: function (p, s) {
            if (mp.players.exists(p)) p.call('rail:stop');
            mp.players.forEach(function (x) { if (x.railRide === p.id) { x.railRide = null; x.call('rail:kick'); } });
            if (s.rail) s.rail.pos = null;
        }
    };
}
function register() {
    if (!J() || !J().JOBS) return setTimeout(register, 1000);
    J().JOBS.metro = jobDef('metro');
    J().JOBS.freight = jobDef('freight');
    if (J().sendBases) J().sendBases();
}
register();
mp.events.add('playerQuit', function (p) {
    if (p.railRide !== null && p.railRide !== undefined) { const d = mp.players.at(p.railRide); if (d && d.job && d.job.rail) delete d.job.rail.pax[p.id]; }
});
console.log('[rail] работы «Машинист метро» и «Машинист грузового поезда» загружены');
