function moneyOf(p) {
    if (p.account && p.account.money !== undefined) return Number(p.account.money) || 0;
    if (p.admAcc && p.admAcc.money !== undefined) return Number(p.admAcc.money) || 0;
    const v = p.getVariable('money');
    return v !== undefined && v !== null ? Number(v) || 0 : 0;
}

const last = {};

function send(p, force) {
    if (!mp.players.exists(p)) return;
    const data = { money: moneyOf(p), online: mp.players.length, weather: mp.world.weather };
    const key = JSON.stringify(data);
    if (!force && last[p.id] === key) return;
    last[p.id] = key;
    p.call('hud:data', [key]);
}

setInterval(function () {
    mp.players.forEach(function (p) { send(p, false); });
}, 1000);

mp.events.add('srv:hud:sync', function (p) { send(p, true); });
mp.events.add('playerReady', function (p) { setTimeout(function () { send(p, true); }, 1500); });
mp.events.add('playerQuit', function (p) { delete last[p.id]; });

function notify(p, type, text, ms) {
    if (mp.players.exists(p)) p.call('hud:notify', [type, text, ms || 5000]);
}

function quest(p, title, tasks) {
    if (mp.players.exists(p)) p.call('hud:quest', [JSON.stringify({ title: title || '', tasks: tasks || [] })]);
}

global.hudNotify = notify;
global.hudQuest = quest;

mp.events.add('hud:notify', notify);
mp.events.add('hud:quest', function (p, title, tasks) { quest(p, title, tasks); });

mp.events.addCommand('testhud', function (p) {
    notify(p, 'error', 'Вы успешно завершили задание');
    notify(p, 'warn', 'Вы успешно завершили задание');
    notify(p, 'ok', 'Вы успешно завершили задание');
    quest(p, 'Пролог', [
        'Войдите в дом и соберите все необходимые вещи.',
        'Возьмите инструменты и почините двигатель пикапа'
    ]);
});

mp.events.addCommand('questoff', function (p) { quest(p, '', []); });

module.exports = { notify: notify, quest: quest };
