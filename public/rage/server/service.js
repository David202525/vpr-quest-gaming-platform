const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'service_data.json');
const S = Object.assign({ sto: {}, imp: null, impSpawn: null }, (function () { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch (e) { return {}; } })());
let dirty = false;
setInterval(function () { if (dirty) { dirty = false; fs.writeFile(FILE, JSON.stringify(S), function () {}); } }, 5000);

const STO_DEF = [
    { id: 'burton', n: 'СТО Бёртон', x: -337.4, y: -136.9, z: 39.0 },
    { id: 'lamesa', n: 'СТО Ла-Меса', x: 731.8, y: -1088.8, z: 22.2 },
    { id: 'airport', n: 'СТО Аэропорт', x: -1155.4, y: -2007.2, z: 13.2 },
    { id: 'harmony', n: 'СТО Хармони', x: 1175.0, y: 2640.0, z: 37.8 },
    { id: 'paleto', n: 'СТО Палето-Бэй', x: 110.9, y: 6626.4, z: 31.8 }
];
const IMP_DEF = { x: 409.1, y: -1623.4, z: 29.3, h: 230 };
const IMP_SPAWN_DEF = { x: 401.6, y: -1647.9, z: 29.3, h: 320 };

const CLASS_PRICE = [22000, 30000, 55000, 60000, 70000, 150000, 250000, 900000, 15000, 45000, 60000, 70000, 40000, 2000, 120000, 1500000, 1200000, 50000, 80000, 300000, 90000, 400000];
const PRICE = {
    asea: 12000, blista: 15000, panto: 9000, issi2: 14000, prairie: 18000, rhapsody: 11000, dilettante: 16000, brioso: 20000,
    emperor: 9000, ingot: 10000, premier: 14000, primo: 15000, stanier: 16000, stratum: 17000, washington: 18000, fugitive: 26000, tailgater: 32000, intruder: 15000, asterope: 22000, schafter2: 65000, superd: 250000, cognoscenti: 220000, stretch: 120000,
    sultan: 35000, kuruma: 95000, futo: 18000, elegy2: 95000, elegy: 120000, jester: 240000, banshee: 105000, buffalo: 35000, buffalo2: 55000, comet2: 100000, feltzer2: 145000, carbonizzare: 195000, massacro: 275000, ninef: 130000, rapidgt: 140000, schwarzer: 80000, sultanrs: 180000, coquette: 138000, penumbra: 24000, surano: 110000,
    adder: 1000000, zentorno: 725000, t20: 2200000, entityxf: 795000, infernus: 440000, cheetah: 650000, osiris: 1950000, turismor: 500000, vacca: 240000, bullet: 155000, voltic: 150000, nero: 1440000, italigtb: 1189000, tempesta: 1329000,
    baller: 90000, baller2: 90000, dubsta: 70000, dubsta2: 75000, granger: 35000, landstalker: 58000, cavalcade: 60000, huntley: 195000, patriot: 50000, rocoto: 85000, serrano: 60000, fq2: 50000, gresley: 29000, mesa: 45000, xls: 253000, contender: 250000,
    sandking: 45000, rebel2: 22000, bodhi2: 25000, dloader: 8000, bfinjection: 16000, kalahari: 9000, trophytruck: 550000,
    dominator: 35000, gauntlet: 32000, vigero: 21000, sabregt: 15000, phoenix: 12000, picador: 9000, buccaneer: 29000, tampa: 375000, blade: 160000, chino: 225000,
    bison: 30000, minivan: 30000, speedo: 28000, burrito3: 25000, youga: 16000, rumpo: 13000, paradise: 25000, sadler: 35000, bobcatxl: 23000,
    faggio: 4000, faggio2: 5000, bmx: 800, scorcher: 2000, akuma: 9000, bati: 15000, bati2: 15000, double: 12000, hakuchou: 82000, pcj: 9000, ruffian: 10000, sanchez: 7000, nemesis: 12000, vader: 9000, daemon: 15000, hexer: 15000, carbonrs: 40000, thrust: 75000, vindicator: 630000, bagger: 16000, sovereign: 90000
};
const HASH2NAME = {};
Object.keys(PRICE).forEach(function (k) { HASH2NAME[mp.joaat(k) >>> 0] = k; });

const REPAIR_K = 0.08, MIN_REPAIR = 150;
const WEAR_K = { e: 0.05, s: 0.025, t: 0.015 };
const WEAR_N = { e: 'Двигатель', s: 'Подвеска', t: 'Колёса и шины' };
const IMP_BASE = 500;
const EVAC_COST = 300;

function notify(p, t, x) { if (typeof global.hudNotify === 'function') global.hudNotify(p, t, x); else p.outputChatBox(x); }
function money(n) { return '$' + String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function admLvl(p) { return global.AdminSystem && global.AdminSystem.realLvl ? global.AdminSystem.realLvl(p) : 0; }
function VS() { return global.VehStore; }
function sid(p) { return p && p.account && p.account.id ? Number(p.account.id) : 0; }
function d2(a, b) { const dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }
function stoList() { return STO_DEF.map(function (d) { const o = S.sto[d.id]; return o ? { id: d.id, n: d.n, x: o.x, y: o.y, z: o.z } : d; }); }
function impPt() { return S.imp || IMP_DEF; }
function impSpawn() { return S.impSpawn || IMP_SPAWN_DEF; }

function modelName(v) { return v.modelName || HASH2NAME[v.model >>> 0] || ''; }
function carPrice(v, cls) {
    const m = modelName(v);
    if (m && PRICE[m]) return PRICE[m];
    const c = Number(cls);
    return CLASS_PRICE[c] || 40000;
}
function wearOf(v) {
    const w = String(v.getVariable('wear') || '100,100,100').split(',').map(Number);
    return { e: isFinite(w[0]) ? w[0] : 100, s: isFinite(w[1]) ? w[1] : 100, t: isFinite(w[2]) ? w[2] : 100 };
}
function setWear(v, w) { v.setVariable('wear', [w.e, w.s, w.t].map(function (x) { return Math.round(Math.max(0, Math.min(100, x)) * 10) / 10; }).join(',')); }

function quote(v, info) {
    const price = carPrice(v, info.cls);
    const eng = Math.max(0, Math.min(1000, Number(info.eng) || 1000));
    const body = Math.max(0, Math.min(1000, Number(info.body) || 1000));
    const tank = Math.max(0, Math.min(1000, Number(info.tank) || 1000));
    const tyres = Math.max(0, Math.min(6, Number(info.tyres) || 0));
    const dmg = Math.min(1, ((1000 - eng) * 0.45 + (1000 - body) * 0.4 + (1000 - tank) * 0.15) / 1000 + tyres * 0.04);
    const pct = Math.round(dmg * 100);
    const w = wearOf(v);
    const out = { price: price, pct: pct, body: pct > 0 ? Math.max(MIN_REPAIR, Math.round(price * REPAIR_K * dmg)) : 0, w: w, wp: {} };
    ['e', 's', 't'].forEach(function (k) { const lost = (100 - w[k]) / 100; out.wp[k] = lost > 0.005 ? Math.max(100, Math.round(price * WEAR_K[k] * lost)) : 0; });
    return out;
}

function pay(p, cost, why) {
    const U = VS();
    const m = U.money(p), b = U.bank(p);
    if (m >= cost) { U.setMB(p, m - cost, b); return true; }
    if (b >= cost) { U.setMB(p, m, b - cost); U.tx(sid(p), 'out', -cost, why); return true; }
    notify(p, 'error', 'Недостаточно средств: нужно ' + money(cost) + ' (наличные или карта)');
    return false;
}

function stoNear(p) { const pos = p.position; return stoList().find(function (s) { return d2(pos, s) < 9 && Math.abs(pos.z - s.z) < 5; }) || null; }

mp.events.add('srv:sto:open', function (p, json) {
    const v = p.vehicle;
    if (!v || (p.seat !== 0 && p.seat !== -1)) return notify(p, 'warn', 'Заезжайте на СТО за рулём');
    const st = stoNear(p);
    if (!st) return notify(p, 'warn', 'Рядом нет СТО');
    let info = {};
    try { info = JSON.parse(json) || {}; } catch (e) {}
    const qv = quote(v, info);
    p.stoQuote = { v: v, q: qv, at: Date.now() };
    const items = [];
    if (qv.body) items.push({ id: 'sto:body', t: 'Кузов ' + qv.pct + '% · ' + money(qv.body), ic: '🔧', d: 'Устранить повреждения кузова и двигателя' });
    if (qv.wp.e) items.push({ id: 'sto:e', t: 'Двигатель ' + Math.round(qv.w.e) + '% · ' + money(qv.wp.e), ic: '⚙️', d: 'Капремонт: вернуть мощность, убрать глохнущий мотор' });
    if (qv.wp.s) items.push({ id: 'sto:s', t: 'Подвеска ' + Math.round(qv.w.s) + '% · ' + money(qv.wp.s), ic: '🎛️', d: 'Перебрать подвеску — машину перестанет кидать' });
    if (qv.wp.t) items.push({ id: 'sto:t', t: 'Колёса ' + Math.round(qv.w.t) + '% · ' + money(qv.wp.t), ic: '🛞', d: 'Новые шины — вернётся сцепление с дорогой' });
    const total = qv.body + qv.wp.e + qv.wp.s + qv.wp.t;
    if (items.length > 1) items.push({ id: 'sto:all', t: 'Всё сразу · ' + money(total), ic: '✨', d: 'Полный ремонт и обслуживание' });
    if (!items.length) return notify(p, 'ok', 'Машина в идеальном состоянии — ремонт не нужен');
    items.push({ id: 'sto:x', t: 'Отмена', ic: '✖️', d: 'Закрыть меню' });
    p.call('svc:menu', [st.n + ' · авто ' + money(qv.price), JSON.stringify(items)]);
});

mp.events.add('srv:sto:pick', function (p, what) {
    const o = p.stoQuote;
    p.stoQuote = null;
    if (!o || Date.now() - o.at > 60000) return;
    const v = p.vehicle;
    if (!v || v !== o.v || !stoNear(p)) return notify(p, 'warn', 'Вы уехали с СТО');
    const qv = o.q;
    const parts = what === 'all' ? ['body', 'e', 's', 't'] : [what];
    let cost = 0;
    parts.forEach(function (k) { cost += k === 'body' ? qv.body : (qv.wp[k] || 0); });
    if (cost <= 0) return;
    if (!pay(p, cost, 'Ремонт на СТО')) return;
    const w = wearOf(v);
    parts.forEach(function (k) {
        if (k === 'body') { try { v.repair(); } catch (e) {} }
        else w[k] = 100;
    });
    setWear(v, w);
    v.wearFixAt = Date.now();
    if (VS() && v.dbId) VS().save(v);
    p.call('svc:fixed', [parts.join(',')]);
    notify(p, 'ok', 'Ремонт выполнен: ' + money(cost));
});

mp.events.add('srv:wear:set', function (p, str) {
    const v = p.vehicle;
    if (!v || (p.seat !== 0 && p.seat !== -1)) return;
    if (v.wearFixAt && Date.now() - v.wearFixAt < 4000) return;
    const n = String(str || '').split(',').map(Number);
    if (n.length !== 3 || n.some(function (x) { return !isFinite(x); })) return;
    const w = wearOf(v);
    setWear(v, { e: Math.min(w.e, n[0]), s: Math.min(w.s, n[1]), t: Math.min(w.t, n[2]) });
});

/* ---------- штрафстоянка ---------- */
function impound(v, fee, reason) {
    if (!v || !mp.vehicles.exists(v)) return false;
    const U = VS();
    try { (v.getOccupants ? v.getOccupants() : []).forEach(function (o) { try { o.removeFromVehicle(); } catch (e) {} }); } catch (e) {}
    if (v.dbId && U) {
        U.save(v);
        U.q('UPDATE vehicles SET impound = 1, impound_fee = impound_fee + ?, impound_reason = ? WHERE id = ?', [Math.max(0, Math.floor(fee || 0)), String(reason || '').slice(0, 80), v.dbId]);
        delete U.owned[v.dbId];
    }
    const owner = Number(v.getVariable('ownerId')) || 0;
    if (owner) mp.players.forEach(function (x) { if (sid(x) === owner) notify(x, 'error', 'Ваш транспорт ' + (v.numberPlate || '') + ' на штрафстоянке: ' + (reason || 'эвакуирован')); });
    setTimeout(function () { try { if (mp.vehicles.exists(v)) v.destroy(); } catch (e) {} }, 300);
    return true;
}

function impNear(p) { return !p.vehicle && d2(p.position, impPt()) < 3 && Math.abs(p.position.z - impPt().z) < 4; }

mp.events.add('srv:imp:open', async function (p) {
    if (!impNear(p)) return;
    const U = VS(), id = sid(p);
    if (!U || !id) return;
    await U.cols();
    const rows = await U.q('SELECT id, model, plate, impound, impound_fee, impound_reason FROM vehicles WHERE owner_id = ? ORDER BY impound DESC, id LIMIT 11', [id]);
    if (!mp.players.exists(p)) return;
    if (!rows.length) return notify(p, 'ok', 'У вас нет личного транспорта');
    const items = rows.map(function (r) {
        const imp = !!Number(r.impound);
        const cost = imp ? IMP_BASE + (Number(r.impound_fee) || 0) : EVAC_COST;
        return { id: 'imp:' + r.id, t: String(r.model) + ' ' + r.plate + ' · ' + money(cost), ic: imp ? '🚚' : '🚘', d: imp ? (r.impound_reason || 'Эвакуирован') + '. Забрать за ' + money(cost) : 'Не на штрафстоянке. Пригнать сюда за ' + money(cost) };
    });
    items.push({ id: 'imp:x', t: 'Отмена', ic: '✖️', d: 'Закрыть меню' });
    p.call('svc:menu', ['Штрафстоянка', JSON.stringify(items)]);
});

mp.events.add('srv:imp:take', async function (p, vid) {
    if (!impNear(p)) return;
    const U = VS(), id = sid(p);
    if (!U || !id) return;
    if (!U.hasHousing(p)) return notify(p, 'error', 'Без жилья забрать транспорт нельзя. Купите дом, квартиру или снимите номер в гостинице');
    const r = (await U.q('SELECT * FROM vehicles WHERE id = ? AND owner_id = ? LIMIT 1', [Number(vid), id]))[0];
    if (!r || !mp.players.exists(p)) return;
    const imp = !!Number(r.impound);
    let old = U.owned[r.id];
    if (!old || !mp.vehicles.exists(old)) { old = null; mp.vehicles.forEach(function (x) { if (!old && String(x.numberPlate || '').trim() === String(r.plate).trim()) old = x; }); }
    if (old && !old.dbId) old.dbId = r.id;
    if (old && mp.vehicles.exists(old)) {
        if (old.getOccupants && old.getOccupants().length) return notify(p, 'error', 'В этой машине кто-то сидит — пригнать её нельзя');
        if (d2(old.position, impSpawn()) < 15) return notify(p, 'ok', 'Машина уже стоит на площадке штрафстоянки');
    }
    const cost = imp ? IMP_BASE + (Number(r.impound_fee) || 0) : EVAC_COST;
    if (!pay(p, cost, 'Штрафстоянка: ' + r.plate)) return;
    if (old && mp.vehicles.exists(old)) {
        U.save(old);
        const f = (await U.q('SELECT fuel FROM vehicles WHERE id = ? LIMIT 1', [r.id]))[0];
        if (f) r.fuel = f.fuel;
        delete U.owned[r.id];
        try { old.destroy(); } catch (e) {}
    }
    if (imp) await U.q('UPDATE vehicles SET impound = 0, impound_fee = 0, impound_reason = NULL WHERE id = ?', [r.id]);
    const sp = impSpawn();
    let busy = false;
    mp.vehicles.forEach(function (x) { if (d2(x.position, sp) < 3) busy = true; });
    const at = { x: sp.x + (busy ? 3.5 : 0), y: sp.y, z: sp.z, h: sp.h, dim: 0 };
    const v = U.spawn(r, id, at);
    try { v.repair(); } catch (e) {}
    v.setVariable('fuel', Math.max(15, Number(r.fuel) || 0));
    U.save(v);
    p.call('svc:gps', [at.x, at.y, at.z]);
    notify(p, 'ok', 'Транспорт ' + r.plate + (imp ? ' выдан' : ' пригнан') + ' за ' + money(cost) + '. Он стоит на площадке рядом');
});

mp.events.add('vehicleDeath', function (v) {
    if (!v || !v.dbId) return;
    setTimeout(function () {
        if (!mp.vehicles.exists(v)) return;
        if (v.getOccupants && v.getOccupants().length) return;
        impound(v, 1000, 'Транспорт разбит — эвакуирован');
    }, 60000);
});

mp.events.addCommand('impound', function (p, full) {
    if (admLvl(p) < 3) return;
    let best = p.vehicle || null, bd = 6;
    if (!best) mp.vehicles.forEach(function (v) { if (v.dimension === p.dimension) { const d = d2(v.position, p.position); if (d < bd) { bd = d; best = v; } } });
    if (!best) return notify(p, 'warn', 'Рядом нет транспорта');
    const fee = Math.max(0, Number(String(full || '').trim()) || 0);
    impound(best, fee, 'Эвакуирован администрацией');
    notify(p, 'ok', 'Транспорт отправлен на штрафстоянку' + (fee ? ' (штраф ' + money(fee) + ')' : ''));
});

/* ---------- синхронизация точек ---------- */
function sendPts(p) {
    if (!mp.players.exists(p)) return;
    p.call('svc:pts', [JSON.stringify({ sto: stoList(), imp: impPt() })]);
}
mp.events.add('playerReady', function (p) { setTimeout(function () { sendPts(p); }, 5000); });
setTimeout(function () { mp.players.forEach(sendPts); }, 3000);
function resend() { dirty = true; mp.players.forEach(sendPts); }

const PR = global.PointReg || require('./points.js');
STO_DEF.forEach(function (d) {
    PR.add('sto.' + d.id, { g: 'СТО', n: d.n, get: function () { return S.sto[d.id] || d; }, set: function (v) { S.sto[d.id] = v; resend(); }, reset: function () { delete S.sto[d.id]; resend(); } });
});
PR.add('imp.point', { g: 'Штрафстоянка', n: 'Выдача транспорта', get: impPt, set: function (v) { S.imp = v; resend(); }, reset: function () { S.imp = null; resend(); } });
PR.add('imp.spawn', { g: 'Штрафстоянка', n: 'Площадка появления машины', get: impSpawn, set: function (v) { S.impSpawn = v; resend(); }, reset: function () { S.impSpawn = null; resend(); } });

global.ServiceSystem = { impound: impound, price: carPrice };
console.log('[service] СТО, износ авто и штрафстоянка загружены');
module.exports = global.ServiceSystem;
