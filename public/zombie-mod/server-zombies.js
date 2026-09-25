const db = require('./database');
const admin = require('./admin');

const CALM_MS = 30 * 60 * 1000;
const OUTBREAK_MS = 15 * 60 * 1000;

let active = true;
let outbreak = false;
let wave = 1;
let phaseEnd = Date.now() + CALM_MS;

const SAFE = [
    { name: 'Центр города', x: 213, y: -880, z: 30, r: 180 },
    { name: 'Больница', x: 355, y: -590, z: 43, r: 120 },
    { name: 'Полиция', x: 441, y: -981, z: 30, r: 120 },
    { name: 'Автосалон', x: -56, y: -1096, z: 26, r: 90 },
    { name: 'Банк', x: 149, y: -1040, z: 29, r: 80 }
];

function payload() {
    return [active, outbreak, wave, JSON.stringify(SAFE), Math.max(0, phaseEnd - Date.now())];
}

function state(player) {
    player.call('srv:zombieState', payload());
}

function broadcast() {
    mp.players.forEach(function (p) {
        if (p.account) state(p);
    });
}

function switchPhase(force) {
    outbreak = force === undefined ? !outbreak : !!force;
    phaseEnd = Date.now() + (outbreak ? OUTBREAK_MS : CALM_MS);

    if (outbreak) {
        wave = Math.min(20, wave + 1);
        mp.players.broadcast('!{#e05555}[ТРЕВОГА] !{#ffffff}Прорыв заражённых! Волна ' + wave + '. Уходите в безопасные зоны — 15 минут.');
    } else {
        mp.players.broadcast('!{#8fd14f}[ЗОМБИ] !{#ffffff}Прорыв отбит. Улицы относительно спокойны.');
    }

    broadcast();
}

setInterval(function () {
    if (!active) return;
    if (Date.now() >= phaseEnd) switchPhase();
}, 5000);

setInterval(function () {
    if (active) broadcast();
}, 10000);

setInterval(function () {
    if (!active || outbreak) return;
    const left = Math.round((phaseEnd - Date.now()) / 60000);
    if (left === 5 || left === 1) {
        mp.players.broadcast('!{#ffcc66}[ЗОМБИ] !{#ffffff}До прорыва заражённых ' + left + ' мин.');
    }
}, 60000);

mp.events.addCommand('zombies', function (player, arg) {
    if (admin.lvl(player) < 3) {
        player.outputChatBox('!{#e05555}Недостаточно прав');
        return;
    }

    active = String(arg).trim() === 'on';
    outbreak = false;
    phaseEnd = Date.now() + CALM_MS;
    broadcast();

    mp.players.broadcast(active
        ? '!{#8fd14f}[ЗОМБИ] !{#ffffff}Заражение активно'
        : '!{#8fd14f}[ЗОМБИ] !{#ffffff}Заражение остановлено');
});

mp.events.addCommand('zoutbreak', function (player) {
    if (admin.lvl(player) < 3) {
        player.outputChatBox('!{#e05555}Недостаточно прав');
        return;
    }
    switchPhase(!outbreak);
});

mp.events.addCommand('zwave', function (player, n) {
    if (admin.lvl(player) < 3) {
        player.outputChatBox('!{#e05555}Недостаточно прав');
        return;
    }
    wave = Math.min(20, Math.max(1, Number(n) || wave + 1));
    broadcast();
    mp.players.broadcast('!{#8fd14f}[ЗОМБИ] !{#ffffff}Волна ' + wave);
});

mp.events.addCommand('zsafe', function (player, arg) {
    if (admin.lvl(player) < 3) {
        player.outputChatBox('!{#e05555}Недостаточно прав');
        return;
    }

    const p = player.position;
    const r = Math.min(500, Math.max(40, Number(arg) || 120));
    SAFE.push({ name: 'Зона ' + (SAFE.length + 1), x: p.x, y: p.y, z: p.z, r: r });
    broadcast();

    player.outputChatBox('!{#8fd14f}Безопасная зона создана, радиус ' + r + ' м');
});

mp.events.addCommand('zdelsafe', function (player, arg) {
    if (admin.lvl(player) < 3) {
        player.outputChatBox('!{#e05555}Недостаточно прав');
        return;
    }

    const i = Number(arg) - 1;
    if (isNaN(i) || i < 0 || i >= SAFE.length) {
        player.outputChatBox('!{#ffcc66}/zdelsafe [1-' + SAFE.length + ']');
        return;
    }
    const gone = SAFE.splice(i, 1)[0];
    broadcast();
    player.outputChatBox('!{#8fd14f}Зона удалена: ' + gone.name);
});

mp.events.addCommand('zlistsafe', function (player) {
    player.outputChatBox('!{#8fd14f}Безопасные зоны:');
    SAFE.forEach(function (s, i) {
        player.outputChatBox('!{#ffffff}' + (i + 1) + '. ' + s.name + ' — радиус ' + Math.round(s.r) + ' м');
    });
});

mp.events.addCommand('zstatus', function (player) {
    const left = Math.max(0, Math.round((phaseEnd - Date.now()) / 60000));
    player.outputChatBox('!{#8fd14f}Фаза: !{#ffffff}' + (outbreak ? 'ПРОРЫВ' : 'затишье') + ' !{#8fd14f}| волна ' + wave + ' | осталось ' + left + ' мин');
    if (player.account) {
        player.outputChatBox('!{#8fd14f}Ваш счёт: !{#ffffff}' + (player.account.zombie_kills || 0) + ' убийств, ' + (player.account.deaths || 0) + ' смертей');
    }
});

mp.events.addCommand('zdebug', function (player) {
    if (admin.lvl(player) < 3) {
        player.outputChatBox('!{#e05555}Недостаточно прав');
        return;
    }
    player.call('srv:zombieDebug');
});

mp.events.add('srv:zombieKill', async function (player) {
    if (!active || !player.account) return;

    player.account.zombie_kills = (player.account.zombie_kills || 0) + 1;
    const reward = (outbreak ? 60 : 25) + wave * 10;
    player.account.money += reward;

    player.call('srv:zombieKillFx', [reward, player.account.zombie_kills]);

    if (player.account.zombie_kills % 5 === 0) {
        await db.query('UPDATE accounts SET zombie_kills = ?, money = ? WHERE id = ?', [
            player.account.zombie_kills, player.account.money, player.account.id
        ]);
    }
});

mp.events.add('srv:zombieHit', function (player, dmg) {
    if (!active || !player.account || player.account.downed) return;

    const d = Math.min(25, Math.max(1, Number(dmg) || 5));
    const hp = player.health - d;

    if (hp <= 0) {
        require('./death').down(player, 'Загрызли заражённые');
    } else {
        player.health = hp;
    }
});

mp.events.add('playerJoin', function (player) {
    setTimeout(function () {
        state(player);
    }, 3000);
});

module.exports = {
    isActive: function () { return active; },
    isOutbreak: function () { return outbreak; },
    safeZones: function () { return SAFE; }
};
