var A = { pile: null, left: 0, gates: [] };
var near = '', hint = '';
var pileBlip = null;
function pileMark() {
    var want = isArmy() && A.pile;
    if (pileBlip) { try { pileBlip.destroy(); } catch (e) {} pileBlip = null; }
    if (want) try { pileBlip = mp.blips.new(478, new mp.Vector3(A.pile[0], A.pile[1], A.pile[2]), { color: 25, scale: 0.8, shortRange: false, name: 'Армия: ящики поставки' }); } catch (e) {}
}
var pileKey = '';
mp.events.add('army:data', function (j) { try { A = JSON.parse(j); } catch (e) {} pileKey = ''; });
setInterval(function () { var k = (isArmy() ? 1 : 0) + ':' + (A.pile ? A.pile.join(',') : '-'); if (k !== pileKey) { pileKey = k; pileMark(); } }, 2000);

function isArmy() { try { return mp.players.local.getVariable('fac') === 'army'; } catch (e) { return false; } }
function busy() { var me = mp.players.local; return global.chatOpen || me.isTypingInTextChat || (global.uiOpenG && global.uiOpenG()) || (global.govMenuOpen && global.govMenuOpen()) || mp.gui.cursor.visible; }
function truckRear(v) {
    try {
        var h = v.getHeading() * Math.PI / 180, fx = -Math.sin(h), fy = Math.cos(h), p = v.position;
        return { x: p.x - fx * 4.5, y: p.y - fy * 4.5, z: p.z };
    } catch (e) { return null; }
}
function nearTruck() {
    var me = mp.players.local, best = null, bd = 3.2;
    mp.vehicles.forEachInStreamRange(function (v) {
        if (!v.handle || v.getVariable('gov') !== 'army') return;
        var m = v.getVariable('govModel');
        if (m !== 'barracks' && m !== 'barracks3') return;
        var r = truckRear(v); if (!r) return;
        var d = mp.game.system.vdist(me.position.x, me.position.y, me.position.z, r.x, r.y, r.z);
        if (d < bd) { bd = d; best = v; }
    });
    return best;
}

setInterval(function () {
    var me = mp.players.local, pos = me.position, h = '';
    near = '';
    if (isArmy() && !me.vehicle && me.dimension === 0) {
        var carry = !!me.getVariable('armyCarry');
        var t = nearTruck();
        if (t && carry) { near = 'load:' + t.remoteId; h = 'E — погрузить ящик в кузов'; }
        else if (A.pile && Math.hypot(pos.x - A.pile[0], pos.y - A.pile[1]) < 4) { near = 'pile'; h = carry ? 'E — положить ящик обратно' : (A.left ? 'E — взять ящик (' + A.left + ' осталось)' : 'Ящиков нет — ждите поставку'); }
        else if (t && !carry && (Number(t.getVariable('crates')) || 0) > 0 && A.pile && Math.hypot(pos.x - A.pile[0], pos.y - A.pile[1]) < 40) { near = 'unload:' + t.remoteId; h = 'E — снять ящик с кузова'; }
    }
    if (h && h !== hint) mp.events.call('hud:notify', 'ok', h, 2500);
    hint = h;
}, 300);

mp.keys.bind(0x45, false, function () {
    if (!near || busy() || global.gateEditOpen) return;
    if (near === 'pile') return mp.events.callRemote('srv:army:pick');
    var a = near.split(':');
    if (a[0] === 'load') mp.events.callRemote('srv:army:load', Number(a[1]));
    if (a[0] === 'unload') mp.events.callRemote('srv:army:unload', Number(a[1]));
});

mp.keys.bind(0x48, false, function () {
    if (global.gateEditOpen || busy() || !A.gates.length) return;
    var pos = mp.players.local.position;
    if (A.gates.some(function (g) { return Math.hypot(pos.x - g.x, pos.y - g.y) < 14; })) mp.events.callRemote('srv:army:gate');
});

function lockGate(o) {
    try {
        o.freezePosition(true);
        o.setInvincible(true);
        o.setCanBeDamaged(false);
        o.setProofs(true, true, true, true, true, true, true, true);
    } catch (e) {}
}
mp.events.add('entityStreamIn', function (e) { if (e && e.type === 'object' && e.getVariable('armyGate')) setTimeout(function () { lockGate(e); }, 50); });
setInterval(function () { mp.objects.forEachInStreamRange(function (o) { if (o.handle && o.getVariable('armyGate')) lockGate(o); }); }, 3000);

setInterval(function () {
    if (!A.gates.length || isArmy()) return;
    var me = mp.players.local, v = me.vehicle;
    var e = v || me, p = e.position;
    A.gates.forEach(function (g) {
        var gx = g.x, gy = g.y;
        var o = null;
        mp.objects.forEachInStreamRange(function (x) { if (x.getVariable('armyGate') === g.i + 1) o = x; });
        if (o) { gx = o.position.x; gy = o.position.y; }
        if (Math.hypot(p.x - g.x, p.y - g.y) > 2 && Math.hypot(p.x - gx, p.y - gy) > 2) return;
        if (Math.hypot(gx - g.x, gy - g.y) > 3) return;
        var r = g.h * Math.PI / 180, nx = -Math.sin(r), ny = Math.cos(r);
        var side = (p.x - g.x) * nx + (p.y - g.y) * ny;
        var s = side >= 0 ? 1 : -1;
        if (Math.abs(side) > 2.2) return;
        try {
            if (v) { v.setVelocity(nx * s * 6, ny * s * 6, 0); v.setCoordsNoOffset(p.x + nx * s * 1.5, p.y + ny * s * 1.5, p.z, false, false, false); }
            else me.setCoordsNoOffset(p.x + nx * s * 1.5, p.y + ny * s * 1.5, p.z, false, false, false);
        } catch (err) {}
    });
}, 100);

mp.events.add('render', function () {
    var me = mp.players.local, pos = me.position;
    if (me.dimension !== 0 || !isArmy()) return;
    if (A.pile && A.left > 0 && Math.hypot(pos.x - A.pile[0], pos.y - A.pile[1]) < 40) {
        mp.game.graphics.drawMarker(1, A.pile[0], A.pile[1], A.pile[2] - 1, 0, 0, 0, 0, 0, 0, 5, 5, 0.3, 120, 200, 90, 70, false, false, 2, false, null, null, false);
        mp.game.graphics.drawText('📦 Поставка · ' + A.left + ' ящ.', [A.pile[0], A.pile[1], A.pile[2] + 1.6], { font: 4, color: [160, 230, 120, 230], scale: [0.4, 0.4], outline: true, centre: true });
    }
    if (me.getVariable('armyCarry')) {
        mp.game.controls.disableControlAction(0, 21, true);
        mp.game.controls.disableControlAction(0, 22, true);
        mp.game.controls.disableControlAction(0, 24, true);
        mp.game.controls.disableControlAction(0, 23, true);
    }
    mp.vehicles.forEachInStreamRange(function (v) {
        if (v.getVariable('gov') !== 'army') return;
        var n = Number(v.getVariable('crates')) || 0;
        if (!n) return;
        var d = mp.game.system.vdist(pos.x, pos.y, pos.z, v.position.x, v.position.y, v.position.z);
        if (d < 15) mp.game.graphics.drawText('📦 ' + n + '/12', [v.position.x, v.position.y, v.position.z + 2.6], { font: 4, color: [255, 220, 120, 230], scale: [0.35, 0.35], outline: true, centre: true });
    });
    A.gates.forEach(function (g) {
        if (Math.hypot(pos.x - g.x, pos.y - g.y) < 14) mp.game.graphics.drawText('H — открыть ворота', [g.x, g.y, g.z + 3.2], { font: 4, color: [255, 255, 255, 200], scale: [0.32, 0.32], outline: true, centre: true });
    });
});

/* ================= РЕДАКТОР ВОРОТ ================= */
var GE = null, geLast = 0, geDelT = 0;
function geSrv(on) {
    if (!GE || GE.i < 0) return;
    mp.objects.forEachInStreamRange(function (o) {
        if (o.getVariable('armyGate') === GE.i + 1) { try { o.setAlpha(on ? 255 : 0, false); o.setCollision(on, on); } catch (e) {} }
    });
}
function geSpawn() {
    if (GE.obj) { try { GE.obj.destroy(); } catch (e) {} }
    GE.obj = mp.objects.new(mp.game.joaat(GE.m), new mp.Vector3(GE.x, GE.y, GE.z), { rotation: new mp.Vector3(GE.rx, GE.ry, GE.h), alpha: 210, dimension: mp.players.local.dimension });
    GE.dim = null;
}
function geClose(save) {
    if (!GE) return;
    if (save) mp.events.callRemote('srv:army:gSave', JSON.stringify({ i: GE.i, m: GE.m, x: GE.x, y: GE.y, z: GE.z, h: GE.h, rx: GE.rx, ry: GE.ry, slide: GE.slide }));
    else geSrv(true);
    try { GE.obj.destroy(); } catch (e) {}
    GE = null;
    global.gateEditOpen = false;
    mp.events.call('hud:notify', 'ok', save ? 'Ворота сохранены' : 'Редактор закрыт без сохранения', 2500);
}
mp.events.add('army:gEdit', function (j) {
    if (GE) geClose(false);
    try { GE = JSON.parse(j); } catch (e) { return; }
    global.gateEditOpen = true;
    geLast = Date.now();
    geSpawn();
    geSrv(false);
    setTimeout(function () { geSrv(false); }, 500);
    mp.events.call('hud:notify', 'ok', 'Редактор ворот: подсказки слева. Enter — сохранить, Esc — отмена', 5000);
});
function K(v) { return mp.keys.isDown(v); }
function ln(a, b, c) { mp.game.graphics.drawLine(a.x, a.y, a.z, b.x, b.y, b.z, c[0], c[1], c[2], 255); }
function geDraw() {
    var o = GE.obj;
    if (!o || !o.handle) return;
    var off = function (x, y, z) { return o.getOffsetFromInWorldCoords(x, y, z); };
    var c0 = off(0, 0, 0);
    ln(c0, off(2.5, 0, 0), [255, 40, 40]);
    ln(c0, off(0, 2.5, 0), [40, 255, 40]);
    ln(c0, off(0, 0, 2.5), [40, 80, 255]);
    if (!GE.dim) { try { GE.dim = mp.game.gameplay.getModelDimensions(mp.game.joaat(GE.m)); } catch (e) { GE.dim = { min: { x: -2, y: -0.2, z: 0 }, max: { x: 2, y: 0.2, z: 3 } }; } }
    var a = GE.dim.min, b = GE.dim.max, P = [];
    [[a.x, a.y, a.z], [b.x, a.y, a.z], [b.x, b.y, a.z], [a.x, b.y, a.z], [a.x, a.y, b.z], [b.x, a.y, b.z], [b.x, b.y, b.z], [a.x, b.y, b.z]].forEach(function (q) { P.push(off(q[0], q[1], q[2])); });
    [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(function (e) { ln(P[e[0]], P[e[1]], [255, 60, 60]); });
    var r = GE.h * Math.PI / 180, s = off(0, 0, 0.3);
    var t = new mp.Vector3(s.x + Math.cos(r) * GE.slide, s.y + Math.sin(r) * GE.slide, s.z);
    ln(s, t, [255, 220, 0]);
    mp.game.graphics.drawMarker(0, t.x, t.y, t.z + 0.4, 0, 0, 0, 0, 0, 0, 0.4, 0.4, 0.4, 255, 220, 0, 200, false, false, 2, false, null, null, false);
}
mp.events.add('render', function () {
    if (!GE) return;
    var now = Date.now(), dt = Math.min(0.1, (now - geLast) / 1000);
    geLast = now;
    var ctl = mp.game.controls;
    [37, 44, 45, 140, 141, 142, 143, 157, 158, 159, 160, 161, 162, 163, 164, 165, 172, 173, 174, 175, 199, 200, 10, 11, 14, 15, 16, 17, 24, 25, 27, 36, 21, 23, 75, 47, 58, 96, 97].forEach(function (c) { ctl.disableControlAction(0, c, true); });
    var typing = global.chatOpen || mp.players.local.isTypingInTextChat;
    if (!typing) {
        var sp = K(0x10) ? 5 : (K(0x11) ? 0.2 : 1);
        var mv = 2.5 * sp * dt, rt = 45 * sp * dt, ch = false;
        var cr = mp.game.cam.getGameplayCamRot(2).z * Math.PI / 180;
        var fx = -Math.sin(cr), fy = Math.cos(cr), rx = Math.cos(cr), ry = Math.sin(cr);
        if (K(0x26)) { GE.x += fx * mv; GE.y += fy * mv; ch = true; }
        if (K(0x28)) { GE.x -= fx * mv; GE.y -= fy * mv; ch = true; }
        if (K(0x27)) { GE.x += rx * mv; GE.y += ry * mv; ch = true; }
        if (K(0x25)) { GE.x -= rx * mv; GE.y -= ry * mv; ch = true; }
        if (K(0x21)) { GE.z += mv * 0.6; ch = true; }
        if (K(0x22)) { GE.z -= mv * 0.6; ch = true; }
        if (K(0xDB)) { GE.h = (GE.h + rt + 360) % 360; ch = true; }
        if (K(0xDD)) { GE.h = (GE.h - rt + 360) % 360; ch = true; }
        if (K(0x24)) { GE.rx = Math.min(90, GE.rx + rt * 0.5); ch = true; }
        if (K(0x23)) { GE.rx = Math.max(-90, GE.rx - rt * 0.5); ch = true; }
        if (K(0x39)) { GE.ry = Math.min(90, GE.ry + rt * 0.5); ch = true; }
        if (K(0x30)) { GE.ry = Math.max(-90, GE.ry - rt * 0.5); ch = true; }
        if (ch && GE.obj && GE.obj.handle) {
            try { GE.obj.setCoordsNoOffset(GE.x, GE.y, GE.z, false, false, false); GE.obj.setRotation(GE.rx, GE.ry, GE.h, 2, true); } catch (e) {}
        }
        if (GE.obj && GE.obj.handle) { try { GE.obj.setCollision(false, false); } catch (e) {} }
    }
    geDraw();
    var t = [
        'РЕДАКТОР ВОРОТ ' + (GE.i < 0 ? '(новые)' : '№' + (GE.i + 1)),
        'Стрелки — двигать (по взгляду камеры)',
        'PageUp / PageDown — выше / ниже',
        '[ / ] — повернуть   ·   G — на землю',
        'Home / End — наклон вперёд-назад',
        '9 / 0 — наклон вбок   ·   R — сбросить наклон',
        'Shift — быстрее, Ctrl — точнее',
        'Tab — сменить модель   ·   F — к себе',
        '+ / − — ход открытия: ' + GE.slide.toFixed(1) + ' м (жёлтая стрелка)',
        'Enter — сохранить · Esc — отмена' + (GE.i >= 0 ? ' · Delete ×2 — удалить' : ''),
        'Угол ' + GE.h.toFixed(0) + '°  наклон ' + GE.rx.toFixed(0) + '° / ' + GE.ry.toFixed(0) + '°'
    ];
    t.forEach(function (s, i) {
        mp.game.graphics.drawText(s, [0.015, 0.3 + i * 0.026], { font: 4, color: i === 0 ? [255, 210, 80, 255] : [255, 255, 255, 230], scale: [0.36, 0.36], outline: true, centre: false });
    });
});
function geKey(vk, fn) { mp.keys.bind(vk, false, function () { if (!GE || global.chatOpen || mp.players.local.isTypingInTextChat) return; fn(); }); }
function geApply() { if (GE && GE.obj && GE.obj.handle) { try { GE.obj.setCoordsNoOffset(GE.x, GE.y, GE.z, false, false, false); GE.obj.setRotation(GE.rx, GE.ry, GE.h, 2, true); } catch (e) {} } }
geKey(0x0D, function () { geClose(true); });
geKey(0x1B, function () { geClose(false); });
geKey(0x52, function () { GE.rx = 0; GE.ry = 0; geApply(); });
geKey(0x47, function () {
    var z = mp.game.gameplay.getGroundZFor3dCoord(GE.x, GE.y, GE.z + 5, 0, false);
    var gz = typeof z === 'number' ? z : (z && z.groundZ);
    if (gz) { GE.z = gz; geApply(); }
});
geKey(0x46, function () {
    var me = mp.players.local, r = me.getHeading() * Math.PI / 180;
    GE.x = me.position.x - Math.sin(r) * 3; GE.y = me.position.y + Math.cos(r) * 3; GE.z = me.position.z - 1; GE.h = (me.getHeading() + 90) % 360;
    geApply();
});
geKey(0x09, function () {
    var L = GE.models || [], k = L.findIndex(function (m) { return m[1] === GE.m; });
    if (!L.length) return;
    var n = L[(k + 1) % L.length];
    GE.m = n[1]; geSpawn();
    mp.events.call('hud:notify', 'ok', 'Модель: ' + n[0], 1500);
});
geKey(0xBB, function () { GE.slide = Math.min(20, GE.slide + 0.5); });
geKey(0x6B, function () { GE.slide = Math.min(20, GE.slide + 0.5); });
geKey(0xBD, function () { GE.slide = Math.max(2, GE.slide - 0.5); });
geKey(0x6D, function () { GE.slide = Math.max(2, GE.slide - 0.5); });
geKey(0x2E, function () {
    if (GE.i < 0) return;
    if (Date.now() - geDelT > 2000) { geDelT = Date.now(); return mp.events.call('hud:notify', 'warn', 'Нажмите Delete ещё раз, чтобы удалить ворота', 2000); }
    mp.events.callRemote('srv:army:gDel', GE.i);
    try { GE.obj.destroy(); } catch (e) {}
    GE = null; global.gateEditOpen = false;
});
