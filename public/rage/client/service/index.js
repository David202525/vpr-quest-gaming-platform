var SV = { sto: [], imp: null };
var svBlips = [];
var svNearSto = null, svNearImp = false, svHint = '';
var svGps = null;

function svInv() { try { return mp.game.invoke.apply(mp.game, arguments); } catch (e) { return 0; } }
function svNotify(t, x, ms) { mp.events.call('hud:notify', t, x, ms || 3500); }

mp.events.add('svc:pts', function (json) {
    try { SV = JSON.parse(json) || SV; } catch (e) {}
    svBlips.forEach(function (b) { try { b.destroy(); } catch (e) {} });
    svBlips = [];
    SV.sto.forEach(function (s) {
        try { svBlips.push(mp.blips.new(446, new mp.Vector3(s.x, s.y, s.z), { dimension: 4294967295, color: 47, scale: 0.8, shortRange: true, name: 'СТО — ремонт и обслуживание' })); } catch (e) {}
    });
    if (SV.imp) try { svBlips.push(mp.blips.new(68, new mp.Vector3(SV.imp.x, SV.imp.y, SV.imp.z), { dimension: 4294967295, color: 1, scale: 0.85, shortRange: true, name: 'Штрафстоянка' })); } catch (e) {}
});

mp.events.add('svc:menu', function (title, json) {
    var items = [];
    try { items = JSON.parse(json) || []; } catch (e) {}
    if (global.intShowG) global.intShowG(title, items);
});
mp.events.add('svc:gps', function (x, y, z) {
    if (svGps) { try { svGps.destroy(); } catch (e) {} }
    svGps = mp.blips.new(225, new mp.Vector3(x, y, z), { dimension: 4294967295, color: 2, name: 'Ваш транспорт', shortRange: false });
    setTimeout(function () { if (svGps) { try { svGps.destroy(); } catch (e) {} svGps = null; } }, 90000);
});

mp.events.add('render', function () {
    var me = mp.players.local, p = me.position;
    SV.sto.forEach(function (s) {
        var dx = p.x - s.x, dy = p.y - s.y;
        if (dx * dx + dy * dy > 3600) return;
        mp.game.graphics.drawMarker(1, s.x, s.y, s.z - 1, 0, 0, 0, 0, 0, 0, 6, 6, 0.5, 80, 170, 255, 70, false, false, 2, false, null, null, false);
        if (dx * dx + dy * dy < 100) mp.game.graphics.drawText('СТО · E — ремонт (за рулём)', [s.x, s.y, s.z + 1.2], { font: 4, color: [120, 190, 255, 235], scale: [0.45, 0.45], outline: true, centre: true });
    });
    if (SV.imp) {
        var i = SV.imp, ix = p.x - i.x, iy = p.y - i.y;
        if (ix * ix + iy * iy < 900) {
            mp.game.graphics.drawMarker(1, i.x, i.y, i.z - 1, 0, 0, 0, 0, 0, 0, 1.4, 1.4, 0.4, 255, 90, 90, 120, false, false, 2, false, null, null, false);
            if (ix * ix + iy * iy < 16) mp.game.graphics.drawText('Штрафстоянка · E — забрать / пригнать транспорт', [i.x, i.y, i.z + 0.4], { font: 4, color: [255, 140, 140, 235], scale: [0.4, 0.4], outline: true, centre: true });
        }
    }
});

setInterval(function () {
    var me = mp.players.local, p = me.position, v = me.vehicle;
    svNearSto = null;
    if (v && v.getPedInSeat(-1) === me.handle) SV.sto.forEach(function (s) { if (mp.game.system.vdist(p.x, p.y, p.z, s.x, s.y, s.z) < 9) svNearSto = s; });
    svNearImp = !v && SV.imp && mp.game.system.vdist(p.x, p.y, p.z, SV.imp.x, SV.imp.y, SV.imp.z) < 3;
    var h = svNearSto ? 'sto' + svNearSto.id : svNearImp ? 'imp' : '';
    if (h && h !== svHint) svNotify('ok', svNearSto ? 'СТО: нажмите E — диагностика и ремонт' : 'Штрафстоянка: нажмите E — забрать или пригнать свой транспорт');
    svHint = h;
}, 400);

function svDamage(v) {
    var d = { eng: 1000, body: 1000, tank: 1000, tyres: 0, cls: 0 };
    try { d.eng = v.getEngineHealth(); } catch (e) {}
    try { d.body = v.getBodyHealth(); } catch (e) {}
    try { d.tank = v.getPetrolTankHealth(); } catch (e) {}
    try { d.cls = v.getClass(); } catch (e) {}
    [0, 1, 2, 3, 4, 5].forEach(function (i) { try { if (v.isTyreBurst(i, false)) d.tyres++; } catch (e) {} });
    return d;
}

var svKeyAt = 0;
mp.keys.bind(0x45, false, function () {
    var me = mp.players.local;
    if ((!svNearSto && !svNearImp) || mp.gui.cursor.visible || me.isTypingInTextChat || global.chatOpen) return;
    if (Date.now() - svKeyAt < 1200) return;
    svKeyAt = Date.now();
    if (svNearSto && me.vehicle) mp.events.callRemote('srv:sto:open', JSON.stringify(svDamage(me.vehicle)));
    else if (svNearImp) mp.events.callRemote('srv:imp:open');
});

/* ================= износ ================= */
var W = null, wVeh = null, wLastPos = null, wLastBody = 1000, wSentAt = 0, wWarned = {}, wStallAt = 0, wJerkAt = 0, wBurstAt = 0, wGrip = false;
var RATE = { e: 0.33, s: 0.28, t: 0.42 };
var WN = { e: 'Двигатель', s: 'Подвеска', t: 'Шины' };

function wRead(v) {
    var s = v.getVariable('wear');
    if (s === undefined || s === null || s === '') return null;
    var n = String(s).split(',').map(Number);
    return { e: n[0], s: n[1], t: n[2] };
}
function wApplies(v) {
    if (!v.getVariable('ownerId')) return false;
    var c = 0;
    try { c = v.getClass(); } catch (e) {}
    return [13, 14, 15, 16, 21].indexOf(c) < 0;
}
function wPush(force) {
    if (!W || !wVeh) return;
    if (!force && Date.now() - wSentAt < 15000) return;
    wSentAt = Date.now();
    mp.events.callRemote('srv:wear:set', [W.e, W.s, W.t].map(function (x) { return Math.round(x * 10) / 10; }).join(','));
}
function wReset(v) {
    if (wVeh && wGrip) { try { svInv('0x222FF6A823D122E2', wVeh.handle, false); } catch (e) {} }
    wGrip = false;
    wVeh = v; W = v ? wRead(v) : null; wLastPos = v ? v.position : null; wWarned = {};
    try { wLastBody = v ? v.getBodyHealth() : 1000; } catch (e) { wLastBody = 1000; }
}
mp.events.add('svc:fixed', function (parts) {
    if (!W) return;
    String(parts).split(',').forEach(function (k) { if (W[k] !== undefined) W[k] = 100; });
    wWarned = {};
    if (wVeh && wGrip) { svInv('0x222FF6A823D122E2', wVeh.handle, false); wGrip = false; }
});

setInterval(function () {
    var me = mp.players.local, v = me.vehicle;
    if (!v || v.getPedInSeat(-1) !== me.handle || !wApplies(v)) { if (wVeh) { wPush(true); wReset(null); } return; }
    if (v !== wVeh) { if (wVeh) wPush(true); wReset(v); }
    if (!W) W = wRead(v) || { e: 100, s: 100, t: 100 };
    var pos = v.position;
    var km = wLastPos ? Math.min(0.2, Math.hypot(pos.x - wLastPos.x, pos.y - wLastPos.y) / 1000) : 0;
    wLastPos = pos;
    var rpm = 0, spd = 0;
    try { rpm = v.rpm || 0; } catch (e) {}
    try { spd = v.getSpeed() * 3.6; } catch (e) {}
    W.e -= km * RATE.e * (rpm > 0.85 ? 1.6 : 1);
    W.s -= km * RATE.s;
    W.t -= km * RATE.t * (spd > 140 ? 1.5 : 1);
    var body = 1000;
    try { body = v.getBodyHealth(); } catch (e) {}
    if (body < wLastBody - 5) {
        var hit = (wLastBody - body);
        W.s -= hit * 0.03; W.t -= hit * 0.012; W.e -= hit * 0.01;
    }
    wLastBody = body;
    ['e', 's', 't'].forEach(function (k) {
        W[k] = Math.max(0, W[k]);
        [50, 25, 10].forEach(function (lim) {
            if (W[k] < lim && !wWarned[k + lim]) {
                wWarned[k + lim] = 1;
                svNotify(lim > 25 ? 'warn' : 'error', WN[k] + ' изношен(а): ' + Math.round(W[k]) + '%. Заедьте на СТО', 6000);
            }
        });
    });
    wPush(false);
}, 1000);

mp.events.add('render', function () {
    if (!W || !wVeh || mp.players.local.vehicle !== wVeh) return;
    var v = wVeh, now = Date.now(), spd = 0;
    try { spd = v.getSpeed() * 3.6; } catch (e) {}
    if (W.e < 50) {
        var k = Math.max(0.25, W.e / 50);
        try { v.setEngineTorqueMultiplier(k); } catch (e) { svInv('0xB59E4BD37AE292DB', v.handle, k); }
        if (W.e <= 0) {
            try { if (v.getIsEngineRunning()) { v.setEngineOn(false, true, true); svNotify('error', 'Двигатель не заводится — нужен капремонт на СТО. Вызовите эвакуатор', 5000); } } catch (e) {}
        } else if (W.e < 15 && now > wStallAt) {
            wStallAt = now + 25000 + Math.random() * 50000;
            if (Math.random() < 0.6 && spd > 5) { try { v.setEngineOn(false, true, false); } catch (e) {} svNotify('warn', 'Двигатель заглох', 2500); }
        }
    }
    if (W.s < 50 && spd > 35 && now > wJerkAt) {
        var ks = (50 - W.s) / 50;
        wJerkAt = now + 1500 + Math.random() * (5000 - ks * 3000);
        var dir = Math.random() < 0.5 ? -1 : 1;
        svInv('0x42A8EC77D5150CBE', v.handle, dir * (0.08 + ks * 0.25));
        try { v.applyForceToEntity(1, dir * (0.4 + ks * 1.2), 0, 0, 0, 0, 0, 0, true, true, true, false, true); } catch (e) {}
        setTimeout(function () { svInv('0x42A8EC77D5150CBE', v.handle, 0.0001); }, 250 + ks * 350);
    }
    var needGrip = W.t < 35;
    if (needGrip !== wGrip) { svInv('0x222FF6A823D122E2', v.handle, needGrip); wGrip = needGrip; }
    if (W.t < 10 && spd > 50 && now > wBurstAt) {
        wBurstAt = now + 40000 + Math.random() * 60000;
        if (Math.random() < 0.5) { try { v.setTyreBurst([0, 1, 4, 5][Math.floor(Math.random() * 4)], false, 1000); } catch (e) {} svNotify('error', 'Лопнуло колесо!', 3000); }
    }
});

global.wearNow = function () { return W ? { e: Math.round(W.e), s: Math.round(W.s), t: Math.round(W.t) } : null; };
