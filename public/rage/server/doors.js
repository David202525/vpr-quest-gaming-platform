const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'doors_data.json');
const DEF = [
    { f: 'lspd', n: 'Вход в участок (лев.)', m: 320433149, x: 434.75, y: -983.22, z: 30.84 },
    { f: 'lspd', n: 'Вход в участок (прав.)', m: -1215222675, x: 434.75, y: -980.62, z: 30.84 },
    { f: 'lspd', n: 'Служебный коридор', m: 1557126584, x: 449.70, y: -986.47, z: 30.69 },
    { f: 'lspd', n: 'Кабинет капитана', m: -1320876379, x: 446.57, y: -980.01, z: 30.84 },
    { f: 'lspd', n: 'Раздевалка', m: -2023754432, x: 452.62, y: -982.70, z: 30.69 },
    { f: 'lspd', n: 'Оружейная', m: 749848321, x: 453.08, y: -983.69, z: 30.84 },
    { f: 'lspd', n: 'Камеры: вход', m: 631614199, x: 464.57, y: -992.66, z: 25.06 },
    { f: 'lspd', n: 'Камера 1', m: 631614199, x: 461.81, y: -993.31, z: 24.91 },
    { f: 'lspd', n: 'Камера 2', m: 631614199, x: 461.81, y: -998.31, z: 24.91 },
    { f: 'lspd', n: 'Камера 3', m: 631614199, x: 461.81, y: -1001.30, z: 24.91 },
    { f: 'lspd', n: 'Задний выход (лев.)', m: -2023754432, x: 467.37, y: -1014.45, z: 26.54 },
    { f: 'lspd', n: 'Задний выход (прав.)', m: -2023754432, x: 469.97, y: -1014.45, z: 26.54 },
    { f: 'sheriff', n: 'Вход в офис шерифа', m: -1765048490, x: 1855.68, y: 3683.93, z: 34.59 },
    { f: 'medic', n: 'Служебная дверь больницы', m: 854291622, x: 309.13, y: -597.75, z: 43.43 }
];
const DB = (function () { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) || null; } catch (e) { return null; } })() || { list: DEF.map(function (d) { return Object.assign({ l: 1 }, d); }) };
let dirty = false;
setInterval(function () { if (dirty) { dirty = false; fs.writeFile(FILE, JSON.stringify(DB), function () {}); } }, 4000);

const ACCESS = { lspd: ['lspd', 'fib'], sheriff: ['sheriff', 'fib'], fib: ['fib'], army: ['army'], gov: ['gov', 'fib'], medic: ['medic'], news: ['news'], lic: ['lic'] };

function notify(p, t, x) { if (typeof global.hudNotify === 'function') global.hudNotify(p, t, x); else p.outputChatBox(x); }
function admLvl(p) { return global.AdminSystem && global.AdminSystem.realLvl ? global.AdminSystem.realLvl(p) : 0; }
function job(p) { return p.account && p.account.job ? String(p.account.job) : ''; }
function canUse(p, d) {
    if (admLvl(p) >= 3) return true;
    const j = job(p);
    if (!j) return false;
    if (j === d.f) return true;
    const a = ACCESS[d.f];
    if (a && a.indexOf(j) >= 0) return true;
    return !!(global.CrimeSystem && global.CrimeSystem.ORGS && global.CrimeSystem.ORGS[d.f] && j === d.f);
}
function pack() { return JSON.stringify(DB.list.map(function (d, i) { return [i, d.m, d.x, d.y, d.z, d.l ? 1 : 0, d.f, d.n]; })); }
function sendAll() { const j = pack(); mp.players.forEach(function (p) { p.call('doors:all', [j]); }); }
function sendOne(i) { const d = DB.list[i]; mp.players.forEach(function (p) { p.call('doors:set', [i, d.l ? 1 : 0]); }); }
mp.events.add('playerReady', function (p) { setTimeout(function () { if (mp.players.exists(p)) p.call('doors:all', [pack()]); }, 5000); });

const lastUse = {};
mp.events.add('srv:door:toggle', function (p, i) {
    i = Number(i);
    const d = DB.list[i];
    if (!d) return;
    if (Math.hypot(p.position.x - d.x, p.position.y - d.y) > 3.5 || Math.abs(p.position.z - d.z) > 3) return;
    if (!canUse(p, d)) return notify(p, 'error', 'Служебная дверь · ' + d.n + ' — ключа нет');
    if (lastUse[p.id] && Date.now() - lastUse[p.id] < 700) return;
    lastUse[p.id] = Date.now();
    d.l = d.l ? 0 : 1;
    dirty = true;
    sendOne(i);
    try { p.playAnimation('anim@heists@keycard@', 'exit', 8, 48); } catch (e) {}
    notify(p, d.l ? 'warn' : 'ok', (d.l ? '🔒 Закрыто: ' : '🔓 Открыто: ') + d.n);
});

mp.events.addCommand('door', function (p, full) {
    if (admLvl(p) < 5) return notify(p, 'error', 'Доступно с 5 уровня администрации');
    const a = String(full || '').trim().split(/\s+/);
    const cmd = (a[0] || '').toLowerCase();
    if (cmd === 'add') {
        const f = (a[1] || '').toLowerCase();
        const n = a.slice(2).join(' ') || 'Служебная дверь';
        if (!f) return p.outputChatBox('!{#ffcc66}/door add [фракция] [название] — встаньте вплотную к двери');
        p.doorAdd = { f: f, n: n };
        return p.call('doors:scan', []);
    }
    if (cmd === 'del') {
        const i = nearest(p);
        if (i < 0) return notify(p, 'warn', 'Рядом нет служебных дверей');
        const d = DB.list.splice(i, 1)[0];
        dirty = true;
        mp.players.forEach(function (x) { x.call('doors:unlockOne', [d.m, d.x, d.y, d.z]); });
        sendAll();
        return notify(p, 'ok', 'Дверь удалена: ' + d.n);
    }
    if (cmd === 'list') {
        p.outputChatBox('!{#ffcc66}Служебные двери (' + DB.list.length + '):');
        DB.list.forEach(function (d, i) { p.outputChatBox('!{#ffffff}' + i + '. [' + d.f + '] ' + d.n + (d.l ? ' 🔒' : ' 🔓')); });
        return;
    }
    if (cmd === 'reset') {
        DB.list = DEF.map(function (d) { return Object.assign({ l: 1 }, d); });
        dirty = true; sendAll();
        return notify(p, 'ok', 'Двери сброшены по умолчанию');
    }
    p.outputChatBox('!{#ffcc66}/door add [lspd|sheriff|fib|army|gov|medic|news|lic|банда] [название] · /door del · /door list · /door reset');
});
function nearest(p) {
    let best = -1, bd = 3.5;
    DB.list.forEach(function (d, i) { const r = Math.hypot(p.position.x - d.x, p.position.y - d.y); if (r < bd && Math.abs(p.position.z - d.z) < 3) { bd = r; best = i; } });
    return best;
}
mp.events.add('srv:door:found', function (p, m, x, y, z) {
    const a = p.doorAdd;
    p.doorAdd = null;
    if (!a || admLvl(p) < 5) return;
    m = Number(m); x = Number(x); y = Number(y); z = Number(z);
    if (!m || !isFinite(x)) return notify(p, 'error', 'Дверь не найдена — подойдите вплотную');
    if (DB.list.some(function (d) { return d.m === m && Math.hypot(d.x - x, d.y - y) < 0.5; })) return notify(p, 'warn', 'Эта дверь уже добавлена');
    DB.list.push({ f: a.f, n: a.n, m: m, x: x, y: y, z: z, l: 1 });
    dirty = true;
    sendAll();
    notify(p, 'ok', 'Дверь добавлена: ' + a.n + ' (' + a.f + ')');
});

global.DoorSystem = { list: function () { return DB.list; }, canUse: canUse };
console.log('[doors] служебных дверей: ' + DB.list.length);
module.exports = global.DoorSystem;
