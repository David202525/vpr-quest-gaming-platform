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
    ['ex_dt1_11_office_01b', 'ex_dt1_11_office_01c', 'ex_dt1_11_office_02a', 'ex_dt1_11_office_02b', 'ex_dt1_11_office_02c', 'ex_dt1_11_office_03a', 'ex_dt1_11_office_03b', 'ex_dt1_11_office_03c'].forEach(function (n) { try { mp.game.streaming.removeIpl(n); } catch (e) {} });
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
        if (h[4] === 0) return;
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
    if (best) hint = best.k === 'house' ? (best.st === 2 ? 'E — мой дом' : best.st === 1 ? 'E — дверь (занято)' : 'E — дом (покупка в агентстве недвижимости)') : best.k === 'hotel' ? 'E — гостиница' : best.k === 'fac' ? 'E — войти: ' + best.n : 'E — выйти на улицу';
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
    if (global.powerOpen || global.licUiOpen) return;
    if (hNear.k === 'house' && global.jobHere && global.jobHere()) return;
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

var realtyPt = null, realtyBlip = null, realtyNear = false, realtyOpen = false;
mp.events.add('realty:pt', function (x, y, z) {
    realtyPt = { x: x, y: y, z: z };
    if (realtyBlip) { try { realtyBlip.destroy(); } catch (e) {} }
    try { realtyBlip = mp.blips.new(374, new mp.Vector3(x, y, z), { dimension: 4294967295, name: 'Агентство недвижимости', color: 5, scale: 0.85, shortRange: true }); } catch (e) {}
});
setInterval(function () {
    var me = mp.players.local, pos = me.position;
    var n = !!(realtyPt && me.dimension === 0 && !me.vehicle && mp.game.system.vdist(pos.x, pos.y, pos.z, realtyPt.x, realtyPt.y, realtyPt.z) < 2.2);
    if (n && !realtyNear) mp.events.call('hud:notify', 'ok', 'E — агентство недвижимости (покупка жилья и аукционы)', 3500);
    realtyNear = n;
}, 400);
mp.events.add('render', function () {
    if (!realtyPt || mp.players.local.dimension !== 0) return;
    var pos = mp.players.local.position, dx = pos.x - realtyPt.x, dy = pos.y - realtyPt.y;
    if (dx * dx + dy * dy > 900) return;
    mp.game.graphics.drawMarker(1, realtyPt.x, realtyPt.y, realtyPt.z - 1, 0, 0, 0, 0, 0, 0, 1.2, 1.2, 0.4, 255, 196, 0, 120, false, false, 2, false, null, null, false);
    mp.game.graphics.drawMarker(29, realtyPt.x, realtyPt.y, realtyPt.z + 0.4, 0, 0, 0, 0, 0, 0, 0.6, 0.6, 0.6, 255, 196, 0, 200, true, true, 2, false, null, null, false);
});
mp.keys.bind(0x45, false, function () {
    if (!realtyNear || realtyOpen || hBusy() || mp.players.local.vehicle) return;
    mp.events.callRemote('srv:realty:open');
});
mp.events.add('realty:open', function (json) {
    UX('window.realtyMenu && window.realtyMenu(' + JSON.stringify(json) + ');');
    if (!realtyOpen) { realtyOpen = true; hMenuOpen = true; mp.gui.cursor.show(true, true); mp.gui.chat.activate(false); }
});
function realtyClose() {
    if (!realtyOpen) return;
    realtyOpen = false; hMenuOpen = false;
    UX('window.realtyMenu && window.realtyMenu(null);');
    CS();
    mp.gui.chat.activate(true);
}
mp.events.add('cef:realty:close', realtyClose);
mp.events.add('cef:realty:act', function (a, b, c, d, e) { mp.events.callRemote('srv:realty:act', String(a), String(b || ''), String(c || ''), String(d || ''), Number(e) || 0); });
mp.events.add('cef:realty:gps', function () { mp.events.callRemote('srv:realty:gps'); });
setInterval(function () {
    if (realtyOpen && realtyPt) {
        var pos = mp.players.local.position;
        if (mp.game.system.vdist(pos.x, pos.y, pos.z, realtyPt.x, realtyPt.y, realtyPt.z) > 5) realtyClose();
    }
}, 1000);
