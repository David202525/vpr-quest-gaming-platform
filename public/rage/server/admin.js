const fs = require('fs');
const path = require('path');

let db = null;
try { db = require('../database'); } catch (e) {
    try { db = require('./database'); } catch (e2) { db = null; }
}

const RANKS = ['Игрок', 'Хелпер', 'Помощник администрации', 'Младшая администрация', 'Администрация (тест)', 'Старшая администрация', 'Руководящая администрация', 'ЗГА', 'ГА', 'МГА / Разработчик'];
const SHORT = ['', 'Хелпер', 'ПА', 'МА', 'Админ', 'СА', 'РА', 'ЗГА', 'ГА', 'МГА'];
const COLORS = ['#ffffff', '#7fd4ff', '#8fd14f', '#4fd1a5', '#ffcc66', '#ff9f43', '#ff6b6b', '#ff4fa3', '#c13dff', '#00e5ff'];
const MAX = 9;

const OWNERS = {
    'Rainold Star': 9,
    'Rainold_Star': 9,
    'Rainold_Verigo': 9
};

const PERM = {
    a: 1, admins: 1, pm: 1, panel: 1, fly: 1, spec: 1, afk: 1, getcar: 1, carinfo: 1, rnick: 1, nickrule: 1, unjailself: 1, newbies: 1, near: 1, az: 1, respawncar: 1, healself: 1, reports: 1,
    getpos: 2, announce: 2, ochat: 2, gate: 2, tow: 2, hideprefix: 1, arespawn: 2,
    kick: 3, mute: 3, unmute: 3, warn: 3, demorgan: 3, unjail: 3, setname: 3, goto: 3, tp: 3, bring: 3, tpto: 3, freeze: 3, unfreeze: 3, slap: 3, flytp: 3,
    plate: 3, takelic: 3, fixveh: 3, fix: 3, setdim: 3, heal: 3, revive: 3, gm: 3, invis: 3, tpc: 3, dv: 3,
    eject: 4, respawnpub: 4, ban: 4, offban: 4, jetpack: 4, mapping: 4, mp: 4, veh: 4, weather: 4, time: 4, dvall: 4,
    respawngov: 5, fleet: 5, fweapons: 5, leader: 5, ochs: 5,
    sethp: 6, armour: 6, flylist: 6, flywatch: 6, screen: 6, tpcar: 6, givecar: 6, vehdlc: 6, adddlc: 6, deldlc: 6, giveweapon: 6, adminidle: 6, banlist: 6, hpmarker: 6, traffic: 6, gov: 6,
    unban: 7, console: 7, nickhistory: 7, bankcheck: 7, admtoggle: 7, permban: 7, skin: 7, greenzone: 7,
    logs: 8, setadmin: 8, factionoff: 8, featurelock: 8,
    givemoney: 9, exmapping: 9, setga: 9, joboff: 9, owner: 9
};
const FEATURES = {
    mp: ['mp'], announce: ['announce', 'ochat'], mapping: ['mapping', 'exmapping'], veh: ['veh', 'vehdlc', 'givecar'], ban: ['ban', 'offban', 'permban'],
    fly: ['fly', 'flytp', 'flywatch'], spec: ['spec'], tow: ['tow'], jetpack: ['jetpack'], greenzone: ['greenzone'], traffic: ['traffic'], screen: ['screen'],
    weapons: ['giveweapon'], money: ['givemoney'], demorgan: ['demorgan'], console: ['console']
};
const FEATURE_NAMES = { mp: 'МП-панель', announce: 'Объявления', mapping: 'Маппинг', veh: 'Спавн машин', ban: 'Баны', fly: 'Свободная камера', spec: 'Слежка', tow: 'Эвакуатор', jetpack: 'Джетпак',
    greenzone: 'Зелёные зоны', traffic: 'Светофоры', screen: 'Скриншоты', weapons: 'Выдача оружия', money: 'Выдача денег', demorgan: 'Деморган', console: 'Внешняя консоль' };
const LOCK_FILE = path.join(__dirname, 'admin_locks.json');
let locks = (function () { try { return JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8')); } catch (e) { return {}; } })();
function featureOf(action) { for (const f in FEATURES) if (FEATURES[f].indexOf(action) >= 0) return f; return null; }

const BAN_LIMIT = { 4: 30 * 1440, 5: 90 * 1440, 6: 365 * 1440 };

const BANS_FILE = path.join(__dirname, 'admin_bans.json');
const DLC_FILE = path.join(__dirname, 'admin_dlc.json');
const WARN_FILE = path.join(__dirname, 'admin_warns.json');

function readJson(file, def) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return def; }
}
function writeJson(file, data) {
    try { fs.writeFileSync(file, JSON.stringify(data, null, 2)); } catch (e) { console.log('[admin] save: ' + e.message); }
}

let bans = readJson(BANS_FILE, []);
let dlc = readJson(DLC_FILE, [
    { model: 'rmodgt63', name: 'Mercedes GT63 (пример)' }
]);
let warns = readJson(WARN_FILE, {});

const muted = {};
const frozen = {};
const adminVehs = [];
const logs = [];

function dbq() {
    if (!db) return null;
    if (typeof db.query === 'function') return db;
    if (db.pool && typeof db.pool.query === 'function') return db.pool;
    if (db.db && typeof db.db.query === 'function') return db.db;
    if (db.default && typeof db.default.query === 'function') return db.default;
    return null;
}

async function q(sql, args) {
    const c = dbq();
    if (!c) return [];
    try {
        const r = await c.query(sql, args || []);
        return Array.isArray(r) && Array.isArray(r[0]) ? r[0] : r;
    } catch (e) {
        console.log('[admin] db: ' + e.message);
        return [];
    }
}

setTimeout(function () {
    q('ALTER TABLE accounts ADD COLUMN IF NOT EXISTS login VARCHAR(32) NULL');
    q('ALTER TABLE accounts ADD COLUMN IF NOT EXISTS nick VARCHAR(64) NULL');
    q('ALTER TABLE accounts ADD COLUMN IF NOT EXISTS admin TINYINT NOT NULL DEFAULT 0');
    setTimeout(syncLogins, 1500);
    q('ALTER TABLE accounts ADD COLUMN IF NOT EXISTS money BIGINT NOT NULL DEFAULT 0');
    q('ALTER TABLE accounts ADD COLUMN IF NOT EXISTS banned TINYINT NOT NULL DEFAULT 0');
    q('ALTER TABLE accounts ADD COLUMN IF NOT EXISTS ban_reason VARCHAR(255) NULL');
    q('ALTER TABLE accounts ADD COLUMN IF NOT EXISTS ban_until BIGINT NOT NULL DEFAULT 0');
}, 3000);

const MIGRATE_FILE = path.join(__dirname, 'admin_levels_v9.flag');
setTimeout(async function () {
    if (fs.existsSync(MIGRATE_FILE)) return;
    if (!dbq()) return;
    await q('UPDATE accounts SET admin = CASE admin WHEN 7 THEN 9 WHEN 6 THEN 8 WHEN 5 THEN 6 ELSE admin END WHERE admin BETWEEN 5 AND 7');
    try { fs.writeFileSync(MIGRATE_FILE, String(Date.now())); } catch (e) {}
    console.log('[admin] уровни переведены на 9-уровневую систему (7→9, 6→8, 5→6)');
    mp.players.forEach(function (p) { p.admAcc = null; });
}, 6000);

function consoleSetAdmin(who, n) {
    n = Number(n);
    if (!who || isNaN(n) || n < 0 || n > MAX) return console.log('Использование: setadmin [id игрока | логин | #static] [0-' + MAX + ']');
    let t = null;
    if (who[0] !== '#') t = find(who);
    if (t && acc(t)) {
        acc(t).admin = n;
        q('UPDATE accounts SET admin = ? WHERE id = ?', [n, acc(t).id]);
        msg(t, 'Ваш статус: ' + rankName(n), '#c13dff');
        console.log('[admin] ' + login(t) + ' → ' + rankName(n));
    } else {
        const k = who[0] === '#' ? who.slice(1) : who;
        q('UPDATE accounts SET admin = ? WHERE id = ? OR username = ? OR login = ? OR nick = ? OR nick = ?', [n, Number(k) || 0, k, k, k, k.replace(/_/g, ' ')]);
        console.log('[admin] ' + k + ' → ' + rankName(n) + ' (офлайн)');
    }
    log('КОНСОЛЬ', 'setadmin', who, rankName(n));
}
try {
    if (process.stdin && !global.__admStdin) {
        global.__admStdin = true;
        let buf = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', function (ch) {
            buf += ch;
            let i;
            while ((i = buf.indexOf('\n')) >= 0) {
                const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
                const a = line.split(/\s+/);
                if (a[0] === 'setadmin') consoleSetAdmin(a[1], a[2]);
                else if (a[0] === 'admins') mp.players.forEach(function (p) { if (realLvl(p)) console.log(realLvl(p) + ' ' + login(p) + ' [' + p.id + ']'); });
            }
        });
    }
} catch (e) {}

function syncLogins() {
    q("UPDATE accounts SET login = username WHERE login IS NULL OR login = ''");
}
setInterval(syncLogins, 30000);

function acc(p) {
    return p && p.admAcc ? p.admAcc : null;
}

const loading = {};
async function loadAcc(p) {
    if (!p || loading[p.id] || p.admAcc) return;
    loading[p.id] = true;
    let rows = [];
    const nickVariants = [p.name, String(p.name).replace(/_/g, ' '), String(p.name).replace(/ /g, '_')];
    for (let i = 0; i < nickVariants.length && !rows.length; i++) {
        rows = await q('SELECT * FROM accounts WHERE nick = ? LIMIT 1', [nickVariants[i]]);
    }
    const ids = [];
    const pushId = function (v) { if (v !== undefined && v !== null && v !== '' && !isNaN(Number(v))) ids.push(Number(v)); };
    if (p.account) pushId(p.account.id);
    pushId(p.accountId);
    pushId(p.account_id);
    if (p.data) { pushId(p.data.accountId); pushId(p.data.account_id); }
    if (typeof p.getVariable === 'function') {
        ['accountId', 'account_id', 'accId', 'uid'].forEach(function (k) {
            try { pushId(p.getVariable(k)); } catch (e) {}
        });
    }
    for (let i = 0; i < ids.length && !rows.length; i++) {
        rows = await q('SELECT * FROM accounts WHERE id = ? LIMIT 1', [ids[i]]);
    }
    if (!rows.length) {
        const names = [];
        if (p.account && p.account.username) names.push(p.account.username);
        if (p.account && p.account.login) names.push(p.account.login);
        names.push(p.name, String(p.name).replace(/ /g, '_'));
        for (let i = 0; i < names.length && !rows.length; i++) {
            rows = await q('SELECT * FROM accounts WHERE username = ? LIMIT 1', [names[i]]);
        }
    }
    if (!rows.length) {
        const parts = String(p.name).replace(/_/g, ' ').split(' ');
        const tables = ['characters', 'players', 'chars'];
        for (let i = 0; i < tables.length && !rows.length; i++) {
            const ch = await q('SELECT * FROM ' + tables[i] + ' WHERE (firstname = ? AND lastname = ?) OR name = ? LIMIT 1', [parts[0], parts.slice(1).join(' '), p.name]);
            if (!ch.length) {
                const ch2 = await q('SELECT * FROM ' + tables[i] + ' WHERE firstname = ? AND lastname = ? LIMIT 1', [parts[0], parts.slice(1).join(' ')]);
                if (ch2.length) ch.push(ch2[0]);
            }
            if (ch.length) {
                const aid = ch[0].account_id || ch[0].accountId || ch[0].owner_id || ch[0].user_id;
                if (aid) rows = await q('SELECT * FROM accounts WHERE id = ? LIMIT 1', [aid]);
            }
        }
    }
    if (!rows.length && p.socialClub) {
        rows = await q('SELECT * FROM accounts WHERE social_club = ? ORDER BY last_login DESC LIMIT 1', [p.socialClub]);
    }
    loading[p.id] = false;
    if (!mp.players.exists(p)) return;
    const forced = OWNERS[p.name] || OWNERS[String(p.name).replace(/ /g, '_')] || 0;
    if (!rows.length && forced) rows = [{ id: 0, username: p.name, admin: forced }];
    if (!rows.length) return;
    const r = rows[0];
    if (forced && (Number(r.admin) || 0) < forced) r.admin = forced;
    p.admAcc = {
        id: r.id,
        login: r.login || r.username,
        nick: r.nick || null,
        admin: Number(r.admin) || 0,
        money: Number(r.money) || 0,
        banned: Number(r.banned) || 0,
        ban_reason: r.ban_reason,
        ban_until: Number(r.ban_until) || 0
    };
    if (p.admAcc.id && !p.admAcc.nick && /^[A-Za-zА-Яа-яЁё]+[ _][A-Za-zА-Яа-яЁё]+$/.test(p.name)) {
        p.admAcc.nick = String(p.name).replace(/_/g, ' ');
        q('UPDATE accounts SET nick = ? WHERE id = ? AND (nick IS NULL OR nick = \'\')', [p.admAcc.nick, p.admAcc.id]);
    }
    if (p.admAcc.admin > 0) {
        msg(p, 'Вы вошли как ' + rankName(p.admAcc.admin) + '. F4 — админ-панель', rankColor(p.admAcc.admin));
    }
}

setInterval(function () {
    mp.players.forEach(function (p) { if (!p.admAcc && (p.account || OWNERS[p.name])) loadAcc(p); });
}, 3000);

function realLvl(p) {
    const a = acc(p);
    if (!a) return 0;
    return Math.max(0, Math.min(MAX, Number(a.admin) || 0));
}
function lvl(p) {
    if (p && p.admOff) return 0;
    return realLvl(p);
}
function rankName(n) {
    n = Number(n) || 0;
    return RANKS[n] || ('Уровень ' + n);
}
function rankColor(n) {
    return COLORS[Number(n) || 0] || '#ffffff';
}
function can(p, action) {
    const L = lvl(p);
    if (L < (PERM[action] || 99)) return false;
    const f = featureOf(action);
    if (f && locks[f] && L < MAX) return false;
    return true;
}
function whyNot(p, action) {
    const f = featureOf(action);
    if (f && locks[f] && lvl(p) >= (PERM[action] || 99)) return 'Функция «' + FEATURE_NAMES[f] + '» отключена руководством';
    return 'Нужен уровень: ' + rankName(PERM[action] || 99);
}
function login(p) {
    if (p && p.admAcc && p.admAcc.login) return p.admAcc.login;
    return p ? p.name : '-';
}
function msg(p, text, color) {
    p.outputChatBox('!{' + (color || '#ffcc66') + '}' + text);
}
function deny(p, action) {
    msg(p, action ? whyNot(p, action) : 'Недостаточно прав', '#e05555');
}
function find(arg) {
    if (arg === undefined || arg === null || arg === '') return null;
    const s = String(arg).trim().toLowerCase();
    const id = Number(s);
    let res = null;
    mp.players.forEach(function (p) {
        if (res) return;
        if (!isNaN(id) && p.id === id) res = p;
    });
    if (res) return res;
    mp.players.forEach(function (p) {
        if (res) return;
        if (login(p).toLowerCase().indexOf(s) === 0 || String(p.name).toLowerCase().indexOf(s) === 0) res = p;
    });
    return res;
}
function staff(text) {
    mp.players.forEach(function (p) {
        if (lvl(p) >= 1) p.outputChatBox('!{#c13dff}[A] !{#ffffff}' + text);
    });
}
const LOG_FILE = path.join(__dirname, 'admin_logs.json');
(function () { try { const l = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')); if (Array.isArray(l)) l.forEach(function (x) { logs.push(x); }); } catch (e) {} })();
let logsDirty = false;
setInterval(function () { if (logsDirty) { logsDirty = false; writeJson(LOG_FILE, logs.slice(0, 3000)); } }, 15000);
function log(admin, action, target, details) {
    const row = { admin: typeof admin === 'string' ? admin : login(admin), lvl: typeof admin === 'string' ? 0 : realLvl(admin), action: action, target: target || '-', details: String(details || ''), time: Date.now() };
    logs.unshift(row);
    if (logs.length > 3000) logs.pop();
    logsDirty = true;
    if (global.SLog) global.SLog.admin(row.admin, row.lvl, action, row.target, row.details);
    console.log('[admin] ' + row.admin + ' ' + action + ' ' + row.target + ' ' + row.details);
}
function canTouch(admin, target) {
    if (!target) return false;
    if (admin === target) return true;
    return lvl(admin) > lvl(target) || lvl(admin) === MAX;
}

function parseDuration(s) {
    s = String(s || '').trim().toLowerCase();
    if (s === '0' || s === 'perm' || s === 'навсегда') return 0;
    const m = s.match(/^(\d+)\s*([mhdмчд]?)/);
    if (!m) return -1;
    const n = Number(m[1]);
    const u = m[2];
    if (u === 'm' || u === 'м') return n;
    if (u === 'h' || u === 'ч') return n * 60;
    return n * 1440;
}
function durationText(min) {
    if (!min) return 'навсегда';
    if (min < 60) return min + ' мин';
    if (min < 1440) return Math.round(min / 60) + ' ч';
    return Math.round(min / 1440) + ' дн';
}
function maxBan(p) {
    const L = lvl(p);
    if (L >= 7) return 0;
    return BAN_LIMIT[L] || 0;
}

function activeBan(rec) {
    if (!rec) return false;
    return !rec.until || rec.until > Date.now();
}
function findBan(p) {
    const lg = acc(p) ? String(acc(p).login).toLowerCase() : null;
    return bans.find(function (b) {
        if (!activeBan(b)) return false;
        if (lg && b.login && b.login.toLowerCase() === lg) return true;
        if (b.social && p.socialClub && b.social === p.socialClub) return true;
        if (b.serial && p.serial && b.serial === p.serial) return true;
        return false;
    });
}

function showBan(p, rec) {
    try {
        p.call('adm:banScreen', [JSON.stringify({
            login: rec.login,
            admin: rec.admin,
            reason: rec.reason,
            date: rec.date,
            until: rec.until,
            forever: !rec.until
        })]);
    } catch (e) {}
    const pid = p;
    setTimeout(function () {
        if (mp.players.exists(pid)) pid.kick('Бан: ' + rec.reason);
    }, 20000);
}

function doBan(admin, target, minutes, reason, offlineLogin) {
    const lg = target ? login(target) : offlineLogin;
    const rec = {
        login: lg,
        social: target ? target.socialClub : null,
        serial: target ? target.serial : null,
        ip: target ? target.ip : null,
        static: target && acc(target) ? acc(target).id : null,
        nick: target ? String(target.name) : null,
        reason: reason,
        admin: typeof admin === 'string' ? admin : login(admin),
        adminRank: typeof admin === 'string' ? 'Консоль' : rankName(lvl(admin)),
        date: Date.now(),
        until: minutes ? Date.now() + minutes * 60000 : 0
    };
    bans = bans.filter(function (b) { return !(b.login && lg && b.login.toLowerCase() === lg.toLowerCase()); });
    bans.unshift(rec);
    writeJson(BANS_FILE, bans);
    if (global.AdminCore && global.AdminCore.banHistory) global.AdminCore.banHistory(rec, 'ban');
    q('UPDATE accounts SET banned = 1, ban_reason = ?, ban_until = ? WHERE username = ? OR login = ? OR nick = ?', [reason, rec.until, lg, lg, lg]);

    mp.players.broadcast('!{#e05555}[БАН] !{#ffffff}' + (typeof admin === 'string' ? 'Консоль ' + admin : rankName(lvl(admin)) + ' ' + login(admin)) +
        ' забанил игрока !{#ffcc66}' + lg + ' !{#ffffff}на ' + durationText(minutes) + '. Причина: !{#ff8080}' + reason);
    log(admin, 'ban', lg, durationText(minutes) + ' | ' + reason);
    if (target) showBan(target, rec);
}

function doUnban(admin, lg) {
    const before = bans.length;
    bans = bans.filter(function (b) { return !(b.login && b.login.toLowerCase() === String(lg).toLowerCase()); });
    writeJson(BANS_FILE, bans);
    q('UPDATE accounts SET banned = 0, ban_reason = NULL, ban_until = 0 WHERE username = ? OR login = ? OR nick = ?', [lg, lg, lg]);
    log(admin, 'unban', lg, '');
    staff((typeof admin === 'string' ? admin : login(admin)) + ' разбанил ' + lg);
    if (global.AdminCore && global.AdminCore.banHistory) global.AdminCore.banHistory({ login: lg, admin: typeof admin === 'string' ? admin : login(admin), date: Date.now() }, 'unban');
    return before !== bans.length;
}

const checked = {};
setInterval(function () {
    mp.players.forEach(function (p) {
        const a = acc(p);
        if (!a || checked[p.id] === a.login) return;
        checked[p.id] = a.login;
        let rec = findBan(p);
        if (!rec && Number(a.banned) === 1) {
            const until = Number(a.ban_until) || 0;
            if (!until || until > Date.now()) {
                rec = { login: a.login, admin: 'Система', reason: a.ban_reason || 'нарушение', date: Date.now(), until: until };
            }
        }
        if (rec) showBan(p, rec);
    });
}, 2000);

mp.events.add('playerJoin', function (p) {
    const rec = bans.find(function (b) {
        return activeBan(b) && ((b.social && b.social === p.socialClub) || (b.serial && b.serial === p.serial));
    });
    if (rec) setTimeout(function () { if (mp.players.exists(p)) showBan(p, rec); }, 3000);
});

mp.events.add('srv:ban:quit', function (p) {
    if (findBan(p) || (acc(p) && Number(acc(p).banned) === 1)) p.kick('Бан');
});

mp.events.add('playerQuit', function (p) {
    delete muted[p.id];
    delete frozen[p.id];
    delete checked[p.id];
    delete loading[p.id];
});

function doKick(admin, t, reason) {
    log(admin, 'kick', login(t), reason);
    mp.players.broadcast('!{#ff9f43}[КИК] !{#ffffff}' + login(admin) + ' кикнул игрока !{#ffcc66}' + login(t) + ' !{#ffffff}— ' + reason);
    t.kick(reason);
}

function doMute(admin, t, min, reason) {
    muted[t.id] = Date.now() + min * 60000;
    msg(t, 'Вы получили мут на ' + min + ' мин. Причина: ' + reason, '#e05555');
    mp.players.broadcast('!{#ffcc66}[МУТ] !{#ffffff}' + login(admin) + ' выдал мут ' + login(t) + ' на ' + min + ' мин — ' + reason);
    log(admin, 'mute', login(t), min + ' мин | ' + reason);
}

function doWarn(admin, t, reason) {
    const key = login(t).toLowerCase();
    warns[key] = (warns[key] || 0) + 1;
    writeJson(WARN_FILE, warns);
    const n = warns[key];
    mp.players.broadcast('!{#ff9f43}[ВАРН] !{#ffffff}' + login(admin) + ' выдал предупреждение ' + login(t) + ' (' + n + '/3) — ' + reason);
    log(admin, 'warn', login(t), n + '/3 | ' + reason);
    if (n >= 3) {
        warns[key] = 0;
        writeJson(WARN_FILE, warns);
        doBan(admin, t, 3 * 1440, '3/3 предупреждений');
    }
}

function doFreeze(admin, t, on) {
    frozen[t.id] = on;
    t.call('adm:freeze', [on]);
    msg(t, on ? 'Вас заморозил администратор' : 'Вы разморожены', on ? '#7fd4ff' : '#8fd14f');
    log(admin, on ? 'freeze' : 'unfreeze', login(t), '');
}

function doHeal(admin, t) {
    if (t.account && t.account.downed && global.DeathSystem && typeof global.DeathSystem.revive === 'function') global.DeathSystem.revive(t);
    t.health = 100;
    t.armour = 100;
    msg(t, 'Администратор восстановил вам здоровье', '#8fd14f');
    log(admin, 'heal', login(t), '');
}

function tpTo(p, t) {
    p.position = new mp.Vector3(t.position.x + 1, t.position.y, t.position.z);
    p.dimension = t.dimension;
}

function spawnVeh(admin, model, c1, c2, target, own) {
    const who = target || admin;
    const h = mp.joaat(String(model));
    const pos = who.position;
    const heading = who.heading || 0;
    const rad = (heading * Math.PI) / 180;
    const spot = who.vehicle || who !== admin
        ? new mp.Vector3(pos.x - Math.sin(rad) * 4, pos.y + Math.cos(rad) * 4, pos.z)
        : pos;
    const plate = own ? ('SR' + Math.floor(100000 + Math.random() * 899999)).slice(0, 8) : 'ADMIN';
    const v = mp.vehicles.new(h, spot, { heading: heading, numberPlate: plate, dimension: who.dimension, locked: false, engine: true });
    try { v.setColor(Number(c1) || 0, Number(c2) || 0); } catch (e) {}
    if (!own) {
        v.adminSpawned = true;
        adminVehs.push(v);
    }
    if (!target && !admin.vehicle) {
        setTimeout(function () {
            try { admin.putIntoVehicle(v, 0); } catch (e) {}
        }, 200);
    }
    if (own && acc(who)) {
        try { v.setVariable('ownerId', acc(who).id); } catch (e) {}
        q('INSERT INTO vehicles (owner_id, model, plate, color1, color2, pos_x, pos_y, pos_z, heading) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [acc(who).id, String(model), plate, Number(c1) || 0, Number(c2) || 0, spot.x, spot.y, spot.z, heading]);
        msg(who, 'Вам выдан автомобиль ' + model + ' (номер ' + plate + ')', '#8fd14f');
    }
    log(admin, own ? 'givecar' : 'veh', target ? login(target) : login(admin), model);
    return v;
}

function moneyOf(p) {
    if (global.MoneySystem) return global.MoneySystem.get(p);
    if (p.account && p.account.money !== undefined) return Number(p.account.money) || 0;
    if (typeof p.getVariable === 'function' && p.getVariable('money') !== undefined && p.getVariable('money') !== null) return Number(p.getVariable('money')) || 0;
    return acc(p) ? Number(acc(p).money) || 0 : 0;
}

function addMoney(p, sum) {
    if (global.MoneySystem) { global.MoneySystem.add(p, sum); return global.MoneySystem.get(p); }
    const now = moneyOf(p) + sum;
    if (p.account && p.account.money !== undefined) p.account.money = now;
    if (typeof p.getVariable === 'function' && p.getVariable('money') !== undefined && p.getVariable('money') !== null) p.setVariable('money', now);
    if (acc(p)) {
        acc(p).money = now;
        q('UPDATE accounts SET money = ? WHERE id = ?', [now, acc(p).id]);
    }
    return now;
}

function playersData() {
    const out = [];
    mp.players.forEach(function (p) {
        out.push({
            id: p.id,
            name: login(p),
            admin: lvl(p),
            rank: rankName(lvl(p)),
            hp: Math.round(p.health),
            armour: Math.round(p.armour),
            money: moneyOf(p),
            ping: p.ping,
            muted: !!(muted[p.id] && muted[p.id] > Date.now()),
            frozen: !!frozen[p.id],
            warns: warns[login(p).toLowerCase()] || 0
        });
    });
    return out;
}

function panelData(p) {
    return {
        me: { name: login(p), level: lvl(p), real: realLvl(p), off: !!p.admOff, rank: rankName(lvl(p)), color: rankColor(lvl(p)) },
        ext: global.AdminCore && global.AdminCore.panelExt ? global.AdminCore.panelExt(p) : null,
        locks: locks, features: FEATURE_NAMES,
        ranks: RANKS,
        me2: null,
        perm: PERM,
        maxBan: maxBan(p),
        players: playersData(),
        bans: bans.filter(activeBan).slice(0, 80),
        logs: can(p, 'logs') ? logs.slice(0, 400) : [],
        dlc: dlc,
        weather: mp.world.weather,
        shops: global.ShopSystem ? global.ShopSystem.list().map(function (a) { return { id: a.id, kind: a.kind, name: a.name, ownerName: a.ownerName, price: a.price, markup: a.markup, stock: a.stock, max: a.max, balance: a.balance, earned: a.earned }; }) : [],
        gov: global.GovSystem ? global.GovSystem.get() : null,
        stations: global.FuelSystem ? global.FuelSystem.list().map(function (a) { return { id: a.id, name: a.name, ownerName: a.ownerName, price: a.price, markup: a.markup, stock: a.stock, max: a.max, balance: a.balance, earned: a.earned }; }) : [],
        atms: global.AtmSystem ? global.AtmSystem.list().map(function (a) { return { id: a.id, name: a.name, ownerName: a.ownerName, price: a.price, fee: a.fee, balance: a.balance, earned: a.earned }; }) : []
    };
}

function setAdminRule(p, cur, n) {
    const L = lvl(p);
    if (L >= MAX) return null;
    if (L < 8) return 'Назначать админов может только ГА (8) и выше';
    if (cur >= L) return 'Нельзя менять уровень админа своего уровня или выше';
    if (n > 7) return 'ГА может повысить максимум до ЗГА (7). Назначить ГА — только МГА (9)';
    return null;
}

function sendPanel(p) {
    p.call('adm:data', [JSON.stringify(panelData(p))]);
}

mp.events.add('srv:adm:open', function (p) {
    if (realLvl(p) >= 1 && p.admOff) { msg(p, 'Админка выключена. Включить: /aon', '#ffcc66'); p.call('adm:close'); return; }
    if (!can(p, 'panel')) {
        msg(p, 'Админ-панель доступна только администрации', '#e05555');
        p.call('adm:close');
        return;
    }
    sendPanel(p);
});

mp.events.add('srv:adm:refresh', function (p) {
    if (can(p, 'panel')) sendPanel(p);
});

function toast(p, text, ok) {
    p.call('adm:toast', [text, ok ? 1 : 0]);
}

mp.events.add('srv:adm:act', function (p, json) {
    let d;
    try { d = JSON.parse(json); } catch (e) { return; }
    const a = d.action;
    const t = d.id !== undefined ? find(d.id) : null;
    const reason = String(d.reason || 'нарушение правил').slice(0, 100);
    const needT = ['tp', 'bring', 'heal', 'kick', 'slap', 'freeze', 'unfreeze', 'mute', 'unmute', 'warn', 'ban', 'goto', 'revive', 'givemoney', 'sethp'];
    if (global.AdminCore && global.AdminCore.panelAct && global.AdminCore.panelAct(p, d, t)) return;

    if (a === 'gov') {
        if (!global.GovSystem) return toast(p, 'Казна не загружена', false);
        if (lvl(p) < 6) return toast(p, 'Казной управляет только руководство (6+)', false);
        if (d.op === 'tax') { const t = global.GovSystem.setTax(d.value); toast(p, 'Налог при продаже бизнеса: ' + t + '%', true); return sendPanel(p); }
        if (d.op === 'withdraw') { const ok = global.GovSystem.withdraw(d.value, login(p)); toast(p, ok ? 'Списано из казны $' + d.value : 'Неверная сумма', ok); return sendPanel(p); }
        return;
    }
    if (a === 'atm') {
        if (!global.AtmSystem) return toast(p, 'Модуль банкоматов не загружен', false);
        if (d.op !== 'tp' && lvl(p) < 5) return toast(p, 'Нужен 5 уровень админки', false);
        if (lvl(p) < 3) return toast(p, 'Недостаточно прав', false);
        return global.AtmSystem.admin(p, d).then(function (t) { toast(p, t, true); sendPanel(p); }).catch(function (e) { toast(p, e.message, false); });
    }
    if (!can(p, a)) return toast(p, whyNot(p, a), false);
    if (needT.indexOf(a) >= 0 && !t) return toast(p, 'Игрок не найден', false);
    if (t && t !== p && ['kick', 'ban', 'mute', 'warn', 'freeze', 'slap'].indexOf(a) >= 0 && !canTouch(p, t)) {
        return toast(p, 'Нельзя применить к админу твоего уровня или выше', false);
    }

    if (a === 'tp' || a === 'goto') { tpTo(p, t); log(p, 'tp', login(t), ''); toast(p, 'Телепорт к ' + login(t), true); }
    else if (a === 'bring') { tpTo(t, p); msg(t, 'Вас телепортировал администратор'); log(p, 'bring', login(t), ''); toast(p, login(t) + ' у тебя', true); }
    else if (a === 'heal') { doHeal(p, t); toast(p, login(t) + ' вылечен', true); }
    else if (a === 'revive') {
        doHeal(p, t);
        log(p, 'revive', login(t), ''); toast(p, login(t) + ' поднят', true);
    }
    else if (a === 'slap') { global.AdminCore.slap(p, t, Number(d.hp) || 0); toast(p, 'Шлепок', true); }
    else if (a === 'freeze') { doFreeze(p, t, true); toast(p, login(t) + ' заморожен', true); }
    else if (a === 'unfreeze') { doFreeze(p, t, false); toast(p, login(t) + ' разморожен', true); }
    else if (a === 'mute') { doMute(p, t, Math.max(1, Math.min(600, Number(d.minutes) || 10)), reason); toast(p, 'Мут выдан', true); }
    else if (a === 'unmute') { delete muted[t.id]; msg(t, 'Мут снят', '#8fd14f'); log(p, 'unmute', login(t), ''); toast(p, 'Мут снят', true); }
    else if (a === 'warn') { doWarn(p, t, reason); toast(p, 'Предупреждение выдано', true); }
    else if (a === 'kick') { doKick(p, t, reason); toast(p, 'Кикнут', true); }
    else if (a === 'ban') {
        let min = Number(d.minutes) || 0;
        const lim = maxBan(p);
        if (lim && (!min || min > lim)) return toast(p, 'Твой максимум: ' + durationText(lim), false);
        if (!min && !can(p, 'permban')) return toast(p, 'Вечный бан — с уровня ' + rankName(PERM.permban), false);
        doBan(p, t, min, reason);
        toast(p, login(t) + ' забанен', true);
    }
    else if (a === 'unban') { doUnban(p, d.login); toast(p, 'Разбанен: ' + d.login, true); }
    else if (a === 'givemoney') {
        const sum = Math.floor(Number(d.sum) || 0);
        if (!acc(t) || !sum) return toast(p, 'Неверная сумма', false);
        addMoney(t, sum);
        msg(t, 'Администратор начислил вам $' + sum, '#8fd14f');
        log(p, 'givemoney', login(t), '$' + sum);
        toast(p, 'Выдано $' + sum, true);
    }
    else if (a === 'sethp') { t.health = Math.max(0, Math.min(100, Number(d.hp) || 100)); log(p, 'sethp', login(t), String(d.hp)); toast(p, 'HP изменено', true); }
    else if (a === 'weather') { mp.world.weather = String(d.weather || 'CLEAR'); log(p, 'weather', '-', d.weather); toast(p, 'Погода: ' + d.weather, true); }
    else if (a === 'time') { const h = Number(d.hour) || 12; mp.world.time.set(h, 0, 0); log(p, 'time', '-', h + ':00'); toast(p, 'Время: ' + h + ':00', true); }
    else if (a === 'announce') {
        const text = String(d.text || '').slice(0, 200);
        if (!text) return toast(p, 'Пустой текст', false);
        mp.players.broadcast('!{#c13dff}[ОБЪЯВЛЕНИЕ] !{#ffffff}' + text);
        mp.players.call('adm:announce', [text, login(p)]);
        log(p, 'announce', '-', text);
        toast(p, 'Объявление отправлено', true);
    }
    else if (a === 'dvall') {
        const n = adminVehs.length;
        adminVehs.splice(0).forEach(function (v) { if (mp.vehicles.exists(v)) v.destroy(); });
        log(p, 'dvall', '-', String(n));
        toast(p, 'Удалено машин: ' + n, true);
    }
    else if (a === 'adddlc') {
        const model = String(d.model || '').trim().toLowerCase();
        const name = String(d.name || model).trim().slice(0, 40);
        if (!/^[a-z0-9_]{2,32}$/.test(model)) return toast(p, 'Неверное имя модели', false);
        dlc = dlc.filter(function (x) { return x.model !== model; });
        dlc.push({ model: model, name: name });
        writeJson(DLC_FILE, dlc);
        log(p, 'adddlc', model, name);
        toast(p, 'DLC добавлена: ' + name, true);
    }
    else if (a === 'deldlc') {
        dlc = dlc.filter(function (x) { return x.model !== d.model; });
        writeJson(DLC_FILE, dlc);
        toast(p, 'Удалено из списка', true);
    }
    else if (a === 'setadmin') {
        const n = Number(d.level);
        if (d.id === undefined || d.id === null || String(d.id).trim() === '') return toast(p, 'Укажи ID, логин или #static', false);
        if (isNaN(n)) return toast(p, 'Выбери уровень', false);
        const tt = find(d.id);
        if (!tt || !acc(tt)) { runCmd(p, 'setadmin ' + d.id + ' ' + n); return sendPanel(p); }
        if (isNaN(n) || n < 0 || n > MAX) return toast(p, 'Уровень 0-' + MAX, false);
        const why = setAdminRule(p, realLvl(tt), n);
        if (why) return toast(p, why, false);
        acc(tt).admin = n;
        q('UPDATE accounts SET admin = ? WHERE id = ?', [n, acc(tt).id]);
        msg(tt, 'Ваш статус: ' + rankName(n), '#c13dff');
        staff(login(p) + ' назначил ' + login(tt) + ' → ' + rankName(n));
        log(p, 'setadmin', login(tt), rankName(n));
        toast(p, login(tt) + ' → ' + rankName(n), true);
    }
    sendPanel(p);
});

mp.events.add('srv:adm:veh', function (p, json) {
    let d;
    try { d = JSON.parse(json); } catch (e) { return; }
    const model = String(d.model || '').trim().toLowerCase();
    if (!/^[a-z0-9_]{2,32}$/.test(model)) return toast(p, 'Неверное имя модели', false);
    const isDlc = !!d.dlc;
    if (!can(p, isDlc ? 'vehdlc' : 'veh')) return toast(p, 'Недостаточно прав', false);
    if (d.own && !can(p, 'givecar')) return toast(p, 'Выдача в собственность — с уровня ' + rankName(PERM.givecar), false);
    const target = d.target !== undefined && d.target !== '' ? find(d.target) : null;
    if (d.target !== undefined && d.target !== '' && !target) return toast(p, 'Игрок не найден', false);
    spawnVeh(p, model, d.c1, d.c2, target, !!d.own);
    toast(p, (d.own ? 'Выдан: ' : 'Создан: ') + model, true);
});

mp.events.add('srv:adm:vehBad', function (p, model) {
    toast(p, 'Модель "' + model + '" не найдена в игре. Проверь название в vehicles.meta (<modelName>) и что папка DLC есть в dlcpacks', false);
    msg(p, 'Модель ' + model + ' не найдена в игре', '#e05555');
});

mp.events.add('srv:adm:noclip', function (p, on) {
    if (!can(p, 'fly')) return;
    p.alpha = on ? 0 : 255;
    p.admFly = on ? { since: Date.now(), pos: null } : null;
    if (on) p.call('adm:flyTp', [can(p, 'flytp')]);
    log(p, 'fly', login(p), on ? 'вкл' : 'выкл');
});

mp.events.add('srv:adm:flyLand', function (p, x, y, z) {
    if (!can(p, 'flytp')) return;
    p.position = new mp.Vector3(Number(x), Number(y), Number(z));
});

mp.events.add('playerChat', function (p, text) {
    if (muted[p.id] && Date.now() < muted[p.id]) {
        const left = Math.ceil((muted[p.id] - Date.now()) / 60000);
        msg(p, 'Вы в муте ещё ' + left + ' мин', '#e05555');
        return;
    }
    const L = lvl(p);
    const tag = L >= 1 && !p.hidePrefix ? '!{badge:' + L + '}!{' + rankColor(L) + '}[' + SHORT[L] + '] ' : '';
    if (global.AdminCore && global.AdminCore.chatHook && global.AdminCore.chatHook(p, text)) return;
    const S = global.SocialSystem;
    if (!S) return mp.players.broadcast(tag + '!{#ffffff}' + login(p) + ' [' + p.id + ']: ' + text);
    mp.players.forEach(function (x) {
        x.outputChatBox(tag + '!{#ffffff}' + S.seen(x, p) + ' [' + p.id + ']: ' + text);
    });
});

const CMDS = {};
function runCmd(p, line) {
    const parts = String(line || '').trim().replace(/^\//, '').split(/\s+/);
    const c = CMDS[parts.shift().toLowerCase()];
    if (!c) return false;
    c(p, parts.join(' '));
    return true;
}
function cmd(name, perm, usage, fn) {
    CMDS[name] = function (p, full) {
        if (!can(p, perm)) return deny(p, perm);
        const args = String(full || '').trim().split(/\s+/).filter(Boolean);
        fn(p, args, usage, String(full || ''));
    };
    mp.events.addCommand(name, function (p, full) {
        if (!can(p, perm)) return deny(p, perm);
        const args = String(full || '').trim().split(/\s+/).filter(Boolean);
        fn(p, args, usage, String(full || ''));
    });
}
function need(p, t, usage) {
    if (!t) { msg(p, 'Использование: ' + usage); return false; }
    return true;
}

mp.events.add('creator:finish', function (p, firstname, lastname) {
    const nick = String(firstname || '').trim() + ' ' + String(lastname || '').trim();
    if (nick.trim().length < 3) return;
    setTimeout(async function () {
        if (!mp.players.exists(p)) return;
        let a = acc(p);
        if (!a || !a.id) {
            p.admAcc = null;
            await loadAcc(p);
            a = acc(p);
        }
        if (!a || !a.id) {
            const r = p.socialClub ? await q('SELECT id FROM accounts WHERE social_club = ? ORDER BY last_login DESC LIMIT 1', [p.socialClub]) : [];
            if (!r.length) return console.log('[admin] ник ' + nick + ': аккаунт не найден');
            await q('UPDATE accounts SET nick = ? WHERE id = ?', [nick, r[0].id]);
        } else {
            a.nick = nick;
            await q('UPDATE accounts SET nick = ? WHERE id = ?', [nick, a.id]);
        }
        console.log('[admin] ник сохранён: ' + nick);
        p.admAcc = null;
        loadAcc(p);
    }, 2000);
});

mp.events.addCommand('alevel', function (p) {
    p.admAcc = null;
    loadAcc(p).then(function () {
        const a = acc(p);
        if (!a) return msg(p, 'Аккаунт не найден. Ник: ' + p.name + ', Social Club: ' + p.socialClub, '#e05555');
        msg(p, 'Логин: ' + a.login + ', ник: ' + (a.nick || '—') + ', уровень: ' + a.admin + ' (' + rankName(a.admin) + ')', rankColor(a.admin));
    });
});

cmd('a', 'a', '/a [текст]', function (p, a, u, full) {
    if (!full.trim()) return msg(p, u);
    mp.players.forEach(function (x) {
        if (lvl(x) >= 1) x.outputChatBox('!{#c13dff}[A] !{' + rankColor(lvl(p)) + '}' + SHORT[lvl(p)] + ' ' + login(p) + ': !{#ffffff}' + full.trim());
    });
    if (global.AdminCore && global.AdminCore.pushChat) global.AdminCore.pushChat(SHORT[lvl(p)] + ' ' + login(p), full.trim());
});

mp.events.addCommand('admins', function (p) {
    let n = 0;
    p.outputChatBox('!{#c13dff}=== Администрация онлайн ===');
    mp.players.forEach(function (x) {
        if (lvl(x) >= 1) { n++; p.outputChatBox('!{' + rankColor(lvl(x)) + '}' + rankName(lvl(x)) + ' !{#ffffff}' + login(x) + ' [' + x.id + ']'); }
    });
    if (!n) msg(p, 'Администраторов онлайн нет');
});

mp.events.addCommand('report', function (p, full) {
    const text = String(full || '').trim();
    if (!text) return msg(p, '/report [текст] — сообщение администрации');
    if (global.AdminCore && global.AdminCore.addReport) return global.AdminCore.addReport(p, text);
    staff('!{#ffcc66}[РЕПОРТ] ' + login(p) + ' [' + p.id + ']: !{#ffffff}' + text);
    msg(p, 'Репорт отправлен администрации', '#8fd14f');
});

cmd('pm', 'pm', '/pm [id] [текст]', function (p, a, u) {
    const t = find(a[0]);
    const text = a.slice(1).join(' ');
    if (!need(p, t && text, u)) return;
    t.outputChatBox('!{#c13dff}[Ответ от ' + rankName(lvl(p)) + ' ' + login(p) + ']: !{#ffffff}' + text);
    p.admLastAnswer = Date.now();
    msg(p, 'Отправлено ' + login(t), '#8fd14f');
    log(p, 'pm', login(t), text);
});

cmd('mute', 'mute', '/mute [id] [минуты] [причина]', function (p, a, u) {
    const t = find(a[0]);
    if (!need(p, t, u)) return;
    if (!canTouch(p, t)) return deny(p);
    doMute(p, t, Math.max(1, Math.min(600, Number(a[1]) || 10)), a.slice(2).join(' ') || 'нарушение');
});

cmd('unmute', 'unmute', '/unmute [id]', function (p, a, u) {
    const t = find(a[0]);
    if (!need(p, t, u)) return;
    delete muted[t.id];
    msg(t, 'Мут снят', '#8fd14f');
    msg(p, 'Мут снят с ' + login(t), '#8fd14f');
    log(p, 'unmute', login(t), '');
});

cmd('goto', 'goto', '/goto [id]', function (p, a, u) {
    const t = find(a[0]);
    if (!need(p, t, u)) return;
    tpTo(p, t);
    log(p, 'tp', login(t), '');
});

cmd('tp', 'tp', '/tp [id]', function (p, a, u) {
    const t = find(a[0]);
    if (!need(p, t, u)) return;
    tpTo(p, t);
    msg(p, 'Телепорт к ' + login(t), '#8fd14f');
    log(p, 'tp', login(t), '');
});

cmd('bring', 'bring', '/bring [id]', function (p, a, u) {
    const t = find(a[0]);
    if (!need(p, t, u)) return;
    tpTo(t, p);
    msg(t, 'Вас телепортировал администратор');
    log(p, 'bring', login(t), '');
});

cmd('tpc', 'tpc', '/tpc [x] [y] [z]', function (p, a, u) {
    if (a.length < 3) return msg(p, u);
    p.position = new mp.Vector3(Number(a[0]), Number(a[1]), Number(a[2]));
    log(p, 'tpc', '-', a.join(' '));
});

cmd('aheal', 'heal', '/aheal [id]', function (p, a) {
    const t = find(a[0]) || p;
    if (t === p && false) return;
    doHeal(p, t);
});

cmd('arevive', 'heal', '/arevive [id] — без id поднимет вас', function (p, a) {
    const t = find(a[0]) || p;
    doHeal(p, t);
    msg(p, t === p ? 'Вы подняли себя' : 'Вы подняли ' + login(t), '#8fd14f');
});
cmd('selfrevive', 'healself', '/selfrevive', function (p) { doHeal(p, p); });


cmd('freeze', 'freeze', '/freeze [id]', function (p, a, u) {
    const t = find(a[0]);
    if (!need(p, t, u)) return;
    if (!canTouch(p, t)) return deny(p);
    doFreeze(p, t, !frozen[t.id]);
});

cmd('kick', 'kick', '/kick [id] [причина]', function (p, a, u) {
    const t = find(a[0]);
    if (!need(p, t, u)) return;
    if (!canTouch(p, t)) return deny(p);
    doKick(p, t, a.slice(1).join(' ') || 'нарушение');
});

cmd('warn', 'warn', '/warn [id] [причина]', function (p, a, u) {
    const t = find(a[0]);
    if (!need(p, t, u)) return;
    if (!canTouch(p, t)) return deny(p);
    doWarn(p, t, a.slice(1).join(' ') || 'нарушение');
});

cmd('unwarn', 'warn', '/unwarn [логин]', function (p, a, u) {
    if (!a[0]) return msg(p, u);
    warns[a[0].toLowerCase()] = 0;
    writeJson(WARN_FILE, warns);
    msg(p, 'Предупреждения сняты с ' + a[0], '#8fd14f');
    log(p, 'unwarn', a[0], '');
});

cmd('gm', 'gm', '/gm', function (p) {
    p.adminGm = !p.adminGm;
    p.call('adm:gm', [p.adminGm]);
    msg(p, 'Бессмертие: ' + (p.adminGm ? 'вкл' : 'выкл'), '#8fd14f');
});

cmd('invis', 'invis', '/invis', function (p) {
    p.alpha = p.alpha === 0 ? 255 : 0;
    msg(p, 'Невидимость: ' + (p.alpha === 0 ? 'вкл' : 'выкл'), '#8fd14f');
    log(p, 'invis', login(p), p.alpha === 0 ? 'вкл' : 'выкл');
});

cmd('fly', 'fly', '/fly', function (p) {
    p.call('adm:noclipToggle');
});

cmd('ban', 'ban', '/ban [id] [срок: 30m/12h/7d/0] [причина]', function (p, a, u) {
    const t = find(a[0]);
    const min = parseDuration(a[1]);
    if (!need(p, t && min >= 0, u)) return;
    if (!canTouch(p, t)) return deny(p);
    const lim = maxBan(p);
    if (lim && (!min || min > lim)) return msg(p, 'Твой максимальный срок: ' + durationText(lim), '#e05555');
    if (!min && !can(p, 'permban')) return msg(p, 'Вечный бан — с уровня ' + rankName(PERM.permban), '#e05555');
    doBan(p, t, min, a.slice(2).join(' ') || 'нарушение правил');
});

cmd('offban', 'offban', '/offban [логин] [срок] [причина]', function (p, a, u) {
    const min = parseDuration(a[1]);
    if (!a[0] || min < 0) return msg(p, u);
    const lim = maxBan(p);
    if (lim && (!min || min > lim)) return msg(p, 'Твой максимальный срок: ' + durationText(lim), '#e05555');
    if (!min && !can(p, 'permban')) return msg(p, 'Вечный бан — с уровня ' + rankName(PERM.permban), '#e05555');
    const online = find(a[0]);
    doBan(p, online && login(online).toLowerCase() === a[0].toLowerCase() ? online : null, min, a.slice(2).join(' ') || 'нарушение правил', a[0]);
});



cmd('veh', 'veh', '/veh [модель] [цвет1] [цвет2]', function (p, a, u) {
    if (!a[0]) return msg(p, u + '. Пример: /veh sultan 0 0');
    p.call('adm:vehCheck', [JSON.stringify({ model: a[0].toLowerCase(), c1: Number(a[1]) || 0, c2: Number(a[2]) || 0, dlc: false })]);
});

cmd('vehdlc', 'vehdlc', '/vehdlc [модель DLC] [цвет1] [цвет2]', function (p, a, u) {
    if (!a[0]) return msg(p, u + '. Список: /dlclist');
    p.call('adm:vehCheck', [JSON.stringify({ model: a[0].toLowerCase(), c1: Number(a[1]) || 0, c2: Number(a[2]) || 0, dlc: true })]);
});

cmd('givecar', 'givecar', '/givecar [id] [модель] [цвет1] [цвет2]', function (p, a, u) {
    const t = find(a[0]);
    if (!need(p, t && a[1], u)) return;
    p.call('adm:vehCheck', [JSON.stringify({ model: a[1].toLowerCase(), c1: Number(a[2]) || 0, c2: Number(a[3]) || 0, dlc: true, target: t.id, own: true })]);
});

cmd('adddlc', 'adddlc', '/adddlc [модель] [название]', function (p, a, u) {
    if (!a[0]) return msg(p, u);
    const model = a[0].toLowerCase();
    dlc = dlc.filter(function (x) { return x.model !== model; });
    dlc.push({ model: model, name: a.slice(1).join(' ') || model });
    writeJson(DLC_FILE, dlc);
    msg(p, 'DLC-машина добавлена в панель: ' + model, '#8fd14f');
});

mp.events.addCommand('dlclist', function (p) {
    if (!can(p, 'veh')) return deny(p);
    if (!dlc.length) return msg(p, 'Список DLC пуст. Добавь: /adddlc [модель] [название]');
    msg(p, 'DLC: ' + dlc.map(function (x) { return x.model; }).join(', '), '#7fd4ff');
});

cmd('dv', 'dv', '/dv', function (p) {
    let v = p.vehicle;
    if (!v) {
        let best = null;
        let bd = 6;
        mp.vehicles.forEach(function (x) {
            const d = x.dist(p.position);
            if (d < bd) { bd = d; best = x; }
        });
        v = best;
    }
    if (!v) return msg(p, 'Рядом нет машины');
    v.destroy();
    msg(p, 'Машина удалена', '#8fd14f');
    log(p, 'dv', '-', '');
});

cmd('dvall', 'dvall', '/dvall', function (p) {
    const n = adminVehs.length;
    adminVehs.splice(0).forEach(function (v) { if (mp.vehicles.exists(v)) v.destroy(); });
    msg(p, 'Удалено админ-машин: ' + n, '#8fd14f');
    log(p, 'dvall', '-', String(n));
});


cmd('weather', 'weather', '/weather [CLEAR/RAIN/THUNDER/FOGGY/SNOW/EXTRASUNNY]', function (p, a, u) {
    if (!a[0]) return msg(p, u);
    mp.world.weather = a[0].toUpperCase();
    staff(login(p) + ' сменил погоду: ' + a[0].toUpperCase());
});

cmd('time', 'time', '/time [0-23]', function (p, a, u) {
    const h = Number(a[0]);
    if (isNaN(h)) return msg(p, u);
    mp.world.time.set(h, 0, 0);
    staff(login(p) + ' установил время ' + h + ':00');
});

cmd('ann', 'mp', '/ann [текст] (МП-объявление 4+)', function (p, a, u, full) {
    if (!full.trim()) return msg(p, u);
    mp.players.broadcast('!{#c13dff}[ОБЪЯВЛЕНИЕ] !{#ffffff}' + full.trim());
    mp.players.call('adm:announce', [full.trim(), login(p)]);
    log(p, 'announce', '-', full.trim());
});

cmd('givemoney', 'givemoney', '/givemoney [id] [сумма]', function (p, a, u) {
    const t = find(a[0]);
    const sum = Math.floor(Number(a[1]));
    if (!need(p, t && acc(t) && !isNaN(sum), u)) return;
    addMoney(t, sum);
    msg(t, 'Начислено: $' + sum, '#8fd14f');
    msg(p, 'Выдано $' + sum + ' игроку ' + login(t), '#8fd14f');
    log(p, 'givemoney', login(t), '$' + sum);
});


cmd('setadmin', 'setadmin', '/setadmin [id, логин или static] [0-9]', async function (p, a, u) {
    const n = Number(a[1]);
    if (!a[0] || isNaN(n) || n < 0 || n > MAX) {
        msg(p, u);
        RANKS.forEach(function (r, i) { p.outputChatBox('!{' + rankColor(i) + '}' + i + ' — ' + r); });
        return;
    }
    const t = find(a[0]);
    let cur = t ? realLvl(t) : 0;
    if (!t) { const r = await q('SELECT admin FROM accounts WHERE username = ? OR login = ? OR nick = ? OR nick = ? OR id = ? LIMIT 1', [a[0], a[0], a[0], a[0].replace(/_/g, ' '), Number(a[0]) || 0]); if (!r.length) return msg(p, 'Аккаунт не найден', '#e05555'); cur = Number(r[0].admin) || 0; }
    const why = setAdminRule(p, cur, n);
    if (why) return msg(p, why, '#e05555');
    if (t && acc(t)) {
        acc(t).admin = n;
        msg(t, 'Ваш статус: ' + rankName(n), '#c13dff');
        q('UPDATE accounts SET admin = ? WHERE id = ?', [n, acc(t).id]);
    } else {
        q('UPDATE accounts SET admin = ? WHERE username = ? OR login = ? OR nick = ? OR nick = ? OR id = ?', [n, a[0], a[0], a[0], a[0].replace(/_/g, ' '), Number(a[0]) || 0]);
    }
    const name = t ? login(t) : a[0];
    staff(login(p) + ' назначил ' + name + ' → ' + rankName(n));
    log(p, 'setadmin', name, rankName(n));
});

global.AdminSystem = {
    lvl: lvl,
    realLvl: realLvl,
    jobOff: function (j) { return global.AdminCore ? global.AdminCore.jobOff(j) : false; },
    factionOff: function (f) { return global.AdminCore ? global.AdminCore.factionOff(f) : false; },
    licBlocked: function (p, t) { return global.AdminCore ? global.AdminCore.licBlocked(p, t) : 0; },
    rankName: rankName,
    can: can,
    log: log,
    ban: doBan,
    isMuted: function (p) { return !!(muted[p.id] && Date.now() < muted[p.id]); }
};

global.AdminCore = {
    q: q, acc: acc, lvl: lvl, realLvl: realLvl, can: can, whyNot: whyNot, login: login, msg: msg, deny: deny, find: find, staff: staff, log: log, logs: logs,
    canTouch: canTouch, rankName: rankName, rankColor: rankColor, SHORT: SHORT, RANKS: RANKS, MAX: MAX, PERM: PERM, toast: toast, sendPanel: sendPanel,
    doBan: doBan, doUnban: doUnban, doKick: doKick, doMute: doMute, doHeal: doHeal, doFreeze: doFreeze, tpTo: tpTo, spawnVeh: spawnVeh,
    moneyOf: moneyOf, addMoney: addMoney, getBans: function () { return bans; }, muted: muted, frozen: frozen, adminVehs: adminVehs, dlc: function () { return dlc; },
    runCmd: runCmd, parseDuration: parseDuration, durationText: durationText, maxBan: maxBan, cmd: cmd, need: need, setAdminRule: setAdminRule, loadAcc: loadAcc,
    locks: locks, FEATURE_NAMES: FEATURE_NAMES, saveLocks: function () { writeJson(LOCK_FILE, locks); }, readJson: readJson, writeJson: writeJson, dir: __dirname
};
try { require('./admin_ext.js'); } catch (e) { console.log('[admin] admin_ext.js: ' + e.message); }
try { require('./dlc.js'); } catch (e) { console.log('[admin] dlc.js: ' + e.message); }

console.log('[admin] загружено: ' + RANKS.length + ' рангов, банов: ' + bans.filter(activeBan).length + ', машин в DLC-списке панели: ' + dlc.length);

module.exports = global.AdminSystem;