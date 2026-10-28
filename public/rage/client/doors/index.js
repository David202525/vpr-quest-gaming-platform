var DOORS = [];
var dNear = null, dHint = '';
function inv() { try { return mp.game.invoke.apply(mp.game, arguments); } catch (e) { return 0; } }
function fl(n) { n = Number(n) || 0; return n % 1 === 0 ? n + 0.0001 : n; }
function eHead(h) {
    try { if (mp.game.entity.getHeading) { var v = mp.game.entity.getHeading(h); if (typeof v === 'number') return v; } } catch (e) {}
    try { return mp.game.invokeFloat('0xE83D4F9BA2A38914', h); } catch (e) {}
    return null;
}
function eSetHead(h, v) {
    try { if (mp.game.entity.setHeading) { mp.game.entity.setHeading(h, fl(v)); return; } } catch (e) {}
    inv('0x8E2530AA8ADA980E', h, fl(v));
}
function eFreeze(h, on) {
    try { if (mp.game.entity.freezePosition) { mp.game.entity.freezePosition(h, !!on); return; } } catch (e) {}
    inv('0x428CA6DBD1094446', h, !!on);
}
function dFind(d) {
    var h = 0;
    try { h = mp.game.object.getClosestObjectOfType(d[2], d[3], d[4], 1.2, d[1], false, false, false); } catch (e) {}
    return h || 0;
}
function dHash(d) { return (0x5A3F0000 + d[0]) | 0; }
function angDiff(a, b) { return ((a - b) % 360 + 540) % 360 - 180; }
function sysState(d, st) {
    if (!d.sys) { inv('0x6F8838D03D1DC226', dHash(d), d[1], fl(d[2]), fl(d[3]), fl(d[4]), false, false, false); d.sys = 1; }
    if (st) inv('0xB6E6FBA95C7324AC', dHash(d), fl(0), false, true);
    inv('0x6BAB9442830C7F53', dHash(d), st, false, true);
}
function closedHead(d) { return d[8] === null || d[8] === undefined ? null : Number(d[8]); }
function dApply(d) {
    try { mp.game.object.doorControl(d[1], d[2], d[3], d[4], !!d[5], 0, 0, 0); } catch (e) {}
    sysState(d, d[5] ? 1 : 0);
    var h = dFind(d);
    if (!h) return;
    d.h = h;
    if (closedHead(d) === null && !d.hd0) { var c0 = eHead(h); if (c0 !== null) { d[8] = c0; d.hd0 = 1; } }
    if (!d[5]) { if (d.frozen) { eFreeze(h, false); d.frozen = 0; } d.closing = 0; return; }
    var want = closedHead(d), cur = eHead(h);
    if (want === null || cur === null) { if (!d.frozen) { eFreeze(h, true); d.frozen = 1; } return; }
    if (Math.abs(angDiff(cur, want)) > 1) { if (d.frozen) { eFreeze(h, false); d.frozen = 0; } d.closing = 1; }
    else if (!d.frozen) { eSetHead(h, want); eFreeze(h, true); d.frozen = 1; d.closing = 0; }
}
mp.events.add('render', function () {
    for (var i = 0; i < DOORS.length; i++) {
        var d = DOORS[i];
        if (!d.closing) continue;
        if (!d[5] || !d.h) { d.closing = 0; continue; }
        var want = closedHead(d), cur = eHead(d.h);
        if (want === null || cur === null) { d.closing = 0; continue; }
        var df = angDiff(want, cur);
        if (Math.abs(df) <= 2.5) {
            eSetHead(d.h, want); eFreeze(d.h, true); d.frozen = 1; d.closing = 0;
            continue;
        }
        eSetHead(d.h, cur + (df > 0 ? 2.5 : -2.5));
    }
});
mp.events.add('doors:all', function (json) {
    var old = {};
    DOORS.forEach(function (d) { old[d[0] + ':' + d[1]] = d; });
    try { DOORS = JSON.parse(json) || []; } catch (e) { DOORS = []; }
    DOORS.forEach(function (d) { var o = old[d[0] + ':' + d[1]]; if (o) { d.sys = o.sys; if (closedHead(d) === null && o.hd0) { d[8] = o[8]; d.hd0 = 1; } } dApply(d); });
});
mp.events.add('doors:set', function (i, l) {
    var d = DOORS.find(function (x) { return x[0] === Number(i); });
    if (!d) return;
    d[5] = Number(l);
    if (d.h && d.frozen) { eFreeze(d.h, false); d.frozen = 0; }
    dApply(d);
    try { mp.game.audio.playSoundFrontend(-1, Number(l) ? 'LOCK_DOOR' : 'UNLOCK_DOOR', 'HUD_FRONTEND_DEFAULT_SOUNDSET', true); } catch (e) {}
});
mp.events.add('doors:unlockOne', function (m, x, y, z) {
    try { mp.game.object.doorControl(Number(m), Number(x), Number(y), Number(z), false, 0, 0, 0); } catch (e) {}
    var h = 0;
    try { h = mp.game.object.getClosestObjectOfType(Number(x), Number(y), Number(z), 1.2, Number(m), false, false, false); } catch (e) {}
    if (h) eFreeze(h, false);
});
setInterval(function () {
    var pos = mp.players.local.position;
    DOORS.forEach(function (d) {
        var dx = pos.x - d[2], dy = pos.y - d[3];
        if (dx * dx + dy * dy < 3600) dApply(d);
    });
}, 500);
setInterval(function () {
    var me = mp.players.local, pos = me.position, best = null, bd = 2.4;
    if (!me.vehicle) DOORS.forEach(function (d) { var r = mp.game.system.vdist(pos.x, pos.y, pos.z, d[2], d[3], d[4]); if (r < bd) { bd = r; best = d; } });
    dNear = best;
    var h = best ? (best[9] || best[0]) + ':' + best[5] : '';
    if (best && h !== dHint) mp.events.call('hud:notify', 'ok', 'E — ' + (best[5] ? 'открыть' : 'закрыть') + ': ' + best[7], 2200);
    dHint = h;
}, 400);
mp.events.add('render', function () {
    if (!dNear) return;
    mp.game.graphics.drawText(dNear[5] ? '🔒' : '🔓', [dNear[2], dNear[3], dNear[4] + 0.2], { font: 4, color: dNear[5] ? [255, 90, 90, 230] : [140, 220, 120, 230], scale: [0.5, 0.5], outline: true, centre: true });
});
mp.keys.bind(0x45, false, function () {
    if (!dNear || global.chatOpen || mp.players.local.isTypingInTextChat || mp.gui.cursor.visible) return;
    mp.events.callRemote('srv:door:toggle', dNear[0]);
});

function scanRay(from, ang, me) {
    var to = new mp.Vector3(from.x - Math.sin(ang) * 2.6, from.y + Math.cos(ang) * 2.6, from.z);
    var r = null;
    try { r = mp.raycasting.testPointToPoint(from, to, me, 16); } catch (e) {}
    var ent = r && r.entity;
    var hnd = typeof ent === 'number' ? ent : ent && ent.handle;
    return hnd || 0;
}
mp.events.add('doors:scan', function () {
    var me = mp.players.local, pos = me.position;
    var base = me.getHeading() * Math.PI / 180;
    var from = new mp.Vector3(pos.x, pos.y, pos.z + 0.2);
    var seen = {}, out = [];
    [-0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9].forEach(function (a) {
        var h = scanRay(from, base + a, me);
        if (!h || seen[h]) return;
        seen[h] = 1;
        var m = inv('0x9F47B058362C84B5', h);
        var c = null;
        try { c = mp.game.invokeVector3 ? mp.game.invokeVector3('0x3FEF770D40960D5A', h, true) : null; } catch (e) {}
        if (!c) try { c = mp.game.entity.getCoords(h, true); } catch (e) {}
        var hd = eHead(h);
        if (m && c) out.push([m, c.x, c.y, c.z, hd === null ? 0 : hd]);
    });
    mp.events.callRemote('srv:door:found', JSON.stringify(out));
});
mp.events.add('doors:scanFix', function (m, x, y, z) {
    var h = 0;
    try { h = mp.game.object.getClosestObjectOfType(Number(x), Number(y), Number(z), 1.2, Number(m), false, false, false); } catch (e) {}
    var hd = h ? eHead(h) : null;
    mp.events.callRemote('srv:door:fixed', hd === null ? 0 : hd);
});
