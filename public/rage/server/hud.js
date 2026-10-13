let db = null;
try { db = require('../database'); } catch (e) {
    try { db = require('./database'); } catch (e2) { db = null; }
}

function has(v) { return v !== undefined && v !== null && v !== '' && !isNaN(Number(v)); }
function accIdOf(p) {
    const a = p.account || p.admAcc;
    return a && a.id ? a.id : null;
}

async function syncFromDb(p) {
    const id = accIdOf(p);
    if (!db || !id || p.hudMoneySynced) return;
    p.hudMoneySynced = true;
    try {
        const res = await db.query('SELECT money, bank FROM accounts WHERE id = ? LIMIT 1', [id]);
        const rows = Array.isArray(res) && Array.isArray(res[0]) ? res[0] : res;
        const r = rows && rows[0];
        if (!r || !mp.players.exists(p)) return;
        const m = Number(r.money) || 0;
        if (p.account && !has(p.account.money)) p.account.money = m;
        if (p.account && !has(p.account.bank)) p.account.bank = Number(r.bank) || 0;
        if (p.admAcc && !has(p.admAcc.money)) p.admAcc.money = m;
        if (p.account && Number(p.account.money) === 0 && m > 0) p.account.money = m;
        if (p.admAcc && Number(p.admAcc.money) === 0 && m > 0) p.admAcc.money = m;
        send(p, true);
    } catch (e) {
        p.hudMoneySynced = false;
        console.log('[hud] money: ' + e.message);
    }
}

function moneyOf(p) {
    if (global.MoneySystem) return global.MoneySystem.get(p);
    if (p.account && has(p.account.money)) return Number(p.account.money);
    if (p.admAcc && has(p.admAcc.money)) return Number(p.admAcc.money);
    if (has(p.money)) return Number(p.money);
    if (p.data && has(p.data.money)) return Number(p.data.money);
    const v = p.getVariable('money');
    if (has(v)) return Number(v);
    const c = p.getVariable('cash');
    return has(c) ? Number(c) : 0;
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
    mp.players.forEach(function (p) {
        if (!p.hudMoneySynced && accIdOf(p)) syncFromDb(p);
        send(p, false);
    });
}, 1000);

mp.events.addCommand('mymoney', function (p) {
    const id = accIdOf(p);
    p.outputChatBox('!{#ffc93c}[Деньги] аккаунт: ' + (id || 'не найден') +
        ' | account: ' + (p.account ? p.account.money : '—') +
        ' | admAcc: ' + (p.admAcc ? p.admAcc.money : '—') +
        ' | var: ' + p.getVariable('money') + ' | HUD: ' + moneyOf(p));
    if (db && id) db.query('SELECT money, bank FROM accounts WHERE id = ? LIMIT 1', [id]).then(function (res) {
        const rows = Array.isArray(res) && Array.isArray(res[0]) ? res[0] : res;
        if (rows && rows[0]) p.outputChatBox('!{#ffc93c}[Деньги] в базе: наличные ' + rows[0].money + ', банк ' + rows[0].bank);
    }).catch(function () {});
});

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
if (!global.hudMoney) global.hudMoney = moneyOf;
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
