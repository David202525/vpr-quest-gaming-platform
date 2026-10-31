const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'clothes_data.json');
const C = Object.assign({ seq: 1, sseq: 1, items: {}, shops: null }, (function () { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch (e) { return {}; } })());
let dirty = false;
setInterval(function () { if (dirty) { dirty = false; try { fs.writeFileSync(FILE, JSON.stringify(C)); } catch (e) { console.log('[clothes] save: ' + e.message); } } }, 5000);
function mark() { dirty = true; }

const SLOTS = {
    top: { n: 'Верх', c: 11, i: '👕', w: 0.4 },
    legs: { n: 'Низ', c: 4, i: '👖', w: 0.5 },
    shoes: { n: 'Обувь', c: 6, i: '👟', w: 0.7 },
    hat: { n: 'Головные уборы', p: 0, i: '🧢', w: 0.2 },
    glasses: { n: 'Очки', p: 1, i: '🕶️', w: 0.1 },
    mask: { n: 'Маски', c: 1, i: '🎭', w: 0.2 },
    chain: { n: 'Аксессуары на шею', c: 7, i: '📿', w: 0.1 },
    watch: { n: 'Часы', p: 6, i: '⌚', w: 0.1 },
    bag: { n: 'Рюкзаки и сумки', c: 5, i: '🎒', w: 1 }
};
const SHOP_DEF = [
    ['Binco · Textile City', 72.3, -1399.1, 29.4], ['Binco · Vespucci', -822.4, -1073.7, 11.3],
    ['Suburban · Del Perro', -1193.4, -772.3, 17.3], ['Suburban · Hawick', 125.8, -223.8, 54.6],
    ['Suburban · Chumash', -3172.5, 1048.1, 20.9], ['Ponsonbys · Rockford Hills', -709.9, -153.1, 37.4],
    ['Ponsonbys · Burton', -163.4, -302.7, 39.7], ['Ponsonbys · Morningwood', -1450.1, -237.3, 49.8],
    ['Discount Store · Grapeseed', 1696.3, 4829.3, 42.1], ['Discount Store · Paleto Bay', 5.9, 6511.4, 31.9],
    ['Discount Store · Sandy Shores', 1196.6, 2710.2, 38.2]
];
if (!Array.isArray(C.shops)) {
    C.shops = SHOP_DEF.map(function (s) { return { id: C.sseq++, n: s[0], x: s[1], y: s[2], z: s[3], h: 0 }; });
    mark();
}

function U() { return global.UiSystem; }
function M() { return global.MoneySystem; }
function admLvl(p) { return global.AdminSystem && global.AdminSystem.realLvl ? global.AdminSystem.realLvl(p) : 0; }
function notify(p, type, text) { if (typeof global.hudNotify === 'function') global.hudNotify(p, type, text); else p.outputChatBox(text); }
function sexOf(p) { return p.model === mp.joaat('mp_f_freemode_01') ? 'f' : 'm'; }
function money(n) { return '$' + String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function int(v, d) { const n = Math.floor(Number(v)); return isFinite(n) ? n : d; }
function keyOf(id, tx) { return 'cl' + id + '_' + tx; }

function register(it) {
    const IT = U() && U().ITEMS;
    if (!IT) return;
    const S = SLOTS[it.slot];
    it.tx.forEach(function (tx, i) {
        const cloth = S.p !== undefined ? { p: S.p, d: it.d, tx: tx } : { c: S.c, d: it.d, tx: tx };
        if (it.slot === 'top') { cloth.t = it.t === undefined ? 15 : it.t; if (it.u !== undefined && it.u >= 0) { cloth.u = it.u; cloth.ut = it.ut || 0; } }
        IT[keyOf(it.id, tx)] = { n: it.n + (it.tx.length > 1 ? ' · цвет ' + (i + 1) : ''), i: S.i, w: S.w, s: 1, slot: it.slot, cloth: cloth, sex: it.sex, cap: it.slot === 'bag' ? (Number(it.cap) || 20) : undefined, cl: it.id };
    });
}
function registerAll() {
    if (!U() || !U().ITEMS) return setTimeout(registerAll, 1000);
    Object.keys(C.items).forEach(function (k) { register(C.items[k]); });
    console.log('[clothes] вещей в каталоге: ' + Object.keys(C.items).filter(function (k) { return !C.items[k].hide; }).length + ', магазинов: ' + C.shops.length);
}
registerAll();

function pub(it) { return { id: it.id, n: it.n, sex: it.sex, slot: it.slot, d: it.d, tx: it.tx, t: it.t, u: it.u, ut: it.ut, price: it.price, cap: it.cap, hide: it.hide ? 1 : 0 }; }
function sanitize(e, p) {
    const S = SLOTS[e.slot];
    if (!S) return null;
    const tx = (Array.isArray(e.tx) ? e.tx : [0]).map(function (x) { return int(x, 0); }).filter(function (x, i, a) { return x >= 0 && x < 64 && a.indexOf(x) === i; }).slice(0, 32);
    if (!tx.length) tx.push(0);
    const it = {
        n: String(e.n || '').trim().slice(0, 48) || (S.n + ' #' + int(e.d, 0)),
        sex: e.sex === 'f' ? 'f' : e.sex === 'm' ? 'm' : sexOf(p),
        slot: e.slot, d: Math.max(0, int(e.d, 0)), tx: tx,
        price: Math.max(0, Math.min(10000000, int(e.price, 500)))
    };
    if (e.slot === 'top') { it.t = Math.max(0, int(e.t, 15)); it.u = int(e.u, -1); it.ut = Math.max(0, int(e.ut, 0)); }
    if (e.slot === 'bag') it.cap = Math.max(1, Math.min(200, int(e.cap, 20)));
    return it;
}

/* ---------- магазины ---------- */
function shopList() { return C.shops.map(function (s) { return [s.id, s.n, s.x, s.y, s.z]; }); }
function sendShops(p) { if (mp.players.exists(p)) p.call('cs:shops', [JSON.stringify(shopList())]); }
function sendShopsAll() { mp.players.forEach(sendShops); }
mp.events.add('playerReady', function (p) { setTimeout(function () { sendShops(p); }, 4200); });
setTimeout(sendShopsAll, 3000);

function nearShop(p, id) {
    const s = C.shops.find(function (x) { return x.id === Number(id); });
    if (!s || p.vehicle || p.dimension !== 0) return null;
    return Math.hypot(p.position.x - s.x, p.position.y - s.y) < 4 && Math.abs(p.position.z - s.z) < 4 ? s : null;
}
function catalogFor(p) {
    const sx = sexOf(p);
    return Object.keys(C.items).map(function (k) { return C.items[k]; }).filter(function (it) { return !it.hide && it.sex === sx; }).map(pub);
}
mp.events.add('srv:cs:open', function (p, id) {
    const s = nearShop(p, id);
    if (!s) return;
    if (p.account && p.account.downed) return;
    const list = catalogFor(p);
    p.call('cs:open', [JSON.stringify({ mode: 'shop', shop: s.id, n: s.n, money: M() ? M().get(p) : 0, list: list, slots: Object.keys(SLOTS).map(function (k) { return { k: k, n: SLOTS[k].n, i: SLOTS[k].i, c: SLOTS[k].c, p: SLOTS[k].p }; }), empty: list.length ? '' : (admLvl(p) >= 6 ? 'Каталог пуст — добавьте вещи через /clothedit' : 'Товар скоро завезут') })]);
});
mp.events.add('srv:cs:buy', function (p, shopId, itemId, tx, wear) {
    if (!nearShop(p, shopId)) return notify(p, 'error', 'Вы отошли от магазина');
    const it = C.items[Number(itemId)];
    tx = int(tx, 0);
    if (!it || it.hide || it.tx.indexOf(tx) < 0) return notify(p, 'error', 'Товар недоступен');
    if (it.sex !== sexOf(p)) return notify(p, 'error', 'Эта вещь не подходит вашему персонажу');
    if (!M() || !U()) return;
    if (M().get(p) < it.price) return notify(p, 'error', 'Не хватает наличных: нужно ' + money(it.price));
    M().add(p, -it.price);
    const k = keyOf(it.id, tx);
    if (!U().ITEMS[k]) register(it);
    const left = U().addItem(p, k, 1);
    let worn = false;
    if (!left && Number(wear)) worn = U().equipKey(p, k);
    if (U().sendInv) U().sendInv(p);
    if (global.SLog) { try { global.SLog.add('item', { actor: p, action: 'buy:clothes', details: it.n + ' за ' + money(it.price) }); } catch (e) {} }
    notify(p, 'ok', 'Куплено: ' + it.n + (worn ? ' — уже на вас' : left ? ' — инвентарь полон, вещь на земле' : ' — лежит в инвентаре'));
    p.call('cs:bought', [it.slot, worn ? 1 : 0, M().get(p)]);
});

/* ---------- редактор каталога ---------- */
function canEdit(p) { if (admLvl(p) >= 6) return true; notify(p, 'error', 'Редактор одежды доступен с 6 уровня администрации'); return false; }
function dlcClothes() {
    const R = global.DlcSystem && global.DlcSystem.get ? global.DlcSystem.get() : null;
    const out = [];
    if (!R) return out;
    R.list.forEach(function (d) {
        (d.cl || []).forEach(function (c) { out.push({ pack: d.name, ok: d.ok, sex: c.sex, part: c.part, slot: c.slot, n: c.n, ids: c.ids || [] }); });
        if (d.enc && !(d.cl || []).length) out.push({ pack: d.name, ok: d.ok, enc: 1 });
        if ((d.cl || []).length && !d.ok) out.push({ pack: d.name, ok: false, bad: 1, err: d.errors.slice(0, 4) });
    });
    return out;
}
function editorData(p) {
    return { mode: 'edit', sex: sexOf(p), dlc: dlcClothes(), list: Object.keys(C.items).map(function (k) { return pub(C.items[k]); }).filter(function (x) { return !x.hide; }),
        slots: Object.keys(SLOTS).map(function (k) { return { k: k, n: SLOTS[k].n, i: SLOTS[k].i, c: SLOTS[k].c, p: SLOTS[k].p }; }) };
}
mp.events.addCommand('clothedit', function (p) {
    if (!canEdit(p)) return;
    if (p.vehicle) return notify(p, 'warn', 'Выйдите из машины');
    dlcProbe(p);
    p.call('cs:open', [JSON.stringify(editorData(p))]);
});
mp.events.add('srv:ce:save', function (p, json) {
    if (!canEdit(p)) return;
    let e; try { e = JSON.parse(json); } catch (x) { return; }
    const it = sanitize(e, p);
    if (!it) return notify(p, 'error', 'Неверные данные');
    const id = int(e.id, 0);
    if (id && C.items[id]) {
        const old = C.items[id];
        old.tx.forEach(function (tx) { if (it.tx.indexOf(tx) < 0 && U() && U().ITEMS[keyOf(id, tx)]) U().ITEMS[keyOf(id, tx)].n = old.n + ' (снято с продажи)'; });
        Object.assign(old, it); register(old);
        notify(p, 'ok', 'Сохранено: ' + old.n);
    } else {
        const dup = Object.keys(C.items).map(function (k) { return C.items[k]; }).find(function (x) { return !x.hide && x.sex === it.sex && x.slot === it.slot && x.d === it.d; });
        if (dup) return notify(p, 'warn', 'Эта модель уже в каталоге: «' + dup.n + '» — выберите её в списке, чтобы изменить');
        it.id = C.seq++; C.items[it.id] = it; register(it);
        notify(p, 'ok', 'Добавлено в каталог: ' + it.n);
    }
    mark();
    p.call('cs:editList', [JSON.stringify(editorData(p).list)]);
});
mp.events.add('srv:ce:bulk', function (p, json) {
    if (!canEdit(p)) return;
    let arr; try { arr = JSON.parse(json); } catch (x) { return; }
    if (!Array.isArray(arr)) return;
    let n = 0, skip = 0, ren = 0;
    arr.slice(0, 300).forEach(function (e) {
        const it = sanitize(e, p);
        if (!it) return;
        const dupK = Object.keys(C.items).find(function (k) { const x = C.items[k]; return !x.hide && x.sex === it.sex && x.slot === it.slot && x.d === it.d; });
        if (dupK) {
            const dx = C.items[dupK];
            if (/ · [a-z_]+_\d{3}$/.test(it.n) && / #\d+$/.test(dx.n)) { dx.n = it.n; register(dx); ren++; } else skip++;
            return;
        }
        it.id = C.seq++; C.items[it.id] = it; register(it); n++;
    });
    mark();
    notify(p, 'ok', 'Добавлено вещей: ' + n + (ren ? ' · переименовано: ' + ren : '') + (skip ? ' · пропущено (уже были): ' + skip : ''));
    p.call('cs:editList', [JSON.stringify(editorData(p).list)]);
});
mp.events.add('srv:ce:del', function (p, id) {
    if (!canEdit(p)) return;
    const it = C.items[int(id, 0)];
    if (!it) return;
    it.hide = 1; mark();
    notify(p, 'ok', 'Снято с продажи: ' + it.n + ' (у кого куплено — останется)');
    p.call('cs:editList', [JSON.stringify(editorData(p).list)]);
});

mp.events.addCommand('clothshop', function (p, full) {
    if (admLvl(p) < 6) return;
    const a = String(full || '').trim();
    const m = a.match(/^add\s+(.+)$/i);
    if (m) {
        const s = { id: C.sseq++, n: m[1].slice(0, 40), x: p.position.x, y: p.position.y, z: p.position.z, h: p.heading || 0 };
        C.shops.push(s); mark(); sendShopsAll();
        return notify(p, 'ok', 'Магазин одежды «' + s.n + '» добавлен. Двигать/удалять — /points');
    }
    p.outputChatBox('!{#ffcc66}/clothshop add [название] — магазин одежды на вашем месте · каталог — /clothedit · перенос/удаление — /points');
});

/* ---------- автодобавление одежды из DLC ---------- */
const PART_RU = { jbib: 'Верх', lowr: 'Низ', feet: 'Обувь', hand: 'Сумка', berd: 'Маска', teef: 'Аксессуар', p_head: 'Головной убор', p_eyes: 'Очки', p_lwrist: 'Часы' };
function dlcGroupsFor(sx) {
    const R = global.DlcSystem && global.DlcSystem.get ? global.DlcSystem.get() : null;
    const g = {};
    if (!R) return [];
    R.list.slice().sort(function (a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; }).forEach(function (d) {
        if (!d.ok) return;
        (d.cl || []).forEach(function (c) {
            if (c.sex !== sx || !c.slot || !SLOTS[c.slot]) return;
            const k = c.part;
            g[k] = g[k] || { k: k, slot: c.slot, n: 0, names: [], packs: [], tex: [] };
            (c.ids && c.ids.length ? c.ids : Array.apply(null, Array(c.n)).map(function (_, i) { return i; })).forEach(function (id, i) {
                g[k].names.push((PART_RU[k] || 'Вещь') + ' ' + d.name + ' · ' + k + '_' + ('00' + id).slice(-3));
                g[k].tex.push(c.tex ? c.tex[i] || 0 : 0);
            });
            g[k].n = g[k].names.length;
            if (g[k].packs.indexOf(d.name) < 0) g[k].packs.push(d.name);
        });
    });
    return Object.keys(g).map(function (k) { return g[k]; });
}
function dlcProbe(p) {
    if (!mp.players.exists(p)) return;
    const gr = dlcGroupsFor(sexOf(p));
    if (!gr.length) return;
    p.call('cs:dlcProbe', [JSON.stringify(gr.map(function (x) { const S = SLOTS[x.slot]; return { k: x.k, c: S.c, p: S.p, n: x.n }; }))]);
}
mp.events.add('playerReady', function (p) { setTimeout(function () { dlcProbe(p); }, 9000); });
mp.events.add('srv:cs:dlcProbe', function (p, json, cm) {
    let arr; try { arr = JSON.parse(json); } catch (e) { return; }
    if (!Array.isArray(arr)) return;
    const F = mp.joaat('mp_f_freemode_01') >>> 0, Mm = mp.joaat('mp_m_freemode_01') >>> 0, cmn = Number(cm) >>> 0;
    if (cm && cmn !== (p.model >>> 0) && (cmn === F || cmn === Mm)) {
        if (p._dlcWear) { clearTimeout(p._dlcWear); p._dlcWear = null; }
        const sx0 = sexOf(p), gr0 = dlcGroupsFor(sx0);
        arr.forEach(function (r) {
            const g = gr0.find(function (x) { return x.k === r.k; });
            if (!g) return;
            const from = int(r.total, 0) - g.n;
            Object.keys(C.items).forEach(function (k) { const x = C.items[k]; if (x.dlc && !x.hide && x.sex === sx0 && x.slot === g.slot && x.d >= from && x.d < from + g.n) { x.hide = 1; mark(); } });
        });
        p.outputChatBox('!{#e05555}[DLC] Сервер считает персонажа ' + (sexOf(p) === 'f' ? 'женским' : 'мужским') + ', а в игре у вас ' + (cmn === F ? 'женская' : 'мужская') + ' модель. Номера одежды у полов разные, поэтому надевается чужая вещь. Смените пол через админку (или пересоздайте персонажа) и перезайдите');
        return notify(p, 'warn', 'Модель в игре и на сервере разного пола — подробности в чате');
    }
    const sx = sexOf(p), gr = dlcGroupsFor(sx), added = [], probe = [];
    arr.forEach(function (r) {
        const g = gr.find(function (x) { return x.k === r.k; });
        const total = int(r.total, 0);
        if (g) probe.push({ k: g.k, slot: g.slot, total: total, n: g.n, packs: g.packs });
        if (!g || total <= g.n || total > 2000 || !Array.isArray(r.tx)) return;
        let from = total - g.n;
        const all = Array.isArray(r.all) ? r.all.map(function (x) { return int(x, 0); }) : [], base = int(r.base, 0);
        if (all.length && g.tex.some(function (t) { return t > 0; })) {
            const fit = function (s) { return g.tex.every(function (t, i) { return !t || all[s + i] === t; }); };
            let found = -1;
            for (let s = all.length - g.n; s >= 0; s--) if (fit(s)) { found = s; break; }
            if (found >= 0 && base + found !== from) {
                from = base + found;
                p.outputChatBox('!{#ffcc66}[DLC] ' + g.packs.join(', ') + ': вещь стоит не последней в списке игры — найдена по числу цветов (' + g.tex.join('/') + ') под №' + from);
            } else if (found < 0) p.outputChatBox('!{#e05555}[DLC] ' + g.packs.join(', ') + ': в игре нет вещи с ' + g.tex.join('/') + ' цветами — пак не загрузился у клиента. Удалите RAGEMP/client_resources и перезайдите');
        }
        Object.keys(C.items).forEach(function (k) { const x = C.items[k]; if (x.dlc && !x.hide && x.sex === sx && x.slot === g.slot && g.names.indexOf(x.n) >= 0 && (x.d < from || x.d >= from + g.n)) { x.hide = 1; mark(); } });
        for (let i = 0; i < g.n; i++) {
            const d = from + i, tc = Math.max(1, Math.min(32, all.length && all[d - base] > 0 ? all[d - base] : int(r.tx[i], 1)));
            const ex = Object.keys(C.items).map(function (k) { return C.items[k]; }).find(function (x) { return x.sex === sx && x.slot === g.slot && x.d === d; });
            if (ex) {
                if (ex.hide || !ex.dlc) { ex.hide = 0; ex.dlc = 1; ex.n = g.names[i]; if (!ex.tx || !ex.tx.length || ex.tx.length < tc) { ex.tx = []; for (let t = 0; t < tc; t++) ex.tx.push(t); } register(ex); mark(); added.push(ex); continue; }
                if (ex.n !== g.names[i] && / · [a-z_]+_\d{3}$/.test(ex.n)) { ex.n = g.names[i]; register(ex); mark(); }
                continue;
            }
            const tx = []; for (let t = 0; t < tc; t++) tx.push(t);
            const it = { id: C.seq++, n: g.names[i], sex: sx, slot: g.slot, d: d, tx: tx, price: 500, dlc: 1 };
            if (g.slot === 'top') { it.t = 15; it.u = -1; it.ut = 0; }
            if (g.slot === 'bag') it.cap = 20;
            C.items[it.id] = it; register(it); added.push(it);
        }
    });
    if (p._dlcWear) { clearTimeout(p._dlcWear); p._dlcWear = null; setTimeout(function () { if (mp.players.exists(p)) wearDlc(p, probe); }, 300); }
    if (!added.length) return;
    mark();
    console.log('[clothes] из DLC добавлено в магазин: ' + added.map(function (x) { return x.n + ' (№' + x.d + ')'; }).join(', '));
    mp.players.forEach(function (x) { if (admLvl(x) >= 6) notify(x, 'ok', 'В магазины одежды добавлено из DLC: ' + added.length + ' шт. Цена 500$, поменять — /clothedit'); });
});
function dlcExplain(p, sx) {
    const R = global.DlcSystem && global.DlcSystem.scan ? global.DlcSystem.scan() : null;
    const say = function (t) { p.outputChatBox(t); };
    if (!R || !R.list) return say('!{#e05555}[DLC] Проверка паков недоступна на сервере');
    say('!{#ffcc66}[DLC] Пол персонажа: ' + (sx === 'f' ? 'женский' : 'мужской') + ' (модель ' + (sx === 'f' ? 'mp_f_freemode_01' : 'mp_m_freemode_01') + '). Паков в dlcpacks: ' + R.list.length);
    if (!R.list.length) return say('!{#e05555}  Папка client_packages/game_resources/dlcpacks пуста или не найдена');
    R.list.forEach(function (d) {
        const cl = d.cl || [];
        const clt = cl.map(function (c) { return (c.sex === 'f' ? 'жен.' : 'муж.') + ' ' + (PART_RU[c.part] || c.part) + ' ' + c.n + ' шт.'; }).join(', ');
        let why = '';
        if ((d.errors || []).some(function (e) { return /нет файла dlc\.rpf/.test(e); })) why = 'внутри папки нет dlc.rpf. В Durty Cloth Tool при сборке выберите «Singleplayer», а не FiveM — FiveM делает папку stream, которую этот сервер не читает';
        else if (d.enc && !cl.length) why = 'архив зашифрован, состав не прочитать. Пересоберите в Durty Cloth Tool или откройте dlc.rpf в OpenIV и сохраните с Encryption: OPEN';
        else if (!cl.length) why = 'одежды внутри нет (нет файлов mp_f_freemode_01/…ydd)';
        else if (!d.ok) why = 'ошибки: ' + d.errors.slice(0, 3).join('; ');
        else if (!cl.some(function (c) { return c.sex === sx; })) why = 'одежда только для ' + (sx === 'f' ? 'мужского' : 'женского') + ' персонажа';
        else if (!cl.some(function (c) { return c.sex === sx && c.slot; })) why = 'эти типы вещей не продаются отдельно';
        say((why ? '!{#e05555}  ✖ ' : '!{#6fd36a}  ✔ ') + d.name + (clt ? ' — ' + clt : '') + (why ? ' — ' + why : ' — в порядке, через 10 сек. появится в магазине'));
    });
}
function wearDlc(p, probe) {
    const sx = sexOf(p);
    const mine = Object.keys(C.items).map(function (k) { return C.items[k]; }).filter(function (x) { return x.dlc && !x.hide && x.sex === sx; });
    if (mine.length) {
        mine.forEach(function (it) { const S = SLOTS[it.slot]; p.call('cs:dlcWear', [JSON.stringify({ c: S.c, p: S.p, d: it.d, tx: 0, t: it.t, u: it.u })]); });
        return notify(p, 'ok', 'Надето из DLC: ' + mine.map(function (x) { return x.n + ' (№' + x.d + ')'; }).join(', '));
    }
    dlcExplain(p, sx);
    const say = function (t) { p.outputChatBox(t); };
    if (probe === null) {
        say('!{#e05555}[DLC] Игра не ответила на проверку одежды за 6 сек. Перезайдите на сервер и повторите /dlcwear');
        return notify(p, 'warn', 'Игра не ответила — перезайдите и повторите /dlcwear');
    }
    if (probe && probe.length) {
        probe.forEach(function (r) {
            if (r.total <= r.n) say('!{#e05555}[DLC] ' + r.packs.join(', ') + ': сервер видит ' + r.n + ' шт. (' + (PART_RU[r.k] || r.k) + '), но игра их не загрузила — всего вариантов в игре ' + r.total + '. Удалите у себя папку RAGEMP/client_resources и зайдите заново, чтобы пак скачался. Если не поможет — в grzyClothTool пересоберите с типом Singleplayer');
            else say('!{#e05555}[DLC] ' + r.packs.join(', ') + ': игра загрузила ' + r.n + ' шт., но вещь не добавилась — пришлите этот текст разработчику (total ' + r.total + ')');
        });
        return notify(p, 'warn', 'Пак виден серверу, но игра его не загрузила — подробности в чате');
    }
    const other = Object.keys(C.items).map(function (k) { return C.items[k]; }).filter(function (x) { return x.dlc && !x.hide && x.sex !== sx; }).length + dlcGroupsFor(sx === 'f' ? 'm' : 'f').length;
    notify(p, 'warn', other ? 'Одежда из DLC сделана для ' + (sx === 'f' ? 'мужского' : 'женского') + ' персонажа — смените пол, иначе её не видно' : 'Одежды из DLC для вашего пола нет — причина по каждому паку в чате (T)');
}
mp.events.addCommand('dlcwear', function (p) {
    if (admLvl(p) < 6) return;
    if (global.DlcSystem && global.DlcSystem.rescan) global.DlcSystem.rescan();
    const sx = sexOf(p);
    if (!dlcGroupsFor(sx).length) return wearDlc(p);
    notify(p, 'info', 'Ищу вещь в игре по цветам (v3)…');
    if (p._dlcWear) clearTimeout(p._dlcWear);
    p._dlcWear = setTimeout(function () { p._dlcWear = null; if (mp.players.exists(p)) wearDlc(p, null); }, 6000);
    dlcProbe(p);
});

const PR = global.PointReg || require('./points.js');
PR.provider(function () {
    return C.shops.map(function (s) {
        return { id: 'cshop.' + s.id, g: 'Бизнесы: магазины одежды', n: s.n, get: function () { return s; },
            set: function (v) { s.x = v.x; s.y = v.y; s.z = v.z; s.h = v.h; mark(); sendShopsAll(); },
            del: function () { C.shops.splice(C.shops.indexOf(s), 1); mark(); sendShopsAll(); } };
    });
});

global.ClothesSystem = { C: C, SLOTS: SLOTS };
module.exports = global.ClothesSystem;