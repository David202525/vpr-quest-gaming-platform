var DOORS = [];
var dNear = null, dHint = '';
var dHandles = {};
function inv(h) { try { return mp.game.invoke.apply(mp.game, arguments); } catch (e) { return 0; } }
function fl(n) { n = Number(n) || 0; return n % 1 === 0 ? n + 0.0001 : n; }
function dFind(d) {
    var h = 0;
    try { h = mp.game.object.getClosestObjectOfType(d[2], d[3], d[4], 1.2, d[1], false, false, false); } catch (e) {}
    return h || 0;
}
function dHash(d) { return (0x5A3F0000 + d[0]) | 0; }
function dApply(d, force) {
    try { mp.game.object.doorControl(d[1], d[2], d[3], d[4], !!d[5], 0, 0, 0); } catch (e) {}
    try {
        if (!d.sys) { inv('0x6F8838D03D1DC226', dHash(d), d[1], fl(d[2]), fl(d[3]), fl(d[4]), false, false, false); d.sys = 1; }
        inv('0x6BAB9442830C7F53', dHash(d), d[5] ? 1 : 0, false, true);
    } catch (e) {}
    var h = dFind(d);
    if (!h) return;
    dHandles[d[0]] = h;
    if ((d[8] === null || d[8] === undefined) && !d.hd0) { try { d.hd0 = 1; d[8] = mp.game.invokeFloat('0xE83D4F9BA2A38914', h); } catch (e) {} }
    if (d[5]) {
        if (d[8] !== null && d[8] !== undefined) {
            var cur = 0;
            try { cur = mp.game.invokeFloat('0xE83D4F9BA2A38914', h); } catch (e) {}
            var diff = Math.abs(((cur - d[8]) % 360 + 540) % 360 - 180);
            if (force || diff > 0.5) {
                inv('0x428CA6DBD1094446', h, false);
                inv('0x8E2530AA8ADA980E', h, fl(d[8]));
            }
        }
        inv('0x428CA6DBD1094446', h, true);
    } else {
        inv('0x428CA6DBD1094446', h, false);
    }
}
mp.events.add('doors:all', function (json) {
    try { DOORS = JSON.parse(json) || []; } catch (e) { DOORS = []; }
    DOORS.forEach(function (d) { dApply(d, true); });
});
mp.events.add('doors:set', function (i, l) {
    var d = DOORS.find(function (x) { return x[0] === Number(i); });
    if (!d) return;
    d[5] = Number(l);
    dApply(d, true);
    try { mp.game.audio.playSoundFrontend(-1, Number(l) ? 'LOCK_DOOR' : 'UNLOCK_DOOR', 'HUD_FRONTEND_DEFAULT_SOUNDSET', true); } catch (e) {}
});
mp.events.add('doors:unlockOne', function (m, x, y, z) {
    try { mp.game.object.doorControl(Number(m), Number(x), Number(y), Number(z), false, 0, 0, 0); } catch (e) {}
    var h = 0;
    try { h = mp.game.object.getClosestObjectOfType(Number(x), Number(y), Number(z), 1.2, Number(m), false, false, false); } catch (e) {}
    if (h) inv('0x428CA6DBD1094446', h, false);
});
setInterval(function () {
    var pos = mp.players.local.position;
    DOORS.forEach(function (d) {
        var dx = pos.x - d[2], dy = pos.y - d[3];
        if (dx * dx + dy * dy < 3600) dApply(d, false);
    });
}, 300);
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
        var hd = 0;
        try { hd = mp.game.invokeFloat('0xE83D4F9BA2A38914', h); } catch (e) {}
        if (m && c) out.push([m, c.x, c.y, c.z, hd]);
    });
    mp.events.callRemote('srv:door:found', JSON.stringify(out));
});
mp.events.add('doors:scanFix', function (m, x, y, z) {
    var h = 0;
    try { h = mp.game.object.getClosestObjectOfType(Number(x), Number(y), Number(z), 1.2, Number(m), false, false, false); } catch (e) {}
    var hd = 0;
    if (h) try { hd = mp.game.invokeFloat('0xE83D4F9BA2A38914', h); } catch (e) {}
    mp.events.callRemote('srv:door:fixed', hd);
});
