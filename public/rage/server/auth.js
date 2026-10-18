const crypto = require('crypto');
let bcrypt = null;
try { bcrypt = require('bcryptjs'); } catch (e) {}
const db = require('../database');
const cfg = require('../config');

const online = {};

async function q(sql, args) {
    const r = await db.query(sql, args || []);
    return Array.isArray(r) && Array.isArray(r[0]) ? r[0] : r;
}

function hash(pass) {
    const salt = crypto.randomBytes(16).toString('hex');
    return 'scrypt$' + salt + '$' + crypto.scryptSync(String(pass), salt, 64).toString('hex');
}
function same(a, b) {
    a = Buffer.from(String(a)); b = Buffer.from(String(b));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function check(pass, stored) {
    pass = String(pass);
    stored = String(stored || '');
    if (!stored) return false;
    const s = stored.split('$');
    if (s[0] === 'scrypt' && s.length === 3) {
        const h = crypto.scryptSync(pass, s[1], 64);
        const b = Buffer.from(s[2], 'hex');
        return b.length === h.length && crypto.timingSafeEqual(b, h);
    }
    if (/^\$2[aby]\$/.test(stored)) return bcrypt ? bcrypt.compareSync(pass, stored) : false;
    const low = stored.toLowerCase();
    if (/^[0-9a-f]{64}$/.test(low)) return same(crypto.createHash('sha256').update(pass).digest('hex'), low);
    if (/^[0-9a-f]{40}$/.test(low)) return same(crypto.createHash('sha1').update(pass).digest('hex'), low);
    if (/^[0-9a-f]{32}$/.test(low)) return same(crypto.createHash('md5').update(pass).digest('hex'), low);
    return same(pass, stored);
}

function err(p, text) { p.call('auth:error', [text]); }

function hidden(p) {
    p.dimension = 1000 + p.id;
    p.model = mp.joaat('mp_m_freemode_01');
    p.spawn(new mp.Vector3(cfg.spawn.x, cfg.spawn.y, cfg.spawn.z));
    p.heading = cfg.spawn.heading;
}

mp.events.add('playerJoin', function (p) {
    p.account = null;
    p.setVariable('creating', false);
    hidden(p);
    p.call('auth:show', [p.socialClub || '']);
});

mp.events.add('playerReady', function (p) {
    if (!p.account) p.call('auth:show', [p.socialClub || '']);
});

function spawnPlayer(p) {
    const a = p.account;
    p.name = a.nick;
    p.setVariable('accountId', a.id);
    p.setVariable('creating', false);
    if (global.CreatorSystem) global.CreatorSystem.apply(p, a);
    p.spawn(new mp.Vector3(Number(a.pos_x) || cfg.spawn.x, Number(a.pos_y) || cfg.spawn.y, Number(a.pos_z) || cfg.spawn.z));
    p.heading = Number(a.heading) || 0;
    p.dimension = Number(a.dimension) || 0;
    p.health = Math.max(10, Math.min(100, Number(a.health) || 100));
    p.joinedAt = Date.now();
    p.call('auth:hide');
    console.log('[CHAR] ' + a.nick + ' вошёл в мир.');
}

async function enter(p, row) {
    if (online[row.id] && mp.players.exists(online[row.id]) && online[row.id] !== p) return err(p, 'Этот аккаунт уже в игре');
    const until = Number(row.ban_until) || 0;
    if (Number(row.banned) === 1 && (!until || until > Date.now())) return err(p, 'Аккаунт заблокирован: ' + (row.ban_reason || 'нарушение'));
    online[row.id] = p;
    p.account = row;
    p.accountId = row.id;
    await q('UPDATE accounts SET last_login = NOW(), social_club = ?, serial = ? WHERE id = ?', [p.socialClub || null, p.serial || null, row.id]);
    if (!row.nick || !row.appearance) return global.CreatorSystem.start(p);
    if (global.SpawnSystem && global.SpawnSystem.offer(p)) return;
    spawnPlayer(p);
}

mp.events.add('auth:login', async function (p, login, pass) {
    if (p.account) return;
    login = String(login || '').trim();
    if (!login || !pass) return err(p, 'Введите логин и пароль');
    try {
        const rows = await q('SELECT * FROM accounts WHERE login = ? OR username = ? ORDER BY id LIMIT 1', [login, login]);
        if (!rows.length || !check(pass, rows[0].password)) {
            if (global.SLog) global.SLog.add('connect', { actor: login, target_id: rows.length ? rows[0].id : null, action: 'login-fail', details: 'неверный пароль | SC: ' + (p.socialClub || '-'), ip: p.ip });
            return err(p, 'Неверный логин или пароль');
        }
        if (global.SLog) global.SLog.add('connect', { actor: login, action: 'login', details: 'аккаунт #' + rows[0].id + ' | SC: ' + (p.socialClub || '-'), ip: p.ip });
        await enter(p, rows[0]);
    } catch (e) {
        console.log('[auth] login: ' + e.message);
        err(p, 'Ошибка сервера, попробуйте позже');
    }
});

mp.events.add('auth:register', async function (p, login, pass) {
    if (p.account) return;
    login = String(login || '').trim();
    if (!/^[A-Za-z0-9_]{3,32}$/.test(login)) return err(p, 'Логин: 3–32 символа, латиница, цифры и _');
    if (String(pass || '').length < 6) return err(p, 'Пароль: минимум 6 символов');
    try {
        const ex = await q('SELECT id FROM accounts WHERE login = ? OR username = ? LIMIT 1', [login, login]);
        if (ex.length) return err(p, 'Такой логин уже занят');
        const r = await q('INSERT INTO accounts (login, username, password, social, social_club, serial, money) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [login, login, hash(pass), p.socialClub || null, p.socialClub || null, p.serial || null, cfg.startMoney]);
        let rows = r && r.insertId ? await q('SELECT * FROM accounts WHERE id = ? LIMIT 1', [r.insertId]) : [];
        if (!rows.length) rows = await q('SELECT * FROM accounts WHERE login = ? LIMIT 1', [login]);
        if (!rows.length || !rows[0].id) {
            console.log('[auth] register: аккаунт записан, но у таблицы accounts нет автонумерации id. Выполните в базе: ALTER TABLE accounts MODIFY id INT NOT NULL AUTO_INCREMENT;');
            return err(p, 'Ошибка базы данных: сообщите администрации');
        }
        console.log('[auth] новый аккаунт: ' + login + ' (#' + rows[0].id + ')');
        if (global.SLog) global.SLog.add('connect', { actor: login, action: 'register', details: 'аккаунт #' + r.insertId + ' | SC: ' + (p.socialClub || '-'), ip: p.ip });
        await enter(p, rows[0]);
    } catch (e) {
        console.log('[auth] register: ' + e.message);
        err(p, 'Ошибка сервера, попробуйте позже');
    }
});

function save(p, quit) {
    const a = p.account;
    if (!a || !a.id || p.getVariable('creating') || p.spawnChoices) return;
    const pos = p.position;
    const mins = p.joinedAt ? Math.floor((Date.now() - p.joinedAt) / 60000) : 0;
    if (mins) p.joinedAt += mins * 60000;
    q('UPDATE accounts SET pos_x = ?, pos_y = ?, pos_z = ?, heading = ?, health = ?, dimension = ?, playtime = playtime + ? WHERE id = ?',
        [pos.x, pos.y, pos.z, p.heading || 0, a.downed ? 100 : Math.max(10, p.health), p.dimension || 0, mins, a.id])
        .catch(function (e) { console.log('[auth] save: ' + e.message); });
}

setInterval(function () { mp.players.forEach(function (p) { save(p); }); }, 60000);

mp.events.add('playerQuit', function (p) {
    save(p, true);
    if (p.account && online[p.account.id] === p) delete online[p.account.id];
});

global.AuthSystem = { spawn: spawnPlayer, save: save, check: check };
module.exports = global.AuthSystem;
