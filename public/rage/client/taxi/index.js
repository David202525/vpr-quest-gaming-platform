var tPark = null, tBlipPark = null, tGps = null, tDrvBlip = null, tDrvId = -1, tMeter = null;
function tx(c) { if (global.uiExecG) global.uiExecG(c); }
mp.events.add('taxi:park', function (x, y, z) {
    tPark = { x: x, y: y, z: z };
    if (tBlipPark) try { tBlipPark.destroy(); } catch (e) {}
    try { tBlipPark = mp.blips.new(198, new mp.Vector3(x, y, z), { dimension: 4294967295, color: 5, scale: 0.8, shortRange: true, name: 'Таксопарк (аренда такси)' }); } catch (e) {}
});
mp.events.add('render', function () {
    if (!tPark) return;
    var p = mp.players.local.position;
    var dx = p.x - tPark.x, dy = p.y - tPark.y;
    if (dx * dx + dy * dy > 900) return;
    mp.game.graphics.drawMarker(1, tPark.x, tPark.y, tPark.z - 1, 0, 0, 0, 0, 0, 0, 1.4, 1.4, 0.4, 255, 200, 40, 120, false, false, 2, false, null, null, false);
    if (dx * dx + dy * dy < 9) mp.game.graphics.drawText('🚕 Аренда такси — телефон → «Такси»', [tPark.x, tPark.y, tPark.z + 0.4], { font: 4, color: [255, 210, 60, 230], scale: [0.4, 0.4], outline: true, centre: true });
});
mp.events.add('taxi:gps', function (x, y, z, name) {
    if (tGps) { try { tGps.destroy(); } catch (e) {} tGps = null; }
    if (!name) return;
    tGps = mp.blips.new(280, new mp.Vector3(x, y, z), { dimension: 4294967295, color: 5, name: name, shortRange: false });
    try { tGps.setRoute(true); tGps.setRouteColour(5); } catch (e) {}
});
mp.events.add('taxi:drvBlip', function (id) { tDrvId = Number(id); if (tDrvId < 0 && tDrvBlip) { try { tDrvBlip.destroy(); } catch (e) {} tDrvBlip = null; } });
setInterval(function () {
    if (tDrvId < 0) return;
    var d = mp.players.atRemoteId(tDrvId);
    if (!d || !d.handle) return;
    var pos = d.position;
    if (!tDrvBlip) tDrvBlip = mp.blips.new(198, pos, { dimension: 4294967295, color: 5, name: 'Ваше такси', shortRange: false });
    else try { tDrvBlip.setCoords(pos); } catch (e) {}
}, 1000);
mp.events.add('taxi:meter', function (json) { tMeter = json ? JSON.parse(json) : null; tx('window.taxiMeter && window.taxiMeter(' + JSON.stringify(json || '') + ');'); });
mp.events.add('taxi:app', function (json) { tx('window.taxiApp && window.taxiApp(' + JSON.stringify(json) + ');'); });
mp.events.add('taxi:rate', function (json) { var d = JSON.parse(json); mp.events.call('hud:notify', 'ok', 'Оцените водителя ' + d.drv + ': /trate 1-5', 8000); });
mp.events.add('taxi:ping', function () { try { mp.game.audio.playSoundFrontend(-1, 'Text_Arrive_Tone', 'Phone_SoundSet_Default', true); } catch (e) {} });
mp.events.add('taxi:openApp', function () { mp.events.call('cef:ui:open', 'phone'); setTimeout(function () { tx('window.openApp && window.openApp("taxi");'); }, 300); });
['app', 'duty', 'rent', 'rentEnd', 'call', 'accept', 'cancel', 'start', 'finish'].forEach(function (n) {
    mp.events.add('cef:taxi:' + n, function (a, b) { mp.events.callRemote('srv:taxi:' + n, a === undefined ? '' : a, b === undefined ? '' : b); });
});
