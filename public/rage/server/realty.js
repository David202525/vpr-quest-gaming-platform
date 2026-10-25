const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'realty_data.json');
const S = Object.assign({ seq: 1, pt: null, lots: [], hist: [] }, (function () { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch (e) { return {}; } })());
let dirty = false;
setInterval(function () { if (dirty) { dirty = false; try { fs.writeFileSync(FILE, JSON.stringify(S)); } catch (e) {} } }, 5000);

const PT_DEF = { x: -1083.0, y: -245.9, z: 37.76 };
const FEE = 5;
const MIN_STEP = 0.05;
const HOURS = [1, 3, 6, 12, 24];
const MAX_LOTS = 3;

function pt() { return S.pt || PT_DEF; }
function sid(p) { const a = p.account || p.admAcc; return a && a.id ? Number(a.id) : 0; }
function nick(p) { const a = p.account; return String((a && a.nick) || p.name).replace(/_/g, ' '); }
function notify(p, type, text) { if (typeof global.hudNotify === 'function') global.hudNotify(p, type, text); else p.outputChatBox(text); }
function admLvl(p) { return global.AdminSystem && global.AdminSystem.realLvl ? global.AdminSystem.realLvl(p) : 0; }
function M() { return global.MoneySystem; }
function H() { return global.HouseSystem; }
function B() { return global.BizSystem; }
function VS() { return global.VehSystem; }
function money(n) { return '$' + String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function byAcc(id) { return mp.players.toArray().find(function (x) { return sid(x) === Number(id); }) || null; }
function near(p) { const P = pt(); return Math.hypot(p.position.x - P.x, p.position.y - P.y) < 4 && Math.abs(p.position.z - P.z) < 4 && p.dimension === 0; }
function active() { return S.lots.filter(function (l) { return !l.done; }); }
function locked(kind, id) { return active().some(function (l) { return l.kind === kind && String(l.ref) === String(id); }); }
function lotOf(id) { return S.lots.find(function (l) { return l.id === Number(id); }) || null; }
function slog(p, a, d) { if (global.SLog) try { global.SLog.add('realty', { actor: p, action: a, details: d }); } catch (e) {} }
function minBid(l) { return l.bid ? Math.ceil(l.bid * (1 + MIN_STEP)) : l.start; }

const KIND_N = { house: 'Дом', flat: 'Квартира', car: 'Транспорт', biz: 'Бизнес' };
const KIND_I = { house: '🏠', flat: '🏢', car: '🚗', biz: '💼' };

async function myAssets(p) {
    const id = sid(p), out = [];
    const h = H() && H().mine ? H().mine(p) : null;
    if (h) out.push({ kind: h.flat ? 'flat' : 'house', ref: String(h.id), n: h.n, sub: H().intName(h.int) + ' · гос. цена ' + money(h.price), lock: locked(h.flat ? 'flat' : 'house', h.id) });
    if (VS()) (await VS().mine(id)).forEach(function (v) { out.push({ kind: 'car', ref: String(v.id), n: String(v.model).toUpperCase(), sub: 'Номер ' + v.plate, lock: locked('car', v.id) }); });
    if (B()) B().mine(id).forEach(function (b) { out.push({ kind: 'biz', ref: b.kind + ':' + b.id, n: b.name, sub: b.n + ' · гос. цена ' + money(b.price), lock: locked('biz', b.kind + ':' + b.id) }); });
    return out;
}

function lotView(l, me) {
    return {
        id: l.id, kind: l.kind, kn: KIND_N[l.kind], i: KIND_I[l.kind], n: l.n, sub: l.sub, seller: l.sellerN, start: l.start, bid: l.bid, bidder: l.bidderN || '',
        min: minBid(l), left: Math.max(0, l.ends - Date.now()), bids: l.bids || 0, mine: l.seller === me, lead: !!(l.bidder && l.bidder === me), buyout: l.buyout || 0
    };
}

async function state(p, extra) {
    const me = sid(p);
    const free = H() && H().free ? H().free().filter(function (h) { return !locked(h.flat ? 'flat' : 'house', h.id); }).map(function (h) {
        return { id: h.id, n: h.n, int: H().intName(h.int), price: h.price, flat: !!h.flat, d: Math.round(Math.hypot(p.position.x - h.x, p.position.y - h.y)) };
    }).sort(function (a, b) { return a.price - b.price; }) : [];
    return Object.assign({
        money: M() ? M().get(p) : 0, bank: M() ? M().bank(p) : 0, fee: FEE, hours: HOURS, step: Math.round(MIN_STEP * 100),
        hasHome: !!(H() && H().mine && H().mine(p)),
        free: free,
        lots: active().map(function (l) { return lotView(l, me); }).sort(function (a, b) { return a.left - b.left; }),
        mine: await myAssets(p),
        hist: S.hist.filter(function (x) { return x.s === me || x.w === me; }).slice(-10).reverse()
    }, extra || {});
}
async function send(p, extra) { if (mp.players.exists(p)) p.call('realty:open', [JSON.stringify(await state(p, extra))]); }

mp.events.add('srv:realty:open', function (p) {
    if (!near(p) && !(p.realtyRemote && admLvl(p) >= 5)) return;
    send(p);
});

mp.events.add('srv:realty:act', async function (p, act, a1, a2, a3, a4) {
    if (!near(p)) return notify(p, 'error', 'Подойдите к стойке агентства недвижимости');
    const me = sid(p);
    if (!me) return;
    const reply = function (o) { return send(p, o); };
    if (act === 'buy') {
        const er = H().buyState(p, Number(a1));
        if (er) return reply({ err: er });
        const h = H().byId(Number(a1));
        slog(p, 'agency-buy', h.n + ' ' + h.price);
        notify(p, 'ok', 'Поздравляем! Вы купили: ' + h.n + ' за ' + money(h.price));
        return reply({ ok: 'Сделка оформлена: ' + h.n + '. Ключи у вас!' });
    }
    if (act === 'gps') {
        const h = H().byId(Number(a1));
        if (h) p.call('phone:gps', [h.x, h.y, h.n]);
        return;
    }
    if (act === 'list') {
        const kind = String(a1), ref = String(a2), start = Math.floor(Number(a3)), hours = Number(a4);
        if (!KIND_N[kind]) return;
        if (HOURS.indexOf(hours) < 0) return reply({ err: 'Неверный срок' });
        if (!(start >= 1000 && start <= 100000000)) return reply({ err: 'Стартовая цена от $1.000' });
        if (active().filter(function (l) { return l.seller === me; }).length >= MAX_LOTS) return reply({ err: 'Не больше ' + MAX_LOTS + ' лотов одновременно' });
        if (locked(kind, ref)) return reply({ err: 'Уже выставлено на аукцион' });
        const assets = await myAssets(p);
        const it = assets.find(function (x) { return x.kind === kind && x.ref === ref; });
        if (!it) return reply({ err: 'Это не ваше имущество' });
        const lot = { id: S.seq++, kind: kind, ref: ref, n: it.n, sub: it.sub.replace(/ · гос\. цена.*$/, ''), seller: me, sellerN: nick(p), start: start, bid: 0, bidder: 0, bidderN: '', bids: 0, at: Date.now(), ends: Date.now() + hours * 3600000 };
        S.lots.push(lot); dirty = true;
        slog(p, 'list', kind + ' ' + it.n + ' от ' + start);
        mp.players.forEach(function (x) { if (x !== p && sid(x)) notify(x, 'ok', 'Аукцион: ' + KIND_N[kind] + ' «' + it.n + '» от ' + money(start) + ' — агентство недвижимости'); });
        return reply({ ok: 'Лот выставлен на ' + hours + ' ч. Комиссия агентства ' + FEE + '% с продажи' });
    }
    if (act === 'cancel') {
        const l = lotOf(a1);
        if (!l || l.done || l.seller !== me) return;
        if (l.bid) return reply({ err: 'Уже есть ставки — снять лот нельзя' });
        l.done = 'cancel'; dirty = true;
        return reply({ ok: 'Лот снят с аукциона' });
    }
    if (act === 'bid') {
        const l = lotOf(a1);
        if (!l || l.done || Date.now() > l.ends) return reply({ err: 'Аукцион уже завершён' });
        if (l.seller === me) return reply({ err: 'Нельзя ставить на свой лот' });
        if (l.bidder === me) return reply({ err: 'Ваша ставка и так лидирует' });
        const sum = Math.floor(Number(a2));
        if (!(sum >= minBid(l))) return reply({ err: 'Минимальная ставка ' + money(minBid(l)) });
        if ((l.kind === 'house' || l.kind === 'flat') && H().mine(p)) return reply({ err: 'У вас уже есть жильё — сначала продайте его' });
        if ((l.kind === 'house' || l.kind === 'flat') && global.UiSystem && global.UiSystem.hasDoc && !global.UiSystem.hasDoc(p, 'passport')) return reply({ err: 'Нужен паспорт' });
        if (l.kind === 'car' && global.hasHousing && !global.hasHousing(p)) return reply({ err: 'Без жилья нельзя владеть транспортом' });
        const bank = M().bank(p);
        if (bank < sum) return reply({ err: 'На банковском счёте нужно ' + money(sum) });
        M().set(p, M().get(p), bank - sum, 'auction-bid');
        if (M().tx) M().tx(me, 'out', -sum, 'Ставка на аукционе: ' + l.n);
        if (l.bidder) {
            M().addBankId(l.bidder, l.bid);
            if (M().tx) M().tx(l.bidder, 'in', l.bid, 'Возврат ставки: ' + l.n);
            const o = byAcc(l.bidder);
            if (o) notify(o, 'warn', 'Вашу ставку на «' + l.n + '» перебили: ' + money(sum) + '. Деньги вернулись на счёт');
        }
        l.bid = sum; l.bidder = me; l.bidderN = nick(p); l.bids = (l.bids || 0) + 1;
        if (l.ends - Date.now() < 120000) l.ends = Date.now() + 120000;
        dirty = true;
        const sp = byAcc(l.seller);
        if (sp) notify(sp, 'ok', 'Новая ставка на «' + l.n + '»: ' + money(sum));
        slog(p, 'bid', l.n + ' ' + sum);
        return reply({ ok: 'Ставка ' + money(sum) + ' принята. Деньги заморожены до конца торгов' });
    }
});

async function closeLot(l) {
    l.done = 'closing';
    const seller = byAcc(l.seller), win = l.bidder ? byAcc(l.bidder) : null;
    if (!l.bidder) {
        l.done = 'nobid'; dirty = true;
        if (seller) notify(seller, 'warn', 'Аукцион «' + l.n + '» завершён без ставок');
        return;
    }
    let ok = false;
    try {
        if (l.kind === 'house' || l.kind === 'flat') {
            const h = H().byId(Number(l.ref));
            const winHas = H().byOwner(l.bidder);
            if (h && h.owner === l.seller && !winHas) ok = H().transfer(h.id, l.bidder, l.bidderN);
        } else if (l.kind === 'car') {
            const v = await VS().get(l.ref);
            if (v && Number(v.owner_id) === l.seller) ok = await VS().transfer(l.ref, l.bidder);
        } else if (l.kind === 'biz') {
            const sp = l.ref.split(':'), b = B().get(sp[0], sp[1]);
            if (b && b.owner === l.seller) {
                const bal = B().transfer(sp[0], sp[1], l.bidder, String(l.bidderN).toUpperCase());
                if (bal > 0) M().addBankId(l.seller, bal);
                ok = true;
            }
        }
    } catch (e) { console.log('[realty] close: ' + e.message); ok = false; }
    if (!ok) {
        M().addBankId(l.bidder, l.bid);
        if (M().tx) M().tx(l.bidder, 'in', l.bid, 'Возврат: аукцион отменён');
        l.done = 'fail'; dirty = true;
        if (win) notify(win, 'warn', 'Аукцион «' + l.n + '» отменён (объект недоступен). Ставка возвращена');
        if (seller) notify(seller, 'warn', 'Аукцион «' + l.n + '» отменён: объект больше недоступен');
        return;
    }
    const fee = Math.floor(l.bid * FEE / 100), get = l.bid - fee;
    M().addBankId(l.seller, get);
    if (M().tx) M().tx(l.seller, 'in', get, 'Продажа на аукционе: ' + l.n);
    if (M().gov) M().gov(fee, 'Комиссия аукциона: ' + l.n);
    l.done = 'sold'; dirty = true;
    S.hist.push({ n: l.n, k: l.kind, sum: l.bid, s: l.seller, w: l.bidder, sn: l.sellerN, wn: l.bidderN, at: Date.now() });
    if (S.hist.length > 300) S.hist = S.hist.slice(-300);
    if (win) notify(win, 'ok', 'Вы выиграли аукцион! «' + l.n + '» теперь ваш (' + money(l.bid) + ')');
    if (seller) notify(seller, 'ok', '«' + l.n + '» продан на аукционе за ' + money(l.bid) + '. На счёт: ' + money(get) + ' (комиссия ' + FEE + '%)');
}
setInterval(function () {
    const now = Date.now();
    active().forEach(function (l) { if (l.done !== 'closing' && now >= l.ends) closeLot(l); });
    S.lots = S.lots.filter(function (l) { return !l.done || now - l.ends < 86400000; });
}, 5000);

function sendPt(p) { const P = pt(); p.call('realty:pt', [P.x, P.y, P.z]); }
mp.events.add('playerReady', function (p) { setTimeout(function () { if (mp.players.exists(p)) sendPt(p); }, 4700); });
setTimeout(function () { mp.players.forEach(sendPt); }, 2000);
mp.events.add('srv:realty:gps', function (p) { const P = pt(); p.call('phone:gps', [P.x, P.y, 'Агентство недвижимости']); });

mp.events.addCommand('realtypt', function (p, full) {
    if (admLvl(p) < 7) return;
    if (String(full || '').trim() === 'reset') S.pt = null;
    else S.pt = { x: p.position.x, y: p.position.y, z: p.position.z };
    dirty = true;
    mp.players.forEach(sendPt);
    p.outputChatBox('!{#8fd14f}Точка агентства недвижимости сохранена');
});
mp.events.addCommand('auctions', function (p) {
    const L = active();
    if (!L.length) return p.outputChatBox('!{#ffcc66}Сейчас нет активных аукционов');
    L.forEach(function (l) { p.outputChatBox('!{#7fd4ff}#' + l.id + ' ' + KIND_N[l.kind] + ' «' + l.n + '» · ' + (l.bid ? 'ставка ' + money(l.bid) : 'старт ' + money(l.start)) + ' · ещё ' + Math.ceil((l.ends - Date.now()) / 60000) + ' мин'); });
});
mp.events.addCommand('auctionstop', function (p, full) {
    if (admLvl(p) < 7) return;
    const l = lotOf(full);
    if (!l || l.done) return p.outputChatBox('!{#ffcc66}/auctionstop [номер лота]');
    if (l.bidder) M().addBankId(l.bidder, l.bid);
    l.done = 'admin'; dirty = true;
    p.outputChatBox('!{#8fd14f}Лот #' + l.id + ' снят, ставка возвращена');
});

global.Realty = { locked: locked, pt: pt };
console.log('[realty] агентство недвижимости и аукционы загружены');
