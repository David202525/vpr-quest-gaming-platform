const fs = require('fs');
const path = require('path');
let db = null;
try { db = require('../database'); } catch (e) { try { db = require('./database'); } catch (e2) { db = null; } }

const FILE = path.join(__dirname, 'gov_data.json');
if (!fs.existsSync(path.join(__dirname, 'gov_web.json'))) { try { fs.writeFileSync(path.join(__dirname, 'gov_web.json'), JSON.stringify({ enabled: true, port: 22011, host: '' }, null, 2)); } catch (e) {} }
const G = Object.assign({ fac: {}, fines: [], seq: 1, records: {}, notes: {} }, (function () { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch (e) { return {}; } })());
let dirty = false;
setInterval(function () { if (dirty) { dirty = false; try { fs.writeFileSync(FILE, JSON.stringify(G)); } catch (e) {} } }, 5000);
function mark() { dirty = true; }

const POLICE = ['lspd', 'sheriff', 'fib'];
const NAMES = { lspd: 'LSPD', sheriff: 'Шериф', fib: 'FIB', army: 'Армия', gov: 'Правительство', news: 'Weazel News', medic: 'EMS', ems: 'EMS' };
function female(p) { return p.account ? Number(p.account.gender) === 1 : p.model === mp.joaat('mp_f_freemode_01'); }
const DEF_RANKS = {
    lspd: ['Кадет', 'Офицер I', 'Офицер II', 'Офицер III', 'Сержант I', 'Сержант II', 'Лейтенант', 'Капитан', 'Заместитель шефа', 'Шеф полиции'],
    sheriff: ['Кадет', 'Помощник шерифа', 'Старший помощник', 'Капрал', 'Сержант', 'Лейтенант', 'Капитан', 'Майор', 'Заместитель шерифа', 'Шериф'],
    fib: ['Стажёр', 'Агент', 'Специальный агент', 'Старший агент', 'Инспектор', 'Старший инспектор', 'Руководитель отдела', 'Заместитель директора', 'Первый заместитель', 'Директор FIB'],
    army: ['Рядовой', 'Ефрейтор', 'Младший сержант', 'Сержант', 'Старшина', 'Лейтенант', 'Капитан', 'Майор', 'Полковник', 'Генерал'],
    gov: ['Стажёр', 'Секретарь', 'Юрист', 'Адвокат', 'Прокурор', 'Судья', 'Министр', 'Вице-губернатор', 'Заместитель губернатора', 'Губернатор'],
    news: ['Стажёр', 'Курьер', 'Оператор', 'Репортёр', 'Журналист', 'Ведущий', 'Редактор', 'Главный редактор', 'Заместитель директора', 'Директор']
};

const ARMORY_ITEMS = {
    cuffs: { n: 'Наручники', i: '⛓️', ammo: 0, r: 1 },
    g_stungun: { n: 'Тайзер', i: '⚡', r: 1 },
    g_pistol: { n: 'Пистолет', i: '🔫', r: 2 },
    g_carbine: { n: 'Автомат', i: '🔫', r: 5 },
    ammo_pistol: { n: 'Патроны 9 мм (x30)', i: '🟡', pack: 30, r: 2 },
    ammo_rifle: { n: 'Патроны 5,56 (x60)', i: '🔴', pack: 60, r: 5 },
    g_armour: { n: 'Бронежилет', i: '🦺', r: 1 }
};
const SUPPLY_PACK = { g_stungun: 10, g_pistol: 10, g_carbine: 5, ammo_pistol: 30, ammo_rifle: 20, g_armour: 15, cuffs: 20 };
const GOV_KEYS = Object.keys(ARMORY_ITEMS).filter(function (k) { return k.indexOf('ammo_') !== 0; }).concat(['ammo_pistol', 'ammo_rifle']);

const UNIFORMS = {
    lspd: {
        m: [
            { n: 'Патрульная форма (кадет)', r: 1, c: { 3: [41, 0], 4: [25, 0], 6: [25, 0], 8: [59, 1], 11: [55, 0], 10: [0, 0] }, p: { 0: [46, 0] } },
            { n: 'Патрульная форма', r: 2, c: { 3: [41, 0], 4: [25, 0], 6: [25, 0], 8: [58, 0], 11: [55, 0], 10: [0, 0] }, p: { 0: [46, 0] } },
            { n: 'Форма сержанта', r: 5, c: { 3: [41, 0], 4: [25, 0], 6: [25, 0], 8: [58, 0], 11: [55, 0], 10: [8, 1] }, p: { 0: [46, 0] } },
            { n: 'Форма лейтенанта', r: 7, c: { 3: [41, 0], 4: [25, 0], 6: [25, 0], 8: [58, 0], 11: [55, 0], 10: [8, 2] }, p: { 0: [46, 0] } },
            { n: 'Форма капитана и выше', r: 8, c: { 3: [41, 0], 4: [25, 0], 6: [25, 0], 8: [58, 0], 11: [55, 0], 10: [8, 3] }, p: { 0: [46, 0] } },
            { n: 'Патруль + бронежилет', r: 2, c: { 3: [41, 0], 4: [25, 0], 6: [25, 0], 8: [58, 0], 11: [55, 0], 9: [11, 1] }, p: { 0: [46, 0] } },
            { n: 'SWAT', r: 5, c: { 1: [52, 0], 3: [17, 0], 4: [31, 0], 6: [25, 0], 8: [15, 0], 11: [53, 0], 9: [16, 0] }, p: { 0: [117, 0] } },
            { n: 'Мотопатруль', r: 3, c: { 3: [41, 0], 4: [25, 0], 6: [25, 0], 8: [58, 0], 11: [55, 0], 10: [0, 0] }, p: { 0: [17, 1] } }
        ],
        f: [
            { n: 'Патрульная форма (кадет)', r: 1, c: { 3: [44, 0], 4: [34, 0], 6: [27, 0], 8: [36, 1], 11: [48, 0], 10: [0, 0] }, p: { 0: [45, 0] } },
            { n: 'Патрульная форма', r: 2, c: { 3: [44, 0], 4: [34, 0], 6: [27, 0], 8: [35, 0], 11: [48, 0], 10: [0, 0] }, p: { 0: [45, 0] } },
            { n: 'Форма сержанта', r: 5, c: { 3: [44, 0], 4: [34, 0], 6: [27, 0], 8: [35, 0], 11: [48, 0], 10: [7, 1] }, p: { 0: [45, 0] } },
            { n: 'Форма лейтенанта', r: 7, c: { 3: [44, 0], 4: [34, 0], 6: [27, 0], 8: [35, 0], 11: [48, 0], 10: [7, 2] }, p: { 0: [45, 0] } },
            { n: 'Форма капитана и выше', r: 8, c: { 3: [44, 0], 4: [34, 0], 6: [27, 0], 8: [35, 0], 11: [48, 0], 10: [7, 3] }, p: { 0: [45, 0] } },
            { n: 'Патруль + бронежилет', r: 2, c: { 3: [44, 0], 4: [34, 0], 6: [27, 0], 8: [35, 0], 11: [48, 0], 9: [13, 1] }, p: { 0: [45, 0] } },
            { n: 'SWAT', r: 5, c: { 1: [52, 0], 3: [18, 0], 4: [30, 0], 6: [25, 0], 8: [14, 0], 11: [46, 0], 9: [18, 0] }, p: { 0: [116, 0] } },
            { n: 'Мотопатруль', r: 3, c: { 3: [44, 0], 4: [34, 0], 6: [27, 0], 8: [35, 0], 11: [48, 0], 10: [0, 0] }, p: { 0: [17, 1] } }
        ]
    },
    sheriff: {
        m: [
            { n: 'Форма помощника шерифа', r: 1, c: { 3: [41, 0], 4: [25, 1], 6: [25, 0], 8: [58, 0], 11: [55, 1] }, p: { 0: [13, 2] } },
            { n: 'Форма + бронежилет', r: 2, c: { 3: [41, 0], 4: [25, 1], 6: [25, 0], 8: [58, 0], 11: [55, 1], 9: [11, 2] }, p: { 0: [13, 2] } },
            { n: 'Форма сержанта', r: 5, c: { 3: [41, 0], 4: [25, 1], 6: [25, 0], 8: [58, 0], 11: [55, 1], 10: [8, 1] }, p: { 0: [13, 2] } }
        ],
        f: [
            { n: 'Форма помощника шерифа', r: 1, c: { 3: [44, 0], 4: [34, 1], 6: [27, 0], 8: [35, 0], 11: [48, 1] }, p: { 0: [13, 2] } },
            { n: 'Форма + бронежилет', r: 2, c: { 3: [44, 0], 4: [34, 1], 6: [27, 0], 8: [35, 0], 11: [48, 1], 9: [13, 2] }, p: { 0: [13, 2] } }
        ]
    },
    fib: {
        m: [
            { n: 'Деловой костюм агента', r: 1, c: { 3: [4, 0], 4: [10, 0], 6: [10, 0], 7: [22, 0], 8: [31, 0], 11: [4, 0] }, p: {} },
            { n: 'Костюм без пиджака', r: 1, c: { 3: [11, 0], 4: [10, 0], 6: [10, 0], 7: [22, 0], 8: [31, 0], 11: [31, 0] }, p: {} },
            { n: 'Полевая форма FIB', r: 3, c: { 3: [17, 0], 4: [31, 0], 6: [25, 0], 8: [15, 0], 11: [49, 0], 9: [12, 0] }, p: { 0: [113, 0] } },
            { n: 'Штурмовая (HRT)', r: 5, c: { 1: [52, 0], 3: [17, 0], 4: [31, 0], 6: [25, 0], 8: [15, 0], 11: [53, 1], 9: [16, 2] }, p: { 0: [117, 0] } }
        ],
        f: [
            { n: 'Деловой костюм агента', r: 1, c: { 3: [3, 0], 4: [6, 0], 6: [13, 0], 8: [38, 0], 11: [7, 0] }, p: {} },
            { n: 'Полевая форма FIB', r: 3, c: { 3: [18, 0], 4: [30, 0], 6: [25, 0], 8: [14, 0], 11: [42, 0], 9: [12, 0] }, p: { 0: [112, 0] } },
            { n: 'Штурмовая (HRT)', r: 5, c: { 1: [52, 0], 3: [18, 0], 4: [30, 0], 6: [25, 0], 8: [14, 0], 11: [46, 1], 9: [18, 2] }, p: { 0: [116, 0] } }
        ]
    },
    army: {
        m: [
            { n: 'Скин: Морпех', r: 1, skin: 's_m_y_marine_01' },
            { n: 'Скин: Морпех в каске', r: 1, skin: 's_m_y_marine_03' },
            { n: 'Скин: Боец в бронежилете', r: 2, skin: 's_m_y_marine_02' },
            { n: 'Скин: Механик', r: 1, skin: 's_m_y_armymech_01' },
            { n: 'Скин: Спецназ', r: 3, skin: 's_m_y_blackops_01' },
            { n: 'Скин: Спецназ в маске', r: 4, skin: 's_m_y_blackops_03' },
            { n: 'Скин: Пилот', r: 5, skin: 's_m_m_pilot_02' },
            { n: 'Скин: Офицер', r: 5, skin: 's_m_m_marine_01' },
            { n: 'Скин: Генерал', r: 8, skin: 's_m_m_marine_02' },
            { n: 'Полевая форма', r: 1, c: { 3: [17, 0], 4: [31, 0], 6: [25, 0], 8: [15, 0], 11: [49, 0] }, p: {} },
            { n: 'Форма + бронежилет', r: 2, c: { 3: [17, 0], 4: [31, 0], 6: [25, 0], 8: [15, 0], 11: [49, 0], 9: [16, 0] }, p: {} },
            { n: 'Штурмовая (каска, маска)', r: 3, c: { 1: [52, 0], 3: [17, 0], 4: [31, 0], 6: [25, 0], 8: [15, 0], 11: [53, 0], 9: [16, 0] }, p: { 0: [117, 0] } },
            { n: 'Офицерская форма', r: 5, c: { 3: [11, 0], 4: [10, 0], 6: [10, 0], 7: [22, 0], 8: [31, 0], 11: [31, 0] }, p: {} },
            { n: 'Парадная форма', r: 6, c: { 3: [4, 0], 4: [10, 0], 6: [10, 0], 7: [22, 0], 8: [31, 0], 11: [4, 0] }, p: {} }
        ],
        f: [
            { n: 'Скин: Морпех', r: 1, skin: 's_m_y_marine_01' },
            { n: 'Скин: Морпех в каске', r: 1, skin: 's_m_y_marine_03' },
            { n: 'Скин: Боец в бронежилете', r: 2, skin: 's_m_y_marine_02' },
            { n: 'Скин: Спецназ', r: 3, skin: 's_m_y_blackops_01' },
            { n: 'Скин: Пилот', r: 5, skin: 's_m_m_pilot_02' },
            { n: 'Полевая форма', r: 1, c: { 3: [18, 0], 4: [30, 0], 6: [25, 0], 8: [14, 0], 11: [42, 0] }, p: {} },
            { n: 'Форма + бронежилет', r: 2, c: { 3: [18, 0], 4: [30, 0], 6: [25, 0], 8: [14, 0], 11: [42, 0], 9: [12, 0] }, p: {} },
            { n: 'Штурмовая (каска, маска)', r: 3, c: { 1: [52, 0], 3: [18, 0], 4: [30, 0], 6: [25, 0], 8: [14, 0], 11: [46, 0], 9: [18, 0] }, p: { 0: [116, 0] } },
            { n: 'Парадная форма', r: 6, c: { 3: [3, 0], 4: [6, 0], 6: [13, 0], 8: [38, 0], 11: [7, 0] }, p: {} }
        ]
    }
};
function uniformsOf(p) { const u = UNIFORMS[fac(p)] || UNIFORMS.lspd; return u[female(p) ? 'f' : 'm']; }
const DEF_POINTS = {
    lspd: { armory: [452.1, -980.1, 30.69], locker: [458.2, -992.9, 30.69], garage: [454.6, -1017.4, 28.4], spawns: [[446.0, -1025.0, 28.6, 2], [442.4, -1025.6, 28.7, 2], [438.6, -1026.0, 28.8, 2], [434.9, -1026.5, 28.9, 2], [431.2, -1027.0, 29.0, 2]] },
    sheriff: { armory: [1851.1, 3690.0, 34.27], locker: [1849.2, 3694.5, 34.27], garage: [1866.0, 3695.0, 33.9], spawns: [[1870.0, 3700.0, 33.6, 210], [1873.0, 3703.0, 33.6, 210]] },
    fib: { armory: [118.9, -729.3, 242.15], locker: [121.5, -733.8, 242.15], garage: [130.0, -712.0, 33.1], spawns: [[136.0, -705.0, 33.1, 160], [140.0, -707.0, 33.1, 160]] },
    army: { armory: [-2350.0, 3270.0, 32.8], locker: [-2347.0, 3264.0, 32.8], garage: [-2400.0, 3300.0, 32.8], spawns: [[-2405.0, 3310.0, 32.8, 240], [-2410.0, 3316.0, 32.8, 240]] }
};
const DEF_AIR = [[-2148.0, 3253.0, 32.8, 240], [-2125.0, 3240.0, 32.8, 240], [-2016.0, 2952.0, 32.8, 60], [-1955.0, 2918.0, 32.8, 60]];
const DEF_FLEET = {
    lspd: [['police', 1], ['police2', 2], ['police3', 3], ['policeb', 3], ['police4', 6], ['policet', 4], ['riot', 7], ['polmav', 8]],
    sheriff: [['sheriff', 1], ['sheriff2', 3], ['policeb', 3], ['riot', 7]],
    fib: [['fbi', 1], ['fbi2', 3], ['riot', 6]],
    army: [['mesa3', 1], ['crusader', 2], ['barracks', 2], ['barracks3', 3], ['insurgent', 5], ['cargobob', 5], ['valkyrie', 6], ['buzzard', 6], ['titan', 7], ['lazer', 8], ['hydra', 9]]
};

const PERMS = {
    search: { n: 'Поиск по базе граждан', r: 1 },
    dossier: { n: 'Полное досье (телефон, жильё, транспорт)', r: 3 },
    plate: { n: 'Пробив номера машины', r: 1 },
    wantedList: { n: 'Просмотр списка розыска', r: 1 },
    note: { n: 'Записи в досье', r: 2, pol: 1 },
    fine: { n: 'Выписывать штрафы', r: 2, pol: 1 },
    wanted: { n: 'Объявлять / снимать розыск', r: 3, pol: 1 },
    track: { n: 'Отслеживание сигнала', r: 4, pol: 1 },
    gate: { n: 'Открывать ворота военной базы', r: 1, army: 1 },
    crates: { n: 'Погрузка ящиков поставки', r: 1, army: 1 },
    deliver: { n: 'Доставка поставок на склады', r: 2, army: 1 },
    air: { n: 'Авиация (вертолёты и самолёты)', r: 5, army: 1 }
};
function permVisible(f, k) { return f === 'army' ? !!PERMS[k].army : !PERMS[k].army; }
function can(p, k) {
    if (!PERMS[k]) return false;
    if (!permVisible(fac(p), k)) return false;
    if (PERMS[k].pol && !isPolice(p)) return false;
    if (canManage(p)) return true;
    return rank(p) >= (F(fac(p)).perms[k] || PERMS[k].r);
}
function F(f) {
    if (!G.fac[f]) G.fac[f] = {};
    const x = G.fac[f];
    if (!x.ranks) x.ranks = (DEF_RANKS[f] || DEF_RANKS.lspd).slice();
    if (!x.deps) x.deps = [];
    if (!x.squads) x.squads = [];
    if (!x.stock) x.stock = {};
    if (!x.points) x.points = DEF_POINTS[f] ? JSON.parse(JSON.stringify(DEF_POINTS[f])) : null;
    if (!x.log) x.log = [];
    if (!x.perms) x.perms = {};
    Object.keys(PERMS).forEach(function (k) { if (x.perms[k] === undefined) x.perms[k] = PERMS[k].r; });
    return x;
}

function acc(p) { return p.account || null; }
function sid(p) { const a = acc(p); return a && a.id ? Number(a.id) : 0; }
function nick(p) { const a = acc(p); return String((a && a.nick) || p.name).replace(/_/g, ' '); }
function fac(p) { const a = acc(p); return a && a.job ? String(a.job) : ''; }
function rank(p) { const a = acc(p); if (!a) return 0; if (Number(a.leader) === 1) return 99; return Number(a.job_rank) || 0; }
function isLeader(p) { const a = acc(p); return !!(a && (Number(a.leader) === 1 || Number(a.job_rank) >= 10)); }
function isDep(p) { const f = fac(p); return !!f && F(f).deps.indexOf(sid(p)) >= 0; }
function canManage(p) { return isLeader(p) || isDep(p); }
function admLvl(p) { return global.AdminSystem && global.AdminSystem.realLvl ? global.AdminSystem.realLvl(p) : 0; }
function isGovF(f) { return !!DEF_RANKS[f]; }
function isPolice(p) { return POLICE.indexOf(fac(p)) >= 0; }
function notify(p, type, text) { if (typeof global.hudNotify === 'function') global.hudNotify(p, type, text); else p.outputChatBox(text); }
function V(x, y, z) { return new mp.Vector3(Number(x), Number(y), Number(z)); }
function near(p, pt, r) { return pt && Math.hypot(p.position.x - pt[0], p.position.y - pt[1]) <= (r || 2.5) + 1 && Math.abs(p.position.z - pt[2]) < 4; }
function online(id) { return mp.players.toArray().find(function (x) { return sid(x) === Number(id); }) || null; }
function U() { return global.UiSystem; }
function rankName(f, r) { const R = F(f).ranks; return R[Math.max(0, Math.min(R.length, r) - 1)] || ('Ранг ' + r); }
function flog(f, text) { const x = F(f); x.log.unshift({ t: Date.now(), x: text }); if (x.log.length > 120) x.log.length = 120; mark(); }
function money(n) { return '$' + String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
async function q(sql, args) { if (!db) return []; try { const r = await db.query(sql, args || []); return Array.isArray(r) && Array.isArray(r[0]) ? r[0] : r; } catch (e) { console.log('[gov] db: ' + e.message); return []; } }

/* ================= СКЛАД ================= */
function armoryOpen(p) {
    const f = fac(p), x = F(f);
    p.call('gov:menu', [JSON.stringify({
        t: 'armory', f: NAMES[f] || f, rank: rank(p),
        items: Object.keys(ARMORY_ITEMS).map(function (k) { const a = ARMORY_ITEMS[k]; return { k: k, n: a.n, i: a.i, r: a.r, left: x.stock[k] || 0, has: U() ? U().countItem(p, k) : 0 }; })
    })]);
}
mp.events.add('srv:gov:take', function (p, k) {
    const f = fac(p), x = F(f), a = ARMORY_ITEMS[k];
    if (!a || !x.points || !near(p, x.points.armory, 3)) return;
    if (rank(p) < a.r) return notify(p, 'warn', 'Доступно с ранга «' + rankName(f, a.r) + '»');
    if ((x.stock[k] || 0) <= 0) return notify(p, 'error', 'На складе закончилось: ' + a.n + '. Ждите поставку от армии');
    const u = U(); if (!u) return;
    if (k.indexOf('ammo_') !== 0 && u.countItem(p, k) > 0) return notify(p, 'warn', 'У вас уже есть ' + a.n);
    x.stock[k]--;
    u.addItem(p, k, a.pack || 1);
    mark();
    notify(p, 'ok', 'Получено: ' + a.n);
    armoryOpen(p);
});
mp.events.add('srv:gov:return', function (p) {
    const f = fac(p), x = F(f);
    if (!x.points || !near(p, x.points.armory, 3)) return;
    const u = U(); if (!u) return;
    let back = 0;
    Object.keys(ARMORY_ITEMS).forEach(function (k) {
        const n = u.govStrip(p, [k]);
        if (!n) return;
        const a = ARMORY_ITEMS[k];
        x.stock[k] = (x.stock[k] || 0) + (a.pack ? Math.floor(n / a.pack) : n);
        back += n;
    });
    mark();
    notify(p, back ? 'ok' : 'warn', back ? 'Снаряжение сдано на склад' : 'Нечего сдавать');
    armoryOpen(p);
});

/* ================= РАЗДЕВАЛКА ================= */
function lockerOpen(p) {
    const list = uniformsOf(p), r = rank(p);
    p.call('gov:menu', [JSON.stringify({ t: 'locker', f: NAMES[fac(p)], on: !!p.getVariable('duty'), list: list.map(function (u, i) { return { i: i, n: u.n, lock: r < (u.r || 1) ? rankName(fac(p), u.r) : '' }; }) })]);
}
function keepGear(p, fn) {
    const hp = p.health, ar = p.armour, w = p.uiWeapon;
    fn();
    setTimeout(function () {
        if (!mp.players.exists(p)) return;
        try { p.health = hp; p.armour = ar; } catch (e) {}
        if (w && p.uiWeapon === w) { try { p.giveWeapon(w.hash, w.ammo || 100); } catch (e) {} }
    }, 300);
}
function setSkin(p, m) {
    keepGear(p, function () { p.model = mp.joaat(m); });
    p.govSkin = m;
}
function unSkin(p) {
    p.govSkin = null;
    keepGear(p, function () {
        if (global.CreatorSystem && p.account) global.CreatorSystem.apply(p, p.account);
        else p.model = mp.joaat(female(p) ? 'mp_f_freemode_01' : 'mp_m_freemode_01');
    });
    setTimeout(function () { if (mp.players.exists(p) && U() && U().redress) U().redress(p); }, 700);
}
mp.events.add('playerQuit', function (p) { p.govSkin = null; });
function setDuty(p, on, idx) {
    p.setVariable('duty', !!on);
    if (on) {
        const u = uniformsOf(p)[idx || 0];
        if (!u) return;
        if (u.skin) { setSkin(p, u.skin); return; }
        if (p.govSkin) unSkin(p);
        p.uniPending = u;
        p.call('gov:uniCheck', [JSON.stringify({ c: u.c, p: u.p })]);
    } else {
        if (p.govSkin) { unSkin(p); return; }
        try { [1, 7, 9, 10].forEach(function (c) { p.setClothes(c, 0, 0, 0); }); p.setProp(0, -1, 0); p.call('inv:clearProp', [0]); } catch (e) {}
        if (U() && U().redress) U().redress(p);
    }
}
mp.events.add('srv:gov:uniApply', function (p, json) {
    const u = p.uniPending;
    if (!u) return;
    p.uniPending = null;
    let bad = { c: [], p: [] };
    try { bad = Object.assign(bad, JSON.parse(json) || {}); } catch (e) {}
    try { [1, 7, 9, 10].forEach(function (c) { p.setClothes(c, 0, 0, 0); }); p.setProp(0, -1, 0); p.call('inv:clearProp', [0]); } catch (e) {}
    Object.keys(u.c).forEach(function (c) { if (bad.c.indexOf(Number(c)) >= 0) return; try { p.setClothes(Number(c), u.c[c][0], u.c[c][1], 0); } catch (e) {} });
    Object.keys(u.p).forEach(function (c) { if (bad.p.indexOf(Number(c)) >= 0) return; try { p.setProp(Number(c), u.p[c][0], u.p[c][1]); } catch (e) {} });
    if (bad.c.length || bad.p.length) console.log('[gov] форма «' + u.n + '» (' + fac(p) + '): пропущены слоты ' + bad.c.concat(bad.p.map(function (x) { return 'prop' + x; })).join(','));
});
mp.events.add('srv:gov:uniform', function (p, i) {
    const x = F(fac(p));
    if (!x.points || !near(p, x.points.locker, 3)) return;
    i = Number(i);
    const un = uniformsOf(p)[i];
    if (i >= 0 && (!un || rank(p) < (un.r || 1))) return notify(p, 'warn', 'Эта форма доступна с ранга «' + rankName(fac(p), un ? un.r : 1) + '»');
    if (i < 0) { setDuty(p, false); notify(p, 'ok', 'Вы переоделись в гражданское. Смена окончена'); }
    else { setDuty(p, true, i); notify(p, 'ok', 'Вы на смене. Форма надета'); }
    lockerOpen(p);
});

/* ================= АВТОПАРК ================= */
const fleetCars = {};
function fleetOf(f) {
    const C = global.FactionCfg;
    const list = C && C.fleet(f) && C.fleet(f).length ? C.fleet(f).map(function (c) { return [c.m, c.r || 1, c.on !== false]; }) : (DEF_FLEET[f] || []).map(function (c) { return [c[0], c[1], true]; });
    return list.filter(function (c) { return c[2]; });
}
function garageOpen(p) {
    const f = fac(p);
    const mine = fleetCars[sid(p)];
    p.call('gov:menu', [JSON.stringify({ t: 'garage', f: NAMES[f], rank: rank(p), out: mine && mp.vehicles.exists(mine) ? mine.getVariable('govModel') : null,
        list: fleetOf(f).map(function (c) { return { m: c[0], r: c[1], rn: rankName(f, c[1]) }; }) })]);
}
mp.events.add('srv:gov:car', function (p, m) {
    const f = fac(p), x = F(f);
    if (!x.points || !near(p, x.points.garage, 3)) return;
    const s = sid(p);
    if (m === '__back') {
        const v = fleetCars[s];
        if (v && mp.vehicles.exists(v)) { if (v.position.subtract(p.position).length() > 40) return notify(p, 'warn', 'Пригоните машину к гаражу'); v.destroy(); }
        delete fleetCars[s];
        notify(p, 'ok', 'Служебный транспорт сдан');
        return garageOpen(p);
    }
    const c = fleetOf(f).find(function (z) { return z[0] === m; });
    if (!c) return;
    if (rank(p) < c[1]) return notify(p, 'warn', 'Доступно с ранга «' + rankName(f, c[1]) + '»');
    if (fleetCars[s] && mp.vehicles.exists(fleetCars[s])) return notify(p, 'warn', 'Сначала сдайте прошлую машину');
    const AIR = ['cargobob', 'valkyrie', 'buzzard', 'titan', 'lazer', 'hydra', 'annihilator', 'savage'];
    const isAir = AIR.indexOf(m) >= 0;
    if (isAir && f === 'army' && !can(p, 'air') && !canManage(p)) return notify(p, 'warn', 'Авиация доступна с ранга «' + rankName(f, x.perms.air) + '» (настраивает лидер)');
    const spList = isAir ? (x.points.air && x.points.air.length ? x.points.air : (f === 'army' ? DEF_AIR : [])) : (x.points.spawns || []);
    if (isAir && !spList.length) return notify(p, 'warn', 'Нет площадки для авиации — администратор: /govpoint ' + f + ' air');
    const sp = spList.find(function (z) { return !mp.vehicles.toArray().some(function (v) { return v.dimension === 0 && Math.hypot(v.position.x - z[0], v.position.y - z[1]) < (isAir ? 12 : 3); }); });
    if (!isAir && !spList.length) return notify(p, 'warn', 'Нет парковки для машин — администратор: /armypark car');
    if (!sp) return notify(p, 'warn', 'Все парковочные места заняты');
    const v = mp.vehicles.new(mp.joaat(m), V(sp[0], sp[1], sp[2] + (isAir ? 0.5 : 0.3)), { heading: sp[3] || 0, numberPlate: (NAMES[f] || 'GOV').slice(0, 4).toUpperCase() + String(s).padStart(4, '0'), dimension: 0, locked: false, engine: false });
    v.setVariable('faction', f); v.setVariable('gov', f); v.setVariable('govModel', m); v.setVariable('govOwner', s);
    try { v.setColor(f === 'fib' ? 0 : 111, f === 'fib' ? 0 : 0); } catch (e) {}
    v.adminSpawned = false;
    fleetCars[s] = v;
    p.call('phone:gps', [sp[0], sp[1], 'Служебная машина']);
    notify(p, 'ok', 'Машина ждёт на парковке — метка на карте');
    p.call('house:menuClose');
});
mp.events.add('playerEnterVehicle', function (p, v, seat) {
    const f = v.getVariable('gov');
    if (!f || !isGovF(f) || seat !== 0 && seat !== -1) return;
    if (fac(p) !== f && admLvl(p) < 1) { try { p.removeFromVehicle(); } catch (e) {} notify(p, 'error', 'Служебный транспорт ' + (NAMES[f] || f)); }
});
mp.events.add('playerQuit', function (p) {
    const v = fleetCars[sid(p)];
    if (v && mp.vehicles.exists(v)) setTimeout(function () { if (mp.vehicles.exists(v) && !(v.getOccupants && v.getOccupants().length)) v.destroy(); }, 60000);
});

/* ================= ТОЧКИ ВЗАИМОДЕЙСТВИЯ ================= */
function points() {
    const out = [];
    Object.keys(DEF_RANKS).forEach(function (f) {
        const x = F(f);
        if (!x.points) return;
        ['armory', 'locker', 'garage'].forEach(function (k) { const pt = x.points[k]; if (pt) out.push([f, k, pt[0], pt[1], pt[2]]); });
    });
    return out;
}
function sendPoints(p) { p.call('gov:points', [JSON.stringify(points())]); }
mp.events.add('srv:gov:point', function (p, f, k) {
    if (p.vehicle) return;
    const x = F(f);
    if (!x.points || !x.points[k] || Math.hypot(p.position.x - x.points[k][0], p.position.y - x.points[k][1]) > 3.5) return;
    if (fac(p) !== f) {
        const my = fac(p);
        return notify(p, 'error', 'Это ' + ({ armory: 'склад', locker: 'раздевалка', garage: 'гараж' })[k] + ' ' + (NAMES[f] || f) + '. ' + (my ? 'Вы состоите в: ' + (NAMES[my] || my) : 'Вы не состоите в этой организации'));
    }
    if (k === 'armory') { if (f === 'army') return notify(p, 'ok', 'Ящики поставки появляются у склада раз в неделю. Подойдите к ящикам — E, отнесите в Barracks — E у кузова. Доставка: /supply у склада LSPD/шерифа/FIB'); return armoryOpen(p); }
    if (k === 'locker') return lockerOpen(p);
    if (k === 'garage') return garageOpen(p);
});
const DEF_HOME = {
    lspd: [457.0, -990.5, 30.69, 90, 'Полицейский участок Mission Row'],
    sheriff: [1853.5, 3687.0, 34.27, 210, 'Офис шерифа Sandy Shores'],
    fib: [120.0, -735.5, 242.15, 340, 'Штаб FIB'],
    army: [-2345.0, 3268.0, 32.8, 240, 'Военная база Форт Занкудо'],
    gov: [-544.8, -204.4, 38.2, 210, 'Мэрия Лос-Сантоса'],
    news: [-598.5, -929.7, 23.87, 90, 'Офис Weazel News'],
    medic: [311.5, -593.5, 43.28, 340, 'Больница Pillbox Hill'],
    ems: [311.5, -593.5, 43.28, 340, 'Больница Pillbox Hill']
};
function factionHome(p) {
    const f = p.account && p.account.job;
    if (!f || !NAMES[f]) return null;
    if (global.AdminCore && global.AdminCore.factionOff && global.AdminCore.factionOff(f)) return null;
    const d = DEF_HOME[f];
    const x = isGovF(f) ? F(f) : null;
    const h = x && x.points && x.points.home ? x.points.home : (d || (x && x.points && x.points.locker ? x.points.locker : null));
    if (!h) return null;
    return { x: h[0], y: h[1], z: h[2], h: h[3] || 0, n: NAMES[f], d: (d && d[4]) || 'База фракции', dim: 0 };
}
mp.events.addCommand('govpoint', function (p, full) {
    if (admLvl(p) < 7) return;
    const a = String(full || '').trim().split(/\s+/);
    const f = a[0], k = a[1];
    if (!DEF_RANKS[f] || ['armory', 'locker', 'garage', 'spawn', 'clearspawns', 'home', 'air', 'clearair'].indexOf(k) < 0) return p.outputChatBox('!{#ffcc66}/govpoint [' + Object.keys(DEF_RANKS).join('/') + '] [armory/locker/garage/spawn/clearspawns/home/air/clearair] — air: площадка авиации — home: место появления сотрудников');
    const x = F(f);
    if (!x.points) x.points = { spawns: [] };
    const pos = [p.position.x, p.position.y, p.position.z];
    if (k === 'spawn') { x.points.spawns.push([pos[0], pos[1], pos[2], p.heading || 0]); }
    else if (k === 'clearspawns') x.points.spawns = [];
    else if (k === 'air') { if (!x.points.air) x.points.air = []; x.points.air.push([pos[0], pos[1], pos[2], p.heading || 0]); }
    else if (k === 'clearair') x.points.air = [];
    else if (k === 'home') x.points.home = [pos[0], pos[1], pos[2], p.heading || 0];
    else x.points[k] = pos;
    mark();
    mp.players.forEach(sendPoints);
    p.outputChatBox('!{#8fd14f}Точка ' + k + ' для ' + f + ' сохранена');
});
mp.events.addCommand('armypark', function (p, full) {
    if (admLvl(p) < 5) return notify(p, 'error', 'Доступно с 5 уровня администрации');
    const a = String(full || '').trim().split(/\s+/);
    const x = F('army');
    if (!x.points) x.points = JSON.parse(JSON.stringify(DEF_POINTS.army));
    const P = x.points;
    const m = function (t) { p.outputChatBox('!{#9bd36a}[АРМИЯ] !{#ffffff}' + t); };
    const isDef = function (l) { return JSON.stringify(l || []) === JSON.stringify(DEF_POINTS.army.spawns); };
    const pt = function () { return [p.position.x, p.position.y, p.position.z, p.vehicle ? p.vehicle.heading : (p.heading || 0)]; };
    const done = function (t) { mark(); mp.players.forEach(sendPoints); m(t); };
    if (a[0] === 'car') {
        if (isDef(P.spawns)) P.spawns = [];
        P.spawns.push(pt());
        return done('Место для машин №' + P.spawns.length + ' добавлено. Машина встанет носом туда, куда смотрите вы');
    }
    if (a[0] === 'air') {
        if (!P.air) P.air = [];
        P.air.push(pt());
        return done('Место для авиации №' + P.air.length + ' добавлено. Ставьте места не ближе 15 м друг к другу');
    }
    if (a[0] === 'del') {
        let best = null, bd = 15;
        [['spawns', 'машин'], ['air', 'авиации']].forEach(function (k) {
            (P[k[0]] || []).forEach(function (z, i) { const d = Math.hypot(p.position.x - z[0], p.position.y - z[1]); if (d < bd) { bd = d; best = [k[0], i, k[1]]; } });
        });
        if (!best) return m('Рядом (15 м) нет мест спавна');
        P[best[0]].splice(best[1], 1);
        return done('Ближайшее место для ' + best[2] + ' удалено');
    }
    if (a[0] === 'clear') {
        if (a[1] === 'car') { P.spawns = []; return done('Все места для машин удалены. Добавьте новые: /armypark car'); }
        if (a[1] === 'air') { P.air = []; return done('Все места для авиации удалены. Добавьте новые: /armypark air'); }
        return m('/armypark clear car или /armypark clear air');
    }
    if (a[0] === 'gps') {
        const l = a[1] === 'air' ? (P.air && P.air.length ? P.air : DEF_AIR) : P.spawns;
        const z = l[(Number(a[2]) || 1) - 1];
        if (!z) return m('Нет такого места');
        p.call('phone:gps', [z[0], z[1], 'Место спавна']);
        return m('Метка поставлена на карте');
    }
    const air = P.air && P.air.length ? P.air : null;
    m('Машины: ' + (P.spawns || []).length + ' мест' + (isDef(P.spawns) ? ' (стандартные)' : '') + ' · Авиация: ' + (air ? air.length + ' мест' : 'стандартные ' + DEF_AIR.length));
    m('Встаньте (или сядьте в технику) на нужном месте лицом по направлению:');
    m('/armypark car — место для машин · /armypark air — для самолётов и вертолётов');
    m('/armypark del — удалить ближайшее · clear car / clear air — удалить все · gps car|air [№] — показать на карте');
});
mp.events.addCommand('setfaction', async function (p, full) {
    if (admLvl(p) < 5) return;
    const a = String(full || '').trim().split(/\s+/);
    const t = mp.players.at(Number(a[0])), f = a[1], r = Math.max(1, Math.min(9, Number(a[2]) || 1));
    if (!t || !t.account || !(DEF_RANKS[f] || f === 'none')) return p.outputChatBox('!{#ffcc66}/setfaction [id] [' + Object.keys(DEF_RANKS).join('/') + '/none] [ранг 1-9]');
    if (f === 'none') { t.account.job = null; t.account.job_rank = 0; t.account.leader = 0; await q('UPDATE accounts SET job = NULL, job_rank = 0, leader = 0 WHERE id = ?', [sid(t)]); syncCop(t); return p.outputChatBox('!{#8fd14f}' + nick(t) + ' исключён из организации'); }
    t.account.job = f; t.account.job_rank = r; t.account.leader = 0;
    await q('UPDATE accounts SET job = ?, job_rank = ?, leader = 0 WHERE id = ?', [f, r, sid(t)]);
    syncCop(t);
    flog(f, 'Администрация зачислила ' + nick(t) + ' (' + rankName(f, r) + ')');
    notify(t, 'ok', 'Вы зачислены в ' + (NAMES[f] || f) + ': ' + rankName(f, r));
    p.outputChatBox('!{#8fd14f}' + nick(t) + ' → ' + f + ', ранг ' + r);
});
mp.events.addCommand('govstock', function (p, full) {
    if (admLvl(p) < 6) return;
    const a = String(full || '').trim().split(/\s+/);
    if (!DEF_RANKS[a[0]]) return p.outputChatBox('!{#ffcc66}/govstock [фракция] — пополнить склад стандартной поставкой');
    const x = F(a[0]);
    Object.keys(SUPPLY_PACK).forEach(function (k) { x.stock[k] = (x.stock[k] || 0) + SUPPLY_PACK[k]; });
    mark();
    flog(a[0], 'Администрация пополнила склад');
    p.outputChatBox('!{#8fd14f}Склад ' + a[0] + ' пополнен');
});

/* ================= ПЛАНШЕТ ================= */
async function members(f) {
    const rows = await q('SELECT id, nick, login, job_rank, leader, last_login FROM accounts WHERE job = ? ORDER BY job_rank DESC LIMIT 200', [f]);
    const x = F(f);
    return rows.map(function (r) {
        const o = online(r.id);
        const sq = x.squads.find(function (s) { return s.m.indexOf(Number(r.id)) >= 0; });
        return { id: Number(r.id), n: String(r.nick || r.login || '#' + r.id).replace(/_/g, ' '), r: Number(r.job_rank) || 1, rn: Number(r.leader) === 1 ? x.ranks[x.ranks.length - 1] : rankName(f, Number(r.job_rank) || 1), lead: Number(r.leader) === 1, dep: x.deps.indexOf(Number(r.id)) >= 0,
            on: !!o, pid: o ? o.id : -1, duty: o ? !!o.getVariable('duty') : false, sq: sq ? sq.n : '', last: r.last_login ? new Date(r.last_login).getTime() : 0 };
    });
}
function finesOf(id) { return G.fines.filter(function (x) { return x.s === Number(id) && !x.paid; }); }
async function tabletData(p) {
    const f = fac(p), x = F(f);
    const pol = isPolice(p);
    const W = global.WantedSystem;
    const mem = await members(f);
    const out = {
        f: f, fn: NAMES[f] || f, me: { id: sid(p), n: nick(p), r: rank(p), rn: isLeader(p) ? x.ranks[x.ranks.length - 1] : rankName(f, rank(p)), lead: isLeader(p), dep: isDep(p), manage: canManage(p) },
        ranks: x.ranks, squads: x.squads.map(function (s, i) { return { i: i, n: s.n, lead: s.l, m: s.m, minR: s.r || 1 }; }),
        members: mem, stock: Object.keys(ARMORY_ITEMS).map(function (k) { return { n: ARMORY_ITEMS[k].n, c: x.stock[k] || 0 }; }), log: x.log.slice(0, 40), police: pol,
        web: !!p.web, can: {}, perms: Object.keys(PERMS).filter(function (k) { return permVisible(f, k); }).map(function (k) { return { k: k, n: PERMS[k].n, r: x.perms[k], pol: !!PERMS[k].pol }; })
    };
    Object.keys(PERMS).forEach(function (k) { out.can[k] = can(p, k); });
    if (p.web) out.can.track = false;
    out.treasury = await treasuryData(p);
    if (f === 'army' && global.ArmySystem) out.army = global.ArmySystem.info();
    if (out.can.wantedList && W) {
        const wl = W.list();
        const ids = wl.map(function (w) { return w.s; });
        const nm = ids.length ? await q('SELECT id, nick, login FROM accounts WHERE id IN (' + ids.map(Number).join(',') + ')') : [];
        out.wanted = wl.map(function (w) {
            const r = nm.find(function (z) { return Number(z.id) === w.s; });
            const o = online(w.s);
            return { s: w.s, n: r ? String(r.nick || r.login).replace(/_/g, ' ') : '#' + w.s, stars: w.stars, r: w.r, by: w.by, d: w.d, on: !!o, pid: o ? o.id : -1, fines: finesOf(w.s).length };
        }).sort(function (a, b) { return b.stars - a.stars; });
        out.fines = out.can.search ? G.fines.filter(function (z) { return !z.paid; }).slice(-60).reverse() : [];
    }
    return out;
}
async function sendTablet(p) {
    const d = await tabletData(p);
    if (p.web || mp.players.exists(p)) p.call('gov:tablet', [JSON.stringify(d)]);
}
mp.events.add('srv:tab:open', function (p) {
    if (!isGovF(fac(p))) return notify(p, 'warn', 'Планшет доступен только сотрудникам гос. структур');
    sendTablet(p);
});
mp.events.addCommand('tablet', function (p) { mp.events.call('srv:tab:open', p); });

function tabErr(p, t) { p.call('gov:tabToast', [t, 0]); }
mp.events.add('srv:tab:act', function (p, json) { tabAct(p, json); });
async function tabAct(p, json) {
    let d; try { d = JSON.parse(json); } catch (e) { return; }
    const f = fac(p);
    if (!isGovF(f)) return;
    const x = F(f);
    const a = d.a;
    const mgr = canManage(p);
    const done = function (t) { if (t) p.call('gov:tabToast', [t, 1]); return sendTablet(p); };

    if (['rankup', 'rankdown', 'fire', 'dep', 'invite', 'rname', 'radd', 'rdel', 'sqadd', 'sqdel', 'sqjoin', 'sqkick', 'sqlead', 'sqren'].indexOf(a) >= 0 && !mgr) return tabErr(p, 'Только лидер или заместитель');

    if (['salset', 'taxes', 'grant'].indexOf(a) >= 0) { if (!treasuryAct(p, d)) return sendTablet(p); return; }
    if (a === 'perm') {
        if (!isLeader(p)) return tabErr(p, 'Права доступа меняет только лидер');
        if (!PERMS[d.k] || !permVisible(f, d.k)) return;
        x.perms[d.k] = Math.max(1, Math.min(x.ranks.length, Number(d.r) || 1));
        mark(); flog(f, nick(p) + ' изменил доступ «' + PERMS[d.k].n + '» → с ранга ' + x.perms[d.k]);
        return done('Права обновлены');
    }
    if (a === 'invite') {
        if (p.web) return tabErr(p, 'Приглашать можно только в игре (игрок должен стоять рядом)');
        const t = mp.players.at(Number(d.id));
        if (!t || !mp.players.exists(t) || !t.account) return tabErr(p, 'Игрок не найден');
        if (t.position.subtract(p.position).length() > 5) return tabErr(p, 'Игрок должен стоять рядом');
        if (t.account.job) return tabErr(p, 'Игрок уже состоит в организации');
        const ir = 1;
        t.inviteGov = { f: f, by: sid(p), at: Date.now(), r: ir };
        t.call('social:offer', [nick(p) + ' приглашает вас в ' + (NAMES[f] || f) + ' на должность «' + rankName(f, ir) + '»', 30000]);
        notify(t, 'warn', 'Приглашение в ' + (NAMES[f] || f) + ': Y — принять, N — отказаться (или /faccept)');
        return done('Приглашение отправлено');
    }
    if (['rankup', 'rankdown', 'fire', 'dep'].indexOf(a) >= 0) {
        const id = Number(d.id);
        const rows = await q('SELECT id, nick, login, job, job_rank, leader FROM accounts WHERE id = ? LIMIT 1', [id]);
        const r = rows[0];
        if (!r || r.job !== f) return tabErr(p, 'Сотрудник не найден');
        if (id === sid(p)) return tabErr(p, 'Нельзя изменить самого себя');
        if (Number(r.leader) === 1) return tabErr(p, 'Нельзя изменить лидера');
        const tr = Number(r.job_rank) || 1, myR = rank(p);
        if (!isLeader(p) && (tr >= myR || x.deps.indexOf(id) >= 0)) return tabErr(p, 'Нельзя управлять равным или старшим по рангу');
        const name = String(r.nick || r.login).replace(/_/g, ' ');
        const t = online(id);
        if (a === 'dep') {
            if (!isLeader(p)) return tabErr(p, 'Заместителей назначает только лидер');
            const i = x.deps.indexOf(id);
            if (i >= 0) x.deps.splice(i, 1); else { if (x.deps.length >= 3) return tabErr(p, 'Максимум 3 заместителя'); x.deps.push(id); }
            mark(); flog(f, nick(p) + (i >= 0 ? ' снял заместителя ' : ' назначил заместителем ') + name);
            if (t) notify(t, 'ok', i >= 0 ? 'Вы больше не заместитель' : 'Вы назначены заместителем лидера');
            return done(i >= 0 ? 'Заместитель снят' : 'Заместитель назначен');
        }
        if (a === 'fire') {
            await q('UPDATE accounts SET job = NULL, job_rank = 0 WHERE id = ?', [id]);
            const di = x.deps.indexOf(id); if (di >= 0) x.deps.splice(di, 1);
            x.squads.forEach(function (s) { s.m = s.m.filter(function (z) { return z !== id; }); });
            if (t) {
                t.account.job = null; t.account.job_rank = 0; t.account.leader = 0; syncCop(t);
                if (t.getVariable('duty')) setDuty(t, false);
                if (U()) U().govStrip(t, GOV_KEYS);
                notify(t, 'warn', 'Вы уволены из ' + (NAMES[f] || f) + (d.reason ? '. Причина: ' + d.reason : ''));
            }
            mark(); flog(f, nick(p) + ' уволил ' + name + (d.reason ? ' (' + d.reason + ')' : ''));
            return done('Сотрудник уволен');
        }
        const nr = a === 'rankup' ? tr + 1 : tr - 1;
        if (nr < 1 || nr > x.ranks.length - 1) return tabErr(p, 'Недопустимый ранг');
        if (!isLeader(p) && nr >= rank(p)) return tabErr(p, 'Нельзя повысить до своего ранга');
        await q('UPDATE accounts SET job_rank = ? WHERE id = ?', [nr, id]);
        if (t) { t.account.job_rank = nr; notify(t, a === 'rankup' ? 'ok' : 'warn', (a === 'rankup' ? 'Вас повысили до ' : 'Вас понизили до ') + rankName(f, nr)); }
        flog(f, nick(p) + (a === 'rankup' ? ' повысил ' : ' понизил ') + name + ' → ' + rankName(f, nr));
        return done('Ранг изменён: ' + rankName(f, nr));
    }
    if (a === 'rname') {
        if (!isLeader(p)) return tabErr(p, 'Ранги меняет только лидер');
        const i = Number(d.i), n = String(d.n || '').trim().slice(0, 32);
        if (!x.ranks[i] || !n) return;
        x.ranks[i] = n; mark(); return done('Ранг переименован');
    }
    if (a === 'radd') {
        if (!isLeader(p)) return tabErr(p, 'Ранги меняет только лидер');
        const n = String(d.n || '').trim().slice(0, 32);
        if (!n || x.ranks.length >= 15) return tabErr(p, 'Максимум 15 рангов');
        x.ranks.splice(x.ranks.length - 1, 0, n); mark(); return done('Ранг добавлен');
    }
    if (a === 'rdel') {
        if (!isLeader(p)) return tabErr(p, 'Ранги меняет только лидер');
        if (x.ranks.length <= 3) return tabErr(p, 'Минимум 3 ранга');
        const i = Number(d.i);
        if (i <= 0 || i >= x.ranks.length - 1) return tabErr(p, 'Нельзя удалить первый и высший ранг');
        x.ranks.splice(i, 1); mark(); return done('Ранг удалён');
    }
    if (a === 'sqadd') {
        const n = String(d.n || '').trim().slice(0, 32);
        if (!n) return;
        if (x.squads.length >= 12) return tabErr(p, 'Максимум 12 отрядов');
        x.squads.push({ n: n, l: 0, m: [], r: Math.max(1, Number(d.r) || 1) }); mark(); flog(f, nick(p) + ' создал отряд «' + n + '»');
        return done('Отряд создан');
    }
    const sq = x.squads[Number(d.i)];
    if (a === 'sqdel' && sq) { x.squads.splice(Number(d.i), 1); mark(); flog(f, nick(p) + ' расформировал отряд «' + sq.n + '»'); return done('Отряд удалён'); }
    if (a === 'sqren' && sq) { const n = String(d.n || '').trim().slice(0, 32); if (n) { sq.n = n; mark(); } return done('Готово'); }
    if (a === 'sqjoin' && sq) {
        const id = Number(d.id);
        x.squads.forEach(function (s) { s.m = s.m.filter(function (z) { return z !== id; }); if (s.l === id) s.l = 0; });
        sq.m.push(id); mark();
        const t = online(id); if (t) notify(t, 'ok', 'Вы зачислены в отряд «' + sq.n + '»');
        return done('Добавлен в отряд');
    }
    if (a === 'sqkick' && sq) { const id = Number(d.id); sq.m = sq.m.filter(function (z) { return z !== id; }); if (sq.l === id) sq.l = 0; mark(); return done('Исключён из отряда'); }
    if (a === 'sqlead' && sq) { const id = Number(d.id); if (sq.m.indexOf(id) < 0) sq.m.push(id); sq.l = id; mark(); return done('Командир отряда назначен'); }

    /* ---- база данных ---- */
    const need = { search: 'search', plate: 'plate', wanted: 'wanted', fine: 'fine', note: 'note', track: 'track' }[a];
    if (!need) return;
    if (!can(p, need)) return tabErr(p, PERMS[need].pol && !isPolice(p) ? 'Доступно только полиции, шерифу и FIB' : 'Недостаточно прав: «' + PERMS[need].n + '» с ' + (x.perms[need] || PERMS[need].r) + ' ранга');
    if (a === 'search') {
        const full = can(p, 'dossier');
        const s = String(d.q || '').trim();
        if (s.length < 2) return tabErr(p, 'Введите минимум 2 символа');
        let rows;
        const byPhone = /^\d{3}-\d{3}$/.test(s) && U() && U().sidByPhone ? U().sidByPhone(s) : 0;
        if (byPhone) rows = await q('SELECT id, nick, login, job, job_rank, created_at, gender FROM accounts WHERE id = ? LIMIT 1', [byPhone]);
        else if (/^#?\d+$/.test(s)) rows = await q('SELECT id, nick, login, job, job_rank, created_at, gender FROM accounts WHERE id = ? LIMIT 1', [Number(s.replace('#', ''))]);
        else rows = await q('SELECT id, nick, login, job, job_rank, created_at, gender FROM accounts WHERE nick LIKE ? LIMIT 10', ['%' + s.replace(/%/g, '').replace(/\s+/g, '_') + '%']);
        const W = global.WantedSystem;
        const res = [];
        for (const r of rows) {
            const id = Number(r.id);
            const docs = U() && U().docsOf ? U().docsOf('a' + id) : [];
            const veh = full ? await q('SELECT model, plate FROM vehicles WHERE owner_id = ? LIMIT 10', [id]) : [];
            const H = global.HouseSystem;
            const w = W ? W.info(id) : null;
            res.push({
                s: id, n: String(r.nick || r.login).replace(/_/g, ' '), g: Number(r.gender) === 1 ? 'Ж' : 'М',
                job: r.job ? (NAMES[r.job] || r.job) : 'Безработный', phone: full && U() && U().phoneOf ? U().phoneOf('a' + id) : null, full: full,
                docs: docs.map(function (z) { return { t: z.t, num: z.num || '', until: z.until || '' }; }),
                veh: veh.map(function (v) { return v.model + ' · ' + v.plate; }),
                house: full && H && H.byOwner ? H.byOwner(id) : null,
                wanted: w ? { stars: w.s, r: w.r, by: w.by } : null,
                fines: G.fines.filter(function (z) { return z.s === id; }).slice(-20).reverse(),
                notes: (G.records[id] || []).slice(-20).reverse(),
                on: full ? !!online(id) : false
            });
        }
        if (!res.length) return tabErr(p, 'Ничего не найдено');
        return p.call('gov:tabSearch', [JSON.stringify(res)]);
    }
    if (a === 'plate') {
        const s = String(d.q || '').trim().toUpperCase().slice(0, 8);
        const live = mp.vehicles.toArray().find(function (v) { return String(v.numberPlate || '').trim().toUpperCase() === s; });
        const rows = await q('SELECT v.model, v.plate, a.id, a.nick, a.login FROM vehicles v LEFT JOIN accounts a ON a.id = v.owner_id WHERE UPPER(v.plate) = ? LIMIT 1', [s]);
        if (!rows[0] && !live) return tabErr(p, 'Номер не найден в базе');
        const r = rows[0];
        const gf = live && live.getVariable('gov');
        return p.call('gov:tabPlate', [JSON.stringify({ plate: s, model: r ? r.model : (live && live.getVariable('govModel')) || '—', owner: r ? String(r.nick || r.login).replace(/_/g, ' ') : gf ? 'Служебный транспорт ' + (NAMES[gf] || gf) : 'Неизвестно', s: r ? Number(r.id) : 0 })]);
    }
    if (a === 'wanted') {
        const id = Number(d.s), n = Math.max(0, Math.min(5, Number(d.stars) || 0));
        if (!id) return;
        if (n && !String(d.r || '').trim()) return tabErr(p, 'Укажите причину');
        const W = global.WantedSystem; if (!W) return;
        W.setById(id, n, String(d.r || '').slice(0, 80), nick(p));
        addRecord(id, p, n ? 'Объявлен в розыск ' + n + '★: ' + d.r : 'Розыск снят');
        flog(f, nick(p) + (n ? ' объявил в розыск #' + id + ' (' + n + '★)' : ' снял розыск с #' + id));
        const t = online(id); if (t) notify(t, n ? 'warn' : 'ok', n ? 'Вы объявлены в розыск: ' + n + '★ · ' + d.r : 'Ваш розыск снят');
        return done(n ? 'Розыск объявлен' : 'Розыск снят');
    }
    if (a === 'fine') {
        const id = Number(d.s), sum = Math.floor(Number(d.sum));
        const why = String(d.r || '').trim().slice(0, 80);
        if (!id || !(sum >= 50 && sum <= 100000) || !why) return tabErr(p, 'Сумма $50–100 000 и причина обязательны');
        const fn = { id: G.seq++, s: id, sum: sum, r: why, by: nick(p), f: f, at: Date.now(), paid: false };
        G.fines.push(fn);
        if (G.fines.length > 3000) G.fines.splice(0, G.fines.length - 3000);
        addRecord(id, p, 'Штраф ' + money(sum) + ': ' + why);
        mark();
        const t = online(id); if (t) notify(t, 'warn', 'Вам выписан штраф ' + money(sum) + ': ' + why + '. Оплатить: /fines');
        return done('Штраф выписан');
    }
    if (a === 'note') {
        const id = Number(d.s), t = String(d.t || '').trim().slice(0, 200);
        if (!id || !t) return;
        addRecord(id, p, t);
        return done('Запись добавлена в досье');
    }
    if (a === 'track') {
        if (p.web) return tabErr(p, 'Отслеживание доступно только в игре');
        const t = online(Number(d.s));
        if (!t) return tabErr(p, 'Абонент вне сети — отследить невозможно');
        if (t.dimension !== 0) return tabErr(p, 'Сигнал потерян (абонент в помещении). Попробуйте позже');
        if (p.lastTrack && Date.now() - p.lastTrack < 30000) return tabErr(p, 'Повторное отслеживание через ' + Math.ceil((30000 - (Date.now() - p.lastTrack)) / 1000) + ' сек');
        p.lastTrack = Date.now();
        const ang = Math.random() * Math.PI * 2, off = 80 + Math.random() * 170;
        const cx = t.position.x + Math.cos(ang) * off, cy = t.position.y + Math.sin(ang) * off;
        p.call('gov:track', [cx, cy, 300, nick(t)]);
        flog(f, nick(p) + ' отследил сигнал #' + sid(t));
        return notify(p, 'ok', 'Сигнал засечён: ' + nick(t) + ' где-то в красной зоне (~300 м). Ищите сами');
    }
}
function syncCop(p) {
    const f = fac(p);
    if ((p.getVariable('fac') || '') !== f) p.setVariable('fac', f);
    const c = POLICE.indexOf(f) >= 0 ? 1 : 0;
    if (p.getVariable('cop') !== c) p.setVariable('cop', c);
}
setInterval(function () { mp.players.forEach(function (p) { if (p.account) syncCop(p); }); }, 3000);
function addRecord(id, p, text) {
    if (!G.records[id]) G.records[id] = [];
    G.records[id].push({ t: Date.now(), x: text, by: nick(p), f: NAMES[fac(p)] || fac(p) });
    if (G.records[id].length > 60) G.records[id].splice(0, G.records[id].length - 60);
    mark();
}

/* ---- приглашение ---- */
async function acceptInvite(p) {
    const inv = p.inviteGov;
    if (!inv || Date.now() - inv.at > 60000) return notify(p, 'warn', 'Нет активных приглашений');
    p.inviteGov = null;
    if (!p.account) return;
    if (p.account.job) return notify(p, 'error', 'Вы уже состоите в организации');
    const ir = Math.max(1, Number(inv.r) || 1);
    p.account.job = inv.f; p.account.job_rank = ir; p.account.leader = 0;
    p.setVariable('fac', inv.f);
    syncCop(p);
    await q('UPDATE accounts SET job = ?, job_rank = ?, leader = 0 WHERE id = ?', [inv.f, ir, sid(p)]);
    if (U() && U().giveDoc) try { U().giveDoc(p, 'faction', { f: inv.f === 'sheriff' ? 'lspd' : inv.f, pos: rankName(inv.f, ir) }, NAMES[inv.f]); } catch (e) {}
    flog(inv.f, nick(p) + ' принят в организацию: ' + rankName(inv.f, ir));
    notify(p, 'ok', 'Вы приняты в ' + (NAMES[inv.f] || inv.f) + ': ' + rankName(inv.f, ir) + '. Планшет — F6');
    const by = online(inv.by); if (by) { notify(by, 'ok', nick(p) + ' принял приглашение'); }
}
mp.events.addCommand('faccept', function (p) { acceptInvite(p); });
try { mp.events.addCommand('accept', function (p, arg) { if (p.inviteGov && !String(arg || '').trim()) return acceptInvite(p); if (global.MedicAccept) return global.MedicAccept(p, arg); notify(p, 'warn', 'Нет активных приглашений'); }); } catch (e) { console.log('[gov] /accept занята другим модулем — используйте /faccept или Y'); }
mp.events.add('srv:int:answer', function (p, yes) {
    if (!p.inviteGov || Date.now() - p.inviteGov.at > 60000) return;
    if (!yes) { const by = online(p.inviteGov.by); p.inviteGov = null; if (by) notify(by, 'warn', nick(p) + ' отклонил приглашение'); return notify(p, 'warn', 'Приглашение отклонено'); }
    acceptInvite(p);
});

/* ---- штрафы ---- */
mp.events.addCommand('fines', function (p, full) {
    const my = finesOf(sid(p));
    const arg = String(full || '').trim();
    if (!arg) {
        if (!my.length) return notify(p, 'ok', 'Неоплаченных штрафов нет');
        p.outputChatBox('!{#ffcc66}Неоплаченные штрафы:');
        my.forEach(function (z) { p.outputChatBox('!{#ffffff}#' + z.id + ' · ' + money(z.sum) + ' · ' + z.r + ' (' + z.by + ')'); });
        return p.outputChatBox('!{#ffcc66}Оплатить: /fines pay [номер] или /fines pay all (со счёта в банке)');
    }
    const a = arg.split(/\s+/);
    if (a[0] !== 'pay') return;
    const list = a[1] === 'all' ? my : my.filter(function (z) { return z.id === Number(a[1]); });
    if (!list.length) return notify(p, 'warn', 'Штраф не найден');
    const sum = list.reduce(function (s, z) { return s + z.sum; }, 0);
    const M = global.MoneySystem;
    if (!M || M.bank(p) < sum) return notify(p, 'error', 'На счёте недостаточно денег: нужно ' + money(sum));
    M.addBank(p, -sum);
    list.forEach(function (z) { z.paid = true; z.paidAt = Date.now(); });
    if (global.GovSystem) global.GovSystem.add(sum, 'Оплата штрафов: ' + nick(p));
    mark();
    notify(p, 'ok', 'Оплачено штрафов на ' + money(sum));
});

mp.events.add('playerReady', function (p) { setTimeout(function () { if (mp.players.exists(p)) sendPoints(p); }, 5000); });
setTimeout(function () { mp.players.forEach(sendPoints); }, 3000);

/* ================= ВЕБ-ПЛАНШЕТ ================= */
const WEB = Object.assign({ enabled: true, port: 22011, host: '' }, (function () { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'gov_web.json'), 'utf8')); } catch (e) { return {}; } })());
const sessions = {};
function webFile(n) {
    const tries = [path.join(__dirname, 'tablet_web', n), path.join(__dirname, '..', '..', '..', 'client_packages', 'cef', 'tablet', n)];
    for (const f of tries) { try { return fs.readFileSync(f, 'utf8'); } catch (e) {} }
    return '';
}
function webPage() {
    const html = webFile('index.html'), css = webFile('style.css'), js = webFile('app.js'), bridge = webFile('web.js');
    return html.replace('<link rel="stylesheet" href="style.css">', function () { return '<meta name="viewport" content="width=device-width, initial-scale=1"><style>' + css + '</style>'; })
        .replace('<script src="app.js"></script>', function () { return '<script>' + bridge + '</script><script>' + js + '</script>'; });
}
async function webUser(id) {
    const r = (await q('SELECT id, nick, login, job, job_rank, leader, banned FROM accounts WHERE id = ? LIMIT 1', [id]))[0];
    if (!r || Number(r.banned) === 1 || !isGovF(r.job)) return null;
    const out = [];
    return {
        web: true, out: out, id: -1, name: String(r.nick || r.login), dimension: 0, position: { x: 0, y: 0, z: 0, subtract: function () { return { length: function () { return 9999; } }; } },
        account: { id: Number(r.id), nick: r.nick || r.login, job: r.job, job_rank: Number(r.job_rank) || 1, leader: Number(r.leader) || 0 },
        call: function (ev, args) { out.push([ev, args || []]); }, getVariable: function () { return null; }, setVariable: function () {}, outputChatBox: function () {}
    };
}
if (WEB.enabled) {
    try {
        const http = require('http'), crypto = require('crypto');
        const hits = {};
        http.createServer(function (req, res) {
            const ip = req.socket.remoteAddress;
            hits[ip] = (hits[ip] || []).filter(function (t) { return Date.now() - t < 10000; });
            hits[ip].push(Date.now());
            if (hits[ip].length > 60) { res.writeHead(429); return res.end('slow down'); }
            const send = function (code, o) { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(o)); };
            if (req.method === 'GET' && (req.url === '/' || req.url.indexOf('/?') === 0)) { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(webPage()); }
            if (req.method !== 'POST' || req.url !== '/api') { res.writeHead(404); return res.end(); }
            let body = '';
            req.on('data', function (c) { body += c; if (body.length > 6000) req.destroy(); });
            req.on('end', async function () {
                let d; try { d = JSON.parse(body); } catch (e) { return send(400, { err: 'bad json' }); }
                if (d.op === 'login') {
                    const lg = String(d.login || '').trim().slice(0, 32);
                    const r = (await q('SELECT id, password, job, banned FROM accounts WHERE login = ? OR username = ? LIMIT 1', [lg, lg]))[0];
                    const A = global.AuthSystem;
                    if (!r || !A || !A.check || !A.check(String(d.pass || ''), r.password)) { await new Promise(function (ok) { setTimeout(ok, 800); }); return send(403, { err: 'Неверный логин или пароль' }); }
                    if (Number(r.banned) === 1) return send(403, { err: 'Аккаунт заблокирован' });
                    if (!isGovF(r.job)) return send(403, { err: 'Веб-планшет доступен только сотрудникам гос. структур' });
                    const tk = crypto.randomBytes(20).toString('hex');
                    sessions[tk] = { id: Number(r.id), exp: Date.now() + 12 * 3600000 };
                    const u = await webUser(r.id);
                    await sendTablet(u);
                    if (global.SLog) try { global.SLog.add('connect', { actor: lg, action: 'web-tablet', details: 'вход в веб-планшет', ip: ip }); } catch (e) {}
                    return send(200, { token: tk, ev: u.out });
                }
                const ss = sessions[String(d.token || '')];
                if (!ss || ss.exp < Date.now()) return send(401, { err: 'Сессия истекла — войдите снова' });
                if (d.op === 'logout') { delete sessions[d.token]; return send(200, { ok: 1 }); }
                const u = await webUser(ss.id);
                if (!u) { delete sessions[d.token]; return send(401, { err: 'Вы больше не состоите в гос. структуре' }); }
                if (d.op === 'refresh') { await sendTablet(u); return send(200, { ev: u.out }); }
                if (d.op === 'act') { await tabAct(u, String(d.json || '{}')); return send(200, { ev: u.out }); }
                send(400, { err: 'unknown' });
            });
        }).listen(WEB.port, function () { console.log('[gov] веб-планшет: порт ' + WEB.port); }).on('error', function (e) { console.log('[gov] веб-планшет не запущен: ' + e.message); });
    } catch (e) { console.log('[gov] веб-планшет: ' + e.message); }
}
mp.events.addCommand('webtablet', function (p) {
    if (!isGovF(fac(p))) return notify(p, 'warn', 'Только для сотрудников гос. структур');
    p.outputChatBox('!{#7fd4ff}Веб-планшет: !{#ffffff}http://' + (WEB.host || 'IP_СЕРВЕРА') + ':' + WEB.port + '/ !{#9a9aa8}— вход по логину и паролю от игрового аккаунта');
});

/* ================= АДМИН-ПАНЕЛЬ ================= */
async function adminFac(p, d, by) {
    const f = String(d.f || '');
    const ALL = { lspd: 1, sheriff: 1, fib: 1, army: 1, gov: 1, news: 1, medic: 1 };
    if (!ALL[f]) return { err: 'Неизвестная фракция' };
    const gov = isGovF(f);
    const x = gov ? F(f) : null;
    const ranks = x ? x.ranks : ['Интерн', 'Фельдшер', 'Врач', 'Зав. отделением', 'Главврач'];
    const pack = async function (ok) {
        const mem = gov ? await members(f) : (await q('SELECT id, nick, login, job_rank, leader, last_login FROM accounts WHERE job = ? ORDER BY job_rank DESC LIMIT 200', [f])).map(function (r) {
            const o = online(r.id);
            return { id: Number(r.id), n: String(r.nick || r.login || '#' + r.id).replace(/_/g, ' '), r: Number(r.job_rank) || 1, rn: ranks[Math.max(0, Math.min(ranks.length, Number(r.job_rank) || 1) - 1)], lead: Number(r.leader) === 1, on: !!o, pid: o ? o.id : -1, last: r.last_login ? new Date(r.last_login).getTime() : 0 };
        });
        return {
            ok: ok, data: {
                f: f, gov: gov, ranks: ranks, members: mem,
                stock: gov ? Object.keys(ARMORY_ITEMS).map(function (k) { return { k: k, n: ARMORY_ITEMS[k].n, c: x.stock[k] || 0 }; }) : [],
                points: gov && x.points ? { armory: !!x.points.armory, locker: !!x.points.locker, garage: !!x.points.garage, spawns: (x.points.spawns || []).length } : null,
                log: gov ? x.log.slice(0, 30) : []
            }
        };
    };
    if (d.op === 'load') return pack();
    return { err: 'Администрация назначает только лидера. Составом управляет лидер через планшет' };
    const id = Number(d.s) || 0;
    if (d.op === 'add') {
        let t = d.id !== undefined && d.id !== '' ? mp.players.at(Number(d.id)) : null;
        const sidT = t && t.account ? sid(t) : id;
        if (!sidT) return { err: 'Укажите ID игрока в сети или #static' };
        const r = Math.max(1, Math.min(ranks.length - 1, Number(d.r) || 1));
        await q('UPDATE accounts SET job = ?, job_rank = ?, leader = 0 WHERE id = ?', [f, r, sidT]);
        t = t || online(sidT);
        if (t && t.account) { t.account.job = f; t.account.job_rank = r; t.account.leader = 0; syncCop(t); notify(t, 'ok', 'Администрация зачислила вас в ' + (NAMES[f] || f) + ': ' + ranks[r - 1]); }
        if (gov) flog(f, 'Администрация (' + by + ') зачислила #' + sidT + ' — ' + ranks[r - 1]);
        return pack('Зачислен на ранг ' + r);
    }
    if (d.op === 'stock') {
        if (!gov) return { err: 'У этой фракции нет склада' };
        Object.keys(SUPPLY_PACK).forEach(function (k) { x.stock[k] = (x.stock[k] || 0) + SUPPLY_PACK[k]; });
        mark(); flog(f, 'Администрация пополнила склад');
        return pack('Склад пополнен');
    }
    if (!id) return { err: 'Не выбран сотрудник' };
    const row = (await q('SELECT id, job, job_rank, leader FROM accounts WHERE id = ? LIMIT 1', [id]))[0];
    if (!row || row.job !== f) return { err: 'Сотрудник не найден в этой фракции' };
    const t = online(id);
    if (d.op === 'rank') {
        const r = Math.max(1, Math.min(ranks.length, Number(d.r) || 1));
        await q('UPDATE accounts SET job_rank = ? WHERE id = ?', [r, id]);
        if (t && t.account) { t.account.job_rank = r; notify(t, 'ok', 'Ваш ранг изменён администрацией: ' + ranks[r - 1]); }
        if (gov) flog(f, 'Администрация (' + by + ') изменила ранг #' + id + ' → ' + ranks[r - 1]);
        return pack('Ранг изменён');
    }
    if (d.op === 'kick') {
        await q('UPDATE accounts SET job = NULL, job_rank = 0, leader = 0 WHERE id = ?', [id]);
        if (gov) { const di = x.deps.indexOf(id); if (di >= 0) x.deps.splice(di, 1); x.squads.forEach(function (s) { s.m = s.m.filter(function (z) { return z !== id; }); if (s.l === id) s.l = 0; }); mark(); }
        if (t && t.account) {
            t.account.job = null; t.account.job_rank = 0; t.account.leader = 0; syncCop(t);
            if (t.getVariable('duty')) setDuty(t, false);
            if (U()) U().govStrip(t, GOV_KEYS);
            notify(t, 'warn', 'Администрация исключила вас из ' + (NAMES[f] || f));
        }
        if (gov) flog(f, 'Администрация (' + by + ') исключила #' + id);
        return pack('Исключён из фракции');
    }
    if (d.op === 'dep' && gov) {
        const i = x.deps.indexOf(id);
        if (i >= 0) x.deps.splice(i, 1); else x.deps.push(id);
        mark();
        return pack(i >= 0 ? 'Заместитель снят' : 'Назначен заместителем');
    }
    return { err: 'Неизвестное действие' };
}

/* ---- автоматические штрафы (камеры) ---- */
function autoFine(p, sum, reason, by) {
    const id = sid(p);
    if (!id) return null;
    const fn = { id: G.seq++, s: id, sum: sum, r: reason, by: by, f: 'lspd', at: Date.now(), paid: false };
    G.fines.push(fn);
    if (G.fines.length > 3000) G.fines.splice(0, G.fines.length - 3000);
    if (!G.records[id]) G.records[id] = [];
    G.records[id].push({ t: Date.now(), x: 'Штраф ' + money(sum) + ': ' + reason, by: by, f: NAMES.lspd || 'LSPD' });
    if (G.records[id].length > 60) G.records[id].splice(0, G.records[id].length - 60);
    mark();
    return fn;
}


/* ================= КАЗНА И ЗАРПЛАТЫ ================= */
const MED_RANKS = ['Интерн', 'Фельдшер', 'Врач', 'Зав. отделением', 'Главврач'];
const PAY_FACS = Object.keys(DEF_RANKS).concat(['medic']);
function BUD() {
    if (!G.budget) G.budget = {};
    const B = G.budget;
    if (!B.sal) B.sal = {};
    if (B.income === undefined) B.income = 10;
    if (B.job === undefined) B.job = 5;
    if (B.prop === undefined) B.prop = 150;
    if (B.veh === undefined) B.veh = 40;
    if (!B.min) B.min = 60;
    if (!B.next) B.next = Date.now() + B.min * 60000;
    if (!B.hist) B.hist = [];
    return B;
}
function salRanks(f) { return f === 'medic' ? MED_RANKS : F(f).ranks; }
function defSal(i) { return 600 + i * 250; }
function salOf(f, r) {
    const R = salRanks(f), arr = BUD().sal[f] || [];
    const i = Math.max(1, Math.min(R.length, Number(r) || 1)) - 1;
    return arr[i] !== undefined && arr[i] !== null ? Number(arr[i]) : defSal(i);
}
function paysFac(f) { return PAY_FACS.indexOf(f) >= 0; }
function isGovernor(p) { return (fac(p) === 'gov' && isLeader(p)) || admLvl(p) >= 6; }
function GS() { return global.GovSystem; }
function payNet(gross) { const t = Math.floor(gross * BUD().income / 100); return { gross: gross, tax: t, net: gross - t }; }
function chargeTax(p, sum) {
    const M = global.MoneySystem;
    if (!M || sum <= 0) return 0;
    const cash = M.get(p), bank = M.bank(p);
    if (cash + bank < sum) return -1;
    const fb = Math.min(bank, sum);
    M.set(p, cash - (sum - fb), bank - fb, 'tax');
    return sum;
}
let jobTaxBuf = 0;
setInterval(function () { if (jobTaxBuf > 0 && GS()) { GS().add(jobTaxBuf, 'Подоходный налог с работ'); jobTaxBuf = 0; } }, 300000);
async function govPayday() {
    const B = BUD();
    B.next = Date.now() + B.min * 60000; mark();
    if (!GS()) return;
    let bal = GS().get().balance;
    const st = { t: Date.now(), paid: 0, tax: 0, prop: 0, veh: 0, n: 0, unpaid: 0 };
    const list = mp.players.toArray().filter(function (p) { return p.account && sid(p); });
    for (const p of list) {
        if (!mp.players.exists(p)) continue;
        const f = fac(p);
        if (f && paysFac(f)) {
            const x = payNet(salOf(f, rank(p)));
            if (x.gross > 0) {
                if (bal >= x.net) {
                    bal -= x.net; st.paid += x.net; st.tax += x.tax; st.n++;
                    global.MoneySystem.addBank(p, x.net);
                    notify(p, 'ok', 'Зарплата ' + (NAMES[f] || f) + ': ' + money(x.net) + ' на счёт' + (x.tax ? ' (налог ' + money(x.tax) + ')' : ''));
                } else { st.unpaid++; notify(p, 'warn', 'Казна штата пуста — зарплата не выплачена'); }
            }
        }
        const H = global.HouseSystem;
        if (B.prop > 0 && H && H.mine && H.mine(p)) {
            const r = chargeTax(p, B.prop);
            if (r > 0) { st.prop += r; notify(p, 'warn', 'Налог на недвижимость: -' + money(r)); }
            else if (r < 0) notify(p, 'error', 'Не хватает денег на налог на недвижимость ' + money(B.prop));
        }
        if (B.veh > 0) {
            const c = await q('SELECT COUNT(*) c FROM vehicles WHERE owner_id = ?', [sid(p)]);
            const n = c[0] ? Number(c[0].c) || 0 : 0;
            if (n > 0 && mp.players.exists(p)) {
                const r = chargeTax(p, B.veh * n);
                if (r > 0) { st.veh += r; notify(p, 'warn', 'Транспортный налог (' + n + ' авто): -' + money(r)); }
            }
        }
    }
    if (st.paid) GS().add(-st.paid, 'Зарплаты госслужащих (' + st.n + ' чел.)');
    if (st.prop) GS().add(st.prop, 'Налог на недвижимость');
    if (st.veh) GS().add(st.veh, 'Транспортный налог');
    B.last = st; B.hist.unshift(st); if (B.hist.length > 24) B.hist.length = 24;
    mark();
    console.log('[gov] зарплаты: ' + money(st.paid) + ' (' + st.n + ' чел.), налоги ' + money(st.tax + st.prop + st.veh));
}
setInterval(function () { if (Date.now() >= BUD().next) govPayday().catch(function (e) { console.log('[gov] payday: ' + e.message); }); }, 30000);
function salaryInfo(p) {
    const f = fac(p);
    if (!f || !paysFac(f)) return null;
    const x = payNet(salOf(f, rank(p)));
    const R = salRanks(f), r = Math.max(1, Math.min(R.length, rank(p)));
    return { f: f, fn: NAMES[f] || f, rn: R[r - 1], gross: x.gross, tax: x.tax, net: x.net, next: BUD().next, min: BUD().min };
}
async function treasuryData(p) {
    const B = BUD(), g = GS() ? GS().get() : { balance: 0, tax: 0 }, gov = isGovernor(p), f = fac(p);
    const fund = mp.players.toArray().reduce(function (s, x) { const ff = fac(x); return x.account && ff && paysFac(ff) ? s + payNet(salOf(ff, rank(x))).net : s; }, 0);
    const facs = (gov || f === 'gov' ? PAY_FACS : [f]).map(function (k) { return { f: k, fn: NAMES[k] || k, ranks: salRanks(k).map(function (n, i) { return { n: n, s: salOf(k, i + 1) }; }) }; });
    let hist = [];
    if ((gov || f === 'gov') && GS()) { try { hist = (await GS().history()).map(function (h) { return { a: Number(h.amount), x: h.text, t: new Date(h.created_at).getTime() }; }); } catch (e) {} }
    return { bal: g.balance, sell: g.tax, income: B.income, job: B.job, prop: B.prop, veh: B.veh, min: B.min, next: B.next, last: B.last || null, fund: fund, gov: gov, my: salaryInfo(p), facs: facs, hist: hist, days: B.hist.slice(0, 12) };
}
function treasuryAct(p, d) {
    if (!isGovernor(p)) { tabErr(p, 'Только губернатор'); return true; }
    const B = BUD();
    if (d.a === 'salset') {
        if (!paysFac(d.f)) return true;
        const R = salRanks(d.f);
        B.sal[d.f] = R.map(function (n, i) { const v = Math.floor(Number((d.v || [])[i])); return isFinite(v) ? Math.max(0, Math.min(100000, v)) : salOf(d.f, i + 1); });
        mark(); flog('gov', nick(p) + ' изменил зарплаты: ' + (NAMES[d.f] || d.f));
        p.call('gov:tabToast', ['Зарплаты ' + (NAMES[d.f] || d.f) + ' сохранены', 1]);
        return false;
    }
    if (d.a === 'taxes') {
        const c = function (v, a, b, def) { v = Math.floor(Number(v)); return isFinite(v) ? Math.max(a, Math.min(b, v)) : def; };
        B.income = c(d.income, 0, 50, B.income); B.job = c(d.job, 0, 50, B.job);
        B.prop = c(d.prop, 0, 10000, B.prop); B.veh = c(d.veh, 0, 5000, B.veh);
        if (GS() && d.sell !== undefined) GS().setTax(c(d.sell, 0, 90, 30));
        mark(); flog('gov', nick(p) + ' изменил налоги: подоходный ' + B.income + '%, с работ ' + B.job + '%, недвижимость ' + money(B.prop) + ', авто ' + money(B.veh));
        p.call('gov:tabToast', ['Налоги обновлены', 1]);
        return false;
    }
    if (d.a === 'grant') {
        const t = online(Number(d.id)), sum = Math.floor(Number(d.sum));
        if (!t) { tabErr(p, 'Сотрудник не в сети'); return true; }
        if (!(sum > 0) || sum > 1000000) { tabErr(p, 'Неверная сумма'); return true; }
        if (!GS() || GS().get().balance < sum) { tabErr(p, 'В казне недостаточно средств'); return true; }
        GS().add(-sum, 'Премия: ' + nick(t) + ' (' + nick(p) + ')');
        global.MoneySystem.addBank(t, sum);
        notify(t, 'ok', 'Губернатор выписал вам премию ' + money(sum));
        flog('gov', nick(p) + ' выписал премию ' + money(sum) + ' → ' + nick(t));
        p.call('gov:tabToast', ['Премия выплачена', 1]);
        return false;
    }
    return true;
}
mp.events.addCommand('budget', function (p) {
    const B = BUD(), g = GS() ? GS().get() : { balance: 0, tax: 0 }, i = salaryInfo(p);
    p.outputChatBox('!{#f2c25a}[Казна] !{#ffffff}Бюджет: ' + money(g.balance) + ' · подоходный ' + B.income + '% · недвижимость ' + money(B.prop) + '/ч · авто ' + money(B.veh) + '/ч');
    if (i) p.outputChatBox('!{#f2c25a}[Зарплата] !{#ffffff}' + i.rn + ': ' + money(i.net) + ' через ' + Math.max(0, Math.ceil((i.next - Date.now()) / 60000)) + ' мин');
});
mp.events.addCommand('govpay', function (p) {
    if (admLvl(p) < 6) return;
    govPayday().then(function () { notify(p, 'ok', 'Зарплаты и налоги начислены'); });
});
global.Treasury = { info: salaryInfo, payday: govPayday, jobTax: function (sum) { const t = Math.floor(sum * BUD().job / 100); if (t > 0) jobTaxBuf += t; return t; } };

global.GovFaction = { can: can, rank: rank, fac: fac, sid: sid, nick: nick, isLeaderP: isLeader, canManage: canManage, F: F, flog: flog, mark: mark, POLICE: POLICE, SUPPLY_PACK: SUPPLY_PACK, ARMORY_ITEMS: ARMORY_ITEMS, autoFine: autoFine, money: money, rankName: rankName, isLeader: isLeader, canManage: canManage, fines: finesOf, F: F, NAMES: NAMES, isGov: isGovF, sync: syncCop, log: flog, admin: adminFac, home: factionHome };
console.log('[gov] госструктуры: склад, раздевалка, автопарк, планшет загружены');
