var DL_PTS = [], dlBlips = [], dlNear = null, dlHint = 0, dlBr = null, dlOpen = false;

mp.events.add('dealer:points', function (j) {
    try { DL_PTS = JSON.parse(j) || []; } catch (e) { DL_PTS = []; }
    dlBlips.forEach(function (b) { try { b.destroy(); } catch (e) {} });
    dlBlips = DL_PTS.map(function (s) {
        try { return mp.blips.new(225, new mp.Vector3(s[2], s[3], s[4]), { dimension: 0, color: 3, name: 'Автосалон: ' + s[1], shortRange: true, scale: 0.85 }); } catch (e) { return null; }
    }).filter(Boolean);
});

setInterval(function () {
    var me = mp.players.local, pos = me.position, best = null;
    if (!me.vehicle) for (var i = 0; i < DL_PTS.length; i++) {
        var s = DL_PTS[i];
        if (mp.game.system.vdist(pos.x, pos.y, pos.z, s[2], s[3], s[4]) < 2.5) { best = s; break; }
    }
    if (best && (!dlNear || dlNear[0] !== best[0]) && Date.now() - dlHint > 4000) { dlHint = Date.now(); mp.events.call('hud:notify', 'ok', best[1] + ': нажмите E, чтобы посмотреть машины', 3500); }
    dlNear = best;
    if (dlOpen && !best) dlUI(false);
}, 400);

mp.events.add('render', function () {
    var pos = mp.players.local.position;
    for (var i = 0; i < DL_PTS.length; i++) {
        var s = DL_PTS[i];
        if (Math.abs(pos.x - s[2]) > 40 || Math.abs(pos.y - s[3]) > 40) continue;
        mp.game.graphics.drawMarker(36, s[2], s[3], s[4], 0, 0, 0, 0, 0, 0, 0.9, 0.9, 0.9, 80, 170, 255, 170, true, true, 2, false, null, null, false);
    }
});

function dlUI(on, code) {
    if (on && !dlBr) dlBr = mp.browsers.new('package://cef/dealer/index.html');
    if (!dlBr) return;
    dlBr.active = on;
    dlOpen = on;
    global.dealerOpen = on;
    if (on) mp.gui.cursor.show(true, true);
    else if (global.cursorSyncG) global.cursorSyncG(); else mp.gui.cursor.show(false, false);
    mp.gui.chat.activate(!on);
    if (on && code) { var run = function () { if (dlBr) dlBr.execute(code); }; run(); setTimeout(run, 200); setTimeout(run, 700); }
}

mp.keys.bind(0x45, false, function () {
    if (!dlNear || dlOpen || mp.players.local.isTypingInTextChat || mp.gui.cursor.visible) return;
    mp.events.callRemote('srv:dealer:open', dlNear[0]);
});
mp.events.add('dealer:open', function (j) {
    if (dlOpen && dlBr) { dlBr.execute('window.dealerShow && window.dealerShow(' + JSON.stringify(j) + ');'); return; }
    dlUI(true, 'window.dealerShow && window.dealerShow(' + JSON.stringify(j) + ');');
});
mp.events.add('dealer:close', function () { dlUI(false); });
mp.events.add('cef:dealer:close', function () { dlUI(false); });
mp.events.add('cef:dealer:buy', function (id, i, pay) { mp.events.callRemote('srv:dealer:buy', Number(id), Number(i), String(pay)); });
