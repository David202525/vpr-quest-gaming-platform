const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'spawn_data.json');
const S = Object.assign({ quit: {}, hotel: {}, hotelPos: null }, (function () { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch (e) { return {}; } })());
let dirty = false;
setInterval(function () { if (dirty) { dirty = false; try { fs.writeFileSync(FILE, JSON.stringify(S)); } catch (e) {} } }, 5000);

const LAST_MIN = 15;
const AIRPORT = { x: -1035.7, y: -2731.8, z: 13.7, h: 0 };
const HOTEL_DEF = { x: 313.2, y: -225.8, z: 54.2, h: 160, n: 'Мотель Pink Cage' };
const HOTEL_DAY = 150;
const HOTEL_MAX_DAYS = 14;

function sid(p) { const a = p.account; return a && a.id ? Number(a.id) : 0; }
function hotelPos() { return S.hotelPos || HOTEL_DEF; }
function notify(p, type, text) { if (typeof global.hudNotify === 'function') global.hudNotify(p, type, text); else p.outputChatBox(text); }
function hotelLeft(id) { const u = S.hotel[id]; return u && u > Date.now() ? u - Date.now() : 0; }

function facHome(p) {
    const G = global.GovFaction;
    if (!G || typeof G.home !== 'function') return null;
    try { const h = G.home(p); return h && isFinite(h.x) ? h : null; } catch (e) { return null; }
}
function options(p) {
    const id = sid(p), a = p.account, out = [];
    const q = S.quit[id];
    if (q && Date.now() - q.t < LAST_MIN * 60000 && isFinite(q.x)) {
        out.push({ id: 'last', n: 'Место выхода', d: 'Доступно ещё ' + Math.max(1, Math.ceil((LAST_MIN * 60000 - (Date.now() - q.t)) / 60000)) + ' мин', i: '📍' });
    }
    const home = global.HouseSystem && typeof global.HouseSystem.home === 'function' ? global.HouseSystem.home(p) : null;
    if (home && isFinite(home.x)) out.push({ id: 'home', n: home.n || 'Мой дом', d: home.d || 'Ваша недвижимость', i: home.flat ? '🏢' : '🏠' });
    const fh = facHome(p);
    if (fh) out.push({ id: 'faction', n: 'Фракция · ' + fh.n, d: fh.d, i: '🏛️' });
    const hl = hotelLeft(id);
    if (hl) out.push({ id: 'hotel', n: 'Гостиница', d: hotelPos().n + ' · ещё ' + Math.ceil(hl / 86400000) + ' дн.', i: '🛏️' });
    out.push({ id: 'airport', n: 'Аэропорт', d: 'Международный аэропорт Лос-Сантоса', i: '✈️' });
    return out;
}

function offer(p) {
    const a = p.account;
    if (!a || !a.nick) return false;
    if (global.JailSystem && global.JailSystem.isJailed(p)) return false;
    const list = options(p);
    p.spawnChoices = list.map(function (o) { return o.id; });
    p.call('auth:spawns', [JSON.stringify({ name: String(a.nick).replace(/_/g, ' '), list: list })]);
    return true;
}

function apply(p, choice) {
    const a = p.account, id = sid(p);
    let pos = null, dim = 0;
    if (choice === 'last') { const q = S.quit[id]; if (q && Date.now() - q.t < LAST_MIN * 60000) { pos = q; dim = q.dim || 0; } }
    else if (choice === 'home') { const h = global.HouseSystem && global.HouseSystem.home ? global.HouseSystem.home(p) : null; if (h) { pos = h; dim = h.dim || 0; } }
    else if (choice === 'faction') { const h = facHome(p); if (h) { pos = h; dim = 0; } }
    else if (choice === 'hotel') { if (hotelLeft(id)) { const r = global.HouseSystem ? global.HouseSystem.hotelRoom(p) : null; pos = r || hotelPos(); dim = r ? r.dim : 0; } }
    if (!pos) pos = AIRPORT;
    a.pos_x = pos.x; a.pos_y = pos.y; a.pos_z = pos.z; a.heading = pos.h || 0; a.dimension = dim;
}

mp.events.add('srv:auth:spawn', function (p, choice) {
    if (!p.spawnChoices || !p.account) return;
    choice = String(choice || '');
    if (p.spawnChoices.indexOf(choice) < 0) choice = 'airport';
    p.spawnChoices = null;
    apply(p, choice);
    global.AuthSystem.spawn(p);
});

mp.events.add('playerQuit', function (p) {
    const id = sid(p);
    if (!id || p.spawnChoices || (p.getVariable && p.getVariable('creating'))) return;
    const pos = p.position;
    S.quit[id] = { t: Date.now(), x: pos.x, y: pos.y, z: pos.z, h: p.heading || 0, dim: p.dimension || 0 };
    dirty = true;
});

/* ---------- гостиница ---------- */
mp.events.addCommand('hotel', function (p, full) {
    if (!p.account) return;
    const id = sid(p), h = hotelPos();
    const left = hotelLeft(id);
    const arg = String(full || '').trim();
    if (!arg) return notify(p, 'ok', left ? 'Номер оплачен ещё на ' + Math.ceil(left / 86400000) + ' дн. Продлить: /hotel [дней] · отказаться: /hotel out' : 'Гостиница: ' + h.n + ' · $' + HOTEL_DAY + '/сутки. Снять номер: /hotel [дней] у ресепшена');
    if (arg === 'out') { delete S.hotel[id]; dirty = true; return notify(p, 'warn', 'Вы выселились из гостиницы'); }
    if (Math.hypot(p.position.x - h.x, p.position.y - h.y) > 8) {
        p.call('phone:gps', [h.x, h.y, h.n]);
        return notify(p, 'warn', 'Снять номер можно только у ресепшена — метка на карте');
    }
    const days = Math.floor(Number(arg));
    if (!(days >= 1 && days <= HOTEL_MAX_DAYS)) return notify(p, 'warn', '/hotel [1-' + HOTEL_MAX_DAYS + '] — на сколько суток');
    const cost = days * HOTEL_DAY;
    const M = global.MoneySystem;
    if (!M || M.get(p) < cost) return notify(p, 'error', 'Нужно $' + cost + ' наличными');
    M.add(p, -cost);
    S.hotel[id] = Math.max(Date.now(), S.hotel[id] || 0) + days * 86400000;
    dirty = true;
    notify(p, 'ok', 'Номер оплачен на ' + days + ' дн. (-$' + cost + '). Теперь при входе можно появляться в гостинице');
});
mp.events.add('srv:hotel:rent', function (p, days) {
    const h = hotelPos();
    if (Math.hypot(p.position.x - h.x, p.position.y - h.y) > 8) return;
    days = Math.floor(Number(days));
    if (!(days >= 1 && days <= HOTEL_MAX_DAYS)) return;
    const id = sid(p), cost = days * HOTEL_DAY, M = global.MoneySystem;
    if (!M || M.get(p) < cost) return notify(p, 'error', 'Нужно $' + cost + ' наличными');
    M.add(p, -cost);
    S.hotel[id] = Math.max(Date.now(), S.hotel[id] || 0) + days * 86400000;
    dirty = true;
    p.call('house:menuClose');
    notify(p, 'ok', 'Номер оплачен на ' + days + ' дн. (-$' + cost + '). Нажмите E у входа, чтобы зайти в номер');
});
mp.events.add('srv:hotel:out', function (p) { delete S.hotel[sid(p)]; dirty = true; p.call('house:menuClose'); notify(p, 'warn', 'Вы выселились из гостиницы'); });
mp.events.addCommand('sethotel', function (p) {
    const lv = global.AdminSystem && global.AdminSystem.realLvl ? global.AdminSystem.realLvl(p) : 0;
    if (lv < 7) return;
    S.hotelPos = { x: p.position.x, y: p.position.y, z: p.position.z, h: p.heading || 0, n: (S.hotelPos || HOTEL_DEF).n };
    dirty = true;
    mp.players.forEach(sendHotel);
    p.outputChatBox('!{#8fd14f}Точка входа в гостиницу сохранена');
});
function sendHotel(p) { const h = hotelPos(); p.call('spawn:hotel', [h.x, h.y, h.z, h.n]); }
mp.events.add('playerReady', function (p) { setTimeout(function () { if (mp.players.exists(p)) sendHotel(p); }, 4000); });

global.SpawnSystem = { offer: offer, options: options, hotelLeft: function (p) { return hotelLeft(sid(p)); }, hotelPos: hotelPos, HOTEL_DAY: HOTEL_DAY, HOTEL_MAX: HOTEL_MAX_DAYS };
console.log('[spawn] выбор места появления загружен');
