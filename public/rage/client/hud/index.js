var hudBrowser = mp.browsers.new('package://cef/hud/index.html');
var hudOn = true;
var hudSrv = { money: 0, bank: 0, online: 0, weather: 'CLEAR', locked: false };
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
        bank: hudSrv.bank,
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
    if (d.money !== undefined && !hudSrv.locked) hudSrv.money = d.money;
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
    if (mp.gui.cursor.visible || mp.players.local.isTypingInTextChat) return;
    mp.events.call('hud:show', !hudOn);
});

mp.events.callRemote('srv:hud:sync');

mp.events.add('hud:hints', function (on) {
    hudExec('document.querySelector(".hints").style.display = ' + (on ? '""' : '"none"') + ';');
});

var spBelt = false;
var spLast = null;
setInterval(function () {
    var p = mp.players.local;
    var v = p.vehicle;
    if (!v || !hudOn) {
        if (spLast !== 'off') { hudExec('window.hudSpeedo && window.hudSpeedo(null);'); spLast = 'off'; }
        if (!v) spBelt = false;
        return;
    }
    var d = { speed: 0, gear: 1, fuel: 100, hp: 100, lock: false, light: false, engine: true, belt: spBelt };
    try { d.speed = v.getSpeed() * 3.6; } catch (e) {}
    try { d.gear = v.gear; if (typeof d.gear !== 'number') d.gear = 1; } catch (e) {}
    try { var f = v.getVariable('fuel'); if (f !== undefined && f !== null) d.fuel = Number(f); } catch (e) {}
    try { d.hp = Math.max(0, Math.min(100, v.getEngineHealth() / 10)); } catch (e) {}
    try { d.lock = v.getDoorLockStatus() > 1; } catch (e) {}
    try { var l = v.getLightsState(1, 1); d.light = !!(l && (l.lightsOn || l.highbeamsOn)); } catch (e) {}
    try { d.engine = v.getIsEngineRunning(); } catch (e) {}
    spLast = 'on';
    hudExec('window.hudSpeedo && window.hudSpeedo(' + JSON.stringify(d) + ');');
}, 100);

mp.keys.bind(0x42, false, function () {
    var p = mp.players.local;
    if (!p.vehicle || mp.gui.cursor.visible || p.isTypingInTextChat) return;
    spBelt = !spBelt;
    try { p.setConfigFlag(32, !spBelt); } catch (e) {}
    mp.events.call('hud:notify', spBelt ? 'ok' : 'warn', spBelt ? 'Ремень пристёгнут' : 'Ремень отстёгнут', 2000);
});

var FUEL_ST = [
    [49.42, 2778.79], [263.89, 2606.46], [1039.96, 2671.13], [1207.26, 2660.18], [2539.69, 2594.19], [2679.86, 3263.95],
    [2005.06, 3773.89], [1687.16, 4929.39], [1701.31, 6416.03], [179.86, 6602.84], [-94.46, 6419.59], [-2555.00, 2334.40],
    [-1800.38, 803.66], [-1437.62, -276.75], [-2096.24, -320.29], [-724.62, -935.16], [-526.02, -1211.00], [-70.21, -1761.79],
    [265.65, -1261.31], [819.65, -1028.85], [1208.95, -1402.57], [1181.38, -330.85], [620.84, 269.10], [2581.32, 362.04],
    [176.63, -1562.03], [-319.29, -1471.72], [1784.32, 3330.55]
];
var atStation = false;
var lastFuelKey = 0;
function nearFuel() {
    var pos = mp.players.local.position;
    for (var i = 0; i < FUEL_ST.length; i++) {
        var dx = pos.x - FUEL_ST[i][0], dy = pos.y - FUEL_ST[i][1];
        if (dx * dx + dy * dy < 144) return true;
    }
    return false;
}
setInterval(function () {
    var p = mp.players.local;
    var v = p.vehicle;
    var now = !!v && nearFuel();
    if (now && !atStation) mp.events.call('hud:notify', 'ok', 'Заправка: нажмите E, чтобы выбрать топливо', 5000);
    atStation = now;
}, 700);
mp.events.add('render', function () {
    var v = mp.players.local.vehicle;
    if (!v) return;
    var f = v.getVariable('fuel');
    if (f !== undefined && f !== null && Number(f) <= 0) {
        v.setEngineOn(false, true, true);
        mp.game.controls.disableControlAction(0, 71, true);
        mp.game.controls.disableControlAction(0, 72, true);
    }
});
mp.keys.bind(0x45, false, function () {
    if (!atStation || mp.gui.cursor.visible || mp.players.local.isTypingInTextChat) return;
    if (Date.now() - lastFuelKey < 1500) return;
    lastFuelKey = Date.now();
    mp.events.callRemote('srv:fuel:refill');
});
mp.keys.bind(0x5A, false, function () {
    var p = mp.players.local, v = p.vehicle;
    if (!v || mp.gui.cursor.visible || p.isTypingInTextChat) return;
    if (v.getPedInSeat(-1) !== p.handle) return;
    mp.events.callRemote('srv:veh:engine');
});

mp.keys.bind(0x4C, false, function () {
    var p = mp.players.local;
    if (mp.gui.cursor.visible || p.isTypingInTextChat) return;
    var v = p.vehicle, best = -1;
    if (!v) {
        var bd = 8;
        mp.vehicles.forEachInStreamRange(function (x) {
            var d = mp.game.system.vdist(p.position.x, p.position.y, p.position.z, x.position.x, x.position.y, x.position.z);
            if (d < bd) { bd = d; best = x.remoteId; }
        });
        if (best < 0) return;
    }
    mp.events.callRemote('srv:veh:lock', v ? -1 : best);
});
mp.events.add('veh:lockFx', function (id, locked) {
    var v = mp.vehicles.atRemoteId(id);
    if (!v) return;
    try {
        v.setIndicatorLights(0, true); v.setIndicatorLights(1, true);
        setTimeout(function () { try { v.setIndicatorLights(0, false); v.setIndicatorLights(1, false); } catch (e) {} }, 600);
        mp.game.audio.playSoundFromEntity(-1, locked ? 'Remote_Control_Close' : 'Remote_Control_Open', v.handle, 'PI_Menu_Sounds', true, 0);
    } catch (e) {}
});

mp.events.add('hud:money', function (m, b) {
    hudSrv.locked = true;
    hudSrv.money = Number(m) || 0;
    hudSrv.bank = Number(b) || 0;
    hudTick();
});
