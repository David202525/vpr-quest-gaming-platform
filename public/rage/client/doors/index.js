var DOORS = [];
var dNear = null, dHint = '';
function dApply(d) { try { mp.game.object.doorControl(d[1], d[2], d[3], d[4], !!d[5], 0, 0, 0); } catch (e) {} }
mp.events.add('doors:all', function (json) {
    try { DOORS = JSON.parse(json) || []; } catch (e) { DOORS = []; }
    DOORS.forEach(dApply);
});
mp.events.add('doors:set', function (i, l) {
    var d = DOORS.find(function (x) { return x[0] === Number(i); });
    if (!d) return;
    d[5] = Number(l);
    dApply(d);
    try { mp.game.audio.playSoundFrontend(-1, Number(l) ? 'LOCK_DOOR' : 'UNLOCK_DOOR', 'HUD_FRONTEND_DEFAULT_SOUNDSET', true); } catch (e) {}
});
mp.events.add('doors:unlockOne', function (m, x, y, z) { try { mp.game.object.doorControl(Number(m), Number(x), Number(y), Number(z), false, 0, 0, 0); } catch (e) {} });
setInterval(function () { DOORS.forEach(dApply); }, 5000);
setInterval(function () {
    var me = mp.players.local, pos = me.position, best = null, bd = 2.2;
    if (!me.vehicle) DOORS.forEach(function (d) { var r = mp.game.system.vdist(pos.x, pos.y, pos.z, d[2], d[3], d[4]); if (r < bd) { bd = r; best = d; } });
    dNear = best;
    var h = best ? best[0] + ':' + best[5] : '';
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
mp.events.add('doors:scan', function () {
    var me = mp.players.local, pos = me.position;
    var h = me.getHeading() * Math.PI / 180;
    var to = new mp.Vector3(pos.x - Math.sin(h) * 2.5, pos.y + Math.cos(h) * 2.5, pos.z + 0.2);
    var r = null;
    try { r = mp.raycasting.testPointToPoint(new mp.Vector3(pos.x, pos.y, pos.z + 0.2), to, me, 16); } catch (e) {}
    var ent = r && r.entity;
    var hnd = typeof ent === 'number' ? ent : ent && ent.handle;
    if (!hnd) return mp.events.callRemote('srv:door:found', 0, 0, 0, 0);
    var m = 0, c = r.position;
    try { m = mp.game.entity.getModel ? mp.game.entity.getModel(hnd) : mp.game.invoke('0x9F47B058362C84B5', hnd); } catch (e) { try { m = mp.game.invoke('0x9F47B058362C84B5', hnd); } catch (e2) {} }
    try { var cc = mp.game.entity.getCoords ? mp.game.entity.getCoords(hnd, true) : null; if (cc) c = cc; } catch (e) {}
    mp.events.callRemote('srv:door:found', m, c.x, c.y, c.z);
});
