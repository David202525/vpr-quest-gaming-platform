const fs = require('fs');
const path = require('path');
const A = global.AdminCore;
if (!A) throw new Error('AdminCore не найден');
const { q, acc, lvl, realLvl, can, login, msg, find, staff, log, canTouch, rankName, rankColor, SHORT, MAX, toast } = A;

const STORE_FILE = path.join(A.dir, 'admin_ext.json');
const S = Object.assign({
    jail: {}, lic: {}, markers: [], mapping: [], zones: null, zonesOn: true, traffic: true,
    fleet: {}, fweap: {}, ochs: [], banHist: [], jobOff: {}, facOff: {}, nicks: {}, consoleTokens: {}
}, A.readJson(STORE_FILE, {}));
if (!S.zones) S.zones = [
    { n: 'Больница Pillbox', x: 298.6, y: -584.4, z: 43.3, r: 60, on: true },
    { n: 'Мэрия', x: -544.8, y: -204.4, z: 38.2, r: 70, on: true },
    { n: 'Банк Legion', x: 150.3, y: -1040.2, z: 29.4, r: 35, on: true },
    { n: 'Автосалон', x: -56.5, y: -1096.6, z: 26.4, r: 45, on: true }
];
let dirty = false;
function save() { dirty = true; }
setInterval(function () { if (dirty) { dirty = false; A.writeJson(STORE_FILE, S); } }, 5000);

const FACTIONS = { lspd: 'LSPD', sheriff: 'Sheriff', fib: 'FIB', medic: 'EMS', army: 'Армия', gov: 'Правительство', news: 'Weazel News' };
const JOBS = { farm: 'Ферма', bus: 'Водитель автобуса', courier: 'Курьер' };
const LICS = { drive: 'Водительские права', bus: 'Лицензия на автобус', taxi: 'Лицензия такси', truck: 'Права на грузовик', gun: 'Лицензия на оружие' };
const AZ = { x: -75.2, y: -818.9, z: 326.2 };
const DEMORGAN = { x: 1691.4, y: 2565.7, z: 45.6, dim: 999, r: 45 };
const KPZ = { x: 459.9, y: -994.2, z: 24.9, out: { x: 432.1, y: -981.4, z: 30.7 }, r: 12 };
const GOV_MODELS = ['police', 'police2', 'police3', 'police4', 'policeb', 'policet', 'polmav', 'sheriff', 'sheriff2', 'fbi', 'fbi2', 'riot', 'riot2', 'pranger', 'ambulance', 'firetruk', 'lguard', 'pbus', 'predator',
    'barracks', 'barracks2', 'barracks3', 'crusader', 'rhino', 'khanjali', 'apc', 'insurgent', 'insurgent2', 'insurgent3', 'hydra', 'lazer', 'buzzard', 'savage', 'annihilator', 'valkyrie', 'valkyrie2',
    'oppressor', 'oppressor2', 'deluxo', 'vigilante', 'thruster', 'akula', 'hunter', 'strikeforce', 'chernobog', 'halftrack', 'nightshark', 'scramjet', 'toreador', 'stromberg', 'ruiner2'];
const MALE = ['Иван', 'Алексей', 'Дмитрий', 'Максим', 'Артём', 'Никита', 'Егор', 'Michael', 'James', 'Daniel', 'Jack', 'Ryan', 'Kevin', 'Victor', 'Leon', 'Oscar'];
const FEMALE = ['Анна', 'Мария', 'Дарья', 'Елена', 'Алина', 'Виктория', 'Ксения', 'Emily', 'Sarah', 'Jessica', 'Olivia', 'Sophia', 'Emma', 'Mia', 'Chloe', 'Grace'];
const LAST = ['Smith', 'Johnson', 'Brown', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Clark', 'Walker', 'Young', 'King', 'Wright', 'Carter', 'Turner', 'Parker', 'Evans', 'Collins', 'Morgan', 'Cooper', 'Reed'];

function V(x, y, z) { return new mp.Vector3(Number(x), Number(y), Number(z)); }
function sid(p) { const a = acc(p); return a && a.id ? Number(a.id) : 0; }
function nick(p) { const a = acc(p); return String((a && a.nick) || p.name).replace(/_/g, ' '); }
function who(p) { return nick(p) + ' [' + p.id + '] #' + sid(p); }
function admNote(text) { staff('!{#ff9f43}' + text); }
function money(n) { return '$' + String(Math.floor(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function ago(ms) { const s = Math.floor(ms / 1000); if (s < 60) return s + ' сек'; if (s < 3600) return Math.floor(s / 60) + ' мин'; return Math.floor(s / 3600) + ' ч ' + Math.floor(s % 3600 / 60) + ' мин'; }
function vehAt(id) { const v = mp.vehicles.at(Number(id)); return v && mp.vehicles.exists(v) ? v : null; }
function front(p, m) { const r = (p.heading || 0) * Math.PI / 180; return V(p.position.x - Math.sin(r) * m, p.position.y + Math.cos(r) * m, p.position.z); }
function cmd(name, perm, usage, fn) { A.cmd(name, perm, usage, fn); }
function need(p, ok, u) { if (!ok) { msg(p, 'Использование: ' + u); return false; } return true; }
function touch(p, t) { if (!canTouch(p, t)) { msg(p, 'Нельзя применить к админу своего уровня или выше', '#e05555'); return false; } return true; }
function online(staticId) { return mp.players.toArray().find(function (x) { return sid(x) === Number(staticId); }) || null; }

setTimeout(function () {
    q('ALTER TABLE accounts ADD COLUMN IF NOT EXISTS leader TINYINT NOT NULL DEFAULT 0');
    q(`CREATE TABLE IF NOT EXISTS admin_global_bans (id INT AUTO_INCREMENT PRIMARY KEY, static_id INT NULL, login VARCHAR(64) NULL, social VARCHAR(64) NULL, serial VARCHAR(160) NULL, ip VARCHAR(64) NULL,
        reason VARCHAR(200) NOT NULL, admin VARCHAR(64) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}, 4000);

/* ================= HISTORY (баны, ники) ================= */
A.banHistory = function (rec, type) {
    S.banHist.unshift({ t: type, login: rec.login, nick: rec.nick || null, static: rec.static || null, ip: rec.ip || null, serial: rec.serial || null, social: rec.social || null,
        reason: rec.reason || '', admin: rec.admin, date: rec.date || Date.now(), until: rec.until || 0 });
    if (S.banHist.length > 5000) S.banHist.length = 5000;
    save();
};
function trackNick(p) {
    const id = sid(p);
    if (!id) return;
    const list = S.nicks[id] || (S.nicks[id] = []);
    const n = nick(p);
    if (!list.length || list[list.length - 1].n !== n) { list.push({ n: n, d: Date.now() }); save(); }
}
setInterval(function () { mp.players.forEach(function (p) { if (sid(p) && !p.nickTracked) { p.nickTracked = true; trackNick(p); } }); }, 5000);

/* ================= REPORTS ================= */
const reports = [];
let repSeq = 0;
A.addReport = function (p, text) {
    const open = reports.find(function (r) { return r.pid === p.id && !r.done; });
    if (open && Date.now() - open.time < 60000) return msg(p, 'Дождитесь ответа на прошлый репорт', '#ffcc66');
    const r = { id: ++repSeq, pid: p.id, name: who(p), text: text.slice(0, 250), time: Date.now(), done: false, by: null, answer: null };
    reports.unshift(r);
    if (reports.length > 200) reports.pop();
    staff('!{#ffcc66}[РЕПОРТ #' + r.id + '] ' + r.name + ': !{#ffffff}' + r.text + ' !{#888}(/ans ' + r.id + ' текст)');
    msg(p, 'Репорт #' + r.id + ' отправлен администрации', '#8fd14f');
};
function answer(p, rid, text) {
    const r = reports.find(function (x) { return x.id === Number(rid); });
    if (!r) return 'Репорт не найден';
    if (r.done) return 'На репорт уже ответил ' + r.by;
    r.done = true; r.by = login(p); r.answer = text; r.answeredAt = Date.now();
    p.admLastAnswer = Date.now();
    p.admAnswers = (p.admAnswers || 0) + 1;
    const t = mp.players.at(r.pid);
    if (t && mp.players.exists(t)) t.outputChatBox('!{#c13dff}[Ответ на репорт от ' + SHORT[lvl(p)] + ' ' + login(p) + ']: !{#ffffff}' + text);
    staff(login(p) + ' ответил на репорт #' + r.id);
    log(p, 'report', r.name, text);
    return null;
}
cmd('ans', 'reports', '/ans [№ репорта] [ответ]', function (p, a, u) {
    if (!need(p, a[0] && a[1], u)) return;
    const e = answer(p, a[0], a.slice(1).join(' '));
    if (e) msg(p, e, '#e05555');
});
cmd('reports', 'reports', '/reports', function (p) {
    const open = reports.filter(function (r) { return !r.done; }).slice(0, 10);
    if (!open.length) return msg(p, 'Открытых репортов нет', '#8fd14f');
    open.forEach(function (r) { p.outputChatBox('!{#ffcc66}#' + r.id + ' ' + r.name + ' (' + ago(Date.now() - r.time) + ' назад): !{#ffffff}' + r.text); });
});

/* ================= LEVEL 1 — ХЕЛПЕР ================= */
mp.events.add('srv:adm:idle', function (p, sec) { p.idleSec = Math.max(0, Number(sec) || 0); p.idleAt = Date.now(); });
cmd('afk', 'afk', '/afk [id]', function (p, a, u) {
    const t = find(a[0]);
    if (!need(p, t, u)) return;
    const s = (t.idleSec || 0) + (t.idleAt ? Math.floor((Date.now() - t.idleAt) / 1000) : 0);
    msg(p, who(t) + ' — без активности ' + ago(s * 1000), s > 300 ? '#ff9f43' : '#8fd14f');
});

cmd('spec', 'spec', '/spec [id] — слежка, /specoff — выйти', function (p, a, u) {
    const t = find(a[0]);
    if (!need(p, t, u)) return;
    if (t === p) return msg(p, 'Нельзя следить за собой');
    startSpec(p, t);
});
cmd('specoff', 'spec', '/specoff', function (p) { stopSpec(p); });
mp.events.add('srv:adm:specoff', function (p) { stopSpec(p); });
function startSpec(p, t) {
    if (!p.specBack) p.specBack = { pos: p.position, dim: p.dimension, hp: p.health };
    p.specTarget = t.id;
    p.alpha = 0;
    p.dimension = t.dimension;
    p.position = V(t.position.x, t.position.y, t.position.z - 12);
    p.call('adm:spec', [t.id, nick(t)]);
    log(p, 'spec', login(t), '');
}
function stopSpec(p) {
    if (!p.specBack) return;
    const b = p.specBack;
    p.specBack = null; p.specTarget = null;
    p.call('adm:specOff');
    p.dimension = b.dim;
    p.position = b.pos;
    p.alpha = 255;
}
setInterval(function () {
    mp.players.forEach(function (p) {
        if (p.specTarget === null || p.specTarget === undefined) return;
        const t = mp.players.at(p.specTarget);
        if (!t || !mp.players.exists(t)) { msg(p, 'Игрок вышел — слежка завершена'); return stopSpec(p); }
        if (p.dimension !== t.dimension) p.dimension = t.dimension;
        const d = p.position.subtract ? p.position.subtract(t.position).length() : 999;
        if (d > 25) p.position = V(t.position.x, t.position.y, t.position.z - 12);
    });
}, 1000);

cmd('getcar', 'getcar', '/getcar [id машины] [1-5 метров]', function (p, a, u) {
    const v = vehAt(a[0]);
    if (!need(p, v, u)) return;
    const m = a[1] ? Math.max(1, Math.min(5, Number(a[1]) || 3)) : 3;
    v.position = front(p, m);
    v.dimension = p.dimension;
    log(p, 'getcar', 'veh ' + v.id, m + 'м');
    msg(p, 'Машина #' + v.id + ' перед вами (' + m + ' м)', '#8fd14f');
});
async function ownerText(v) {
    const oid = v.getVariable('ownerId');
    if (!oid) return v.adminSpawned ? 'админ-машина' : v.getVariable('faction') ? 'фракция ' + v.getVariable('faction') : 'без владельца';
    const r = await q('SELECT id, nick, login, phone FROM accounts WHERE id = ? LIMIT 1', [oid]);
    const o = online(oid);
    return r[0] ? (r[0].nick || r[0].login) + ' #' + r[0].id + (o ? ' (онлайн, ID ' + o.id + ')' : ' (офлайн)') : 'аккаунт #' + oid;
}
cmd('carinfo', 'carinfo', '/carinfo [id машины]', async function (p, a, u) {
    const v = vehAt(a[0]);
    if (!need(p, v, u)) return;
    let model = String(v.model);
    msg(p, 'Машина #' + v.id + ' · номер ' + String(v.numberPlate || '—').trim() + ' · модель ' + model + ' · владелец: ' + await ownerText(v), '#7fd4ff');
});
cmd('rnick', 'rnick', '/rnick [m/f]', function (p, a) {
    const f = String(a[0] || '').toLowerCase().indexOf('f') === 0 || String(a[0] || '').indexOf('ж') === 0;
    const L = f ? FEMALE : MALE;
    const n = L[Math.floor(Math.random() * L.length)] + '_' + LAST[Math.floor(Math.random() * LAST.length)];
    msg(p, (f ? 'Женский' : 'Мужской') + ' ник: ' + n, '#8fd14f');
});
cmd('nickrule', 'nickrule', '/nickrule [id]', function (p, a, u) {
    const t = find(a[0]);
    if (!need(p, t, u)) return;
    const lines = [
        '!{#ff9f43}[Администрация] !{#ffffff}' + nick(t) + ', ваш ник нарушает правила сервера (ВПС: ник должен быть в формате Имя_Фамилия, без оскорблений, известных личностей и бессмыслицы).',
        '!{#ffffff}Как сменить: 1) выйдите с сервера; 2) в лаунчере RAGE MP в настройках смените имя на Имя_Фамилия; 3) зайдите снова — либо попросите администратора сменить ник (/report).',
        '!{#ffcc66}Если ник не будет изменён в течение 10 минут — вы будете кикнуты.'
    ];
    lines.forEach(function (l) { t.outputChatBox(l); });
    msg(p, 'Инструкция отправлена ' + who(t), '#8fd14f');
    log(p, 'nickrule', login(t), '');
});
cmd('newbies', 'newbies', '/newbies', async function (p) {
    const r = await q('SELECT id, nick, login, created_at FROM accounts ORDER BY id DESC LIMIT 15');
    if (!r.length) return msg(p, 'Нет данных');
    msg(p, '=== Недавно зарегистрированные ===', '#7fd4ff');
    r.forEach(function (x) { const o = online(x.id); p.outputChatBox('!{#ffffff}#' + x.id + ' ' + (x.nick || x.login) + ' !{#999}' + new Date(x.created_at).toLocaleString('ru-RU') + (o ? ' !{#8fd14f}онлайн ID ' + o.id : '')); });
});
cmd('near', 'near', '/near [id]', function (p, a) {
    const c = a[0] ? find(a[0]) : p;
    if (!c) return msg(p, 'Игрок не найден');
    const list = [];
    mp.players.forEach(function (x) { if (x !== c && x.dimension === c.dimension) { const d = x.position.subtract(c.position).length(); if (d < 40) list.push([d, x]); } });
    list.sort(function (a1, b1) { return a1[0] - b1[0]; });
    if (!list.length) return msg(p, 'Рядом с ' + nick(c) + ' никого нет');
    msg(p, 'Рядом с ' + nick(c) + ':', '#7fd4ff');
    list.slice(0, 15).forEach(function (x) { p.outputChatBox('!{#ffffff}' + who(x[1]) + ' !{#999}— ' + x[0].toFixed(1) + ' м'); });
});
cmd('az', 'az', '/az — в админ-зону и обратно', function (p) {
    if (p.azBack) {
        p.position = p.azBack.pos; p.dimension = p.azBack.dim; p.azBack = null;
        return msg(p, 'Вы вернулись на место', '#8fd14f');
    }
    p.azBack = { pos: p.position, dim: p.dimension };
    p.dimension = 0;
    p.position = V(AZ.x, AZ.y, AZ.z);
    msg(p, 'Вы в админ-зоне. Повторите /az, чтобы вернуться', '#8fd14f');
});
cmd('respcar', 'respawncar', '/respcar [id машины]', function (p, a, u) {
    const v = vehAt(a[0]);
    if (!need(p, v, u)) return;
    respawnVeh(v);
    log(p, 'respcar', 'veh ' + a[0], '');
    msg(p, 'Машина #' + a[0] + ' респавнута', '#8fd14f');
});
function respawnVeh(v) {
    if (v.getOccupants && v.getOccupants().length) v.getOccupants().forEach(function (x) { try { x.removeFromVehicle(); } catch (e) {} });
    if (v.spawnPos) { v.position = V(v.spawnPos.x, v.spawnPos.y, v.spawnPos.z); v.rotation = V(0, 0, v.spawnPos.h || 0); v.repair(); v.engine = false; v.dimension = 0; return; }
    if (v.getVariable('ownerId')) { v.repair(); v.engine = false; v.locked = true; return; }
    v.destroy();
}
cmd('hp', 'healself', '/hp — вылечить себя', function (p) {
    p.health = 100;
    if (global.DeathSystem && p.account && p.account.downed) global.DeathSystem.revive(p);
    log(p, 'healself', login(p), '');
    msg(p, 'Вы вылечены', '#8fd14f');
});
cmd('unjailself', 'unjailself', '/unjailself — выйти из КПЗ', function (p) {
    const j = S.jail[sid(p)];
    if (!j || j.type !== 'kpz') return msg(p, 'Вы не в КПЗ');
    release(p, 'Освобождение (сам)');
});

/* ================= LEVEL 2 — ПОМОЩНИК ================= */
cmd('getpos', 'getpos', '/getpos', function (p) {
    const s = p.position.x.toFixed(2) + ', ' + p.position.y.toFixed(2) + ', ' + p.position.z.toFixed(2) + ' | heading ' + (p.heading || 0).toFixed(1) + ' | dim ' + p.dimension;
    console.log('[getpos] ' + login(p) + ': ' + s);
    msg(p, 'Позиция (записана в консоль сервера): ' + s, '#7fd4ff');
});
cmd('arespawn', 'arespawn', '/arespawn [id] — поднять, вылечить и отправить на спавн', function (p, a) {
    const t = a[0] ? find(a[0]) : p;
    if (!t) return msg(p, 'Игрок не найден');
    if (global.DeathSystem && t.account && t.account.downed) global.DeathSystem.revive(t);
    t.spawn(V(-1037.7, -2737.8, 20.2));
    t.health = 100; t.dimension = 0;
    msg(t, 'Администратор отправил вас на спавн', '#8fd14f');
    log(p, 'arespawn', login(t), '');
});
cmd('o', 'ochat', '/o [текст] — объявление в чат', function (p, a, u, full) {
    if (!full.trim()) return msg(p, u);
    mp.players.broadcast('!{#ff6b6b}[Администрация] !{#ffffff}' + login(p) + ': ' + full.trim());
    log(p, 'ochat', '-', full.trim());
});
cmd('agate', 'gate', '/agate — открыть ворота/шлагбаумы в 15 м', function (p) {
    mp.players.forEach(function (x) { if (x.dimension === p.dimension && x.position.subtract(p.position).length() < 250) x.call('adm:gate', [p.position.x, p.position.y, p.position.z]); });
    msg(p, 'Ворота и шлагбаумы рядом открыты на 20 секунд', '#8fd14f');
});
cmd('tow', 'tow', '/tow — эвакуатор, /hook — прицепить/отцепить', function (p) {
    const v = A.spawnVeh(p, 'towtruck', 89, 0, null, false);
    v.setVariable('admTow', true);
    msg(p, 'Эвакуатор создан. Сдайте задом к машине и введите /hook', '#8fd14f');
});
cmd('hook', 'tow', '/hook', function (p) {
    const tr = p.vehicle;
    if (!tr || !tr.getVariable('admTow')) return msg(p, 'Сядьте в админ-эвакуатор (/tow)');
    const cur = tr.getVariable('towing');
    if (cur !== null && cur !== undefined && cur >= 0) { tr.setVariable('towing', -1); return msg(p, 'Машина отцеплена', '#8fd14f'); }
    const r = (tr.heading || 0) * Math.PI / 180;
    const back = V(tr.position.x + Math.sin(r) * 6, tr.position.y - Math.cos(r) * 6, tr.position.z);
    let best = null, bd = 6;
    mp.vehicles.forEach(function (x) { if (x === tr || x.dimension !== tr.dimension) return; const d = x.position.subtract(back).length(); if (d < bd) { bd = d; best = x; } });
    if (!best) return msg(p, 'Сзади нет машины (подъедьте ближе)');
    tr.setVariable('towing', best.id);
    msg(p, 'Машина #' + best.id + ' на крюке', '#8fd14f');
    log(p, 'tow', 'veh ' + best.id, '');
});
cmd('hideprefix', 'hideprefix', '/hideprefix', function (p) {
    p.hidePrefix = !p.hidePrefix;
    msg(p, 'Префикс админа в чате: ' + (p.hidePrefix ? 'скрыт' : 'показан'), '#8fd14f');
});

/* ================= LEVEL 3 — МЛАДШАЯ АДМИНИСТРАЦИЯ ================= */
function jailPlayer(p, t, type, min, reason) {
    const id = sid(t);
    if (!id) return 'У игрока нет аккаунта';
    S.jail[id] = { type: type, until: Date.now() + min * 60000, reason: reason, by: login(p) };
    save();
    applyJail(t);
    mp.players.broadcast('!{#ff9f43}[' + (type === 'demorgan' ? 'ДЕМОРГАН' : 'КПЗ') + '] !{#ffffff}' + login(p) + ' отправил ' + nick(t) + ' на ' + min + ' мин. Причина: ' + reason);
    log(p, type, login(t), min + ' мин | ' + reason);
    return null;
}
function applyJail(t) {
    const j = S.jail[sid(t)];
    if (!j) return;
    if (t.vehicle) try { t.removeFromVehicle(); } catch (e) {}
    t.removeAllWeapons();
    if (j.type === 'demorgan') { t.dimension = DEMORGAN.dim; t.position = V(DEMORGAN.x, DEMORGAN.y, DEMORGAN.z); }
    else { t.dimension = 0; t.position = V(KPZ.x, KPZ.y, KPZ.z); }
    t.call('adm:jail', [j.type, Math.max(0, j.until - Date.now()), j.reason]);
}
function release(t, why) {
    const j = S.jail[sid(t)];
    if (!j) return;
    delete S.jail[sid(t)];
    save();
    t.dimension = 0;
    t.position = j.type === 'demorgan' ? V(-1037.7, -2737.8, 20.2) : V(KPZ.out.x, KPZ.out.y, KPZ.out.z);
    t.call('adm:jail', ['', 0, '']);
    msg(t, 'Вы освобождены' + (why ? ' (' + why + ')' : ''), '#8fd14f');
}
setInterval(function () {
    mp.players.forEach(function (t) {
        const id = sid(t);
        const j = id && S.jail[id];
        if (!j) return;
        if (Date.now() >= j.until) return release(t, 'срок истёк');
        const c = j.type === 'demorgan' ? DEMORGAN : KPZ;
        const far = t.position.subtract(V(c.x, c.y, c.z)).length() > (c.r || 12);
        if (far || (j.type === 'demorgan' && t.dimension !== DEMORGAN.dim)) applyJail(t);
    });
}, 3000);
mp.events.add('playerSpawn', function (t) { if (S.jail[sid(t)]) setTimeout(function () { if (mp.players.exists(t)) applyJail(t); }, 500); });
global.JailSystem = {
    kpz: function (officer, t, min, reason) { return jailPlayer(officer, t, 'kpz', min, reason); },
    release: release, isJailed: function (t) { return !!S.jail[sid(t)]; }
};
cmd('demorgan', 'demorgan', '/demorgan [id] [минуты] [причина]', function (p, a, u) {
    const t = find(a[0]), min = Math.floor(Number(a[1]));
    if (!need(p, t && min > 0, u)) return;
    if (!touch(p, t)) return;
    const e = jailPlayer(p, t, 'demorgan', Math.min(min, 720), a.slice(2).join(' ') || 'нарушение правил');
    if (e) msg(p, e, '#e05555');
});
cmd('undemorgan', 'demorgan', '/undemorgan [id]', function (p, a, u) {
    const t = find(a[0]);
    if (!need(p, t, u)) return;
    const j = S.jail[sid(t)];
    if (!j || j.type !== 'demorgan') return msg(p, 'Игрок не в деморгане');
    release(t, 'выпустил ' + login(p));
    log(p, 'undemorgan', login(t), '');
    admNote(login(p) + ' выпустил ' + nick(t) + ' из деморгана');
});
cmd('unjail', 'unjail', '/unjail [id] — выпустить из КПЗ', function (p, a, u) {
    const t = find(a[0]);
    if (!need(p, t, u)) return;
    const j = S.jail[sid(t)];
    if (!j || j.type !== 'kpz') return msg(p, 'Игрок не в КПЗ');
    release(t, 'выпустил администратор');
    log(p, 'unjail', login(t), '');
});
cmd('setname', 'setname', '/setname [id] [Имя_Фамилия]', function (p, a, u) {
    const t = find(a[0]);
    const n = String(a[1] || '');
    if (!need(p, t && /^[A-Za-zА-Яа-яЁё]{2,16}_[A-Za-zА-Яа-яЁё]{2,20}$/.test(n), u)) return;
    if (!touch(p, t)) return;
    const old = nick(t);
    t.name = n;
    if (acc(t)) { acc(t).nick = n.replace(/_/g, ' '); q('UPDATE accounts SET nick = ? WHERE id = ?', [acc(t).nick, sid(t)]); }
    if (t.account) t.account.nick = n.replace(/_/g, ' ');
    trackNick(t);
    msg(t, 'Администратор сменил ваш ник на ' + n, '#8fd14f');
    admNote(login(p) + ' сменил ник: ' + old + ' → ' + n);
    log(p, 'setname', old, n);
});
cmd('tpto', 'tpto', '/tpto [id кого] [id к кому]', function (p, a, u) {
    const t1 = find(a[0]), t2 = find(a[1]);
    if (!need(p, t1 && t2, u)) return;
    A.tpTo(t1, t2);
    msg(t1, 'Администратор телепортировал вас к ' + nick(t2));
    log(p, 'tpto', login(t1), '→ ' + login(t2));
    msg(p, nick(t1) + ' → ' + nick(t2), '#8fd14f');
});
A.slap = function (p, t, hp) {
    hp = Math.max(0, Math.min(100, Math.floor(hp || 0)));
    t.position = V(t.position.x, t.position.y, t.position.z + 4);
    if (hp) t.health = Math.max(1, t.health - hp);
    admNote(login(p) + ' слапнул ' + who(t) + (hp ? ' (−' + hp + ' HP)' : ''));
    log(p, 'slap', login(t), hp + ' hp');
};
cmd('slap', 'slap', '/slap [id] [сколько HP снять]', function (p, a, u) {
    const t = find(a[0]);
    if (!need(p, t, u)) return;
    if (!touch(p, t)) return;
    A.slap(p, t, Number(a[1]) || 0);
});
cmd('plate', 'plate', '/plate [гос. номер]', async function (p, a, u) {
    if (!need(p, a[0], u)) return;
    const pl = a.join(' ').toUpperCase();
    const r = await q('SELECT v.id, v.model, v.plate, a.id AS aid, a.nick, a.login FROM vehicles v LEFT JOIN accounts a ON a.id = v.owner_id WHERE UPPER(v.plate) = ? LIMIT 5', [pl]);
    let live = null;
    mp.vehicles.forEach(function (v) { if (!live && String(v.numberPlate || '').trim().toUpperCase() === pl) live = v; });
    if (!r.length && !live) return msg(p, 'Машина с номером ' + pl + ' не найдена', '#e05555');
    r.forEach(function (x) { const o = online(x.aid); msg(p, pl + ' · ' + x.model + ' · владелец ' + (x.nick || x.login) + ' #' + x.aid + (o ? ' (онлайн ID ' + o.id + ')' : ' (офлайн)'), '#7fd4ff'); });
    if (live) msg(p, 'Сейчас на сервере: машина ID ' + live.id, '#7fd4ff');
});
cmd('takelic', 'takelic', '/takelic [id] [drive/bus/taxi/truck/gun] [минуты, 0 = пересдать сразу] [причина]', function (p, a, u) {
    const t = find(a[0]), type = String(a[1] || '').toLowerCase();
    if (!need(p, t && LICS[type], u)) return;
    const min = Math.max(0, Math.floor(Number(a[2]) || 0));
    const id = sid(t);
    if (!S.lic[id]) S.lic[id] = {};
    S.lic[id][type] = { until: min ? Date.now() + min * 60000 : 0, by: login(p), reason: a.slice(3).join(' ') || 'нарушение' };
    save();
    if (global.UiSystem && global.UiSystem.takeDoc) global.UiSystem.takeDoc(t, type === 'truck' ? 'drive' : type);
    msg(t, 'У вас отобрали: ' + LICS[type] + (min ? ' на ' + A.durationText(min) : ' (пересдать можно сразу)'), '#e05555');
    admNote(login(p) + ' отобрал ' + LICS[type] + ' у ' + who(t) + (min ? ' на ' + A.durationText(min) : ''));
    log(p, 'takelic', login(t), type + ' ' + min + 'м');
});
A.licBlocked = function (p, type) { const l = S.lic[sid(p)] && S.lic[sid(p)][type]; if (!l || !l.until) return 0; return l.until > Date.now() ? l.until : 0; };
cmd('fixveh', 'fixveh', '/fixveh [id машины]', function (p, a, u) {
    const v = vehAt(a[0]);
    if (!need(p, v, u)) return;
    v.repair();
    log(p, 'fixveh', 'veh ' + v.id, '');
    msg(p, 'Машина #' + v.id + ' отремонтирована', '#8fd14f');
});
cmd('fixp', 'fixveh', '/fixp [id игрока за рулём]', function (p, a, u) {
    const t = a[0] ? find(a[0]) : p;
    if (!need(p, t && t.vehicle, u)) return;
    t.vehicle.repair();
    log(p, 'fixp', login(t), '');
    msg(p, 'Машина игрока ' + nick(t) + ' отремонтирована', '#8fd14f');
});
cmd('fix', 'fix', '/fix', function (p) {
    if (!p.vehicle) return msg(p, 'Сядь в машину');
    p.vehicle.repair();
    msg(p, 'Машина отремонтирована', '#8fd14f');
});
cmd('setdim', 'setdim', '/setdim [id] [измерение]', function (p, a, u) {
    const t = find(a[0]), d = Math.floor(Number(a[1]));
    if (!need(p, t && d >= 0, u)) return;
    t.dimension = d;
    log(p, 'setdim', login(t), String(d));
    msg(p, nick(t) + ' → измерение ' + d, '#8fd14f');
});
mp.events.add('srv:adm:flyStart', function (p) {
    if (!can(p, 'fly')) return;
    p.admFlyStart = { pos: p.position, dim: p.dimension };
});
mp.events.add('srv:adm:flyBack', function (p) {
    if (p.admFlyStart) { p.position = p.admFlyStart.pos; p.admFlyStart = null; }
});

/* ================= LEVEL 4 — АДМИНИСТРАЦИЯ ================= */
cmd('eject', 'eject', '/eject [id]', function (p, a, u) {
    const t = find(a[0]);
    if (!need(p, t && t.vehicle, u)) return;
    t.removeFromVehicle();
    log(p, 'eject', login(t), '');
    msg(p, nick(t) + ' высажен из машины', '#8fd14f');
});
cmd('respawnpub', 'respawnpub', '/respawnpub — респавн пустого общественного транспорта', function (p) {
    let n = 0;
    mp.vehicles.forEach(function (v) { if (v.getVariable('pub') && !(v.getOccupants && v.getOccupants().length)) { respawnVeh(v); n++; } });
    admNote(login(p) + ' зареспавнил общественный транспорт (' + n + ')');
    log(p, 'respawnpub', '-', String(n));
});
cmd('jetpack', 'jetpack', '/jetpack', function (p) {
    A.spawnVeh(p, 'thruster', 0, 0, null, false);
    msg(p, 'Джетпак выдан. /dv — убрать', '#8fd14f');
});
const objs = [];
function spawnMapObj(o) {
    try { const ob = mp.objects.new(mp.joaat(o.m), V(o.x, o.y, o.z), { rotation: V(0, 0, o.h || 0), dimension: o.dim || 0 }); ob.mapId = o.id; objs.push(ob); } catch (e) { console.log('[mapping] ' + o.m + ': ' + e.message); }
}
setTimeout(function () { S.mapping.forEach(spawnMapObj); console.log('[admin] маппинг: ' + S.mapping.length + ' объектов'); }, 3000);
function addObj(p, model, ex) {
    if (!/^[a-z0-9_]{3,48}$/i.test(model)) return msg(p, 'Неверная модель');
    const pos = front(p, 2);
    const o = { id: Date.now() % 1e9 + Math.floor(Math.random() * 1000), m: model.toLowerCase(), x: pos.x, y: pos.y, z: p.position.z - 1, h: p.heading || 0, dim: p.dimension, ex: !!ex, by: login(p) };
    S.mapping.push(o); save();
    spawnMapObj(o);
    log(p, ex ? 'exmapping' : 'mapping', o.m, '#' + o.id);
    msg(p, (ex ? 'Эксклюзивный объект' : 'Объект') + ' #' + o.id + ' ' + o.m + ' поставлен. /objdel — удалить ближайший', '#8fd14f');
}
cmd('obj', 'mapping', '/obj [модель] — поставить объект', function (p, a, u) { if (!need(p, a[0], u)) return; addObj(p, a[0], false); });
cmd('exobj', 'exmapping', '/exobj [модель] — эксклюзивный маппинг (удалить может только МГА)', function (p, a, u) { if (!need(p, a[0], u)) return; addObj(p, a[0], true); });
cmd('objdel', 'mapping', '/objdel — удалить ближайший объект маппинга', function (p) {
    let best = null, bd = 8;
    S.mapping.forEach(function (o) { if ((o.dim || 0) !== p.dimension) return; const d = V(o.x, o.y, o.z).subtract(p.position).length(); if (d < bd) { bd = d; best = o; } });
    if (!best) return msg(p, 'Рядом нет объектов маппинга');
    if (best.ex && lvl(p) < MAX) return msg(p, 'Это эксклюзивный маппинг — удалить может только МГА', '#e05555');
    S.mapping = S.mapping.filter(function (o) { return o !== best; }); save();
    for (let i = objs.length - 1; i >= 0; i--) if (objs[i].mapId === best.id) { try { objs[i].destroy(); } catch (e) {} objs.splice(i, 1); }
    log(p, 'objdel', best.m, '#' + best.id);
    msg(p, 'Объект ' + best.m + ' удалён', '#8fd14f');
});

/* МП-панель */
const mpVeh = {};
function mpTargets(p, d) {
    if (d.target === 'all') {
        const r = Math.max(5, Math.min(300, Number(d.radius) || 50));
        return mp.players.toArray().filter(function (x) { return x.dimension === p.dimension && x.position.subtract(p.position).length() <= r; });
    }
    const t = find(d.target);
    if (!t) return [];
    if (t !== p && (t.dimension !== p.dimension || t.position.subtract(p.position).length() > 300) && lvl(p) < 6) return null;
    return [t];
}
function mpAction(p, d) {
    const list = mpTargets(p, d);
    if (list === null) return 'МП-панель работает только на игроков рядом (до 300 м)';
    if (!list.length) return 'Нет игроков';
    const op = d.op;
    if (op === 'weapon') { const w = String(d.value || '').toLowerCase(); if (!/^weapon_[a-z0-9_]+$/.test(w)) return 'Неверное оружие'; list.forEach(function (t) { t.giveWeapon(mp.joaat(w), Math.max(1, Math.min(500, Number(d.ammo) || 100))); }); }
    else if (op === 'strip') list.forEach(function (t) { t.removeAllWeapons(); });
    else if (op === 'hp') list.forEach(function (t) { t.health = Math.max(1, Math.min(100, Number(d.value) || 100)); });
    else if (op === 'armour') list.forEach(function (t) { t.armour = Math.max(0, Math.min(100, Number(d.value) || 0)); });
    else if (op === 'skin') { const m = String(d.value || ''); if (!/^[a-z0-9_]{3,40}$/i.test(m)) return 'Неверный скин'; list.forEach(function (t) { t.model = mp.joaat(m); }); }
    else if (op === 'car') {
        const m = String(d.value || '').toLowerCase();
        if (!/^[a-z0-9_]{2,32}$/.test(m)) return 'Неверная модель';
        if ((GOV_MODELS.indexOf(m) >= 0 || A.dlc().some(function (x) { return x.model === m; })) && lvl(p) < 6) return 'В МП-панели нельзя спавнить гос. и эксклюзивные машины';
        list.forEach(function (t) {
            if (mpVeh[t.id] && mp.vehicles.exists(mpVeh[t.id])) mpVeh[t.id].destroy();
            const v = mp.vehicles.new(mp.joaat(m), front(t, 3), { heading: t.heading, numberPlate: 'EVENT', dimension: t.dimension });
            v.adminSpawned = true; A.adminVehs.push(v); mpVeh[t.id] = v;
        });
    }
    else if (op === 'dim') { const dm = Math.max(0, Math.floor(Number(d.value) || 0)); list.forEach(function (t) { t.dimension = dm; }); }
    else if (op === 'bring') list.forEach(function (t) { if (t !== p) A.tpTo(t, p); });
    else if (op === 'freeze') list.forEach(function (t) { if (t !== p) A.doFreeze(p, t, !!d.value); });
    else return 'Неизвестное действие';
    log(p, 'mp:' + op, d.target === 'all' ? 'все в ' + (d.radius || 50) + 'м' : String(d.target), String(d.value || ''));
    return null;
}
mp.events.add('playerQuit', function (p) { if (mpVeh[p.id] && mp.vehicles.exists(mpVeh[p.id])) mpVeh[p.id].destroy(); delete mpVeh[p.id]; if (p.specBack) p.specBack = null; });

/* ================= LEVEL 5 — СТАРШАЯ АДМИНИСТРАЦИЯ ================= */
cmd('respawngov', 'respawngov', '/respawngov — респавн пустого гос. транспорта', function (p) {
    let n = 0;
    mp.vehicles.forEach(function (v) {
        if ((v.getVariable('faction') || v.getVariable('gov')) && !(v.getOccupants && v.getOccupants().length)) { respawnVeh(v); n++; }
    });
    admNote(login(p) + ' зареспавнил гос. транспорт (' + n + ')');
    log(p, 'respawngov', '-', String(n));
});
async function setLeader(p, target, staticId, f) {
    const id = target ? sid(target) : Number(staticId);
    if (!id) return 'Аккаунт не найден';
    if (f && !FACTIONS[f]) return 'Фракции: ' + Object.keys(FACTIONS).join(', ');
    if (f && S.facOff[f]) return 'Фракция отключена';
    await q('UPDATE accounts SET job = ?, job_rank = ?, leader = ? WHERE id = ?', [f || null, f ? 10 : 0, f ? 1 : 0, id]);
    const t = target || online(id);
    if (t && t.account) { t.account.job = f || null; t.account.job_rank = f ? 10 : 0; t.account.leader = f ? 1 : 0; }
    if (t) msg(t, f ? 'Вы назначены лидером фракции ' + FACTIONS[f] : 'Вы сняты с поста лидера', f ? '#8fd14f' : '#ff9f43');
    admNote(login(p) + (f ? ' назначил лидером ' + FACTIONS[f] + ': ' : ' снял лидера: ') + (t ? who(t) : '#' + id) + ' (без записи в трудовую)');
    log(p, f ? 'setleader' : 'unleader', t ? login(t) : '#' + id, f || '');
    return null;
}
cmd('setleader', 'leader', '/setleader [id или #static] [фракция: ' + Object.keys(FACTIONS).join('/') + ']', async function (p, a, u) {
    if (!need(p, a[0] && a[1], u)) return;
    const st = a[0][0] === '#' ? a[0].slice(1) : null;
    const e = await setLeader(p, st ? null : find(a[0]), st, a[1].toLowerCase());
    if (e) msg(p, e, '#e05555');
});
cmd('unleader', 'leader', '/unleader [id или #static]', async function (p, a, u) {
    if (!need(p, a[0], u)) return;
    const st = a[0][0] === '#' ? a[0].slice(1) : null;
    const e = await setLeader(p, st ? null : find(a[0]), st, null);
    if (e) msg(p, e, '#e05555');
});
global.FactionCfg = {
    FACTIONS: FACTIONS,
    fleet: function (f) { return S.fleet[f] || []; },
    weapons: function (f) { return S.fweap[f] || []; },
    canCar: function (f, model, rank) { const x = (S.fleet[f] || []).find(function (c) { return c.m === model; }); return !!(x && x.on && rank >= x.r); },
    canWeapon: function (f, w, rank) { const x = (S.fweap[f] || []).find(function (c) { return c.m === w; }); return !!(x && x.on && rank >= x.r); },
    inOchs: function (staticId, f) { return S.ochs.some(function (o) { return o.s === Number(staticId) && (o.f === f || o.f === 'all') && (!o.until || o.until > Date.now()); }); },
    off: function (f) { return !!S.facOff[f]; }
};
A.factionOff = function (f) { return !!S.facOff[f]; };
A.jobOff = function (j) { return !!S.jobOff[j]; };

/* ================= LEVEL 6 — РУКОВОДЯЩАЯ ================= */
cmd('sethp', 'sethp', '/sethp [id] [0-100]', function (p, a, u) {
    const t = find(a[0]);
    if (!need(p, t && a[1] !== undefined, u)) return;
    t.health = Math.max(0, Math.min(100, Number(a[1])));
    admNote(login(p) + ' установил HP ' + a[1] + ' игроку ' + who(t));
    log(p, 'sethp', login(t), a[1]);
});
cmd('takehp', 'sethp', '/takehp [id] [сколько]', function (p, a, u) {
    const t = find(a[0]), n = Number(a[1]);
    if (!need(p, t && n > 0, u)) return;
    if (!touch(p, t)) return;
    t.health = Math.max(0, t.health - n);
    admNote(login(p) + ' забрал ' + n + ' HP у ' + who(t));
    log(p, 'takehp', login(t), String(n));
});
cmd('setarmour', 'armour', '/setarmour [id] [0-100] (0 — забрать)', function (p, a, u) {
    const t = find(a[0]);
    if (!need(p, t && a[1] !== undefined, u)) return;
    t.armour = Math.max(0, Math.min(100, Number(a[1])));
    log(p, 'armour', login(t), a[1]);
    msg(p, 'Броня ' + nick(t) + ': ' + t.armour, '#8fd14f');
});
cmd('flylist', 'flylist', '/flylist — кто сейчас в свободной камере', function (p) {
    const l = mp.players.toArray().filter(function (x) { return x.admFly; });
    if (!l.length) return msg(p, 'Никто не в свободной камере');
    l.forEach(function (x) { p.outputChatBox('!{#7fd4ff}' + SHORT[realLvl(x)] + ' ' + who(x) + ' !{#999}— ' + ago(Date.now() - x.admFly.since)); });
});
cmd('flywatch', 'flywatch', '/flywatch [id] — смотреть камеру админа, без id — выйти', function (p, a) {
    if (!a[0]) { p.flyWatch = null; p.call('adm:flyWatch', [-1]); return msg(p, 'Просмотр камеры выключен'); }
    const t = find(a[0]);
    if (!t || !t.admFly) return msg(p, 'Этот игрок не в свободной камере', '#e05555');
    if (realLvl(t) >= realLvl(p) && lvl(p) < MAX) return msg(p, 'Нельзя смотреть камеру админа своего уровня или выше', '#e05555');
    p.flyWatch = t.id;
    p.call('adm:flyWatch', [t.id]);
    log(p, 'flywatch', login(t), '');
});
mp.events.add('srv:adm:flyPos', function (p, x, y, z, rx, rz) {
    if (!p.admFly) return;
    p.admFly.pos = [Number(x), Number(y), Number(z), Number(rx), Number(rz)];
});
setInterval(function () {
    mp.players.forEach(function (w) {
        if (w.flyWatch === null || w.flyWatch === undefined) return;
        const t = mp.players.at(w.flyWatch);
        if (!t || !mp.players.exists(t) || !t.admFly) { w.flyWatch = null; w.call('adm:flyWatch', [-1]); return msg(w, 'Админ вышел из свободной камеры'); }
        if (t.admFly.pos) w.call('adm:flyWatchPos', t.admFly.pos);
    });
}, 250);

cmd('screen', 'screen', '/screen [id] — смотреть от лица игрока (30 сек), повтор — выйти', function (p, a, u) {
    if (p.eyeWatch !== null && p.eyeWatch !== undefined && !a[0]) { p.eyeWatch = null; p.call('adm:flyWatch', [-1]); return msg(p, 'Просмотр выключен'); }
    const t = find(a[0]);
    if (!need(p, t, u)) return;
    if (t === p) return;
    if (!touch(p, t)) return;
    p.eyeWatch = t.id;
    t.eyeUntil = Date.now() + 30000;
    t.call('adm:camStream', [30]);
    p.call('adm:flyWatch', [t.id]);
    p.call('adm:close');
    msg(p, 'Вы смотрите глазами ' + nick(t) + ' 30 сек. Сделайте скрин (F8 / Steam F12). /screen — выйти', '#7fd4ff');
    log(p, 'screen', login(t), '');
});
mp.events.add('srv:adm:camPos', function (t, x, y, z, rx, rz) {
    if (!t.eyeUntil || Date.now() > t.eyeUntil + 1000) return;
    const pos = [Number(x), Number(y), Number(z), Number(rx), Number(rz)];
    mp.players.forEach(function (w) {
        if (w.eyeWatch !== t.id) return;
        if (Date.now() > t.eyeUntil) { w.eyeWatch = null; w.call('adm:flyWatch', [-1]); return msg(w, 'Просмотр завершён'); }
        w.call('adm:flyWatchPos', pos);
    });
});

cmd('tpcar', 'tpcar', '/tpcar [id машины] — сесть за руль', function (p, a, u) {
    const v = vehAt(a[0]);
    if (!need(p, v, u)) return;
    p.dimension = v.dimension;
    p.position = V(v.position.x, v.position.y, v.position.z + 1);
    const drv = v.getOccupant ? v.getOccupant(0) : null;
    setTimeout(function () {
        if (!mp.players.exists(p) || !mp.vehicles.exists(v)) return;
        if (drv && mp.players.exists(drv) && drv !== p) { try { drv.removeFromVehicle(); } catch (e) {} }
        try { p.putIntoVehicle(v, 0); } catch (e) {}
    }, 300);
    log(p, 'tpcar', 'veh ' + v.id, '');
});
cmd('giveweapon', 'giveweapon', '/giveweapon [id] [weapon_pistol] [патроны]', function (p, a, u) {
    const t = find(a[0]);
    let w = String(a[1] || '').toLowerCase();
    if (w && w.indexOf('weapon_') !== 0) w = 'weapon_' + w;
    if (!need(p, t && /^weapon_[a-z0-9_]+$/.test(w), u)) return;
    const ammo = Math.max(1, Math.min(9999, Number(a[2]) || 120));
    t.giveWeapon(mp.joaat(w), ammo);
    admNote(login(p) + ' выдал ' + w + ' (' + ammo + ') игроку ' + who(t));
    log(p, 'giveweapon', login(t), w + ' ' + ammo);
});
function adminIdle() {
    return mp.players.toArray().filter(function (x) { return realLvl(x) >= 1; }).map(function (x) {
        const idle = (x.idleSec || 0) + (x.idleAt ? Math.floor((Date.now() - x.idleAt) / 1000) : 0);
        return { id: x.id, name: login(x), lvl: realLvl(x), off: !!x.admOff, noAnswer: Date.now() - (x.admLastAnswer || x.admJoined || Date.now()), afk: idle, answers: x.admAnswers || 0 };
    });
}
mp.events.add('playerJoin', function (p) { p.admJoined = Date.now(); });
cmd('adminidle', 'adminidle', '/adminidle', function (p) {
    const open = reports.filter(function (r) { return !r.done; }).length;
    msg(p, 'Открытых репортов: ' + open, '#7fd4ff');
    adminIdle().forEach(function (x) { p.outputChatBox('!{' + rankColor(x.lvl) + '}' + SHORT[x.lvl] + ' ' + x.name + ' [' + x.id + '] !{#ffffff}без ответов ' + ago(x.noAnswer) + ' · AFK ' + ago(x.afk * 1000) + ' · ответов ' + x.answers + (x.off ? ' · админка выкл' : '')); });
});
cmd('banlist', 'banlist', '/banlist [ник/static/ip/serial]', function (p, a) {
    const f = String(a[0] || '').toLowerCase();
    const l = S.banHist.filter(function (b) { return !f || [b.login, b.nick, b.static, b.ip, b.serial, b.social].some(function (v) { return v !== null && v !== undefined && String(v).toLowerCase().indexOf(f) >= 0; }); }).slice(0, 12);
    if (!l.length) return msg(p, 'Ничего не найдено');
    l.forEach(function (b) { p.outputChatBox('!{' + (b.t === 'ban' ? '#e05555' : '#8fd14f') + '}' + new Date(b.date).toLocaleString('ru-RU') + ' ' + (b.t === 'ban' ? 'БАН' : 'РАЗБАН') + ' ' + b.login + (b.static ? ' #' + b.static : '') + ' !{#cccccc}' + (b.reason || '') + ' — ' + b.admin); });
});

/* маркеры HP и брони */
const hpShapes = [];
function buildMarkers() {
    hpShapes.splice(0).forEach(function (x) { try { x.m.destroy(); x.s.destroy(); x.b && x.b.destroy(); } catch (e) {} });
    S.markers.forEach(function (o) {
        const m = mp.markers.new(1, V(o.x, o.y, o.z - 1), 1.3, { color: o.t === 'hp' ? [230, 57, 80, 140] : [80, 140, 255, 140], dimension: o.dim || 0 });
        const s = mp.colshapes.newSphere(o.x, o.y, o.z, 1.5, o.dim || 0);
        s.hpMarker = o;
        hpShapes.push({ m: m, s: s });
    });
}
setTimeout(buildMarkers, 3000);
mp.events.add('playerEnterColshape', function (p, s) {
    const o = s.hpMarker;
    if (!o) return;
    if (p.hpMarkAt && Date.now() - p.hpMarkAt < 15000) return;
    p.hpMarkAt = Date.now();
    if (o.t === 'hp') { p.health = 100; msg(p, '+ Здоровье восстановлено', '#8fd14f'); } else { p.armour = 100; msg(p, '+ Броня выдана', '#7fd4ff'); }
});
cmd('hpmarker', 'hpmarker', '/hpmarker [hp/armour]', function (p, a, u) {
    const t = String(a[0] || '').toLowerCase();
    if (!need(p, t === 'hp' || t === 'armour', u)) return;
    S.markers.push({ id: Date.now(), t: t, x: p.position.x, y: p.position.y, z: p.position.z, dim: p.dimension, by: login(p) }); save();
    buildMarkers();
    log(p, 'hpmarker', t, '');
    msg(p, 'Маркер ' + (t === 'hp' ? 'здоровья' : 'брони') + ' создан', '#8fd14f');
});
cmd('hpmarkerdel', 'hpmarker', '/hpmarkerdel — удалить ближайший', function (p) {
    let best = null, bd = 6;
    S.markers.forEach(function (o) { const d = V(o.x, o.y, o.z).subtract(p.position).length(); if (d < bd && (o.dim || 0) === p.dimension) { bd = d; best = o; } });
    if (!best) return msg(p, 'Рядом нет маркеров');
    S.markers = S.markers.filter(function (o) { return o !== best; }); save();
    buildMarkers();
    log(p, 'hpmarkerdel', best.t, '');
    msg(p, 'Маркер удалён', '#8fd14f');
});
function syncWorld(p) {
    const send = function (x) { if (mp.players.exists(x)) x.call('adm:world', [JSON.stringify({ traffic: S.traffic, zonesOn: S.zonesOn, zones: S.zones })]); };
    if (p) send(p); else mp.players.forEach(send);
}
mp.events.add('playerReady', function (p) { setTimeout(function () { syncWorld(p); }, 2500); });
setTimeout(function () { syncWorld(); }, 3000);
cmd('traffic', 'traffic', '/traffic [on/off] — светофоры', function (p, a) {
    S.traffic = a[0] ? a[0] === 'on' : !S.traffic; save();
    syncWorld();
    admNote(login(p) + ' ' + (S.traffic ? 'включил' : 'выключил') + ' светофоры');
    log(p, 'traffic', '-', S.traffic ? 'on' : 'off');
});

/* ================= LEVEL 7 — ЗГА ================= */
cmd('nickhistory', 'nickhistory', '/nickhistory [id или #static]', function (p, a, u) {
    if (!need(p, a[0], u)) return;
    const st = a[0][0] === '#' ? Number(a[0].slice(1)) : sid(find(a[0]) || {});
    const l = S.nicks[st];
    if (!st || !l || !l.length) return msg(p, 'История ников не найдена');
    msg(p, 'История ников #' + st + ':', '#7fd4ff');
    l.forEach(function (x) { p.outputChatBox('!{#ffffff}' + x.n + ' !{#999}с ' + new Date(x.d).toLocaleString('ru-RU')); });
});
cmd('bank', 'bankcheck', '/bank [id или #static]', async function (p, a, u) {
    if (!need(p, a[0], u)) return;
    if (a[0][0] === '#') {
        const r = await q('SELECT nick, login, money, bank FROM accounts WHERE id = ? LIMIT 1', [Number(a[0].slice(1))]);
        if (!r[0]) return msg(p, 'Аккаунт не найден');
        return msg(p, (r[0].nick || r[0].login) + ': наличные ' + money(r[0].money) + ', банк ' + money(r[0].bank), '#7fd4ff');
    }
    const t = find(a[0]);
    if (!t) return msg(p, 'Игрок не найден');
    const MS = global.MoneySystem;
    msg(p, who(t) + ': наличные ' + money(MS ? MS.get(t) : A.moneyOf(t)) + ', банк ' + money(MS ? MS.bank(t) : 0), '#7fd4ff');
    log(p, 'bankcheck', login(t), '');
});
mp.events.addCommand('aoff', function (p) {
    if (realLvl(p) < 7) return msg(p, 'Доступно с ЗГА (7)', '#e05555');
    p.admOff = true;
    if (p.adminGm) { p.adminGm = false; p.call('adm:gm', [false]); }
    p.call('adm:close');
    msg(p, 'Админка выключена — вы как обычный игрок. /aon — включить', '#ffcc66');
    log(p, 'aoff', login(p), '');
});
mp.events.addCommand('aon', function (p) {
    if (realLvl(p) < 7) return;
    p.admOff = false;
    msg(p, 'Админка включена: ' + rankName(realLvl(p)), rankColor(realLvl(p)));
    log(p, 'aon', login(p), '');
});
async function permBan(admin, t, reason, offStatic) {
    const st = t ? sid(t) : Number(offStatic) || null;
    let lg = t ? login(t) : null;
    if (!t && st) { const r = await q('SELECT login, username, social_club FROM accounts WHERE id = ? LIMIT 1', [st]); if (r[0]) lg = r[0].login || r[0].username; }
    await q('INSERT INTO admin_global_bans (static_id, login, social, serial, ip, reason, admin) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [st, lg, t ? t.socialClub : null, t ? t.serial : null, t ? t.ip : null, reason, typeof admin === 'string' ? admin : login(admin)]);
    A.doBan(admin, t || null, 0, '[ГЛОБАЛЬНЫЙ] ' + reason, lg || ('#' + st));
}
async function checkGlobal(p) {
    const r = await q('SELECT * FROM admin_global_bans WHERE (social IS NOT NULL AND social = ?) OR (serial IS NOT NULL AND serial = ?) OR (static_id IS NOT NULL AND static_id = ?) LIMIT 1', [p.socialClub || '-', p.serial || '-', sid(p) || -1]);
    if (r[0] && mp.players.exists(p)) {
        p.call('adm:banScreen', [JSON.stringify({ login: r[0].login, admin: r[0].admin, reason: '[ГЛОБАЛЬНЫЙ] ' + r[0].reason, date: new Date(r[0].created_at).getTime(), until: 0, forever: true })]);
        setTimeout(function () { if (mp.players.exists(p)) p.kick('Глобальный бан'); }, 15000);
    }
}
mp.events.add('playerJoin', function (p) { setTimeout(function () { if (mp.players.exists(p)) checkGlobal(p); }, 2500); });
setInterval(function () { mp.players.forEach(function (p) { if (sid(p) && !p.gbChecked) { p.gbChecked = true; checkGlobal(p); } }); }, 6000);
cmd('permban', 'permban', '/permban [id или #static] [причина] — бан на всех серверах', async function (p, a, u) {
    if (!need(p, a[0] && a[1], u)) return;
    const st = a[0][0] === '#' ? a[0].slice(1) : null;
    const t = st ? online(st) : find(a[0]);
    if (!t && !st) return msg(p, 'Игрок не найден');
    if (t && !touch(p, t)) return;
    await permBan(p, t, a.slice(1).join(' '), st);
});
cmd('skin', 'skin', '/skin [id] [модель]', function (p, a, u) {
    const t = find(a[0]);
    if (!need(p, t && /^[a-z0-9_]{3,40}$/i.test(a[1] || ''), u)) return;
    t.model = mp.joaat(a[1]);
    log(p, 'skin', login(t), a[1]);
    msg(p, 'Скин ' + a[1] + ' выдан ' + nick(t), '#8fd14f');
});
cmd('greenzone', 'greenzone', '/greenzone [on/off] — все зелёные зоны', function (p, a) {
    S.zonesOn = a[0] ? a[0] === 'on' : !S.zonesOn; save();
    syncWorld();
    admNote(login(p) + ' ' + (S.zonesOn ? 'включил' : 'выключил') + ' зелёные зоны');
    log(p, 'greenzone', '-', S.zonesOn ? 'on' : 'off');
});
cmd('gzadd', 'greenzone', '/gzadd [радиус] [название]', function (p, a, u) {
    const r = Number(a[0]);
    if (!need(p, r >= 5 && r <= 300, u)) return;
    S.zones.push({ n: a.slice(1).join(' ') || 'Зона', x: p.position.x, y: p.position.y, z: p.position.z, r: r, on: true }); save();
    syncWorld();
    msg(p, 'Зелёная зона добавлена', '#8fd14f');
});
cmd('gzdel', 'greenzone', '/gzdel — удалить зону, в которой стоите', function (p) {
    const z = S.zones.find(function (x) { return V(x.x, x.y, x.z).subtract(p.position).length() < x.r; });
    if (!z) return msg(p, 'Вы не в зелёной зоне');
    S.zones = S.zones.filter(function (x) { return x !== z; }); save();
    syncWorld();
    msg(p, 'Зона «' + z.n + '» удалена', '#8fd14f');
});
cmd('unban', 'unban', '/unban [логин]', function (p, a, u) {
    if (!need(p, a[0], u)) return;
    A.doUnban(p, a[0]);
    q('DELETE FROM admin_global_bans WHERE login = ?', [a[0]]);
    msg(p, 'Разбанен: ' + a[0], '#8fd14f');
});

/* ================= LEVEL 8 — ГА ================= */
cmd('logs', 'logs', '/logs [поиск]', function (p, a) {
    const f = a.join(' ').toLowerCase();
    const l = A.logs.filter(function (x) { return !f || (x.admin + ' ' + x.action + ' ' + x.target + ' ' + x.details).toLowerCase().indexOf(f) >= 0; }).slice(0, 15);
    if (!l.length) return msg(p, 'Ничего не найдено');
    l.forEach(function (x) { p.outputChatBox('!{#999}' + new Date(x.time).toLocaleString('ru-RU') + ' !{#ffffff}' + x.admin + ' !{#ffcc66}' + x.action + ' !{#ffffff}' + x.target + ' !{#999}' + x.details); });
});
async function factionOff(p, f, off) {
    if (!FACTIONS[f]) return 'Фракции: ' + Object.keys(FACTIONS).join(', ');
    if (off) {
        S.facOff[f] = { by: login(p), d: Date.now() };
        await q('UPDATE accounts SET job = NULL, job_rank = 0, leader = 0 WHERE job = ?', [f]);
        mp.players.forEach(function (x) { if (x.account && x.account.job === f) { x.account.job = null; x.account.job_rank = 0; msg(x, 'Фракция ' + FACTIONS[f] + ' расформирована руководством. Вы уволены.', '#e05555'); } });
    } else delete S.facOff[f];
    save();
    mp.players.broadcast('!{#ff6b6b}[Администрация] !{#ffffff}Фракция ' + FACTIONS[f] + (off ? ' закрыта, все сотрудники уволены' : ' снова открыта'));
    log(p, off ? 'factionoff' : 'factionon', f, '');
    return null;
}
cmd('factionoff', 'factionoff', '/factionoff [фракция]', async function (p, a, u) { if (!need(p, a[0], u)) return; const e = await factionOff(p, a[0].toLowerCase(), true); if (e) msg(p, e); });
cmd('factionon', 'factionoff', '/factionon [фракция]', async function (p, a, u) { if (!need(p, a[0], u)) return; const e = await factionOff(p, a[0].toLowerCase(), false); if (e) msg(p, e); });
function setLock(p, f, on) {
    if (!A.FEATURE_NAMES[f]) return 'Функции: ' + Object.keys(A.FEATURE_NAMES).join(', ');
    if (on) A.locks[f] = { by: login(p), d: Date.now() }; else delete A.locks[f];
    A.saveLocks();
    admNote(login(p) + (on ? ' отключил' : ' включил') + ' функцию: ' + A.FEATURE_NAMES[f]);
    log(p, on ? 'lock' : 'unlock', f, '');
    return null;
}
cmd('flock', 'featurelock', '/flock [функция] — отключить/включить функцию админки', function (p, a, u) {
    if (!a[0]) return msg(p, u + ': ' + Object.keys(A.FEATURE_NAMES).map(function (k) { return k + (A.locks[k] ? '(выкл)' : ''); }).join(', '));
    const e = setLock(p, a[0], !A.locks[a[0]]);
    if (e) msg(p, e);
});

/* ================= LEVEL 9 — МГА ================= */
async function moneyOp(p, t, staticId, sum, bank) {
    sum = Math.floor(Number(sum) || 0);
    if (!sum) return 'Неверная сумма';
    const MS = global.MoneySystem;
    if (t) {
        if (bank && MS) MS.addBank(t, sum); else A.addMoney(t, sum);
        msg(t, (sum > 0 ? 'Администрация начислила ' : 'Администрация списала ') + money(Math.abs(sum)) + (bank ? ' (банк)' : ''), sum > 0 ? '#8fd14f' : '#e05555');
    } else {
        await q('UPDATE accounts SET ' + (bank ? 'bank' : 'money') + ' = GREATEST(0, ' + (bank ? 'bank' : 'money') + ' + ?) WHERE id = ?', [sum, Number(staticId)]);
    }
    admNote(login(p) + (sum > 0 ? ' выдал ' : ' забрал ') + money(Math.abs(sum)) + (bank ? ' (банк) ' : ' ') + (t ? who(t) : '#' + staticId));
    log(p, sum > 0 ? 'givemoney' : 'takemoney', t ? login(t) : '#' + staticId, money(sum) + (bank ? ' bank' : ''));
    return null;
}
cmd('takemoney', 'givemoney', '/takemoney [id или #static] [сумма] [bank]', async function (p, a, u) {
    if (!need(p, a[0] && Number(a[1]) > 0, u)) return;
    const st = a[0][0] === '#' ? a[0].slice(1) : null;
    const t = st ? online(st) : find(a[0]);
    if (!t && !st) return msg(p, 'Игрок не найден');
    const e = await moneyOp(p, t, st, -Math.abs(Number(a[1])), a[2] === 'bank');
    if (e) msg(p, e);
});
cmd('gm2', 'givemoney', '/gm2 [id или #static] [сумма] [bank] — выдать деньги (в т.ч. офлайн)', async function (p, a, u) {
    if (!need(p, a[0] && Number(a[1]), u)) return;
    const st = a[0][0] === '#' ? a[0].slice(1) : null;
    const t = st ? online(st) : find(a[0]);
    if (!t && !st) return msg(p, 'Игрок не найден');
    const e = await moneyOp(p, t, st, Number(a[1]), a[2] === 'bank');
    if (e) msg(p, e);
});
cmd('setga', 'setga', '/setga [id или логин] — назначить ГА', function (p, a, u) { if (!need(p, a[0], u)) return; A.runCmd(p, 'setadmin ' + a[0] + ' 8'); });
cmd('unga', 'setga', '/unga [id или логин] [новый уровень, по умолчанию 0]', function (p, a, u) { if (!need(p, a[0], u)) return; A.runCmd(p, 'setadmin ' + a[0] + ' ' + (Number(a[1]) || 0)); });
cmd('joboff', 'joboff', '/joboff [работа] — выключить/включить работу', function (p, a, u) {
    if (!a[0] || !JOBS[a[0]]) return msg(p, u + ': ' + Object.keys(JOBS).map(function (k) { return k + (S.jobOff[k] ? '(выкл)' : ''); }).join(', '));
    if (S.jobOff[a[0]]) delete S.jobOff[a[0]]; else S.jobOff[a[0]] = { by: login(p), d: Date.now() };
    save();
    mp.players.broadcast('!{#ff6b6b}[Администрация] !{#ffffff}Работа «' + JOBS[a[0]] + '» ' + (S.jobOff[a[0]] ? 'временно недоступна' : 'снова доступна'));
    log(p, 'joboff', a[0], S.jobOff[a[0]] ? 'off' : 'on');
});

/* ================= ПАНЕЛЬ: данные и действия ================= */
A.panelExt = function (p) {
    const L = lvl(p);
    return {
        reports: L >= 1 ? reports.slice(0, 40) : [],
        factions: FACTIONS, jobs: JOBS, lics: LICS,
        facOff: S.facOff, jobOff: S.jobOff,
        fleet: L >= 5 ? S.fleet : {}, fweap: L >= 5 ? S.fweap : {}, ochs: L >= 5 ? S.ochs.slice(0, 100) : [],
        banHist: L >= 6 ? S.banHist.slice(0, 300) : [],
        idle: L >= 6 ? adminIdle() : [],
        fly: L >= 6 ? mp.players.toArray().filter(function (x) { return x.admFly; }).map(function (x) { return { id: x.id, name: login(x), lvl: realLvl(x), since: x.admFly.since }; }) : [],
        world: { traffic: S.traffic, zonesOn: S.zonesOn, zones: S.zones, markers: S.markers.length, mapping: S.mapping.length },
        jail: Object.keys(S.jail).map(function (k) { const j = S.jail[k]; const o = online(k); return { s: Number(k), type: j.type, left: Math.max(0, j.until - Date.now()), reason: j.reason, by: j.by, name: o ? who(o) : '#' + k }; }),
        consoleUrl: L >= 7 ? consoleUrl() : null
    };
};
function pact(p, d, t) {
    const a = d.action;
    const T = function (e, ok) { toast(p, e, ok); A.sendPanel(p); return true; };
    const chk = function (perm) { if (!can(p, perm)) { T(A.whyNot(p, perm), false); return false; } return true; };
    if (a === 'ans') { if (!chk('reports')) return true; const e = answer(p, d.rid, String(d.text || '').slice(0, 250)); return T(e || 'Ответ отправлен', !e); }
    if (a === 'mp') { if (!chk('mp')) return true; const e = mpAction(p, d); return T(e || 'Готово', !e); }
    if (a === 'spec') { if (!chk('spec')) return true; if (!t) return T('Игрок не найден', false); p.call('adm:close'); startSpec(p, t); return true; }
    if (a === 'jail') { if (!chk('demorgan')) return true; if (!t || !canTouch(p, t)) return T('Нельзя', false); const e = jailPlayer(p, t, 'demorgan', Math.max(1, Math.min(720, Number(d.minutes) || 30)), String(d.reason || 'нарушение')); return T(e || 'Отправлен в деморган', !e); }
    if (a === 'release') { if (!chk('unjail')) return true; const tt = t || online(d.s); if (!tt) return T('Игрок офлайн', false); const j = S.jail[sid(tt)]; if (j && j.type === 'demorgan' && !can(p, 'demorgan')) return T('Нет прав', false); release(tt, 'выпустил ' + login(p)); log(p, 'release', login(tt), ''); return T('Освобождён', true); }
    if (a === 'setname') { if (!chk('setname')) return true; A.runCmd(p, 'setname ' + d.id + ' ' + d.name); return T('Готово', true); }
    if (a === 'dim') { if (!chk('setdim')) return true; if (!t) return T('Игрок не найден', false); t.dimension = Math.max(0, Number(d.value) || 0); log(p, 'setdim', login(t), String(d.value)); return T('Измерение изменено', true); }
    if (a === 'eject') { if (!chk('eject')) return true; if (!t || !t.vehicle) return T('Игрок не в машине', false); t.removeFromVehicle(); log(p, 'eject', login(t), ''); return T('Высажен', true); }
    if (a === 'fixp') { if (!chk('fixveh')) return true; if (!t || !t.vehicle) return T('Игрок не в машине', false); t.vehicle.repair(); log(p, 'fixp', login(t), ''); return T('Машина отремонтирована', true); }
    if (a === 'hpset') { if (!chk('sethp')) return true; if (!t) return T('Нет игрока', false); t.health = Math.max(0, Math.min(100, Number(d.value))); admNote(login(p) + ' HP ' + d.value + ' → ' + who(t)); log(p, 'sethp', login(t), String(d.value)); return T('HP: ' + t.health, true); }
    if (a === 'armourset') { if (!chk('armour')) return true; if (!t) return T('Нет игрока', false); t.armour = Math.max(0, Math.min(100, Number(d.value))); log(p, 'armour', login(t), String(d.value)); return T('Броня: ' + t.armour, true); }
    if (a === 'weapon') { if (!chk('giveweapon')) return true; A.runCmd(p, 'giveweapon ' + d.id + ' ' + d.w + ' ' + (d.ammo || 120)); return T('Оружие выдано', true); }
    if (a === 'skin') { if (!chk('skin')) return true; if (!t) return T('Нет игрока', false); t.model = mp.joaat(String(d.value)); log(p, 'skin', login(t), d.value); return T('Скин выдан', true); }
    if (a === 'screen') { if (!chk('screen')) return true; A.runCmd(p, 'screen ' + d.id); return T('Запрос отправлен', true); }
    if (a === 'takelic') { if (!chk('takelic')) return true; A.runCmd(p, 'takelic ' + d.id + ' ' + d.type + ' ' + (Number(d.minutes) || 0) + ' ' + (d.reason || '')); return T('Лицензия отобрана', true); }
    if (a === 'money2') { if (!chk('givemoney')) return true; moneyOp(p, t, d.s, Number(d.sum), !!d.bank).then(function (e) { T(e || 'Готово', !e); }); return true; }
    if (a === 'bankinfo') { if (!chk('bankcheck')) return true; if (!t) return T('Нет игрока', false); const MS = global.MoneySystem; return T(nick(t) + ': наличные ' + money(MS ? MS.get(t) : 0) + ', банк ' + money(MS ? MS.bank(t) : 0), true); }
    if (a === 'nickhist') { if (!chk('nickhistory')) return true; const l = S.nicks[t ? sid(t) : d.s] || []; return T(l.length ? l.map(function (x) { return x.n; }).join(' → ') : 'Истории нет', true); }
    if (a === 'permban') { if (!chk('permban')) return true; if (!t || !canTouch(p, t)) return T('Нельзя', false); permBan(p, t, String(d.reason || 'нарушение')); return T('Глобальный бан выдан', true); }
    if (a === 'leader') { if (!chk('leader')) return true; setLeader(p, d.s ? null : t, d.s, d.f || null).then(function (e) { T(e || 'Готово', !e); }); return true; }
    if (a === 'fleet' || a === 'fweap') {
        if (!chk(a === 'fleet' ? 'fleet' : 'fweapons')) return true;
        const box = a === 'fleet' ? S.fleet : S.fweap;
        if (!FACTIONS[d.f]) return T('Нет фракции', false);
        const list = box[d.f] || (box[d.f] = []);
        const m = String(d.m || '').toLowerCase().trim();
        if (d.op === 'add') { if (!/^[a-z0-9_]{2,40}$/.test(m)) return T('Неверная модель', false); if (!list.some(function (x) { return x.m === m; })) list.push({ m: m, r: Math.max(0, Number(d.r) || 0), on: true }); }
        else { const x = list.find(function (y) { return y.m === m; }); if (!x) return T('Не найдено', false); if (d.op === 'del') box[d.f] = list.filter(function (y) { return y !== x; }); if (d.op === 'toggle') x.on = !x.on; if (d.op === 'rank') x.r = Math.max(0, Number(d.r) || 0); }
        save(); log(p, a, d.f, d.op + ' ' + m);
        return T('Сохранено', true);
    }
    if (a === 'ochs') {
        if (!chk('ochs')) return true;
        if (d.op === 'add') {
            const st = Number(d.s) || (t ? sid(t) : 0);
            if (!st) return T('Укажите static', false);
            const min = Number(d.minutes) || 0;
            S.ochs.unshift({ s: st, n: d.n || (online(st) ? nick(online(st)) : '#' + st), f: d.f || 'all', reason: String(d.reason || '').slice(0, 120), until: min ? Date.now() + min * 60000 : 0, by: login(p), d: Date.now() });
            log(p, 'ochs+', '#' + st, d.f + ' ' + d.reason);
        } else { S.ochs = S.ochs.filter(function (o) { return !(o.s === Number(d.s) && o.f === d.f); }); log(p, 'ochs-', '#' + d.s, d.f); }
        save();
        return T('ОЧС обновлён', true);
    }
    if (a === 'world') {
        if (d.op === 'traffic') { if (!chk('traffic')) return true; S.traffic = !S.traffic; }
        else if (d.op === 'zones') { if (!chk('greenzone')) return true; S.zonesOn = !S.zonesOn; }
        else if (d.op === 'zone') { if (!chk('greenzone')) return true; const z = S.zones[Number(d.i)]; if (z) z.on = !z.on; }
        else if (d.op === 'zonedel') { if (!chk('greenzone')) return true; S.zones.splice(Number(d.i), 1); }
        save(); syncWorld(); log(p, 'world', d.op, '');
        return T('Сохранено', true);
    }
    if (a === 'factionoff') { if (!chk('factionoff')) return true; factionOff(p, d.f, !S.facOff[d.f]).then(function (e) { T(e || 'Готово', !e); }); return true; }
    if (a === 'joboff') { if (!chk('joboff')) return true; A.runCmd(p, 'joboff ' + d.j); return T('Готово', true); }
    if (a === 'lock') { if (!chk('featurelock')) return true; const e = setLock(p, d.f, !A.locks[d.f]); return T(e || 'Готово', !e); }
    if (a === 'aoff') { if (realLvl(p) < 7) return T('С уровня 7', false); p.admOff = !p.admOff; if (p.admOff) p.call('adm:close'); msg(p, p.admOff ? 'Админка выключена. /aon — включить' : 'Админка включена', '#ffcc66'); return true; }
    if (a === 'token') { if (!chk('console')) return true; const tk = makeToken(p); msg(p, 'Ключ внешней консоли (никому не передавайте): ' + tk, '#ff4fa3'); return T('Ключ отправлен в чат', true); }
    if (a === 'cmd') { A.runCmd(p, String(d.text || '').replace(/^\//, '')); return T('Выполнено', true); }
    return false;
}
A.panelAct = pact;

/* ================= ВНЕШНЯЯ КОНСОЛЬ (7+) ================= */
const crypto = require('crypto');
const CONSOLE_CFG = Object.assign({ port: 22010, enabled: true, host: '' }, A.readJson(path.join(A.dir, 'admin_console.json'), {}));
const chatBuf = [];
A.pushChat = function (from, text) { chatBuf.push({ from: from, text: text, t: Date.now() }); if (chatBuf.length > 200) chatBuf.shift(); };
function makeToken(p) {
    const tk = crypto.randomBytes(18).toString('hex');
    const h = crypto.createHash('sha256').update(tk).digest('hex');
    Object.keys(S.consoleTokens).forEach(function (k) { if (S.consoleTokens[k].s === sid(p)) delete S.consoleTokens[k]; });
    S.consoleTokens[h] = { s: sid(p), login: login(p), d: Date.now() };
    save();
    log(p, 'console-token', login(p), '');
    return tk;
}
function consoleUrl() { return CONSOLE_CFG.enabled ? 'http://' + (CONSOLE_CFG.host || 'IP_СЕРВЕРА') + ':' + CONSOLE_CFG.port + '/' : null; }
async function tokenUser(tk) {
    if (!tk) return null;
    const h = crypto.createHash('sha256').update(String(tk)).digest('hex');
    const rec = S.consoleTokens[h];
    if (!rec) return null;
    const r = await q('SELECT admin, login, username, nick FROM accounts WHERE id = ? LIMIT 1', [rec.s]);
    const L = r[0] ? Number(r[0].admin) || 0 : 0;
    const owner = ['Rainold Star', 'Rainold_Star', 'Rainold_Verigo'].indexOf(rec.login) >= 0 ? 9 : 0;
    const lv = Math.max(L, owner);
    if (lv < 7 || A.locks.console && lv < MAX) return null;
    return { s: rec.s, login: 'WEB:' + rec.login, lvl: lv };
}
const hits = {};
if (CONSOLE_CFG.enabled) {
    try {
        const http = require('http');
        const page = fs.existsSync(path.join(A.dir, 'admin_console.html')) ? fs.readFileSync(path.join(A.dir, 'admin_console.html'), 'utf8') : '<h1>admin_console.html не найден</h1>';
        http.createServer(function (req, res) {
            const ip = req.socket.remoteAddress;
            hits[ip] = (hits[ip] || []).filter(function (t) { return Date.now() - t < 10000; });
            hits[ip].push(Date.now());
            if (hits[ip].length > 40) { res.writeHead(429); return res.end('slow down'); }
            const send = function (code, obj) { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };
            if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(page); }
            if (req.method !== 'POST' || req.url !== '/api') { res.writeHead(404); return res.end(); }
            let body = '';
            req.on('data', function (c) { body += c; if (body.length > 8000) req.destroy(); });
            req.on('end', async function () {
                let d; try { d = JSON.parse(body); } catch (e) { return send(400, { err: 'bad json' }); }
                const u = await tokenUser(d.token);
                if (!u) return send(403, { err: 'Неверный ключ или нет прав (нужен уровень 7+)' });
                const L = u.lvl;
                if (d.op === 'state') return send(200, {
                    me: { login: u.login, lvl: L, rank: rankName(L) },
                    online: mp.players.toArray().map(function (x) { return { id: x.id, name: login(x), s: sid(x), lvl: realLvl(x), ping: x.ping }; }),
                    chat: chatBuf.slice(-60), reports: reports.filter(function (r) { return !r.done; }).slice(0, 20),
                    bans: A.getBans().slice(0, 40).map(function (b) { return { login: b.login, reason: b.reason, admin: b.admin, until: b.until }; })
                });
                const text = String(d.text || '').slice(0, 200);
                if (d.op === 'achat') { if (!text) return send(400, { err: 'Пусто' }); staff('!{#ff4fa3}[WEB] ' + u.login + ': !{#ffffff}' + text); A.pushChat(u.login, text); log(u.login, 'web-achat', '-', text); return send(200, { ok: 1 }); }
                if (d.op === 'announce') { if (!text) return send(400, { err: 'Пусто' }); mp.players.broadcast('!{#c13dff}[ОБЪЯВЛЕНИЕ] !{#ffffff}' + text); mp.players.call('adm:announce', [text, u.login]); log(u.login, 'web-announce', '-', text); return send(200, { ok: 1 }); }
                if (d.op === 'kick' || d.op === 'ban' || d.op === 'mute') {
                    const t = mp.players.at(Number(d.id));
                    if (!t || !mp.players.exists(t)) return send(400, { err: 'Игрок не в сети' });
                    if (realLvl(t) >= L && L < MAX) return send(403, { err: 'Нельзя применить к админу своего уровня или выше' });
                    if (d.op === 'kick') A.doKick(u.login, t, text || 'нарушение');
                    if (d.op === 'mute') A.doMute(u.login, t, Math.max(1, Math.min(600, Number(d.minutes) || 30)), text || 'нарушение');
                    if (d.op === 'ban') A.doBan(u.login, t, Math.max(0, Number(d.minutes) || 0), text || 'нарушение');
                    return send(200, { ok: 1 });
                }
                if (d.op === 'offban') { if (!d.login) return send(400, { err: 'Логин?' }); A.doBan(u.login, null, Math.max(0, Number(d.minutes) || 0), text || 'нарушение', String(d.login)); return send(200, { ok: 1 }); }
                if (d.op === 'unban') { if (!d.login) return send(400, { err: 'Логин?' }); A.doUnban(u.login, String(d.login)); return send(200, { ok: 1 }); }
                if (d.op === 'ans') {
                    const r = reports.find(function (x) { return x.id === Number(d.rid); });
                    if (!r || r.done) return send(400, { err: 'Репорт закрыт' });
                    r.done = true; r.by = u.login; r.answer = text;
                    const t = mp.players.at(r.pid);
                    if (t && mp.players.exists(t)) t.outputChatBox('!{#c13dff}[Ответ на репорт от ' + u.login + ']: !{#ffffff}' + text);
                    return send(200, { ok: 1 });
                }
                send(400, { err: 'Неизвестная команда' });
            });
        }).listen(CONSOLE_CFG.port, function () { console.log('[admin] внешняя консоль: порт ' + CONSOLE_CFG.port); }).on('error', function (e) { console.log('[admin] консоль не запущена: ' + e.message); });
    } catch (e) { console.log('[admin] консоль: ' + e.message); }
}

console.log('[admin_ext] загружено: репорты, тюрьма, МП, фракции, мир, консоль');
