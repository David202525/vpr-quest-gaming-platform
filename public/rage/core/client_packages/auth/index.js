var authBrowser = null;
var authCam = null;
global.authOpen = false;

var SPAWN = { x: -1035.7, y: -2731.8, z: 13.7, heading: 0 };

function placeCam() {
    var p = mp.players.local;
    var pos = p.position;
    if (!pos || Math.abs(pos.x - SPAWN.x) > 50 || Math.abs(pos.y - SPAWN.y) > 50) pos = new mp.Vector3(SPAWN.x, SPAWN.y, SPAWN.z);
    var h = (p.getHeading() || SPAWN.heading) * Math.PI / 180;
    var fx = -Math.sin(h), fy = Math.cos(h);
    var rx = -Math.cos(h), ry = -Math.sin(h);
    var cx = pos.x + fx * 3.2 + rx * 1.3;
    var cy = pos.y + fy * 3.2 + ry * 1.3;
    if (!authCam) authCam = mp.cameras.new('authCam', new mp.Vector3(cx, cy, pos.z + 0.6), new mp.Vector3(0, 0, 0), 45);
    authCam.setCoord(cx, cy, pos.z + 0.6);
    authCam.pointAtCoord(pos.x + rx * 1.3, pos.y + ry * 1.3, pos.z + 0.3);
    authCam.setActive(true);
    mp.game.cam.renderScriptCams(true, false, 0, true, false);
}

mp.events.add('auth:show', function (social) {
    if (authBrowser) return;
    global.authOpen = true;
    authBrowser = mp.browsers.new('package://cef/auth/index.html');
    mp.players.local.freezePosition(true);
    mp.game.ui.displayRadar(false);
    mp.gui.chat.show(false);
    mp.events.call('hud:show', false);
    mp.gui.cursor.show(true, true);
    placeCam();
    setTimeout(function () { if (global.authOpen) placeCam(); }, 1000);
    setTimeout(function () { if (global.authOpen) placeCam(); }, 2500);
    setTimeout(function () {
        if (authBrowser) authBrowser.execute('window.authInit && window.authInit(' + JSON.stringify(social || '') + ');');
    }, 700);
});

mp.events.add('auth:error', function (text) {
    if (authBrowser) authBrowser.execute('window.authError && window.authError(' + JSON.stringify(text) + ');');
});

mp.events.add('auth:hide', function () {
    if (!authBrowser) return;
    authBrowser.destroy();
    authBrowser = null;
    if (authCam) { authCam.setActive(false); authCam.destroy(); authCam = null; }
    mp.game.cam.renderScriptCams(false, false, 0, true, false);
    mp.players.local.freezePosition(false);
    mp.game.ui.displayRadar(true);
    mp.gui.chat.show(true);
    mp.events.call('hud:show', true);
    global.authOpen = false;
    mp.gui.cursor.show(false, false);
});

mp.events.add('cef:auth:login', function (login, pass) { mp.events.callRemote('auth:login', login, pass); });
mp.events.add('cef:auth:register', function (login, pass) { mp.events.callRemote('auth:register', login, pass); });

mp.events.add('render', function () {
    if (!global.authOpen) return;
    mp.game.controls.disableAllControlActions(0);
    mp.game.controls.disableAllControlActions(2);
    if (!mp.gui.cursor.visible) mp.gui.cursor.show(true, true);
});
