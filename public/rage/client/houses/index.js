var H = [];
var HS = { ints: [], fac: [] };
var hBlips = {};
var hNear = null;
var hHint = '';
var hotel = null;
var hMenuOpen = false;
var RADIUS = 150;
function UX(c) { if (global.uiExecG) global.uiExecG(c); }
function CS() { if (global.cursorSyncG) global.cursorSyncG(); else mp.gui.cursor.show(false, false); }

function hBusy() {
    return global.chatOpen || global.authOpen || global.creatorOpen || global.introOpen || mp.players.local.isTypingInTextChat || (global.uiOpenG && global.uiOpenG()) || hMenuOpen;
}
function d2(a, x, y) { var dx = a.x - x, dy = a.y - y; return Math.sqrt(dx * dx + dy * dy); }

mp.events.add('house:list', function (json) {
    try { H = JSON.parse(json) || []; } catch (e) { H = []; }
    Object.keys(hBlips).forEach(function (k) { try { hBlips[k].destroy(); } catch (e) {} });
    hBlips = {};
});
mp.events.add('house:static', function (json) {
    try { HS = JSON.parse(json) || HS; } catch (e) {}
    (HS.fac || []).forEach(function (f) { if (f[8]) try { mp.game.streaming.requestIpl(f[8]); } catch (e) {} });
});
mp.events.add('spawn:hotel', function (x, y, z, n) { hotel = { x: x, y: y, z: z, n: n }; });

var COL = [2, 1, 3];
var NAME = ['Свободный дом', 'Занятый дом', 'Мой дом'];
setInterval(function () {
    var me = mp.players.local, pos = me.position;
    var inWorld = me.dimension === 0;
    var seen = {};
    if (inWorld) H.forEach(function (h) {
        var mineH = h[4] === 2;
        var d = d2(pos, h[1], h[2]);
        if (!mineH && d > RADIUS) return;
        var key = h[1].toFixed(0) + '_' + h[2].toFixed(0);
        if (seen[key] !== undefined && seen[key] >= h[4] && !mineH) return;
        seen[key] = Math.max(seen[key] || 0, h[4] === 0 ? 0.5 : h[4]);
        var st = h[4];
        var b = hBlips[key];
        if (b && b._st !== st) { try { b.destroy(); } catch (e) {} b = null; }
        if (!b) {
            b = mp.blips.new(mineH ? 40 : 411, new mp.Vector3(h[1], h[2], h[3]), { name: NAME[st], color: COL[st], shortRange: !mineH, scale: mineH ? 0.9 : 0.6 });
            b._st = st;
            hBlips[key] = b;
        }
        b._t = Date.now();
    });
    Object.keys(hBlips).forEach(function (k) {
        var b = hBlips[k];
        if (!inWorld || Date.now() - (b._t || 0) > 2500) { try { b.destroy(); } catch (e) {} delete hBlips[k]; }
    });

    var best = null, bd = 2.2, hint = '';
    if (!me.vehicle) {
        if (inWorld) {
            H.forEach(function (h) { var d = mp.game.system.vdist(pos.x, pos.y, pos.z, h[1], h[2], h[3]); if (d < bd) { bd = d; best = { k: 'house', id: h[0], st: h[4] }; } });
            if (hotel && mp.game.system.vdist(pos.x, pos.y, pos.z, hotel.x, hotel.y, hotel.z) < 2.2) best = { k: 'hotel' };
            (HS.fac || []).forEach(function (f, i) { if (mp.game.system.vdist(pos.x, pos.y, pos.z, f[1], f[2], f[3]) < 2.2) best = { k: 'fac', i: i, n: f[0] }; });
        } else {
            (HS.ints || []).forEach(function (t) { if (mp.game.system.vdist(pos.x, pos.y, pos.z, t[0], t[1], t[2]) < 2.2) best = { k: 'exit' }; });
            (HS.fac || []).forEach(function (f) { if (me.dimension === f[7] && mp.game.system.vdist(pos.x, pos.y, pos.z, f[4], f[5], f[6]) < 2.2) best = { k: 'exit' }; });
        }
    }
    if (best) hint = best.k === 'house' ? (best.st === 2 ? 'E — мой дом' : best.st === 1 ? 'E — дверь (занято)' : 'E — дом продаётся') : best.k === 'hotel' ? 'E — гостиница' : best.k === 'fac' ? 'E — войти: ' + best.n : 'E — выйти на улицу';
    hNear = best;
    if (hint && hint !== hHint) mp.events.call('hud:notify', 'ok', hint, 2500);
    hHint = hint;
}, 400);

mp.events.add('render', function () {
    var me = mp.players.local, pos = me.position;
    function mk(x, y, z, r, g, b) {
        var dx = pos.x - x, dy = pos.y - y;
        if (dx * dx + dy * dy > 900) return;
        mp.game.graphics.drawMarker(1, x, y, z - 1, 0, 0, 0, 0, 0, 0, 1.0, 1.0, 0.35, r, g, b, 110, false, false, 2, false, null, null, false);
    }
    if (me.dimension === 0) {
        H.forEach(function (h) { var c = h[4] === 0 ? [90, 200, 90] : h[4] === 2 ? [90, 160, 255] : [220, 80, 80]; mk(h[1], h[2], h[3], c[0], c[1], c[2]); });
        if (hotel) mk(hotel.x, hotel.y, hotel.z, 255, 204, 102);
        (HS.fac || []).forEach(function (f) { mk(f[1], f[2], f[3], 193, 61, 255); });
    } else {
        (HS.ints || []).forEach(function (t) { mk(t[0], t[1], t[2], 255, 255, 255); });
        (HS.fac || []).forEach(function (f) { if (me.dimension === f[7]) mk(f[4], f[5], f[6], 255, 255, 255); });
    }
});

mp.keys.bind(0x45, false, function () {
    if (!hNear || hBusy() || mp.players.local.vehicle) return;
    if (hNear.k === 'house') mp.events.callRemote('srv:house:menu', hNear.id);
    else if (hNear.k === 'hotel') mp.events.callRemote('srv:hotel:enter');
    else if (hNear.k === 'fac') mp.events.callRemote('srv:fac:enter', hNear.i);
    else if (hNear.k === 'exit') mp.events.callRemote('srv:house:exit');
});

mp.events.add('house:inside', function (n) {
    if (n) mp.events.call('hud:notify', 'ok', n + ' · выход — E у двери', 4000);
});

function hMenu(json) {
    UX('window.houseMenu && window.houseMenu(' + JSON.stringify(json) + ');');
    hMenuOpen = true;
    mp.gui.cursor.show(true, true);
    mp.gui.chat.activate(false);
}
function hMenuClose() {
    if (!hMenuOpen) return;
    hMenuOpen = false;
    UX('window.houseMenu && window.houseMenu(null);');
    CS();
    mp.gui.chat.activate(true);
}
global.houseMenuOpen = function () { return hMenuOpen; };
mp.events.add('house:menu', function (json) { hMenu(JSON.stringify({ t: 'house', d: JSON.parse(json) })); });
mp.events.add('house:hotel', function (json) { hMenu(JSON.stringify({ t: 'hotel', d: JSON.parse(json) })); });
mp.events.add('house:menuClose', hMenuClose);
mp.events.add('cef:house:close', hMenuClose);
mp.events.add('cef:house:act', function (a, id) { mp.events.callRemote('srv:house:act', a, Number(id)); });
mp.events.add('cef:hotel:rent', function (n) { mp.events.callRemote('srv:hotel:rent', Number(n)); });
mp.events.add('cef:house:phone', function () { mp.events.callRemote('srv:house:phone'); });
mp.events.add('cef:house:gps', function (k, id) { mp.events.callRemote('srv:house:gps', k, Number(id)); });
mp.events.add('house:phone', function (json) { UX('window.phoneHouses && window.phoneHouses(' + JSON.stringify(json) + ');'); });
