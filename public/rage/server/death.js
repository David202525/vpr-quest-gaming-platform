const db = require('./database');

let admin = null;
try { admin = require('./admin'); } catch (e) { admin = null; }

function adminLvl(p) {
    if (admin && typeof admin.lvl === 'function') return admin.lvl(p);
    return p && p.account ? (Number(p.account.admin) || 0) : 0;
}

const BLEED_MS = 120000;
const HOSPITAL_FEE = 500;

const HOSPITALS = [
    { x: 355.3, y: -596.7, z: 43.3, h: 160 },
    { x: -449.5, y: -340.8, z: 34.5, h: 80 },
    { x: 1839.6, y: 3672.9, z: 34.3, h: 210 },
    { x: -247.7, y: 6331.2, z: 32.4, h: 220 }
];

function nearest(pos) {
    let best = HOSPITALS[0];
    let bd = 1e9;
    HOSPITALS.forEach(function (h) {
        const dx = h.x - pos.x;
        const dy = h.y - pos.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < bd) { bd = d; best = h; }
    });
    return best;
}

function clearTimer(player) {
    if (player && player.account && player.account.downTimer) {
        clearTimeout(player.account.downTimer);
        player.account.downTimer = null;
    }
}

function down(player, reason) {
    if (!player.account || player.account.downed) return;

    const pos = player.position;
    const head = player.heading;

    player.account.downed = true;
    player.account.downReason = reason || '\u0420\u0430\u043d\u0435\u043d\u0438\u0435';
    player.account.downAt = Date.now();

    player.spawn(new mp.Vector3(pos.x, pos.y, pos.z));
    player.heading = head;
    player.health = 12;
    player.armour = 0;

    player.call('srv:death', [player.account.downReason, BLEED_MS]);
    player.outputChatBox('!{#e05555}\u0412\u044b \u0442\u044f\u0436\u0435\u043b\u043e \u0440\u0430\u043d\u0435\u043d\u044b. \u041c\u0435\u0434\u0438\u043a\u0438 \u043e\u043f\u043e\u0432\u0435\u0449\u0435\u043d\u044b. \u0418\u043b\u0438 \u0432\u0432\u0435\u0434\u0438\u0442\u0435 /respawn');

    mp.players.forEach(function (p) {
        if (p === player || !p.account) return;
        if (p.account.medicDuty) return;
        const dx = p.position.x - pos.x;
        const dy = p.position.y - pos.y;
        if (Math.sqrt(dx * dx + dy * dy) < 40) {
            p.outputChatBox('!{#ffcc66}\u0420\u044f\u0434\u043e\u043c \u0442\u044f\u0436\u0435\u043b\u043e\u0440\u0430\u043d\u0435\u043d\u044b\u0439: ' + player.name + ' (ID ' + player.id + ')');
        }
    });

    mp.events.call('medic:downed', player, player.account.downReason);

    player.account.downTimer = setTimeout(function () {
        if (mp.players.exists(player) && player.account && player.account.downed) respawn(player);
    }, BLEED_MS);
}

async function respawn(player) {
    if (!player.account) return;

    clearTimer(player);

    player.account.downed = false;
    player.account.deaths = (player.account.deaths || 0) + 1;

    const money = player.account.money || 0;
    const fee = Math.min(money, HOSPITAL_FEE);
    player.account.money = money - fee;

    const h = nearest(player.position);

    player.spawn(new mp.Vector3(h.x, h.y, h.z));
    player.heading = h.h;
    player.health = 70;
    player.armour = 0;
    player.removeAllWeapons();

    player.call('srv:deathEnd');
    player.outputChatBox('!{#8fd14f}\u0412\u0430\u0441 \u0434\u043e\u0441\u0442\u0430\u0432\u0438\u043b\u0438 \u0432 \u0431\u043e\u043b\u044c\u043d\u0438\u0446\u0443. \u0421\u0447\u0451\u0442 \u0437\u0430 \u043b\u0435\u0447\u0435\u043d\u0438\u0435: !{#ffffff}' + fee + '$');

    mp.events.call('medic:resolved', player);

    try {
        await db.query('UPDATE accounts SET deaths = ?, money = ? WHERE id = ?', [
            player.account.deaths, player.account.money, player.account.id
        ]);
    } catch (e) {
        console.log('[death] save error: ' + e.message);
    }
}

function revive(target) {
    if (!target || !target.account || !target.account.downed) return false;

    clearTimer(target);

    target.account.downed = false;
    target.health = 60;
    target.call('srv:deathEnd');
    target.outputChatBox('!{#8fd14f}\u0412\u0430\u0441 \u043f\u043e\u0434\u043d\u044f\u043b\u0438 \u043d\u0430 \u043d\u043e\u0433\u0438');

    mp.events.call('medic:resolved', target);
    return true;
}

mp.events.addCommand('respawn', function (player) {
    if (!player.account || !player.account.downed) {
        player.outputChatBox('!{#ffcc66}\u0412\u044b \u043d\u0435 \u0440\u0430\u043d\u0435\u043d\u044b');
        return;
    }
    const waited = Date.now() - player.account.downAt;
    if (waited < 15000) {
        player.outputChatBox('!{#ffcc66}\u041f\u043e\u0434\u043e\u0436\u0434\u0438\u0442\u0435 \u0435\u0449\u0451 ' + Math.ceil((15000 - waited) / 1000) + ' \u0441\u0435\u043a');
        return;
    }
    respawn(player);
});

mp.events.add('playerDeath', function (player) {
    if (!player.account) return;
    if (player.account.downed) {
        const p = player.position;
        player.spawn(new mp.Vector3(p.x, p.y, p.z));
        player.health = 12;
        return;
    }
    down(player, '\u0421\u043c\u0435\u0440\u0442\u0435\u043b\u044c\u043d\u043e\u0435 \u0440\u0430\u043d\u0435\u043d\u0438\u0435');
});

mp.events.add('playerQuit', function (player) {
    clearTimer(player);
});

const api = { down: down, respawn: respawn, revive: revive, adminLvl: adminLvl };
global.DeathSystem = api;
module.exports = api;
