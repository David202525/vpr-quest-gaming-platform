var ptBr = null, ptOpen = false, ptEd = null, ptKeys = {};
function ptUI(on) {
    if (on && !ptBr) ptBr = mp.browsers.new('package://cef/points/index.html');
    if (!ptBr) return;
    ptBr.active = on; ptOpen = on; global.ptsOpen = on;
    mp.gui.cursor.show(on, on);
    mp.gui.chat.activate(!on);
}
function ptPush(j) {
    var run = function () { if (ptBr) ptBr.execute('window.ptsData && window.ptsData(' + JSON.stringify(j) + ');'); };
    setTimeout(run, 150); setTimeout(run, 700);
}
mp.events.add('pts:open', function (j) { ptUI(true); ptPush(j); });
mp.events.add('pts:data', function (j) { if (ptOpen && ptBr) ptBr.execute('window.ptsData && window.ptsData(' + JSON.stringify(j) + ');'); });
mp.events.add('cef:pts:close', function () { ptUI(false); });
mp.events.add('pts:creators', function (j) { var run = function () { if (ptBr) ptBr.execute('window.ptsMk && window.ptsMk(' + JSON.stringify(j) + ');'); }; setTimeout(run, 200); setTimeout(run, 750); });
mp.events.add('cef:pts:create', function (id, j) { mp.events.callRemote('srv:pts:create', String(id), String(j || '{}')); });
mp.events.add('cef:pts:act', function (a, id) {
    if (a === 'tp' || a === 'edit') ptUI(false);
    mp.events.callRemote('srv:pts:' + a, String(id));
});

mp.events.add('pts:edit', function (j) {
    var d; try { d = JSON.parse(j); } catch (e) { return; }
    ptEd = { i: d.i, n: d.n, x: d.x, y: d.y, z: d.z, h: d.h || 0, o: { x: d.x, y: d.y, z: d.z, h: d.h || 0 } };
    ptKeys = {};
    mp.events.call('hud:notify', 'ok', 'Стрелки — двигать (по камере), PgUp/PgDn — выше/ниже, [ ] — поворот, G — на землю, H — к себе, Shift — быстрее, Ctrl — медленнее, Enter — сохранить, Backspace — отмена', 12000);
});

function ptEnd(save) {
    if (!ptEd) return;
    var e = ptEd; ptEd = null;
    if (save) mp.events.callRemote('srv:pts:save', e.i, JSON.stringify({ x: e.x, y: e.y, z: e.z, h: e.h }));
    else mp.events.call('hud:notify', 'warn', 'Изменение отменено', 2500);
    setTimeout(function () { mp.events.callRemote('srv:pts:list'); }, 400);
}
function edge(k) { var d = mp.keys.isDown(k); var was = ptKeys[k]; ptKeys[k] = d; return d && !was; }

mp.events.add('render', function () {
    if (!ptEd) return;
    if (mp.players.local.isTypingInTextChat || mp.gui.cursor.visible) return;
    [172, 173, 174, 175, 27, 10, 11, 39, 40, 81, 82, 99, 100, 14, 15, 16, 17, 241, 242, 47].forEach(function (c) { mp.game.controls.disableControlAction(0, c, true); });
    var fast = mp.keys.isDown(0x10), slow = mp.keys.isDown(0x11);
    var st = (fast ? 0.12 : slow ? 0.005 : 0.03), rs = (fast ? 4 : slow ? 0.25 : 1.2);
    var cr = mp.game.cam.getGameplayCamRot(2), a = cr.z * Math.PI / 180;
    var fx = -Math.sin(a), fy = Math.cos(a), rx = Math.cos(a), ry = Math.sin(a);
    if (mp.keys.isDown(0x26)) { ptEd.x += fx * st; ptEd.y += fy * st; }
    if (mp.keys.isDown(0x28)) { ptEd.x -= fx * st; ptEd.y -= fy * st; }
    if (mp.keys.isDown(0x27)) { ptEd.x += rx * st; ptEd.y += ry * st; }
    if (mp.keys.isDown(0x25)) { ptEd.x -= rx * st; ptEd.y -= ry * st; }
    if (mp.keys.isDown(0x21)) ptEd.z += st * 0.6;
    if (mp.keys.isDown(0x22)) ptEd.z -= st * 0.6;
    if (mp.keys.isDown(0xDB)) ptEd.h = (ptEd.h + rs + 360) % 360;
    if (mp.keys.isDown(0xDD)) ptEd.h = (ptEd.h - rs + 360) % 360;
    if (edge(0x47)) {
        var g = mp.game.gameplay.getGroundZFor3dCoord(ptEd.x, ptEd.y, ptEd.z + 2, 0, false);
        if (typeof g === 'number' && g > -200 && Math.abs(g - ptEd.z) < 10) ptEd.z = g + 1.0;
    }
    if (edge(0x48)) { var me = mp.players.local.position; ptEd.x = me.x; ptEd.y = me.y; ptEd.z = me.z; ptEd.h = mp.players.local.getHeading(); }
    if (edge(0x0D)) return ptEnd(true);
    if (edge(0x08)) return ptEnd(false);

    var e = ptEd, hr = e.h * Math.PI / 180;
    mp.game.graphics.drawMarker(1, e.o.x, e.o.y, e.o.z - 1, 0, 0, 0, 0, 0, 0, 0.9, 0.9, 0.3, 255, 255, 255, 50, false, false, 2, false, null, null, false);
    mp.game.graphics.drawMarker(1, e.x, e.y, e.z - 1, 0, 0, 0, 0, 0, 0, 1.0, 1.0, 0.4, 255, 160, 40, 150, false, false, 2, false, null, null, false);
    mp.game.graphics.drawMarker(2, e.x, e.y, e.z + 0.9, 0, 0, 0, 180, 0, 0, 0.4, 0.4, 0.4, 255, 160, 40, 220, true, false, 2, false, null, null, false);
    mp.game.graphics.drawLine(e.x, e.y, e.z - 0.9, e.x, e.y, e.z + 1.2, 255, 160, 40, 255);
    mp.game.graphics.drawLine(e.x, e.y, e.z - 0.8, e.x - Math.sin(hr) * 1.3, e.y + Math.cos(hr) * 1.3, e.z - 0.8, 80, 200, 255, 255);
    mp.game.graphics.drawText(e.n + '\n' + e.x.toFixed(2) + ', ' + e.y.toFixed(2) + ', ' + e.z.toFixed(2) + ' · ' + Math.round(e.h) + '°', [e.x, e.y, e.z + 1.5], { font: 4, color: [255, 220, 150, 255], scale: [0.38, 0.38], outline: true, centre: true });
    mp.game.graphics.drawText('РЕДАКТОР МЕТКИ · стрелки / PgUp PgDn / [ ] · G — на землю · H — к себе · Enter — сохранить · Backspace — отмена', [0.5, 0.93], { font: 4, color: [255, 200, 120, 240], scale: [0.4, 0.4], outline: true, centre: true });
});
