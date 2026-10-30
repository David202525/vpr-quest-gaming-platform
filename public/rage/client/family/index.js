var fBr = null, fOpen = false, fNpc = null, fNear = false, fHint = false;
var fHouses = [], fHNear = null, fHHint = 0, fBlips = {};
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
mp.events.add('cef:fam:act', function (a, j) { mp.events.callRemote('srv:fam:act', String(a), String(j || '{}')); });

mp.events.add('fam:houses', function (j) {
    try { fHouses = JSON.parse(j) || []; } catch (e) { fHouses = []; }
    Object.keys(fBlips).forEach(function (k) { try { fBlips[k].destroy(); } catch (e) {} });
    fBlips = {};
    fHouses.forEach(function (h) {
        try { fBlips[h[0]] = mp.blips.new(h[5] ? 437 : 350, new mp.Vector3(h[2], h[3], h[4]), { name: h[5] ? 'Особняк семьи ' + h[7] : 'Семейный особняк (продаётся)', color: h[5] ? 46 : 2, shortRange: true, scale: 0.8 }); } catch (e) {}
    });
});

function busy() { return fOpen || global.crimeOpen || global.chatOpen || mp.gui.cursor.visible || mp.players.local.isTypingInTextChat; }
setInterval(function () {
    var me = mp.players.local, pos = me.position, n = false, hn = null;
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
        mp.game.graphics.drawText('Регистрация организаций', [c[0], c[1], c[2] + 1.15], { font: 4, color: [120, 200, 255, 235], scale: [0.4, 0.4], outline: true, centre: true });
    }
    if (me.dimension !== 0) return;
    fHouses.forEach(function (h) {
        var dx = pos.x - h[2], dy = pos.y - h[3], d2 = dx * dx + dy * dy;
        if (d2 > 900) return;
        var col = h[5] ? [210, 170, 60] : [90, 200, 90];
        mp.game.graphics.drawMarker(1, h[2], h[3], h[4] - 1, 0, 0, 0, 0, 0, 0, 1.2, 1.2, 0.4, col[0], col[1], col[2], 120, false, false, 2, false, null, null, false);
        if (d2 < 225) mp.game.graphics.drawText(h[1] + (h[5] ? '\n~y~[' + h[5] + '] ' + h[7] : '\n~g~Продаётся за репутацию семьи'), [h[2], h[3], h[4] + 1.1], { font: 4, color: [255, 255, 255, 230], scale: [0.36, 0.36], outline: true, centre: true });
    });
});
mp.keys.bind(0x45, false, function () {
    if (busy()) return;
    if (fNear) return mp.events.callRemote('srv:fam:open');
    if (fHNear) mp.events.callRemote('srv:fhouse:door', fHNear[0]);
});
mp.keys.bind(0x4F, false, function () {
    if (fOpen) return fUI(false);
    if (busy()) return;
    mp.events.callRemote('srv:fam:tab');
});
mp.keys.bind(0x1B, false, function () { if (fOpen) fUI(false); });
