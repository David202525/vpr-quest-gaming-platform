var LX = null, LW = null, lShow = null;

function lClear() {
    if (!LX) return;
    try { if (LX.cp) LX.cp.destroy(); } catch (e) {}
    try { if (LX.blip) LX.blip.destroy(); } catch (e) {}
    LX.cp = null; LX.blip = null;
}
function lVec(r) {
    if (!r) return null;
    var v = r.outPosition || r.outPos || r.position || r;
    if (v && isFinite(v.x) && isFinite(v.y) && (Math.abs(v.x) + Math.abs(v.y)) > 1) return v;
    return null;
}
function lGround(x, y, z) {
    try {
        var g = mp.game.gameplay.getGroundZFor3dCoord(x, y, z + 3, 0, false);
        if (typeof g === 'number' && g > -100 && Math.abs(g - z) < 6) return g;
    } catch (e) {}
    return z;
}
function lNode(pt) {
    var x = pt[0], y = pt[1], z = pt[2], best = null, bd = 80;
    try { mp.game.pathfind.loadAllPathNodes(true); } catch (e) {}
    var tries = [
        function () { return mp.game.pathfind.getClosestVehicleNode(x, y, z, new mp.Vector3(0, 0, 0), 0, 3.0, 0); },
        function () { return mp.game.pathfind.getClosestMajorVehicleNode(x, y, z, new mp.Vector3(0, 0, 0), 3.0, 0); },
        function () { return mp.game.pathfind.getClosestVehicleNode(x, y, z, 0, 3.0, 0); },
        function () { return mp.game.pathfind.getClosestVehicleNodeWithHeading(x, y, z, new mp.Vector3(0, 0, 0), 0, 1, 3.0, 0); }
    ];
    for (var k = 0; k < tries.length; k++) {
        var v = null;
        try { v = lVec(tries[k]()); } catch (e) {}
        if (!v) continue;
        var d = Math.hypot(v.x - x, v.y - y);
        if (d < bd) { bd = d; best = v; }
    }
    if (!best) return null;
    return [best.x, best.y, lGround(best.x, best.y, best.z || z)];
}
function lSnap(i) {
    if (!LX.snap) LX.snap = {};
    if (!LX.snap[i] && LX.pts[i]) {
        var pos = mp.players.local.position, pt = LX.pts[i];
        if (Math.hypot(pos.x - pt[0], pos.y - pt[1]) < 350) { var n = lNode(pt); if (n) LX.snap[i] = n; }
    }
    return LX.snap[i] || LX.pts[i];
}
setInterval(function () {
    if (!LX || !LX.pts[LX.i]) return;
    if (LX.snap && LX.snap[LX.i] && (!LX.pts[LX.i + 1] || LX.snap[LX.i + 1])) return;
    var before = LX.cur;
    var pt = lSnap(LX.i);
    if (LX.pts[LX.i + 1]) lSnap(LX.i + 1);
    if (!before || before[0] !== pt[0] || before[1] !== pt[1]) lPoint();
}, 1000);
function lPoint() {
    lClear();
    if (!LX.pts[LX.i]) return;
    var pt = lSnap(LX.i);
    var last = LX.i === LX.pts.length - 1;
    var nx = LX.pts[LX.i + 1] ? lSnap(LX.i + 1) : pt;
    LX.cur = pt;
    LX.cp = mp.checkpoints.new(last ? 4 : 0, new mp.Vector3(pt[0], pt[1], pt[2] - 1), 6, { direction: new mp.Vector3(nx[0], nx[1], nx[2]), color: [95, 211, 198, 140], visible: true, dimension: mp.players.local.dimension });
    LX.blip = mp.blips.new(1, new mp.Vector3(pt[0], pt[1], pt[2]), { dimension: 4294967295, color: 46, name: 'Экзамен', shortRange: false });
    try { LX.blip.setRoute(true); } catch (e) {}
}
mp.events.add('lic:start', function (j) {
    try { LX = JSON.parse(j); } catch (e) { return; }
    LX.i = 0; LX.until = Date.now() + LX.time * 60000; LX.over = 0; LX.hits = 0; LX.sent = false;
    var v = mp.players.local.vehicle;
    LX.hp = v ? v.getBodyHealth() : 1000;
    LX.hitAt = 0;
    LX.snap = {};
    try { mp.game.pathfind.loadAllPathNodes(true); } catch (e) {}
    lPoint();
});
mp.events.add('lic:next', function (i) { if (!LX) return; LX.i = Number(i); LX.sent = false; lPoint(); });
mp.events.add('lic:stop', function () { lClear(); LX = null; });
mp.events.add('lic:watch', function (j) { try { LW = JSON.parse(j); LW.i = 0; LW.hits = 0; LW.at = Date.now(); } catch (e) {} });
mp.events.add('lic:progress', function (i, total, hits) { if (!LW) return; LW.i = i; LW.total = total; LW.hits = hits; if (i >= total) setTimeout(function () { LW = null; }, 4000); });
mp.events.add('lic:show', function (j) {
    try { lShow = JSON.parse(j); } catch (e) { return; }
    setTimeout(function () { lShow = null; }, 60000);
});

setInterval(function () {
    if (!LX) return;
    var me = mp.players.local, v = me.vehicle;
    if (!v) return;
    var pt = LX.cur || LX.pts[LX.i];
    if (pt && !LX.sent && mp.game.system.vdist(v.position.x, v.position.y, v.position.z, pt[0], pt[1], pt[2]) < 8) {
        LX.sent = true;
        mp.events.callRemote('srv:lic:cp', LX.i);
        setTimeout(function () { if (LX) LX.sent = false; }, 1500);
    }
    var kmh = v.getSpeed() * 3.6;
    if (kmh > LX.lim + 3) {
        LX.over += 1;
        if (LX.over >= 4) { mp.events.callRemote('srv:lic:speed', kmh); LX.over = -999; }
    } else if (LX.over > 0) LX.over = 0;
    var hp = v.getBodyHealth();
    if (hp < LX.hp - 15 && Date.now() - LX.hitAt > 3000) {
        LX.hitAt = Date.now();
        mp.events.callRemote('srv:lic:hit');
    }
    LX.hp = hp;
}, 250);

mp.events.add('render', function () {
    if (LX) {
        var v = mp.players.local.vehicle, kmh = v ? Math.round(v.getSpeed() * 3.6) : 0;
        var left = Math.max(0, Math.floor((LX.until - Date.now()) / 1000));
        var col = kmh > LX.lim ? [255, 80, 80, 255] : kmh > LX.lim - 8 ? [255, 200, 80, 255] : [255, 255, 255, 235];
        mp.game.graphics.drawText('ЭКЗАМЕН · ' + LX.n, [0.5, 0.86], { font: 4, color: [95, 211, 198, 240], scale: [0.45, 0.45], outline: true, centre: true });
        mp.game.graphics.drawText(kmh + ' / ' + LX.lim + ' км/ч   ·   точка ' + Math.min(LX.i + 1, LX.pts.length) + ' из ' + LX.pts.length + '   ·   ' + Math.floor(left / 60) + ':' + ('0' + left % 60).slice(-2), [0.5, 0.89], { font: 4, color: col, scale: [0.42, 0.42], outline: true, centre: true });
        mp.game.graphics.drawText('Превышение лимита или 2 столкновения — незачёт', [0.5, 0.92], { font: 4, color: [200, 200, 200, 200], scale: [0.32, 0.32], outline: true, centre: true });
    } else if (LW) {
        mp.game.graphics.drawText('Экзамен ' + LW.cat + ' · ' + LW.n + ' · точка ' + LW.i + ' из ' + (LW.total || '?') + ' · столкновений ' + LW.hits, [0.5, 0.9], { font: 4, color: [95, 211, 198, 230], scale: [0.4, 0.4], outline: true, centre: true });
    }
    if (lShow) lShow.forEach(function (pt, i) {
        mp.game.graphics.drawMarker(1, pt[0], pt[1], pt[2] - 1, 0, 0, 0, 0, 0, 0, 3, 3, 1, 95, 211, 198, 120, false, false, 2, false, null, null, false);
        mp.game.graphics.drawText(String(i + 1), [pt[0], pt[1], pt[2] + 1.5], { font: 4, color: [255, 255, 255, 255], scale: [0.6, 0.6], outline: true, centre: true });
    });
});

var BUSES = ['bus', 'coach', 'airbus', 'tourbus', 'rentalbus', 'pbus', 'pbus2'];
function needCat(v) {
    if (v.getVariable('rent')) return null;
    if (v.getVariable('powerVeh')) return 'B';
    var m = v.model, cls = 0;
    try { cls = mp.game.vehicle.getVehicleClassFromName(m); } catch (e) {}
    if (cls === 13 || cls === 14 || cls === 15 || cls === 16 || cls === 21) return null;
    for (var i = 0; i < BUSES.length; i++) if (m === mp.game.joaat(BUSES[i])) return 'D';
    if (cls === 8) return 'A';
    if (cls === 10 || cls === 11 || cls === 17 || cls === 20) return 'C';
    return 'B';
}
var CN = { A: 'A (мотоциклы)', B: 'B (легковые)', C: 'C (грузовые)', D: 'D (автобусы)' };
var dWarn = 0, lastVeh = null;
setInterval(function () {
    var me = mp.players.local, v = me.vehicle;
    if (!v) { lastVeh = null; return; }
    if (v.getPedInSeat(-1) !== me.handle) return;
    if (v.getVariable('gov') === 'lic') { try { v.setMaxSpeed(85 / 3.6); } catch (e) {} }
    var c = needCat(v) || '';
    if (v.getVariable('vcat') !== c) mp.events.callRemote('srv:lic:vcat', c);
    if (lastVeh === v) return;
    lastVeh = v;
    if (me.getVariable('inExam')) return;
    var have = me.getVariable('dcats');
    if (have === undefined || have === null || have === 'ALL' || !c) return;
    if (String(have).indexOf(c) >= 0) return;
    mp.events.call('hud:notify', 'warn', String(have) ? 'У вас нет категории ' + CN[c] + '. Если остановит полиция — будут проблемы' : 'Вы за рулём без прав! Если остановит полиция — штраф, эвакуация или розыск', 5000);
}, 700);

var lBr = null, lBrOpen = false;
function lUI(on, code) {
    if (on && !lBr) lBr = mp.browsers.new('package://cef/lic/index.html');
    if (!lBr) return;
    lBr.active = on;
    lBrOpen = on;
    global.licUiOpen = on;
    mp.gui.cursor.show(on, on);
    mp.gui.chat.activate(!on);
    if (on && code) { var run = function () { if (lBr) lBr.execute(code); }; setTimeout(run, 150); setTimeout(run, 700); }
}
mp.events.add('lic:theory', function (j) { lUI(true, 'window.theory && window.theory(' + JSON.stringify(j) + ');'); });
mp.events.add('lic:police', function (j) { lUI(true, 'window.police && window.police(' + JSON.stringify(j) + ');'); });
mp.events.add('cef:lic:theory', function (j) { lUI(false); mp.events.callRemote('srv:lic:theory', j); });
mp.events.add('cef:lic:punish', function (id, k) { lUI(false); if (k) mp.events.callRemote('srv:lic:punish', Number(id), String(k)); });
mp.events.add('cef:lic:close', function () { lUI(false); });

try { mp.blips.new(498, new mp.Vector3(226.0, -808.5, 30.6), { dimension: 4294967295, color: 46, name: 'Лицензионный центр', shortRange: true, scale: 0.9 }); } catch (e) {}
