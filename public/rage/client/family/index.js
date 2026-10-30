var fBr = null, fOpen = false, fNpc = null, fNear = false, fHint = false;
var fHouses = [], fHNear = null, fHHint = 0, fBlips = {};
var fGar = [], fGNear = null, fGHint = 0, fIn = null, fInHint = '';
var GI = { walk: [240.6, -1004.8, -99.0], drive: [228.6, -1004.2, -99.0] };
function fUI(on, code) {
    if (on && !fBr) fBr = mp.browsers.new('package://cef/family/index.html');
    if (!fBr) return;
    fBr.active = on; fOpen = on; global.famOpen = on;
    mp.gui.cursor.show(on, on);
    mp.gui.chat.activate(!on);
    if (!on) mp.events.callRemote('srv:fam:closed');
    if (on && code) { var run = function () { if (fBr) fBr.execute(code); }; setTimeout(run, 120); setTimeout(run, 600); }
}
global.famMenuOpen = function () { return fOpen; };
mp.events.add('fam:npc', function (j) { try { fNpc = JSON.parse(j); } catch (e) { fNpc = null; } });
mp.events.add('fam:open', function (j) {
    var code = 'window.fam && window.fam(' + JSON.stringify(j) + ');';
    if (fOpen && fBr) fBr.execute(code); else fUI(true, code);
});
mp.events.add('fam:close', function () { if (fOpen) fUI(false); });
mp.events.add('fam:msg', function (t, ok) { if (fBr) fBr.execute('window.famMsg && window.famMsg(' + JSON.stringify(String(t)) + ',' + (ok ? 1 : 0) + ');'); });
mp.events.add('cef:fam:close', function () { fUI(false); });
mp.events.add('cef:fam:create', function (j) { mp.events.callRemote('srv:fam:create', String(j)); });
var fGarBlips = [];
mp.events.add('fam:garages', function (j) {
    try { fGar = JSON.parse(j) || []; } catch (e) { fGar = []; }
    fGarBlips.forEach(function (b) { try { b.destroy(); } catch (e) {} });
    fGarBlips = fGar.map(function (g) { try { return mp.blips.new(357, new mp.Vector3(g[1], g[2], g[3]), { name: 'Гараж семьи (' + g[4] + ' мест)', color: 3, shortRange: true, scale: 0.8, dimension: 0 }); } catch (e) { return null; } });
});
mp.events.add('fam:extra', function (j) { if (fBr) fBr.execute('window.famExtra && window.famExtra(' + JSON.stringify(j) + ');'); });
mp.events.add('fam:tabgo', function (t) { var code = 'window.famTab && window.famTab(' + JSON.stringify(String(t)) + ');'; if (fBr) { fBr.execute(code); setTimeout(function () { if (fBr) fBr.execute(code); }, 700); } });
mp.events.add('cef:fam:act', function (a, j) { mp.events.callRemote('srv:fam:act', String(a), String(j || '{}')); });

mp.events.add('fam:houses', function (j) {
    try { fHouses = JSON.parse(j) || []; } catch (e) { fHouses = []; }
    Object.keys(fBlips).forEach(function (k) { try { fBlips[k].destroy(); } catch (e) {} });
    fBlips = {};
    fHouses.forEach(function (h) {
        try { fBlips[h[0]] = mp.blips.new(h[5] ? 437 : 350, new mp.Vector3(h[2], h[3], h[4]), { name: h[5] ? 'Особняк семьи ' + h[7] : 'Семейный особняк (продаётся)', color: h[5] ? 46 : 2, shortRange: true, scale: 0.8 }); } catch (e) {}
    });
});

function busy() { var v = mp.players.local.vehicle; if (v && (fGNear || fIn) && !fOpen && !mp.gui.cursor.visible) return false; return fOpen || global.crimeOpen || global.chatOpen || mp.gui.cursor.visible || mp.players.local.isTypingInTextChat; }
setInterval(function () {
    var me = mp.players.local, pos = me.position, n = false, hn = null;
    var gn = null; fIn = null;
    fGar.forEach(function (g) {
        if (me.dimension !== g[5]) return;
        if (me.vehicle) fIn = mp.game.system.vdist(pos.x, pos.y, pos.z, GI.drive[0], GI.drive[1], GI.drive[2]) < 5 ? { g: g, k: 'out' } : { g: g, k: 'park' };
        else if (mp.game.system.vdist(pos.x, pos.y, pos.z, GI.walk[0], GI.walk[1], GI.walk[2]) < 2.5) fIn = { g: g, k: 'out' };
    });
    var ih = fIn ? (fIn.k === 'park' ? '' : me.vehicle ? 'E — выехать из гаража' : 'E — выйти на улицу') : '';
    if (ih && ih !== fInHint) mp.events.call('hud:notify', 'ok', ih, 2500);
    fInHint = ih;
    if (me.dimension === 0) fGar.forEach(function (g) { if (me.dimension === 0 && mp.game.system.vdist(pos.x, pos.y, pos.z, g[1], g[2], g[3]) < (me.vehicle ? 5 : 2.5)) gn = g; });
    if (gn && fGHint !== gn[0]) mp.events.call('hud:notify', 'ok', me.vehicle ? 'E — заехать в гараж семьи' : 'E — войти в гараж семьи (' + gn[4] + ' мест)', 2500);
    fGHint = gn ? gn[0] : 0; fGNear = gn;
    if (!me.vehicle) {
        if (fNpc && me.dimension === fNpc.d) n = mp.game.system.vdist(pos.x, pos.y, pos.z, fNpc.p[0], fNpc.p[1], fNpc.p[2]) < 2.3;
        if (me.dimension === 0) fHouses.forEach(function (h) { if (mp.game.system.vdist(pos.x, pos.y, pos.z, h[2], h[3], h[4]) < 2.2) hn = h; });
    }
    if (n && !fHint) mp.events.call('hud:notify', 'ok', 'E — регистрация семьи', 2500);
    fHint = n; fNear = n;
    if (hn && fHHint !== hn[0]) mp.events.call('hud:notify', 'ok', 'E — ' + hn[1] + (hn[5] ? ' [' + hn[5] + ']' : ' (продаётся)'), 2500);
    fHHint = hn ? hn[0] : 0; fHNear = hn;
}, 400);
mp.events.add('render', function () {
    var me = mp.players.local, pos = me.position;
    if (fNpc && me.dimension === fNpc.d) {
        var c = fNpc.p;
        if (mp.game.system.vdist(pos.x, pos.y, pos.z, c[0], c[1], c[2]) < 8) mp.game.graphics.drawText('Регистрация организаций', [c[0], c[1], c[2] + 1.15], { font: 4, color: [120, 200, 255, 235], scale: [0.4, 0.4], outline: true, centre: true });
    }
    fGar.forEach(function (g) {
        if (me.dimension !== g[5]) return;
        mp.game.graphics.drawMarker(1, GI.walk[0], GI.walk[1], GI.walk[2] - 1, 0, 0, 0, 0, 0, 0, 1.0, 1.0, 0.35, 255, 255, 255, 110, false, false, 2, false, null, null, false);
        mp.game.graphics.drawMarker(1, GI.drive[0], GI.drive[1], GI.drive[2] - 1, 0, 0, 0, 0, 0, 0, 4.0, 4.0, 0.5, 80, 170, 255, 90, false, false, 2, false, null, null, false);
        if (me.vehicle && mp.game.system.vdist(pos.x, pos.y, pos.z, GI.drive[0], GI.drive[1], GI.drive[2]) < 12) mp.game.graphics.drawText('Выезд · E', [GI.drive[0], GI.drive[1], GI.drive[2] + 1.2], { font: 4, color: [160, 210, 255, 230], scale: [0.38, 0.38], outline: true, centre: true });
        if (me.vehicle && !(fIn && fIn.k === 'out')) mp.game.graphics.drawText('E — поставить машину на свободное место', [0.5, 0.9], { font: 4, color: [255, 255, 255, 200], scale: [0.36, 0.36], outline: true, centre: true });
    });
    if (me.dimension !== 0) return;
    fGar.forEach(function (g) {
        var gx = pos.x - g[1], gy = pos.y - g[2], g2 = gx * gx + gy * gy;
        if (g2 > 2500) return;
        mp.game.graphics.drawMarker(36, g[1], g[2], g[3] + 0.6, 0, 0, 0, 0, 0, 0, 1.2, 1.2, 1.2, 80, 170, 255, 190, true, true, 2, false, null, null, false);
        mp.game.graphics.drawMarker(1, g[1], g[2], g[3] - 1, 0, 0, 0, 0, 0, 0, 4.0, 4.0, 0.4, 80, 170, 255, 70, false, false, 2, false, null, null, false);
        if (g2 < 100) mp.game.graphics.drawText('Гараж семьи · ' + g[4] + ' мест', [g[1], g[2], g[3] + 1.6], { font: 4, color: [160, 210, 255, 230], scale: [0.36, 0.36], outline: true, centre: true });
    });
    fHouses.forEach(function (h) {
        var dx = pos.x - h[2], dy = pos.y - h[3], d2 = dx * dx + dy * dy;
        if (d2 > 900) return;
        var col = h[5] ? [210, 170, 60] : [90, 200, 90];
        mp.game.graphics.drawMarker(1, h[2], h[3], h[4] - 1, 0, 0, 0, 0, 0, 0, 1.2, 1.2, 0.4, col[0], col[1], col[2], 120, false, false, 2, false, null, null, false);
        if (d2 < 64) mp.game.graphics.drawText(h[1] + (h[5] ? '\n~y~[' + h[5] + '] ' + h[7] : '\n~g~Продаётся за репутацию семьи'), [h[2], h[3], h[4] + 1.1], { font: 4, color: [255, 255, 255, 230], scale: [0.36, 0.36], outline: true, centre: true });
    });
});
mp.keys.bind(0x45, false, function () {
    if (busy()) return;
    if (fNear) return mp.events.callRemote('srv:fam:open');
    if (fIn) return fIn.k === 'park' ? mp.events.callRemote('srv:fam:park') : mp.events.callRemote('srv:fam:garage', fIn.g[0]);
    if (fGNear) return mp.events.callRemote('srv:fam:garage', fGNear[0]);
    if (fHNear) mp.events.callRemote('srv:fhouse:door', fHNear[0]);
});
mp.keys.bind(0x4F, false, function () {
    if (fOpen) return fUI(false);
    if (busy()) return;
    mp.events.callRemote('srv:fam:tab');
});
mp.keys.bind(0x1B, false, function () { if (fOpen) fUI(false); });
