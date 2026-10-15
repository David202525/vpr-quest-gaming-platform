const db = require('../database');

const known = {};
const sent = {};
const pending = {};
const FEMALE = mp.joaat('mp_f_freemode_01');

async function q(sql, args) {
    const r = await db.query(sql, args || []);
    return Array.isArray(r) && Array.isArray(r[0]) ? r[0] : r;
}

setTimeout(function () {
    q('CREATE TABLE IF NOT EXISTS acquaintances (account_id INT NOT NULL, known_id INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (account_id, known_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4')
        .catch(function (e) { console.log('[social] ' + e.message); });
}, 2000);

function acc(p) { return p ? (p.account || p.admAcc || null) : null; }
function sid(p) { const a = acc(p); return a && a.id ? Number(a.id) : 0; }
function nick(p) { const a = acc(p); return String(a && a.nick ? a.nick : p.name).replace(/_/g, ' '); }
function isAdmin(p) {
    const A = global.AdminSystem;
    if (!A) return false;
    return (typeof A.realLvl === 'function' ? A.realLvl(p) : A.lvl(p)) >= 1;
}
function female(p) { return p.model === FEMALE; }
function knows(viewer, x) {
    const a = sid(viewer), b = sid(x);
    if (!a || !b) return false;
    if (a === b || isAdmin(viewer)) return true;
    return !!(known[a] && known[a].has(b));
}
function seen(viewer, x) {
    return knows(viewer, x) ? nick(x) : (female(x) ? 'Гражданка' : 'Гражданин') + ' #' + sid(x);
}
function notify(p, type, text) {
    if (!mp.players.exists(p)) return;
    if (typeof global.hudNotify === 'function') global.hudNotify(p, type, text);
    else p.call('hud:notify', [type, text, 4000]);
}
function near(a, b, r) {
    if (!a || !b || !mp.players.exists(a) || !mp.players.exists(b) || a === b) return false;
    if (a.dimension !== b.dimension) return false;
    const dx = a.position.x - b.position.x, dy = a.position.y - b.position.y, dz = a.position.z - b.position.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz) <= (r || 3);
}
function target(p, rid) {
    const t = mp.players.at(Number(rid));
    if (!t || !sid(t)) { notify(p, 'error', 'Игрок не найден'); return null; }
    if (!near(p, t, 3.5)) { notify(p, 'error', 'Подойдите ближе'); return null; }
    return t;
}

const loading = {};
async function loadKnown(p) {
    const id = sid(p);
    if (!id || known[id] || loading[id]) return;
    loading[id] = true;
    try {
        const rows = await q('SELECT known_id FROM acquaintances WHERE account_id = ?', [id]);
        const set = known[id] || new Set();
        rows.forEach(function (r) { set.add(Number(r.known_id)); });
        known[id] = set;
    } catch (e) {
        console.log('[social] load: ' + e.message);
    }
    loading[id] = false;
    sent[p.id] = null;
}

function push(p, force) {
    if (!mp.players.exists(p) || !sid(p)) return;
    const map = {};
    mp.players.forEach(function (x) {
        const s = sid(x);
        if (s && x !== p && knows(p, x)) map[s] = nick(x);
    });
    const json = JSON.stringify(map);
    if (!force && sent[p.id] === json) return;
    sent[p.id] = json;
    p.call('social:names', [json]);
}

function learn(who, whom) {
    const a = sid(who), b = sid(whom);
    if (!a || !b || a === b) return;
    if (!known[a]) known[a] = new Set();
    if (known[a].has(b)) return;
    known[a].add(b);
    q('INSERT IGNORE INTO acquaintances (account_id, known_id) VALUES (?, ?)', [a, b]).catch(function () {});
    push(who, true);
}

setInterval(function () {
    mp.players.forEach(function (p) {
        const id = sid(p);
        if (!id) return;
        if (p.getVariable('sid') !== id) p.setVariable('sid', id);
        loadKnown(p);
        push(p, false);
    });
}, 2000);

mp.events.add('playerQuit', function (p) {
    delete sent[p.id];
    delete pending[p.id];
});

function face(a, b) {
    const ang = Math.atan2(b.position.y - a.position.y, b.position.x - a.position.x) * 180 / Math.PI - 90;
    a.heading = ang;
}

mp.events.add('srv:int:shake', function (p, rid) {
    const t = target(p, rid);
    if (!t) return;
    const cur = pending[t.id];
    if (cur && cur.until > Date.now()) return notify(p, 'warn', 'Игрок занят другим предложением');
    pending[t.id] = { from: p.id, fromSid: sid(p), until: Date.now() + 15000 };
    t.call('social:offer', [seen(t, p) + ' предлагает пожать руку', 15000]);
    notify(p, 'ok', 'Вы протянули руку. Ждём ответа…');
});

mp.events.add('srv:int:answer', function (p, yes) {
    const o = pending[p.id];
    delete pending[p.id];
    if (!o || o.until < Date.now()) return;
    const from = mp.players.at(o.from);
    if (!from || sid(from) !== o.fromSid) return;
    if (!yes) {
        notify(from, 'warn', seen(from, p) + ' отказался пожать руку');
        return;
    }
    if (!near(p, from, 3.5)) return notify(p, 'error', 'Слишком далеко');
    face(p, from);
    face(from, p);
    try {
        from.playAnimation('mp_ped_interaction', 'handshake_guy_a', 8, 0);
        p.playAnimation('mp_ped_interaction', 'handshake_guy_b', 8, 0);
    } catch (e) {}
    learn(p, from);
    learn(from, p);
    notify(p, 'ok', 'Вы познакомились: ' + nick(from));
    notify(from, 'ok', 'Вы познакомились: ' + nick(p));
});

mp.events.add('srv:int:passport', function (p, rid) {
    const t = target(p, rid);
    if (!t) return;
    const U = global.UiSystem;
    if (!U || !U.hasDoc(p, 'passport')) return notify(p, 'error', 'У вас нет паспорта');
    if (typeof U.showDoc === 'function') U.showDoc(p, t, 'passport');
    learn(t, p);
    notify(p, 'ok', 'Вы показали паспорт');
    notify(t, 'warn', nick(p) + ' показывает вам паспорт');
});

mp.events.add('srv:int:pay', function (p, rid, amount) {
    const t = target(p, rid);
    if (!t) return;
    const M = global.MoneySystem;
    if (!M) return notify(p, 'error', 'Деньги недоступны');
    const n = Math.floor(Number(amount) || 0);
    if (n < 1 || n > 100000) return notify(p, 'error', 'Сумма от $1 до $100 000');
    if (M.get(p) < n) return notify(p, 'error', 'Недостаточно наличных');
    M.add(p, -n);
    M.add(t, n);
    try {
        p.playAnimation('mp_common', 'givetake1_a', 8, 0);
        t.playAnimation('mp_common', 'givetake1_b', 8, 0);
    } catch (e) {}
    notify(p, 'ok', 'Вы передали $' + n.toLocaleString('ru-RU') + ' — ' + seen(p, t));
    notify(t, 'ok', seen(t, p) + ' передал вам $' + n.toLocaleString('ru-RU'));
    if (global.AdminCore && global.AdminCore.log) global.AdminCore.log(p, 'pay', nick(t), '$' + n);
});

mp.events.add('srv:int:wave', function (p) {
    try { p.playAnimation('friends@frj@ig_1', 'wave_a', 8, 48); } catch (e) {}
});

global.SocialSystem = { learn: learn, seen: seen, knows: knows, sid: sid };
console.log('[social] ники, статики и меню взаимодействия (G) загружены');
module.exports = global.SocialSystem;
