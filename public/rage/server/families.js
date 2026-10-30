const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'families.json');
const D = Object.assign({ seq: 1, fams: [], npc: null, hseq: 1, houses: null }, (function () { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch (e) { return {}; } })());
let dirty = false;
function mark() { dirty = true; }
setInterval(function () { if (dirty) { dirty = false; try { fs.writeFileSync(FILE, JSON.stringify(D)); } catch (e) { console.log('[family] save: ' + e.message); } } }, 5000);

const TYPES = {
    family: { n: 'Семья', i: '👨‍👩‍👧', d: 'Мирное объединение друзей и родственников. Общий чат, общак, ранги', price: 150000, slots: 15, ranks: ['Новичок', 'Родственник', 'Брат', 'Старший', 'Глава семьи'] },
    bikers: { n: 'Байкерский клуб', i: '🏍️', d: 'Мотоклуб со своей символикой. Больше мест и рангов', price: 350000, slots: 25, ranks: ['Проспект', 'Член клуба', 'Дорожный капитан', 'Сержант', 'Вице-президент', 'Президент'] },
    syndicate: { n: 'Синдикат', i: '💼', d: 'Крупная организация. Максимум участников и статус в городе', price: 750000, slots: 40, ranks: ['Партнёр', 'Сотрудник', 'Менеджер', 'Директор', 'Совладелец', 'Глава синдиката'] }
};
const COLORS = ['#e5333d', '#ff7a1a', '#f0c82a', '#3fb34f', '#1fbfb0', '#3a8fe0', '#6b5bff', '#9b4fd1', '#e0479e', '#ffffff', '#9aa3b0', '#2b2b2b'];
const REG_TAX = 0.1;

/* экономика репутации */
const REP = { perOnline: 5, everyMin: 30, perDeposit: 10000, rcRate: 1, sellBack: 0.5 };
const PERMS = {
    invite: 'Приглашать в семью', kick: 'Исключать участников', rank: 'Менять ранги',
    cars: 'Добавлять свои машины и настраивать доступ', carcall: 'Вызывать семейный транспорт',
    bank: 'Снимать деньги из общака', house: 'Управлять особняком', log: 'Смотреть журнал'
};
const BASE_GARAGE = 2;
const INTS = {
    hill1: { n: 'Wild Oats', x: -174.32, y: 497.38, z: 137.66, h: 190 },
    hill2: { n: 'North Conker', x: 341.97, y: 437.77, z: 149.39, h: 110 },
    hill3: { n: 'Hillcrest', x: -682.0, y: 592.4, z: 145.4, h: 220 },
    hill4: { n: 'Hillcrest II', x: -758.4, y: 619.0, z: 144.1, h: 110 },
    hill5: { n: 'Milton', x: -572.6, y: 653.1, z: 145.6, h: 180 }
};
const DIM_FH = 70000;
if (!Array.isArray(D.houses)) {
    D.houses = [
        { n: 'Особняк в Рокфорд-Хиллз', x: -817.6, y: 178.0, z: 72.2, h: 110, int: 'hill3', rep: 5000, park: [-811.5, 187.5, 72.5, 110] },
        { n: 'Ранчо на холмах Тонгва', x: 1395.0, y: 1141.0, z: 114.3, h: 90, int: 'hill2', rep: 6500, park: [1408.0, 1118.0, 114.8, 90] },
        { n: 'Винодельня Марлоу', x: -1888.0, y: 2049.0, z: 140.9, h: 160, int: 'hill1', rep: 8000, park: [-1903.0, 2032.0, 140.7, 250] },
        { n: 'Поместье в Ричмане', x: -1536.0, y: 130.0, z: 57.4, h: 300, int: 'hill4', rep: 12000, park: [-1525.0, 98.0, 56.5, 230] }
    ].map(function (h) { return Object.assign({ id: D.hseq++, owner: 0, open: false }, h); });
    mark();
}
const DEF_CAP = [4, 6, 8, 10];
D.houses.forEach(function (h, i) {
    if (h.gar === undefined) { h.gar = h.park ? { x: h.park[0], y: h.park[1], z: h.park[2], h: h.park[3] || 0, cap: DEF_CAP[i] || 6 } : null; delete h.park; mark(); }
});
function garCap(f) { const h = houseOf(f); return h && h.gar ? h.gar.cap : BASE_GARAGE; }

function notify(p, type, text) { if (typeof global.hudNotify === 'function') global.hudNotify(p, type, text); else p.outputChatBox(text); }
function sid(p) { return p && p.account && p.account.id ? Number(p.account.id) : 0; }
function nick(p) { return String((p.account && p.account.nick) || p.name).replace(/_/g, ' '); }
function money(n) { return '$' + String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function num(n) { return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function admLvl(p) { return global.AdminSystem && global.AdminSystem.realLvl ? global.AdminSystem.realLvl(p) : (p.account ? Number(p.account.admin) || 0 : 0); }
function online(id) { return mp.players.toArray().find(function (x) { return sid(x) === Number(id); }) || null; }
function V(x, y, z) { return new mp.Vector3(x, y, z); }
function clean(s, n) { return String(s == null ? '' : s).replace(/[<>!{}\\"'`]/g, '').trim().slice(0, n || 24); }

function norm(f) {
    const L = f.ranks.length;
    if (!f.perms) f.perms = { invite: L - 1, kick: L - 1, rank: L - 1, cars: L - 1, carcall: 1, bank: L, house: L, log: L - 1 };
    Object.keys(PERMS).forEach(function (k) { if (!f.perms[k]) f.perms[k] = L; });
    if (!f.cars) f.cars = [];
    if (!f.log) f.log = [];
    if (f.rep === undefined) f.rep = 0;
    if (!f.dep) f.dep = { net: 0, max: 0 };
    if (!f.cseq) f.cseq = 1;
    return f;
}
D.fams.forEach(norm);

function famById(id) { return D.fams.find(function (f) { return f.id === Number(id); }) || null; }
function famOf(id) { id = Number(id); return D.fams.find(function (f) { return f.members.some(function (m) { return m.id === id; }); }) || null; }
function famP(p) { return famOf(sid(p)); }
function member(f, id) { return f.members.find(function (m) { return m.id === Number(id); }); }
function isHead(f, id) { return f.owner === Number(id); }
function myR(f, id) { const m = member(f, id); return m ? m.r : 0; }
function can(f, id, k) { return isHead(f, id) || myR(f, id) >= (f.perms[k] || f.ranks.length); }
function rankN(f, r) { return f.ranks[Math.max(1, Math.min(f.ranks.length, r)) - 1]; }
function toFam(f, t) { f.members.forEach(function (m) { const x = online(m.id); if (x) x.outputChatBox(t); }); }
function famChat(f, t) { toFam(f, '!{' + f.c + '}[' + f.tag + '] !{#ffffff}' + t); }
function flog(f, cat, t) { f.log.unshift({ t: Date.now(), k: cat, x: t }); if (f.log.length > 200) f.log.length = 200; mark(); }
function houseOf(f) { return D.houses.find(function (h) { return h.owner === f.id; }) || null; }
function syncP(p) { const f = famP(p); const v = f ? f.tag + '|' + f.c : ''; if ((p.getVariable('fam') || '') !== v) p.setVariable('fam', v); }
setInterval(function () { mp.players.forEach(function (p) { if (p.account) syncP(p); }); }, 4000);

function addRep(f, n, why) { n = Math.floor(n); if (!n) return; f.rep = Math.max(0, f.rep + n); if (why) flog(f, 'rep', (n > 0 ? '+' : '') + n + ' репутации: ' + why); mark(); }
setInterval(function () {
    D.fams.forEach(function (f) {
        const on = f.members.filter(function (m) { return online(m.id); }).length;
        if (on) { f.rep += on * REP.perOnline; mark(); }
    });
}, REP.everyMin * 60000);

/* ---------- NPC в мэрии ---------- */
function cityDim() { return global.HouseSystem && global.HouseSystem.facDim ? global.HouseSystem.facDim('gov') : -1; }
function npcPos() { return D.npc || [-549.75, -189.29, 38.22, 26]; }
let ped = null;
function spawnNpc() {
    try { if (ped && mp.peds.exists(ped)) ped.destroy(); } catch (e) {}
    const c = npcPos(), d = cityDim();
    if (d < 0) return;
    try { ped = mp.peds.new(mp.joaat('a_m_y_business_03'), V(c[0], c[1], c[2]), { dynamic: false, frozen: true, invincible: true, heading: c[3] || 0, dimension: d }); } catch (e) { ped = null; }
}
function sendNpc(p) { p.call('fam:npc', [JSON.stringify({ p: npcPos(), d: cityDim() })]); }
function sendHouses(p) {
    p.call('fam:houses', [JSON.stringify(D.houses.map(function (h) { const f = h.owner ? famById(h.owner) : null; return [h.id, h.n, h.x, h.y, h.z, f ? f.tag : '', f ? f.c : '', f ? f.n : '']; }))]);
}
function sendHousesAll() { mp.players.forEach(sendHouses); mp.players.forEach(sendGarages); }
function sendGarages(p) {
    const f = p.account ? famP(p) : null;
    p.call('fam:garages', [JSON.stringify(D.houses.filter(function (h) { return h.gar && h.owner && f && h.owner === f.id; }).map(function (h) { return [h.id, h.gar.x, h.gar.y, h.gar.z, h.gar.cap]; }))]);
}
setTimeout(function () { spawnNpc(); mp.players.forEach(function (p) { sendNpc(p); sendHouses(p); }); }, 6000);
mp.events.add('playerReady', function (p) { setTimeout(function () { if (mp.players.exists(p)) { sendNpc(p); sendHouses(p); sendGarages(p); syncP(p); } }, 6000); });
function nearNpc(p) { const c = npcPos(); return p.dimension === cityDim() && Math.hypot(p.position.x - c[0], p.position.y - c[1]) < 3.5 && Math.abs(p.position.z - c[2]) < 4; }

/* ---------- данные для окна ---------- */
function regView(p) {
    const MS = global.MoneySystem;
    return { mode: 'reg', cash: MS ? MS.get(p) : 0, bank: MS ? MS.bank(p) : 0, colors: COLORS, tax: REG_TAX,
        types: Object.keys(TYPES).map(function (k) { const t = TYPES[k]; return { k: k, n: t.n, i: t.i, d: t.d, price: t.price, slots: t.slots, ranks: t.ranks.length }; }),
        pass: !(global.UiSystem && global.UiSystem.hasDoc) || !!global.UiSystem.hasDoc(p, 'passport') };
}
function tabView(p) {
    const f = famP(p), me = sid(p), T = TYPES[f.type], h = houseOf(f), MS = global.MoneySystem, U = global.UiSystem;
    const my = {}; Object.keys(PERMS).forEach(function (k) { my[k] = can(f, me, k); });
    return {
        mode: 'tab', me: me, head: isHead(f, me), myR: myR(f, me), my: my, cash: MS ? MS.get(p) : 0, coins: U && U.coinsOf ? U.coinsOf(p) : 0,
        f: { n: f.n, tag: f.tag, c: f.c, type: T.n, ti: T.i, slots: T.slots, carMax: garCap(f), baseGar: BASE_GARAGE, bank: f.bank, rep: f.rep, created: f.created, ownerN: f.ownerN, ranks: f.ranks, perms: f.perms },
        permNames: PERMS, rep: REP,
        members: f.members.slice().sort(function (a, b) { return b.r - a.r; }).map(function (m) { return { id: m.id, n: m.n, r: m.r, on: !!online(m.id), head: isHead(f, m.id), j: m.j || 0 }; }),
        cars: f.cars.map(function (c) { const v = live[f.id + ':' + c.id]; return { id: c.id, m: c.m, n: c.n, plate: c.plate, minR: c.minR, out: !!(v && mp.vehicles.exists(v)), by: v && mp.vehicles.exists(v) ? (v.famBy || '') : '', own: c.ownN || '', mine: c.own === me }; }),
        house: h ? { id: h.id, n: h.n, int: INTS[h.int] ? INTS[h.int].n : '', open: !!h.open, rep: h.rep, cap: h.gar ? h.gar.cap : 0 } : null,
        houses: D.houses.map(function (x) { const o = x.owner ? famById(x.owner) : null; return { id: x.id, n: x.n, int: INTS[x.int] ? INTS[x.int].n : '', cap: x.gar ? x.gar.cap : 0, rep: x.rep, own: o ? '[' + o.tag + '] ' + o.n : '', mine: x.owner === f.id }; }),
        log: my.log ? f.log.slice(0, 120) : []
    };
}
function openTab(p) { if (famP(p)) p.call('fam:open', [JSON.stringify(tabView(p))]); }
function refresh(f) { f.members.forEach(function (m) { const x = online(m.id); if (x && x.famTab) openTab(x); }); }
function msg(p, t, ok) { p.call('fam:msg', [String(t), ok ? 1 : 0]); }

mp.events.add('srv:fam:open', function (p) {
    if (!p.account || !nearNpc(p)) return;
    if (famP(p)) { p.famTab = true; return openTab(p); }
    p.call('fam:open', [JSON.stringify(regView(p))]);
});
mp.events.add('srv:fam:tab', function (p) {
    if (!famP(p)) return notify(p, 'warn', 'Вы не состоите в семье. Создать — у регистратора в мэрии');
    p.famTab = true; openTab(p);
});
mp.events.add('srv:fam:closed', function (p) { p.famTab = false; });

/* ---------- регистрация ---------- */
mp.events.add('srv:fam:create', function (p, json) {
    if (!p.account || !nearNpc(p)) return;
    let a = {}; try { a = JSON.parse(json); } catch (e) { return; }
    const t = TYPES[a.type];
    const name = String(a.n || '').replace(/[<>!{}\\]/g, '').trim();
    const tag = String(a.tag || '').toUpperCase().replace(/[^A-ZА-ЯЁ0-9]/g, '');
    const c = COLORS.indexOf(a.c) >= 0 ? a.c : null;
    if (!t) return msg(p, 'Выберите тип организации');
    if (famP(p)) return msg(p, 'Вы уже состоите в семье. Сначала выйдите из неё');
    if (p.account.job && global.CrimeSystem && global.CrimeSystem.ORGS[p.account.job]) return msg(p, 'Участники банд и мафий не могут создавать семьи');
    if (name.length < 3 || name.length > 24) return msg(p, 'Название: от 3 до 24 символов');
    if (tag.length < 2 || tag.length > 4) return msg(p, 'Тег: от 2 до 4 букв или цифр');
    if (!c) return msg(p, 'Выберите цвет');
    if (D.fams.some(function (f) { return f.n.toLowerCase() === name.toLowerCase(); })) return msg(p, 'Такое название уже занято');
    if (D.fams.some(function (f) { return f.tag === tag; })) return msg(p, 'Тег [' + tag + '] уже занят');
    if (global.UiSystem && global.UiSystem.hasDoc && !global.UiSystem.hasDoc(p, 'passport')) return msg(p, 'Нужен паспорт. Оформите его у паспортного стола');
    const MS = global.MoneySystem; if (!MS) return msg(p, 'Касса недоступна');
    const fee = t.price + Math.round(t.price * REG_TAX);
    const cash = MS.get(p), bank = MS.bank(p);
    if (cash + bank < fee) return msg(p, 'Недостаточно средств: нужно ' + money(fee));
    const fromBank = Math.min(bank, fee);
    MS.set(p, cash - (fee - fromBank), bank - fromBank, 'family');
    if (global.GovSystem && global.GovSystem.add) try { global.GovSystem.add(fee, 'Регистрация организации «' + name + '»: ' + nick(p)); } catch (e) {}
    const f = norm({ id: D.seq++, n: name, tag: tag, c: c, type: a.type, owner: sid(p), ownerN: nick(p), bank: 0, created: Date.now(), ranks: t.ranks.slice(), members: [{ id: sid(p), n: nick(p), r: t.ranks.length, j: Date.now() }], log: [] });
    D.fams.push(f);
    flog(f, 'mem', nick(p) + ' зарегистрировал организацию');
    mark(); syncP(p);
    mp.players.forEach(function (x) { x.outputChatBox('!{' + c + '}[' + tag + '] !{#ffffff}В мэрии зарегистрирована новая организация: !{' + c + '}' + name + ' !{#aaaaaa}(' + t.n + ')'); });
    notify(p, 'ok', 'Организация «' + name + '» зарегистрирована! Планшет семьи — клавиша O или /ftab');
    p.famTab = true; openTab(p);
});

/* ---------- приглашения ---------- */
function invite(p, f, t) {
    if (!t || !t.account || t === p) return 'Игрок не найден';
    if (t.position.subtract(p.position).length() > 8) return 'Игрок должен быть рядом';
    if (famP(t)) return 'Игрок уже в семье';
    if (f.members.length >= TYPES[f.type].slots) return 'Все места заняты (' + TYPES[f.type].slots + ')';
    t.famInvite = { f: f.id, by: nick(p), at: Date.now() };
    t.call('social:offer', [nick(p) + ' зовёт вас в «' + f.n + '» [' + f.tag + ']', 30000]);
    t.outputChatBox('!{' + f.c + '}[' + f.tag + '] !{#ffffff}' + nick(p) + ' зовёт вас в «' + f.n + '». Принять: Y или !{#8fd14f}/faccept2');
    return null;
}
function acceptFam(t) {
    const o = t.famInvite;
    if (!o || Date.now() - o.at > 60000) return false;
    t.famInvite = null;
    const f = famById(o.f);
    if (!f || famP(t)) return true;
    if (f.members.length >= TYPES[f.type].slots) { notify(t, 'warn', 'Мест больше нет'); return true; }
    f.members.push({ id: sid(t), n: nick(t), r: 1, j: Date.now() });
    flog(f, 'mem', nick(t) + ' вступил (пригласил ' + o.by + ')'); syncP(t);
    famChat(f, nick(t) + ' вступил в семью');
    notify(t, 'ok', 'Вы вступили в «' + f.n + '». Планшет семьи — O или /ftab');
    refresh(f);
    return true;
}
mp.events.add('srv:int:answer', function (t, yes) {
    if (!t.famInvite || Date.now() - t.famInvite.at > 60000) return;
    if (!yes) { t.famInvite = null; return; }
    acceptFam(t);
});
mp.events.addCommand('faccept2', function (t) { if (!acceptFam(t)) notify(t, 'warn', 'Приглашений нет'); });
mp.events.addCommand('finv', function (p, full) {
    const f = famP(p);
    if (!f || !can(f, sid(p), 'invite')) return notify(p, 'warn', 'Нет права приглашать');
    const e = invite(p, f, mp.players.at(Number(String(full || '').trim())));
    notify(p, e ? 'warn' : 'ok', e || 'Приглашение отправлено');
});

/* ---------- транспорт ---------- */
const live = {};
const callCd = {};
function carKey(f, c) { return f.id + ':' + c.id; }
function hexRgb(h) { const n = parseInt(String(h).slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function spawnPoint(f, p) {
    const h = houseOf(f);
    if (h && h.gar) {
        const g = h.gar, a0 = (g.h || 0) * Math.PI / 180;
        for (let i = 0; i < 6; i++) {
            const x = g.x + Math.cos(a0) * 3.2 * i, y = g.y + Math.sin(a0) * 3.2 * i;
            const busy = mp.vehicles.toArray().some(function (v) { return v.dimension === 0 && Math.hypot(v.position.x - x, v.position.y - y) < 2.6; });
            if (!busy) return { x: x, y: y, z: g.z, h: g.h || 0, at: 'в гараже особняка' };
        }
    }
    const a = (p.heading || 0) * Math.PI / 180;
    return { x: p.position.x - Math.sin(a) * 4, y: p.position.y + Math.cos(a) * 4, z: p.position.z + 0.3, h: p.heading || 0, at: 'рядом с вами' };
}
function VS() { return global.VehStore; }
function dbq(sql, a) { return VS() && VS().q ? VS().q(sql, a) : Promise.resolve([]); }
function despawn(f, c) {
    const k = carKey(f, c), v = live[k];
    if (v && mp.vehicles.exists(v)) {
        if (c.vid) { const fu = Number(v.getVariable('fuel')); dbq('UPDATE vehicles SET fuel = ? WHERE id = ?', [isFinite(fu) ? Math.round(fu) : 100, c.vid]); }
        try { v.destroy(); } catch (e) {}
    }
    delete live[k];
}
function giveBack(f, c, why) {
    despawn(f, c);
    f.cars = f.cars.filter(function (x) { return x !== c; });
    mark();
    if (!c.vid) return;
    const hh = houseOf(f), o = online(c.own);
    const pos = o && o.dimension === 0 ? { x: o.position.x + 3, y: o.position.y + 3, z: o.position.z } : (hh && hh.gar ? hh.gar : null);
    const sql = pos ? 'UPDATE vehicles SET fam_id = 0, pos_x = ?, pos_y = ?, pos_z = ?, dimension = 0 WHERE id = ?' : 'UPDATE vehicles SET fam_id = 0 WHERE id = ?';
    dbq(sql, pos ? [pos.x, pos.y, pos.z, c.vid] : [c.vid]).then(function () {
        if (o && mp.players.exists(o)) { o.ownedLoaded = false; notify(o, 'ok', c.n + ' возвращена вам из гаража семьи' + (why ? ' (' + why + ')' : '')); }
    });
}
function returnAll(f, ownerId, why) { f.cars.filter(function (c) { return c.own === Number(ownerId); }).forEach(function (c) { giveBack(f, c, why); }); }
mp.events.add('playerEnterVehicle', function (p, v, seat) {
    const fid = v.getVariable('famCar');
    if (!fid || (seat !== 0 && seat !== -1)) return;
    const f = famById(fid), c = f && f.cars.find(function (x) { return x.id === v.getVariable('famCarId'); });
    if (!f || !c) return;
    const r = myR(f, sid(p));
    if ((!r || r < c.minR) && !isHead(f, sid(p)) && admLvl(p) < 1) {
        try { p.removeFromVehicle(); } catch (e) {}
        notify(p, 'error', r ? 'Эта машина доступна с ранга «' + rankN(f, c.minR) + '»' : 'Транспорт семьи «' + f.n + '»');
    }
});
mp.events.add('playerQuit', function (p) {
    const s = sid(p);
    Object.keys(live).forEach(function (k) {
        const v = live[k];
        if (v && mp.vehicles.exists(v) && v.famOwner === s) setTimeout(function () { if (mp.vehicles.exists(v) && !(v.getOccupants && v.getOccupants().length)) { v.destroy(); delete live[k]; } }, 120000);
    });
});

mp.events.add('srv:fam:garage', function (p, hid) {
    const f = famP(p), h = D.houses.find(function (x) { return x.id === Number(hid); });
    if (!f || !h || !h.gar || h.owner !== f.id) return;
    if (Math.hypot(p.position.x - h.gar.x, p.position.y - h.gar.y) > 7 || p.dimension !== 0) return;
    const v = p.vehicle;
    if (v && v.getVariable('famCar') === f.id) {
        const c = f.cars.find(function (x) { return x.id === v.getVariable('famCarId'); });
        if (!c) return;
        try { p.removeFromVehicle(); } catch (e) {}
        setTimeout(function () { despawn(f, c); flog(f, 'car', nick(p) + ' поставил ' + c.n + ' в гараж'); mark(); refresh(f); }, 1500);
        return notify(p, 'ok', c.n + ' поставлена в гараж');
    }
    if (v) return notify(p, 'warn', 'В гараж ставятся только машины семьи');
    p.famTab = true; p.call('fam:tabgo', ['cars']); openTab(p);
});

/* ---------- особняки ---------- */
function hNear(p, h, r) { return p.dimension === 0 && Math.hypot(p.position.x - h.x, p.position.y - h.y) < (r || 3) && Math.abs(p.position.z - h.z) < 4; }
mp.events.add('srv:fhouse:door', function (p, id) {
    const h = D.houses.find(function (x) { return x.id === Number(id); });
    if (!h || !hNear(p, h) || p.vehicle) return;
    if (!h.owner) return notify(p, 'ok', '«' + h.n + '» продаётся за ' + num(h.rep) + ' репутации семьи. Купить — в планшете семьи (O)');
    const f = famById(h.owner), mine = f && member(f, sid(p));
    if (!mine && !h.open && admLvl(p) < 1) return notify(p, 'warn', 'Частная территория семьи «' + (f ? f.n : '') + '»');
    const i = INTS[h.int] || INTS.hill1;
    p.dimension = DIM_FH + h.id; p.position = V(i.x, i.y, i.z); p.heading = i.h;
    p.call('house:inside', [h.n + (f ? ' · ' + f.n : '')]);
});
mp.events.add('srv:house:exit', function (p) {
    const d = p.dimension;
    if (d < DIM_FH || d >= DIM_FH + 10000) return;
    const h = D.houses.find(function (x) { return x.id === d - DIM_FH; });
    if (!h) return;
    const i = INTS[h.int] || INTS.hill1;
    if (Math.hypot(p.position.x - i.x, p.position.y - i.y) > 3.5) return;
    p.dimension = 0; p.position = V(h.x, h.y, h.z); p.heading = (h.h || 0) + 180;
    p.call('house:inside', ['']);
});
function kickOut(h) {
    mp.players.forEach(function (x) { if (x.dimension === DIM_FH + h.id) { x.dimension = 0; x.position = V(h.x, h.y, h.z); x.call('house:inside', ['']); } });
}

/* ---------- действия из планшета ---------- */
function A(p, f, k) { if (can(f, sid(p), k)) return true; msg(p, 'Недостаточно прав: ' + PERMS[k].toLowerCase()); return false; }
mp.events.add('srv:fam:act', function (p, act, json) {
    const f = famP(p); if (!f) return;
    let a = {}; try { a = JSON.parse(json || '{}') || {}; } catch (e) { a = {}; }
    const me = sid(p), mr = myR(f, me), head = isHead(f, me), L = f.ranks.length, MS = global.MoneySystem;
    const m = a.id !== undefined ? member(f, a.id) : null;
    const done = function (t) { if (t) msg(p, t, 1); mark(); refresh(f); };

    if (act === 'leave') {
        if (head) {
            if (f.members.length > 1) return msg(p, 'Глава не может выйти, пока в семье есть участники. Передайте главенство');
            const h = houseOf(f); if (h) { kickOut(h); h.owner = 0; h.open = false; sendHousesAll(); }
            f.cars.slice().forEach(function (c) { giveBack(f, c, 'организация распущена'); });
            D.fams = D.fams.filter(function (x) { return x !== f; }); mark(); syncP(p);
            p.call('fam:close'); return notify(p, 'ok', 'Организация распущена');
        }
        returnAll(f, me, 'вы покинули семью');
        f.members = f.members.filter(function (x) { return x.id !== me; }); flog(f, 'mem', nick(p) + ' покинул семью'); syncP(p); sendGarages(p);
        famChat(f, nick(p) + ' покинул семью'); p.call('fam:close'); notify(p, 'ok', 'Вы вышли из семьи'); return done();
    }
    if (act === 'invite') {
        if (!A(p, f, 'invite')) return;
        const e = invite(p, f, mp.players.at(Number(a.pid)));
        return e ? msg(p, e) : msg(p, 'Приглашение отправлено', 1);
    }
    if (act === 'setrank') {
        if (!A(p, f, 'rank')) return;
        const r = Math.floor(Number(a.r));
        if (!m || m.id === me || isHead(f, m.id)) return msg(p, 'Нельзя изменить ранг этого участника');
        if (!head && m.r >= mr) return msg(p, 'Можно менять ранг только тем, кто ниже вас');
        if (r < 1 || r > L - 1 || (!head && r >= mr)) return msg(p, 'Нельзя назначить такой ранг');
        const up = r > m.r; m.r = r;
        flog(f, 'rank', nick(p) + (up ? ' повысил ' : ' понизил ') + m.n + ' до «' + rankN(f, r) + '»');
        const t = online(m.id); if (t) notify(t, 'ok', 'Ваш ранг в семье: ' + rankN(f, r));
        return done('Ранг изменён');
    }
    if (act === 'kick') {
        if (!A(p, f, 'kick')) return;
        if (!m || m.id === me || isHead(f, m.id) || (!head && m.r >= mr)) return msg(p, 'Нельзя исключить этого участника');
        returnAll(f, m.id, 'вас исключили');
        f.members = f.members.filter(function (x) { return x !== m; });
        flog(f, 'mem', nick(p) + ' исключил ' + m.n);
        const t = online(m.id); if (t) { syncP(t); notify(t, 'error', 'Вас исключили из «' + f.n + '»'); t.call('fam:close'); }
        return done(m.n + ' исключён');
    }
    if (act === 'head') {
        if (!head) return msg(p, 'Только глава');
        if (!m || m.id === me) return;
        f.owner = m.id; f.ownerN = m.n; m.r = L; member(f, me).r = L - 1;
        flog(f, 'rank', nick(p) + ' передал главенство ' + m.n); famChat(f, 'Новый глава семьи — ' + m.n);
        return done('Главенство передано');
    }
    if (act === 'rankname') {
        if (!head) return msg(p, 'Переименовывать ранги может только глава');
        const i = Math.floor(Number(a.r)) - 1, n = clean(a.n, 20);
        if (i < 0 || i >= L || n.length < 2) return msg(p, 'Название ранга: от 2 до 20 символов');
        flog(f, 'rank', nick(p) + ' переименовал ранг «' + f.ranks[i] + '» → «' + n + '»'); f.ranks[i] = n;
        return done('Ранг переименован');
    }
    if (act === 'perm') {
        if (!head) return msg(p, 'Доступы настраивает только глава');
        const r = Math.floor(Number(a.r));
        if (!PERMS[a.k] || r < 1 || r > L) return;
        f.perms[a.k] = r;
        flog(f, 'rank', nick(p) + ': «' + PERMS[a.k] + '» — с ранга «' + rankN(f, r) + '»');
        return done('Доступ сохранён');
    }
    if (act === 'deposit') {
        const n = Math.floor(Number(a.n));
        if (!(n > 0) || !MS || MS.get(p) < n) return msg(p, 'Недостаточно наличных');
        MS.add(p, -n); f.bank += n; f.dep.net += n;
        flog(f, 'bank', nick(p) + ' положил в общак ' + money(n));
        if (f.dep.net > f.dep.max) {
            const g = Math.floor(f.dep.net / REP.perDeposit) - Math.floor(f.dep.max / REP.perDeposit);
            f.dep.max = f.dep.net;
            if (g > 0) addRep(f, g, 'взнос в общак');
        }
        return done('Внесено ' + money(n));
    }
    if (act === 'withdraw') {
        if (!A(p, f, 'bank')) return;
        const n = Math.floor(Number(a.n));
        if (!(n > 0) || f.bank < n) return msg(p, 'В общаке ' + money(f.bank));
        f.bank -= n; f.dep.net -= n; MS.add(p, n);
        flog(f, 'bank', nick(p) + ' снял из общака ' + money(n));
        return done('Снято ' + money(n));
    }
    if (act === 'buyrep') {
        const n = Math.floor(Number(a.n)), U = global.UiSystem;
        if (!(n > 0) || n > 100000) return msg(p, 'Укажите количество');
        if (!U || !U.takeCoins || !U.takeCoins(p, Math.ceil(n / REP.rcRate))) return msg(p, 'Недостаточно RC: нужно ' + Math.ceil(n / REP.rcRate));
        addRep(f, n, nick(p) + ' купил за ' + Math.ceil(n / REP.rcRate) + ' RC');
        if (global.SLog) try { global.SLog.add('donate', { actor: p, action: 'family-rep', amount: Math.ceil(n / REP.rcRate), details: f.n }); } catch (e) {}
        famChat(f, nick(p) + ' пополнил репутацию семьи на ' + num(n));
        return done('Репутация пополнена на ' + num(n));
    }
    if (act === 'mycars') {
        dbq('SELECT id, model, plate, impound, fam_id FROM vehicles WHERE owner_id = ? ORDER BY id', [me]).then(function (rows) {
            if (!mp.players.exists(p)) return;
            p.call('fam:extra', [JSON.stringify({ mycars: (rows || []).map(function (r) { return { id: r.id, m: String(r.model), plate: r.plate, imp: !!Number(r.impound), fam: Number(r.fam_id) || 0 }; }) })]);
        });
        return;
    }
    const c = a.cid !== undefined ? f.cars.find(function (x) { return x.id === Number(a.cid); }) : null;
    if (act === 'caradd') {
        if (!A(p, f, 'cars')) return;
        if (f.cars.length >= garCap(f)) return msg(p, 'Гараж заполнен: ' + garCap(f) + ' мест' + (houseOf(f) ? '' : '. Купите особняк — у него гараж больше'));
        const vid = Math.floor(Number(a.vid));
        dbq('SELECT * FROM vehicles WHERE id = ? AND owner_id = ? LIMIT 1', [vid, me]).then(function (rows) {
            const r = rows && rows[0];
            if (!mp.players.exists(p) || famP(p) !== f) return;
            if (!r) return msg(p, 'Это не ваша машина');
            if (Number(r.fam_id)) return msg(p, 'Машина уже в гараже семьи');
            if (Number(r.impound)) return msg(p, 'Машина на штрафстоянке — сначала заберите её');
            if (f.cars.length >= garCap(f)) return msg(p, 'Гараж заполнен');
            const U = VS(), w = U && U.owned ? U.owned[r.id] : null;
            if (w && mp.vehicles.exists(w)) {
                if (w.getOccupants && w.getOccupants().length) return msg(p, 'В машине кто-то сидит');
                if (U.save) U.save(w);
                try { w.destroy(); } catch (e) {}
                delete U.owned[r.id];
            }
            dbq('UPDATE vehicles SET fam_id = ? WHERE id = ?', [f.id, r.id]);
            const nm = String(r.model);
            f.cars.push({ id: f.cseq++, vid: r.id, m: nm, n: nm.charAt(0).toUpperCase() + nm.slice(1), plate: r.plate, minR: 1, own: me, ownN: nick(p) });
            flog(f, 'car', nick(p) + ' добавил в гараж ' + nm + ' (' + r.plate + ')');
            famChat(f, nick(p) + ' добавил в гараж семьи ' + nm);
            done('Машина добавлена в гараж семьи');
            mp.events.call('srv:fam:act', p, 'mycars', '{}');
        });
        return;
    }
    if (act === 'carremove') {
        if (!c) return;
        if (c.own !== me && !head) return msg(p, 'Забрать машину может только её владелец или глава');
        const v = live[carKey(f, c)];
        if (v && mp.vehicles.exists(v) && v.getOccupants && v.getOccupants().length) return msg(p, 'В машине кто-то есть');
        flog(f, 'car', nick(p) + ' забрал из гаража ' + c.n + ' (владелец ' + (c.ownN || '—') + ')');
        giveBack(f, c, c.own === me ? '' : 'решение главы');
        done('Машина возвращена владельцу');
        if (c.own === me) setTimeout(function () { if (mp.players.exists(p)) mp.events.call('srv:fam:act', p, 'mycars', '{}'); }, 600);
        return;
    }
    if (act === 'caraccess') {
        if (!A(p, f, 'cars') || !c) return;
        const r = Math.floor(Number(a.r));
        if (r < 1 || r > L) return;
        c.minR = r;
        flog(f, 'car', nick(p) + ': ' + c.n + ' доступна с ранга «' + rankN(f, r) + '»');
        return done('Доступ к машине сохранён');
    }
    if (act === 'carcall') {
        if (!A(p, f, 'carcall') || !c) return;
        if (mr < c.minR && !head) return msg(p, 'Машина доступна с ранга «' + rankN(f, c.minR) + '»');
        const k = carKey(f, c);
        if (live[k] && mp.vehicles.exists(live[k])) return msg(p, 'Машина уже на улице: ' + (live[k].famBy || ''));
        if (p.dimension !== 0 || p.vehicle) return msg(p, 'Выйдите на улицу и из транспорта');
        if (global.WantedSystem && global.WantedSystem.get && global.WantedSystem.get(p) > 0) return msg(p, 'Вы в розыске — семья не пришлёт машину');
        if (callCd[me] && Date.now() - callCd[me] < 60000) return msg(p, 'Подождите минуту перед следующим вызовом');
        callCd[me] = Date.now();
        const sp = spawnPoint(f, p);
        const go = function (r) {
            if (!mp.players.exists(p) || (live[k] && mp.vehicles.exists(live[k]))) return;
            const v = mp.vehicles.new(mp.joaat(c.m), V(sp.x, sp.y, sp.z + 0.3), { heading: sp.h, numberPlate: c.plate, dimension: 0, locked: false, engine: false });
            if (r) {
                try { v.setColor(Number(r.color1) || 0, Number(r.color2) || 0); } catch (e) {}
                v.setVariable('fuel', r.fuel === null || r.fuel === undefined ? 100 : Number(r.fuel));
                if (r.fuel_type) v.setVariable('fuelType', r.fuel_type);
            } else { const rgb = hexRgb(f.c); try { v.setColorRGB(rgb[0], rgb[1], rgb[2], rgb[0], rgb[1], rgb[2]); } catch (e) {} }
            v.setVariable('famCar', f.id); v.setVariable('famCarId', c.id);
            v.adminSpawned = false; v.famOwner = me; v.famBy = nick(p);
            live[k] = v;
            p.call('phone:gps', [sp.x, sp.y, c.n]);
            flog(f, 'car', nick(p) + ' взял ' + c.n);
            done(c.n + ' ждёт ' + sp.at);
        };
        if (c.vid) dbq('SELECT * FROM vehicles WHERE id = ? LIMIT 1', [c.vid]).then(function (rows) { go(rows && rows[0]); });
        else go(null);
        return;

    }
    if (act === 'carback') {
        if (!c) return;
        const v = live[carKey(f, c)];
        if (!v || !mp.vehicles.exists(v)) { delete live[carKey(f, c)]; return done(); }
        if (v.famOwner !== me && !can(f, me, 'cars')) return msg(p, 'Вернуть может тот, кто взял, или ответственный за транспорт');
        const hh = houseOf(f);
        if (hh && hh.gar && Math.hypot(v.position.x - hh.gar.x, v.position.y - hh.gar.y) > 40 && !can(f, me, 'cars')) return msg(p, 'Пригоните машину к гаражу особняка');
        if (v.getOccupants && v.getOccupants().length) return msg(p, 'В машине кто-то есть');
        despawn(f, c); flog(f, 'car', nick(p) + ' вернул ' + c.n + ' в гараж');
        return done('Машина в гараже');
    }
    if (act === 'hbuy') {
        if (!A(p, f, 'house')) return;
        const h = D.houses.find(function (x) { return x.id === Number(a.hid); });
        if (!h || h.owner) return msg(p, 'Особняк уже занят');
        if (houseOf(f)) return msg(p, 'У семьи уже есть особняк. Сначала продайте его');
        if (f.rep < h.rep) return msg(p, 'Не хватает репутации: ' + num(f.rep) + ' из ' + num(h.rep));
        f.rep -= h.rep; h.owner = f.id; h.open = false;
        flog(f, 'house', nick(p) + ' купил «' + h.n + '» за ' + num(h.rep) + ' репутации');
        famChat(f, 'Семья приобрела особняк «' + h.n + '»!');
        mp.players.forEach(function (x) { x.outputChatBox('!{' + f.c + '}[' + f.tag + '] !{#ffffff}Семья «' + f.n + '» заселилась в «' + h.n + '»'); });
        sendHousesAll(); return done('Особняк ваш! Гараж на ' + garCap(f) + ' машин');
    }
    const h = houseOf(f);
    if (act === 'hgps') { if (h) p.call('phone:gps', [h.x, h.y, h.n]); return msg(p, 'Метка поставлена', 1); }
    if (act === 'hlock') {
        if (!A(p, f, 'house') || !h) return;
        h.open = !h.open; flog(f, 'house', nick(p) + (h.open ? ' открыл особняк для гостей' : ' закрыл особняк'));
        return done(h.open ? 'Гости могут заходить' : 'Только для семьи');
    }
    if (act === 'hsell') {
        if (!head || !h) return msg(p, 'Продать особняк может только глава');
        const back = Math.round(h.rep * REP.sellBack);
        if (f.cars.length > BASE_GARAGE) return msg(p, 'Без особняка в гараже останется ' + BASE_GARAGE + ' места — сначала заберите лишние машины');
        kickOut(h); h.owner = 0; h.open = false; f.rep += back;
        flog(f, 'house', nick(p) + ' продал «' + h.n + '» (+' + num(back) + ' репутации)');
        sendHousesAll(); return done('Особняк продан, возвращено ' + num(back) + ' репутации');
    }
});

/* ---------- жест «указать» ---------- */
mp.events.add('srv:point', function (p, on) { p.setVariable('pointing', !!on); if (!on) { p.setVariable('ptP', 0); p.setVariable('ptY', 0); } });
mp.events.add('srv:pointDir', function (p, pt, yw) {
    if (!p.getVariable('pointing')) return;
    pt = Math.max(-70, Math.min(42, Number(pt) || 0)); yw = Math.max(-180, Math.min(180, Number(yw) || 0));
    if (Math.abs((p.getVariable('ptP') || 0) - pt) > 2) p.setVariable('ptP', pt);
    if (Math.abs((p.getVariable('ptY') || 0) - yw) > 2) p.setVariable('ptY', yw);
});

/* ---------- команды ---------- */
mp.events.addCommand('fam', function (p, full) {
    const f = famP(p); if (!f) return notify(p, 'warn', 'Вы не состоите в семье');
    const t = String(full || '').replace(/!\{[^}]*\}/g, '').trim().slice(0, 160);
    if (!t) return p.outputChatBox('!{#ffcc66}/fam [текст] — чат семьи · O или /ftab — планшет семьи');
    toFam(f, '!{' + f.c + '}[' + f.tag + '] ' + rankN(f, myR(f, sid(p))) + ' ' + nick(p) + ': !{#ffffff}' + t);
});
['ftab', 'fmenu'].forEach(function (c) { mp.events.addCommand(c, function (p) { mp.events.call('srv:fam:tab', p); }); });
mp.events.addCommand('famnpc', function (p) {
    if (admLvl(p) < 7) return;
    if (p.dimension !== cityDim()) return p.outputChatBox('!{#ffcc66}Встаньте у стойки в мэрии на место регистратора');
    D.npc = [p.position.x, p.position.y, p.position.z, p.heading || 0]; mark();
    spawnNpc(); mp.players.forEach(sendNpc);
    p.outputChatBox('!{#8fd14f}Место регистратора семей сохранено. Отойдите — NPC появится здесь');
});
mp.events.addCommand('famlist', function (p) {
    if (admLvl(p) < 3) return;
    if (!D.fams.length) return p.outputChatBox('Семей нет');
    D.fams.forEach(function (f) { p.outputChatBox('!{' + f.c + '}#' + f.id + ' [' + f.tag + '] ' + f.n + ' !{#aaaaaa}· ' + TYPES[f.type].n + ' · глава ' + f.ownerN + ' · ' + f.members.length + ' чел. · общак ' + money(f.bank) + ' · реп ' + num(f.rep)); });
});
mp.events.addCommand('famdel', function (p, full) {
    if (admLvl(p) < 7) return;
    const f = famById(full);
    if (!f) return p.outputChatBox('!{#ffcc66}/famdel [id из /famlist]');
    const h = houseOf(f); if (h) { kickOut(h); h.owner = 0; }
    f.cars.slice().forEach(function (c) { giveBack(f, c, 'семья удалена администрацией'); });
    D.fams = D.fams.filter(function (x) { return x !== f; }); mark();
    mp.players.forEach(syncP); sendHousesAll();
    p.outputChatBox('!{#8fd14f}Семья «' + f.n + '» удалена');
});
mp.events.addCommand('famrep', function (p, full) {
    if (admLvl(p) < 7) return;
    const a = String(full || '').trim().split(/\s+/), f = famById(a[0]), n = Math.floor(Number(a[1]));
    if (!f || !n) return p.outputChatBox('!{#ffcc66}/famrep [id семьи] [кол-во] (минус — забрать)');
    addRep(f, n, 'администратор ' + nick(p));
    p.outputChatBox('!{#8fd14f}Репутация «' + f.n + '»: ' + num(f.rep));
});
mp.events.addCommand('fhcreate', function (p, full) {
    if (admLvl(p) < 7) return;
    const a = String(full || '').trim().split(/\s+/), rep = Math.floor(Number(a[0])), it = 'hill' + Math.floor(Number(a[1]));
    const n = a.slice(2).join(' ').trim();
    if (!(rep > 0) || !INTS[it] || !n || p.dimension !== 0) return p.outputChatBox('!{#ffcc66}/fhcreate [цена в репутации] [интерьер 1-5] [название] — встаньте у двери');
    const h = { id: D.hseq++, n: clean(n, 40), x: p.position.x, y: p.position.y, z: p.position.z, h: p.heading || 0, int: it, rep: rep, owner: 0, open: false, gar: null };
    D.houses.push(h); mark(); sendHousesAll();
    p.outputChatBox('!{#8fd14f}Особняк #' + h.id + ' создан. Гараж: /fhgarage ' + h.id + ' [мест] или через /points');
});
mp.events.addCommand('fhgarage', function (p, full) {
    if (admLvl(p) < 7) return;
    const a = String(full || '').trim().split(/\s+/), h = D.houses.find(function (x) { return x.id === Number(a[0]); }), cap = Math.floor(Number(a[1]));
    if (!h || !(cap > 0) || cap > 50) return p.outputChatBox('!{#ffcc66}/fhgarage [id особняка] [мест 1-50] — встаньте на место въезда в гараж');
    const e = p.vehicle || p;
    h.gar = { x: e.position.x, y: e.position.y, z: e.position.z, h: e.heading || p.heading || 0, cap: cap }; mark(); sendHousesAll();
    p.outputChatBox('!{#8fd14f}Гараж особняка «' + h.n + '» на ' + cap + ' мест сохранён');
});
mp.events.addCommand('fhlist', function (p) {
    if (admLvl(p) < 3) return;
    D.houses.forEach(function (h) { const f = h.owner ? famById(h.owner) : null; p.outputChatBox('#' + h.id + ' ' + h.n + ' · ' + num(h.rep) + ' реп · гараж ' + (h.gar ? h.gar.cap : 0) + ' · ' + (f ? '[' + f.tag + '] ' + f.n : 'свободен')); });
});
mp.events.addCommand('fhdel', function (p, full) {
    if (admLvl(p) < 7) return;
    const h = D.houses.find(function (x) { return x.id === Number(full); });
    if (!h) return p.outputChatBox('!{#ffcc66}/fhdel [id из /fhlist]');
    kickOut(h); D.houses = D.houses.filter(function (x) { return x !== h; }); mark(); sendHousesAll();
    p.outputChatBox('!{#8fd14f}Особняк удалён');
});

try {
    const PR = global.PointReg || require('./points.js');
    PR.provider(function () {
        const out = [{ id: 'gov.gov.famnpc', g: 'Фракция: Правительство', n: 'Регистратор семей (NPC)', dim: cityDim,
            get: npcPos, set: function (v) { D.npc = [v.x, v.y, v.z, v.h]; mark(); spawnNpc(); mp.players.forEach(sendNpc); } }];
        D.houses.forEach(function (h) {
            out.push({ id: 'fhouse.' + h.id, g: 'Семейные особняки', n: '#' + h.id + ' ' + h.n + ' — дверь',
                get: function () { return [h.x, h.y, h.z, h.h]; }, set: function (v) { h.x = v.x; h.y = v.y; h.z = v.z; h.h = v.h; mark(); sendHousesAll(); },
                del: function () { kickOut(h); D.houses = D.houses.filter(function (x) { return x !== h; }); mark(); sendHousesAll(); } });
            if (h.gar) out.push({ id: 'fhouse.' + h.id + '.gar', g: 'Семейные особняки', n: '#' + h.id + ' ' + h.n + ' — гараж на ' + h.gar.cap + ' мест',
                get: function () { return [h.gar.x, h.gar.y, h.gar.z, h.gar.h]; }, set: function (v) { h.gar.x = v.x; h.gar.y = v.y; h.gar.z = v.z; h.gar.h = v.h; mark(); sendHousesAll(); },
                del: function () { h.gar = null; mark(); sendHousesAll(); } });
        });
        return out;
    });
    if (PR.creator) PR.creator(function () {
        const ints = Object.keys(INTS).map(function (k) { return [k, INTS[k].n]; });
        const hs = D.houses.map(function (h) { return [h.id, '#' + h.id + ' ' + h.n + (h.gar ? ' (гараж ' + h.gar.cap + ')' : ' (без гаража)')]; });
        const list = [{ id: 'fhouse', n: 'Семейный особняк', d: 'Дверь особняка появится там, где вы стоите. Семьи покупают его за репутацию.',
            f: [{ k: 'n', n: 'Название', t: 'text', ph: 'Особняк в Вайнвуде' }, { k: 'rep', n: 'Цена в репутации', t: 'number', v: 6000 },
                { k: 'int', n: 'Интерьер', t: 'select', o: ints, v: 'hill1' }, { k: 'cap', n: 'Мест в гараже (0 — без гаража)', t: 'number', v: 6 }],
            make: function (p, v) {
                const n = clean(v.n, 40), rep = Math.floor(Number(v.rep)), cap = Math.floor(Number(v.cap) || 0);
                if (n.length < 3) return 'Название: от 3 символов';
                if (!(rep > 0)) return 'Укажите цену в репутации';
                if (!INTS[v.int]) return 'Выберите интерьер';
                if (p.dimension !== 0) return 'Особняк ставится только на улице';
                if (cap < 0 || cap > 50) return 'Гараж: от 0 до 50 мест';
                const h = { id: D.hseq++, n: n, x: p.position.x, y: p.position.y, z: p.position.z, h: p.heading || 0, int: v.int, rep: rep, owner: 0, open: false, gar: null };
                if (cap > 0) { const a = (p.heading || 0) * Math.PI / 180; h.gar = { x: p.position.x - Math.sin(a) * 8, y: p.position.y + Math.cos(a) * 8, z: p.position.z, h: p.heading || 0, cap: cap }; }
                D.houses.push(h); mark(); sendHousesAll();
                notify(p, 'ok', 'Особняк #' + h.id + ' создан' + (cap ? '. Гараж поставлен в 8 м впереди — подгоните его в списке меток' : ''));
                return null;
            } }];
        if (hs.length) list.push({ id: 'fgarage', n: 'Гараж особняка', d: 'Въезд в гараж появится там, где вы стоите (можно сидя в машине). Если у особняка уже есть гараж — он переедет сюда с новой вместимостью.',
            f: [{ k: 'hid', n: 'Особняк', t: 'select', o: hs, v: hs[0][0] }, { k: 'cap', n: 'Вместимость (машин)', t: 'number', v: 6 }],
            make: function (p, v) {
                const h = D.houses.find(function (x) { return x.id === Number(v.hid); }), cap = Math.floor(Number(v.cap));
                if (!h) return 'Выберите особняк';
                if (!(cap > 0) || cap > 50) return 'Вместимость: от 1 до 50';
                if (p.dimension !== 0) return 'Гараж ставится только на улице';
                const f = h.owner ? famById(h.owner) : null;
                if (f && f.cars.length > cap) return 'У семьи в гараже ' + f.cars.length + ' машин — меньше сделать нельзя';
                const e = p.vehicle || p;
                h.gar = { x: e.position.x, y: e.position.y, z: e.position.z, h: e.heading || p.heading || 0, cap: cap }; mark(); sendHousesAll();
                notify(p, 'ok', 'Гараж «' + h.n + '» на ' + cap + ' мест сохранён');
                return null;
            } });
        return list;
    });
} catch (e) {}

global.FamilySystem = { of: famOf, ofP: famP, TYPES: TYPES, houseP: function (p) { const f = p && p.account ? famP(p) : null; const h = f ? houseOf(f) : null; return h ? { n: h.n, open: !!h.open, fam: f.n } : null; }, addRep: function (fid, n, why) { const f = famById(fid); if (f) addRep(f, n, why); } };
console.log('[family] семей: ' + D.fams.length + ', особняков: ' + D.houses.length);
