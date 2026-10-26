const fs = require('fs');
const path = require('path');

let db = null;
try { db = require('../database'); } catch (e) {
    try { db = require('./database'); } catch (e2) { db = null; }
}

const DATA_FILE = path.join(__dirname, 'ui_data.json');
const TRUNK_FILE = path.join(__dirname, 'ui_trunks.json');
const INV_SIZE = 30;
const SIDE_SIZE = 15;
const INV_CAP = 50;
const BAG_CAP = 20;
const TRUNK_CAP = 50;

const ITEMS = {
    medkit: { n: 'Аптечка', i: '⛑️', w: 0.8, s: 5, use: 'heal', v: 100, price: 800 },
    bandage: { n: 'Бинт', i: '🩹', w: 0.1, s: 20, use: 'heal', v: 25, price: 150 },
    pills: { n: 'Таблетки', i: '💊', w: 0.1, s: 20, use: 'heal', v: 15, price: 100 },
    armour: { n: 'Бронежилет', i: '🦺', w: 3, s: 1, slot: 'armour', price: 2500 },
    canister: { n: 'Канистра (+25 л)', i: '🛢️', w: 3, s: 2, use: 'fuel', v: 25, price: 400 },
    repair: { n: 'Ремкомплект', i: '🔧', w: 2, s: 3, use: 'repair', price: 1200 },
    lockpick: { n: 'Отмычка', i: '🗝️', w: 0.1, s: 10, price: 500 },
    cash: { n: 'Пачка денег', i: '💵', w: 0.1, s: 100, use: 'cash', v: 1000 },
    docs: { n: 'Папка документов', i: '📂', w: 0.1, s: 1, use: 'docs' },
    card: { n: 'Банковская карта', i: '💳', w: 0.05, s: 1, use: 'card' },
    phone: { n: 'Телефон', i: '📱', w: 0.2, s: 1, slot: 'phone', price: 1000 },
    cap: { n: 'Кепка', i: '🧢', w: 0.2, s: 1, slot: 'hat', cloth: { p: 0, d: 2 }, price: 300 },
    hat: { n: 'Шляпа', i: '🎩', w: 0.3, s: 1, slot: 'hat', cloth: { p: 0, d: 12 }, price: 600 },
    glasses: { n: 'Очки', i: '🕶️', w: 0.1, s: 1, slot: 'glasses', cloth: { p: 1, d: 5 }, price: 400 },
    mask: { n: 'Маска', i: '🎭', w: 0.3, s: 1, slot: 'mask', cloth: { c: 1, d: 4 }, price: 700 },
    bandana: { n: 'Бандана', i: '🧣', w: 0.1, s: 1, slot: 'mask', cloth: { c: 1, d: 51 }, price: 250 },
    chain: { n: 'Цепочка', i: '📿', w: 0.1, s: 1, slot: 'chain', cloth: { c: 7, d: 16 }, price: 1500 },
    watch: { n: 'Часы', i: '⌚', w: 0.1, s: 1, slot: 'watch', cloth: { p: 6, d: 1 }, price: 1200 },
    gloves: { n: 'Перчатки', i: '🧤', w: 0.2, s: 1, slot: 'gloves', price: 300 },
    tshirt: { n: 'Футболка', i: '👕', w: 0.3, s: 1, slot: 'top', cloth: { c: 11, d: 0, t: 0 }, price: 300 },
    shirt: { n: 'Рубашка', i: '👔', w: 0.3, s: 1, slot: 'top', cloth: { c: 11, d: 26, t: 11 }, price: 600 },
    hoodie: { n: 'Худи', i: '🧥', w: 0.6, s: 1, slot: 'top', cloth: { c: 11, d: 7, t: 14 }, price: 900 },
    jeans: { n: 'Джинсы', i: '👖', w: 0.5, s: 1, slot: 'legs', cloth: { c: 4, d: 4 }, price: 500 },
    shorts: { n: 'Шорты', i: '🩳', w: 0.3, s: 1, slot: 'legs', cloth: { c: 4, d: 15 }, price: 300 },
    sneakers: { n: 'Кроссовки', i: '👟', w: 0.6, s: 1, slot: 'shoes', cloth: { c: 6, d: 1 }, price: 500 },
    boots: { n: 'Ботинки', i: '🥾', w: 0.8, s: 1, slot: 'shoes', cloth: { c: 6, d: 25 }, price: 800 },
    backpack: { n: 'Рюкзак (+20 кг)', i: '🎒', w: 1, s: 1, slot: 'bag', cloth: { c: 5, d: 45 }, price: 3000 },
    pistol: { n: 'Пистолет', i: '🔫', w: 1.2, s: 1, wp: 'weapon_pistol', ammo: 'ammo_pistol', price: 15000 },
    smg: { n: 'Micro SMG', i: '🔫', w: 2.5, s: 1, wp: 'weapon_microsmg', ammo: 'ammo_smg', price: 30000 },
    rifle: { n: 'Assault Rifle MK2', i: '🔫', w: 4.5, s: 1, wp: 'weapon_assaultrifle_mk2', ammo: 'ammo_rifle' },
    knife: { n: 'Нож', i: '🔪', w: 0.4, s: 1, wp: 'weapon_knife', price: 1500 },
    bat: { n: 'Бита', i: '🏏', w: 1, s: 1, wp: 'weapon_bat', price: 800 },
    ammo_pistol: { n: 'Патроны 9 mm', i: '🟡', w: 0.01, s: 250, price: 10, pack: 30 },
    ammo_smg: { n: 'Патроны SMG', i: '🟠', w: 0.01, s: 250, price: 12, pack: 30 },
    ammo_rifle: { n: 'Патроны 5,56 mm', i: '🔴', w: 0.015, s: 250 },
    g_stungun: { n: 'Тайзер', i: '⚡', w: 0.8, s: 1, wp: 'weapon_stungun', fa: 100, gov: 1 },
    g_pistol: { n: 'Служебный пистолет', i: '🔫', w: 1.1, s: 1, wp: 'weapon_combatpistol', ammo: 'ammo_pistol', gov: 1 },
    g_carbine: { n: 'Служебный автомат', i: '🔫', w: 3.8, s: 1, wp: 'weapon_carbinerifle', ammo: 'ammo_rifle', gov: 1 },
    g_armour: { n: 'Служебный бронежилет', i: '🦺', w: 3, s: 1, slot: 'armour', gov: 1 },
    cuffs: { n: 'Наручники', i: '⛓️', w: 0.3, s: 2, gov: 1 },
    ukrop: { n: 'Укроп', i: '🌿', w: 0.05, s: 50, use: 'drug', v: 35, ill: 1 },
    ukrop_seed: { n: 'Семена укропа', i: '🌱', w: 0.01, s: 50, ill: 1 },
    c_scrap: { n: 'Металлолом', i: '🔩', w: 0.3, s: 100 },
    c_shell: { n: 'Гильзы и капсюли', i: '🥉', w: 0.02, s: 200 },
    c_powder: { n: 'Порох', i: '🧂', w: 0.05, s: 100, ill: 1 },
    c_spring: { n: 'Пружины и механизмы', i: '🌀', w: 0.1, s: 50 },
    c_barrel: { n: 'Оружейный ствол', i: '📏', w: 0.6, s: 10, ill: 1 },
    c_kevlar: { n: 'Кевларовая пластина', i: '🛡️', w: 0.8, s: 10, ill: 1 },
    c_blueprint: { n: 'Армейский чертёж', i: '📜', w: 0.05, s: 10, ill: 1 },
    i_shotgun: { n: 'Обрез (самодельный)', i: '🔫', w: 2.5, s: 1, wp: 'weapon_sawnoffshotgun', ammo: 'ammo_shotgun', ill: 1 },
    ammo_shotgun: { n: 'Дробь', i: '🟤', w: 0.03, s: 100 },
    ukrop_pack: { n: 'Пакет укропа (x10)', i: '🛍️', w: 0.5, s: 10, use: 'unpack', v: 10, ill: 1 },
    i_pistol: { n: 'Пистолет (без номера)', i: '🔫', w: 1.2, s: 1, wp: 'weapon_pistol', ammo: 'ammo_pistol', ill: 1 },
    i_smg: { n: 'Micro SMG (без номера)', i: '🔫', w: 2.5, s: 1, wp: 'weapon_microsmg', ammo: 'ammo_smg', ill: 1 },
    i_rifle: { n: 'Автомат (без номера)', i: '🔫', w: 4.5, s: 1, wp: 'weapon_assaultrifle', ammo: 'ammo_rifle', ill: 1 },
    i_armour: { n: 'Бронежилет (нелегальный)', i: '🦺', w: 3, s: 1, slot: 'armour', ill: 1 }
};

const DEF = {
    hat: { p: 0 }, glasses: { p: 1 }, watch: { p: 6 },
    mask: { c: 1, d: 0 }, chain: { c: 7, d: 0 }, bag: { c: 5, d: 0 },
    top: { c: 11, d: 15 }, legs: { c: 4, d: 61 }, shoes: { c: 6, d: 34 }
};

const SLOTS = ['hat', 'glasses', 'mask', 'chain', 'top', 'armour', 'watch', 'gloves', 'bag', 'legs', 'shoes', 'phone'];

const SKILLS = [
    { k: 'shoot', n: 'Стрельба' },
    { k: 'drive', n: 'Вождение' },
    { k: 'stamina', n: 'Выносливость' },
    { k: 'survive', n: 'Выживание' }
];

const BP_MAX = 30;
const BP_STEP = 30;
const BP = [];
for (let l = 1; l <= BP_MAX; l++) {
    if (l % 10 === 0) BP.push({ lvl: l, item: l === 30 ? 'rifle' : 'backpack', c: 1 });
    else if (l % 5 === 0) BP.push({ lvl: l, item: 'armour', c: 1 });
    else if (l % 3 === 0) BP.push({ lvl: l, item: 'medkit', c: 2 });
    else BP.push({ lvl: l, money: 1000 * l });
}

const BP_IMG = { money: 'money', medkit: 'medkit', armour: 'armour', backpack: 'backpack', rifle: 'rifle' };
const COIN_RATE = 100;
const VIPS = {
    silver: { n: 'Silver VIP', price: 300, days: 30, mult: 1.5, color: '#c9d3e0', img: 'coins', perks: ['Опыт и Battle Pass x1.5', 'Бонус $5.000 при покупке', 'Серебряный тег в меню'], bonus: 5000 },
    gold: { n: 'Gold VIP', price: 700, days: 30, mult: 2, color: '#ffc93c', img: 'crown', perks: ['Опыт и Battle Pass x2', 'Бонус $20.000 при покупке', 'Золотой тег в меню'], bonus: 20000 },
    platinum: { n: 'Platinum VIP', price: 1500, days: 30, mult: 3, color: '#b18cff', img: 'crown', perks: ['Опыт и Battle Pass x3', 'Бонус $60.000 при покупке', 'Платиновый тег в меню'], bonus: 60000 }
};
const COIN_PACKS = [
    { c: 100, bonus: 0, rub: 100 },
    { c: 500, bonus: 50, rub: 500 },
    { c: 1000, bonus: 150, rub: 1000 },
    { c: 2500, bonus: 500, rub: 2500 },
    { c: 5000, bonus: 1250, rub: 5000 }
];
function vipOf(d) { return d.vip && d.vip.until > Date.now() && VIPS[d.vip.t] ? d.vip : null; }
function vipMult(d) { const v = vipOf(d); return v ? VIPS[v.t].mult : 1; }

const GPS = [
    { c: 'Госучреждения', n: 'Полиция (Mission Row)', x: 425.1, y: -979.5 },
    { c: 'Госучреждения', n: 'Больница Pillbox', x: 298.6, y: -584.4 },
    { c: 'Госучреждения', n: 'Лицензионный центр', x: 228.4, y: -805.6 },
    { c: 'Финансы', n: 'Центральный банк', x: 150.3, y: -1040.2 },
    { c: 'Транспорт', n: 'Автосалон', x: -56.5, y: -1096.6 },
    { c: 'Транспорт', n: 'Аэропорт LSIA', x: -1037.0, y: -2737.0 },
    { c: 'Транспорт', n: 'Автовокзал', x: 433.6, y: -647.4 },
    { c: 'Районы', n: 'Пляж Vespucci', x: -1600.0, y: -1050.0 },
    { c: 'Районы', n: 'Сэнди-Шорс', x: 1850.0, y: 3700.0 },
    { c: 'Районы', n: 'Палето-Бэй', x: -200.0, y: 6300.0 }
];

function rj(f, d) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return d; } }
const store = rj(DATA_FILE, {});
const trunks = rj(TRUNK_FILE, {});
if (!store._numbers) store._numbers = {};
let dirty = false;
function mark() { dirty = true; }
setInterval(function () {
    if (!dirty) return;
    dirty = false;
    fs.writeFile(DATA_FILE, JSON.stringify(store), function () {});
    fs.writeFile(TRUNK_FILE, JSON.stringify(trunks), function () {});
}, 5000);

async function q(sql, args) {
    if (!db) return [];
    try {
        const r = await db.query(sql, args || []);
        return Array.isArray(r) && Array.isArray(r[0]) ? r[0] : r;
    } catch (e) {
        console.log('[ui] db: ' + e.message);
        return [];
    }
}
setTimeout(function () { q('ALTER TABLE accounts ADD COLUMN IF NOT EXISTS bank INT NOT NULL DEFAULT 0'); }, 3000);

function accOf(p) { return p.account || p.admAcc || null; }
function accId(p) { const a = accOf(p); return a && a.id ? a.id : null; }
function key(p) { const id = accId(p); return id ? 'a' + id : 'n' + p.name; }
const lastNote = {};
function notify(p, type, text) {
    if (!mp.players.exists(p)) return;
    const k = p.id + '|' + text;
    if (lastNote[k] && Date.now() - lastNote[k] < 2500) return;
    lastNote[k] = Date.now();
    if (typeof global.hudNotify === 'function') global.hudNotify(p, type, text);
    else p.call('hud:notify', [type, text, 4000]);
}
function dist(a, b) { const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z; return Math.sqrt(dx * dx + dy * dy + dz * dz); }
function adminLvl(p) { return global.AdminSystem && typeof global.AdminSystem.lvl === 'function' ? global.AdminSystem.lvl(p) : 0; }
function online(k) { return mp.players.toArray().find(function (x) { return key(x) === k; }); }

function newNumber() {
    let n;
    do { n = String(100 + Math.floor(Math.random() * 900)) + '-' + String(100 + Math.floor(Math.random() * 900)); }
    while (store._numbers[n]);
    return n;
}

function data(p) {
    const k = key(p);
    let d = store[k];
    if (!d) {
        const inv = new Array(INV_SIZE).fill(null);
        inv[0] = { k: 'docs', c: 1 };
        inv[1] = { k: 'card', c: 1 };
        inv[2] = { k: 'bandage', c: 3 };
        inv[3] = { k: 'pills', c: 2 };
        d = store[k] = {
            inv: inv, equip: { phone: { k: 'phone', c: 1 } },
            phone: '', contacts: [], sms: [], bank: 0,
            lvl: 1, exp: 0, mins: 0, bpExp: 0, bpClaimed: [],
            skills: { shoot: 0, drive: 0, stamina: 0, survive: 0 }
        };
    }
    if (!d.phone) { d.phone = newNumber(); }
    store._numbers[d.phone] = k;
    d.name = p.name;
    mark();
    return d;
}

/* ===== ДЕНЬГИ: единый источник — таблица accounts ===== */
const MONEY = {};
const moneyWriteAt = {};
function syncObjs(p, m, b) {
    if (p.account) { p.account.money = m; p.account.bank = b; }
    if (p.admAcc) { p.admAcc.money = m; p.admAcc.bank = b; }
    try { const v = p.getVariable('money'); if (v !== undefined && v !== null) p.setVariable('money', m); } catch (e) {}
}
async function refreshMoney(p) {
    const id = accId(p);
    if (!id || !db) return;
    if (moneyWriteAt[id] && Date.now() - moneyWriteAt[id] < 2500) return;
    const r = await q('SELECT money, bank FROM accounts WHERE id = ? LIMIT 1', [id]);
    if (!r[0] || !mp.players.exists(p)) return;
    const m = Number(r[0].money) || 0, b = Number(r[0].bank) || 0;
    MONEY[id] = { money: m, bank: b };
    syncObjs(p, m, b);
}
function getMoney(p) {
    const id = accId(p);
    if (id && MONEY[id]) return MONEY[id].money;
    const a = accOf(p);
    return a ? Number(a.money) || 0 : 0;
}
function getBank(p) {
    const id = accId(p);
    if (id && MONEY[id]) return MONEY[id].bank;
    if (p.account && p.account.bank !== undefined && p.account.bank !== null) return Number(p.account.bank) || 0;
    return Number(data(p).bank) || 0;
}
function setMB(p, money, bank, why) {
    money = Math.max(0, Math.floor(money)); bank = Math.max(0, Math.floor(bank));
    const id = accId(p);
    if (global.SLog && mp.players.exists(p)) { try { global.SLog.money(p, getMoney(p), getBank(p), money, bank, why || global.__moneyWhy || null); } catch (e) {} }
    syncObjs(p, money, bank);
    if (id) {
        MONEY[id] = { money: money, bank: bank };
        moneyWriteAt[id] = Date.now();
        q('UPDATE accounts SET money = ?, bank = ? WHERE id = ?', [money, bank, id]);
    } else { data(p).bank = bank; mark(); }
    pushMoney(p, true);
}
const lastMoneySent = {};
function pushMoney(p, force) {
    if (!mp.players.exists(p)) return;
    const s = getMoney(p) + '|' + getBank(p);
    if (!force && lastMoneySent[p.id] === s) return;
    lastMoneySent[p.id] = s;
    p.call('hud:money', [getMoney(p), getBank(p)]);
}
setInterval(function () {
    mp.players.forEach(function (p) {
        refreshMoney(p).then(function () { pushMoney(p, false); }).catch(function () {});
    });
}, 3000);
mp.events.add('playerQuit', function (p) { delete lastMoneySent[p.id]; });
global.MoneySystem = {
    get: getMoney, bank: getBank, set: setMB,
    add: function (p, n) { setMB(p, getMoney(p) + n, getBank(p)); },
    addBank: function (p, n) { setMB(p, getMoney(p), getBank(p) + n); },
    refresh: refreshMoney
};
global.hudMoney = getMoney;

function addMoney(p, n) { setMB(p, getMoney(p) + n, getBank(p)); }

function itemW(x) { return x && ITEMS[x.k] ? ITEMS[x.k].w * x.c : 0; }
function weight(list) { return list.reduce(function (s, x) { return s + itemW(x); }, 0); }
function invCap(d) { return INV_CAP + (d.equip.bag ? BAG_CAP : 0); }
function full(x) {
    if (!x || !ITEMS[x.k]) return null;
    const it = ITEMS[x.k];
    return { k: x.k, c: x.c, n: it.n, i: it.i, w: it.w, slot: it.slot || null, wp: !!it.wp, use: it.use || null };
}

const drops = [];
let dropSeq = 1;
setInterval(function () {
    const now = Date.now();
    for (let i = drops.length - 1; i >= 0; i--) {
        if (now - drops[i].t > 15 * 60 * 1000) {
            if (drops[i].obj && mp.objects.exists(drops[i].obj)) drops[i].obj.destroy();
            drops.splice(i, 1);
        }
    }
}, 60000);

function nearDrops(p) {
    return drops.filter(function (d) { return d.dim === p.dimension && dist(d.pos, p.position) < 3; }).slice(0, SIDE_SIZE);
}

function makeDrop(p, item) {
    const pos = p.position;
    const ang = Math.random() * Math.PI * 2;
    const at = new mp.Vector3(pos.x + Math.cos(ang) * 0.6, pos.y + Math.sin(ang) * 0.6, pos.z - 0.98);
    let obj = null;
    try { obj = mp.objects.new(mp.joaat('prop_paper_bag_small'), at, { dimension: p.dimension }); } catch (e) {}
    drops.push({ id: dropSeq++, k: item.k, c: item.c, pos: at, dim: p.dimension, obj: obj, t: Date.now() });
}

function trunkList(p) {
    const v = p.uiVeh;
    if (!v || !mp.vehicles.exists(v) || dist(v.position, p.position) > 7) return null;
    const plate = v.numberPlate || ('veh' + v.id);
    if (!trunks[plate]) trunks[plate] = new Array(SIDE_SIZE).fill(null);
    return trunks[plate];
}

function ref(p, r) {
    const d = data(p);
    if (!r) return null;
    if (r.b === 'inv') {
        const i = Number(r.i);
        if (i < 0 || i >= INV_SIZE) return null;
        return { b: 'inv', item: d.inv[i], set: function (v) { d.inv[i] = v; }, list: d.inv, cap: invCap(d) };
    }
    if (r.b === 'trunk') {
        const list = trunkList(p);
        const i = Number(r.i);
        if (!list || i < 0 || i >= SIDE_SIZE) return null;
        return { b: 'trunk', item: list[i], set: function (v) { list[i] = v; }, list: list, cap: TRUNK_CAP };
    }
    if (r.b === 'equip') {
        if (SLOTS.indexOf(r.i) < 0) return null;
        return { b: 'equip', slot: r.i, item: d.equip[r.i] || null, set: function (v) { if (v) d.equip[r.i] = v; else delete d.equip[r.i]; } };
    }
    if (r.b === 'ground') {
        const dr = nearDrops(p).find(function (x) { return x.id === Number(r.i); });
        if (r.i === 'new') return { b: 'ground', item: null, set: function (v) { if (v) makeDrop(p, v); } };
        if (!dr) return null;
        return {
            b: 'ground', item: { k: dr.k, c: dr.c },
            set: function (v) {
                if (v) { dr.k = v.k; dr.c = v.c; return; }
                if (dr.obj && mp.objects.exists(dr.obj)) dr.obj.destroy();
                drops.splice(drops.indexOf(dr), 1);
            }
        };
    }
    return null;
}

function applyCloth(p, slot, item) {
    try {
        if (slot === 'armour') { p.armour = item ? 100 : 0; return; }
        const c = item && ITEMS[item.k] ? ITEMS[item.k].cloth : null;
        if (item && c) {
            if (c.p !== undefined) p.setProp(c.p, c.d, 0);
            else {
                p.setClothes(c.c, c.d, 0, 0);
                if (c.t !== undefined) { p.setClothes(3, c.t, 0, 0); p.setClothes(8, 15, 0, 0); }
            }
        } else if (!item && DEF[slot]) {
            const df = DEF[slot];
            if (df.p !== undefined) {
                try { p.setProp(df.p, -1, 0); } catch (e) {}
                p.call('inv:clearProp', [df.p]);
            } else {
                p.setClothes(df.c, df.d, 0, 0);
                if (slot === 'top') { p.setClothes(3, 15, 0, 0); p.setClothes(8, 15, 0, 0); }
            }
        }
    } catch (e) {}
}

function applyAll(p) {
    if (!mp.players.exists(p) || !accId(p)) return;
    const d = data(p);
    Object.keys(d.equip).forEach(function (s) { if (s !== 'armour') applyCloth(p, s, d.equip[s]); });
}

function addItem(p, k, c) {
    if (global.SLog) { try { global.SLog.add('item', { actor: p, action: 'receive', details: (ITEMS[k] ? ITEMS[k].n || k : k) + ' x' + (c || 1) }); } catch (e) {} }
    return addItem0(p, k, c);
}
function addItem0(p, k, c) {
    const d = data(p);
    const it = ITEMS[k];
    if (!it) return c;
    for (let i = 0; i < INV_SIZE && c > 0; i++) {
        const x = d.inv[i];
        if (x && x.k === k && x.c < it.s) { const n = Math.min(c, it.s - x.c); x.c += n; c -= n; }
    }
    for (let i = 0; i < INV_SIZE && c > 0; i++) {
        if (!d.inv[i]) { const n = Math.min(c, it.s); d.inv[i] = { k: k, c: n }; c -= n; }
    }
    if (c > 0) makeDrop(p, { k: k, c: c });
    mark();
    return c;
}

function countItem(d, k) { return d.inv.reduce(function (s, x) { return s + (x && x.k === k ? x.c : 0); }, 0); }
function takeAll(d, k) {
    let n = 0;
    for (let i = 0; i < INV_SIZE; i++) if (d.inv[i] && d.inv[i].k === k) { n += d.inv[i].c; d.inv[i] = null; }
    return n;
}

function armed(p, k) { return p.uiWeapon && p.uiWeapon.k === k; }

function move(p, from, to, count) {
    const s = ref(p, from);
    const t = ref(p, to);
    if (!s || !s.item || !t) return;
    if (from.b === to.b && String(from.i) === String(to.i)) return;
    if (armed(p, s.item.k) && from.b === 'inv' && to.b !== 'inv') return notify(p, 'error', 'Сначала уберите оружие из рук');
    const it = ITEMS[s.item.k];

    if (t.b === 'equip') {
        if (it.slot !== t.slot) return notify(p, 'error', 'Этот предмет сюда не надевается');
        if (t.item && s.b !== 'equip') {
            if (s.b !== 'ground' && s.list && weight(s.list) - itemW(s.item) + itemW(t.item) > s.cap + 0.001) return notify(p, 'error', 'Не хватает места');
        }
        const old = t.item;
        t.set(s.item);
        s.set(s.b === 'ground' && old ? null : old);
        if (s.b === 'ground' && old) makeDrop(p, old);
        applyCloth(p, t.slot, t.item);
        notify(p, 'ok', 'Надето: ' + it.n);
        return;
    }

    if (s.b === 'equip') {
        if (t.item) {
            if (ITEMS[t.item.k].slot !== s.slot) return notify(p, 'error', 'Освободите ячейку');
        }
        if (t.list && weight(t.list) + itemW(s.item) - itemW(t.item) > t.cap + 0.001) return notify(p, 'error', 'Не хватает места');
        if (s.slot === 'bag' && !t.item && weight(data(p).inv) > INV_CAP) return notify(p, 'error', 'Без рюкзака вещи не поместятся');
        const old = t.item;
        if (t.b === 'ground') { t.set(s.item); s.set(null); }
        else { t.set(s.item); s.set(old); }
        applyCloth(p, s.slot, old);
        return;
    }

    if (t.b === 'ground') {
        const n = Math.max(1, Math.min(s.item.c, Number(count) || s.item.c));
        makeDrop(p, { k: s.item.k, c: n });
        if (n >= s.item.c) s.set(null); else s.item.c -= n;
        return;
    }

    const same = t.item && t.item.k === s.item.k && it.s > 1;
    const cross = s.b !== t.b;
    if (same) {
        const n = Math.min(s.item.c, it.s - t.item.c, Number(count) || s.item.c);
        if (n <= 0) return;
        if (cross && t.list && weight(t.list) + it.w * n > t.cap + 0.001) return notify(p, 'error', 'Не хватает места');
        t.item.c += n;
        if (n >= s.item.c) s.set(null); else s.item.c -= n;
        return;
    }
    if (cross) {
        if (t.list && weight(t.list) + itemW(s.item) - itemW(t.item) > t.cap + 0.001) return notify(p, 'error', 'Не хватает места');
        if (t.item && s.list && weight(s.list) - itemW(s.item) + itemW(t.item) > s.cap + 0.001) return notify(p, 'error', 'Не хватает места');
        if (t.item && s.b === 'ground') return notify(p, 'error', 'Выберите пустую ячейку');
    }
    const old = t.item;
    t.set(s.item);
    s.set(old);
}

function firstFree(list) { for (let i = 0; i < list.length; i++) if (!list[i]) return i; return -1; }

function useItem(p, r) {
    const s = ref(p, r);
    if (!s || !s.item) return;
    const it = ITEMS[s.item.k];
    if (s.b === 'equip') {
        const i = firstFree(data(p).inv);
        if (i < 0) return notify(p, 'error', 'Инвентарь заполнен');
        return move(p, r, { b: 'inv', i: i });
    }
    if (s.b !== 'inv') {
        const i = firstFree(data(p).inv);
        if (i < 0) return notify(p, 'error', 'Инвентарь заполнен');
        return move(p, r, { b: 'inv', i: i });
    }
    if (it.slot) return move(p, r, { b: 'equip', i: it.slot });
    if (it.wp) return toggleWeapon(p, s);
    if (it.use === 'heal') {
        if (p.health >= 100) return notify(p, 'warn', 'Вы и так здоровы');
        p.health = Math.min(100, p.health + it.v);
        consume(s);
        return notify(p, 'ok', 'Использовано: ' + it.n);
    }
    if (it.use === 'repair') {
        let best = null, bd = 6;
        mp.vehicles.forEach(function (v) {
            if (v.dimension !== p.dimension) return;
            const dd = dist(v.position, p.position);
            if (dd < bd) { bd = dd; best = v; }
        });
        if (!best) return notify(p, 'error', 'Рядом нет машины');
        best.repair();
        consume(s);
        return notify(p, 'ok', 'Машина отремонтирована');
    }
    if (it.use === 'fuel') {
        let best = null, bd = 5;
        mp.vehicles.forEach(function (v) {
            if (v.dimension !== p.dimension) return;
            const dd = dist(v.position, p.position);
            if (dd < bd) { bd = dd; best = v; }
        });
        if (!best) return notify(p, 'error', 'Рядом нет машины');
        if (isAir(best)) return notify(p, 'error', 'Канистра не подходит для авиатехники');
        const f = fuelOf(best);
        if (f >= FUEL_MAX) return notify(p, 'warn', 'Бак и так полный');
        setFuel(best, f + it.v);
        consume(s);
        return notify(p, 'ok', 'Заправлено из канистры: ' + Math.round(fuelOf(best)) + ' л');
    }
    if (it.use === 'card') {
        sendCard(p).catch(function (e) { console.log('[bank] ' + e.message); });
        return;
    }
    if (it.use === 'docs') {
        p.call('ui:openDocs');
        return;
    }
    if (it.use === 'drug') {
        if (global.CrimeSystem && global.CrimeSystem.useDrug(p) === false) return;
        consume(s);
        return sendInv(p);
    }
    if (it.use === 'unpack') {
        consume(s);
        addItem(p, 'ukrop', it.v);
        notify(p, 'ok', 'Пакет вскрыт: укроп x' + it.v);
        return sendInv(p);
    }
    if (it.use === 'cash') {
        addMoney(p, it.v);
        consume(s);
        return notify(p, 'ok', '+$' + it.v);
    }
    notify(p, 'warn', 'Этот предмет нельзя использовать');
}

function consume(s) {
    s.item.c -= 1;
    if (s.item.c <= 0) s.set(null);
}

function toggleWeapon(p, s) {
    const it = ITEMS[s.item.k];
    if (p.uiWeapon) {
        if (p.uiWeapon.k !== s.item.k) return notify(p, 'error', 'Сначала уберите ' + ITEMS[p.uiWeapon.k].n);
        p.call('inv:ammoReq', [p.uiWeapon.hash]);
        return;
    }
    const d = data(p);
    const ammo = it.ammo ? takeAll(d, it.ammo) : 0;
    const hash = mp.joaat(it.wp);
    p.giveWeapon(hash, it.ammo ? ammo : (it.fa || 1));
    p.uiWeapon = { k: s.item.k, hash: hash, ammo: it.ammo || null };
    notify(p, 'ok', it.n + ' в руках' + (it.ammo ? ' (' + ammo + ' патр.)' : ''));
}

mp.events.add('srv:inv:ammo', function (p, n) {
    if (!p.uiWeapon) return;
    const w = p.uiWeapon;
    p.uiWeapon = null;
    try { p.removeWeapon(w.hash); } catch (e) {}
    n = Math.max(0, Math.floor(Number(n) || 0));
    if (w.ammo && n > 0) addItem(p, w.ammo, n);
    notify(p, 'ok', ITEMS[w.k].n + ' убран');
    sendInv(p);
});

mp.events.add('playerDeath', function (p) { p.uiWeapon = null; });

function invPayload(p) {
    const d = data(p);
    const equip = {};
    SLOTS.forEach(function (s) { equip[s] = full(d.equip[s]); });
    let side = null;
    const tl = p.uiSide === 'trunk' ? trunkList(p) : null;
    if (tl) {
        side = { type: 'trunk', title: 'Багажник', sub: p.uiVehName || 'Транспорт', list: tl.map(full), cap: TRUNK_CAP, weight: weight(tl) };
    } else {
        const nd = nearDrops(p);
        const list = new Array(SIDE_SIZE).fill(null);
        nd.forEach(function (x, i) { const f = full(x); f.id = x.id; list[i] = f; });
        side = { type: 'ground', title: 'Предметы рядом', sub: nd.length ? 'Найдено: ' + nd.length : 'Пусто', list: list, cap: 0, weight: weight(nd) };
    }
    let weapon = null;
    if (p.uiWeapon) {
        const it = ITEMS[p.uiWeapon.k];
        weapon = { k: p.uiWeapon.k, n: it.n, i: it.i, ammo: it.ammo ? ITEMS[it.ammo].n : null };
    }
    const ammoCells = [];
    d.inv.forEach(function (x, i) { if (x && x.k.indexOf('ammo_') === 0 && ammoCells.length < 5) { const f = full(x); f.idx = i; ammoCells.push(f); } });
    return {
        name: p.name,
        inv: d.inv.map(full), cap: invCap(d), weight: weight(d.inv),
        equip: equip, side: side, weapon: weapon, ammo: ammoCells,
        stats: [
            { n: 'Здоровье', v: Math.max(0, Math.round(p.health)), max: 100, c: '#ff4d6d', i: '❤' },
            { n: 'Броня', v: Math.round(p.armour || 0), max: 100, c: '#4fb6ff', i: '🛡' },
            { n: 'Уровень', v: d.lvl, pct: Math.round(d.exp / needExp(d.lvl) * 100), c: '#8fd14f', i: '★' },
            { n: 'Стрельба', v: Math.floor(d.skills.shoot / 100), pct: d.skills.shoot % 100 + (d.skills.shoot >= 500 ? 100 : 0), c: '#ffd23f', i: '◎' },
            { n: 'Вождение', v: Math.floor(d.skills.drive / 100), pct: d.skills.drive % 100 + (d.skills.drive >= 500 ? 100 : 0), c: '#a6e3a1', i: '⛐' },
            { n: 'Выносл.', v: Math.floor(d.skills.stamina / 100), pct: d.skills.stamina % 100 + (d.skills.stamina >= 500 ? 100 : 0), c: '#5ee6c8', i: '⚡' }
        ]
    };
}

function sendInv(p) {
    if (!mp.players.exists(p)) return;
    try { p.call('ui:data', ['inv', JSON.stringify(invPayload(p))]); } catch (e) { console.log('[ui] inv: ' + e.message); }
}

mp.events.add('srv:inv:open', function (p, side, vehId, vehName) {
    p.uiSide = side === 'trunk' ? 'trunk' : 'ground';
    p.uiVeh = null;
    if (p.uiSide === 'trunk' && vehId !== undefined && vehId !== null && Number(vehId) >= 0) {
        const v = mp.vehicles.at(Number(vehId));
        if (v && dist(v.position, p.position) < 7) {
            if (v.locked) { notify(p, 'error', 'Машина закрыта'); p.uiSide = 'ground'; }
            else { p.uiVeh = v; p.uiVehName = String(vehName || '').slice(0, 40); }
        } else p.uiSide = 'ground';
    }
    sendInv(p);
});

mp.events.add('srv:inv:act', function (p, json) {
    let a;
    try { a = JSON.parse(json); } catch (e) { return; }
    if (global.SLog && a.a !== 'move') {
        try {
            const s0 = ref(p, a.from);
            const it = s0 && s0.item;
            if (it) global.SLog.add('item', { actor: p, action: a.a === 'use' ? 'use' : a.a === 'drop' ? 'drop' : 'destroy', details: (ITEMS[it.k] ? ITEMS[it.k].n || it.k : it.k) + ' x' + (a.count || it.c || 1) });
        } catch (e) {}
    }
    if (global.SLog && a.a === 'move' && a.to && a.to.b && a.to.b !== 'inv' && a.to.b !== 'equip') {
        try {
            const s0 = ref(p, a.from);
            const it = s0 && s0.item;
            if (it) global.SLog.add('item', { actor: p, action: 'move:' + a.to.b, details: (ITEMS[it.k] ? ITEMS[it.k].n || it.k : it.k) + ' x' + (a.count || it.c || 1) });
        } catch (e) {}
    }
    if ((a.a === 'drop' || (a.a === 'move' && a.to && a.to.b && a.to.b !== 'inv' && a.to.b !== 'equip'))) {
        const s1 = ref(p, a.from);
        if (s1 && s1.item && ITEMS[s1.item.k] && ITEMS[s1.item.k].gov) return notify(p, 'error', 'Служебное снаряжение нельзя выбросить или передать — сдайте его на складе');
    }
    if (a.a === 'move') move(p, a.from, a.to, a.count);
    else if (a.a === 'use') useItem(p, a.from);
    else if (a.a === 'drop') move(p, a.from, { b: 'ground', i: 'new' }, a.count);
    else if (a.a === 'destroy') {
        const s = ref(p, a.from);
        if (s && s.item) {
            if (armed(p, s.item.k)) notify(p, 'error', 'Сначала уберите оружие из рук');
            else {
                if (s.b === 'equip') applyCloth(p, s.slot, null);
                s.set(null);
                notify(p, 'warn', 'Предмет уничтожен');
            }
        }
    }
    mark();
    sendInv(p);
});


mp.events.add('playerSpawn', function (p) { setTimeout(function () { applyAll(p); }, 3000); });

function needExp(l) { return 60 + l * 15; }

setInterval(function () {
    mp.players.forEach(function (p) {
        if (!accId(p)) return;
        const d = data(p);
        d.mins = (d.mins || 0) + 1;
        const vm = vipMult(d);
        const bpBefore = Math.floor((d.bpExp || 0) / BP_STEP);
        d.exp += vm;
        d.bpExp = (d.bpExp || 0) + vm;
        if (d.mins % 10 === 0) d.skills.survive = Math.min(500, (d.skills.survive || 0) + 5);
        while (d.exp >= needExp(d.lvl)) {
            d.exp -= needExp(d.lvl);
            d.lvl += 1;
            notify(p, 'ok', 'Новый уровень: ' + d.lvl);
        }
        const bpNow = Math.floor(d.bpExp / BP_STEP);
        if (bpNow > bpBefore && bpNow <= BP_MAX) notify(p, 'ok', 'Battle Pass: доступна награда ' + bpNow + ' уровня');
    });
    mark();
}, 60000);

mp.events.add('srv:skills:tick', function (p, json) {
    let s;
    try { s = JSON.parse(json); } catch (e) { return; }
    if (!accId(p)) return;
    const d = data(p);
    const up = function (k, v) {
        const before = Math.floor(d.skills[k] / 100);
        d.skills[k] = Math.min(500, d.skills[k] + Math.max(0, Math.min(20, Math.floor(v))));
        const after = Math.floor(d.skills[k] / 100);
        if (after > before) notify(p, 'ok', 'Навык «' + SKILLS.find(function (x) { return x.k === k; }).n + '» повышен до ' + after + ' ур.');
    };
    up('shoot', (Number(s.shots) || 0) / 5);
    up('drive', (Number(s.drive) || 0) / 400);
    up('stamina', (Number(s.run) || 0) / 150);
    mark();
});

function rewardText(r) {
    if (r.money) return '$' + r.money.toLocaleString('ru-RU');
    return ITEMS[r.item].i + ' ' + ITEMS[r.item].n + (r.c > 1 ? ' x' + r.c : '');
}

async function menuPayload(p) {
    const d = data(p);
    const id = accId(p);
    let vehicles = [];
    let created = null;
    let job = null;
    if (id) {
        vehicles = await q('SELECT model, plate FROM vehicles WHERE owner_id = ? ORDER BY id DESC LIMIT 12', [id]);
        const r = await q('SELECT * FROM accounts WHERE id = ? LIMIT 1', [id]);
        if (r[0]) { created = r[0].created_at; job = r[0].job || null; }
    }
    let family = null;
    if (global.BaseSystem) {
        const b = global.BaseSystem.ownedBy(p) || global.BaseSystem.memberOf(p);
        if (b) family = b.name;
    }
    const money = getMoney(p);
    const bank = getBank(p);
    const itemsCount = d.inv.reduce(function (s, x) { return s + (x ? 1 : 0); }, 0) + Object.keys(d.equip).length;
    const bpLvl = Math.min(BP_MAX, Math.floor((d.bpExp || 0) / BP_STEP));
    const female = p.model === mp.joaat('mp_f_freemode_01');
    const ach = [
        { n: 'Первые шаги', d: 'Зайти на сервер', i: '👣', done: true },
        { n: 'Новичок', d: 'Достичь 3 уровня', i: '🌱', done: d.lvl >= 3 },
        { n: 'Опытный', d: 'Достичь 10 уровня', i: '⭐', done: d.lvl >= 10 },
        { n: 'Ветеран', d: 'Достичь 25 уровня', i: '🏆', done: d.lvl >= 25 },
        { n: 'Час в игре', d: 'Провести на сервере 60 минут', i: '⏱️', done: d.mins >= 60 },
        { n: 'Сутки в игре', d: 'Провести на сервере 24 часа', i: '🌙', done: d.mins >= 1440 },
        { n: 'Автовладелец', d: 'Получить личный транспорт', i: '🚗', done: vehicles.length > 0 },
        { n: 'Богач', d: 'Накопить $100.000', i: '💰', done: money + bank >= 100000 },
        { n: 'Миллионер', d: 'Накопить $1.000.000', i: '💎', done: money + bank >= 1000000 },
        { n: 'Семьянин', d: 'Вступить в семью', i: '👨‍👩‍👦', done: !!family },
        { n: 'Снайпер', d: 'Прокачать стрельбу до 5 уровня', i: '🎯', done: d.skills.shoot >= 500 },
        { n: 'Гонщик', d: 'Прокачать вождение до 5 уровня', i: '🏁', done: d.skills.drive >= 500 },
        { n: 'Коллекционер', d: 'Собрать 20 предметов', i: '🎒', done: itemsCount >= 20 }
    ];
    const shop = Object.keys(ITEMS).filter(function (k) { return ITEMS[k].price && !ITEMS[k].wp && k.indexOf('ammo_') !== 0 && k !== 'armour'; }).map(function (k) {
        const it = ITEMS[k];
        const pack = it.pack || 1;
        return { k: k, n: it.n + (pack > 1 ? ' x' + pack : ''), i: it.i, price: it.price * pack, cat: it.wp ? 'Оружие' : it.cloth || it.slot ? 'Одежда' : k.indexOf('ammo_') === 0 ? 'Оружие' : 'Разное' };
    });
    return {
        name: p.name, id: p.id, number: d.phone,
        gender: female ? 'Женский' : 'Мужской',
        created: created ? new Date(created).toLocaleDateString('ru-RU') : '—',
        faction: job ? (global.CrimeSystem && global.CrimeSystem.ORGS[job] ? global.CrimeSystem.ORGS[job].n : job) : 'Нет', family: family || 'Нет',
        lvl: d.lvl, exp: d.exp, need: needExp(d.lvl), hours: Math.floor((d.mins || 0) / 60),
        money: money, bank: bank,
        salary: global.Treasury ? global.Treasury.info(p) : null,
        home: (function () { const H = global.HouseSystem; const h = H && H.mine ? H.mine(p) : null; return h ? { n: h.n, flat: !!h.flat, locked: !!h.locked } : null; })(),
        vehicles: vehicles.map(function (v) { return { model: v.model, plate: v.plate }; }),
        skills: SKILLS.map(function (s) { const v = d.skills[s.k] || 0; return { n: s.n, lvl: Math.floor(v / 100), pct: v >= 500 ? 100 : v % 100 }; }),
        ach: ach,
        bp: {
            lvl: bpLvl, exp: (d.bpExp || 0) % BP_STEP, need: BP_STEP,
            rewards: BP.map(function (r) { return { lvl: r.lvl, text: r.money ? '$' + r.money.toLocaleString('en-US') : ITEMS[r.item].n + (r.c > 1 ? ' x' + r.c : ''), img: r.money ? 'money' : (BP_IMG[r.item] || 'money'), big: r.lvl % 5 === 0, claimed: d.bpClaimed.indexOf(r.lvl) >= 0, open: r.lvl <= bpLvl }; })
        },
        shop: shop,
        lics: DON_LICS.map(function (l) { return { k: l.k, n: l.n, d: l.d, price: l.price, img: l.img, own: hasDoc(d, l.k) }; }),
        sims: global.PhoneSystem ? global.PhoneSystem.SIMS : [], topup: global.PhoneSystem ? global.PhoneSystem.TOPUP : [],
        coins: d.coins || 0, rate: COIN_RATE, pbal: Math.floor(d.pbal === undefined ? 200 : d.pbal),
        vip: vipOf(d) ? { t: d.vip.t, n: VIPS[d.vip.t].n, color: VIPS[d.vip.t].color, left: Math.ceil((d.vip.until - Date.now()) / 86400000) } : null,
        vips: Object.keys(VIPS).map(function (k) { const v = VIPS[k]; return { k: k, n: v.n, price: v.price, days: v.days, color: v.color, img: v.img, perks: v.perks }; }),
        packs: COIN_PACKS
    };
}

async function sendMenu(p) {
    let payload;
    try { payload = await menuPayload(p); } catch (e) { console.log('[ui] menu: ' + e.message); return; }
    if (mp.players.exists(p)) p.call('ui:data', ['menu', JSON.stringify(payload)]);
}

mp.events.add('srv:menu:get', function (p) { sendMenu(p).catch(function (e) { console.log('[ui] menu: ' + e.message); }); });

mp.events.add('srv:menu:buy', function (p, k) {
    const it = ITEMS[k];
    if (!it || !it.price) return;
    if (it.wp || k.indexOf('ammo_') === 0 || k === 'armour') return notify(p, 'error', 'Оружие продаётся только в Ammu-Nation');
    const pack = it.pack || 1;
    const price = it.price * pack;
    const m = getMoney(p);
    if (m < price) return notify(p, 'error', 'Недостаточно денег');
    const d = data(p);
    if (weight(d.inv) + it.w * pack > invCap(d) + 0.001) return notify(p, 'error', 'В инвентаре нет места');
    setMB(p, m - price, getBank(p));
    addItem(p, k, pack);
    notify(p, 'ok', 'Куплено: ' + it.n);
    sendMenu(p);
});

mp.events.add('srv:menu:vip', function (p, k) {
    const v = VIPS[k];
    if (!v) return;
    const d = data(p);
    if ((d.coins || 0) < v.price) return notify(p, 'error', 'Недостаточно коинов');
    const cur = vipOf(d);
    if (cur && cur.t !== k && VIPS[cur.t].price > v.price) return notify(p, 'error', 'У вас уже более высокий VIP');
    d.coins -= v.price;
    const base = cur && cur.t === k ? cur.until : Date.now();
    d.vip = { t: k, until: base + v.days * 86400000 };
    addMoney(p, v.bonus);
    mark();
    notify(p, 'ok', v.n + ' активирован на ' + v.days + ' дн.');
    sendMenu(p);
});
mp.events.add('srv:menu:exchange', function (p, n) {
    n = Math.floor(Number(n));
    const d = data(p);
    if (!(n > 0)) return;
    if ((d.coins || 0) < n) return notify(p, 'error', 'Недостаточно коинов');
    d.coins -= n;
    addMoney(p, n * COIN_RATE);
    mark();
    notify(p, 'ok', 'Обменяно ' + n + ' RC на $' + (n * COIN_RATE).toLocaleString('ru-RU'));
    sendMenu(p);
});
const DON_LICS = [
    { k: 'gun', n: 'Лицензия на оружие', d: 'Покупка оружия в Ammu-Nation · на 5 лет', price: 400, img: '🔫', blk: 'gun' },
    { k: 'med', n: 'Медицинская книжка', d: 'Нужна для трудоустройства · на 1 год', price: 80, img: '🩺' },
    { k: 'psych', n: 'Справка от психиатра', d: 'Нужна для лицензии на оружие · на 1 год', price: 80, img: '🧠' }
];
mp.events.add('srv:menu:lic', function (p, k) {
    const L = DON_LICS.find(function (x) { return x.k === k; });
    if (!L) return;
    const d = data(p);
    if (hasDoc(d, L.k)) return notify(p, 'warn', 'У вас уже есть: ' + L.n);
    const A = global.AdminSystem;
    if (L.blk && A && A.licBlocked && A.licBlocked(p, L.blk)) return notify(p, 'error', 'Лицензия отобрана администрацией — купить нельзя до окончания срока');
    if (L.k === 'gun' && global.WantedSystem && global.WantedSystem.get(p) > 0) return notify(p, 'error', 'Вы в розыске — лицензия на оружие недоступна');
    if ((d.coins || 0) < L.price) return notify(p, 'error', 'Недостаточно коинов: нужно ' + L.price + ' RC');
    d.coins -= L.price;
    giveDoc(p, L.k, {}, L.k === 'gun' ? 'LSPD · Отдел лицензирования' : L.k === 'drive' ? 'DMV Лос-Сантоса' : 'Pillbox Hill Medical Center');
    mark();
    if (global.SLog) try { global.SLog.add('donate', { actor: p, action: 'license', amount: L.price, details: L.n }); } catch (e) {}
    notify(p, 'ok', 'Получено: ' + L.n + '. Документ лежит в папке документов');
    sendMenu(p);
});
mp.events.add('srv:menu:pack', function (p) {
    notify(p, 'info', 'Пополнение коинов — через администрацию сервера (/report)');
});
function coinTarget(s) {
    s = String(s || '').trim();
    if (!s) return null;
    if (s[0] === '#') { const id = Number(s.slice(1)); return { k: 'a' + id, p: mp.players.toArray().find(function (x) { return accId(x) === id; }) || null, name: '#' + id }; }
    const t = mp.players.at(Number(s));
    return t && mp.players.exists(t) ? { k: key(t), p: t, name: t.name } : null;
}
function addCoins(admin, s, n) {
    n = Math.floor(Number(n));
    const T = coinTarget(s);
    if (!T || !isFinite(n) || !n) return 'Использование: /givedonate [ID или #static] [кол-во RC] (минус — забрать)';
    let d = T.p ? data(T.p) : store[T.k];
    if (!d) return 'Игрок ' + T.name + ' не найден в базе';
    d.coins = Math.max(0, (d.coins || 0) + n);
    mark();
    if (T.p) {
        notify(T.p, n > 0 ? 'ok' : 'warn', n > 0 ? 'Вам начислено ' + n + ' RC (донат)' : 'Списано ' + (-n) + ' RC');
        sendMenu(T.p);
    }
    if (global.SLog) try { global.SLog.add('donate', { actor: admin, action: n > 0 ? 'give' : 'take', amount: n, details: T.name + ' → ' + d.coins + ' RC' }); } catch (e) {}
    if (global.AdminSystem && global.AdminSystem.log) try { global.AdminSystem.log(admin, 'givecoins', T.name + ' ' + n); } catch (e) {}
    return { ok: T.name + ': ' + (n > 0 ? '+' : '') + n + ' RC · баланс ' + d.coins + ' RC' };
}
['givecoins', 'givedonate', 'donate'].forEach(function (c) {
    mp.events.addCommand(c, function (p, full, id, n) {
        if (adminLvl(p) < 8) return p.outputChatBox('!{#e05555}Выдача доната — с 8 уровня администрации');
        const r = addCoins(p, id, n);
        if (typeof r === 'string') return p.outputChatBox('!{#ffcc66}' + r);
        p.outputChatBox('!{#8fd14f}' + r.ok);
    });
});
mp.events.addCommand('givevip', function (p, full, id, k, days) {
    if (adminLvl(p) < 8) return;
    const t = mp.players.at(Number(id));
    if (!t || !VIPS[k]) return p.outputChatBox('!{#ffcc66}/givevip [ID] [silver/gold/platinum] [дней] (0 — снять)');
    const d = data(t);
    days = Number(days);
    if (!isFinite(days)) days = VIPS[k].days;
    if (days <= 0) { d.vip = null; mark(); return p.outputChatBox('!{#8fd14f}VIP снят у ' + t.name); }
    d.vip = { t: k, until: Date.now() + days * 86400000 };
    mark();
    p.outputChatBox('!{#8fd14f}' + t.name + ': ' + VIPS[k].n + ' на ' + days + ' дн.');
    notify(t, 'ok', 'Вам выдан ' + VIPS[k].n + ' на ' + days + ' дн.');
});

mp.events.add('srv:menu:claim', function (p, lvl) {
    lvl = Number(lvl);
    const d = data(p);
    const r = BP.find(function (x) { return x.lvl === lvl; });
    if (!r || d.bpClaimed.indexOf(lvl) >= 0) return;
    if (Math.floor((d.bpExp || 0) / BP_STEP) < lvl) return notify(p, 'error', 'Уровень ещё не открыт');
    d.bpClaimed.push(lvl);
    if (r.money) addMoney(p, r.money);
    else addItem(p, r.item, r.c);
    mark();
    notify(p, 'ok', 'Награда получена: ' + rewardText(r));
    sendMenu(p);
});

mp.events.add('srv:menu:report', function (p, text) {
    text = String(text || '').trim().slice(0, 300);
    if (!text) return;
    let n = 0;
    mp.players.forEach(function (x) {
        if (adminLvl(x) >= 1) { n++; x.outputChatBox('!{#c13dff}[A] !{#ffcc66}[РЕПОРТ] ' + p.name + ' [' + p.id + ']: !{#ffffff}' + text); }
    });
    notify(p, 'ok', n ? 'Репорт отправлен администрации' : 'Репорт отправлен, но админов сейчас нет онлайн');
});

function phonePayload(p) {
    const d = data(p);
    return {
        number: d.phone, name: p.name,
        money: getMoney(p), bank: getBank(p),
        contacts: d.contacts, sms: d.sms.slice(-150),
        online: mp.players.toArray().map(function (x) { return { id: x.id, name: x.name, number: data(x).phone }; }),
        calls: (d.calls || []).slice(-50), pbal: Math.floor(d.pbal === undefined ? 200 : d.pbal), tariff: global.PhoneSystem ? global.PhoneSystem.TARIFF : null, call: global.PhoneSystem ? global.PhoneSystem.state(p) : null,
        gps: GPS.map(function (g) { return { n: g.n, c: g.c || 'Места' }; })
    };
}

function sendPhone(p) {
    if (!mp.players.exists(p)) return;
    try { p.call('ui:data', ['phone', JSON.stringify(phonePayload(p))]); } catch (e) { console.log('[ui] phone: ' + e.message); }
}

mp.events.add('srv:phone:get', function (p) { sendPhone(p); });

mp.events.add('srv:phone:sms', function (p, to, text) {
    text = String(text || '').trim().slice(0, 300);
    to = String(to || '').trim();
    if (!text) return;
    const d = data(p);
    const tk = store._numbers[to];
    if (!tk || !store[tk]) return notify(p, 'error', 'Номер ' + to + ' не существует');
    if (global.PhoneSystem && !global.PhoneSystem.charge(p, 'sms')) return;
    const now = Date.now();
    d.sms.push({ w: to, me: 1, t: text, at: now });
    if (d.sms.length > 300) d.sms.splice(0, d.sms.length - 300);
    if (tk !== key(p)) {
        const r = store[tk];
        r.sms.push({ w: d.phone, me: 0, t: text, at: now });
        if (r.sms.length > 300) r.sms.splice(0, r.sms.length - 300);
        const rp = online(tk);
        if (rp) {
            const c = r.contacts.find(function (x) { return x.number === d.phone; });
            rp.call('phone:sms', [c ? c.name : d.phone, text]);
            sendPhone(rp);
        }
    }
    mark();
    sendPhone(p);
});

mp.events.add('srv:phone:contact', function (p, json) {
    let c;
    try { c = JSON.parse(json); } catch (e) { return; }
    const d = data(p);
    const number = String(c.number || '').trim();
    d.contacts = d.contacts.filter(function (x) { return x.number !== number; });
    if (!c.del) {
        const name = String(c.name || '').trim().slice(0, 32);
        if (!name || !/^\d{3}-\d{3}$/.test(number)) return notify(p, 'error', 'Номер в формате 123-456');
        d.contacts.push({ name: name, number: number });
        d.contacts.sort(function (a, b) { return a.name.localeCompare(b.name); });
    }
    mark();
    sendPhone(p);
});

mp.events.add('srv:phone:bank', function (p, op, sum, to) {
    sum = Math.floor(Number(sum) || 0);
    if (sum <= 0 || sum > 100000000) return notify(p, 'error', 'Неверная сумма');
    const m = getMoney(p);
    const b = getBank(p);
    if (op === 'dep') {
        if (m < sum) return notify(p, 'error', 'Недостаточно наличных');
        setMB(p, m - sum, b + sum);
        notify(p, 'ok', 'Положено на счёт $' + sum);
    } else if (op === 'wd') {
        if (b < sum) return notify(p, 'error', 'Недостаточно денег на счёте');
        setMB(p, m + sum, b - sum);
        notify(p, 'ok', 'Снято со счёта $' + sum);
    } else if (op === 'send') {
        to = String(to || '').trim();
        const tk = store._numbers[to];
        if (!tk || tk === key(p)) return notify(p, 'error', 'Получатель не найден');
        if (b < sum) return notify(p, 'error', 'Недостаточно денег на счёте');
        setMB(p, m, b - sum);
        const rp = online(tk);
        if (rp) {
            setMB(rp, getMoney(rp), getBank(rp) + sum);
            notify(rp, 'ok', 'Перевод на счёт: +$' + sum + ' от ' + data(p).phone);
            sendPhone(rp);
        } else {
            store[tk].bank = (Number(store[tk].bank) || 0) + sum;
            if (tk[0] === 'a') q('UPDATE accounts SET bank = bank + ? WHERE id = ?', [sum, Number(tk.slice(1))]);
            mark();
        }
        notify(p, 'ok', 'Переведено $' + sum + ' на номер ' + to);
    }
    sendPhone(p);
});

mp.events.add('srv:phone:gps', function (p, i) {
    const g = GPS[Number(i)];
    if (g) p.call('phone:gps', [g.x, g.y, g.n]);
});

mp.events.addCommand('giveitem', function (p, full2, id, k, c) {
    if (adminLvl(p) < 4) return;
    const t = mp.players.at(Number(id));
    if (!t || !ITEMS[k]) return p.outputChatBox('/giveitem [id] [предмет] [кол-во]. Список: /itemlist');
    addItem(t, k, Math.max(1, Math.min(1000, Number(c) || 1)));
    notify(t, 'ok', 'Получено: ' + ITEMS[k].n);
    p.outputChatBox('Выдано ' + t.name + ': ' + ITEMS[k].n);
    sendInv(t);
});

mp.events.addCommand('itemlist', function (p) {
    if (adminLvl(p) < 4) return;
    p.outputChatBox('Предметы: ' + Object.keys(ITEMS).join(', '));
});

setInterval(function () {
    mp.players.forEach(function (p) {
        const ok = !!accId(p) && !p.getVariable('creating');
        if (p.uiReadySent === ok) return;
        p.uiReadySent = ok;
        p.call('ui:ready', [ok]);
    });
}, 1500);
mp.events.add('playerQuit', function (p) { p.uiReadySent = undefined; });

if (!global.JobSystem) {
    try { require('./jobs.js'); } catch (e) { console.log('[ui] jobs.js не найден: ' + e.message); }
}
setTimeout(function () {
    try { require('./trucker.js'); } catch (e) { console.log('[ui] trucker.js: ' + e.message); }
    try { require('./realty.js'); } catch (e) { console.log('[ui] realty.js: ' + e.message); }
    try { require('./media.js'); } catch (e) { console.log('[ui] media.js: ' + e.message); }
}, 1500);
if (!global.SocialSystem) {
    try { require('./social.js'); } catch (e) { console.log('[ui] social.js: ' + e.message); }
}
if (!global.DeathSystem) {
    try { require('./death.js'); console.log('[ui] система ранений подключена'); } catch (e) { console.log('[ui] death.js не найден: ' + e.message); }
}

/* ================= OWNED VEHICLES ================= */
function hasHousing(p) {
    try { if (global.HouseSystem && global.HouseSystem.mine && global.HouseSystem.mine(p)) return true; } catch (e) {}
    try { if (global.SpawnSystem && global.SpawnSystem.hotelLeft && global.SpawnSystem.hotelLeft(p) > 0) return true; } catch (e) {}
    try { if (typeof global.isProtectedPlayer === 'function' && global.isProtectedPlayer(p)) return true; } catch (e) {}
    return false;
}
global.hasHousing = hasHousing;
const NO_HOME_TXT = 'Без жилья нельзя владеть транспортом. Купите дом, квартиру или снимите номер в гостинице';
const ownedVeh = {};
let vehColsOk = false;
async function vehCols() {
    if (vehColsOk) return;
    vehColsOk = true;
    try { await q('ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(10) NULL'); } catch (e) {}
    try { await q('ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS dimension INT NOT NULL DEFAULT 0'); } catch (e) {}
}
function saveVeh(v) {
    if (!v || !mp.vehicles.exists(v) || !v.dbId) return;
    const pos = v.position;
    q('UPDATE vehicles SET pos_x = ?, pos_y = ?, pos_z = ?, heading = ?, fuel = ?, locked = ?, fuel_type = ? WHERE id = ?',
        [pos.x, pos.y, pos.z, v.heading || 0, Math.round(fuelOf(v)), v.locked ? 1 : 0, v.getVariable('fuelType') || 'ai92', v.dbId]);
}
async function loadOwned(p) {
    const id = accId(p);
    if (!id || p.ownedLoaded) return;
    if (!hasHousing(p)) {
        if (!p.noHomeChecked) {
            p.noHomeChecked = true;
            const c = await q('SELECT COUNT(*) AS n FROM vehicles WHERE owner_id = ?', [id]);
            if (mp.players.exists(p) && c[0] && Number(c[0].n) > 0) notify(p, 'warn', NO_HOME_TXT + '. Ваш транспорт (' + c[0].n + ' шт.) появится после этого');
        }
        return;
    }
    p.ownedLoaded = true;
    await vehCols();
    const rows = await q('SELECT * FROM vehicles WHERE owner_id = ?', [id]);
    rows.forEach(function (r) {
        const cur = ownedVeh[r.id];
        if (cur && mp.vehicles.exists(cur)) { if (cur.despawnAt) cur.despawnAt = 0; return; }
        let exist = null;
        mp.vehicles.forEach(function (v) { if (!exist && String(v.numberPlate || '').trim() === String(r.plate).trim()) exist = v; });
        if (exist) { exist.dbId = r.id; exist.setVariable('ownerId', id); ownedVeh[r.id] = exist; return; }
        if (r.pos_x === null || r.pos_x === undefined) return;
        const v = mp.vehicles.new(mp.joaat(String(r.model)), new mp.Vector3(r.pos_x, r.pos_y, r.pos_z + 0.3), {
            heading: Number(r.heading) || 0, numberPlate: r.plate, dimension: Number(r.dimension) || 0,
            locked: !!Number(r.locked), engine: false
        });
        try { v.setColor(Number(r.color1) || 0, Number(r.color2) || 0); } catch (e) {}
        v.dbId = r.id;
        v.setVariable('ownerId', id);
        v.setVariable('fuel', r.fuel === null || r.fuel === undefined ? 100 : Number(r.fuel));
        if (r.fuel_type) v.setVariable('fuelType', r.fuel_type);
        ownedVeh[r.id] = v;
    });
    if (rows.length) notify(p, 'ok', 'Ваш транспорт на месте: ' + rows.length + ' шт.');
}
setInterval(function () {
    mp.players.forEach(function (p) { if (accId(p) && !p.ownedLoaded) loadOwned(p).catch(function (e) { console.log('[veh] ' + e.message); }); });
    const now = Date.now();
    Object.keys(ownedVeh).forEach(function (k) {
        const v = ownedVeh[k];
        if (!v || !mp.vehicles.exists(v)) { delete ownedVeh[k]; return; }
        if (v.despawnAt && now > v.despawnAt && !(v.getOccupants && v.getOccupants().length)) {
            saveVeh(v); v.destroy(); delete ownedVeh[k];
        }
    });
}, 4000);
setInterval(function () { Object.keys(ownedVeh).forEach(function (k) { saveVeh(ownedVeh[k]); }); }, 60000);
mp.events.add('playerEnterVehicle', function (p, v, seat) {
    if (seat !== 0 && seat !== -1) return;
    if (!ownsVeh(p, v) || hasHousing(p)) return;
    try { p.removeFromVehicle(); } catch (e) {}
    notify(p, 'error', NO_HOME_TXT);
});
setInterval(function () {
    mp.players.forEach(function (p) {
        if (!p.ownedLoaded || hasHousing(p)) return;
        const id = accId(p);
        p.ownedLoaded = false; p.noHomeChecked = false;
        Object.keys(ownedVeh).forEach(function (k) {
            const v = ownedVeh[k];
            if (v && mp.vehicles.exists(v) && Number(v.getVariable('ownerId')) === Number(id) && !(v.getOccupants && v.getOccupants().length)) { saveVeh(v); v.destroy(); delete ownedVeh[k]; }
        });
        notify(p, 'warn', 'Вы остались без жилья — ваш транспорт отправлен на хранение');
    });
}, 30000);
mp.events.add('playerExitVehicle', function (p, v) {
    if (!v.dbId) {
        const id = accId(p);
        if (id && ownsVeh(p, v)) q('SELECT id FROM vehicles WHERE plate = ? LIMIT 1', [String(v.numberPlate || '').trim()]).then(function (r) { if (r[0]) { v.dbId = r[0].id; ownedVeh[r[0].id] = v; saveVeh(v); } });
        return;
    }
    saveVeh(v);
});
mp.events.add('playerQuit', function (p) {
    const id = accId(p);
    if (!id) return;
    Object.keys(ownedVeh).forEach(function (k) {
        const v = ownedVeh[k];
        if (v && mp.vehicles.exists(v) && Number(v.getVariable('ownerId')) === Number(id)) { saveVeh(v); v.despawnAt = Date.now() + 5 * 60000; }
    });
});

/* ================= BANK: CARDS & ATM ================= */
const ATM_SEED = [
    [147.47, -1036.22, 29.37], [145.84, -1035.63, 29.35], [112.48, -819.81, 31.34], [-1827.23, 784.95, 138.30],
    [-526.71, -1222.87, 18.45], [-821.69, -1081.89, 11.13], [155.89, 6642.86, 31.60], [174.14, 6637.91, 31.57],
    [-283.04, 6226.07, 31.49], [-386.73, 6045.95, 31.50], [1171.52, 2702.56, 38.18], [1172.46, 2702.59, 38.17],
    [-1091.46, 2708.64, 18.95], [24.59, -946.06, 29.36], [5.13, -919.95, 29.56], [-203.55, -861.59, 30.27],
    [-301.70, -830.00, 32.42], [-254.40, -692.40, 33.60], [-1415.90, -212.00, 46.50], [-1205.00, -326.30, 37.85],
    [-2072.40, -317.20, 13.32], [-2975.00, 380.10, 15.00], [-3044.00, 594.60, 7.74], [-3241.10, 997.60, 12.55],
    [1686.70, 4815.80, 42.01], [1968.10, 3743.50, 32.34], [2683.00, 3286.50, 55.24], [540.00, 2671.00, 42.16],
    [-717.60, -915.60, 19.22], [-56.90, -1752.10, 29.42], [289.00, -1256.80, 29.44], [1138.20, -468.90, 66.73],
    [1077.70, -776.50, 58.24], [-165.00, 234.80, 94.92], [-1305.40, -706.40, 25.32], [-1570.10, -546.70, 34.96],
    [-1109.80, -1690.80, 4.38], [236.00, 217.50, 106.29], [-866.70, -187.80, 37.84], [-1315.70, -834.70, 16.96]
];
let ATMS = [];
const atmBlips = {};
const CARD_FEE = 100;

function cardNumber() { let s = '4276'; for (let i = 0; i < 12; i++) s += Math.floor(Math.random() * 10); return s.replace(/(\d{4})(?=\d)/g, '$1 '); }

async function bankInit() {
    if (!db) return console.log('[bank] нет базы — банкоматы отключены');
    await q(`CREATE TABLE IF NOT EXISTS bank_cards (
        owner_id INT PRIMARY KEY, number VARCHAR(24) NOT NULL UNIQUE, pin VARCHAR(4) NULL,
        tries INT NOT NULL DEFAULT 0, blocked_until BIGINT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await q(`CREATE TABLE IF NOT EXISTS bank_tx (
        id INT AUTO_INCREMENT PRIMARY KEY, account_id INT NOT NULL, type VARCHAR(16) NOT NULL,
        amount INT NOT NULL, text VARCHAR(120) NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_acc (account_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await q(`CREATE TABLE IF NOT EXISTS atms (
        id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(48) NOT NULL DEFAULT 'Банкомат',
        x FLOAT NOT NULL, y FLOAT NOT NULL, z FLOAT NOT NULL,
        owner_id INT NULL, fee DECIMAL(4,2) NOT NULL DEFAULT 1.00, balance BIGINT NOT NULL DEFAULT 0,
        price INT NOT NULL DEFAULT 150000, earned BIGINT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    const c = await q('SELECT COUNT(*) AS n FROM atms');
    if (c[0] && Number(c[0].n) === 0) {
        for (let i = 0; i < ATM_SEED.length; i++) await q('INSERT INTO atms (name, x, y, z) VALUES (?, ?, ?, ?)', ['Банкомат #' + (i + 1), ATM_SEED[i][0], ATM_SEED[i][1], ATM_SEED[i][2]]);
        console.log('[bank] создано банкоматов: ' + ATM_SEED.length);
    }
    await loadAtms();
}
async function loadAtms() {
    const rows = await q('SELECT a.*, acc.nick AS owner_nick, acc.login AS owner_login FROM atms a LEFT JOIN accounts acc ON acc.id = a.owner_id ORDER BY a.id');
    ATMS = rows.map(function (r) {
        return { id: r.id, name: r.name, x: Number(r.x), y: Number(r.y), z: Number(r.z), owner: r.owner_id ? Number(r.owner_id) : null,
            ownerName: r.owner_nick || r.owner_login || null, fee: Number(r.fee) || 0, balance: Number(r.balance) || 0, price: Number(r.price) || 0, earned: Number(r.earned) || 0 };
    });
    Object.keys(atmBlips).forEach(function (k) { try { atmBlips[k].destroy(); } catch (e) {} delete atmBlips[k]; });
    ATMS.forEach(function (a) {
        atmBlips[a.id] = mp.blips.new(108, new mp.Vector3(a.x, a.y, a.z), { dimension: 4294967295, name: 'Банкомат', color: 2, shortRange: true, scale: 0.7 });
    });
    mp.players.forEach(sendAtmList);
}
function sendAtmList(p) {
    if (!mp.players.exists(p)) return;
    p.call('atm:list', [JSON.stringify(ATMS.map(function (a) { return [a.id, a.x, a.y, a.z]; }))]);
}
mp.events.add('playerReady', function (p) { setTimeout(function () { sendAtmList(p); }, 3000); });
mp.events.add('srv:atm:list', function (p) { sendAtmList(p); });
setTimeout(function () { bankInit().catch(function (e) { console.log('[bank] init: ' + e.message); }); }, 2500);

function atmOf(id) { return ATMS.find(function (a) { return a.id === Number(id); }) || null; }
function nearAtm(p, id) {
    const a = atmOf(id);
    if (!a) return null;
    return dist(p.position, { x: a.x, y: a.y, z: a.z }) < 3.5 ? a : null;
}
async function cardOf(id) {
    const r = await q('SELECT * FROM bank_cards WHERE owner_id = ? LIMIT 1', [id]);
    return r[0] || null;
}
async function ensureCard(id) {
    let c = await cardOf(id);
    if (c) return c;
    for (let i = 0; i < 5 && !c; i++) {
        await q('INSERT IGNORE INTO bank_cards (owner_id, number) VALUES (?, ?)', [id, cardNumber()]);
        c = await cardOf(id);
    }
    return c;
}
function tx(id, type, amount, text) { if (id) q('INSERT INTO bank_tx (account_id, type, amount, text) VALUES (?, ?, ?, ?)', [id, type, Math.floor(amount), String(text || '').slice(0, 120)]); }
async function history(id) {
    const r = await q('SELECT type, amount, text, created_at FROM bank_tx WHERE account_id = ? ORDER BY id DESC LIMIT 12', [id]);
    return r.map(function (x) { return { t: x.type, a: Number(x.amount), text: x.text, d: new Date(x.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) }; });
}
function holder(p) { const a = accOf(p); return String(a && a.nick ? a.nick : p.name).replace(/_/g, ' ').toUpperCase(); }

async function atmState(p, a, extra) {
    const id = accId(p);
    const hasCardItem = countItem(data(p), 'card') > 0;
    const c = id ? await cardOf(id) : null;
    const st = {
        atm: { id: a.id, name: a.name, fee: a.fee, own: !!(id && a.owner === id), balance: a.balance, earned: a.earned, ownerName: a.ownerName, forSale: !a.owner, price: a.price },
        card: c && hasCardItem ? { number: c.number, holder: holder(p), hasPin: !!c.pin, blocked: Number(c.blocked_until) > Date.now() ? Math.ceil((Number(c.blocked_until) - Date.now()) / 60000) : 0 } : null,
        noAcc: !id, needCard: !hasCardItem || !c, cardFee: CARD_FEE,
        auth: p.atmAuth === a.id, money: getMoney(p), bank: getBank(p)
    };
    if (st.auth && id) st.history = await history(id);
    return Object.assign(st, extra || {});
}
async function sendAtm(p, a, extra) {
    if (!mp.players.exists(p)) return;
    p.call('ui:data', ['atm', JSON.stringify(await atmState(p, a, extra))]);
}
async function sendCard(p) {
    const id = accId(p);
    if (!id) return notify(p, 'error', 'Карта недоступна: аккаунт не найден');
    const c = await ensureCard(id);
    p.call('ui:openCard', [JSON.stringify({ card: { number: c.number, holder: holder(p), hasPin: !!c.pin }, bank: getBank(p), money: getMoney(p), history: await history(id) })]);
}

mp.events.add('srv:atm:open', async function (p, aid) {
    const a = nearAtm(p, aid);
    if (!a) return;
    p.atmAuth = null;
    p.atmId = a.id;
    p.call('ui:atmOpen');
    await sendAtm(p, a);
});

mp.events.add('srv:atm:getcard', async function (p) {
    const a = nearAtm(p, p.atmId);
    const id = accId(p);
    if (!a || !id) return;
    const m = getMoney(p);
    const has = countItem(data(p), 'card') > 0;
    const existing = await cardOf(id);
    if (!has || !existing) {
        if (m < CARD_FEE) return sendAtm(p, a, { err: 'Выпуск карты стоит $' + CARD_FEE + ' наличными' });
        setMB(p, m - CARD_FEE, getBank(p));
        if (existing) await q('UPDATE bank_cards SET number = ?, pin = NULL, tries = 0, blocked_until = 0 WHERE owner_id = ?', [cardNumber(), id]);
        else await ensureCard(id);
        if (!has) addItem(p, 'card', 1);
        tx(id, 'card', -CARD_FEE, 'Выпуск карты');
    }
    sendAtm(p, a, { ok: 'Карта выпущена. Придумайте PIN-код' });
});

mp.events.add('srv:atm:pin', async function (p, pin) {
    const a = nearAtm(p, p.atmId);
    const id = accId(p);
    if (!a || !id) return;
    pin = String(pin || '');
    if (!/^\d{4}$/.test(pin)) return sendAtm(p, a, { err: 'PIN — 4 цифры' });
    const c = await cardOf(id);
    if (!c || countItem(data(p), 'card') <= 0) return sendAtm(p, a, { err: 'Вставьте карту' });
    if (Number(c.blocked_until) > Date.now()) return sendAtm(p, a, { err: 'Карта заблокирована' });
    if (!c.pin) {
        await q('UPDATE bank_cards SET pin = ?, tries = 0 WHERE owner_id = ?', [pin, id]);
        p.atmAuth = a.id;
        return sendAtm(p, a, { ok: 'PIN-код установлен' });
    }
    if (c.pin !== pin) {
        const t = Number(c.tries) + 1;
        if (t >= 3) {
            await q('UPDATE bank_cards SET tries = 0, blocked_until = ? WHERE owner_id = ?', [Date.now() + 10 * 60000, id]);
            return sendAtm(p, a, { err: 'Карта заблокирована на 10 минут' });
        }
        await q('UPDATE bank_cards SET tries = ? WHERE owner_id = ?', [t, id]);
        return sendAtm(p, a, { err: 'Неверный PIN. Осталось попыток: ' + (3 - t) });
    }
    await q('UPDATE bank_cards SET tries = 0 WHERE owner_id = ?', [id]);
    p.atmAuth = a.id;
    sendAtm(p, a);
});

async function payTo(target, sum, fromP, fromText) {
    const online2 = mp.players.toArray().find(function (x) { return accId(x) === target; });
    if (online2) {
        setMB(online2, getMoney(online2), getBank(online2) + sum);
        notify(online2, 'ok', 'Поступление на карту: +$' + sum + ' от ' + fromText);
    } else {
        await q('UPDATE accounts SET bank = bank + ? WHERE id = ?', [sum, target]);
        if (MONEY[target]) MONEY[target].bank += sum;
    }
    tx(target, 'in', sum, 'Перевод от ' + fromText);
}

mp.events.add('srv:atm:op', async function (p, op, sum, target) {
    const a = nearAtm(p, p.atmId);
    const id = accId(p);
    if (!a || !id || p.atmAuth !== a.id) return;
    sum = Math.floor(Number(sum) || 0);
    if (sum <= 0 || sum > 50000000) return sendAtm(p, a, { err: 'Неверная сумма' });
    const m = getMoney(p), b = getBank(p);
    const ownerCut = function (fee) {
        if (!a.owner || fee <= 0) return;
        a.balance += fee; a.earned += fee;
        q('UPDATE atms SET balance = balance + ?, earned = earned + ? WHERE id = ?', [fee, fee, a.id]);
        bizLog('atm', a.id, 'Комиссия со снятия — ' + holder(p), fee);
    };
    if (op === 'wd') {
        const fee = a.owner && a.owner !== id ? Math.ceil(sum * a.fee / 100) : 0;
        if (b < sum + fee) return sendAtm(p, a, { err: 'Недостаточно средств' + (fee ? ' (комиссия $' + fee + ')' : '') });
        setMB(p, m + sum, b - sum - fee);
        ownerCut(fee);
        tx(id, 'wd', -(sum + fee), 'Снятие наличных' + (fee ? ', комиссия $' + fee : ''));
        return sendAtm(p, a, { ok: 'Выдано $' + sum + (fee ? '. Комиссия $' + fee : ''), cash: sum });
    }
    if (op === 'dep') {
        if (m < sum) return sendAtm(p, a, { err: 'Недостаточно наличных' });
        setMB(p, m - sum, b + sum);
        tx(id, 'dep', sum, 'Пополнение наличными');
        return sendAtm(p, a, { ok: 'Зачислено $' + sum });
    }
    if (op === 'send') {
        const num = String(target || '').replace(/\D/g, '');
        if (num.length < 6) return sendAtm(p, a, { err: 'Введите номер карты или телефона' });
        let to = null;
        if (num.length === 16) {
            const r = await q('SELECT owner_id FROM bank_cards WHERE REPLACE(number, " ", "") = ? LIMIT 1', [num]);
            if (r[0]) to = Number(r[0].owner_id);
        } else {
            const ph = num.slice(0, 3) + '-' + num.slice(3, 6);
            const tk = store._numbers[ph];
            if (tk && tk[0] === 'a') to = Number(tk.slice(1));
        }
        if (!to) return sendAtm(p, a, { err: 'Получатель не найден' });
        if (to === id) return sendAtm(p, a, { err: 'Нельзя перевести самому себе' });
        if (b < sum) return sendAtm(p, a, { err: 'Недостаточно средств' });
        setMB(p, m, b - sum);
        const nm = holder(p);
        await payTo(to, sum, p, nm);
        tx(id, 'out', -sum, 'Перевод на ' + (num.length === 16 ? '*' + num.slice(-4) : String(target)));
        return sendAtm(p, a, { ok: 'Переведено $' + sum });
    }
});

mp.events.add('srv:atm:pinchange', async function (p, oldPin, newPin) {
    const a = nearAtm(p, p.atmId);
    const id = accId(p);
    if (!a || !id || p.atmAuth !== a.id) return;
    const c = await cardOf(id);
    if (!c || c.pin !== String(oldPin)) return sendAtm(p, a, { err: 'Старый PIN неверный' });
    if (!/^\d{4}$/.test(String(newPin))) return sendAtm(p, a, { err: 'Новый PIN — 4 цифры' });
    await q('UPDATE bank_cards SET pin = ? WHERE owner_id = ?', [String(newPin), id]);
    sendAtm(p, a, { ok: 'PIN-код изменён' });
});

mp.events.add('srv:atm:biz', async function (p, act, val) {
    const a = nearAtm(p, p.atmId);
    const id = accId(p);
    if (!a || !id) return;
    if (act === 'buy') {
        if (a.owner) return sendAtm(p, a, { err: 'Банкомат уже принадлежит другому' });
        const b = getBank(p);
        if (b < a.price) return sendAtm(p, a, { err: 'Нужно $' + a.price + ' на карте' });
        setMB(p, getMoney(p), b - a.price);
        govAdd(a.price, 'Продажа бизнеса: ' + a.name + ' → ' + holder(p));
        a.owner = id; a.ownerName = holder(p);
        await q('UPDATE atms SET owner_id = ?, balance = 0 WHERE id = ?', [id, a.id]);
        tx(id, 'biz', -a.price, 'Покупка: ' + a.name);
        return sendAtm(p, a, { ok: 'Поздравляем! Банкомат ваш' });
    }
    if (a.owner !== id) return;
    if (act === 'collect') {
        const s = a.balance;
        if (s <= 0) return sendAtm(p, a, { err: 'Касса пуста' });
        a.balance = 0;
        await q('UPDATE atms SET balance = 0 WHERE id = ?', [a.id]);
        setMB(p, getMoney(p), getBank(p) + s);
        tx(id, 'biz', s, 'Доход: ' + a.name);
        return sendAtm(p, a, { ok: 'Доход $' + s + ' переведён на карту' });
    }
    if (act === 'fee') {
        const f = Math.max(0, Math.min(5, Math.round(Number(val) * 2) / 2));
        a.fee = f;
        await q('UPDATE atms SET fee = ? WHERE id = ?', [f, a.id]);
        return sendAtm(p, a, { ok: 'Комиссия: ' + f + '%' });
    }
    if (act === 'sell') {
        if (global.Realty && global.Realty.locked('biz', 'atm:' + a.id)) return sendAtm(p, a, { err: 'Банкомат выставлен на аукцион' });
        const qt = sellQuote(a);
        a.owner = null; a.ownerName = null; a.balance = 0;
        await q('UPDATE atms SET owner_id = NULL, balance = 0 WHERE id = ?', [a.id]);
        setMB(p, getMoney(p), getBank(p) + qt.get);
        tx(id, 'biz', qt.get, 'Продажа гос-ву: ' + a.name);
        govAdd(qt.tax, 'Налог с продажи: ' + a.name + ' (' + qt.rate + '%)');
        p.atmAuth = null;
        return sendAtm(p, a, { ok: 'Продано за $' + qt.get + '. Налог $' + qt.tax + ' — в казну' });
    }
});

mp.events.add('srv:atm:close', function (p) { p.atmAuth = null; p.atmId = null; });

function admCan(p, n) { if (adminLvl(p) >= n) return true; notify(p, 'error', 'Недостаточно прав'); return false; }
mp.events.addCommand('atmadd', async function (p, full2) {
    if (!admCan(p, 5)) return;
    const pos = p.position;
    await q('INSERT INTO atms (name, x, y, z) VALUES (?, ?, ?, ?)', [String(full2 || '').trim() || 'Банкомат', pos.x, pos.y, pos.z]);
    await loadAtms();
    notify(p, 'ok', 'Банкомат создан. Всего: ' + ATMS.length);
});
mp.events.addCommand('atmdel', async function (p, full2, id) {
    if (!admCan(p, 5)) return;
    let a = atmOf(id);
    if (!a) { let bd = 4; ATMS.forEach(function (x) { const d = dist(p.position, x); if (d < bd) { bd = d; a = x; } }); }
    if (!a) return notify(p, 'error', '/atmdel [id] или встаньте у банкомата');
    await q('DELETE FROM atms WHERE id = ?', [a.id]);
    await loadAtms();
    notify(p, 'ok', 'Банкомат #' + a.id + ' удалён');
});
mp.events.addCommand('atmset', async function (p, full2, id, field, val) {
    if (!admCan(p, 5)) return;
    const a = atmOf(id);
    const map = { price: 'price', fee: 'fee', name: 'name', balance: 'balance' };
    if (!a || !map[field]) return p.outputChatBox('!{#ffc93c}/atmset [id] [price|fee|name|balance] [значение]');
    await q('UPDATE atms SET ' + map[field] + ' = ? WHERE id = ?', [field === 'name' ? String(val) : Number(val) || 0, a.id]);
    await loadAtms();
    notify(p, 'ok', 'Банкомат #' + a.id + ': ' + field + ' = ' + val);
});
mp.events.addCommand('atmowner', async function (p, full2, id, pid) {
    if (!admCan(p, 5)) return;
    const a = atmOf(id);
    if (!a) return p.outputChatBox('!{#ffc93c}/atmowner [id банкомата] [id игрока или 0]');
    let owner = null;
    if (pid && pid !== '0') { const t = mp.players.at(Number(pid)); if (!t || !accId(t)) return notify(p, 'error', 'Игрок не найден'); owner = accId(t); }
    await q('UPDATE atms SET owner_id = ? WHERE id = ?', [owner, a.id]);
    await loadAtms();
    notify(p, 'ok', 'Владелец банкомата #' + a.id + ' изменён');
});
mp.events.addCommand('atmlist', function (p) {
    if (!admCan(p, 3)) return;
    ATMS.slice(0, 50).forEach(function (a) { p.outputChatBox('#' + a.id + ' ' + a.name + ' | ' + (a.ownerName || 'гос.') + ' | ' + a.fee + '% | касса $' + a.balance); });
});
mp.events.addCommand('cardunblock', async function (p, full2, pid) {
    if (!admCan(p, 3)) return;
    const t = mp.players.at(Number(pid));
    if (!t || !accId(t)) return notify(p, 'error', '/cardunblock [id]');
    await q('UPDATE bank_cards SET tries = 0, blocked_until = 0 WHERE owner_id = ?', [accId(t)]);
    notify(p, 'ok', 'Карта разблокирована'); notify(t, 'ok', 'Ваша карта разблокирована');
});

global.AtmSystem = {
    list: function () { return ATMS; }, reload: loadAtms,
    admin: async function (p, d) {
        if (d.kind === 'fuel') return global.FuelSystem.admin(p, d);
        if (d.kind === 'shop' || d.kind === 'gun') return global.ShopSystem.admin(p, d);
        const a = atmOf(d.atm);
        if (d.op === 'add') {
            const pos = p.position;
            await q('INSERT INTO atms (name, x, y, z, price) VALUES (?, ?, ?, ?, ?)', [String(d.name || '').trim().slice(0, 48) || 'Банкомат', pos.x, pos.y, pos.z, Math.max(0, Number(d.price) || 150000)]);
            await loadAtms();
            return 'Банкомат создан';
        }
        if (!a) throw new Error('Банкомат не найден');
        if (d.op === 'tp') { p.position = new mp.Vector3(a.x + 1, a.y, a.z); return 'Телепорт к #' + a.id; }
        if (d.op === 'del') { await q('DELETE FROM atms WHERE id = ?', [a.id]); await loadAtms(); return 'Банкомат #' + a.id + ' удалён'; }
        if (d.op === 'price') { await q('UPDATE atms SET price = ? WHERE id = ?', [Math.max(0, Number(d.value) || 0), a.id]); await loadAtms(); return 'Цена изменена'; }
        if (d.op === 'owner') {
            let owner = null;
            if (Number(d.pid) >= 0) { const t = mp.players.at(Number(d.pid)); if (!t || !accId(t)) throw new Error('Игрок не найден'); owner = accId(t); }
            await q('UPDATE atms SET owner_id = ?, balance = 0 WHERE id = ?', [owner, a.id]);
            await loadAtms();
            return owner ? 'Владелец назначен' : 'Банкомат изъят у владельца';
        }
        throw new Error('Неизвестное действие');
    }
};

function govStrip(p, keys) {
    const d = data(p);
    let n = 0;
    keys.forEach(function (k) {
        if (p.uiWeapon && p.uiWeapon.k === k) { try { p.removeWeapon(p.uiWeapon.hash); } catch (e) {} p.uiWeapon = null; }
        n += takeAll(d, k);
        Object.keys(d.equip).forEach(function (s) { if (d.equip[s] && d.equip[s].k === k) { d.equip[s] = null; n++; if (s === 'armour') p.armour = 0; } });
    });
    mark();
    return n;
}
function redress(p) {
    if (!mp.players.exists(p) || !accId(p)) return;
    const d = data(p);
    SLOTS.forEach(function (s) { if (s !== 'armour' && s !== 'phone') applyCloth(p, s, d.equip[s] || null); });
}
global.UiPhone = { data: data, store: store, mark: mark, sendPhone: sendPhone, sendMenu: sendMenu, key: key, online: online };
function driveCats(p) { const x = docList(data(p)).find(function (z) { return z.t === 'drive'; }); return x ? (x.cats || ['A', 'B', 'C', 'D']) : []; }
function addDriveCat(p, cat, by) {
    const have = driveCats(p).slice();
    if (have.indexOf(cat) < 0) have.push(cat);
    if (cat === 'B' && have.indexOf('A') < 0) have.unshift('A');
    have.sort();
    giveDoc(p, 'drive', { cats: have }, by);
    return have;
}
function invScan(p) {
    const d = data(p), out = {};
    d.inv.forEach(function (x) { if (x && ITEMS[x.k]) out[x.k] = (out[x.k] || 0) + x.c; });
    Object.keys(d.equip).forEach(function (s) { const x = d.equip[s]; if (x && ITEMS[x.k]) out[x.k] = (out[x.k] || 0) + 1; });
    return out;
}
function takeItems(p, k, n) {
    const d = data(p);
    let left = n;
    for (let i = 0; i < INV_SIZE && left > 0; i++) { const x = d.inv[i]; if (x && x.k === k) { const t = Math.min(left, x.c); x.c -= t; left -= t; if (x.c <= 0) d.inv[i] = null; } }
    mark(); sendInv(p);
    return n - left;
}
global.UiSystem = { invScan: invScan, takeItems: takeItems, sendInv: sendInv, driveCats: driveCats, addDriveCat: addDriveCat, addCoins: addCoins, coinsOf: function (p) { return data(p).coins || 0; }, showDoc: function (from, to, t) { const l = docList(data(from)); const i = l.findIndex(function (x) { return x.t === t; }); if (i < 0) return false; sendDocs(to, from, i); return true; }, takeDoc: function (p, t) { const l = docList(data(p)); for (let i = l.length - 1; i >= 0; i--) if (l[i].t === t) l.splice(i, 1); mark(); }, setOwner: function (v, id) { v.setVariable('ownerId', id); }, giveDoc: function (p, t, opt, by) { return giveDoc(p, t, opt, by); }, hasDoc: function (p, t, f) { return hasDoc(data(p), t, f); }, addItem: addItem, countItem: function (p, k) { return countItem(data(p), k); }, ITEMS: ITEMS, govStrip: govStrip, redress: redress, docsOf: function (k) { const d = store[k]; return d ? docList(d) : []; }, phoneOf: function (k) { return store[k] ? store[k].phone : null; }, sidByPhone: function (n) { const k = store._numbers[n]; return k && k[0] === 'a' ? Number(k.slice(1)) : 0; } };

console.log('[ui] инвентарь, телефон и меню загружены. Предметов в каталоге: ' + Object.keys(ITEMS).length);

module.exports = global.UiSystem;

mp.events.addCommand('uicheck', function (p) {
    p.outputChatBox('!{#8fd14f}[UI] Серверный модуль работает. Аккаунт: ' + (accId(p) ? '#' + accId(p) : 'не найден, данные по нику'));
});

/* ================= GOV TREASURY ================= */
const GOV = { balance: 0, tax: 30, ready: false };
async function govInit() {
    if (!db) return;
    await q(`CREATE TABLE IF NOT EXISTS gov_treasury (id INT PRIMARY KEY, balance BIGINT NOT NULL DEFAULT 0, sell_tax INT NOT NULL DEFAULT 30) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await q(`CREATE TABLE IF NOT EXISTS gov_tx (id INT AUTO_INCREMENT PRIMARY KEY, amount BIGINT NOT NULL, text VARCHAR(140) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await q('INSERT IGNORE INTO gov_treasury (id, balance, sell_tax) VALUES (1, 0, 30)');
    const r = await q('SELECT balance, sell_tax FROM gov_treasury WHERE id = 1');
    if (r[0]) { GOV.balance = Number(r[0].balance) || 0; GOV.tax = Number(r[0].sell_tax); }
    GOV.ready = true;
}
setTimeout(function () { govInit().catch(function (e) { console.log('[gov] ' + e.message); }); }, 1500);
function govAdd(amount, text) {
    amount = Math.floor(amount);
    if (!amount) return;
    GOV.balance += amount;
    q('UPDATE gov_treasury SET balance = balance + ? WHERE id = 1', [amount]);
    q('INSERT INTO gov_tx (amount, text) VALUES (?, ?)', [amount, String(text).slice(0, 140)]);
}
function sellQuote(b) {
    const tax = Math.floor(b.price * GOV.tax / 100);
    return { price: b.price, tax: tax, rate: GOV.tax, get: b.price - tax + (b.balance || 0) };
}
global.GovSystem = {
    get: function () { return { balance: GOV.balance, tax: GOV.tax }; },
    add: govAdd,
    setTax: function (t) { GOV.tax = Math.max(0, Math.min(90, Math.round(Number(t) || 0))); q('UPDATE gov_treasury SET sell_tax = ? WHERE id = 1', [GOV.tax]); return GOV.tax; },
    history: function () { return q('SELECT amount, text, created_at FROM gov_tx ORDER BY id DESC LIMIT 40'); },
    withdraw: function (n, who) { n = Math.floor(Number(n) || 0); if (n <= 0 || n > GOV.balance) return false; govAdd(-n, 'Списание: ' + who); return true; }
};
mp.events.addCommand('treasury', function (p) {
    p.outputChatBox('!{#f2c25a}[Казна] Бюджет штата: $' + GOV.balance.toLocaleString('ru-RU') + ' · налог при продаже бизнеса: ' + GOV.tax + '%');
});

/* ================= FUEL ================= */
const FUEL_MAX = 100;
const FUEL_PRICE = 3;
const WHOLESALE = 1;
const STATION_SEED = [
    [49.42, 2778.79, 58.04], [263.89, 2606.46, 44.98], [1039.96, 2671.13, 39.55], [1207.26, 2660.18, 37.90],
    [2539.69, 2594.19, 37.94], [2679.86, 3263.95, 55.24], [2005.06, 3773.89, 32.40], [1687.16, 4929.39, 42.08],
    [1701.31, 6416.03, 32.76], [179.86, 6602.84, 31.87], [-94.46, 6419.59, 31.49], [-2555.00, 2334.40, 33.08],
    [-1800.38, 803.66, 138.65], [-1437.62, -276.75, 46.21], [-2096.24, -320.29, 13.17], [-724.62, -935.16, 19.21],
    [-526.02, -1211.00, 18.18], [-70.21, -1761.79, 29.53], [265.65, -1261.31, 29.29], [819.65, -1028.85, 26.40],
    [1208.95, -1402.57, 35.22], [1181.38, -330.85, 69.32], [620.84, 269.10, 103.09], [2581.32, 362.04, 108.47],
    [176.63, -1562.03, 29.26], [-319.29, -1471.72, 30.55], [1784.32, 3330.55, 41.25]
];
let STATIONS = [];
const stBlips = {};

const FUEL_TYPES = {
    ai92: { n: 'АИ-92', price: 2, c: '#3fbf5f' },
    ai95: { n: 'АИ-95', price: 3, c: '#f2b632' },
    ai98: { n: 'АИ-98', price: 4, c: '#e63950' },
    diesel: { n: 'Дизель', price: 2.5, c: '#4a9cff' }
};

async function fuelInit() {
    if (!db) return console.log('[fuel] нет базы — АЗС без склада');
    await q(`CREATE TABLE IF NOT EXISTS fuel_stations (
        id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(48) NOT NULL DEFAULT 'АЗС',
        x FLOAT NOT NULL, y FLOAT NOT NULL, z FLOAT NOT NULL,
        bx FLOAT NULL, by_ FLOAT NULL, bz FLOAT NULL,
        owner_id INT NULL, price INT NOT NULL DEFAULT 250000, markup INT NOT NULL DEFAULT 100,
        stock INT NOT NULL DEFAULT 2500, max_stock INT NOT NULL DEFAULT 5000,
        balance BIGINT NOT NULL DEFAULT 0, earned BIGINT NOT NULL DEFAULT 0, sold BIGINT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await q(`CREATE TABLE IF NOT EXISTS fuel_orders (
        id INT AUTO_INCREMENT PRIMARY KEY, station_id INT NOT NULL, liters INT NOT NULL, cost INT NOT NULL,
        status VARCHAR(12) NOT NULL DEFAULT 'pending', driver_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, done_at TIMESTAMP NULL,
        INDEX idx_st (station_id), INDEX idx_status (status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await q(`CREATE TABLE IF NOT EXISTS biz_log (
        id INT AUTO_INCREMENT PRIMARY KEY, kind VARCHAR(8) NOT NULL, biz_id INT NOT NULL,
        text VARCHAR(120) NOT NULL, amount INT NOT NULL DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_biz (kind, biz_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    const c = await q('SELECT COUNT(*) AS n FROM fuel_stations');
    if (c[0] && Number(c[0].n) === 0) {
        for (let i = 0; i < STATION_SEED.length; i++) {
            const st = STATION_SEED[i];
            await q('INSERT INTO fuel_stations (name, x, y, z, stock) VALUES (?, ?, ?, ?, ?)', ['АЗС #' + (i + 1), st[0], st[1], st[2], 1500 + Math.floor(Math.random() * 2500)]);
        }
        console.log('[fuel] создано АЗС: ' + STATION_SEED.length);
    }
    await loadStations();
}
async function loadStations() {
    const rows = await q('SELECT s.*, a.nick AS owner_nick, a.login AS owner_login FROM fuel_stations s LEFT JOIN accounts a ON a.id = s.owner_id ORDER BY s.id');
    if (!rows.length && !STATIONS.length) {
        STATIONS = STATION_SEED.map(function (st, i) { return { id: i + 1, name: 'АЗС #' + (i + 1), x: st[0], y: st[1], z: st[2], bx: st[0], by: st[1], bz: st[2], owner: null, ownerName: null, price: 250000, markup: 100, stock: 999999, max: 999999, balance: 0, earned: 0, sold: 0, nodb: true }; });
    } else if (rows.length) {
        STATIONS = rows.map(function (r) {
            return { id: r.id, name: r.name, x: Number(r.x), y: Number(r.y), z: Number(r.z),
                bx: r.bx !== null ? Number(r.bx) : null, by: r.by_ !== null ? Number(r.by_) : null, bz: r.bz !== null ? Number(r.bz) : null,
                owner: r.owner_id ? Number(r.owner_id) : null, ownerName: r.owner_nick || r.owner_login || null,
                price: Number(r.price) || 0, markup: Number(r.markup) || 100, stock: Number(r.stock) || 0, max: Number(r.max_stock) || 5000,
                balance: Number(r.balance) || 0, earned: Number(r.earned) || 0, sold: Number(r.sold) || 0 };
        });
    }
    STATIONS.forEach(function (st) {
        if (st.bx !== null && st.bx !== undefined) return;
        const pt = fuelBizPoint(st);
        st.bx = pt.x; st.by = pt.y; st.bz = pt.z;
        if (!st.nodb) q('UPDATE fuel_stations SET bx = ?, by_ = ?, bz = ? WHERE id = ?', [pt.x, pt.y, pt.z, st.id]);
    });
    Object.keys(stBlips).forEach(function (k) { try { stBlips[k].destroy(); } catch (e) {} delete stBlips[k]; });
    STATIONS.forEach(function (st) {
        stBlips[st.id] = mp.blips.new(361, new mp.Vector3(st.x, st.y, st.z), { dimension: 4294967295, name: st.name, color: st.stock <= 0 ? 40 : 1, shortRange: true, scale: 0.8 });
    });
    mp.players.forEach(sendBizPoints);
}
/* кассы магазинов при заправках — точка бизнеса АЗС ставится у входа в здание */
const STATION_STORES = [
    [1163.37, -323.80, 69.21], [-48.52, -1757.51, 29.42], [-707.50, -914.26, 19.22], [-1820.52, 792.52, 138.12],
    [1698.39, 4924.40, 42.06], [1729.22, 6414.13, 35.04], [2678.92, 3280.67, 55.24], [2557.46, 382.28, 108.62],
    [1961.46, 3740.67, 32.34], [547.43, 2671.71, 42.16], [1166.02, 2708.93, 38.16], [-3038.94, 585.95, 7.91],
    [25.72, -1346.97, 29.50], [373.88, 325.90, 103.57], [-3241.93, 1001.46, 12.83], [1135.81, -982.28, 46.42]
];
function fuelBizPoint(st) {
    let best = null, bd = 75;
    STATION_STORES.forEach(function (s) { const d = dist({ x: s[0], y: s[1], z: s[2] }, st); if (d < bd) { bd = d; best = s; } });
    if (!best) return { x: st.x + 6, y: st.y + 6, z: st.z };
    const dx = st.x - best[0], dy = st.y - best[1], len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: best[0] + dx / len * 6.5, y: best[1] + dy / len * 6.5, z: best[2] };
}
function stationOf(id) { return STATIONS.find(function (s) { return s.id === Number(id); }) || null; }
function allBizPoints() {
    const out = STATIONS.map(function (s) { return ['fuel', s.id, s.bx, s.by, s.bz, s.name, s.owner ? 0 : 1]; });
    (typeof SHOPS !== 'undefined' ? SHOPS : []).forEach(function (s) { out.push([s.kind, s.id, s.x, s.y, s.z, s.name, s.owner ? 0 : 1]); });
    return out;
}
function sendBizPoints(p) {
    if (!mp.players.exists(p)) return;
    p.call('fuel:list', [JSON.stringify(STATIONS.map(function (s) { return [s.id, s.x, s.y, s.z]; }))]);
    p.call('biz:points', [JSON.stringify(allBizPoints())]);
}
mp.events.add('playerReady', function (p) { setTimeout(function () { sendBizPoints(p); }, 3200); });
mp.events.add('srv:biz:points', function (p) { sendBizPoints(p); });
setTimeout(function () { fuelInit().catch(function (e) { console.log('[fuel] init: ' + e.message); loadStations(); }); }, 2000);

function bizLog(kind, id, text, amount) { q('INSERT INTO biz_log (kind, biz_id, text, amount) VALUES (?, ?, ?, ?)', [kind, id, String(text).slice(0, 120), Math.floor(amount || 0)]); }
function saveStation(st, fields) {
    if (st.nodb) return;
    const map = { stock: 'stock', balance: 'balance', earned: 'earned', sold: 'sold', markup: 'markup', owner: 'owner_id', name: 'name', price: 'price', max: 'max_stock' };
    const cols = fields.map(function (f) { return map[f] + ' = ?'; }).join(', ');
    q('UPDATE fuel_stations SET ' + cols + ' WHERE id = ?', fields.map(function (f) { return st[f]; }).concat([st.id]));
}
function deficit(st) { return st.stock <= st.max * 0.2; }
function priceOf(st, type) {
    const base = FUEL_TYPES[type].price;
    let k = st.owner ? st.markup / 100 : (deficit(st) ? 1.5 : 1);
    return Math.round(base * k * 100) / 100;
}

function fuelOf(v) {
    let f = v.getVariable('fuel');
    if (f === undefined || f === null) { f = 60 + Math.floor(Math.random() * 41); v.setVariable('fuel', f); }
    return Number(f) || 0;
}
function setFuel(v, f) {
    f = Math.max(0, Math.min(FUEL_MAX, Math.round(f * 10) / 10));
    v.setVariable('fuel', f);
    if (f <= 0) v.engine = false;
}
function nearStation(pos) {
    let best = -1, bd = 45;
    for (let i = 0; i < STATIONS.length; i++) {
        const d = dist(pos, STATIONS[i]);
        if (d < bd) { bd = d; best = i; }
    }
    return best;
}

setInterval(function () {
    mp.vehicles.forEach(function (v) {
        if (!mp.vehicles.exists(v)) return;
        const f = fuelOf(v);
        if (!v.engine) return;
        const occ = v.getOccupants ? v.getOccupants() : [];
        if (!occ.length) return;
        const vel = v.velocity || { x: 0, y: 0, z: 0 };
        const sp = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
        const use = 0.01 + sp * 0.0045;
        setFuel(v, f - use);
        if (f > 10 && f - use <= 10) occ.forEach(function (x) { notify(x, 'warn', 'Мало бензина! Найдите заправку (значок на карте)'); });
        if (f - use <= 0) occ.forEach(function (x) { notify(x, 'error', 'Бензин закончился'); });
    });
}, 2000);

/* государственные АЗС медленно пополняются, частные — только поставками */
setInterval(function () {
    STATIONS.forEach(function (st) {
        if (st.owner || st.nodb) return;
        if (st.stock >= st.max * 0.45) return;
        st.stock = Math.min(st.max, st.stock + 250);
        saveStation(st, ['stock']);
    });
}, 10 * 60000);

/* поставки: пока нет дальнобойщиков — их везёт «гос. логистика» через 6 минут */
setInterval(async function () {
    const mins = global.TruckerSystem && global.TruckerSystem.active ? 20 : 6;
    const rows = await q("SELECT * FROM fuel_orders WHERE status = 'pending' AND created_at < (NOW() - INTERVAL " + mins + " MINUTE) LIMIT 20");
    for (const r of rows) await deliverOrder(r.id, null);
}, 60000);

async function deliverOrder(orderId, driverAcc) {
    const r = (await q('SELECT * FROM fuel_orders WHERE id = ? LIMIT 1', [orderId]))[0];
    if (!r || r.status === 'done' || r.status === 'cancel') return false;
    const st = stationOf(r.station_id);
    if (!st) { await q("UPDATE fuel_orders SET status = 'cancel' WHERE id = ?", [orderId]); return false; }
    const add = Math.min(Number(r.liters), st.max - st.stock);
    st.stock += Math.max(0, add);
    saveStation(st, ['stock']);
    await q("UPDATE fuel_orders SET status = 'done', driver_id = ?, done_at = NOW() WHERE id = ?", [driverAcc, orderId]);
    bizLog('fuel', st.id, 'Поставка топлива: +' + add + ' л', 0);
    if (st.owner) {
        const op = mp.players.toArray().find(function (x) { return accId(x) === st.owner; });
        if (op) notify(op, 'ok', st.name + ': доставлено ' + add + ' л топлива');
    }
    if (stBlips[st.id]) try { stBlips[st.id].color = st.stock <= 0 ? 40 : 1; } catch (e) {}
    return true;
}

/* ---------- авиа и военные заправки ---------- */
const AIR_MODELS = ['buzzard', 'buzzard2', 'frogger', 'frogger2', 'maverick', 'polmav', 'swift', 'swift2', 'supervolito', 'supervolito2', 'volatus', 'annihilator', 'annihilator2', 'cargobob', 'cargobob2', 'cargobob3', 'cargobob4', 'valkyrie', 'valkyrie2', 'savage', 'hunter', 'akula', 'havok', 'seasparrow', 'seasparrow2', 'seasparrow3', 'conada', 'skylift', 'sparrow',
    'cuban800', 'duster', 'mammatus', 'velum', 'velum2', 'dodo', 'luxor', 'luxor2', 'shamal', 'nimbus', 'vestra', 'miljet', 'besra', 'lazer', 'hydra', 'titan', 'cargoplane', 'jet', 'stunt', 'mogul', 'molotok', 'nokota', 'pyro', 'rogue', 'starling', 'seabreeze', 'tula', 'howard', 'alphaz1', 'microlight', 'bombushka', 'volatol', 'avenger', 'avenger2', 'strikeforce', 'blimp', 'blimp2', 'blimp3', 'alkonost', 'streamer216', 'raiju', 'avenger3', 'avenger4'];
const AIR_H = {};
AIR_MODELS.forEach(function (m) { AIR_H[mp.joaat(m) >>> 0] = m; });
function isAir(v) { return !!AIR_H[Number(v.model) >>> 0]; }
function isArmyVeh(v) { return v.getVariable('gov') === 'army' || v.getVariable('faction') === 'army'; }
const PAD_FILE = path.join(__dirname, 'fuel_pads.json');
const PAD_DEF = [
    { t: 'air', n: 'Аэропорт LSIA · ангары', x: -1247.0, y: -3358.0, z: 13.9, r: 30 },
    { t: 'air', n: 'Аэропорт LSIA · вертолётные площадки', x: -1112.0, y: -2884.0, z: 13.9, r: 20 },
    { t: 'air', n: 'Аэродром Sandy Shores', x: 1735.0, y: 3295.0, z: 41.1, r: 30 },
    { t: 'air', n: 'Аэродром McKenzie (Grapeseed)', x: 2134.0, y: 4783.0, z: 40.9, r: 30 },
    { t: 'air', n: 'Вертодром Vespucci', x: -724.6, y: -1444.0, z: 5.0, r: 20 },
    { t: 'air', n: 'Крыша больницы Pillbox', x: 351.6, y: -588.0, z: 74.2, r: 12 },
    { t: 'air', n: 'Крыша LSPD Mission Row', x: 449.4, y: -981.2, z: 43.7, r: 12 },
    { t: 'army', n: 'Форт Занкудо · автопарк', x: -2160.0, y: 3235.0, z: 32.8, r: 15 },
    { t: 'army', n: 'Форт Занкудо · вертолётные площадки', x: -1877.0, y: 2805.0, z: 32.8, r: 25 },
    { t: 'army', n: 'Форт Занкудо · ангары авиации', x: -2022.0, y: 2856.0, z: 32.8, r: 35 }
];
let PADS = (function () { try { const j = JSON.parse(fs.readFileSync(PAD_FILE, 'utf8')); return Array.isArray(j) && j.length ? j : null; } catch (e) { return null; } })() || PAD_DEF.slice();
function savePads() { try { fs.writeFileSync(PAD_FILE, JSON.stringify(PADS)); } catch (e) {} }
const KEROSENE = { k: 'kero', n: 'Авиакеросин', price: 5, c: '#9b6bff' };
function padNear(pos) {
    let best = null, bd = 1e9;
    PADS.forEach(function (pd) { const d = Math.hypot(pos.x - pd.x, pos.y - pd.y); if (d <= (pd.r || 15) && Math.abs(pos.z - pd.z) < 15 && d < bd) { bd = d; best = pd; } });
    return best;
}
function sendPads(p) { p.call('fuel:pads', [JSON.stringify(PADS.map(function (x) { return [x.t, x.x, x.y, x.z, x.n, x.r || 15]; }))]); }
mp.events.add('playerReady', function (p) { setTimeout(function () { if (mp.players.exists(p)) sendPads(p); }, 5000); });
setTimeout(function () { mp.players.forEach(sendPads); }, 4000);
function padRule(p, v, pd) {
    const army = isArmyVeh(v), air = isAir(v);
    if (pd.t === 'army') {
        if (!army) return 'Военная заправка — только для военной техники';
        return null;
    }
    if (army) return 'Военная техника заправляется только на военной базе (Форт Занкудо) — бесплатно';
    if (!air) return 'Это авиазаправка. Наземный транспорт заправляется на обычных АЗС';
    return null;
}
mp.events.add('srv:afuel:open', function (p) {
    const v = p.vehicle;
    if (!v || (p.seat !== 0 && p.seat !== -1)) return;
    const pd = padNear(v.position);
    if (!pd) return notify(p, 'error', 'Рядом нет авиа- или военной заправки');
    const why = padRule(p, v, pd);
    if (why) return notify(p, 'error', why);
    const free = pd.t === 'army';
    p.afPad = pd;
    p.call('ui:fuelOpen');
    setTimeout(function () {
        if (!mp.players.exists(p) || !p.vehicle) return;
        p.call('ui:data', ['fuel', JSON.stringify({
            fuel: Math.floor(fuelOf(v)), max: FUEL_MAX, money: getMoney(p), bank: getBank(p), cur: free ? 'mil' : 'kero',
            station: { name: pd.n, stock: null, owner: free ? 'Министерство обороны · бесплатно' : 'Авиазаправка' },
            types: [free ? { k: 'mil', n: 'Военное топливо', price: 0, c: '#6b8f3f' } : { k: 'kero', n: KEROSENE.n, price: KEROSENE.price, c: KEROSENE.c }]
        })]);
    }, 250);
});
function padBuy(p, v, pd, liters, pay) {
    const why = padRule(p, v, pd);
    if (why) return notify(p, 'error', why);
    const free = pd.t === 'army';
    const f = fuelOf(v);
    const l = Math.min(Math.floor(Number(liters) || 0), Math.floor(FUEL_MAX - f));
    if (l <= 0) return notify(p, 'warn', 'Бак и так полный');
    const cost = free ? 0 : Math.ceil(l * KEROSENE.price);
    if (cost) {
        if (pay === 'card') {
            const b = getBank(p);
            if (b < cost) return notify(p, 'error', 'На карте недостаточно средств');
            setMB(p, getMoney(p), b - cost);
            tx(accId(p), 'out', -cost, 'Авиатопливо: ' + pd.n);
        } else {
            const m = getMoney(p);
            if (m < cost) return notify(p, 'error', 'Недостаточно наличных');
            setMB(p, m - cost, getBank(p));
        }
        govAdd(cost, 'Авиатопливо: ' + pd.n);
    }
    v.engine = false;
    setFuel(v, f + l);
    v.setVariable('fuelType', free ? 'mil' : 'kero');
    p.call('ui:fuelDone');
    p.afPad = null;
    notify(p, 'ok', 'Заправлено ' + l + ' л' + (free ? ' (бесплатно, за счёт армии)' : ' авиакеросина за $' + cost) + '. Заведите двигатель (Z)');
}
mp.events.addCommand('fuelpad', function (p, full) {
    const L = global.AdminSystem && global.AdminSystem.realLvl ? global.AdminSystem.realLvl(p) : 0;
    if (L < 7) return;
    const a = String(full || '').trim().split(/\s+/);
    const op = a[0];
    if (op === 'add' && (a[1] === 'air' || a[1] === 'army')) {
        const pos = p.vehicle ? p.vehicle.position : p.position;
        const r = Math.max(5, Math.min(60, Number(a[2]) || 15));
        PADS.push({ t: a[1], n: a.slice(3).join(' ') || (a[1] === 'army' ? 'Военная заправка' : 'Авиазаправка'), x: pos.x, y: pos.y, z: pos.z, r: r });
    } else if (op === 'del') {
        const pd = padNear(p.vehicle ? p.vehicle.position : p.position);
        if (!pd) return p.outputChatBox('!{#ffcc66}Рядом нет заправки');
        PADS = PADS.filter(function (x) { return x !== pd; });
    } else if (op === 'reset') PADS = PAD_DEF.slice();
    else if (op === 'list') { PADS.forEach(function (x, i) { p.outputChatBox('!{#7fd4ff}' + i + '. [' + x.t + '] ' + x.n + ' · r ' + x.r); }); return; }
    else return p.outputChatBox('!{#ffcc66}/fuelpad add [air/army] [радиус] [название] · /fuelpad del · /fuelpad list · /fuelpad reset');
    savePads(); mp.players.forEach(sendPads);
    p.outputChatBox('!{#8fd14f}Заправок: ' + PADS.length);
});

mp.events.add('srv:fuel:get', function (p) {
    const v = p.vehicle;
    if (p.afPad) return;
    const i = nearStation(p.position);
    if (!v || i < 0) return;
    const st = STATIONS[i];
    p.call('ui:data', ['fuel', JSON.stringify({
        fuel: Math.floor(fuelOf(v)), max: FUEL_MAX, money: getMoney(p), bank: getBank(p),
        cur: v.getVariable('fuelType') || 'ai92',
        station: { name: st.name, stock: st.nodb ? null : st.stock, maxStock: st.max, deficit: !st.nodb && deficit(st), owner: st.ownerName },
        types: Object.keys(FUEL_TYPES).map(function (k) { return { k: k, n: FUEL_TYPES[k].n, price: priceOf(st, k), c: FUEL_TYPES[k].c }; })
    })]);
});

mp.events.add('srv:fuel:buy', function (p, type, liters, pay) {
    const v = p.vehicle;
    if (!v) return notify(p, 'error', 'Вы не в машине');
    if (p.afPad) { const pd = padNear(v.position); if (pd === p.afPad) return padBuy(p, v, pd, liters, pay); p.afPad = null; return notify(p, 'error', 'Вы отъехали от заправки'); }
    if (isAir(v)) return notify(p, 'error', 'Самолёты и вертолёты заправляются только на аэродромах и вертолётных площадках');
    if (isArmyVeh(v)) return notify(p, 'error', 'Военная техника заправляется только на военной базе (Форт Занкудо) — бесплатно');
    const i = nearStation(p.position);
    if (i < 0) return notify(p, 'error', 'Рядом нет заправки');
    const st = STATIONS[i];
    const ft = FUEL_TYPES[type];
    if (!ft) return;
    if (st.stock <= 0) return notify(p, 'error', 'На этой АЗС закончилось топливо. Ждите поставку');
    const f = fuelOf(v);
    let l = Math.min(Math.floor(Number(liters) || 0), Math.floor(FUEL_MAX - f), st.stock);
    if (l <= 0) return notify(p, 'warn', 'Бак и так полный');
    const cost = Math.ceil(l * priceOf(st, type));
    if (pay === 'card') {
        const b = getBank(p);
        if (b < cost) return notify(p, 'error', 'На карте недостаточно средств');
        setMB(p, getMoney(p), b - cost);
        tx(accId(p), 'out', -cost, 'Топливо: ' + st.name);
    } else {
        const m = getMoney(p);
        if (m < cost) return notify(p, 'error', 'Недостаточно наличных');
        setMB(p, m - cost, getBank(p));
    }
    st.stock -= l; st.sold += l;
    if (st.owner) { st.balance += cost; st.earned += cost; }
    saveStation(st, st.owner ? ['stock', 'sold', 'balance', 'earned'] : ['stock', 'sold']);
    if (st.owner) bizLog('fuel', st.id, ft.n + ' ' + l + ' л — ' + holder(p), cost);
    else govAdd(cost, 'Продажа топлива: ' + st.name);
    v.engine = false;
    setFuel(v, f + l);
    v.setVariable('fuelType', type);
    p.call('ui:fuelDone');
    notify(p, 'ok', 'Заправлено ' + l + ' л ' + ft.n + ' за $' + cost + '. Заведите двигатель (Z)');
    if (st.stock <= 0) { notify(p, 'warn', 'Вы залили последние литры на этой АЗС'); if (stBlips[st.id]) try { stBlips[st.id].color = 40; } catch (e) {} }
});

mp.events.add('srv:fuel:refill', function (p) {
    if (!p.vehicle) return;
    p.afPad = null;
    if (isAir(p.vehicle)) return notify(p, 'error', 'Самолёты и вертолёты заправляются только на аэродромах и вертолётных площадках');
    if (isArmyVeh(p.vehicle)) return notify(p, 'error', 'Военная техника заправляется только на военной базе (Форт Занкудо) — бесплатно');
    const i = nearStation(p.position);
    if (i < 0) return notify(p, 'error', 'Рядом нет заправки');
    if (STATIONS[i].stock <= 0) return notify(p, 'error', STATIONS[i].name + ': топливо закончилось, ждите поставку');
    p.call('ui:fuelOpen');
});

/* ================= SHOPS: 24/7 и ОРУЖЕЙНЫЕ ================= */
const SHOP_CFG = {
    shop: { n: 'Магазин 24/7', blip: 52, color: 2, price: 120000, unitCost: 40, max: 2000, items: ['medkit', 'bandage', 'pills', 'canister', 'repair', 'lockpick', 'phone', 'gloves'] },
    gun: { n: 'Оружейный магазин', blip: 110, color: 1, price: 400000, unitCost: 300, max: 600, items: ['pistol', 'smg', 'knife', 'bat', 'ammo_pistol', 'ammo_smg', 'armour'] }
};
const SHOP_SEED = {
    shop: [[373.88, 325.90, 103.57], [2557.46, 382.28, 108.62], [-3038.94, 585.95, 7.91], [-3241.93, 1001.46, 12.83], [547.43, 2671.71, 42.16],
        [1961.46, 3740.67, 32.34], [2678.92, 3280.67, 55.24], [1729.22, 6414.13, 35.04], [25.72, -1346.97, 29.50], [1135.81, -982.28, 46.42],
        [-1222.92, -906.98, 12.33], [-1487.55, -379.11, 40.16], [-2968.24, 390.91, 15.04], [1166.02, 2708.93, 38.16], [1392.56, 3604.68, 34.98],
        [-48.52, -1757.51, 29.42], [1163.37, -323.80, 69.21], [-707.50, -914.26, 19.22], [-1820.52, 792.52, 138.12], [1698.39, 4924.40, 42.06]],
    gun: [[-662.18, -934.96, 21.83], [810.25, -2157.60, 29.62], [1693.44, 3760.16, 34.71], [-330.24, 6083.88, 31.45], [252.63, -50.00, 69.94],
        [22.09, -1107.28, 29.80], [2567.69, 294.38, 108.73], [-1117.58, 2698.61, 18.55], [842.44, -1033.42, 28.19]]
};
const GUN_NEEDS_LIC = ['pistol', 'smg'];
let SHOPS = [];
const shopBlips = {};

async function shopsInit() {
    if (!db) return console.log('[shops] нет базы');
    await q(`CREATE TABLE IF NOT EXISTS shops (
        id INT AUTO_INCREMENT PRIMARY KEY, kind VARCHAR(8) NOT NULL, name VARCHAR(48) NOT NULL,
        x FLOAT NOT NULL, y FLOAT NOT NULL, z FLOAT NOT NULL,
        owner_id INT NULL, price INT NOT NULL DEFAULT 120000, markup INT NOT NULL DEFAULT 100,
        stock INT NOT NULL DEFAULT 1000, max_stock INT NOT NULL DEFAULT 2000,
        balance BIGINT NOT NULL DEFAULT 0, earned BIGINT NOT NULL DEFAULT 0, sold BIGINT NOT NULL DEFAULT 0,
        disabled TEXT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_kind (kind)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await q(`CREATE TABLE IF NOT EXISTS shop_orders (
        id INT AUTO_INCREMENT PRIMARY KEY, shop_id INT NOT NULL, units INT NOT NULL, cost INT NOT NULL,
        status VARCHAR(12) NOT NULL DEFAULT 'pending', driver_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, done_at TIMESTAMP NULL, INDEX idx_shop (shop_id), INDEX idx_status (status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    for (const kind of Object.keys(SHOP_CFG)) {
        const c = await q('SELECT COUNT(*) AS n FROM shops WHERE kind = ?', [kind]);
        if (c[0] && Number(c[0].n) === 0) {
            const C = SHOP_CFG[kind];
            for (let i = 0; i < SHOP_SEED[kind].length; i++) {
                const s = SHOP_SEED[kind][i];
                await q('INSERT INTO shops (kind, name, x, y, z, price, stock, max_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [kind, (kind === 'gun' ? 'Ammu-Nation #' : '24/7 #') + (i + 1), s[0], s[1], s[2], C.price, Math.floor(C.max * 0.6), C.max]);
            }
            console.log('[shops] создано ' + C.n + ': ' + SHOP_SEED[kind].length);
        }
    }
    await loadShops();
}
async function loadShops() {
    const rows = await q('SELECT s.*, a.nick AS owner_nick, a.login AS owner_login FROM shops s LEFT JOIN accounts a ON a.id = s.owner_id ORDER BY s.id');
    SHOPS = rows.map(function (r) {
        let dis = [];
        try { dis = JSON.parse(r.disabled || '[]'); } catch (e) {}
        return { id: r.id, kind: r.kind, name: r.name, x: Number(r.x), y: Number(r.y), z: Number(r.z),
            owner: r.owner_id ? Number(r.owner_id) : null, ownerName: r.owner_nick || r.owner_login || null,
            price: Number(r.price) || 0, markup: Number(r.markup) || 100, stock: Number(r.stock) || 0, max: Number(r.max_stock) || 1000,
            balance: Number(r.balance) || 0, earned: Number(r.earned) || 0, sold: Number(r.sold) || 0, disabled: dis };
    });
    Object.keys(shopBlips).forEach(function (k) { try { shopBlips[k].destroy(); } catch (e) {} delete shopBlips[k]; });
    SHOPS.forEach(function (s) {
        const C = SHOP_CFG[s.kind];
        if (!C) return;
        shopBlips[s.id] = mp.blips.new(C.blip, new mp.Vector3(s.x, s.y, s.z), { dimension: 4294967295, name: s.owner ? s.name : s.name + ' (продаётся)', color: s.stock <= 0 ? 40 : C.color, shortRange: true, scale: 0.75 });
    });
    mp.players.forEach(function (p) { sendShopList(p); sendBizPoints(p); });
}
function shopOf(id, kind) { return SHOPS.find(function (s) { return s.id === Number(id) && (!kind || s.kind === kind); }) || null; }
function saveShop(s, fields) {
    const map = { stock: 'stock', balance: 'balance', earned: 'earned', sold: 'sold', markup: 'markup', owner: 'owner_id', name: 'name', price: 'price', max: 'max_stock', disabled: 'disabled' };
    q('UPDATE shops SET ' + fields.map(function (f) { return map[f] + ' = ?'; }).join(', ') + ' WHERE id = ?',
        fields.map(function (f) { return f === 'disabled' ? JSON.stringify(s.disabled) : s[f]; }).concat([s.id]));
}
function sendShopList(p) {
    if (!mp.players.exists(p)) return;
    p.call('shop:list', [JSON.stringify(SHOPS.map(function (s) { return [s.kind, s.id, s.x, s.y, s.z, s.name, s.owner ? 0 : 1]; }))]);
}
mp.events.add('playerReady', function (p) { setTimeout(function () { sendShopList(p); }, 3400); });
mp.events.add('srv:shop:list', function (p) { sendShopList(p); });
setTimeout(function () { shopsInit().catch(function (e) { console.log('[shops] init: ' + e.message); }); }, 2800);

function shopDeficit(s) { return s.stock <= s.max * 0.15; }
function shopPrice(s, k) {
    const it = ITEMS[k];
    const k2 = s.owner ? s.markup / 100 : (shopDeficit(s) ? 1.3 : 1);
    return Math.ceil(it.price * (it.pack || 1) * k2);
}
function shopNear(p, id) {
    const s = shopOf(id);
    return s && dist(p.position, s) < 4 ? s : null;
}
function shopState(p, s, extra) {
    const C = SHOP_CFG[s.kind];
    const d = data(p);
    return Object.assign({
        kind: s.kind, id: s.id, name: s.name, title: C.n, owner: s.ownerName, own: s.owner === accId(p), forSale: !s.owner,
        stock: s.stock, max: s.max, deficit: shopDeficit(s), money: getMoney(p), bank: getBank(p),
        lic: hasDoc(d, 'gun'),
        items: C.items.filter(function (k) { return ITEMS[k] && ITEMS[k].price; }).map(function (k) {
            const it = ITEMS[k];
            return { k: k, n: it.n, i: it.i, pack: it.pack || 1, price: shopPrice(s, k), off: s.disabled.indexOf(k) >= 0, lic: GUN_NEEDS_LIC.indexOf(k) >= 0, w: it.w * (it.pack || 1) };
        })
    }, extra || {});
}
function sendShop(p, s, extra) { if (mp.players.exists(p)) p.call('ui:data', ['shop', JSON.stringify(shopState(p, s, extra))]); }

mp.events.add('srv:shop:open', function (p, id) {
    const s = shopNear(p, id);
    if (!s) return;
    p.shopId = s.id;
    p.call('ui:shopOpen');
    sendShop(p, s);
});
mp.events.add('srv:shop:buy', function (p, k, qty, pay) {
    const s = shopNear(p, p.shopId);
    if (!s) return notify(p, 'error', 'Вы отошли от прилавка');
    const C = SHOP_CFG[s.kind];
    const it = ITEMS[k];
    if (!it || C.items.indexOf(k) < 0 || s.disabled.indexOf(k) >= 0) return sendShop(p, s, { err: 'Товар недоступен' });
    qty = Math.max(1, Math.min(10, Math.floor(Number(qty) || 1)));
    if (it.wp || it.slot) qty = 1;
    if (s.stock < qty) return sendShop(p, s, { err: s.stock <= 0 ? 'Товар закончился — ждите поставку' : 'На складе осталось ' + s.stock + ' шт.' });
    if (GUN_NEEDS_LIC.indexOf(k) >= 0 && !hasDoc(data(p), 'gun')) return sendShop(p, s, { err: 'Нужна лицензия на оружие' });
    const pack = it.pack || 1;
    const d = data(p);
    if (weight(d.inv) + it.w * pack * qty > invCap(d) + 0.001) return sendShop(p, s, { err: 'В инвентаре нет места' });
    const cost = shopPrice(s, k) * qty;
    if (pay === 'card') {
        const b = getBank(p);
        if (b < cost) return sendShop(p, s, { err: 'На карте недостаточно средств' });
        setMB(p, getMoney(p), b - cost);
        tx(accId(p), 'out', -cost, 'Покупка: ' + s.name);
    } else {
        const m = getMoney(p);
        if (m < cost) return sendShop(p, s, { err: 'Недостаточно наличных' });
        setMB(p, m - cost, getBank(p));
    }
    addItem(p, k, pack * qty);
    s.stock -= qty; s.sold += qty;
    if (s.owner) { s.balance += cost; s.earned += cost; bizLog(s.kind, s.id, it.n + ' x' + qty + ' — ' + holder(p), cost); }
    else govAdd(cost, 'Выручка гос. магазина: ' + s.name);
    saveShop(s, s.owner ? ['stock', 'sold', 'balance', 'earned'] : ['stock', 'sold']);
    if (s.stock <= 0 && shopBlips[s.id]) try { shopBlips[s.id].color = 40; } catch (e) {}
    sendShop(p, s, { ok: 'Куплено: ' + it.n + (qty > 1 ? ' x' + qty : '') + ' за $' + cost });
});
mp.events.add('srv:shop:close', function (p) { p.shopId = null; });

setInterval(function () {
    SHOPS.forEach(function (s) {
        if (s.owner || s.stock >= s.max * 0.4) return;
        s.stock = Math.min(s.max, s.stock + Math.ceil(s.max * 0.08));
        saveShop(s, ['stock']);
    });
}, 10 * 60000);
setInterval(async function () {
    const mins = global.TruckerSystem && global.TruckerSystem.active ? 20 : 6;
    const rows = await q("SELECT * FROM shop_orders WHERE status = 'pending' AND created_at < (NOW() - INTERVAL " + mins + " MINUTE) LIMIT 20");
    for (const r of rows) await deliverShopOrder(r.id, null);
}, 60000);
async function deliverShopOrder(orderId, driverAcc) {
    const r = (await q('SELECT * FROM shop_orders WHERE id = ? LIMIT 1', [orderId]))[0];
    if (!r || r.status === 'done' || r.status === 'cancel') return false;
    const s = shopOf(r.shop_id);
    if (!s) { await q("UPDATE shop_orders SET status = 'cancel' WHERE id = ?", [orderId]); return false; }
    const add = Math.max(0, Math.min(Number(r.units), s.max - s.stock));
    s.stock += add;
    saveShop(s, ['stock']);
    await q("UPDATE shop_orders SET status = 'done', driver_id = ?, done_at = NOW() WHERE id = ?", [driverAcc, orderId]);
    bizLog(s.kind, s.id, 'Поставка товара: +' + add + ' шт.', 0);
    if (shopBlips[s.id]) try { shopBlips[s.id].color = SHOP_CFG[s.kind].color; } catch (e) {}
    const op = s.owner && mp.players.toArray().find(function (x) { return accId(x) === s.owner; });
    if (op) notify(op, 'ok', s.name + ': доставлено ' + add + ' шт. товара');
    return true;
}
global.ShopSystem = {
    supply: function (id, n) { const sh = shopOf(id); if (!sh) return 0; const add = Math.max(0, Math.min(Math.floor(n), sh.max - sh.stock)); sh.stock += add; saveShop(sh, ['stock']); if (shopBlips[sh.id]) try { shopBlips[sh.id].color = SHOP_CFG[sh.kind].color; } catch (e) {} return add; },
    takeOrder: async function (orderId, driverAcc) { const r = await q("UPDATE shop_orders SET status = 'taken', driver_id = ? WHERE id = ? AND status = 'pending'", [driverAcc, orderId]); return !!(r && r.affectedRows); },
    untake: function (orderId) { return q("UPDATE shop_orders SET status = 'pending', driver_id = NULL WHERE id = ? AND status = 'taken'", [orderId]); },
    list: function () { return SHOPS; }, reload: loadShops, deliver: deliverShopOrder, CFG: SHOP_CFG,
    pendingOrders: function () { return q("SELECT o.*, s.name, s.kind, s.x, s.y, s.z FROM shop_orders o JOIN shops s ON s.id = o.shop_id WHERE o.status = 'pending' ORDER BY o.id"); },
    admin: async function (p, d) {
        const s = shopOf(d.atm);
        if (d.op === 'add') {
            const C = SHOP_CFG[d.kind], pos = p.position;
            await q('INSERT INTO shops (kind, name, x, y, z, price, stock, max_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [d.kind, String(d.name || '').trim().slice(0, 48) || C.n, pos.x, pos.y, pos.z, Math.max(0, Number(d.price) || C.price), Math.floor(C.max * 0.6), C.max]);
            await loadShops();
            return C.n + ' создан';
        }
        if (!s) throw new Error('Магазин не найден');
        if (d.op === 'tp') { p.position = new mp.Vector3(s.x, s.y, s.z + 0.5); return 'Телепорт к ' + s.name; }
        if (d.op === 'del') { await q('DELETE FROM shops WHERE id = ?', [s.id]); await loadShops(); return s.name + ' удалён'; }
        if (d.op === 'price') { await q('UPDATE shops SET price = ? WHERE id = ?', [Math.max(0, Number(d.value) || 0), s.id]); await loadShops(); return 'Цена изменена'; }
        if (d.op === 'stock') { s.stock = Math.max(0, Math.min(s.max, Number(d.value) || 0)); saveShop(s, ['stock']); return 'Запас: ' + s.stock + ' шт.'; }
        if (d.op === 'bizpos') { const pos = p.position; await q('UPDATE shops SET x = ?, y = ?, z = ? WHERE id = ?', [pos.x, pos.y, pos.z, s.id]); await loadShops(); return 'Прилавок перенесён сюда'; }
        if (d.op === 'owner') {
            let owner = null;
            if (Number(d.pid) >= 0) { const t = mp.players.at(Number(d.pid)); if (!t || !accId(t)) throw new Error('Игрок не найден'); owner = accId(t); }
            await q('UPDATE shops SET owner_id = ?, balance = 0 WHERE id = ?', [owner, s.id]);
            await loadShops();
            return owner ? 'Владелец назначен' : 'Магазин изъят у владельца';
        }
        throw new Error('Неизвестное действие');
    }
};

/* ================= BUSINESS (общее меню) ================= */
const BIZ_KINDS = {
    fuel: { n: 'АЗС', i: '⛽', list: function () { return STATIONS; }, of: stationOf, pt: function (b) { return { x: b.bx, y: b.by, z: b.bz }; }, reload: function () { return loadStations(); } },
    atm: { n: 'Банкомат', i: '🏧', list: function () { return ATMS; }, of: function (id) { return atmOf(id); }, pt: function (b) { return b; }, reload: function () { return loadAtms(); } },
    shop: { n: 'Магазин 24/7', i: '🛒', list: function () { return SHOPS.filter(function (s) { return s.kind === 'shop'; }); }, of: function (id) { return shopOf(id, 'shop'); }, pt: function (b) { return b; }, reload: function () { return loadShops(); } },
    gun: { n: 'Оружейный магазин', i: '🔫', list: function () { return SHOPS.filter(function (s) { return s.kind === 'gun'; }); }, of: function (id) { return shopOf(id, 'gun'); }, pt: function (b) { return b; }, reload: function () { return loadShops(); } }
};
function bizNear(p, kind, id) {
    const K = BIZ_KINDS[kind];
    if (!K) return null;
    const b = K.of(id);
    if (!b) return null;
    if (adminLvl(p) >= 5 && p.bizAdminView) return b;
    return dist(p.position, K.pt(b)) < 4.5 ? b : null;
}
async function bizState(p, kind, b, extra) {
    const id = accId(p), K = BIZ_KINDS[kind];
    const own = !!(id && b.owner === id);
    const st = { kind: kind, id: b.id, n: K.n, i: K.i, name: b.name, own: own, forSale: !b.owner, ownerName: b.ownerName, price: b.price,
        balance: b.balance, earned: b.earned, myBank: getBank(p), myMoney: getMoney(p), sell: sellQuote(b), settings: [], stats: [] };
    if (kind === 'fuel') {
        st.stats = [{ l: 'Запас топлива', v: b.stock + ' / ' + b.max + ' л', warn: deficit(b) }, { l: 'Продано всего', v: b.sold + ' л' }, { l: 'Наценка', v: b.markup + '%' }];
        st.settings = [{ k: 'markup', l: 'Цена топлива (% от базовой)', v: b.markup, min: 50, max: 250, step: 5, unit: '%',
            hint: Object.keys(FUEL_TYPES).map(function (k) { return FUEL_TYPES[k].n + ': $' + (Math.round(FUEL_TYPES[k].price * b.markup) / 100); }).join(' · ') }];
        const ord = own ? await q('SELECT liters, status, created_at FROM fuel_orders WHERE station_id = ? ORDER BY id DESC LIMIT 6', [b.id]) : [];
        st.stock = { cur: b.stock, max: b.max, wholesale: WHOLESALE, deficit: deficit(b), unit: 'л', title: 'Запас топлива',
            orders: ord.map(function (o) { return { l: Number(o.liters), s: o.status, d: new Date(o.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) }; }) };
    } else if (kind === 'shop' || kind === 'gun') {
        const C = SHOP_CFG[kind];
        st.stats = [{ l: 'Товар на складе', v: b.stock + ' / ' + b.max + ' шт.', warn: shopDeficit(b) }, { l: 'Продано всего', v: b.sold + ' шт.' }, { l: 'Наценка', v: b.markup + '%' }];
        st.settings = [{ k: 'markup', l: 'Цены в магазине (% от базовой)', v: b.markup, min: 50, max: 200, step: 5, unit: '%',
            hint: C.items.slice(0, 4).map(function (k) { return ITEMS[k].n + ': $' + Math.ceil(ITEMS[k].price * (ITEMS[k].pack || 1) * b.markup / 100); }).join(' · ') }];
        const ord = own ? await q('SELECT units, status, created_at FROM shop_orders WHERE shop_id = ? ORDER BY id DESC LIMIT 6', [b.id]) : [];
        st.stock = { cur: b.stock, max: b.max, wholesale: C.unitCost, deficit: shopDeficit(b), unit: 'шт.', title: 'Товар на складе',
            orders: ord.map(function (o) { return { l: Number(o.units), s: o.status, d: new Date(o.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) }; }) };
        st.assort = C.items.filter(function (k) { return ITEMS[k] && ITEMS[k].price; }).map(function (k) {
            return { k: k, n: ITEMS[k].n, i: ITEMS[k].i, on: b.disabled.indexOf(k) < 0, price: Math.ceil(ITEMS[k].price * (ITEMS[k].pack || 1) * b.markup / 100) };
        });
        if (kind === 'gun') st.stats.push({ l: 'Проверка лицензии', v: 'Обязательна' });
    } else if (kind === 'atm') {
        st.stats = [{ l: 'Комиссия за снятие', v: b.fee + '%' }];
        st.settings = [{ k: 'fee', l: 'Комиссия за снятие наличных', v: b.fee, min: 0, max: 5, step: 0.5, unit: '%', hint: 'Берётся с игроков, кроме вас' }];
    }
    if (own) {
        const lg = await q('SELECT text, amount, created_at FROM biz_log WHERE kind = ? AND biz_id = ? ORDER BY id DESC LIMIT 15', [kind, b.id]);
        st.log = lg.map(function (x) { return { text: x.text, a: Number(x.amount), d: new Date(x.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) }; });
    }
    return Object.assign(st, extra || {});
}
async function sendBiz(p, kind, b, extra) {
    if (!mp.players.exists(p)) return;
    p.call('ui:bizOpen', [JSON.stringify(await bizState(p, kind, b, extra))]);
}
mp.events.add('srv:biz:open', async function (p, kind, bid) {
    const b = bizNear(p, kind, bid);
    if (!b) return notify(p, 'error', 'Подойдите ближе к бизнесу');
    p.bizCur = { kind: kind, id: b.id };
    await sendBiz(p, kind, b);
});
mp.events.add('srv:biz:act', async function (p, act, val) {
    if (!p.bizCur) return;
    const kind = p.bizCur.kind, K = BIZ_KINDS[kind];
    const b = bizNear(p, kind, p.bizCur.id);
    const id = accId(p);
    if (!b || !id) return;
    const reply = function (o) { return sendBiz(p, kind, b, o); };
    const save = async function (cols) {
        if (kind === 'fuel') return saveStation(b, cols);
        if (kind === 'shop' || kind === 'gun') return saveShop(b, cols);
        const map = { owner: 'owner_id', balance: 'balance', earned: 'earned', fee: 'fee', name: 'name' };
        await q('UPDATE atms SET ' + cols.map(function (c) { return map[c] + ' = ?'; }).join(', ') + ' WHERE id = ?', cols.map(function (c) { return b[c]; }).concat([b.id]));
    };
    if (act === 'buy') {
        if (b.owner) return reply({ err: 'У бизнеса уже есть владелец' });
        const bank = getBank(p);
        if (bank < b.price) return reply({ err: 'Нужно ' + b.price + '$ на банковской карте' });
        setMB(p, getMoney(p), bank - b.price);
        b.owner = id; b.ownerName = holder(p); b.balance = 0;
        await save(['owner', 'balance']);
        tx(id, 'biz', -b.price, 'Покупка: ' + b.name);
        govAdd(b.price, 'Продажа бизнеса: ' + b.name + ' → ' + holder(p));
        bizLog(kind, b.id, 'Куплен игроком ' + holder(p), -b.price);
        K.reload();
        return reply({ ok: 'Поздравляем! ' + K.n + ' теперь ваш бизнес' });
    }
    if (b.owner !== id) return reply({ err: 'Это не ваш бизнес' });
    if (act === 'collect') {
        const s = b.balance;
        if (s <= 0) return reply({ err: 'Касса пуста' });
        b.balance = 0;
        await save(['balance']);
        setMB(p, getMoney(p), getBank(p) + s);
        tx(id, 'biz', s, 'Доход: ' + b.name);
        bizLog(kind, b.id, 'Владелец забрал выручку', -s);
        return reply({ ok: 'Выручка $' + s + ' переведена на карту' });
    }
    if (act === 'set') {
        const sp = (val || '').split(':'), k = sp[0], v = Number(sp[1]);
        if (kind === 'fuel' && k === 'markup') { b.markup = Math.max(50, Math.min(250, Math.round(v / 5) * 5)); await save(['markup']); return reply({ ok: 'Цена топлива: ' + b.markup + '%' }); }
        if ((kind === 'shop' || kind === 'gun') && k === 'markup') { b.markup = Math.max(50, Math.min(200, Math.round(v / 5) * 5)); await save(['markup']); return reply({ ok: 'Наценка: ' + b.markup + '%' }); }
        if (kind === 'atm' && k === 'fee') { b.fee = Math.max(0, Math.min(5, Math.round(v * 2) / 2)); await save(['fee']); return reply({ ok: 'Комиссия: ' + b.fee + '%' }); }
        return;
    }
    if (act === 'rename') {
        const nm = String(val || '').trim().slice(0, 32);
        if (nm.length < 3) return reply({ err: 'Название от 3 символов' });
        b.name = nm;
        await save(['name']);
        K.reload();
        return reply({ ok: 'Название изменено' });
    }
    if (act === 'toggle' && (kind === 'shop' || kind === 'gun')) {
        const k = String(val);
        if (SHOP_CFG[kind].items.indexOf(k) < 0) return;
        const i = b.disabled.indexOf(k);
        if (i >= 0) b.disabled.splice(i, 1); else b.disabled.push(k);
        await save(['disabled']);
        return reply({ ok: ITEMS[k].n + (i >= 0 ? ' снова в продаже' : ' снят с продажи') });
    }
    if (act === 'order' && (kind === 'shop' || kind === 'gun')) {
        const n = Math.floor(Number(val) || 0);
        const pend = await q("SELECT COALESCE(SUM(units),0) AS s FROM shop_orders WHERE shop_id = ? AND status IN ('pending','taken')", [b.id]);
        const free = b.max - b.stock - Number(pend[0] ? pend[0].s : 0);
        if (n < 10) return reply({ err: 'Минимальный заказ — 10 шт.' });
        if (n > free) return reply({ err: 'На складе есть место только для ' + Math.max(0, free) + ' шт. (с учётом заказов в пути)' });
        const cost = n * SHOP_CFG[kind].unitCost;
        let from = 'касса';
        if (b.balance >= cost) { b.balance -= cost; await save(['balance']); }
        else { const bank = getBank(p); if (bank < cost) return reply({ err: 'Нужно $' + cost + ' (в кассе или на карте)' }); setMB(p, getMoney(p), bank - cost); from = 'карта'; tx(id, 'biz', -cost, 'Закупка товара: ' + b.name); }
        await q('INSERT INTO shop_orders (shop_id, units, cost) VALUES (?, ?, ?)', [b.id, n, cost]);
        bizLog(kind, b.id, 'Заказ товара ' + n + ' шт. (' + from + ')', -cost);
        return reply({ ok: 'Заказ ' + n + ' шт. оформлен. Доставка до 6 минут' });
    }
    if (act === 'order' && kind === 'fuel') {
        const l = Math.floor(Number(val) || 0);
        const pend = await q("SELECT COALESCE(SUM(liters),0) AS s FROM fuel_orders WHERE station_id = ? AND status IN ('pending','taken')", [b.id]);
        const free = b.max - b.stock - Number(pend[0] ? pend[0].s : 0);
        if (l < 100) return reply({ err: 'Минимальный заказ — 100 л' });
        if (l > free) return reply({ err: 'На складе есть место только для ' + Math.max(0, free) + ' л (с учётом заказов в пути)' });
        const cost = l * WHOLESALE;
        let from = 'касса';
        if (b.balance >= cost) { b.balance -= cost; await save(['balance']); }
        else { const bank = getBank(p); if (bank < cost) return reply({ err: 'Нужно $' + cost + ' (в кассе или на карте)' }); setMB(p, getMoney(p), bank - cost); from = 'карта'; tx(id, 'biz', -cost, 'Закупка топлива: ' + b.name); }
        await q('INSERT INTO fuel_orders (station_id, liters, cost) VALUES (?, ?, ?)', [b.id, l, cost]);
        bizLog('fuel', b.id, 'Заказ топлива ' + l + ' л (' + from + ')', -cost);
        return reply({ ok: 'Заказ ' + l + ' л оформлен. Доставка до 6 минут' });
    }
    if (act === 'sell') {
        if (global.Realty && global.Realty.locked('biz', kind + ':' + b.id)) return reply({ err: 'Бизнес выставлен на аукцион — продать государству нельзя' });
        const qt = sellQuote(b);
        b.owner = null; b.ownerName = null; b.balance = 0;
        await save(['owner', 'balance']);
        if (b.markup !== undefined) { b.markup = 100; await save(['markup']); }
        setMB(p, getMoney(p), getBank(p) + qt.get);
        tx(id, 'biz', qt.get, 'Продажа гос-ву: ' + b.name + ' (налог ' + qt.rate + '%)');
        govAdd(qt.tax, 'Налог с продажи: ' + b.name + ' (' + qt.rate + '%)');
        bizLog(kind, b.id, 'Продан государству, налог $' + qt.tax, qt.get);
        K.reload();
        return reply({ ok: 'Продано за $' + qt.get + '. Налог $' + qt.tax + ' ушёл в казну' });
    }
});
mp.events.addCommand('fuelstock', function (p, full2, n) {
    if (adminLvl(p) < 3) return notify(p, 'error', 'Недостаточно прав');
    const i = nearStation(p.position);
    if (i < 0) return notify(p, 'error', 'Встаньте на АЗС');
    const st = STATIONS[i];
    st.stock = Math.max(0, Math.min(st.max, Number(n) || st.max));
    saveStation(st, ['stock']);
    notify(p, 'ok', st.name + ': запас ' + st.stock + ' л');
});
mp.events.addCommand('bizhere', async function (p) {
    if (adminLvl(p) < 5) return notify(p, 'error', 'Недостаточно прав');
    const i = nearStation(p.position);
    if (i < 0) return notify(p, 'error', 'Встаньте на АЗС');
    notify(p, 'ok', await global.FuelSystem.admin(p, { op: 'bizpos', atm: STATIONS[i].id }));
});
mp.events.add('srv:biz:close', function (p) { p.bizCur = null; p.bizAdminView = false; });
mp.events.addCommand('mybiz', function (p) {
    const id = accId(p);
    const list = [];
    Object.keys(BIZ_KINDS).forEach(function (k) { BIZ_KINDS[k].list().forEach(function (b) { if (b.owner === id) list.push(BIZ_KINDS[k].i + ' ' + b.name + ' — касса $' + b.balance); }); });
    if (!list.length) return notify(p, 'warn', 'У вас нет бизнесов');
    list.forEach(function (t) { p.outputChatBox('!{#5ef0a0}' + t); });
});

global.FuelSystem = {
    supply: function (id, l) { const st = stationOf(id); if (!st) return 0; const add = Math.max(0, Math.min(Math.floor(l), st.max - st.stock)); st.stock += add; saveStation(st, ['stock']); if (stBlips[st.id]) try { stBlips[st.id].color = 1; } catch (e) {} return add; },
    untake: function (orderId) { return q("UPDATE fuel_orders SET status = 'pending', driver_id = NULL WHERE id = ? AND status = 'taken'", [orderId]); },
    list: function () { return STATIONS; }, reload: loadStations, deliver: deliverOrder, WHOLESALE: WHOLESALE,
    pendingOrders: function () { return q("SELECT o.*, s.name, s.x, s.y, s.z FROM fuel_orders o JOIN fuel_stations s ON s.id = o.station_id WHERE o.status = 'pending' ORDER BY o.id"); },
    takeOrder: async function (orderId, driverAcc) { const r = await q("UPDATE fuel_orders SET status = 'taken', driver_id = ? WHERE id = ? AND status = 'pending'", [driverAcc, orderId]); return r && r.affectedRows > 0; },
    admin: async function (p, d) {
        const st = stationOf(d.atm);
        if (d.op === 'add') {
            const pos = p.position;
            await q('INSERT INTO fuel_stations (name, x, y, z, price) VALUES (?, ?, ?, ?, ?)', [String(d.name || '').trim().slice(0, 48) || 'АЗС', pos.x, pos.y, pos.z, Math.max(0, Number(d.price) || 250000)]);
            await loadStations();
            return 'АЗС создана';
        }
        if (!st) throw new Error('АЗС не найдена');
        if (d.op === 'tp') { p.position = new mp.Vector3(st.bx + 1, st.by, st.bz); return 'Телепорт к ' + st.name; }
        if (d.op === 'del') { await q('DELETE FROM fuel_stations WHERE id = ?', [st.id]); await loadStations(); return st.name + ' удалена'; }
        if (d.op === 'price') { await q('UPDATE fuel_stations SET price = ? WHERE id = ?', [Math.max(0, Number(d.value) || 0), st.id]); await loadStations(); return 'Цена изменена'; }
        if (d.op === 'stock') { st.stock = Math.max(0, Math.min(st.max, Number(d.value) || 0)); saveStation(st, ['stock']); return 'Запас: ' + st.stock + ' л'; }
        if (d.op === 'bizpos') { const pos = p.position; await q('UPDATE fuel_stations SET bx = ?, by_ = ?, bz = ? WHERE id = ?', [pos.x, pos.y, pos.z, st.id]); await loadStations(); return 'Точка управления перенесена сюда'; }
        if (d.op === 'owner') {
            let owner = null;
            if (Number(d.pid) >= 0) { const t = mp.players.at(Number(d.pid)); if (!t || !accId(t)) throw new Error('Игрок не найден'); owner = accId(t); }
            await q('UPDATE fuel_stations SET owner_id = ?, balance = 0 WHERE id = ?', [owner, st.id]);
            await loadStations();
            return owner ? 'Владелец назначен' : 'АЗС изъята у владельца';
        }
        throw new Error('Неизвестное действие');
    }
};

/* ================= LOCKS ================= */
function ownsVeh(p, v) {
    const id = accId(p);
    if (!id) return false;
    const o = v.getVariable('ownerId');
    return o !== undefined && o !== null && Number(o) === Number(id);
}

async function ownsByPlate(p, v) {
    const id = accId(p);
    if (!id) return false;
    const r = await q('SELECT id FROM vehicles WHERE owner_id = ? AND plate = ? LIMIT 1', [id, String(v.numberPlate || '').trim()]);
    if (r.length) { v.setVariable('ownerId', id); return true; }
    return false;
}

mp.events.add('srv:veh:lock', async function (p, vid) {
    let v = p.vehicle;
    if (!v) {
        const t = mp.vehicles.at(Number(vid));
        if (t && t.dimension === p.dimension && dist(t.position, p.position) < 8) v = t;
    }
    if (!v) return notify(p, 'error', 'Рядом нет машины');
    const adm = adminLvl(p) >= 1;
    let own = ownsVeh(p, v);
    if (!own && !adm) { try { own = await ownsByPlate(p, v); } catch (e) { own = false; } }
    if (!own && !adm) return notify(p, 'error', 'Это не ваша машина');
    v.locked = !v.locked;
    if (v.dbId) saveVeh(v);
    p.call('veh:lockFx', [v.remoteId !== undefined ? v.remoteId : v.id, v.locked]);
    notify(p, v.locked ? 'warn' : 'ok', (v.locked ? 'Машина закрыта' : 'Машина открыта') + (!own && adm ? ' (админ)' : ''));
});

mp.events.addCommand('setfuel', function (p, full2, n) {
    if (adminLvl(p) < 3) return;
    if (!p.vehicle) return notify(p, 'error', 'Сядьте в машину');
    setFuel(p.vehicle, Number(n) || FUEL_MAX);
    notify(p, 'ok', 'Бензин: ' + fuelOf(p.vehicle));
});

mp.events.add('srv:veh:engine', function (p) {
    const v = p.vehicle;
    if (!v) return;
    if (p.seat !== 0 && p.seat !== -1) return;
    if (!v.engine && fuelOf(v) <= 0) return notify(p, 'error', 'Бак пуст');
    v.engine = !v.engine;
    notify(p, v.engine ? 'ok' : 'warn', v.engine ? 'Двигатель заведён' : 'Двигатель заглушен');
});

/* ================= DOCUMENTS ================= */
const DOC_TYPES = {
    passport: 'Паспорт',
    drive: 'Водительское удостоверение',
    military: 'Военный билет',
    med: 'Медицинская книжка',
    psych: 'Справка от психиатра',
    gun: 'Разрешение на оружие',
    faction: 'Служебное удостоверение'
};
const FACTIONS = {
    lspd: { n: 'Полиция Лос-Сантоса', s: 'LSPD', c: '#2f6fff', pos: 'Офицер' },
    ems: { n: 'Медицинская служба', s: 'EMS', c: '#e63950', pos: 'Врач' },
    fib: { n: 'Федеральное бюро расследований', s: 'FIB', c: '#1b1b1b', pos: 'Агент' },
    army: { n: 'Национальная гвардия', s: 'ARMY', c: '#4f6b2f', pos: 'Рядовой' },
    gov: { n: 'Правительство штата', s: 'GOV', c: '#b8892b', pos: 'Сотрудник' },
    news: { n: 'Weazel News', s: 'NEWS', c: '#d9541e', pos: 'Репортёр' }
};
function dnum(len) { let s = ''; for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10); return s; }
function dstr(t) { return new Date(t).toLocaleDateString('ru-RU'); }
function yearsLater(n) { const d = new Date(); d.setFullYear(d.getFullYear() + n); return dstr(d); }
function issuer(p) { return accOf(p) && accOf(p).nick ? accOf(p).nick : p.name; }

function makeDoc(t, opt, by) {
    opt = opt || {};
    const base = { t: t, num: dnum(6), issued: dstr(Date.now()), by: by || 'Мэрия Лос-Сантоса' };
    if (t === 'passport') { base.series = dnum(4); base.until = yearsLater(10); }
    if (t === 'drive') { base.cats = opt.cats || ['A', 'B', 'C', 'D']; base.until = yearsLater(10); }
    if (t === 'military') { base.rank = opt.rank || 'Рядовой'; base.unit = opt.unit || 'В/Ч 2178'; base.fit = opt.fit || 'А — годен'; }
    if (t === 'med') { base.status = opt.status || 'Здоров'; base.until = yearsLater(1); base.blood = ['O(I) Rh+', 'A(II) Rh+', 'B(III) Rh+', 'AB(IV) Rh+'][Math.floor(Math.random() * 4)]; }
    if (t === 'psych') { base.status = opt.status || 'На учёте не состоит'; base.until = yearsLater(1); }
    if (t === 'gun') { base.cls = opt.cls || 'Пистолеты, гладкоствольное'; base.until = yearsLater(5); }
    if (t === 'faction') {
        const f = FACTIONS[opt.f] ? opt.f : 'lspd';
        base.f = f; base.pos = opt.pos || FACTIONS[f].pos; base.badge = dnum(4);
        base.by = FACTIONS[f].n;
    }
    return base;
}

function docList(d) {
    if (!d.docs) d.docs = [];
    return d.docs;
}
function hasDoc(d, t, f) { return docList(d).some(function (x) { return x.t === t && (!f || x.f === f); }); }
function giveDoc(p, t, opt, by) {
    const d = data(p);
    const list = docList(d);
    const f = t === 'faction' ? (opt && FACTIONS[opt.f] ? opt.f : 'lspd') : null;
    for (let i = list.length - 1; i >= 0; i--) if (list[i].t === t && (t !== 'faction' || list[i].f === f)) list.splice(i, 1);
    list.push(makeDoc(t, opt, by));
    if (!countItem(d, 'docs')) addItem(p, 'docs', 1);
    mark();
}

function docsPayload(p, owner) {
    const d = data(p);
    const female = p.model === mp.joaat('mp_f_freemode_01');
    if (!d.birth) { const y = 1975 + Math.floor(Math.random() * 30); d.birth = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0') + '.' + String(1 + Math.floor(Math.random() * 12)).padStart(2, '0') + '.' + y; mark(); }
    const nm = String(issuer(p)).replace(/_/g, ' ').split(' ');
    return {
        own: owner, holder: p.name,
        first: nm[0] || '', last: nm.slice(1).join(' ') || '',
        gender: female ? 'Ж' : 'М', birth: d.birth, place: 'Лос-Сантос, Сан-Андреас',
        docs: docList(d).map(function (x) {
            const o = Object.assign({}, x, { title: DOC_TYPES[x.t] || x.t });
            if (x.t === 'faction') o.fac = FACTIONS[x.f];
            return o;
        })
    };
}

function sendDocs(to, of, focus) {
    if (!mp.players.exists(to) || !mp.players.exists(of)) return;
    const pl = docsPayload(of, to === of);
    pl.focus = focus || null;
    to.call('ui:docs', [JSON.stringify(pl)]);
}

mp.events.add('srv:docs:get', function (p) { sendDocs(p, p); });

mp.events.add('srv:docs:show', function (p, idx) {
    const list = docList(data(p));
    const doc = list[Number(idx)];
    if (!doc) return;
    let best = null, bd = 3.5;
    mp.players.forEach(function (x) {
        if (x === p || x.dimension !== p.dimension) return;
        const dd = dist(x.position, p.position);
        if (dd < bd) { bd = dd; best = x; }
    });
    if (!best) return notify(p, 'error', 'Рядом никого нет');
    sendDocs(best, p, Number(idx));
    const S = global.SocialSystem;
    if (S) {
        if (doc.t === 'passport') S.learn(best, p);
        S.docRp(p, best, doc.t);
    }
    notify(p, 'ok', 'Вы показали «' + (DOC_TYPES[doc.t] || 'документ') + '» игроку ' + (S ? S.seen(p, best) : best.name));
    notify(best, 'warn', (S ? S.seen(best, p) : p.name) + ' показывает вам документ');
});

function findPl(s) {
    if (s === undefined || s === '') return null;
    const n = Number(s);
    if (!isNaN(n)) return mp.players.at(n) || null;
    return mp.players.toArray().find(function (x) { return x.name.toLowerCase().indexOf(String(s).toLowerCase()) >= 0; }) || null;
}

mp.events.addCommand('givedoc', function (p, full2, id, t, extra) {
    if (adminLvl(p) < 4) return notify(p, 'error', 'Недостаточно прав');
    const target = findPl(id);
    if (!target || !DOC_TYPES[t]) {
        return p.outputChatBox('!{#ffc93c}/givedoc [id] [тип] [фракция]  Типы: ' + Object.keys(DOC_TYPES).join(', ') + '. Фракции: ' + Object.keys(FACTIONS).join(', '));
    }
    giveDoc(target, t, t === 'faction' ? { f: extra } : null, issuer(p));
    notify(p, 'ok', 'Выдан документ «' + DOC_TYPES[t] + '» игроку ' + target.name);
    notify(target, 'ok', 'Вам выдан документ: ' + DOC_TYPES[t]);
});

mp.events.addCommand('takedoc', function (p, full2, id, t) {
    if (adminLvl(p) < 4) return notify(p, 'error', 'Недостаточно прав');
    const target = findPl(id);
    if (!target) return p.outputChatBox('!{#ffc93c}/takedoc [id] [тип или all]');
    const d = data(target);
    d.docs = t === 'all' ? [] : docList(d).filter(function (x) { return x.t !== t; });
    mark();
    notify(p, 'ok', 'Документы изъяты у ' + target.name);
});

mp.events.addCommand('alldocs', function (p) {
    if (adminLvl(p) < 4) return notify(p, 'error', 'Недостаточно прав');
    ['passport', 'drive', 'military', 'med', 'psych', 'gun'].forEach(function (t) { giveDoc(p, t, null, 'Администрация'); });
    Object.keys(FACTIONS).forEach(function (f) { giveDoc(p, 'faction', { f: f }, 'Администрация'); });
    notify(p, 'ok', 'Вам выданы все документы. Откройте: инвентарь → «Папка документов» или меню M → «Ваши документы»');
});

mp.events.addCommand('docs', function (p) { sendDocs(p, p); });

const OWNER_NAMES = ['Rainold Star', 'Rainold_Star', 'Rainold_Verigo'];
setInterval(function () {
    mp.players.forEach(function (p) {
        if (OWNER_NAMES.indexOf(p.name) < 0 || !accId(p)) return;
        const d = data(p);
        if (d.ownerDocs) return;
        d.ownerDocs = true;
        ['passport', 'drive', 'military', 'med', 'psych', 'gun'].forEach(function (t) { giveDoc(p, t, null, 'Администрация'); });
        Object.keys(FACTIONS).forEach(function (f) { giveDoc(p, 'faction', { f: f }, 'Администрация'); });
        notify(p, 'ok', 'Вам выданы все документы для просмотра. Меню M → «Ваши документы»');
    });
}, 5000);


/* ================= ДОП. API: уровень, деньги по id, бизнесы, карты ================= */
global.UiSystem.lvlOf = function (p) { return Number(data(p).lvl) || 1; };
global.MoneySystem.addBankId = function (id, n) {
    id = Number(id); n = Math.floor(n);
    if (!id || !n) return;
    const p = mp.players.toArray().find(function (x) { return accId(x) === id; });
    if (p) return setMB(p, getMoney(p), getBank(p) + n, 'realty');
    if (MONEY[id]) MONEY[id].bank = Math.max(0, MONEY[id].bank + n);
    q('UPDATE accounts SET bank = GREATEST(0, bank + ?) WHERE id = ?', [n, id]);
};
global.MoneySystem.tx = tx;
global.MoneySystem.gov = govAdd;
global.BizSystem = {
    kinds: function () { return Object.keys(BIZ_KINDS); },
    label: function (k) { return BIZ_KINDS[k] ? BIZ_KINDS[k].n : k; },
    icon: function (k) { return BIZ_KINDS[k] ? BIZ_KINDS[k].i : '🏢'; },
    get: function (k, id) { const K = BIZ_KINDS[k]; return K ? K.of(id) : null; },
    mine: function (aid) {
        const out = [];
        Object.keys(BIZ_KINDS).forEach(function (k) { BIZ_KINDS[k].list().forEach(function (b) { if (b.owner && b.owner === Number(aid)) out.push({ kind: k, id: b.id, name: b.name, n: BIZ_KINDS[k].n, price: b.price }); }); });
        return out;
    },
    transfer: function (k, id, toId, toName) {
        const K = BIZ_KINDS[k], b = K && K.of(id);
        if (!b) return -1;
        const bal = Number(b.balance) || 0;
        b.owner = Number(toId); b.ownerName = toName; b.balance = 0;
        if (k === 'fuel') saveStation(b, ['owner', 'balance']);
        else if (k === 'shop' || k === 'gun') saveShop(b, ['owner', 'balance']);
        else q('UPDATE atms SET owner_id = ?, balance = 0 WHERE id = ?', [b.owner, b.id]);
        bizLog(k, b.id, 'Передан через аукцион: ' + toName, 0);
        return bal;
    }
};
mp.events.add('srv:phone:biz', function (p) {
    const pos = p.position;
    const cats = [['fuel', '⛽ АЗС'], ['shop', '🛒 Магазины 24/7'], ['gun', '🔫 Оружейные'], ['atm', '🏧 Банкоматы']].map(function (c) {
        const K = BIZ_KINDS[c[0]];
        return { k: c[0], n: c[1], items: K.list().map(function (b) { const pt = K.pt(b); return { id: b.id, n: b.name, d: Math.round(Math.hypot(pos.x - pt.x, pos.y - pt.y)), own: b.ownerName || '' }; }).sort(function (a, b) { return a.d - b.d; }).slice(0, 10) };
    });
    p.call('phone:biz', [JSON.stringify(cats)]);
});
mp.events.add('srv:phone:bizgps', function (p, k, id) {
    const K = BIZ_KINDS[k], b = K && K.of(id);
    if (!b) return;
    const pt = K.pt(b);
    p.call('phone:gps', [pt.x, pt.y, b.name]);
});

global.VehSystem = {
    mine: async function (aid) { return q('SELECT id, model, plate FROM vehicles WHERE owner_id = ? ORDER BY id', [Number(aid)]); },
    get: async function (id) { const r = await q('SELECT id, model, plate, owner_id FROM vehicles WHERE id = ? LIMIT 1', [Number(id)]); return r[0] || null; },
    count: async function (aid) { const r = await q('SELECT COUNT(*) AS n FROM vehicles WHERE owner_id = ?', [Number(aid)]); return r[0] ? Number(r[0].n) : 0; },
    transfer: async function (id, toId) {
        id = Number(id);
        const v = ownedVeh[id];
        if (v && mp.vehicles.exists(v)) {
            try { (v.getOccupants ? v.getOccupants() : []).forEach(function (x) { try { x.removeFromVehicle(); } catch (e) {} }); } catch (e) {}
            saveVeh(v);
            setTimeout(function () { if (mp.vehicles.exists(v)) v.destroy(); }, 300);
        }
        delete ownedVeh[id];
        await q('UPDATE vehicles SET owner_id = ? WHERE id = ?', [Number(toId), id]);
        const t = mp.players.toArray().find(function (x) { return accId(x) === Number(toId); });
        if (t) { t.ownedLoaded = false; }
        return true;
    }
};
