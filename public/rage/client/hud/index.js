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
    var t = new Date(Date.now() + 3 * 3600000);
    var h = t.getUTCHours(), mi = t.getUTCMinutes(), d = t.getUTCDate(), mo = t.getUTCMonth() + 1, y = t.getUTCFullYear();
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

var FUEL_ST = [];
var PUMP_MODELS = ['prop_gas_pump_1a', 'prop_gas_pump_1b', 'prop_gas_pump_1c', 'prop_gas_pump_1d', 'prop_gas_pump_old2', 'prop_gas_pump_old3', 'prop_vintage_pump'].map(function (m) { return mp.game.joaat(m); });
mp.events.add('fuel:list', function (json) { try { FUEL_ST = JSON.parse(json); } catch (e) {} });
setTimeout(function () { mp.events.callRemote('srv:biz:points'); }, 4500);
var atStation = false;
var lastFuelKey = 0;
function stationClose(pos) {
    for (var i = 0; i < FUEL_ST.length; i++) {
        var dx = pos.x - FUEL_ST[i][1], dy = pos.y - FUEL_ST[i][2];
        if (dx * dx + dy * dy < 2025) return true;
    }
    return false;
}
function pumpNear(pos) {
    for (var i = 0; i < PUMP_MODELS.length; i++) {
        var h = mp.game.object.getClosestObjectOfType(pos.x, pos.y, pos.z, 5.5, PUMP_MODELS[i], false, false, false);
        if (h) return true;
    }
    return false;
}
setInterval(function () {
    var p = mp.players.local;
    var v = p.vehicle;
    var now = false;
    if (v && stationClose(p.position)) {
        var sp = v.getSpeed ? v.getSpeed() : 0;
        now = sp < 3 && pumpNear(v.position);
    }
    if (now && !atStation) mp.events.call('hud:notify', 'ok', 'Колонка рядом: нажмите E, чтобы заправиться', 5000);
    atStation = now;
    global.fuelStationNear = !!now;
}, 500);
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
var PADS = [], padBlips = [], atPad = null, padHint = '';
mp.events.add('fuel:pads', function (j) {
    try { PADS = JSON.parse(j) || []; } catch (e) { PADS = []; }
    padBlips.forEach(function (b) { try { b.destroy(); } catch (e) {} });
    padBlips = [];
    PADS.forEach(function (pd) {
        try { padBlips.push(mp.blips.new(pd[0] === 'army' ? 361 : 361, new mp.Vector3(pd[1], pd[2], pd[3]), { dimension: 4294967295, color: pd[0] === 'army' ? 52 : 27, scale: 0.75, shortRange: true, name: pd[0] === 'army' ? 'Военная заправка' : 'Авиазаправка' })); } catch (e) {}
    });
});
function vAir(v) { try { var c = v.getClass(); return c === 15 || c === 16; } catch (e) { return false; } }
function vArmy(v) { try { return v.getVariable('gov') === 'army' || v.getVariable('faction') === 'army'; } catch (e) { return false; } }
setInterval(function () {
    var p = mp.players.local, v = p.vehicle, best = null;
    if (v && v.getPedInSeat(-1) === p.handle && (vAir(v) || vArmy(v))) {
        var pos = v.position, sp = v.getSpeed ? v.getSpeed() : 0;
        if (sp < 2) PADS.forEach(function (pd) { var dx = pos.x - pd[1], dy = pos.y - pd[2]; if (Math.sqrt(dx * dx + dy * dy) <= pd[5] && Math.abs(pos.z - pd[3]) < 15) best = pd; });
    }
    atPad = best;
    global.fuelPadNear = !!best;
    var h = best ? best[4] : '';
    if (h && h !== padHint) mp.events.call('hud:notify', 'ok', (best[0] === 'army' ? 'Военная заправка (бесплатно)' : 'Авиазаправка') + ': нажмите E', 5000);
    padHint = h;
}, 500);
mp.events.add('render', function () {
    var me = mp.players.local, pos = me.position;
    if (me.dimension !== 0 || !PADS.length) return;
    PADS.forEach(function (pd) {
        var dx = pos.x - pd[1], dy = pos.y - pd[2];
        if (dx * dx + dy * dy > 40000) return;
        var c = pd[0] === 'army' ? [110, 150, 60] : [155, 107, 255];
        var r = Math.min(pd[5], 12) * 2;
        mp.game.graphics.drawMarker(1, pd[1], pd[2], pd[3] - 1, 0, 0, 0, 0, 0, 0, r, r, 0.6, c[0], c[1], c[2], 70, false, false, 2, false, null, null, false);
        mp.game.graphics.drawMarker(29, pd[1], pd[2], pd[3] + 2.5, 0, 0, 0, 0, 0, 0, 2.5, 2.5, 2.5, c[0], c[1], c[2], 200, true, true, 2, false, null, null, false);
    });
});
mp.keys.bind(0x45, false, function () {
    if (!atPad || mp.gui.cursor.visible || mp.players.local.isTypingInTextChat) return;
    if (Date.now() - lastFuelKey < 1500) return;
    lastFuelKey = Date.now();
    mp.events.callRemote('srv:afuel:open');
});
mp.keys.bind(0x45, false, function () {
    if (atPad) return;
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

var badgeLast = '';
setInterval(function () {
    var me = mp.players.local, out = [];
    if (!global.authOpen && !global.creatorOpen) {
        var mp0 = me.position;
        mp.players.forEachInStreamRange(function (p) {
            if (!p.handle || p.dimension !== me.dimension) return;
            var b = Number(p.getVariable('admBadge')) || 0;
            if (!b) return;
            if (p.getAlpha && p.getAlpha() < 50) return;
            var pos = p.position;
            var d = mp.game.system.vdist(mp0.x, mp0.y, mp0.z, pos.x, pos.y, pos.z);
            if (d > 20 || (p !== me && !me.hasClearLosToEntity(p.handle, 17))) return;
            if (p === me && mp.game.invoke('0x8D4D46230B2C353A') === 4) return;
            var head = p.getBoneCoords(12844, 0, 0, 0);
            var z = (head ? head.z : pos.z + 0.7) + 0.62 + d * 0.016;
            var sc = mp.game.graphics.world3dToScreen2d(new mp.Vector3(pos.x, pos.y, z));
            if (!sc) return;
            out.push([b, Math.round(sc.x * 1000) / 10, Math.round(sc.y * 1000) / 10, Math.round(Math.max(26, 64 - d * 2))]);
        });
    }
    var js = JSON.stringify(out);
    if (js === badgeLast) return;
    badgeLast = js;
    hudExec('window.hudBadges && window.hudBadges(' + js + ');');
}, 40);

mp.events.add('hud:wanted', function (n) { hudExec('window.hudWanted && window.hudWanted(' + (Number(n) || 0) + ');'); });

var cuffDict = 'mp_arresting';
mp.events.add('render', function () {
    var me = mp.players.local;
    if (!me.getVariable('cuffed')) return;
    [21, 22, 24, 25, 37, 44, 45, 47, 58, 140, 141, 142, 143, 257, 263, 264, 23, 75].forEach(function (k) { mp.game.controls.disableControlAction(0, k, true); });
});
setInterval(function () {
    mp.players.forEachInStreamRange(function (p) {
        if (!p.handle) return;
        var c = !!p.getVariable('cuffed');
        if (c && !p.isPlayingAnim(cuffDict, 'idle', 3)) {
            mp.game.streaming.requestAnimDict(cuffDict);
            if (mp.game.streaming.hasAnimDictLoaded(cuffDict)) { p.taskPlayAnim(cuffDict, 'idle', 8, -8, -1, 49, 0, false, false, false); if (p === mp.players.local) escortSpd = -1; }
            p._cuffAnim = true;
        } else if (!c && p._cuffAnim) { p._cuffAnim = false; p.stopAnimTask(cuffDict, 'idle', 3); }
    });
}, 700);

/* ===== быстрые действия полиции ===== */
var copKeys = { cuff: 0x55, escort: 0x4A, car: 0x4B };
var copBound = {};
function copNearest(max) {
    var me = mp.players.local, best = -1, bd = max;
    mp.players.forEachInStreamRange(function (p) {
        if (p === me || !p.handle || p.dimension !== me.dimension) return;
        var d = mp.game.system.vdist(me.position.x, me.position.y, me.position.z, p.position.x, p.position.y, p.position.z);
        if (d < bd) { bd = d; best = p.remoteId; }
    });
    return best;
}
function copBlocked() {
    return global.chatOpen || global.authOpen || global.creatorOpen || global.introOpen || mp.gui.cursor.visible || mp.players.local.isTypingInTextChat;
}
function copFire(act) {
    if (copBlocked() || !mp.players.local.getVariable('cop') || mp.players.local.vehicle) return;
    mp.events.callRemote('srv:cop:act', act, copNearest(act === 'car' ? 6 : 3));
}
var copHandlers = { cuff: function () { copFire('cuff'); }, escort: function () { copFire('escort'); }, car: function () { copFire('car'); } };
function copRebind() {
    Object.keys(copBound).forEach(function (k) { try { mp.keys.unbind(copBound[k], false, copHandlers[k]); } catch (e) {} });
    copBound = {};
    Object.keys(copKeys).forEach(function (k) { if (copKeys[k]) { mp.keys.bind(copKeys[k], false, copHandlers[k]); copBound[k] = copKeys[k]; } });
}
copRebind();
mp.events.add('cef:ui:keys', function (json) {
    try {
        var d = JSON.parse(json) || {};
        ['cuff', 'escort', 'car'].forEach(function (k) { var c = Number(d[k]); if (c > 0 && c < 255) copKeys[k] = c; });
        copRebind();
    } catch (e) {}
});

var escortOn = false, escortSpd = -1, escortAt = 0;
function escortCop() {
    var by = mp.players.local.getVariable('escortBy');
    return (by !== undefined && by !== null && by >= 0) ? mp.players.atRemoteId(by) : null;
}
mp.events.add('render', function () {
    if (!escortOn) return;
    [30, 31, 32, 33, 34, 35, 21, 22, 23, 44, 75].forEach(function (k) { mp.game.controls.disableControlAction(0, k, true); });
});
setInterval(function () {
    var me = mp.players.local, cop = escortCop();
    if (!cop || !cop.handle || me.vehicle || cop.vehicle) {
        if (escortOn) { escortOn = false; escortSpd = -1; try { me.clearTasks(); } catch (e) {} }
        return;
    }
    if (me.isAttached && me.isAttached()) { try { me.detach(true, false); } catch (e) {} }
    escortOn = true;
    var t = cop.getOffsetFromInWorldCoords(0.35, 0.75, 0.0);
    var d = mp.game.system.vdist(me.position.x, me.position.y, me.position.z, t.x, t.y, t.z);
    if (d > 14) {
        me.setCoordsNoOffset(t.x, t.y, t.z, false, false, false);
        me.setHeading(cop.getHeading());
        escortSpd = -1;
        return;
    }
    var cs = cop.getSpeed();
    var spd = d > 4 || cs > 4 ? 3.0 : d > 1.6 || cs > 1.6 ? 2.0 : 1.0;
    if (spd !== escortSpd || Date.now() - escortAt > 2500) {
        escortSpd = spd; escortAt = Date.now();
        try { me.taskFollowToOffsetOf(cop.handle, 0.35, 0.75, 0.0, spd, -1, 0.35, true); }
        catch (e) { me.taskGoStraightToCoord(t.x, t.y, t.z, spd, -1, cop.getHeading(), 0.2); }
    }
}, 200);

var hotelBlip = null;
mp.events.add('spawn:hotel', function (x, y, z, n) {
    if (hotelBlip) { try { hotelBlip.destroy(); } catch (e) {} }
    hotelBlip = mp.blips.new(475, new mp.Vector3(x, y, z), { dimension: 4294967295, name: n + ' (/hotel)', color: 27, shortRange: true, scale: 0.8 });
});

mp.events.add('hud:gm', function (on) { hudExec('window.hudGm && window.hudGm(' + (on ? 'true' : 'false') + ');'); });

mp.events.add('hud:voice', function (json) { hudExec('window.hudVoice && window.hudVoice(' + json + ');'); });
