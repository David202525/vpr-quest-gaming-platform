const TARIFF = { sms: 2, callMin: 5, start: 200 };
const SIMS = [
    { k: 'std', n: 'Обычный номер', d: 'Случайный номер вида 123-456', price: 50 },
    { k: 'nice', n: 'Красивый номер', d: 'Повторы цифр: 777-123, 555-555 и т.п.', price: 300 },
    { k: 'custom', n: 'Свой номер', d: 'Выберите любой свободный номер 123-456', price: 800 }
];
const TOPUP = [[10, 100], [50, 600], [100, 1300], [250, 3500]];

function U() { return global.UiPhone; }
function notify(p, type, text) { if (typeof global.hudNotify === 'function') global.hudNotify(p, type, text); else p.outputChatBox(text); }
function bal(d) { if (d.pbal === undefined) d.pbal = TARIFF.start; return d.pbal; }
function nick(p) { const a = p.account; return String((a && a.nick) || p.name).replace(/_/g, ' '); }

function charge(p, kind, n) {
    const u = U(); if (!u) return true;
    const d = u.data(p);
    const cost = kind === 'sms' ? TARIFF.sms : TARIFF.callMin * (n || 1);
    if (bal(d) < cost) { notify(p, 'error', 'Недостаточно средств на балансе телефона. Пополните в M → Донат → Связь'); return false; }
    d.pbal -= cost;
    u.mark();
    return true;
}

/* ---------- SIM-карты ---------- */
function niceNum() {
    const u = U();
    for (let i = 0; i < 200; i++) {
        const a = Math.floor(Math.random() * 10), b = Math.floor(Math.random() * 10);
        const pats = [String(a).repeat(3) + '-' + String(100 + Math.floor(Math.random() * 900)), String(100 + Math.floor(Math.random() * 900)) + '-' + String(a).repeat(3),
            String(a).repeat(3) + '-' + String(b).repeat(3), '' + a + b + a + '-' + b + a + b];
        const n = pats[Math.floor(Math.random() * pats.length)];
        if (n[0] !== '0' && !u.store._numbers[n]) return n;
    }
    return null;
}
function stdNum() {
    const u = U();
    let n;
    do { n = String(100 + Math.floor(Math.random() * 900)) + '-' + String(100 + Math.floor(Math.random() * 900)); } while (u.store._numbers[n]);
    return n;
}
function setNumber(p, n) {
    const u = U(), d = u.data(p), old = d.phone;
    if (old && u.store._numbers[old] === u.key(p)) delete u.store._numbers[old];
    d.phone = n;
    u.store._numbers[n] = u.key(p);
    u.mark();
    return old;
}
mp.events.add('srv:sim:buy', function (p, k, custom) {
    const u = U(); if (!u) return;
    const s = SIMS.find(function (x) { return x.k === k; });
    if (!s) return;
    const d = u.data(p);
    if ((d.coins || 0) < s.price) return notify(p, 'error', 'Недостаточно коинов: нужно ' + s.price + ' RC');
    let n;
    if (k === 'custom') {
        n = String(custom || '').trim();
        if (!/^[1-9]\d{2}-\d{3}$/.test(n)) return notify(p, 'error', 'Номер в формате 123-456 (первая цифра не 0)');
        if (u.store._numbers[n]) return notify(p, 'error', 'Номер ' + n + ' уже занят');
    } else n = k === 'nice' ? niceNum() : stdNum();
    if (!n) return notify(p, 'error', 'Не удалось подобрать номер, попробуйте ещё раз');
    d.coins -= s.price;
    const old = setNumber(p, n);
    notify(p, 'ok', 'Новая SIM-карта: ' + n + (old ? ' (старый номер ' + old + ' отключён)' : ''));
    if (global.SLog) try { global.SLog.add('donate', { actor: p, action: 'sim', amount: s.price, details: (old || '-') + ' → ' + n }); } catch (e) {}
    u.sendMenu(p); u.sendPhone(p);
});
mp.events.add('srv:sim:check', function (p, n) {
    const u = U(); if (!u) return;
    n = String(n || '').trim();
    const ok = /^[1-9]\d{2}-\d{3}$/.test(n) && !u.store._numbers[n];
    p.call('sim:check', [n, ok ? 1 : 0]);
});
mp.events.add('srv:sim:topup', function (p, i) {
    const u = U(); if (!u) return;
    const t = TOPUP[Number(i)];
    if (!t) return;
    const d = u.data(p);
    if ((d.coins || 0) < t[0]) return notify(p, 'error', 'Недостаточно коинов');
    d.coins -= t[0];
    d.pbal = bal(d) + t[1];
    u.mark();
    notify(p, 'ok', 'Баланс телефона пополнен на $' + t[1] + '. Сейчас: $' + Math.floor(d.pbal));
    u.sendMenu(p); u.sendPhone(p);
});
mp.events.add('srv:sim:cash', function (p, sum) {
    const u = U(); if (!u) return;
    sum = Math.floor(Number(sum));
    if (!(sum >= 10 && sum <= 100000)) return notify(p, 'error', 'Сумма от $10');
    const M = global.MoneySystem;
    if (!M || M.bank(p) < sum) return notify(p, 'error', 'Недостаточно денег на банковском счёте');
    M.addBank(p, -sum);
    const d = u.data(p);
    d.pbal = bal(d) + sum;
    u.mark();
    notify(p, 'ok', 'Баланс телефона: $' + Math.floor(d.pbal));
    u.sendPhone(p);
});

/* ---------- звонки ---------- */
const calls = {};
let seq = 1;
function byNumber(n) { const u = U(); const k = u.store._numbers[n]; return k ? u.online(k) : null; }
function nameFor(viewer, num) {
    const u = U(), d = u.data(viewer);
    const c = (d.contacts || []).find(function (x) { return x.number === num; });
    return c ? c.name : num;
}
function state(p) {
    const c = p.callId && calls[p.callId];
    if (!c) return null;
    const other = c.a === p ? c.b : c.a;
    const u = U();
    const num = u.data(other).phone;
    return { st: c.st, out: c.a === p, num: num, name: nameFor(p, num), since: c.since || 0 };
}
function push(c) {
    [c.a, c.b].forEach(function (x) { if (x && mp.players.exists(x)) { x.call('phone:call', [JSON.stringify(state(x))]); } });
}
function voice(c, on) {
    try {
        if (on) { c.a.enableVoiceTo(c.b); c.b.enableVoiceTo(c.a); }
        else { if (mp.players.exists(c.a) && mp.players.exists(c.b)) { c.a.disableVoiceTo(c.b); c.b.disableVoiceTo(c.a); } }
    } catch (e) {}
}
function end(c, why) {
    if (!calls[c.id]) return;
    delete calls[c.id];
    clearTimeout(c.ringT); clearInterval(c.bill);
    if (c.st === 'talk') voice(c, false);
    [c.a, c.b].forEach(function (x) {
        if (!x || !mp.players.exists(x)) return;
        x.callId = 0;
        x.call('phone:call', ['null']);
        if (why) notify(x, 'warn', why);
    });
}
mp.events.add('srv:call:start', function (p, num) {
    const u = U(); if (!u || !p.account) return;
    num = String(num || '').trim();
    if (p.callId) return notify(p, 'warn', 'Вы уже разговариваете');
    if (num === u.data(p).phone) return;
    if (!u.store._numbers[num]) return notify(p, 'error', 'Номер ' + num + ' не обслуживается');
    if (bal(u.data(p)) < TARIFF.callMin) return notify(p, 'error', 'Недостаточно средств на балансе телефона');
    const t = byNumber(num);
    if (!t) return notify(p, 'warn', 'Абонент недоступен или находится вне зоны действия сети');
    if (t.callId) return notify(p, 'warn', 'Абонент занят');
    if (t.account && t.account.downed) return notify(p, 'warn', 'Абонент не отвечает');
    const c = { id: seq++, a: p, b: t, st: 'ring' };
    calls[c.id] = c;
    p.callId = c.id; t.callId = c.id;
    c.ringT = setTimeout(function () { end(c, 'Абонент не ответил'); }, 30000);
    push(c);
});
mp.events.add('srv:call:answer', function (p) {
    const c = p.callId && calls[p.callId];
    if (!c || c.b !== p || c.st !== 'ring') return;
    clearTimeout(c.ringT);
    c.st = 'talk'; c.since = Date.now();
    voice(c, true);
    if (!charge(c.a, 'call', 1)) return end(c, 'Звонок завершён: недостаточно средств');
    c.bill = setInterval(function () {
        if (!mp.players.exists(c.a)) return end(c);
        if (!charge(c.a, 'call', 1)) end(c, 'Звонок завершён: закончились деньги на балансе');
        else U().sendPhone(c.a);
    }, 60000);
    push(c);
});
mp.events.add('srv:call:end', function (p) {
    const c = p.callId && calls[p.callId];
    if (!c) return;
    end(c, c.st === 'ring' && c.b === p ? 'Абонент отклонил вызов' : 'Звонок завершён');
});
mp.events.add('playerQuit', function (p) { const c = p.callId && calls[p.callId]; if (c) end(c, 'Связь прервалась'); });
mp.events.add('playerDeath', function (p) { const c = p.callId && calls[p.callId]; if (c) end(c, 'Связь прервалась'); });

global.PhoneSystem = { charge: charge, state: state, TARIFF: TARIFF, SIMS: SIMS, TOPUP: TOPUP };
console.log('[phone] SIM-карты, баланс и звонки загружены');
