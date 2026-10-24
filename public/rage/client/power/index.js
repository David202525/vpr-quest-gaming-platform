var pBr = null, pOpen = false, rentPt = null, rentHint = false;
function pUI(on, code) {
    if (on && !pBr) pBr = mp.browsers.new('package://cef/power/index.html');
    if (!pBr) return;
    pBr.active = on; pOpen = on; global.powerOpen = on;
    mp.gui.cursor.show(on, on);
    mp.gui.chat.activate(!on);
    if (on && code) { var run = function () { if (pBr) pBr.execute(code); }; setTimeout(run, 120); setTimeout(run, 600); }
}
mp.events.add('power:open', function (j) {
    if (global.houseMenuOpen && global.houseMenuOpen()) mp.events.call('house:menuClose'); pUI(true, 'window.powerOpen && window.powerOpen(' + JSON.stringify(j) + ');'); });
mp.events.add('power:close', function () { if (pOpen) pUI(false); });
mp.events.add('power:hint', function (i, r, left) { if (pBr) pBr.execute('window.powerHint && window.powerHint(' + Number(i) + ',' + Number(r) + ',' + Number(left) + ');'); });
mp.events.add('cef:power:done', function (j, moves) { pUI(false); mp.events.callRemote('srv:power:done', j, Number(moves) || 0); });
mp.events.add('cef:power:fail', function () { pUI(false); mp.events.callRemote('srv:power:fail'); });
mp.events.add('cef:power:cancel', function () { pUI(false); mp.events.callRemote('srv:power:cancel'); });
mp.events.add('cef:power:hint', function (j) { mp.events.callRemote('srv:power:hint', j); });

var rentBlip = null;
mp.events.add('rent:point', function (x, y, z) {
    rentPt = [x, y, z];
    try { if (rentBlip) rentBlip.destroy(); } catch (e) {}
    try { rentBlip = mp.blips.new(512, new mp.Vector3(x, y, z), { dimension: 4294967295, color: 3, name: 'Прокат скутеров', shortRange: true, scale: 0.85 }); } catch (e) {}
});
function nearRent() {
    if (!rentPt) return false;
    var p = mp.players.local.position;
    return !mp.players.local.vehicle && mp.game.system.vdist(p.x, p.y, p.z, rentPt[0], rentPt[1], rentPt[2]) < 2.2;
}
setInterval(function () {
    var n = nearRent();
    if (n && !rentHint) mp.events.call('hud:notify', 'ok', 'Прокат скутеров: нажмите E', 3000);
    rentHint = n;
}, 400);
mp.keys.bind(0x45, false, function () {
    if (pOpen || (global.jobHere && global.jobHere()) || !nearRent() || mp.players.local.isTypingInTextChat || mp.gui.cursor.visible) return;
    mp.events.callRemote('srv:rent:use');
});
mp.events.add('render', function () {
    if (!rentPt) return;
    var p = mp.players.local.position, dx = p.x - rentPt[0], dy = p.y - rentPt[1];
    if (dx * dx + dy * dy > 900) return;
    mp.game.graphics.drawMarker(1, rentPt[0], rentPt[1], rentPt[2] - 1, 0, 0, 0, 0, 0, 0, 1.3, 1.3, 0.4, 80, 200, 255, 120, false, false, 2, false, null, null, false);
    mp.game.graphics.drawText('🛵 Прокат скутеров · $50 / 30 мин', [rentPt[0], rentPt[1], rentPt[2] + 1.1], { font: 4, color: [255, 255, 255, 230], scale: [0.4, 0.4], outline: true, centre: true });
});
