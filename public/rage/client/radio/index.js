var rState = null, rPanel = false, rTx = false, rTalker = '', rTalkAt = 0;
function RX(c) { if (global.uiExecG) global.uiExecG(c); }
function RCS() { if (global.cursorSyncG) global.cursorSyncG(); else mp.gui.cursor.show(false, false); }
global.radioPanelOpen = function () { return rPanel; };
global.radioDown = function () { return rTx; };
global.radioHear = function (p) {
    if (!rState) return false;
    var f = '';
    try { f = p.getVariable('radioTx') || ''; } catch (e) {}
    return !!f && f === rState.fq;
};
function rBlocked() {
    return !!(mp.players.local.isTypingInTextChat || global.chatOpen || global.authOpen || global.creatorOpen || global.intOpen || mp.gui.cursor.visible);
}
function click(on) { try { mp.game.audio.playSoundFrontend(-1, on ? 'Start_Squelch' : 'End_Squelch', 'CB_RADIO_SFX', true); } catch (e) {} }

mp.events.add('radio:state', function (json) {
    try { rState = JSON.parse(json); } catch (e) { rState = null; }
    if (!rState && rTx) { rTx = false; mp.events.callRemote('srv:radio:tx', 0); }
});
mp.events.add('radio:talk', function (name) { rTalker = name || 'Неизвестный'; rTalkAt = Date.now(); click(true); });

mp.events.add('render', function () {
    var down = false;
    try { down = mp.keys.isDown(0x58); } catch (e) {}
    var want = down && !!rState && rState.mode === 'talk' && !rBlocked();
    if (want !== rTx) {
        rTx = want;
        mp.events.callRemote('srv:radio:tx', want ? 1 : 0);
        click(want);
    }
    if (!rState) return;
    var col = rTx ? [90, 220, 120, 235] : rState.mode === 'listen' ? [255, 170, 60, 220] : [127, 212, 255, 220];
    var line = '📻 ' + rState.fq + ' МГц · ' + rState.n + (rState.mode === 'listen' ? ' · прослушка' : '') + (rTx ? ' · ЭФИР' : '');
    mp.game.graphics.drawText(line, [0.5, 0.965], { font: 4, color: col, scale: [0.34, 0.34], outline: true });
    if (rTalker && Date.now() - rTalkAt < 2500) mp.game.graphics.drawText('В эфире: ' + rTalker, [0.5, 0.94], { font: 4, color: [255, 255, 255, 220], scale: [0.32, 0.32], outline: true });
});

setInterval(function () {
    if (!rState) return;
    var me = mp.players.local;
    mp.players.forEach(function (p) {
        if (p === me || p.handle) return;
        try { if (global.radioHear(p)) { p.voice3d = false; p.voiceVolume = 0.85; } } catch (e) {}
    });
}, 300);

mp.events.add('radio:panel', function (json) {
    RX('window.radioPanel && window.radioPanel(' + JSON.stringify(json) + ');');
    if (!rPanel) { rPanel = true; mp.gui.cursor.show(true, true); mp.gui.chat.activate(false); }
});
function rClose() {
    if (!rPanel) return;
    rPanel = false;
    RX('window.radioPanel && window.radioPanel(null);');
    RCS();
    mp.gui.chat.activate(true);
}
mp.events.add('cef:radio:close', rClose);
mp.events.add('cef:radio:act', function (a, v) { mp.events.callRemote('srv:radio:act', String(a), String(v || '')); });
mp.keys.bind(0x1B, false, function () { if (rPanel) rClose(); });
