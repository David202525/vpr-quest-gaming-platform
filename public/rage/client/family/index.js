var fBr = null, fOpen = false, fNpc = null, fNear = false, fHint = false;
function fUI(on, code) {
    if (on && !fBr) fBr = mp.browsers.new('package://cef/family/index.html');
    if (!fBr) return;
    fBr.active = on; fOpen = on; global.famOpen = on;
    mp.gui.cursor.show(on, on);
    mp.gui.chat.activate(!on);
    if (on && code) { var run = function () { if (fBr) fBr.execute(code); }; setTimeout(run, 120); setTimeout(run, 600); }
}
mp.events.add('fam:npc', function (j) { try { fNpc = JSON.parse(j); } catch (e) { fNpc = null; } });
mp.events.add('fam:open', function (j) {
    var code = 'window.fam && window.fam(' + JSON.stringify(j) + ');';
    if (fOpen && fBr) fBr.execute(code); else fUI(true, code);
});
mp.events.add('fam:msg', function (t, ok) { if (fBr) fBr.execute('window.famMsg && window.famMsg(' + JSON.stringify(String(t)) + ',' + (ok ? 1 : 0) + ');'); });
mp.events.add('cef:fam:close', function () { fUI(false); });
mp.events.add('cef:fam:create', function (j) { mp.events.callRemote('srv:fam:create', String(j)); });
mp.events.add('cef:fam:act', function (a, id) { mp.events.callRemote('srv:fam:act', String(a), Number(id) || 0); });

setInterval(function () {
    var me = mp.players.local, n = false;
    if (fNpc && me.dimension === fNpc.d && !me.vehicle) {
        var c = fNpc.p, pos = me.position;
        n = mp.game.system.vdist(pos.x, pos.y, pos.z, c[0], c[1], c[2]) < 2.3;
    }
    if (n && !fHint) mp.events.call('hud:notify', 'ok', 'E — регистрация семьи', 2500);
    fHint = n; fNear = n;
}, 400);
mp.events.add('render', function () {
    var me = mp.players.local;
    if (!fNpc || me.dimension !== fNpc.d) return;
    var c = fNpc.p;
    mp.game.graphics.drawText('Регистрация организаций', [c[0], c[1], c[2] + 1.15], { font: 4, color: [120, 200, 255, 235], scale: [0.4, 0.4], outline: true, centre: true });
});
mp.keys.bind(0x45, false, function () {
    if (!fNear || fOpen || global.crimeOpen || global.chatOpen || mp.gui.cursor.visible) return;
    mp.events.callRemote('srv:fam:open');
});
mp.keys.bind(0x1B, false, function () { if (fOpen) fUI(false); });
