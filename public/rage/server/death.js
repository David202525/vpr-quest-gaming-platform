let db = null;
try { db = require('../database'); } catch (e) {
    try { db = require('./database'); } catch (e2) { db = null; }
}

let admin = null;
try { admin = require('./admin'); } catch (e) { admin = null; }

function ensure(p) {
    if (p && !p.account && p.admAcc) p.account = p.admAcc;
    return p && p.account;
}

function adminLvl(p) {
    if (admin && typeof admin.lvl === 'function') return admin.lvl(p);
    return p && p.account ? (Number(p.account.admin) || 0) : 0;
}

const BLEED_MS = 120000;
const AUTO_MS = 600000;
const ANIM = ['combat@damage@writhe', 'writhe_loop'];

function lie(p) {
    setTimeout(function () {
        if (!mp.players.exists(p) || !p.account || !p.account.downed) return;
        try { p.playAnimation(ANIM[0], ANIM[1], 2, 1); } catch (e) {}
    }, 400);
}
function medicsOnDuty() {
    return mp.players.toArray().filter(function (x) { return x.account && x.account.medicDuty; }).length;
}
function info(p) {
    if (!mp.players.exists(p) || !p.account) return;
    const E = global.EmsSystem;
    p.call('death:info', [JSON.stringify({ called: !!p.account.downCalled, medics: medicsOnDuty(), left: Math.max(0, BLEED_MS - (Date.now() - p.account.downAt)), coming: E ? E.coming(p) : null, busy: E ? E.busy(p) : '' })]);
}
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
    player.account.downCalled = false;

    player.spawn(new mp.Vector3(pos.x, pos.y, pos.z));
    player.heading = head;
    player.health = 12;
    player.armour = 0;

    player.call('srv:death', [player.account.downReason, BLEED_MS]);
    lie(player);
    setTimeout(function () { info(player); }, 300);

    mp.players.forEach(function (p) {
        if (p === player || !p.account) return;
        if (p.account.medicDuty) return;
        const dx = p.position.x - pos.x;
        const dy = p.position.y - pos.y;
        if (Math.sqrt(dx * dx + dy * dy) < 40) {
            p.outputChatBox('!{#ffcc66}\u0420\u044f\u0434\u043e\u043c \u0442\u044f\u0436\u0435\u043b\u043e\u0440\u0430\u043d\u0435\u043d\u044b\u0439: ' + player.name + ' (ID ' + player.id + ')');
        }
    });

    player.account.downTimer = setTimeout(function () {
        if (mp.players.exists(player) && player.account && player.account.downed) respawn(player);
    }, AUTO_MS);
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

    if (global.EmsSystem) try { global.EmsSystem.afterRespawn(player); } catch (e) { console.log('[death] ems: ' + e.message); }
    mp.events.call('medic:resolved', player);

    if (db) try {
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
    target.account.downCalled = false;
    try { target.stopAnimation(); } catch (e) {}
    target.health = 60;
    target.call('srv:deathEnd');
    target.outputChatBox('!{#8fd14f}\u0412\u0430\u0441 \u043f\u043e\u0434\u043d\u044f\u043b\u0438 \u043d\u0430 \u043d\u043e\u0433\u0438');

    mp.events.call('medic:resolved', target);
    return true;
}

mp.events.addCommand('respawn', function (player) {
    ensure(player);
    if (!player.account || !player.account.downed) {
        player.outputChatBox('!{#ffcc66}\u0412\u044b \u043d\u0435 \u0440\u0430\u043d\u0435\u043d\u044b');
        return;
    }
    const waited = Date.now() - player.account.downAt;
    if (waited < BLEED_MS) {
        player.outputChatBox('!{#ffcc66}\u041f\u043e\u0434\u043e\u0436\u0434\u0438\u0442\u0435 \u0435\u0449\u0451 ' + Math.ceil((BLEED_MS - waited) / 1000) + ' \u0441\u0435\u043a');
        return;
    }
    respawn(player);
});

mp.events.add('playerDeath', function (player) {
    if (!ensure(player)) return;
    if (player.adminGm) { const p = player.position; player.spawn(new mp.Vector3(p.x, p.y, p.z)); player.health = 100; return; }
    if (player.account.downed) {
        const p = player.position;
        player.spawn(new mp.Vector3(p.x, p.y, p.z));
        player.health = 12;
        player.call('srv:death', [player.account.downReason, Math.max(0, BLEED_MS - (Date.now() - player.account.downAt))]);
        lie(player);
        return;
    }
    down(player, '\u0421\u043c\u0435\u0440\u0442\u0435\u043b\u044c\u043d\u043e\u0435 \u0440\u0430\u043d\u0435\u043d\u0438\u0435');
});

mp.events.add('srv:death:call', function (p) {
    ensure(p);
    if (!p.account || !p.account.downed) return;
    if (!p.account.downCalled) {
        p.account.downCalled = true;
        mp.events.call('medic:downed', p, p.account.downReason);
    }
    info(p);
});

mp.events.add('srv:death:hospital', function (p) {
    ensure(p);
    if (!p.account || !p.account.downed) return;
    if (Date.now() - p.account.downAt < BLEED_MS) return info(p);
    const busy = global.EmsSystem ? global.EmsSystem.busy(p) : '';
    if (busy) { p.outputChatBox('!{#ffcc66}' + busy + ' — дождитесь помощи'); return info(p); }
    respawn(p);
});

mp.events.add('srv:death:sync', function (p) {
    ensure(p);
    if (!p.account || !p.account.downed) return;
    p.call('srv:death', [p.account.downReason, Math.max(0, BLEED_MS - (Date.now() - p.account.downAt))]);
    info(p);
});

setInterval(function () {
    mp.players.forEach(function (p) {
        if (p.account && p.account.downed && p.account.downCalled) info(p);
    });
}, 3000);

mp.events.add('playerQuit', function (player) {
    clearTimer(player);
});

const api = { down: down, respawn: respawn, revive: revive, adminLvl: adminLvl, info: info };
global.DeathSystem = api;
module.exports = api;
