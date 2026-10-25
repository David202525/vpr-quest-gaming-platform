var GP = [];
var gNear = null, gHint = '';
var tabBrowser = null, tabOpen = false, gMenuOpen = false;
var trackBlip = null, trackT = null;
function UX(c) { if (global.uiExecG) global.uiExecG(c); }
function CS() { if (global.cursorSyncG) global.cursorSyncG(); else mp.gui.cursor.show(false, false); }
function gBusy() { return global.chatOpen || global.authOpen || global.creatorOpen || mp.players.local.isTypingInTextChat || (global.uiOpenG && global.uiOpenG()); }
var LBL = { armory: 'склад оружия', locker: 'раздевалка', garage: 'гараж' };

mp.events.add('gov:points', function (json) { try { GP = JSON.parse(json) || []; } catch (e) { GP = []; } gBlipKey = ''; });
var gBlips = [], gBlipKey = '';
var BLIP = { armory: [110, 1, 'склад оружия'], locker: [366, 3, 'раздевалка'], garage: [357, 5, 'гараж'] };
var FNM = { lspd: 'LSPD', sheriff: 'Шериф', fib: 'FIB', army: 'Армия', gov: 'Правительство', news: 'Weazel News', lic: 'Лиц. центр' };
setInterval(function () {
    var f = '';
    try { f = mp.players.local.getVariable('fac') || ''; } catch (e) {}
    var key = f + ':' + GP.length;
    if (key === gBlipKey) return;
    gBlipKey = key;
    gBlips.forEach(function (b) { try { b.destroy(); } catch (e) {} });
    gBlips = [];
    if (!f) return;
    GP.forEach(function (g) {
        if (g[0] !== f || !BLIP[g[1]]) return;
        try { gBlips.push(mp.blips.new(BLIP[g[1]][0], new mp.Vector3(g[2], g[3], g[4]), { dimension: 4294967295, color: BLIP[g[1]][1], scale: g[1] === 'garage' ? 0.9 : 0.75, shortRange: g[1] !== 'garage', name: (FNM[f] || f) + ': ' + BLIP[g[1]][2] })); } catch (e) {}
    });
}, 2000);
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
    trackBlip = mp.blips.new(9, new mp.Vector3(x, y, 0), { dimension: 4294967295, radius: r, color: 1, alpha: 110, name: 'Сигнал: ' + name, shortRange: false });
    try { trackBlip.setFlashes(true); } catch (e) {}
    mp.game.ui.setNewWaypoint(x, y);
    trackT = setTimeout(function () { if (trackBlip) { try { trackBlip.destroy(); } catch (e) {} trackBlip = null; } }, 90000);
    if (tabOpen) tabShow(false);
});
mp.events.add('gov:tabToast', function (t, ok) { if (tabBrowser && tabOpen) tabBrowser.execute('window.tabToast && window.tabToast(' + JSON.stringify(t) + ',' + (Number(ok) ? 'true' : 'false') + ');'); else mp.events.call('hud:notify', Number(ok) ? 'ok' : 'error', t, 4000); });

var arrestPts = [];
mp.events.add('cop:arrestPts', function (j) { try { arrestPts = JSON.parse(j) || []; } catch (e) {} });
mp.events.add('render', function () {
    if (!arrestPts.length) return;
    var me = mp.players.local;
    if (me.getVariable('fac') !== 'lspd') return;
    var pos = me.position;
    arrestPts.forEach(function (a) {
        var d = Math.hypot(pos.x - a.x, pos.y - a.y);
        if (d > 30 || Math.abs(pos.z - a.z) > 6) return;
        mp.game.graphics.drawMarker(1, a.x, a.y, a.z - 1, 0, 0, 0, 0, 0, 0, 16, 16, 0.4, 255, 204, 102, 60, false, false, 2, false, null, null, false);
        if (d < 10) mp.game.graphics.drawText('Зона ареста · /arrest [id]', [a.x, a.y, a.z + 0.4], { font: 4, color: [255, 204, 102, 230], scale: [0.35, 0.35], outline: true, centre: true });
    });
});

mp.events.add('gov:uniCheck', function (json) {
    var u = {}; try { u = JSON.parse(json) || {}; } catch (e) {}
    var me = mp.players.local, bad = { c: [], p: [] };
    Object.keys(u.c || {}).forEach(function (k) {
        var c = Number(k), d = u.c[k][0], t = u.c[k][1];
        try {
            var nd = me.getNumberOfDrawableVariations(c);
            if (d < 0 || d >= nd) { bad.c.push(c); return; }
            var nt = me.getNumberOfTextureVariations(c, d);
            if (t < 0 || t >= nt) { bad.c.push(c); return; }
            if (me.isComponentVariationValid && !me.isComponentVariationValid(c, d, t)) bad.c.push(c);
        } catch (e) {}
    });
    Object.keys(u.p || {}).forEach(function (k) {
        var c = Number(k), d = u.p[k][0], t = u.p[k][1];
        if (d < 0) return;
        try {
            var nd = me.getNumberOfPropDrawableVariations(c);
            if (d >= nd) { bad.p.push(c); return; }
            var nt = me.getNumberOfPropTextureVariations(c, d);
            if (t < 0 || t >= nt) bad.p.push(c);
        } catch (e) {}
    });
    mp.events.callRemote('srv:gov:uniApply', JSON.stringify(bad));
});

var TZ_W = [mp.game.joaat('weapon_stungun') >>> 0, mp.game.joaat('weapon_stungun_mp') >>> 0], tzLast = 0;
function tzHit(pos) {
    var me = mp.players.local, w = me.weapon >>> 0;
    if (TZ_W.indexOf(w) < 0 || Date.now() - tzLast < 800 || !pos) return;
    var best = null, bd = 2.2;
    mp.players.forEachInStreamRange(function (p) {
        if (p === me || !p.handle || !p.vehicle || p.dimension !== me.dimension) return;
        var q = p.position, d = mp.game.system.vdist(pos.x, pos.y, pos.z, q.x, q.y, q.z);
        if (d < bd) { bd = d; best = p; }
    });
    if (!best) return;
    tzLast = Date.now();
    mp.events.callRemote('srv:gov:taze', best.remoteId);
}
mp.events.add('playerWeaponShot', function (pos) { tzHit(pos); });
mp.events.add('outgoingDamage', function (src, target) {
    if (target && target.type === 'player' && target.vehicle) tzHit(target.position);
});
mp.events.add('gov:tazed', function (ms) {
    var me = mp.players.local;
    setTimeout(function () {
        try { me.setToRagdoll(ms, ms, 0, true, true, false); } catch (e) {}
        try { mp.game.graphics.startScreenEffect('DrugsDrivingIn', ms, false); } catch (e) {}
        setTimeout(function () { try { mp.game.graphics.stopScreenEffect('DrugsDrivingIn'); } catch (e) {} try { mp.game.invoke('0x068E835A1D0DC0E3', 'DrugsDrivingIn'); } catch (e) {} }, ms);
    }, 350);
});

var gClerk = null, gClerkNear = false, gClerkHint = false;
mp.events.add('gov:clerk', function (j) { try { gClerk = JSON.parse(j); } catch (e) { gClerk = null; } });
setInterval(function () {
    var me = mp.players.local, n = false;
    if (gClerk && me.dimension === gClerk.d && !me.vehicle) {
        var c = gClerk.p, pos = me.position;
        n = mp.game.system.vdist(pos.x, pos.y, pos.z, c[0], c[1], c[2]) < 2.3;
    }
    if (n && !gClerkHint) mp.events.call('hud:notify', 'ok', 'E — паспортный стол', 2500);
    gClerkHint = n; gClerkNear = n;
}, 400);
mp.events.add('render', function () {
    var me = mp.players.local;
    if (!gClerk || me.dimension !== gClerk.d) return;
    var c = gClerk.p;
    mp.game.graphics.drawText('Паспортный стол', [c[0], c[1], c[2] + 1.15], { font: 4, color: [255, 215, 120, 235], scale: [0.4, 0.4], outline: true, centre: true });
});
mp.keys.bind(0x45, false, function () {
    if (!gClerkNear || gBusy() || gMenuOpen || tabOpen) return;
    mp.events.callRemote('srv:gov:passport');
});
mp.events.add('gov:passWait', function (ms) {
    var me = mp.players.local;
    try { me.freezePosition(true); } catch (e) {}
    setTimeout(function () { try { me.freezePosition(false); } catch (e) {} }, ms);
});
