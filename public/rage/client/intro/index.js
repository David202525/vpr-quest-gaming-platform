var introBrowser = null;
global.introOpen = false;

function introStop() {
    if (!global.introOpen) return;
    global.introOpen = false;
    if (introBrowser) { try { introBrowser.destroy(); } catch (e) {} introBrowser = null; }
    var p = mp.players.local;
    p.freezePosition(false);
    p.setInvincible(false);
    mp.game.ui.displayRadar(true);
    mp.gui.chat.show(true);
    mp.events.call('hud:show', true);
    mp.game.audio.stopAudioScenes && mp.game.audio.stopAudioScenes();
    if (typeof cursorSync === 'function') cursorSync(); else mp.gui.cursor.show(false, false);
    mp.events.callRemote('srv:intro:done');
}

mp.events.add('intro:play', function (name, fem) {
    if (global.introOpen) return;
    global.introOpen = true;
    var p = mp.players.local;
    p.freezePosition(true);
    p.setInvincible(true);
    mp.game.ui.displayRadar(false);
    mp.gui.chat.show(false);
    mp.events.call('hud:show', false);
    mp.gui.cursor.show(false, false);
    introBrowser = mp.browsers.new('package://cef/intro/index.html');
    setTimeout(function () {
        if (introBrowser) introBrowser.execute('window.introStart && window.introStart(' + JSON.stringify(String(name || '')) + ',' + (Number(fem) ? 'true' : 'false') + ');');
    }, 900);
});
mp.events.add('cef:intro:done', introStop);

function introKey(code) { if (global.introOpen && introBrowser) introBrowser.execute('document.dispatchEvent(new KeyboardEvent("keydown",{key:' + JSON.stringify(code) + '}));'); }
mp.keys.bind(0x20, false, function () { introKey(' '); });
mp.keys.bind(0x0D, false, function () { introKey('Enter'); });
mp.keys.bind(0x1B, false, function () { introKey('Escape'); });

mp.events.add('render', function () {
    if (!global.introOpen) return;
    mp.game.controls.disableAllControlActions(0);
    mp.game.controls.disableAllControlActions(2);
    try { mp.game.invoke('0x719FF505F097FD20'); } catch (e) {}
});
