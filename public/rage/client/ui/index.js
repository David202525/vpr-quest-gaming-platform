var uiBrowser = mp.browsers.new('package://cef/ui/index.html');
var uiOpen = null;
var freeCursor = false;
var skillStat = { shots: 0, drive: 0, run: 0 };
var lastPos = null;
var lastShot = 0;
var gpsBlip = null;
var VNAMES = {};
var uiTyping = false;
var uiSet = { hud: true, chat: true, sound: true, hints: true };

function uiExec(code) { if (uiBrowser) uiBrowser.execute(code); }
function uiCall(fn, a, b) {
    uiExec('window.' + fn + ' && window.' + fn + '(' + JSON.stringify(a) + (b !== undefined ? ',' + JSON.stringify(b) : '') + ');');
}

function busy() {
    if (uiTyping) return true;
    if (mp.players.local.isTypingInTextChat) return true;
    if (typeof admOpen !== 'undefined' && admOpen) return true;
    return false;
}

function cursorSync() {
    var need = !!uiOpen || freeCursor;
    mp.gui.cursor.show(need, need);
}

function nearVeh() {
    var p = mp.players.local;
    var best = null, bd = 4.5;
    mp.vehicles.forEachInStreamRange(function (v) {
        if (v.dimension !== p.dimension) return;
        var d = mp.game.system.vdist(p.position.x, p.position.y, p.position.z, v.position.x, v.position.y, v.position.z);
        if (d < bd) { bd = d; best = v; }
    });
    return best;
}

function vehName(v) {
    try {
        var m = mp.game.vehicle.getDisplayNameFromVehicleModel(v.model);
        var n = mp.game.ui.getLabelText(m);
        return (n && n !== 'NULL' ? n : m).toUpperCase();
    } catch (e) { return 'ТРАНСПОРТ'; }
}

function openUi(name, opt) {
    if (busy()) return;
    if (uiOpen === name) return closeUi();
    if (uiOpen) closeUi(true);
    uiOpen = name;
    uiCall('uiOpen', name, opt || {});
    if (name === 'inv') {
        var side = 'ground', vid = -1, vn = '';
        if (opt && opt.trunk) {
            var v = mp.players.local.vehicle || nearVeh();
            if (v) { side = 'trunk'; vid = v.remoteId; vn = vehName(v); }
        }
        mp.events.callRemote('srv:inv:open', side, vid, vn);
    }
    if (name === 'phone') mp.events.callRemote('srv:phone:get');
    if (name === 'menu') mp.events.callRemote('srv:menu:get');
    mp.gui.chat.activate(false);
    cursorSync();
}

function closeUi(silent) {
    if (!uiOpen) return;
    uiOpen = null;
    uiTyping = false;
    if (!silent) uiCall('uiClose', '');
    mp.gui.chat.activate(true);
    cursorSync();
}

mp.keys.bind(0x49, false, function () { openUi('inv'); });
mp.keys.bind(0xC0, false, function () { openUi('inv', { trunk: !!(mp.players.local.vehicle || nearVeh()) }); });
mp.keys.bind(0x72, false, function () { openUi('phone'); });
mp.keys.bind(0x4D, false, function () { openUi('menu'); });
mp.keys.bind(0x71, false, function () {
    if (uiTyping || mp.players.local.isTypingInTextChat) return;
    if (uiOpen) return;
    freeCursor = !freeCursor;
    cursorSync();
});

mp.events.add('render', function () {
    if (uiOpen || freeCursor) {
        mp.game.controls.disableControlAction(0, 1, true);
        mp.game.controls.disableControlAction(0, 2, true);
        mp.game.controls.disableControlAction(0, 24, true);
        mp.game.controls.disableControlAction(0, 25, true);
        mp.game.controls.disableControlAction(0, 140, true);
        mp.game.controls.disableControlAction(0, 141, true);
        mp.game.controls.disableControlAction(0, 142, true);
        mp.game.controls.disableControlAction(0, 200, true);
        mp.game.controls.disableControlAction(0, 199, true);
    }
    var p = mp.players.local;
    if (p.isShooting()) {
        var now = Date.now();
        if (now - lastShot > 80) { skillStat.shots++; lastShot = now; }
    }
});

setInterval(function () {
    var p = mp.players.local;
    var pos = p.position;
    if (lastPos) {
        var d = mp.game.system.vdist(pos.x, pos.y, pos.z, lastPos.x, lastPos.y, lastPos.z);
        if (d < 200) {
            if (p.vehicle && p.vehicle.getPedInSeat(-1) === p.handle) skillStat.drive += d;
            else if (!p.vehicle && (p.isSprinting() || p.isRunning())) skillStat.run += d;
        }
    }
    lastPos = pos;
}, 1000);

setInterval(function () {
    if (skillStat.shots || skillStat.drive > 1 || skillStat.run > 1) {
        mp.events.callRemote('srv:skills:tick', JSON.stringify(skillStat));
        skillStat = { shots: 0, drive: 0, run: 0 };
    }
}, 30000);

mp.events.add('ui:data', function (kind, json) {
    if (kind === 'menu') {
        try {
            var d = JSON.parse(json);
            d.vehicles.forEach(function (v) {
                if (!VNAMES[v.model]) {
                    try {
                        var lbl = mp.game.ui.getLabelText(mp.game.vehicle.getDisplayNameFromVehicleModel(mp.game.joaat(v.model)));
                        VNAMES[v.model] = lbl && lbl !== 'NULL' ? lbl : v.model;
                    } catch (e) { VNAMES[v.model] = v.model; }
                }
                v.name = VNAMES[v.model];
            });
            json = JSON.stringify(d);
        } catch (e) {}
    }
    uiExec('window.uiData && window.uiData(' + JSON.stringify(kind) + ',' + json + ');');
});

mp.events.add('phone:sms', function (from, text) {
    mp.events.call('hud:notify', 'warn', 'SMS от ' + from + ': ' + text, 6000);
    if (uiSet.sound) mp.game.audio.playSoundFrontend(-1, 'Text_Arrive_Tone', 'Phone_SoundSet_Default', true);
});

mp.events.add('phone:gps', function (x, y, name) {
    mp.game.ui.setNewWaypoint(x, y);
    mp.events.call('hud:notify', 'ok', 'Метка поставлена: ' + name, 3000);
});

mp.events.add('inv:ammoReq', function (hash) {
    var n = 0;
    try { n = mp.game.invoke('0x015A522136D7F951', mp.players.local.handle, hash); } catch (e) {}
    mp.events.callRemote('srv:inv:ammo', Number(n) || 0);
});

mp.events.add('inv:clearProp', function (idx) {
    try { mp.players.local.clearProp(idx); } catch (e) {}
});

mp.events.add('cef:ui:close', function () { closeUi(true); });
mp.events.add('cef:ui:open', function (name) { openUi(name); });
mp.events.add('cef:inv:act', function (json) { mp.events.callRemote('srv:inv:act', json); });
mp.events.add('cef:menu:buy', function (k) { mp.events.callRemote('srv:menu:buy', k); });
mp.events.add('cef:menu:claim', function (l) { mp.events.callRemote('srv:menu:claim', l); });
mp.events.add('cef:menu:report', function (t) { mp.events.callRemote('srv:menu:report', t); });
mp.events.add('cef:phone:sms', function (to, t) { mp.events.callRemote('srv:phone:sms', to, t); });
mp.events.add('cef:phone:contact', function (json) { mp.events.callRemote('srv:phone:contact', json); });
mp.events.add('cef:phone:bank', function (op, sum, to) { mp.events.callRemote('srv:phone:bank', op, sum, to || ''); });
mp.events.add('cef:phone:gps', function (i) { mp.events.callRemote('srv:phone:gps', i); });
mp.events.add('cef:phone:refresh', function () { mp.events.callRemote('srv:phone:get'); });
mp.events.add('cef:phone:camera', function () {
    closeUi();
    mp.gui.takeScreenshot('photo_' + Date.now() + '.png', 1, 100, 0);
    mp.events.call('hud:notify', 'ok', 'Фото сохранено в папку screenshots', 3000);
});

mp.events.add('cef:ui:typing', function (on) { uiTyping = !!on; });
mp.events.add('cef:ui:set', function (k, on) {
    uiSet[k] = !!on;
    if (k === 'hud') mp.events.call('hud:show', !!on);
    if (k === 'chat') mp.gui.chat.show(!!on);
    if (k === 'hints') mp.events.call('hud:hints', !!on);
});
