const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'power_data.json');
const S = Object.assign({ base: null, rent: null, stats: {} }, (function () { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch (e) { return {}; } })());
let dirty = false;
setInterval(function () { if (dirty) { dirty = false; try { fs.writeFileSync(FILE, JSON.stringify(S)); } catch (e) {} } }, 5000);

function J() { return global.JobSystem; }
function notify(p, type, text) { if (typeof global.hudNotify === 'function') global.hudNotify(p, type, text); else p.outputChatBox(text); }
function sid(p) { return p && p.account && p.account.id ? Number(p.account.id) : 0; }
function admLvl(p) { return global.AdminSystem && global.AdminSystem.realLvl ? global.AdminSystem.realLvl(p) : 0; }
function money(n) { return '$' + String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function dist(a, x, y) { return Math.hypot(a.x - x, a.y - y); }

/* ======================= АРЕНДА СКУТЕРОВ ======================= */
const RENT_DEF = { x: -1040.5, y: -2727.5, z: 13.8, h: 330 };
const RENT_PRICE = 50;
const RENT_MIN = 30;
const rents = {};
function rentPt() { return S.rent || RENT_DEF; }
function rentClear(id, why) {
    const r = rents[id];
    if (!r) return;
    delete rents[id];
    if (r.v && mp.vehicles.exists(r.v)) r.v.destroy();
    const p = mp.players.toArray().find(function (x) { return sid(x) === id; });
    if (p && why) notify(p, 'warn', why);
}
function rentOffer(p) {
    const id = sid(p);
    if (!id) return;
    if (rents[id] && rents[id].v && mp.vehicles.exists(rents[id].v)) {
        p.rentAsk = { at: Date.now(), back: true };
        return p.call('social:offer', ['Вернуть арендованный скутер?', 15000]);
    }
    p.rentAsk = { at: Date.now() };
    p.call('social:offer', ['Арендовать скутер на ' + RENT_MIN + ' мин за ' + money(RENT_PRICE) + '? Права не нужны', 15000]);
}
mp.events.add('srv:int:answer', function (p, yes) {
    const a = p.rentAsk;
    if (!a || Date.now() - a.at > 15000) return;
    p.rentAsk = null;
    if (!yes) return;
    const id = sid(p);
    if (a.back) return rentClear(id, 'Скутер возвращён. Спасибо!');
    const M = global.MoneySystem;
    if (!M) return;
    const cash = M.get(p), bank = M.bank(p);
    if (cash + bank < RENT_PRICE) return notify(p, 'error', 'Не хватает денег: нужно ' + money(RENT_PRICE));
    const fb = Math.max(0, RENT_PRICE - cash);
    M.set(p, cash - (RENT_PRICE - fb), bank - fb, 'scooter-rent');
    if (global.GovSystem) global.GovSystem.add(RENT_PRICE, 'Аренда скутера');
    const R = rentPt();
    const v = mp.vehicles.new(mp.joaat('faggio'), new mp.Vector3(R.x + 1.5, R.y + 1.5, R.z), { heading: R.h || 0, numberPlate: 'RENT' + String(id % 10000).padStart(4, '0'), dimension: 0, locked: false, engine: true });
    v.setVariable('rent', id);
    v.setVariable('pub', 1);
    try { v.setColor(Math.floor(Math.random() * 90), 0); } catch (e) {}
    rents[id] = { v: v, until: Date.now() + RENT_MIN * 60000, warned: false };
    setTimeout(function () { if (mp.players.exists(p) && mp.vehicles.exists(v)) try { p.putIntoVehicle(v, 0); } catch (e) {} }, 400);
    notify(p, 'ok', 'Скутер ваш на ' + RENT_MIN + ' мин. Права не нужны. Вернуть — E у пункта проката');
});
mp.events.add('playerEnterVehicle', function (p, v, seat) {
    const o = v.getVariable('rent');
    if (!o || (seat !== 0 && seat !== -1)) return;
    if (Number(o) !== sid(p) && admLvl(p) < 1) { try { p.removeFromVehicle(); } catch (e) {} notify(p, 'warn', 'Это чужой арендованный скутер'); }
});
mp.events.add('playerQuit', function (p) { const id = sid(p); if (id) setTimeout(function () { if (!mp.players.toArray().some(function (x) { return sid(x) === id; })) rentClear(id); }, 120000); });
setInterval(function () {
    Object.keys(rents).forEach(function (k) {
        const r = rents[k], id = Number(k);
        if (!r.v || !mp.vehicles.exists(r.v)) return delete rents[k];
        const left = r.until - Date.now();
        if (left <= 0) return rentClear(id, 'Время аренды скутера вышло');
        if (left < 120000 && !r.warned) {
            r.warned = true;
            const p = mp.players.toArray().find(function (x) { return sid(x) === id; });
            if (p) notify(p, 'warn', 'Аренда скутера закончится через 2 минуты');
        }
    });
}, 10000);
mp.events.add('srv:rent:use', function (p) {
    const R = rentPt();
    if (dist(p.position, R.x, R.y) > 3 || p.vehicle) return;
    rentOffer(p);
});
mp.events.addCommand('rentpoint', function (p) {
    if (admLvl(p) < 7) return;
    S.rent = { x: p.position.x, y: p.position.y, z: p.position.z, h: p.heading || 0 }; dirty = true;
    mp.players.forEach(sendStatic);
    p.outputChatBox('!{#8fd14f}Пункт проката скутеров перенесён сюда');
});

/* ======================= РАБОТА: АВАРИЙНЫЙ ЭНЕРГЕТИК ======================= */
const BASE_DEF = { x: 734.0, y: -1960.0, z: 29.3 };
const CAR_DEF = { x: 740.0, y: -1953.0, z: 29.3, h: 265 };
const SITES = [
    ['Vinewood Hills', -1286.4, 438.1, 97.4], ['Rockford Hills', -1379.8, -478.3, 31.6], ['Del Perro', -1197.0, -891.3, 13.9],
    ['Vespucci', -1149.6, -1521.9, 4.4], ['Little Seoul', -712.5, -916.4, 19.2], ['Mission Row', 316.0, -1078.3, 29.4],
    ['Strawberry', 247.6, -1373.4, 29.6], ['Mirror Park', 1265.1, -703.8, 64.6], ['La Mesa', 728.3, -1088.9, 22.2],
    ['Davis', 115.9, -1945.2, 20.7], ['Burton', -159.5, -305.4, 39.7], ['Pillbox Hill', 357.4, -593.7, 28.8],
    ['Legion Square', 195.0, -930.0, 30.7], ['Downtown Vinewood', 300.0, 180.0, 104.0], ['Chamberlain Hills', -170.0, -1600.0, 34.0]
];
const LV = [0, 12, 35, 80, 160];
const GRID = [[5, 5], [6, 5], [6, 6], [7, 6], [7, 7]];
const TIME = [150, 150, 170, 190, 210];
const CAUSES = ['перегорел трансформатор', 'обрыв кабеля после ДТП', 'короткое замыкание в щитке', 'залило распределительный узел', 'повреждение после грозы', 'кражу медного кабеля'];

function basePt() { return S.base || BASE_DEF; }
function rot(m) { return ((m << 1) | (m >> 3)) & 15; }
function rotN(m, n) { for (let i = 0; i < (n & 3); i++) m = rot(m); return m; }
const DIRS = [[0, -1, 1, 4], [1, 0, 2, 8], [0, 1, 4, 1], [-1, 0, 8, 2]];

function genPuzzle(lvl) {
    const g = GRID[Math.max(0, Math.min(GRID.length - 1, lvl - 1))];
    const W = g[0], H = g[1], N = W * H;
    let blocked = [];
    const nBlock = lvl >= 3 ? Math.min(lvl - 1, 4) : 0;
    while (blocked.length < nBlock) {
        const c = Math.floor(Math.random() * N);
        if (blocked.indexOf(c) < 0) blocked.push(c);
    }
    let src;
    do { src = Math.floor(Math.random() * N); } while (blocked.indexOf(src) >= 0);
    const m = new Array(N).fill(0), seen = new Array(N).fill(false);
    blocked.forEach(function (b) { seen[b] = true; });
    seen[src] = true;
    const front = [];
    const push = function (c) { DIRS.forEach(function (d) { const x = c % W + d[0], y = Math.floor(c / W) + d[1]; if (x >= 0 && y >= 0 && x < W && y < H) front.push([c, y * W + x, d[2], d[3]]); }); };
    push(src);
    while (front.length) {
        const i = Math.floor(Math.random() * front.length);
        const e = front.splice(i, 1)[0];
        if (seen[e[1]]) continue;
        if ((m[e[0]] | e[2]) === 15 && Math.random() < 0.85) continue;
        seen[e[1]] = true; m[e[0]] |= e[2]; m[e[1]] |= e[3];
        push(e[1]);
    }
    for (let c = 0; c < N; c++) if (!seen[c]) blocked.push(c);
    const houses = [];
    for (let c = 0; c < N; c++) if (c !== src && m[c] && [1, 2, 4, 8].indexOf(m[c]) >= 0) houses.push(c);
    const lockShare = [0.18, 0.14, 0.1, 0.06, 0.04][lvl - 1] || 0.04;
    const locked = [], start = [];
    for (let c = 0; c < N; c++) {
        if (!m[c]) { start.push(0); continue; }
        if (Math.random() < lockShare && c !== src && houses.indexOf(c) < 0) { locked.push(c); start.push(0); continue; }
        let r = Math.floor(Math.random() * 4);
        if (m[c] === 5 || m[c] === 10) r = Math.floor(Math.random() * 2) * 1 + 1;
        start.push(r);
    }
    return { W: W, H: H, sol: m, src: src, houses: houses, locked: locked, blocked: blocked.filter(function (b) { return !m[b]; }), start: start };
}
function tiles(P) { return P.sol.map(function (m, i) { return rotN(m, P.start[i]); }); }
function check(P, rots) {
    const N = P.W * P.H, cur = [];
    for (let i = 0; i < N; i++) cur.push(rotN(tiles(P)[i], P.locked.indexOf(i) >= 0 ? 0 : (Number(rots[i]) || 0)));
    for (let c = 0; c < N; c++) {
        if (!cur[c]) continue;
        for (const d of DIRS) {
            if (!(cur[c] & d[2])) continue;
            const x = c % P.W + d[0], y = Math.floor(c / P.W) + d[1];
            if (x < 0 || y < 0 || x >= P.W || y >= P.H) return false;
            if (!(cur[y * P.W + x] & d[3])) return false;
        }
    }
    const seen = {}, st = [P.src]; seen[P.src] = 1;
    while (st.length) {
        const c = st.pop();
        for (const d of DIRS) {
            if (!(cur[c] & d[2])) continue;
            const n = (Math.floor(c / P.W) + d[1]) * P.W + c % P.W + d[0];
            if (!seen[n]) { seen[n] = 1; st.push(n); }
        }
    }
    for (let c = 0; c < N; c++) if (cur[c] && !seen[c]) return false;
    return true;
}

function nextSite(p, s) {
    let i;
    do { i = Math.floor(Math.random() * SITES.length); } while (SITES.length > 1 && i === s.last);
    s.last = i;
    const st = SITES[i];
    s.site = { n: st[0], x: st[1], y: st[2], z: st[3], cause: CAUSES[Math.floor(Math.random() * CAUSES.length)] };
    s.puzzle = null;
    p.call('job:point', [st[1], st[2], st[3], 2.5, 'Авария: ' + st[0] + ' (E — щиток)', 'pick', '']);
    J().quest(p, 'Аварийный энергетик', [{ t: 'Доехать до аварии: ' + st[0], done: false }, { t: 'Восстановить схему в щитке', done: false }]);
    notify(p, 'warn', 'Диспетчер: в районе ' + st[0] + ' нет света — ' + s.site.cause + '. Выезжайте!');
}

function jobDef() {
    return {
        n: 'Аварийный энергетик', i: '⚡', lvl: 0, lv: LV,
        pay: 'от 110$ за аварию + бонусы за скорость и чистую работу',
        d: 'Город обесточен! Выезжайте на аварии и восстанавливайте схему сети прямо в щитке: поворачивайте провода, чтобы ток от подстанции дошёл до каждого дома, и не оставляйте оголённых концов. Чем выше разряд — тем сложнее схемы.',
        base: basePt(), blip: 354, color: 46, car: 'utillitruck3', carPos: CAR_DEF,
        opts: function (p, lv) {
            return [{ id: 'go', n: '⚡ Начать смену', sub: 'Разряд ' + lv.lvl + ' · схема ' + GRID[lv.lvl - 1].join('×') + ' · ×' + lv.mult.toFixed(2) + ' к оплате', need: 1, lock: false }];
        },
        start: function (p, s) {
            s.veh = J().jobVeh(p, { car: 'utillitruck3', carPos: CAR_DEF }, null);
            s.veh.setVariable('powerVeh', 1);
            s.fixed = 0;
            nextSite(p, s);
            return null;
        },
        here: function (p, s) {
            if (!s.site || p.vehicle) return p.vehicle ? notify(p, 'warn', 'Выйдите из машины') : null;
            if (Math.hypot(p.position.x - s.site.x, p.position.y - s.site.y) > 4) return;
            const lv = J().level(p, 'power');
            if (!s.puzzle) s.puzzle = genPuzzle(lv.lvl);
            const P = s.puzzle;
            P.at = Date.now(); P.hints = P.hints || 0;
            try { p.playAnimation('mini@repair', 'fixing_a_ped', 8, 49); } catch (e) {}
            p.call('power:open', [JSON.stringify({ W: P.W, H: P.H, t: tiles(P), src: P.src, houses: P.houses, locked: P.locked, blocked: P.blocked, time: TIME[lv.lvl - 1], site: s.site.n, cause: s.site.cause, lvl: lv.lvl, hints: 2 - P.hints })]);
        },
        stop: function (p) { p.call('power:close', []); }
    };
}

mp.events.add('srv:power:done', function (p, json, moves) {
    const s = p.job;
    if (!s || s.id !== 'power' || !s.puzzle) return;
    let rots = []; try { rots = JSON.parse(json) || []; } catch (e) {}
    const P = s.puzzle;
    try { p.stopAnimation(); } catch (e) {}
    if (!check(P, rots)) return notify(p, 'error', 'Схема не замкнута — проверьте провода');
    const lv = J().level(p, 'power');
    const sec = (Date.now() - P.at) / 1000, limit = TIME[lv.lvl - 1];
    const cells = P.sol.filter(Boolean).length;
    let sum = 70 + cells * 2.2;
    const fast = sec < limit * 0.4, clean = Number(moves) <= cells * 1.6;
    if (fast) sum *= 1.3;
    if (clean) sum *= 1.15;
    sum *= Math.pow(0.8, P.hints || 0);
    sum = Math.round(sum * lv.mult);
    J().pay(p, sum, 'power');
    J().addXp(p, 'power', 1 + (fast ? 1 : 0));
    s.fixed = (s.fixed || 0) + 1;
    const id = sid(p);
    if (!S.stats[id]) S.stats[id] = { n: 0, best: 0 };
    S.stats[id].n++; if (!S.stats[id].best || sec < S.stats[id].best) S.stats[id].best = Math.round(sec); dirty = true;
    notify(p, 'ok', 'Свет в районе ' + s.site.n + ' восстановлен за ' + Math.round(sec) + ' с! +' + money(sum) + (fast ? ' · бонус за скорость' : '') + (clean ? ' · чистая работа' : ''));
    mp.players.forEachInRange(p.position, 40, function (x) { if (x !== p) x.outputChatBox('!{#ffd84a}⚡ В районе снова появился свет — энергетик ' + String((p.account && p.account.nick) || p.name).replace(/_/g, ' ') + ' устранил аварию'); });
    setTimeout(function () { if (mp.players.exists(p) && p.job === s) nextSite(p, s); }, 2500);
});
mp.events.add('srv:power:fail', function (p) {
    const s = p.job;
    if (!s || s.id !== 'power' || !s.puzzle) return;
    try { p.stopAnimation(); } catch (e) {}
    s.puzzle = null;
    try { p.health = Math.max(5, p.health - 15); } catch (e) {}
    notify(p, 'error', 'Короткое замыкание! Вас ударило током. Схему придётся собирать заново');
});
mp.events.add('srv:power:cancel', function (p) { try { p.stopAnimation(); } catch (e) {} });
mp.events.add('srv:power:hint', function (p, json) {
    const s = p.job;
    if (!s || s.id !== 'power' || !s.puzzle) return;
    const P = s.puzzle;
    if ((P.hints || 0) >= 2) return;
    let rots = []; try { rots = JSON.parse(json) || []; } catch (e) {}
    const t = tiles(P), wrong = [];
    for (let i = 0; i < t.length; i++) {
        if (!t[i] || P.locked.indexOf(i) >= 0) continue;
        if (rotN(t[i], Number(rots[i]) || 0) !== P.sol[i]) wrong.push(i);
    }
    if (!wrong.length) return;
    P.hints = (P.hints || 0) + 1;
    const c = wrong[Math.floor(Math.random() * wrong.length)];
    let r = 0; while (r < 4 && rotN(t[c], r) !== P.sol[c]) r++;
    p.call('power:hint', [c, r, 2 - P.hints]);
});
mp.events.addCommand('powerbase', function (p) {
    if (admLvl(p) < 7) return;
    S.base = { x: p.position.x, y: p.position.y, z: p.position.z }; dirty = true;
    if (J() && J().JOBS.power) J().JOBS.power.base = S.base;
    if (J() && J().sendBases) J().sendBases();
    p.outputChatBox('!{#8fd14f}База энергетиков перенесена сюда');
});
mp.events.addCommand('powerstats', function (p) {
    const x = S.stats[sid(p)];
    p.outputChatBox('!{#ffd84a}[Энергетик] !{#ffffff}' + (x ? 'Устранено аварий: ' + x.n + ' · рекорд: ' + x.best + ' с' : 'Вы ещё не устраняли аварий'));
});

function sendStatic(p) { const R = rentPt(); p.call('rent:point', [R.x, R.y, R.z]); }
mp.events.add('playerReady', function (p) { setTimeout(function () { if (mp.players.exists(p)) sendStatic(p); }, 4500); });

function register() {
    if (!J() || !J().JOBS) return setTimeout(register, 1000);
    J().JOBS.power = jobDef();
    if (J().sendBases) J().sendBases();
    mp.players.forEach(sendStatic);
}
register();
console.log('[power] прокат скутеров и работа «Аварийный энергетик» загружены');

/* ---------- метки в редакторе /points ---------- */
const PR = global.PointReg || require('./points.js');
PR.add('power.rent', { g: 'Город', n: 'Прокат скутеров', get: rentPt, set: function (v) { S.rent = v; dirty = true; mp.players.forEach(sendStatic); }, reset: function () { S.rent = null; dirty = true; mp.players.forEach(sendStatic); } });
PR.add('power.base', { g: 'Работа: Энергетик', n: 'Устройство на работу', get: basePt, set: function (v) { S.base = v; dirty = true; register(); }, reset: function () { S.base = null; dirty = true; register(); } });
