const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'lic_data.json');
const CAT = {
    B: { n: 'Категория B (легковые)', fee: 600, lim: 60, time: 9, models: ['asea', 'blista'] },
    C: { n: 'Категория C (грузовые)', fee: 1200, lim: 50, time: 11, models: ['mule', 'benson'] },
    D: { n: 'Категория D (автобусы)', fee: 1500, lim: 45, time: 12, models: ['bus', 'coach'] }
};
const SHARE = 0.4;
const THEORY_NEED = 8;
const QUESTIONS = [
    ['Какая максимальная скорость в черте города?', ['60 км/ч', '80 км/ч', '100 км/ч', 'Без ограничений'], 0],
    ['Что означает красный сигнал светофора?', ['Движение запрещено', 'Можно ехать с осторожностью', 'Приготовиться к движению', 'Только поворот направо'], 0],
    ['Кому нужно уступить дорогу при включённых сиренах и мигалках?', ['Спецтранспорту', 'Никому', 'Только скорой помощи', 'Только если он сзади'], 0],
    ['Как поступить с пешеходом на нерегулируемом переходе?', ['Остановиться и пропустить', 'Посигналить и проехать', 'Объехать его', 'Ускориться'], 0],
    ['Разрешено ли управлять машиной в состоянии опьянения?', ['Запрещено всегда', 'Можно, если немного', 'Можно ночью', 'Можно за городом'], 0],
    ['Что делать при ДТП в первую очередь?', ['Остановиться, включить аварийку, помочь пострадавшим', 'Уехать с места', 'Сфотографировать и уехать', 'Позвонить другу'], 0],
    ['С какой стороны разрешён обгон?', ['Слева', 'Справа', 'С любой стороны', 'По обочине'], 0],
    ['Какой документ водитель обязан предъявить полиции?', ['Водительское удостоверение', 'Военный билет', 'Мед. книжку', 'Ничего'], 0],
    ['Можно ли разговаривать по телефону за рулём без гарнитуры?', ['Нельзя', 'Можно', 'Можно на светофоре', 'Можно на трассе'], 0],
    ['Что означает сплошная линия разметки?', ['Пересекать запрещено', 'Можно пересекать при обгоне', 'Место для парковки', 'Полоса для автобусов'], 0],
    ['Как обозначается остановка в неположенном месте при поломке?', ['Аварийная сигнализация и знак', 'Ближний свет', 'Звуковой сигнал', 'Никак'], 0],
    ['Кто имеет преимущество на перекрёстке равнозначных дорог?', ['Помеха справа', 'Тот, кто быстрее', 'Помеха слева', 'Более крупная машина'], 0],
    ['Что делать по требованию сотрудника полиции остановиться?', ['Остановиться у края дороги', 'Уехать', 'Ускориться', 'Проигнорировать'], 0],
    ['Обязан ли водитель пристёгиваться ремнём безопасности?', ['Да, всегда', 'Только на трассе', 'Только ночью', 'Нет'], 0],
    ['Можно ли ехать по встречной полосе для объезда пробки?', ['Нельзя', 'Можно', 'Можно, если быстро', 'Можно с аварийкой'], 0]
];
const PENALTY = { nolic: 1500, nocat: 800 };
const MAX_HITS = 2;
const DEF_ROUTES = {
    B: [[214.6, -829.8, 30.5], [167.0, -952.0, 30.0], [60.4, -1000.0, 29.3], [-51.0, -1080.0, 26.7], [-180.0, -1010.0, 29.3], [-240.0, -860.0, 30.6], [-160.0, -760.0, 32.6], [-50.0, -720.0, 44.1], [95.0, -760.0, 31.4], [195.0, -800.0, 31.0], [232.0, -799.0, 30.5]],
    C: [[214.6, -829.8, 30.5], [260.0, -940.0, 29.3], [400.0, -1000.0, 29.3], [480.0, -1180.0, 29.3], [430.0, -1500.0, 29.3], [250.0, -1500.0, 29.2], [130.0, -1300.0, 29.2], [60.4, -1000.0, 29.3], [167.0, -952.0, 30.0], [232.0, -799.0, 30.5]],
    D: [[214.6, -829.8, 30.5], [298.0, -603.0, 43.0], [404.4, -995.4, 29.3], [297.0, -1390.0, 31.8], [130.0, -1300.0, 29.2], [-51.0, -1080.0, 26.7], [-240.0, -860.0, 30.6], [-50.0, -720.0, 44.1], [195.0, -800.0, 31.0], [232.0, -799.0, 30.5]]
};
const S = Object.assign({ routes: {}, stats: {} }, (function () { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch (e) { return {}; } })());
let dirty = false;
setInterval(function () { if (dirty) { dirty = false; try { fs.writeFileSync(FILE, JSON.stringify(S)); } catch (e) {} } }, 5000);

function G() { return global.GovFaction; }
function U() { return global.UiSystem; }
function M() { return global.MoneySystem; }
function sid(p) { return p && p.account && p.account.id ? Number(p.account.id) : 0; }
function nick(p) { return String((p.account && p.account.nick) || p.name).replace(/_/g, ' '); }
function isLic(p) { return !!(p.account && p.account.job === 'lic'); }
function admLvl(p) { return global.AdminSystem && global.AdminSystem.realLvl ? global.AdminSystem.realLvl(p) : 0; }
function notify(p, type, text) { if (typeof global.hudNotify === 'function') global.hudNotify(p, type, text); else p.outputChatBox(text); }
function money(n) { return '$' + String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function route(c) { return S.routes[c] && S.routes[c].length >= 3 ? S.routes[c] : DEF_ROUTES[c]; }
function flog(t) { if (G() && G().flog) G().flog('lic', t); }

const exams = {};
const theory = {};
const passedTheory = {};
function examOf(p) { const s = sid(p); return s && exams[s] ? exams[s] : null; }
function examBy(p) { const s = sid(p); return Object.keys(exams).map(function (k) { return exams[k]; }).find(function (e) { return e.ins === s; }) || null; }

function finish(e, ok, why) {
    if (!e || e.done) return;
    e.done = true;
    delete exams[e.st];
    const st = mp.players.toArray().find(function (x) { return sid(x) === e.st; });
    const ins = mp.players.toArray().find(function (x) { return sid(x) === e.ins; });
    if (e.v && mp.vehicles.exists(e.v)) e.v.licStudent = null;
    if (st) { st.call('lic:stop', []); st.setVariable('inExam', false); }
    const c = CAT[e.cat];
    if (ok && st && U() && U().addDriveCat) {
        const cats = U().addDriveCat(st, e.cat, 'Лицензионный центр · ' + (ins ? nick(ins) : 'экзаменатор'));
        notify(st, 'ok', 'Экзамен сдан! Открыта ' + c.n + '. Категории в правах: ' + cats.join(', '));
    } else if (st) notify(st, 'error', 'Экзамен не сдан: ' + why);
    if (ins) notify(ins, ok ? 'ok' : 'warn', (st ? nick(st) : 'Ученик') + (ok ? ' сдал ' : ' не сдал ') + c.n + (ok ? '' : ' — ' + why));
    if (!S.stats[e.ins]) S.stats[e.ins] = { n: 0, ok: 0, earn: 0 };
    S.stats[e.ins].n++; if (ok) S.stats[e.ins].ok++; dirty = true;
    flog((ins ? nick(ins) : '#' + e.ins) + ': экзамен ' + e.cat + ' — ' + (st ? nick(st) : '#' + e.st) + (ok ? ' сдал' : ' не сдал (' + why + ')'));
    if (st && ins && st.vehicle === e.v) {
        setTimeout(function () { try { if (mp.players.exists(st) && st.vehicle) st.removeFromVehicle(); } catch (x) {} }, 2500);
    }
}

function charge(p, sum) {
    const m = M(); if (!m) return false;
    const cash = m.get(p), bank = m.bank(p);
    if (cash + bank < sum) return false;
    const fb = Math.max(0, sum - cash);
    m.set(p, cash - (sum - fb), bank - fb, 'lic-exam');
    return true;
}

mp.events.addCommand('exam', function (p, full) {
    if (!isLic(p)) return notify(p, 'warn', 'Только для сотрудников лицензионного центра');
    const a = String(full || '').trim().split(/\s+/);
    const t = mp.players.at(Number(a[0])), cat = String(a[1] || '').toUpperCase();
    if (!t || !CAT[cat]) return p.outputChatBox('!{#ffcc66}/exam [id] [B/C/D] — сядьте на пассажирское место учебной машины, ученик рядом. /examstop — прервать');
    if (t === p || !t.account) return notify(p, 'warn', 'Нельзя');
    if (examBy(p)) return notify(p, 'warn', 'У вас уже идёт экзамен');
    if (examOf(t)) return notify(p, 'warn', 'Этот игрок уже сдаёт экзамен');
    const v = p.vehicle;
    if (!v || v.getVariable('gov') !== 'lic') return notify(p, 'warn', 'Сядьте в учебную машину центра (гараж центра)');
    if (CAT[cat].models.indexOf(v.getVariable('govModel')) < 0) return notify(p, 'warn', 'Для ' + cat + ' нужна машина: ' + CAT[cat].models.join(' / '));
    if (p.seat === 0 || p.seat === -1) return notify(p, 'warn', 'Инструктор садится на пассажирское место — водить будет ученик');
    if (t.position.subtract(v.position).length() > 10) return notify(p, 'warn', 'Ученик должен стоять у машины');
    if (U() && U().driveCats && U().driveCats(t).indexOf(cat) >= 0) return notify(p, 'warn', 'У игрока уже есть категория ' + cat);
    if (cat !== 'B' && U() && U().driveCats && U().driveCats(t).indexOf('B') < 0) return notify(p, 'warn', 'Сначала нужно сдать категорию B');
    if (!passedTheory[sid(t) + ':' + cat] || Date.now() - passedTheory[sid(t) + ':' + cat] > 1800000) {
        startTheory(t, p, cat);
        return notify(p, 'ok', nick(t) + ' проходит теорию (10 вопросов). После сдачи повторите /exam');
    }
    t.licOffer = { by: sid(p), byId: p.id, cat: cat, v: v, at: Date.now() };
    t.call('social:offer', [nick(p) + ' предлагает сдать экзамен: ' + CAT[cat].n + ' за ' + money(CAT[cat].fee), 30000]);
    notify(t, 'warn', 'Экзамен ' + CAT[cat].n + ' · ' + money(CAT[cat].fee) + '. Y — согласиться, N — отказаться');
    notify(p, 'ok', 'Предложение отправлено');
});

mp.events.add('srv:int:answer', function (t, yes) {
    const o = t.licOffer;
    if (!o || Date.now() - o.at > 30000) return;
    t.licOffer = null;
    const p = mp.players.at(o.byId);
    if (!p || sid(p) !== o.by) return;
    if (!yes) return notify(p, 'warn', nick(t) + ' отказался от экзамена');
    const v = o.v, c = CAT[o.cat];
    if (!mp.vehicles.exists(v) || p.vehicle !== v) return notify(t, 'error', 'Инструктор вышел из машины');
    if (v.getOccupant && v.getOccupant(0) && v.getOccupant(0) !== t) return notify(t, 'error', 'Водительское место занято');
    if (!charge(t, c.fee)) return notify(t, 'error', 'Не хватает денег: нужно ' + money(c.fee)), notify(p, 'warn', nick(t) + ': не хватает денег');
    const bonus = Math.floor(c.fee * SHARE);
    if (M()) M().addBank(p, bonus);
    if (global.GovSystem) global.GovSystem.add(c.fee - bonus, 'Экзамен ' + o.cat + ': ' + nick(t));
    if (!S.stats[o.by]) S.stats[o.by] = { n: 0, ok: 0, earn: 0 };
    S.stats[o.by].earn += bonus; dirty = true;
    notify(p, 'ok', 'Премия за экзамен: ' + money(bonus) + ' на счёт');
    const r = route(o.cat);
    const e = { st: sid(t), ins: o.by, cat: o.cat, v: v, i: 0, hits: 0, at: Date.now(), until: Date.now() + c.time * 60000 };
    exams[e.st] = e;
    v.licStudent = e.st;
    t.setVariable('inExam', true);
    try { t.putIntoVehicle(v, 0); } catch (x) {}
    setTimeout(function () {
        if (!mp.players.exists(t) || e.done) return;
        t.call('lic:start', [JSON.stringify({ cat: o.cat, n: c.n, lim: c.lim, pts: r, time: c.time, max: MAX_HITS })]);
        if (mp.players.exists(p)) p.call('lic:watch', [JSON.stringify({ n: nick(t), cat: o.cat, total: r.length })]);
    }, 900);
    notify(t, 'ok', 'Экзамен начат. Ограничение ' + c.lim + ' км/ч — превышение = незачёт. Следуйте по меткам');
});

mp.events.add('srv:lic:cp', function (p, i) {
    const e = examOf(p);
    if (!e || e.done || Number(i) !== e.i) return;
    if (p.vehicle !== e.v) return;
    const r = route(e.cat), pt = r[e.i];
    if (Math.hypot(p.vehicle.position.x - pt[0], p.vehicle.position.y - pt[1]) > 14) return;
    if (Date.now() > e.until) return finish(e, false, 'не уложились во время');
    e.i++;
    const ins = mp.players.toArray().find(function (x) { return sid(x) === e.ins; });
    if (ins) ins.call('lic:progress', [e.i, r.length, e.hits]);
    if (e.i >= r.length) return finish(e, true);
    p.call('lic:next', [e.i]);
});
mp.events.add('srv:lic:speed', function (p, kmh) {
    const e = examOf(p);
    if (!e || e.done) return;
    finish(e, false, 'превышение скорости (' + Math.round(Number(kmh) || 0) + ' км/ч при лимите ' + CAT[e.cat].lim + ')');
});
mp.events.add('srv:lic:hit', function (p) {
    const e = examOf(p);
    if (!e || e.done) return;
    e.hits++;
    if (e.hits >= MAX_HITS) return finish(e, false, 'повреждение машины (' + e.hits + ' столкновения)');
    notify(p, 'warn', 'Столкновение! Ещё одно — и экзамен провален');
    const ins = mp.players.toArray().find(function (x) { return sid(x) === e.ins; });
    if (ins) notify(ins, 'warn', nick(p) + ': столкновение (' + e.hits + '/' + MAX_HITS + ')');
});
mp.events.add('srv:lic:fail', function (p, why) {
    const e = examOf(p);
    if (e) finish(e, false, String(why || 'нарушение').slice(0, 60));
});
mp.events.add('playerExitVehicle', function (p, v) {
    const e = examOf(p);
    if (e && v === e.v) return finish(e, false, 'вышли из машины');
    const b = examBy(p);
    if (b && v === b.v) finish(b, false, 'инструктор покинул машину');
});
mp.events.add('playerQuit', function (p) {
    const e = examOf(p); if (e) finish(e, false, 'вышли из игры');
    const b = examBy(p); if (b) finish(b, false, 'инструктор вышел из игры');
});
mp.events.add('playerDeath', function (p) {
    const e = examOf(p); if (e) finish(e, false, 'авария');
});
setInterval(function () {
    Object.keys(exams).forEach(function (k) {
        const e = exams[k];
        if (Date.now() > e.until) finish(e, false, 'не уложились во время');
        else if (!e.v || !mp.vehicles.exists(e.v)) finish(e, false, 'машина пропала');
    });
}, 5000);

mp.events.addCommand('examstop', function (p) {
    const e = examBy(p) || (admLvl(p) >= 4 ? null : null);
    if (!e) return notify(p, 'warn', 'У вас нет активного экзамена');
    finish(e, false, 'остановлено инструктором');
});
mp.events.addCommand('licstats', function (p) {
    if (!isLic(p)) return;
    const x = S.stats[sid(p)] || { n: 0, ok: 0, earn: 0 };
    p.outputChatBox('!{#5fd3c6}[ЛЦ] !{#ffffff}Экзаменов: ' + x.n + ' · сдали: ' + x.ok + ' · премий: ' + money(x.earn));
});
mp.events.addCommand('licroute', function (p, full) {
    if (admLvl(p) < 7) return;
    const a = String(full || '').trim().split(/\s+/);
    const c = String(a[0] || '').toUpperCase(), op = a[1];
    if (!CAT[c] || ['add', 'clear', 'undo', 'show', 'reset'].indexOf(op) < 0) return p.outputChatBox('!{#ffcc66}/licroute [B/C/D] [add/undo/clear/show/reset] — точки по порядку, последняя = финиш');
    if (!S.routes[c]) S.routes[c] = [];
    const src = p.vehicle ? p.vehicle.position : p.position;
    if (op === 'add') S.routes[c].push([src.x, src.y, src.z]);
    if (op === 'undo') S.routes[c].pop();
    if (op === 'clear') S.routes[c] = [];
    if (op === 'reset') delete S.routes[c];
    dirty = true;
    if (op === 'show') { p.call('lic:show', [JSON.stringify(route(c))]); return p.outputChatBox('!{#5fd3c6}Маршрут ' + c + ': ' + route(c).length + ' точек показан на 60 с'); }
    const own = S.routes[c] ? S.routes[c].length : 0;
    p.outputChatBox('!{#5fd3c6}Маршрут ' + c + ': своих точек ' + own + (own < 3 ? ' (пока меньше 3 — используется стандартный)' : ''));
});

setInterval(function () {
    mp.players.forEach(function (p) {
        if (!p.account) return;
        const v = admLvl(p) >= 1 ? 'ALL' : (U() && U().driveCats ? U().driveCats(p).join('') : 'ALL');
        if (p.getVariable('dcats') !== v) p.setVariable('dcats', v);
    });
}, 3000);

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function startTheory(t, p, cat) {
    const qs = shuffle(QUESTIONS.slice()).slice(0, 10).map(function (q) {
        const order = shuffle([0, 1, 2, 3]);
        return { q: q[0], a: order.map(function (i) { return q[1][i]; }), r: order.indexOf(q[2]) };
    });
    theory[sid(t)] = { cat: cat, by: sid(p), qs: qs, at: Date.now() };
    t.call('lic:theory', [JSON.stringify({ cat: cat, need: THEORY_NEED, qs: qs.map(function (q) { return { q: q.q, a: q.a }; }) })]);
}
mp.events.add('srv:lic:theory', function (p, json) {
    const T = theory[sid(p)];
    if (!T) return;
    delete theory[sid(p)];
    let ans = []; try { ans = JSON.parse(json) || []; } catch (e) {}
    const ok = T.qs.reduce(function (s, q, i) { return s + (Number(ans[i]) === q.r ? 1 : 0); }, 0);
    const ins = mp.players.toArray().find(function (x) { return sid(x) === T.by; });
    const pass = ok >= THEORY_NEED;
    if (pass) passedTheory[sid(p) + ':' + T.cat] = Date.now();
    notify(p, pass ? 'ok' : 'error', 'Теория: ' + ok + ' из 10. ' + (pass ? 'Сдано! Теперь практика — инструктор предложит поездку' : 'Не сдано (нужно ' + THEORY_NEED + '). Попробуйте снова'));
    if (ins) notify(ins, pass ? 'ok' : 'warn', nick(p) + ': теория ' + ok + '/10 — ' + (pass ? 'сдал, повторите /exam для практики' : 'не сдал'));
    flog(nick(p) + ': теория ' + T.cat + ' — ' + ok + '/10');
});

/* ---- проверка документов полицией ---- */
function catNeed(v) {
    const m = v.getVariable('vcat');
    return m || 'B';
}
function copOk(p) { return !!(p.account && ['lspd', 'sheriff', 'fib'].indexOf(p.account.job) >= 0); }
mp.events.add('srv:lic:vcat', function (p, c) {
    const v = p.vehicle;
    if (v && ['A', 'B', 'C', 'D', ''].indexOf(String(c)) >= 0 && v.getVariable('vcat') !== c) v.setVariable('vcat', String(c));
});
function checkDriver(p, t) {
    if (!copOk(p)) return notify(p, 'warn', 'Доступно только полиции, шерифу и FIB');
    if (!t || !t.account || t.position.subtract(p.position).length() > 5) return notify(p, 'warn', 'Подойдите ближе');
    const cats = U() && U().driveCats ? U().driveCats(t) : [];
    const v = t.vehicle || t.lastVeh;
    const need = v && mp.vehicles.exists(v) ? catNeed(v) : null;
    const viol = !cats.length ? 'nolic' : (need && cats.indexOf(need) < 0 ? 'nocat' : null);
    const line = cats.length ? 'Права: категории ' + cats.join(', ') : 'Водительского удостоверения нет';
    mp.players.forEachInRange(p.position, 12, function (x) { if (x.dimension === p.dimension) x.outputChatBox('!{#c78bff}' + nick(p) + ' проверяет водительские документы у ' + nick(t)); });
    p.call('lic:police', [JSON.stringify({ id: t.id, n: nick(t), info: line + (need ? ' · транспорт кат. ' + need : ''), viol: viol, fine: viol ? PENALTY[viol] : 0, wasDriving: !!(t.lastDriveAt && Date.now() - t.lastDriveAt < 180000) })]);
}
mp.events.add('playerEnterVehicle', function (p, v, seat) { if (seat === 0 || seat === -1) { p.lastVeh = v; p.lastDriveAt = Date.now(); } });
setInterval(function () { mp.players.forEach(function (p) { if (p.vehicle && (p.seat === 0 || p.seat === -1)) { p.lastDriveAt = Date.now(); p.lastVeh = p.vehicle; } }); }, 5000);
mp.events.addCommand('checklic', function (p, full) {
    const t = mp.players.at(Number(String(full || '').trim()));
    if (!t) return p.outputChatBox('!{#ffcc66}/checklic [id] — проверить права водителя');
    checkDriver(p, t);
});
mp.events.add('srv:lic:check', function (p, tid) { checkDriver(p, mp.players.at(Number(tid))); });
mp.events.add('srv:lic:punish', function (p, tid, kind) {
    if (!copOk(p)) return;
    const t = mp.players.at(Number(tid));
    if (!t || !t.account || t.position.subtract(p.position).length() > 8) return notify(p, 'warn', 'Нарушитель слишком далеко');
    const cats = U() && U().driveCats ? U().driveCats(t) : [];
    const why = cats.length ? 'Управление ТС без нужной категории' : 'Управление ТС без водительского удостоверения';
    const W = global.WantedSystem, GF = G();
    const say = function (txt) { mp.players.forEachInRange(p.position, 15, function (x) { if (x.dimension === p.dimension) x.outputChatBox('!{#c78bff}' + nick(p) + ' ' + txt); }); };
    if (kind === 'warn') { notify(t, 'warn', 'Офицер ' + nick(p) + ' вынес вам устное предупреждение: ' + why); say('выносит устное предупреждение ' + nick(t)); }
    else if (kind === 'fine' || kind === 'fine2') {
        const sum = (cats.length ? PENALTY.nocat : PENALTY.nolic) * (kind === 'fine2' ? 2 : 1);
        if (GF && GF.autoFine) GF.autoFine(t, sum, why, nick(p));
        notify(t, 'error', 'Штраф ' + money(sum) + ': ' + why + '. Оплатить: /fines');
        say('выписывает штраф ' + nick(t) + ' на ' + money(sum));
    } else if (kind === 'impound') {
        const v = t.lastVeh;
        if (!v || !mp.vehicles.exists(v) || v.position.subtract(p.position).length() > 25) return notify(p, 'warn', 'Машина нарушителя не найдена рядом');
        if (v.getOccupants && v.getOccupants().length) return notify(p, 'warn', 'В машине кто-то есть');
        if (GF && GF.autoFine) GF.autoFine(t, cats.length ? PENALTY.nocat : PENALTY.nolic, why, nick(p));
        try { v.engine = false; v.position = new mp.Vector3(v.spawnPos ? v.spawnPos.x : 409.0, v.spawnPos ? v.spawnPos.y : -1623.0, v.spawnPos ? v.spawnPos.z : 29.3); } catch (e) {}
        notify(t, 'error', 'Ваш транспорт эвакуирован на штрафстоянку + штраф');
        say('вызывает эвакуатор для транспорта ' + nick(t));
    } else if (kind === 'wanted') {
        if (W && W.add) W.add(t, 1, why, nick(p));
        notify(t, 'error', 'Вам выдан розыск: ' + why);
        say('объявляет ' + nick(t) + ' в розыск (1 звезда)');
    } else return;
    flog('Полиция (' + nick(p) + '): ' + nick(t) + ' — ' + why + ' → ' + kind);
});

global.LicSystem = { CAT: CAT, active: function (p) { return !!examOf(p); } };
console.log('[lic] лицензионный центр: экзамены B/C/D');
