const fs = require('fs');
const path = require('path');
let db = null;
try { db = require('./database'); } catch (e) { db = null; }

const FILE = path.join(__dirname, 'families.json');
const D = Object.assign({ seq: 1, fams: [], npc: null }, (function () { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch (e) { return {}; } })());
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

function notify(p, type, text) { if (typeof global.hudNotify === 'function') global.hudNotify(p, type, text); else p.outputChatBox(text); }
function sid(p) { return p && p.account && p.account.id ? Number(p.account.id) : 0; }
function nick(p) { return String((p.account && p.account.nick) || p.name).replace(/_/g, ' '); }
function money(n) { return '$' + String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function admLvl(p) { return global.AdminSystem && global.AdminSystem.realLvl ? global.AdminSystem.realLvl(p) : (p.account ? Number(p.account.admin) || 0 : 0); }
function online(id) { return mp.players.toArray().find(function (x) { return sid(x) === Number(id); }) || null; }
function V(x, y, z) { return new mp.Vector3(x, y, z); }

function famOf(id) { id = Number(id); return D.fams.find(function (f) { return f.members.some(function (m) { return m.id === id; }); }) || null; }
function famP(p) { return famOf(sid(p)); }
function member(f, id) { return f.members.find(function (m) { return m.id === Number(id); }); }
function isHead(f, id) { return f.owner === Number(id); }
function canManage(f, id) { const m = member(f, id); return !!m && (isHead(f, id) || m.r >= f.ranks.length - 1); }
function rankN(f, r) { return f.ranks[Math.max(1, Math.min(f.ranks.length, r)) - 1]; }
function toFam(f, t) { f.members.forEach(function (m) { const x = online(m.id); if (x) x.outputChatBox(t); }); }
function flog(f, t) { f.log.unshift({ t: Date.now(), x: t }); if (f.log.length > 50) f.log.length = 50; mark(); }
function syncP(p) { const f = famP(p); const v = f ? f.tag + '|' + f.c : ''; if ((p.getVariable('fam') || '') !== v) p.setVariable('fam', v); }
setInterval(function () { mp.players.forEach(function (p) { if (p.account) syncP(p); }); }, 4000);

/* ---------- NPC в мэрии ---------- */
function cityDim() { return global.HouseSystem && global.HouseSystem.facDim ? global.HouseSystem.facDim('gov') : -1; }
function npcPos() { return D.npc || [-72.6, -823.2, 243.39, 180]; }
let ped = null;
function spawnNpc() {
    try { if (ped && mp.peds.exists(ped)) ped.destroy(); } catch (e) {}
    const c = npcPos(), d = cityDim();
    if (d < 0) return;
    try { ped = mp.peds.new(mp.joaat('a_m_y_business_03'), V(c[0], c[1], c[2]), { dynamic: false, frozen: true, invincible: true, heading: c[3] || 0, dimension: d }); } catch (e) { ped = null; }
}
function sendNpc(p) { p.call('fam:npc', [JSON.stringify({ p: npcPos(), d: cityDim() })]); }
setTimeout(function () { spawnNpc(); mp.players.forEach(sendNpc); }, 6000);
mp.events.add('playerReady', function (p) { setTimeout(function () { if (mp.players.exists(p)) { sendNpc(p); syncP(p); } }, 6000); });
function nearNpc(p) { const c = npcPos(); return p.dimension === cityDim() && Math.hypot(p.position.x - c[0], p.position.y - c[1]) < 3.5 && Math.abs(p.position.z - c[2]) < 4; }

function view(p) {
    const f = famP(p), MS = global.MoneySystem;
    const base = { cash: MS ? MS.get(p) : 0, bank: MS ? MS.bank(p) : 0, colors: COLORS, tax: REG_TAX,
        types: Object.keys(TYPES).map(function (k) { const t = TYPES[k]; return { k: k, n: t.n, i: t.i, d: t.d, price: t.price, slots: t.slots, ranks: t.ranks.length }; }),
        pass: !(global.UiSystem && global.UiSystem.hasDoc) || !!global.UiSystem.hasDoc(p, 'passport'), taken: D.fams.map(function (x) { return x.tag; }) };
    if (!f) return base;
    const me = member(f, sid(p));
    base.fam = { id: f.id, n: f.n, tag: f.tag, c: f.c, type: TYPES[f.type].n, ti: TYPES[f.type].i, slots: TYPES[f.type].slots, bank: f.bank, created: f.created, ownerN: f.ownerN,
        head: isHead(f, sid(p)), mgr: canManage(f, sid(p)), myRank: rankN(f, me.r), ranks: f.ranks,
        members: f.members.slice().sort(function (a, b) { return b.r - a.r; }).map(function (m) { return { id: m.id, n: m.n, r: m.r, rn: rankN(f, m.r), on: !!online(m.id), head: isHead(f, m.id) }; }),
        log: f.log.slice(0, 15) };
    return base;
}
function openUI(p) { p.call('fam:open', [JSON.stringify(view(p))]); }
function msg(p, t, ok) { p.call('fam:msg', [String(t), ok ? 1 : 0]); }

mp.events.add('srv:fam:open', function (p) { if (p.account && nearNpc(p)) openUI(p); });
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
    const f = { id: D.seq++, n: name, tag: tag, c: c, type: a.type, owner: sid(p), ownerN: nick(p), bank: 0, created: Date.now(), ranks: t.ranks.slice(), members: [{ id: sid(p), n: nick(p), r: t.ranks.length }], log: [] };
    D.fams.push(f);
    flog(f, nick(p) + ' зарегистрировал организацию');
    mark(); syncP(p);
    mp.players.forEach(function (x) { x.outputChatBox('!{' + c + '}[' + tag + '] !{#ffffff}В мэрии зарегистрирована новая организация: !{' + c + '}' + name + ' !{#aaaaaa}(' + t.n + ')'); });
    msg(p, 'Организация «' + name + '» зарегистрирована!', 1);
    openUI(p);
});
mp.events.add('srv:fam:act', function (p, act, id) {
    const f = famP(p); if (!f) return;
    id = Number(id);
    if (act === 'leave') {
        if (isHead(f, sid(p))) {
            if (f.members.length > 1) return msg(p, 'Глава не может выйти, пока в семье есть участники. Передайте главенство или распустите');
            D.fams = D.fams.filter(function (x) { return x !== f; }); mark(); syncP(p);
            msg(p, 'Организация распущена', 1); return openUI(p);
        }
        f.members = f.members.filter(function (m) { return m.id !== sid(p); }); flog(f, nick(p) + ' вышел'); syncP(p);
        toFam(f, '!{' + f.c + '}[' + f.tag + '] !{#ffffff}' + nick(p) + ' покинул семью');
        msg(p, 'Вы вышли из семьи', 1); return openUI(p);
    }
    if (!canManage(f, sid(p))) return msg(p, 'Недостаточно прав');
    const m = member(f, id);
    if (!m || m.id === sid(p) || isHead(f, m.id)) return msg(p, 'Нельзя');
    const top = f.ranks.length - (isHead(f, sid(p)) ? 1 : 2);
    if (act === 'up') m.r = Math.min(top, m.r + 1);
    else if (act === 'down') m.r = Math.max(1, m.r - 1);
    else if (act === 'kick') { f.members = f.members.filter(function (x) { return x !== m; }); const t = online(m.id); if (t) { syncP(t); notify(t, 'error', 'Вас исключили из ' + f.n); } }
    else if (act === 'head' && isHead(f, sid(p))) { f.owner = m.id; f.ownerN = m.n; m.r = f.ranks.length; member(f, sid(p)).r = f.ranks.length - 1; }
    else return;
    flog(f, nick(p) + ': ' + m.n + ' → ' + (act === 'kick' ? 'исключён' : act === 'head' ? 'новый глава' : rankN(f, m.r)));
    mark(); openUI(p);
});

/* ---------- команды ---------- */
mp.events.addCommand('finv', function (p, full) {
    const f = famP(p);
    if (!f || !canManage(f, sid(p))) return notify(p, 'warn', 'Приглашать может глава семьи или его заместитель');
    const t = mp.players.at(Number(String(full || '').trim()));
    if (!t || !t.account || t === p) return p.outputChatBox('!{#ffcc66}/finv [id] — игрок должен быть рядом');
    if (t.position.subtract(p.position).length() > 5) return notify(p, 'warn', 'Игрок должен быть рядом');
    if (famP(t)) return notify(p, 'warn', 'Игрок уже в семье');
    if (f.members.length >= TYPES[f.type].slots) return notify(p, 'warn', 'Все места заняты (' + TYPES[f.type].slots + ')');
    t.famInvite = { f: f.id, by: nick(p), at: Date.now() };
    t.outputChatBox('!{' + f.c + '}[' + f.tag + '] !{#ffffff}' + nick(p) + ' зовёт вас в «' + f.n + '». Принять: !{#8fd14f}/faccept2');
    notify(p, 'ok', 'Приглашение отправлено');
});
mp.events.addCommand('faccept2', function (t) {
    const o = t.famInvite;
    if (!o || Date.now() - o.at > 60000) return notify(t, 'warn', 'Приглашений нет');
    t.famInvite = null;
    const f = D.fams.find(function (x) { return x.id === o.f; });
    if (!f || famP(t)) return;
    if (f.members.length >= TYPES[f.type].slots) return notify(t, 'warn', 'Мест больше нет');
    f.members.push({ id: sid(t), n: nick(t), r: 1 });
    flog(f, nick(t) + ' вступил (позвал ' + o.by + ')'); syncP(t);
    toFam(f, '!{' + f.c + '}[' + f.tag + '] !{#ffffff}' + nick(t) + ' вступил в семью');
});
mp.events.addCommand('fam', function (p, full) {
    const f = famP(p); if (!f) return notify(p, 'warn', 'Вы не состоите в семье');
    const t = String(full || '').replace(/!\{[^}]*\}/g, '').trim().slice(0, 160);
    if (!t) return p.outputChatBox('!{#ffcc66}/fam [текст] — чат семьи · /fmenu — меню · /finv [id] — пригласить · /fbank [сумма] — положить в общак');
    toFam(f, '!{' + f.c + '}[' + f.tag + '] ' + rankN(f, member(f, sid(p)).r) + ' ' + nick(p) + ': !{#ffffff}' + t);
});
mp.events.addCommand('fbank', function (p, full) {
    const f = famP(p); if (!f) return notify(p, 'warn', 'Вы не состоите в семье');
    const n = Math.floor(Number(String(full || '').trim()));
    const MS = global.MoneySystem;
    if (!n) return p.outputChatBox('!{#ffcc66}Общак: ' + money(f.bank) + ' · /fbank [сумма] — положить, /fbank -[сумма] — снять (глава)');
    if (n > 0) { if (MS.get(p) < n) return notify(p, 'warn', 'Недостаточно наличных'); MS.add(p, -n); f.bank += n; flog(f, nick(p) + ' положил ' + money(n)); }
    else { if (!isHead(f, sid(p))) return notify(p, 'warn', 'Снимать может только глава'); if (f.bank < -n) return notify(p, 'warn', 'В общаке ' + money(f.bank)); f.bank += n; MS.add(p, -n); flog(f, nick(p) + ' снял ' + money(-n)); }
    mark(); notify(p, 'ok', 'Общак семьи: ' + money(f.bank));
});
mp.events.addCommand('fmenu', function (p) { if (!famP(p)) return notify(p, 'warn', 'Вы не состоите в семье. Создать — у регистратора в мэрии'); openUI(p); });
mp.events.addCommand('famnpc', function (p) {
    if (admLvl(p) < 7) return;
    if (p.dimension !== cityDim()) return p.outputChatBox('!{#ffcc66}Зайдите в мэрию и встаньте на место регистратора');
    D.npc = [p.position.x, p.position.y, p.position.z, p.heading || 0]; mark();
    spawnNpc(); mp.players.forEach(sendNpc);
    p.outputChatBox('!{#8fd14f}Место регистратора семей сохранено. Отойдите — NPC появится здесь');
});
mp.events.addCommand('famlist', function (p) {
    if (admLvl(p) < 3) return;
    if (!D.fams.length) return p.outputChatBox('Семей нет');
    D.fams.forEach(function (f) { p.outputChatBox('!{' + f.c + '}#' + f.id + ' [' + f.tag + '] ' + f.n + ' !{#aaaaaa}· ' + TYPES[f.type].n + ' · глава ' + f.ownerN + ' · ' + f.members.length + ' чел. · общак ' + money(f.bank)); });
});
mp.events.addCommand('famdel', function (p, full) {
    if (admLvl(p) < 7) return;
    const f = D.fams.find(function (x) { return x.id === Number(full); });
    if (!f) return p.outputChatBox('!{#ffcc66}/famdel [id из /famlist]');
    D.fams = D.fams.filter(function (x) { return x !== f; }); mark();
    mp.players.forEach(syncP);
    p.outputChatBox('!{#8fd14f}Семья «' + f.n + '» удалена');
});

try {
    const PR = global.PointReg || require('./points.js');
    PR.provider(function () {
        return [{ id: 'gov.gov.famnpc', g: 'Фракция: Правительство', n: 'Регистратор семей (NPC)', dim: cityDim,
            get: npcPos, set: function (v) { D.npc = [v.x, v.y, v.z, v.h]; mark(); spawnNpc(); mp.players.forEach(sendNpc); } }];
    });
} catch (e) {}

global.FamilySystem = { of: famOf, ofP: famP, TYPES: TYPES };
console.log('[family] семей: ' + D.fams.length);
