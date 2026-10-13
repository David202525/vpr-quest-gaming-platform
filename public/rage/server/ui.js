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
    card: { n: 'Банковская карта', i: '💳', w: 0.05, s: 1 },
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
    ammo_rifle: { n: 'Патроны 5,56 mm', i: '🔴', w: 0.015, s: 250 }
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

const GPS = [
    { n: 'Больница', x: 298.6, y: -584.4 },
    { n: 'Полиция', x: 425.1, y: -979.5 },
    { n: 'Аэропорт', x: -1037.0, y: -2737.0 },
    { n: 'Автосалон', x: -56.5, y: -1096.6 },
    { n: 'Мэрия', x: -544.8, y: -204.4 },
    { n: 'Банк', x: 150.3, y: -1040.2 },
    { n: 'Пляж', x: -1600.0, y: -1050.0 },
    { n: 'Сэнди-Шорс', x: 1850.0, y: 3700.0 },
    { n: 'Палето-Бэй', x: -200.0, y: 6300.0 }
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
function notify(p, type, text) {
    if (typeof global.hudNotify === 'function') global.hudNotify(p, type, text);
    else p.outputChatBox(text);
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

function getMoney(p) { const a = accOf(p); return a ? Number(a.money) || 0 : 0; }
function getBank(p) {
    if (p.account && p.account.bank !== undefined && p.account.bank !== null) return Number(p.account.bank) || 0;
    return Number(data(p).bank) || 0;
}
function setMB(p, money, bank) {
    if (p.account) { p.account.money = money; p.account.bank = bank; }
    if (p.admAcc) p.admAcc.money = money;
    data(p).bank = bank;
    mark();
    const id = accId(p);
    if (id) q('UPDATE accounts SET money = ?, bank = ? WHERE id = ?', [money, bank, id]);
}
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
        const f = fuelOf(best);
        if (f >= FUEL_MAX) return notify(p, 'warn', 'Бак и так полный');
        setFuel(best, f + it.v);
        consume(s);
        return notify(p, 'ok', 'Заправлено из канистры: ' + Math.round(fuelOf(best)) + ' л');
    }
    if (it.use === 'docs') {
        p.call('ui:openDocs');
        return;
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
    p.giveWeapon(hash, it.ammo ? ammo : 1);
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
        d.exp += 1;
        d.bpExp = (d.bpExp || 0) + 1;
        if (d.mins % 10 === 0) d.skills.survive = Math.min(500, (d.skills.survive || 0) + 5);
        if (d.exp >= needExp(d.lvl)) {
            d.exp -= needExp(d.lvl);
            d.lvl += 1;
            notify(p, 'ok', 'Новый уровень: ' + d.lvl);
        }
        if (d.bpExp % BP_STEP === 0 && Math.floor(d.bpExp / BP_STEP) <= BP_MAX) notify(p, 'ok', 'Battle Pass: доступна награда ' + Math.floor(d.bpExp / BP_STEP) + ' уровня');
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
    const shop = Object.keys(ITEMS).filter(function (k) { return ITEMS[k].price; }).map(function (k) {
        const it = ITEMS[k];
        const pack = it.pack || 1;
        return { k: k, n: it.n + (pack > 1 ? ' x' + pack : ''), i: it.i, price: it.price * pack, cat: it.wp ? 'Оружие' : it.cloth || it.slot ? 'Одежда' : k.indexOf('ammo_') === 0 ? 'Оружие' : 'Разное' };
    });
    return {
        name: p.name, id: p.id, number: d.phone,
        gender: female ? 'Женский' : 'Мужской',
        created: created ? new Date(created).toLocaleDateString('ru-RU') : '—',
        faction: job || 'Нет', family: family || 'Нет',
        lvl: d.lvl, exp: d.exp, need: needExp(d.lvl), hours: Math.floor((d.mins || 0) / 60),
        money: money, bank: bank,
        vehicles: vehicles.map(function (v) { return { model: v.model, plate: v.plate }; }),
        skills: SKILLS.map(function (s) { const v = d.skills[s.k] || 0; return { n: s.n, lvl: Math.floor(v / 100), pct: v >= 500 ? 100 : v % 100 }; }),
        ach: ach,
        bp: {
            lvl: bpLvl, exp: (d.bpExp || 0) % BP_STEP, need: BP_STEP,
            rewards: BP.map(function (r) { return { lvl: r.lvl, text: rewardText(r), claimed: d.bpClaimed.indexOf(r.lvl) >= 0, open: r.lvl <= bpLvl }; })
        },
        shop: shop
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
        gps: GPS.map(function (g) { return { n: g.n }; })
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

if (!global.DeathSystem) {
    try { require('./death.js'); console.log('[ui] система ранений подключена'); } catch (e) { console.log('[ui] death.js не найден: ' + e.message); }
}

global.UiSystem = { giveDoc: function (p, t, opt, by) { return giveDoc(p, t, opt, by); }, hasDoc: function (p, t, f) { return hasDoc(data(p), t, f); }, addItem: addItem, countItem: function (p, k) { return countItem(data(p), k); }, ITEMS: ITEMS };

console.log('[ui] инвентарь, телефон и меню загружены. Предметов в каталоге: ' + Object.keys(ITEMS).length);

module.exports = global.UiSystem;

mp.events.addCommand('uicheck', function (p) {
    p.outputChatBox('!{#8fd14f}[UI] Серверный модуль работает. Аккаунт: ' + (accId(p) ? '#' + accId(p) : 'не найден, данные по нику'));
});

/* ================= FUEL ================= */
const FUEL_MAX = 100;
const FUEL_PRICE = 3;
const STATIONS = [
    [49.42, 2778.79, 58.04], [263.89, 2606.46, 44.98], [1039.96, 2671.13, 39.55], [1207.26, 2660.18, 37.90],
    [2539.69, 2594.19, 37.94], [2679.86, 3263.95, 55.24], [2005.06, 3773.89, 32.40], [1687.16, 4929.39, 42.08],
    [1701.31, 6416.03, 32.76], [179.86, 6602.84, 31.87], [-94.46, 6419.59, 31.49], [-2555.00, 2334.40, 33.08],
    [-1800.38, 803.66, 138.65], [-1437.62, -276.75, 46.21], [-2096.24, -320.29, 13.17], [-724.62, -935.16, 19.21],
    [-526.02, -1211.00, 18.18], [-70.21, -1761.79, 29.53], [265.65, -1261.31, 29.29], [819.65, -1028.85, 26.40],
    [1208.95, -1402.57, 35.22], [1181.38, -330.85, 69.32], [620.84, 269.10, 103.09], [2581.32, 362.04, 108.47],
    [176.63, -1562.03, 29.26], [-319.29, -1471.72, 30.55], [1784.32, 3330.55, 41.25]
];
STATIONS.forEach(function (s) {
    mp.blips.new(361, new mp.Vector3(s[0], s[1], s[2]), { name: 'Заправка', color: 1, shortRange: true, scale: 0.8 });
    mp.markers.new(1, new mp.Vector3(s[0], s[1], s[2] - 1.1), 6, { color: [255, 140, 30, 60], visible: true });
});

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
    for (let i = 0; i < STATIONS.length; i++) {
        const s = STATIONS[i];
        if (dist(pos, { x: s[0], y: s[1], z: s[2] }) < 12) return i;
    }
    return -1;
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

mp.events.add('srv:fuel:refill', function (p) {
    const v = p.vehicle;
    if (!v) return notify(p, 'error', 'Вы не в машине');
    if (nearStation(p.position) < 0) return notify(p, 'error', 'Рядом нет заправки');
    const f = fuelOf(v);
    const need = Math.ceil(FUEL_MAX - f);
    if (need <= 0) return notify(p, 'warn', 'Бак и так полный');
    if (v.engine) return notify(p, 'warn', 'Заглушите двигатель перед заправкой');
    const money = getMoney(p);
    const can = Math.min(need, Math.floor(money / FUEL_PRICE));
    if (can <= 0) return notify(p, 'error', 'Недостаточно наличных. Литр стоит $' + FUEL_PRICE);
    setMB(p, money - can * FUEL_PRICE, getBank(p));
    setFuel(v, f + can);
    notify(p, 'ok', 'Заправлено ' + can + ' л за $' + (can * FUEL_PRICE));
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
    if (t === 'drive') { base.cats = opt.cats || ['A', 'B', 'C']; base.until = yearsLater(10); }
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
    notify(p, 'ok', 'Вы показали «' + (DOC_TYPES[doc.t] || 'документ') + '» игроку ' + best.name);
    notify(best, 'warn', p.name + ' показывает вам документ');
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
