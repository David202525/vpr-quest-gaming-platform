const db = require('./database');
const zombies = require('./zombies');

const RESPAWN_MS = 6 * 60 * 1000;
const MAX_SLOTS = 20;

const ITEMS = {
    bandage:  { name: 'Бинт',            w: 0.2, heal: 25 },
    medkit:   { name: 'Аптечка',         w: 1.0, heal: 65 },
    cloth:    { name: 'Ткань',           w: 0.3 },
    tape:     { name: 'Скотч',           w: 0.2 },
    scrap:    { name: 'Металлолом',      w: 1.5 },
    water:    { name: 'Вода',            w: 0.5, heal: 8 },
    food:     { name: 'Консервы',        w: 0.6, heal: 15 },
    armor:    { name: 'Бронежилет',      w: 4.0, armor: 50 },
    armor_hv: { name: 'Тяжёлая броня',   w: 7.0, armor: 100 },
    ammo_p:   { name: 'Патроны 9мм',     w: 0.4, ammo: 'weapon_pistol', cnt: 24 },
    ammo_smg: { name: 'Патроны SMG',     w: 0.6, ammo: 'weapon_smg', cnt: 40 },
    ammo_r:   { name: 'Патроны 5.56',    w: 0.8, ammo: 'weapon_assaultrifle', cnt: 30 },
    ammo_sg:  { name: 'Дробь 12к',       w: 0.7, ammo: 'weapon_pumpshotgun', cnt: 16 },
    w_bat:    { name: 'Бита',            w: 2.0, gun: 'weapon_bat' },
    w_machete:{ name: 'Мачете',          w: 1.5, gun: 'weapon_machete' },
    w_pistol: { name: 'Пистолет',        w: 1.2, gun: 'weapon_pistol', cnt: 12 },
    w_smg:    { name: 'Micro SMG',       w: 3.0, gun: 'weapon_microsmg', cnt: 30 },
    w_sg:     { name: 'Дробовик',        w: 4.0, gun: 'weapon_pumpshotgun', cnt: 8 },
    w_rifle:  { name: 'Автомат',         w: 5.0, gun: 'weapon_assaultrifle', cnt: 30 }
};

const COMMON = ['cloth', 'cloth', 'tape', 'scrap', 'water', 'food', 'bandage', 'bandage', 'ammo_p'];
const RARE = ['medkit', 'armor', 'ammo_smg', 'ammo_sg', 'w_bat', 'w_machete', 'w_pistol'];
const EPIC = ['armor_hv', 'w_smg', 'w_sg', 'w_rifle', 'ammo_r'];

function roll() {
    const r = Math.random();
    if (r < 0.62) return COMMON[Math.floor(Math.random() * COMMON.length)];
    if (r < 0.92) return RARE[Math.floor(Math.random() * RARE.length)];
    return EPIC[Math.floor(Math.random() * EPIC.length)];
}

const SPOTS = [
    [2557, 383, 108], [1701, 6426, 32], [-707, -914, 19], [-48, -1757, 29],
    [1207, 2660, 37], [265, -1261, 29], [-1820, 792, 138], [1392, 3606, 34],
    [-3241, 1001, 12], [-1315, -834, 16], [812, -1028, 26], [-526, -1211, 18],
    [179, 6602, 31], [-2967, 390, 15], [1961, 3740, 32], [-96, 6457, 31],
    [2679, 3280, 55], [1136, -982, 45], [-1108, 2708, 19], [1729, 3306, 41],
    [346, 2570, 43], [1687, 4815, 42], [-2177, 4291, 49], [2557, 2607, 37],
    [1849, 3683, 34], [-338, 6082, 31], [-3172, 1085, 20], [-1487, -378, 39],
    [-583, -1058, 22], [893, -178, 74], [1127, -469, 66], [-1103, -1691, 4],
    [-1222, -906, 12], [24, -1347, 29], [-711, -1580, 5], [1272, -1710, 54],
    [478, -1310, 29], [-46, -320, 39], [-1289, -1116, 7], [2004, 3776, 32]
];

const spots = SPOTS.map(function (c, i) {
    return { id: i, x: c[0], y: c[1], z: c[2], item: roll(), taken: 0 };
});

function safeSpot(s) {
    const zones = zombies.safeZones();
    for (let i = 0; i < zones.length; i++) {
        const dx = s.x - zones[i].x, dy = s.y - zones[i].y;
        if (Math.sqrt(dx * dx + dy * dy) < zones[i].r + 15) return true;
    }
    return false;
}

function activeSpots() {
    const now = Date.now();
    return spots.filter(function (s) {
        return !safeSpot(s) && (s.taken === 0 || now - s.taken > RESPAWN_MS);
    }).map(function (s) {
        return { i: s.id, x: s.x, y: s.y, z: s.z, n: ITEMS[s.item].name };
    });
}

function sendSpots(player) {
    player.call('srv:lootSpots', [JSON.stringify(activeSpots())]);
}

function inv(player) {
    if (!player.account) return [];
    if (!Array.isArray(player.account.inv)) {
        try { player.account.inv = JSON.parse(player.account.inventory || '[]'); } catch (e) { player.account.inv = []; }
        if (!Array.isArray(player.account.inv)) player.account.inv = [];
    }
    return player.account.inv;
}

function weight(list) {
    let w = 0;
    for (let i = 0; i < list.length; i++) {
        const it = ITEMS[list[i].k];
        if (it) w += it.w * list[i].c;
    }
    return w;
}

function add(player, key, cnt) {
    const list = inv(player);
    const it = ITEMS[key];
    if (!it) return false;
    if (weight(list) + it.w * cnt > 40) {
        player.outputChatBox('!{#e05555}Слишком тяжело — рюкзак переполнен');
        return false;
    }
    const found = list.find(function (x) { return x.k === key; });
    if (found) found.c += cnt;
    else {
        if (list.length >= MAX_SLOTS) {
            player.outputChatBox('!{#e05555}Нет свободных слотов');
            return false;
        }
        list.push({ k: key, c: cnt });
    }
    save(player);
    sendInv(player);
    return true;
}

function remove(player, key, cnt) {
    const list = inv(player);
    const i = list.findIndex(function (x) { return x.k === key; });
    if (i < 0 || list[i].c < cnt) return false;
    list[i].c -= cnt;
    if (list[i].c <= 0) list.splice(i, 1);
    save(player);
    sendInv(player);
    return true;
}

async function save(player) {
    if (!player.account) return;
    const json = JSON.stringify(inv(player));
    player.account.inventory = json;
    try { await db.query('UPDATE accounts SET inventory = ? WHERE id = ?', [json, player.account.id]); } catch (e) {}
}

function sendInv(player) {
    const list = inv(player).map(function (x) {
        return { n: ITEMS[x.k] ? ITEMS[x.k].name : x.k, k: x.k, c: x.c };
    });
    player.call('srv:invData', [JSON.stringify(list), Math.round(weight(inv(player)) * 10) / 10]);
}

mp.events.add('srv:lootTake', function (player, id) {
    const s = spots[Number(id)];
    if (!s || !player.account) return;
    if (s.taken !== 0 && Date.now() - s.taken < RESPAWN_MS) return;

    const p = player.position;
    const dx = p.x - s.x, dy = p.y - s.y;
    if (Math.sqrt(dx * dx + dy * dy) > 5) return;

    const key = s.item;
    const cnt = ITEMS[key].ammo ? 1 : 1;
    if (!add(player, key, cnt)) return;

    s.taken = Date.now();
    s.item = roll();
    player.outputChatBox('!{#8fd14f}Найдено: !{#ffffff}' + ITEMS[key].name);
    mp.players.forEach(function (pl) { if (pl.account) sendSpots(pl); });
});

mp.events.add('srv:invOpen', function (player) {
    sendInv(player);
});

mp.events.add('srv:invUse', function (player, key) {
    const it = ITEMS[key];
    if (!it || !player.account) return;
    const list = inv(player);
    if (!list.find(function (x) { return x.k === key; })) return;

    if (it.heal) {
        if (player.health >= 100) { player.outputChatBox('!{#ffcc66}Здоровье полное'); return; }
        remove(player, key, 1);
        player.health = Math.min(100, player.health + it.heal);
        player.outputChatBox('!{#8fd14f}Использовано: ' + it.name);
        return;
    }
    if (it.armor) {
        remove(player, key, 1);
        player.armour = Math.min(100, player.armour + it.armor);
        player.outputChatBox('!{#8fd14f}Броня надета');
        return;
    }
    if (it.gun) {
        remove(player, key, 1);
        player.giveWeapon(mp.joaat(it.gun), it.cnt || 1);
        player.outputChatBox('!{#8fd14f}В руках: ' + it.name);
        return;
    }
    if (it.ammo) {
        remove(player, key, 1);
        player.giveWeapon(mp.joaat(it.ammo), it.cnt);
        player.outputChatBox('!{#8fd14f}Патроны заряжены: +' + it.cnt);
        return;
    }
    player.outputChatBox('!{#ffcc66}' + it.name + ' — материал для крафта');
});

mp.events.addCommand('drop', function (player, arg) {
    const key = String(arg || '').trim();
    if (!ITEMS[key]) { player.outputChatBox('!{#ffcc66}/drop [код предмета из инвентаря]'); return; }
    if (remove(player, key, 1)) player.outputChatBox('!{#ffcc66}Выброшено: ' + ITEMS[key].name);
});

mp.events.add('playerJoin', function (player) {
    setTimeout(function () { sendSpots(player); sendInv(player); }, 4000);
});

setInterval(function () {
    mp.players.forEach(function (p) { if (p.account) sendSpots(p); });
}, 60000);

module.exports = { ITEMS: ITEMS, add: add, remove: remove, inv: inv, sendInv: sendInv };
