var authBrowser = null;
var authCam = null;
global.authOpen = false;

mp.events.add('auth:show', function (social) {
    if (authBrowser) return;
    global.authOpen = true;
    authBrowser = mp.browsers.new('package://cef/auth/index.html');
    authCam = mp.cameras.new('authCam', new mp.Vector3(-1355, -1380, 140), new mp.Vector3(-10, 0, 300), 50);
    authCam.setActive(true);
    mp.game.cam.renderScriptCams(true, false, 0, true, false);
    mp.players.local.freezePosition(true);
    mp.game.ui.displayRadar(false);
    mp.gui.chat.show(false);
    mp.events.call('hud:show', false);
    mp.gui.cursor.show(true, true);
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
    mp.gui.cursor.show(false, false);
    global.authOpen = false;
});

mp.events.add('cef:auth:login', function (login, pass) { mp.events.callRemote('auth:login', login, pass); });
mp.events.add('cef:auth:register', function (login, pass) { mp.events.callRemote('auth:register', login, pass); });

mp.events.add('render', function () {
    if (!global.authOpen) return;
    mp.game.controls.disableAllControlActions(0);
});
