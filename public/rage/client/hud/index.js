var hudBrowser = mp.browsers.new('package://cef/hud/index.html');
var hudOn = true;
var hudSrv = { money: 0, online: 0, weather: 'CLEAR' };
var UNARMED = 0xA2719263;

function pad(n) { return n < 10 ? '0' + n : '' + n; }

function hudExec(code) {
    if (hudBrowser) hudBrowser.execute(code);
}

function hudPush(obj) {
    hudExec('window.hudUpdate && window.hudUpdate(' + JSON.stringify(obj) + ');');
}

function zoneName(pos) {
    try {
        var code = mp.game.zone.getNameOfZone(pos.x, pos.y, pos.z);
        var label = mp.game.ui.getLabelText(code);
        return label && label !== 'NULL' ? label : code;
    } catch (e) { return ''; }
}

function streetName(pos) {
    try {
        var s = mp.game.pathfind.getStreetNameAtCoord(pos.x, pos.y, pos.z, 0, 0);
        var a = mp.game.ui.getStreetNameFromHashKey(s.streetName);
        var b = s.crossingRoad ? mp.game.ui.getStreetNameFromHashKey(s.crossingRoad) : '';
        return b ? a + ' / ' + b : a;
    } catch (e) { return ''; }
}

function ammoText() {
    var p = mp.players.local;
    try {
        var w = p.weapon;
        if (!w || w === UNARMED) return null;
        var total = mp.game.invoke('0x015A522136D7F951', p.handle, w);
        var clip = p.getAmmoInClip(w);
        if (typeof clip !== 'number') clip = 0;
        if (typeof total !== 'number') total = clip;
        return clip + ' / ' + Math.max(0, total - clip);
    } catch (e) { return null; }
}

function hudTick() {
    if (!hudOn) return;
    var p = mp.players.local;
    var pos = p.position;
    var h = 12, mi = 0, d = 1, mo = 1, y = 2022;
    try {
        h = mp.game.clock.getClockHours();
        mi = mp.game.clock.getClockMinutes();
        d = mp.game.clock.getClockDayOfMonth();
        mo = mp.game.clock.getClockMonth() + 1;
        y = mp.game.clock.getClockYear();
    } catch (e) {}
    hudPush({
        id: p.remoteId,
        online: hudSrv.online || mp.players.length,
        money: hudSrv.money,
        dt: pad(d) + '.' + pad(mo) + '.' + y + ' / ' + pad(h) + ':' + pad(mi),
        hour: h,
        weather: hudSrv.weather,
        zone: zoneName(pos),
        street: streetName(pos),
        ammo: ammoText()
    });
}

setInterval(hudTick, 500);

mp.events.add('render', function () {
    if (!hudOn) return;
    var hide = [1, 2, 3, 4, 6, 7, 8, 9, 13, 20, 22];
    for (var i = 0; i < hide.length; i++) mp.game.ui.hideHudComponentThisFrame(hide[i]);
});

mp.events.add('hud:data', function (json) {
    var d;
    try { d = JSON.parse(json); } catch (e) { return; }
    if (d.money !== undefined) hudSrv.money = d.money;
    if (d.online !== undefined) hudSrv.online = d.online;
    if (d.weather) hudSrv.weather = d.weather;
    hudTick();
});

mp.events.add('hud:notify', function (type, text, ms) {
    hudExec('window.hudNotify && window.hudNotify(' + JSON.stringify(type) + ',' + JSON.stringify(text) + ',' + (Number(ms) || 5000) + ');');
});

mp.events.add('hud:quest', function (json) {
    var d = { title: '', tasks: [] };
    try { d = JSON.parse(json); } catch (e) {}
    hudExec('window.hudQuest && window.hudQuest(' + JSON.stringify(d.title || '') + ',' + JSON.stringify(d.tasks || []) + ');');
});

mp.events.add('hud:show', function (on) {
    hudOn = !!on;
    hudExec('window.hudVisible && window.hudVisible(' + (hudOn ? 'true' : 'false') + ');');
});

mp.keys.bind(0x76, false, function () {
    if (mp.gui.cursor.visible) return;
    mp.events.call('hud:show', !hudOn);
});

mp.events.callRemote('srv:hud:sync');

mp.events.add('hud:hints', function (on) {
    hudExec('document.querySelector(".hints").style.display = ' + (on ? '""' : '"none"') + ';');
});
