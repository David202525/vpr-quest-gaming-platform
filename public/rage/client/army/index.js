var A = { pile: null, left: 0, gates: [] };
var near = '', hint = '';
mp.events.add('army:data', function (j) { try { A = JSON.parse(j); } catch (e) {} });

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
    if (!near || busy()) return;
    if (near === 'pile') return mp.events.callRemote('srv:army:pick');
    var a = near.split(':');
    if (a[0] === 'load') mp.events.callRemote('srv:army:load', Number(a[1]));
    if (a[0] === 'unload') mp.events.callRemote('srv:army:unload', Number(a[1]));
});

mp.keys.bind(0x48, false, function () {
    if (busy() || !A.gates.length) return;
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
