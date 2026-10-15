var GP = [];
var gNear = null, gHint = '';
var tabBrowser = null, tabOpen = false, gMenuOpen = false;
var trackBlip = null, trackT = null;
function UX(c) { if (global.uiExecG) global.uiExecG(c); }
function CS() { if (global.cursorSyncG) global.cursorSyncG(); else mp.gui.cursor.show(false, false); }
function gBusy() { return global.chatOpen || global.authOpen || global.creatorOpen || mp.players.local.isTypingInTextChat || (global.uiOpenG && global.uiOpenG()); }
var LBL = { armory: 'склад оружия', locker: 'раздевалка', garage: 'гараж' };

mp.events.add('gov:points', function (json) { try { GP = JSON.parse(json) || []; } catch (e) { GP = []; } });
setInterval(function () {
    var me = mp.players.local, pos = me.position, f = '';
    try { f = me.getVariable('fac') || ''; } catch (e) {}
    var best = null;
    if (me.dimension === 0 && !me.vehicle) GP.forEach(function (g) { if (mp.game.system.vdist(pos.x, pos.y, pos.z, g[2], g[3], g[4]) < 2.2) best = g; });
    gNear = best;
    var h = best ? 'E — ' + LBL[best[1]] : '';
    if (h && h !== gHint) mp.events.call('hud:notify', 'ok', h, 2500);
    gHint = h;
}, 400);
mp.events.add('render', function () {
    var me = mp.players.local, pos = me.position;
    if (me.dimension !== 0) return;
    GP.forEach(function (g) {
        var dx = pos.x - g[2], dy = pos.y - g[3];
        if (dx * dx + dy * dy > 900) return;
        var c = g[1] === 'armory' ? [230, 70, 70] : g[1] === 'locker' ? [80, 160, 255] : [255, 200, 60];
        mp.game.graphics.drawMarker(1, g[2], g[3], g[4] - 1, 0, 0, 0, 0, 0, 0, 1.0, 1.0, 0.35, c[0], c[1], c[2], 110, false, false, 2, false, null, null, false);
    });
});
mp.keys.bind(0x45, false, function () {
    if (!gNear || gBusy() || gMenuOpen || tabOpen) return;
    mp.events.callRemote('srv:gov:point', gNear[0], gNear[1]);
});

/* меню склада / раздевалки / гаража */
mp.events.add('gov:menu', function (json) {
    UX('window.govMenu && window.govMenu(' + JSON.stringify(json) + ');');
    gMenuOpen = true;
    mp.gui.cursor.show(true, true);
    mp.gui.chat.activate(false);
});
function gClose() {
    if (!gMenuOpen) return;
    gMenuOpen = false;
    UX('window.govMenu && window.govMenu(null);');
    CS();
    mp.gui.chat.activate(true);
}
global.govMenuOpen = function () { return gMenuOpen || tabOpen; };
mp.events.add('house:menuClose', gClose);
mp.events.add('cef:gov:close', gClose);
mp.events.add('cef:gov:take', function (k) { mp.events.callRemote('srv:gov:take', k); });
mp.events.add('cef:gov:return', function () { mp.events.callRemote('srv:gov:return'); });
mp.events.add('cef:gov:uniform', function (i) { mp.events.callRemote('srv:gov:uniform', Number(i)); });
mp.events.add('cef:gov:car', function (m) { mp.events.callRemote('srv:gov:car', String(m)); });

/* планшет */
function tabShow(on) {
    if (on && !tabBrowser) { tabBrowser = mp.browsers.new('package://cef/tablet/index.html'); }
    tabOpen = on;
    if (tabBrowser) tabBrowser.active = on;
    if (on) { mp.gui.cursor.show(true, true); mp.gui.chat.activate(false); }
    else { CS(); mp.gui.chat.activate(true); }
}
mp.keys.bind(0x75, false, function () {
    if (tabOpen) return tabShow(false);
    if (gBusy() || gMenuOpen) return;
    mp.events.callRemote('srv:tab:open');
});
mp.events.add('gov:tablet', function (json) {
    if (!tabOpen) tabShow(true);
    var send = function () { if (tabBrowser) tabBrowser.execute('window.tabData && window.tabData(' + JSON.stringify(json) + ');'); };
    send(); setTimeout(send, 400);
});
mp.events.add('gov:tabSearch', function (json) { if (tabBrowser) tabBrowser.execute('window.tabSearch && window.tabSearch(' + JSON.stringify(json) + ');'); });
mp.events.add('gov:tabPlate', function (json) { if (tabBrowser) tabBrowser.execute('window.tabPlate && window.tabPlate(' + JSON.stringify(json) + ');'); });
mp.events.add('cef:tab:close', function () { tabShow(false); });
mp.events.add('cef:tab:act', function (json) { mp.events.callRemote('srv:tab:act', json); });
mp.events.add('cef:tab:refresh', function () { mp.events.callRemote('srv:tab:open'); });
mp.events.add('cef:tab:wp', function (x, y) { mp.game.ui.setNewWaypoint(Number(x), Number(y)); });
mp.keys.bind(0x1B, false, function () { if (tabOpen) tabShow(false); else if (gMenuOpen) gClose(); });

/* отслеживание: примерная зона */
mp.events.add('gov:track', function (x, y, r, name) {
    if (trackBlip) { try { trackBlip.destroy(); } catch (e) {} }
    clearTimeout(trackT);
    trackBlip = mp.blips.new(9, new mp.Vector3(x, y, 0), { radius: r, color: 1, alpha: 110, name: 'Сигнал: ' + name, shortRange: false });
    try { trackBlip.setFlashes(true); } catch (e) {}
    mp.game.ui.setNewWaypoint(x, y);
    trackT = setTimeout(function () { if (trackBlip) { try { trackBlip.destroy(); } catch (e) {} trackBlip = null; } }, 90000);
    if (tabOpen) tabShow(false);
});
mp.events.add('gov:tabToast', function (t, ok) { if (tabBrowser && tabOpen) tabBrowser.execute('window.tabToast && window.tabToast(' + JSON.stringify(t) + ',' + (Number(ok) ? 'true' : 'false') + ');'); else mp.events.call('hud:notify', Number(ok) ? 'ok' : 'error', t, 4000); });
