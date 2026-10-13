var admBrowser = null;
var admOpen = false;
var banBrowser = null;
var noclip = false;
var noclipCam = null;
var gm = false;
var annBrowser = null;

function admEnsure() {
    if (!admBrowser) {
        admBrowser = mp.browsers.new('package://cef/admin/index.html');
        admBrowser.active = false;
    }
}

function admShow(on) {
    admEnsure();
    admOpen = on;
    admBrowser.active = on;
    mp.gui.cursor.show(on, on);
    mp.gui.chat.activate(!on);
    if (on) mp.events.callRemote('srv:adm:open');
}

var admLastToggle = 0;

mp.keys.bind(0x73, false, function () {
    if (banBrowser) return;
    var now = Date.now();
    if (now - admLastToggle < 400) return;
    admLastToggle = now;
    if (mp.gui.cursor.visible && !admOpen) return;
    admShow(!admOpen);
});

mp.events.add('adm:close', function () { if (admOpen) admShow(false); });

mp.events.add('adm:data', function (json) {
    admEnsure();
    admBrowser.execute('window.admData && window.admData(' + JSON.stringify(json) + ');');
});

mp.events.add('adm:toast', function (text, ok) {
    if (admBrowser) admBrowser.execute('window.admToast && window.admToast(' + JSON.stringify(text) + ',' + (ok ? 'true' : 'false') + ');');
    else mp.gui.chat.push(text);
});

mp.events.add('cef:adm:close', function () { admLastToggle = Date.now(); if (admOpen) admShow(false); });
mp.events.add('cef:adm:refresh', function () { if (admOpen) mp.events.callRemote('srv:adm:refresh'); });
mp.events.add('cef:adm:act', function (json) { mp.events.callRemote('srv:adm:act', json); });
mp.events.add('cef:adm:veh', function (json) { mp.events.call('adm:vehCheck', json); });
mp.events.add('cef:adm:fly', function () { mp.events.call('adm:noclipToggle'); });

mp.events.add('adm:vehCheck', function (json) {
    var d;
    try { d = JSON.parse(json); } catch (e) { return; }
    var hash = mp.game.joaat(d.model);
    var ok = false;
    try { ok = mp.game.streaming.isModelInCdimage(hash) && mp.game.streaming.isModelAVehicle(hash); } catch (e) { ok = true; }
    if (!ok) {
        mp.events.callRemote('srv:adm:vehBad', d.model);
        return;
    }
    mp.events.callRemote('srv:adm:veh', JSON.stringify(d));
});

mp.events.add('adm:freeze', function (on) {
    mp.players.local.freezePosition(!!on);
});

mp.events.add('adm:gm', function (on) {
    gm = !!on;
    mp.players.local.setInvincible(gm);
});

function noclipStart() {
    var p = mp.players.local;
    noclip = true;
    var pos = p.position;
    noclipCam = mp.cameras.new('admFly', new mp.Vector3(pos.x, pos.y, pos.z + 1), mp.game.cam.getGameplayCamRot(2), 60);
    noclipCam.setActive(true);
    mp.game.cam.renderScriptCams(true, false, 0, true, false);
    p.freezePosition(true);
    p.setAlpha(0);
    p.setCollision(false, false);
    mp.events.callRemote('srv:adm:noclip', true);
    mp.gui.chat.push('!{#8fd14f}Полёт: WASD, Shift — быстрее, Alt — медленнее, Q/E — вниз/вверх. F5 или /fly — выйти');
}

function noclipStop() {
    var p = mp.players.local;
    noclip = false;
    var c = noclipCam ? noclipCam.getCoord() : p.position;
    if (noclipCam) { noclipCam.setActive(false); noclipCam.destroy(); noclipCam = null; }
    mp.game.cam.renderScriptCams(false, false, 0, true, false);
    var gz = mp.game.gameplay.getGroundZFor3dCoord(c.x, c.y, c.z, 0, false);
    var z = gz && gz > 0 ? gz + 1 : c.z;
    p.position = new mp.Vector3(c.x, c.y, z);
    p.freezePosition(false);
    p.setAlpha(255);
    p.setCollision(true, true);
    mp.events.callRemote('srv:adm:flyLand', c.x, c.y, z);
    mp.events.callRemote('srv:adm:noclip', false);
}

mp.events.add('adm:noclipToggle', function () {
    if (noclip) noclipStop(); else noclipStart();
});

mp.keys.bind(0x74, false, function () {
    if (noclip) noclipStop();
});

mp.events.add('render', function () {
    if (!noclip || !noclipCam) return;
    var dx = mp.game.controls.getDisabledControlNormal(0, 1) * 6;
    var dy = mp.game.controls.getDisabledControlNormal(0, 2) * 6;
    mp.game.controls.disableAllControlActions(0);
    for (var i = 0; i < 6; i++) mp.game.controls.enableControlAction(0, [245, 249, 200, 0, 1, 2][i], true);
    var rot = noclipCam.getRot(2);
    var rx = Math.max(-89, Math.min(89, rot.x - dy));
    var rz = rot.z - dx;
    noclipCam.setRot(rx, 0, rz, 2);

    var speed = 1.0;
    if (mp.keys.isDown(0x10)) speed = 4.0;
    if (mp.keys.isDown(0x12)) speed = 0.2;
    var radZ = rz * Math.PI / 180;
    var radX = rx * Math.PI / 180;
    var fx = -Math.sin(radZ) * Math.cos(radX);
    var fy = Math.cos(radZ) * Math.cos(radX);
    var fz = Math.sin(radX);
    var c = noclipCam.getCoord();
    var nx = c.x, ny = c.y, nz = c.z;
    if (mp.keys.isDown(0x57)) { nx += fx * speed; ny += fy * speed; nz += fz * speed; }
    if (mp.keys.isDown(0x53)) { nx -= fx * speed; ny -= fy * speed; nz -= fz * speed; }
    if (mp.keys.isDown(0x41)) { nx -= Math.cos(radZ) * speed; ny -= Math.sin(radZ) * speed; }
    if (mp.keys.isDown(0x44)) { nx += Math.cos(radZ) * speed; ny += Math.sin(radZ) * speed; }
    if (mp.keys.isDown(0x45)) nz += speed;
    if (mp.keys.isDown(0x51)) nz -= speed;
    noclipCam.setCoord(nx, ny, nz);
    mp.players.local.setCoordsNoOffset(nx, ny, nz - 1, false, false, false);
});

mp.events.add('adm:banScreen', function (json) {
    if (admOpen) admShow(false);
    if (noclip) noclipStop();
    if (banBrowser) banBrowser.destroy();
    banBrowser = mp.browsers.new('package://cef/admin/ban.html');
    mp.gui.cursor.show(true, true);
    mp.gui.chat.show(false);
    mp.game.ui.displayRadar(false);
    mp.players.local.freezePosition(true);
    setTimeout(function () {
        if (banBrowser) banBrowser.execute('window.showBan && window.showBan(' + JSON.stringify(json) + ');');
    }, 400);
});

mp.events.add('cef:ban:quit', function () {
    mp.events.callRemote('srv:ban:quit');
});

mp.events.add('adm:announce', function (text, author) {
    if (!annBrowser) annBrowser = mp.browsers.new('package://cef/admin/announce.html');
    setTimeout(function () {
        if (annBrowser) annBrowser.execute('window.announce && window.announce(' + JSON.stringify(text) + ',' + JSON.stringify(author) + ');');
    }, 300);
});
