let db = null;
try { db = require('./database'); } catch (e) { db = null; }

const RANKS = ['Игрок', 'Модератор', 'Админ', 'Ст. админ', 'Гл. админ', 'Куратор', 'Владелец'];

const memLogs = [];
const muted = {};
const flying = {};

function lvl(player) {
    if (!player || !player.account) return 0;
    return Number(player.account.admin) || 0;
}

function rankName(n) {
    n = Number(n) || 0;
    return RANKS[n] || ('Уровень ' + n);
}

function byId(id) {
    let found = null;
    mp.players.forEach(function (p) { if (p.id === Number(id)) found = p; });
    return found;
}

function login(player) {
    if (player && player.account && player.account.login) return player.account.login;
    return player ? player.name : 'unknown';
}

async function log(admin, action, target, details) {
    const row = {
        admin_login: login(admin),
        action: action,
        target: target || '-',
        details: details || '',
        created_at: new Date().toISOString()
    };
    memLogs.unshift(row);
    if (memLogs.length > 60) memLogs.pop();

    if (!db || typeof db.query !== 'function') return;
    try {
        await db.query(
            'INSERT INTO admin_logs (admin_login, action, target, details) VALUES (?, ?, ?, ?)',
            [row.admin_login, row.action, row.target, row.details]
        );
    } catch (e) {}
}

async function fetchLogs() {
    if (db && typeof db.query === 'function') {
        try {
            const r = await db.query('SELECT admin_login, action, target, details, created_at FROM admin_logs ORDER BY id DESC LIMIT 40');
            if (Array.isArray(r) && r.length) return r;
        } catch (e) {}
    }
    return memLogs;
}

function playerList() {
    const out = [];
    mp.players.forEach(function (p) {
        if (!p.account) return;
        out.push({
            id: p.id,
            name: p.account.login || p.name,
            admin: Number(p.account.admin) || 0,
            rank: rankName(p.account.admin),
            hp: Math.round(p.health),
            money: Number(p.account.money) || 0
        });
    });
    return out;
}

async function sendPanel(player) {
    const logs = await fetchLogs();
    const data = {
        level: lvl(player),
        rank: rankName(lvl(player)),
        players: playerList(),
        logs: logs
    };
    player.call('srv:adminData', [JSON.stringify(data)]);
}

mp.events.add('srv:adminOpen', function (player) {
    if (lvl(player) < 1) {
        player.outputChatBox('!{#e05555}Недостаточно прав');
        player.call('srv:adminForceClose');
        return;
    }
    sendPanel(player).catch(function () {
        player.call('srv:adminData', [JSON.stringify({
            level: lvl(player), rank: rankName(lvl(player)), players: playerList(), logs: []
        })]);
    });
});

mp.events.add('srv:adminAct', function (player, action, id, extra) {
    const L = lvl(player);
    if (L < 1) return;

    const t = byId(id);
    if (!t) { player.outputChatBox('!{#e05555}Игрок не найден'); return; }

    const tn = login(t);
    const reason = String(extra || 'нарушение');

    if (action === 'tp' && L >= 2) {
        player.position = new mp.Vector3(t.position.x + 1, t.position.y, t.position.z);
        player.dimension = t.dimension;
        player.outputChatBox('!{#8fd14f}Телепорт к ' + tn);
        log(player, 'tp', tn, '');
    } else if (action === 'bring' && L >= 2) {
        t.position = new mp.Vector3(player.position.x + 1, player.position.y, player.position.z);
        t.dimension = player.dimension;
        t.outputChatBox('!{#ffcc66}Вас телепортировал администратор');
        player.outputChatBox('!{#8fd14f}' + tn + ' телепортирован к вам');
        log(player, 'bring', tn, '');
    } else if (action === 'heal' && L >= 2) {
        t.health = 100;
        t.armour = 100;
        t.outputChatBox('!{#8fd14f}Администратор восстановил вам здоровье');
        player.outputChatBox('!{#8fd14f}' + tn + ' вылечен');
        log(player, 'heal', tn, '');
    } else if (action === 'mute' && L >= 1) {
        muted[t.id] = Date.now() + 10 * 60 * 1000;
        t.outputChatBox('!{#e05555}Вы получили мут на 10 минут');
        player.outputChatBox('!{#ffcc66}' + tn + ' замучен на 10 минут');
        log(player, 'mute', tn, '10 мин');
    } else if (action === 'kick' && L >= 2) {
        log(player, 'kick', tn, reason);
        mp.players.broadcast('!{#e05555}[АДМИН] !{#ffffff}' + tn + ' кикнут — ' + reason);
        t.kick(reason);
    } else if (action === 'ban' && L >= 3) {
        log(player, 'ban', tn, reason);
        if (db && typeof db.query === 'function' && t.account) {
            db.query('UPDATE accounts SET banned = 1, ban_reason = ? WHERE id = ?', [reason, t.account.id]).catch(function () {});
        }
        mp.players.broadcast('!{#e05555}[АДМИН] !{#ffffff}' + tn + ' забанен — ' + reason);
        t.kick('Бан: ' + reason);
    } else {
        player.outputChatBox('!{#e05555}Недостаточно прав для этого действия');
    }
});

mp.events.add('srv:flyState', function (player, on) {
    if (lvl(player) < 2) return;
    flying[player.id] = !!on;
    if (on) log(player, 'fly', login(player), 'вкл');
});

mp.events.add('srv:flyLand', function (player, x, y, z) {
    if (lvl(player) < 2) return;
    flying[player.id] = false;
    player.position = new mp.Vector3(Number(x), Number(y), Number(z));
});

mp.events.add('playerQuit', function (player) {
    delete muted[player.id];
    delete flying[player.id];
});

mp.events.add('playerChat', function (player, text) {
    if (muted[player.id] && Date.now() < muted[player.id]) {
        player.outputChatBox('!{#e05555}Вы в муте');
        return;
    }
    mp.players.broadcast('!{#ffffff}' + login(player) + ' [' + player.id + ']: ' + text);
});

mp.events.addCommand('a', function (player, text) {
    if (lvl(player) < 1) return;
    if (!text) { player.outputChatBox('!{#ffcc66}/a [текст]'); return; }
    mp.players.forEach(function (p) {
        if (lvl(p) >= 1) p.outputChatBox('!{#f0447f}[A] ' + login(player) + ': !{#ffffff}' + text);
    });
});

mp.events.addCommand('kick', function (player, full) {
    if (lvl(player) < 2) { player.outputChatBox('!{#e05555}Недостаточно прав'); return; }
    const a = String(full || '').split(' ');
    const t = byId(a[0]);
    if (!t) { player.outputChatBox('!{#ffcc66}/kick [id] [причина]'); return; }
    const reason = a.slice(1).join(' ') || 'нарушение';
    log(player, 'kick', login(t), reason);
    mp.players.broadcast('!{#e05555}[АДМИН] !{#ffffff}' + login(t) + ' кикнут — ' + reason);
    t.kick(reason);
});

mp.events.addCommand('ban', function (player, full) {
    if (lvl(player) < 3) { player.outputChatBox('!{#e05555}Недостаточно прав'); return; }
    const a = String(full || '').split(' ');
    const t = byId(a[0]);
    if (!t) { player.outputChatBox('!{#ffcc66}/ban [id] [причина]'); return; }
    const reason = a.slice(1).join(' ') || 'нарушение';
    log(player, 'ban', login(t), reason);
    if (db && typeof db.query === 'function' && t.account) {
        db.query('UPDATE accounts SET banned = 1, ban_reason = ? WHERE id = ?', [reason, t.account.id]).catch(function () {});
    }
    mp.players.broadcast('!{#e05555}[АДМИН] !{#ffffff}' + login(t) + ' забанен — ' + reason);
    t.kick('Бан: ' + reason);
});

mp.events.addCommand('unban', function (player, arg) {
    if (lvl(player) < 3) { player.outputChatBox('!{#e05555}Недостаточно прав'); return; }
    const lg = String(arg || '').trim();
    if (!lg) { player.outputChatBox('!{#ffcc66}/unban [логин]'); return; }
    if (!db || typeof db.query !== 'function') { player.outputChatBox('!{#e05555}База недоступна'); return; }
    db.query('UPDATE accounts SET banned = 0, ban_reason = NULL WHERE login = ?', [lg])
        .then(function () { player.outputChatBox('!{#8fd14f}Разбанен: ' + lg); })
        .catch(function () { player.outputChatBox('!{#e05555}Ошибка'); });
    log(player, 'unban', lg, '');
});

mp.events.addCommand('mute', function (player, full) {
    if (lvl(player) < 1) { player.outputChatBox('!{#e05555}Недостаточно прав'); return; }
    const a = String(full || '').split(' ');
    const t = byId(a[0]);
    if (!t) { player.outputChatBox('!{#ffcc66}/mute [id] [минуты]'); return; }
    const min = Math.max(1, Number(a[1]) || 10);
    muted[t.id] = Date.now() + min * 60 * 1000;
    t.outputChatBox('!{#e05555}Вы получили мут на ' + min + ' мин');
    player.outputChatBox('!{#ffcc66}' + login(t) + ' замучен на ' + min + ' мин');
    log(player, 'mute', login(t), min + ' мин');
});

mp.events.addCommand('unmute', function (player, arg) {
    if (lvl(player) < 1) { player.outputChatBox('!{#e05555}Недостаточно прав'); return; }
    const t = byId(arg);
    if (!t) { player.outputChatBox('!{#ffcc66}/unmute [id]'); return; }
    delete muted[t.id];
    t.outputChatBox('!{#8fd14f}Мут снят');
    player.outputChatBox('!{#8fd14f}Мут снят с ' + login(t));
    log(player, 'unmute', login(t), '');
});

mp.events.addCommand('slap', function (player, arg) {
    if (lvl(player) < 1) { player.outputChatBox('!{#e05555}Недостаточно прав'); return; }
    const t = byId(arg);
    if (!t) { player.outputChatBox('!{#ffcc66}/slap [id]'); return; }
    t.position = new mp.Vector3(t.position.x, t.position.y, t.position.z + 4);
    t.health = Math.max(5, t.health - 10);
    t.outputChatBox('!{#ffcc66}Вас шлёпнул администратор');
    log(player, 'slap', login(t), '');
});

mp.events.addCommand('heal', function (player, arg) {
    if (lvl(player) < 2) { player.outputChatBox('!{#e05555}Недостаточно прав'); return; }
    const t = byId(arg) || player;
    t.health = 100;
    t.armour = 100;
    t.outputChatBox('!{#8fd14f}Здоровье восстановлено');
    log(player, 'heal', login(t), '');
});

mp.events.addCommand('tp', function (player, arg) {
    if (lvl(player) < 2) { player.outputChatBox('!{#e05555}Недостаточно прав'); return; }
    const t = byId(arg);
    if (!t) { player.outputChatBox('!{#ffcc66}/tp [id]'); return; }
    player.position = new mp.Vector3(t.position.x + 1, t.position.y, t.position.z);
    player.dimension = t.dimension;
    player.outputChatBox('!{#8fd14f}Телепорт к ' + login(t));
    log(player, 'tp', login(t), '');
});

mp.events.addCommand('bring', function (player, arg) {
    if (lvl(player) < 2) { player.outputChatBox('!{#e05555}Недостаточно прав'); return; }
    const t = byId(arg);
    if (!t) { player.outputChatBox('!{#ffcc66}/bring [id]'); return; }
    t.position = new mp.Vector3(player.position.x + 1, player.position.y, player.position.z);
    t.dimension = player.dimension;
    t.outputChatBox('!{#ffcc66}Вас телепортировал администратор');
    player.outputChatBox('!{#8fd14f}' + login(t) + ' телепортирован к вам');
    log(player, 'bring', login(t), '');
});

mp.events.addCommand('givemoney', function (player, full) {
    if (lvl(player) < 4) { player.outputChatBox('!{#e05555}Недостаточно прав'); return; }
    const a = String(full || '').split(' ');
    const t = byId(a[0]);
    const sum = Number(a[1]);
    if (!t || isNaN(sum)) { player.outputChatBox('!{#ffcc66}/givemoney [id] [сумма]'); return; }
    if (!t.account) return;
    t.account.money = (Number(t.account.money) || 0) + sum;
    if (db && typeof db.query === 'function') {
        db.query('UPDATE accounts SET money = ? WHERE id = ?', [t.account.money, t.account.id]).catch(function () {});
    }
    t.outputChatBox('!{#8fd14f}Начислено: ' + sum + '$');
    player.outputChatBox('!{#8fd14f}Выдано ' + sum + '$ игроку ' + login(t));
    log(player, 'givemoney', login(t), sum + '$');
});

mp.events.addCommand('setadmin', function (player, full) {
    if (lvl(player) < 5) { player.outputChatBox('!{#e05555}Недостаточно прав'); return; }
    const a = String(full || '').split(' ');
    const lg = a[0];
    const n = Number(a[1]);
    if (!lg || isNaN(n) || n < 0 || n > 6) { player.outputChatBox('!{#ffcc66}/setadmin [логин] [0-6]'); return; }

    let target = null;
    mp.players.forEach(function (p) { if (p.account && p.account.login === lg) target = p; });
    if (target) {
        target.account.admin = n;
        target.outputChatBox('!{#8fd14f}Ваш уровень админки: ' + rankName(n));
    }
    if (db && typeof db.query === 'function') {
        db.query('UPDATE accounts SET admin = ? WHERE login = ?', [n, lg]).catch(function () {});
    }
    player.outputChatBox('!{#8fd14f}' + lg + ' → ' + rankName(n));
    log(player, 'setadmin', lg, 'уровень ' + n);
});

mp.events.addCommand('admins', function (player) {
    let n = 0;
    mp.players.forEach(function (p) {
        if (lvl(p) >= 1) { n++; player.outputChatBox('!{#f0447f}' + login(p) + ' [' + p.id + '] — ' + rankName(lvl(p))); }
    });
    if (!n) player.outputChatBox('!{#ffcc66}Администраторов онлайн нет');
});

module.exports = { lvl: lvl, rankName: rankName, log: log, isMuted: function (p) { return !!(muted[p.id] && Date.now() < muted[p.id]); } };
