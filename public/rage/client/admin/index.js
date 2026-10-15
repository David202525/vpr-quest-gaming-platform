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
    if (on && typeof uiExec === 'function') uiExec('document.getElementById("death").style.visibility="hidden";');
    if (!on && typeof uiExec === 'function') uiExec('document.getElementById("death").style.visibility="";');
    admOpen = on;
    admBrowser.active = on;
    if (on || typeof cursorSync !== 'function') mp.gui.cursor.show(on, on); else cursorSync();
    mp.gui.chat.activate(!on);
    if (on) mp.events.callRemote('srv:adm:open');
}

var admLastToggle = 0;

mp.keys.bind(0x73, false, function () {
    if (banBrowser) return;
    var now = Date.now();
    if (now - admLastToggle < 400) return;
    admLastToggle = now;
    var dead = typeof deadState !== 'undefined' && !!deadState;
    if (mp.gui.cursor.visible && !admOpen && !dead) return;
    admShow(!admOpen);
    if (!admOpen && dead) mp.gui.cursor.show(true, true);
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
    var inImage = false;
    try { inImage = mp.game.streaming.isModelInCdimage(hash) || mp.game.streaming.isModelValid(hash); } catch (e) { inImage = true; }
    if (!inImage) {
        mp.events.callRemote('srv:adm:vehBad', d.model);
        return;
    }
    try { mp.game.streaming.requestModel(hash); } catch (e) {}
    var tries = 0;
    var timer = setInterval(function () {
        tries++;
        var loaded = false;
        try { loaded = mp.game.streaming.hasModelLoaded(hash); } catch (e) { loaded = true; }
        if (loaded || tries >= 30) {
            clearInterval(timer);
            mp.events.callRemote('srv:adm:veh', JSON.stringify(d));
        }
    }, 100);
});

mp.events.add('adm:freeze', function (on) {
    mp.players.local.freezePosition(!!on);
});

mp.events.add('adm:gm', function (on) {
    gm = !!on;
    var p = mp.players.local;
    p.setInvincible(gm);
    try { p.setCanRagdoll(!gm); } catch (e) {}
    try { p.setProofs(gm, gm, gm, gm, gm, gm, gm, gm); } catch (e) {}
    mp.events.call('hud:gm', gm);
});
setInterval(function () {
    if (!gm) return;
    var p = mp.players.local;
    if (!noclip) p.setInvincible(true);
    if (p.getHealth() < 200) p.setHealth(200);
    try { p.clearBloodDamage(); } catch (e) {}
    if (p.vehicle && p.vehicle.getPedInSeat(-1) === p.handle) {
        try { p.vehicle.setCanBeVisiblyDamaged(false); p.vehicle.setInvincible(true); } catch (e) {}
    }
}, 500);
mp.events.add('playerDeath', function () { if (gm) setTimeout(function () { mp.players.local.setInvincible(true); }, 500); });

function clearFocus() {
    try { mp.game.streaming.clearFocus(); } catch (e) { try { mp.game.invoke('0x31B73D1EA9F01DA2'); } catch (e2) {} }
}

/* ===== свободная камера (флай) ===== */
var flyCanTp = false;
var flyPosAt = 0;
var flyStartPos = null;
mp.events.add('adm:flyTp', function (v) { flyCanTp = !!v; });
function noclipStart() {
    var p = mp.players.local;
    if (p.vehicle) { mp.gui.chat.push('!{#e05555}Выйдите из машины'); return; }
    noclip = true;
    flyStartPos = p.position;
    var pos = p.position;
    var rot = mp.game.cam.getGameplayCamRot(2);
    noclipCam = mp.cameras.new('admFly', new mp.Vector3(pos.x, pos.y, pos.z + 1), new mp.Vector3(rot.x, 0, rot.z), 60);
    noclipCam.setActive(true);
    mp.game.cam.renderScriptCams(true, false, 0, true, false);
    p.freezePosition(true);
    p.setAlpha(0);
    p.setCollision(false, false);
    p.setInvincible(true);
    mp.events.callRemote('srv:adm:noclip', true);
    mp.events.callRemote('srv:adm:flyStart');
    mp.gui.chat.push('!{#8fd14f}Свободная камера: WASD, мышь, Q/E — вниз/вверх, Shift — быстро, Alt — медленно. Колесо — скорость.');
    mp.gui.chat.push('!{#8fd14f}F5 — выйти и ТП туда, где камера (3+), Backspace — выйти и вернуться на место');
}
var flySpeed = 1;
function noclipStop(back) {
    var p = mp.players.local;
    if (!noclip) return;
    noclip = false;
    var c = noclipCam ? noclipCam.getCoord() : p.position;
    if (noclipCam) { noclipCam.setActive(false); noclipCam.destroy(); noclipCam = null; }
    mp.game.cam.renderScriptCams(false, false, 0, true, false);
    clearFocus();
    p.freezePosition(false);
    p.setAlpha(255);
    p.setCollision(true, true);
    p.setInvincible(gm);
    if (gm) mp.events.call('adm:gm', true);
    if (!back && flyCanTp) {
        var gz = mp.game.gameplay.getGroundZFor3dCoord(c.x, c.y, c.z + 2, 0, false);
        var z = gz && gz > 0 && gz < c.z + 2 ? gz + 1 : c.z;
        p.setCoordsNoOffset(c.x, c.y, z, false, false, false);
        mp.events.callRemote('srv:adm:flyLand', c.x, c.y, z);
    } else if (flyStartPos) {
        p.setCoordsNoOffset(flyStartPos.x, flyStartPos.y, flyStartPos.z, false, false, false);
        mp.events.callRemote('srv:adm:flyBack');
    }
    flyStartPos = null;
    mp.events.callRemote('srv:adm:noclip', false);
}

mp.events.add('adm:noclipToggle', function () {
    if (noclip) noclipStop(false); else noclipStart();
});
mp.keys.bind(0x74, false, function () { if (noclip) noclipStop(false); });
mp.keys.bind(0x08, false, function () { if (noclip && !mp.gui.cursor.visible) noclipStop(true); });

mp.events.add('render', function () {
    if (!noclip || !noclipCam) return;
    var p = mp.players.local;
    mp.game.controls.disableAllControlActions(0);
    [245, 249, 1, 2, 241, 242].forEach(function (k) { mp.game.controls.enableControlAction(0, k, true); });
    if (mp.gui.cursor.visible) return;
    var dx = mp.game.controls.getDisabledControlNormal(0, 1) * 8;
    var dy = mp.game.controls.getDisabledControlNormal(0, 2) * 8;
    if (mp.game.controls.isControlJustPressed(0, 241)) flySpeed = Math.min(8, flySpeed * 1.5);
    if (mp.game.controls.isControlJustPressed(0, 242)) flySpeed = Math.max(0.1, flySpeed / 1.5);
    var rot = noclipCam.getRot(2);
    var rx = Math.max(-89, Math.min(89, rot.x - dy));
    var rz = rot.z - dx;
    noclipCam.setRot(rx, 0, rz, 2);
    var speed = flySpeed;
    if (mp.keys.isDown(0x10)) speed *= 4;
    if (mp.keys.isDown(0x12)) speed *= 0.2;
    var radZ = rz * Math.PI / 180, radX = rx * Math.PI / 180;
    var fx = -Math.sin(radZ) * Math.cos(radX), fy = Math.cos(radZ) * Math.cos(radX), fz = Math.sin(radX);
    var c = noclipCam.getCoord();
    var nx = c.x, ny = c.y, nz = c.z;
    if (mp.keys.isDown(0x57)) { nx += fx * speed; ny += fy * speed; nz += fz * speed; }
    if (mp.keys.isDown(0x53)) { nx -= fx * speed; ny -= fy * speed; nz -= fz * speed; }
    if (mp.keys.isDown(0x41)) { nx -= Math.cos(radZ) * speed; ny -= Math.sin(radZ) * speed; }
    if (mp.keys.isDown(0x44)) { nx += Math.cos(radZ) * speed; ny += Math.sin(radZ) * speed; }
    if (mp.keys.isDown(0x45)) nz += speed;
    if (mp.keys.isDown(0x51)) nz -= speed;
    noclipCam.setCoord(nx, ny, nz);
    p.setCoordsNoOffset(nx, ny, nz - 3, false, false, false);
    mp.game.streaming.setFocusArea(nx, ny, nz, 0, 0, 0);
    if (Date.now() - flyPosAt > 250) { flyPosAt = Date.now(); mp.events.callRemote('srv:adm:flyPos', nx, ny, nz, rx, rz); }
    mp.game.graphics.drawText('FLY  x' + flySpeed.toFixed(1), [0.5, 0.94], { font: 4, color: [143, 209, 79, 220], scale: [0.4, 0.4], outline: true });
});
mp.events.add('playerDeath', function () { if (noclip) noclipStop(true); });

/* ===== просмотр камеры другого админа / глаз игрока ===== */
var watchCam = null;
mp.events.add('adm:flyWatch', function (id) {
    if (Number(id) < 0) {
        if (watchCam) { watchCam.setActive(false); watchCam.destroy(); watchCam = null; mp.game.cam.renderScriptCams(false, false, 0, true, false); clearFocus(); }
        return;
    }
    if (!watchCam) {
        var p = mp.players.local.position;
        watchCam = mp.cameras.new('admWatch', new mp.Vector3(p.x, p.y, p.z + 2), new mp.Vector3(0, 0, 0), 60);
        watchCam.setActive(true);
        mp.game.cam.renderScriptCams(true, false, 0, true, false);
    }
});
mp.events.add('adm:flyWatchPos', function (x, y, z, rx, rz) {
    if (!watchCam) return;
    watchCam.setCoord(x, y, z);
    watchCam.setRot(rx, 0, rz, 2);
    mp.game.streaming.setFocusArea(x, y, z, 0, 0, 0);
});
var camStreamUntil = 0, camStreamAt = 0;
mp.events.add('adm:camStream', function (sec) { camStreamUntil = Date.now() + Number(sec) * 1000; });
mp.events.add('render', function () {
    if (!camStreamUntil || Date.now() > camStreamUntil || Date.now() - camStreamAt < 150) return;
    camStreamAt = Date.now();
    var c = mp.game.cam.getGameplayCamCoord(), r = mp.game.cam.getGameplayCamRot(2);
    mp.events.callRemote('srv:adm:camPos', c.x, c.y, c.z, r.x, r.z);
});

/* ===== слежка ===== */
var specId = -1, specCam = null;
mp.events.add('adm:spec', function (id, name) {
    specId = Number(id);
    var lp = mp.players.local;
    lp.freezePosition(true); lp.setAlpha(0); lp.setCollision(false, false); lp.setInvincible(true);
    if (!specCam) specCam = mp.cameras.new('admSpec', lp.position, new mp.Vector3(0, 0, 0), 60);
    specCam.setActive(true);
    mp.game.cam.renderScriptCams(true, false, 0, true, false);
    mp.gui.chat.push('!{#7fd4ff}Слежка за ' + name + '. /specoff или Backspace — выйти');
});
mp.events.add('adm:specOff', function () {
    specId = -1;
    var lp = mp.players.local;
    if (specCam) { specCam.setActive(false); specCam.destroy(); specCam = null; }
    mp.game.cam.renderScriptCams(false, false, 0, true, false);
    lp.freezePosition(false); lp.setAlpha(255); lp.setCollision(true, true); lp.setInvincible(gm);
    clearFocus();
});
mp.keys.bind(0x08, false, function () { if (specId >= 0 && !mp.gui.cursor.visible) mp.events.callRemote('srv:adm:specoff'); });
mp.events.add('render', function () {
    if (specId < 0 || !specCam) return;
    var t = mp.players.atRemoteId ? mp.players.atRemoteId(specId) : mp.players.at(specId);
    if (!t || !t.handle) return;
    var tp = t.vehicle ? t.vehicle.position : t.position;
    var r = mp.game.cam.getGameplayCamRot(2);
    var rad = r.z * Math.PI / 180, dist = t.vehicle ? 7 : 4;
    specCam.setCoord(tp.x + Math.sin(rad) * dist, tp.y - Math.cos(rad) * dist, tp.z + (t.vehicle ? 2.2 : 1.2));
    specCam.pointAtCoord(tp.x, tp.y, tp.z + 0.5);
    mp.game.streaming.setFocusArea(tp.x, tp.y, tp.z, 0, 0, 0);
    mp.game.graphics.drawText('СЛЕЖКА: ' + t.name + ' [' + specId + ']  HP ' + t.getHealth() + '  AR ' + t.getArmour(), [0.5, 0.92], { font: 4, color: [127, 212, 255, 230], scale: [0.42, 0.42], outline: true });
});

/* ===== AFK ===== */
var lastAct = Date.now(), lastPosA = null;
setInterval(function () {
    var p = mp.players.local.position;
    if (!lastPosA || Math.abs(p.x - lastPosA.x) + Math.abs(p.y - lastPosA.y) > 0.5 || mp.gui.cursor.visible) lastAct = Date.now();
    lastPosA = p;
}, 1000);
mp.events.add('render', function () {
    for (var i = 30; i <= 35; i++) if (mp.game.controls.isControlPressed(0, i)) { lastAct = Date.now(); break; }
});
setInterval(function () { mp.events.callRemote('srv:adm:idle', Math.floor((Date.now() - lastAct) / 1000)); }, 15000);

/* ===== ворота ===== */
var GATES = ['prop_sec_barrier_ld_01a', 'prop_sec_barier_02b', 'prop_sec_barrier_ld_02a', 'prop_gate_airport_01', 'prop_facgate_01', 'prop_facgate_07b', 'prop_facgate_08', 'prop_gate_prison_01', 'prop_lrggate_01c_l', 'prop_lrggate_01c_r',
    'prop_lrggate_02a', 'prop_gate_military_01', 'prop_fnclink_03gate5', 'v_ilev_ph_gendoor004', 'prop_gate_docks_ld', 'prop_ld_garaged_01', 'hei_prop_station_gate', 'prop_sec_gate_01b', 'prop_sec_gate_01c', 'prop_sec_gate_01d'];
mp.events.add('adm:gate', function (x, y, z) {
    GATES.forEach(function (m) {
        var h = mp.game.joaat(m);
        var obj = mp.game.object.getClosestObjectOfType(x, y, z, 15, h, false, false, false);
        if (!obj) return;
        var hidden = obj;
        try { mp.game.invoke('0x1A9205C1B9EE827F', hidden, false, false); mp.game.invoke('0xEA1C610A04DB6BBB', hidden, false, false); } catch (e) {}
        setTimeout(function () { try { mp.game.invoke('0x1A9205C1B9EE827F', hidden, true, true); mp.game.invoke('0xEA1C610A04DB6BBB', hidden, true, false); } catch (e) {} }, 20000);
    });
});

/* ===== эвакуатор ===== */
setInterval(function () {
    var v = mp.players.local.vehicle;
    if (!v || v.getPedInSeat(-1) !== mp.players.local.handle) return;
    var tid = v.getVariable('towing');
    if (tid === undefined || tid === null) return;
    var t = tid >= 0 ? (mp.vehicles.atRemoteId ? mp.vehicles.atRemoteId(tid) : mp.vehicles.at(tid)) : null;
    var cur = 0;
    try { cur = mp.game.invoke('0xEFEA18DCF10F8F75', v.handle); } catch (e) {}
    if (t && t.handle) {
        if (cur !== t.handle) { try { mp.game.invoke('0x29A16F8D621C4508', v.handle, t.handle, true, 0, 0, 0); } catch (e) {} }
    } else if (cur) {
        try { mp.game.invoke('0xC2DB6B6708350ED8', v.handle, cur); } catch (e) {}
    }
}, 600);

/* ===== светофоры и зелёные зоны ===== */
var WORLD = { traffic: true, zonesOn: true, zones: [] };
var gzBlips = [];
var inZone = null;
mp.events.add('adm:world', function (json) {
    try { WORLD = JSON.parse(json); } catch (e) { return; }
    gzBlips.forEach(function (b) { try { b.destroy(); } catch (e) {} });
    gzBlips = [];
    if (WORLD.zonesOn) WORLD.zones.forEach(function (z) {
        if (!z.on) return;
        try { gzBlips.push(mp.blips.new(9, new mp.Vector3(z.x, z.y, z.z), { radius: z.r, color: 2, alpha: 70, shortRange: true, name: 'Зелёная зона' })); } catch (e) {}
    });
});
setInterval(function () {
    var p = mp.players.local.position, z = null;
    if (WORLD.zonesOn) for (var i = 0; i < WORLD.zones.length; i++) {
        var q = WORLD.zones[i];
        if (q.on && Math.pow(p.x - q.x, 2) + Math.pow(p.y - q.y, 2) < q.r * q.r) { z = q; break; }
    }
    if (!!z !== !!inZone) mp.events.call('hud:notify', z ? 'ok' : 'warn', z ? 'Вы вошли в зелёную зону «' + z.n + '»' : 'Вы покинули зелёную зону', 3000);
    inZone = z;
}, 1000);
var zoneSafe = false;
mp.events.add('render', function () {
    var safe = !!inZone && !jailUntil;
    if (safe) [24, 25, 37, 44, 45, 47, 58, 140, 141, 142, 143, 257, 263, 264, 69, 70, 92, 114, 331].forEach(function (k) { mp.game.controls.disableControlAction(0, k, true); });
    if (safe !== zoneSafe) {
        zoneSafe = safe;
        try { mp.players.local.setCanBeDamaged(!safe); } catch (e) {}
    }
});
var LIGHTS = ['prop_traffic_01a', 'prop_traffic_01b', 'prop_traffic_01d', 'prop_traffic_02a', 'prop_traffic_02b', 'prop_traffic_03a', 'prop_traffic_03b'].map(function (m) { return mp.game.joaat(m); });
var lightsTouched = {};
setInterval(function () {
    var pos = mp.players.local.position;
    var offs = [[0, 0], [45, 0], [-45, 0], [0, 45], [0, -45], [45, 45], [-45, -45], [45, -45], [-45, 45]];
    offs.forEach(function (o) {
        LIGHTS.forEach(function (h) {
            var obj = mp.game.object.getClosestObjectOfType(pos.x + o[0], pos.y + o[1], pos.z, 40, h, false, false, false);
            if (!obj) return;
            if (!WORLD.traffic) { try { mp.game.invoke('0x57C5DB656185EAC4', obj, 0); lightsTouched[obj] = 1; } catch (e) {} }
            else if (lightsTouched[obj]) { try { mp.game.invoke('0x57C5DB656185EAC4', obj, 3); } catch (e) {} delete lightsTouched[obj]; }
        });
    });
}, 1500);

/* ===== тюрьма ===== */
var jailUntil = 0, jailType = '', jailReason = '';
mp.events.add('adm:jail', function (type, ms, reason) { jailType = type; jailUntil = type ? Date.now() + Number(ms) : 0; jailReason = reason; });
mp.events.add('render', function () {
    if (!jailUntil) return;
    var left = Math.max(0, Math.ceil((jailUntil - Date.now()) / 1000));
    mp.game.graphics.drawText(({ demorgan: 'ДЕМОРГАН', prison: 'ТЮРЬМА' }[jailType] || 'КПЗ') + ': ' + Math.floor(left / 60) + ':' + ('0' + left % 60).slice(-2) + '  ·  ' + jailReason, [0.5, 0.05], { font: 4, color: [255, 159, 67, 230], scale: [0.45, 0.45], outline: true });
    [24, 25, 37, 140, 141, 142, 257, 263].forEach(function (k) { mp.game.controls.disableControlAction(0, k, true); });
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

/* ===== защита от провала под карту ===== */
setInterval(function () {
    if (!noclip && specId < 0 && !watchCam) clearFocus();
}, 2000);

var admFrozen = false, dbgOn = false;
mp.events.add('adm:dbg', function (v) { dbgOn = !!v; });
mp.events.add('adm:freeze', function (on) { admFrozen = !!on; });

function N(hash) { try { return mp.game.invoke.apply(mp.game, arguments); } catch (e) { return null; } }
function collLoaded(ent) { var r = N('0xE9676F61BC0B3321', ent.handle); return r === null ? true : !!r; }
function reqColl(x, y, z) { N('0x07503F7948F491A7', x, y, z); }

var holdEnt = null, holdSince = 0, safePos = null, lastFix = 0, fixCount = 0;
function release() {
    if (holdEnt) { try { if (!admFrozen || holdEnt !== mp.players.local) holdEnt.freezePosition(false); } catch (e) {} }
    holdEnt = null; holdSince = 0;
}
setInterval(function () {
    var p = mp.players.local;
    if (noclip || specId >= 0 || watchCam || (typeof deadState !== 'undefined' && deadState)) { release(); return; }
    var drv = p.vehicle && p.vehicle.getPedInSeat(-1) === p.handle;
    if (p.vehicle && !drv) { release(); return; }
    var ent = drv ? p.vehicle : p;
    var pos = ent.position;
    reqColl(pos.x, pos.y, pos.z);

    if (!collLoaded(ent)) {
        if (!holdEnt) {
            holdEnt = ent; holdSince = Date.now();
            try { ent.freezePosition(true); } catch (e) {}
        }
        if (Date.now() - holdSince > 10000) release();
        return;
    }
    if (holdEnt) release();

    var ground = 0;
    try { ground = mp.game.gameplay.getGroundZFor3dCoord(pos.x, pos.y, pos.z + 50, 0, false); } catch (e) {}
    var vz = 0;
    try { vz = ent.getVelocity().z; } catch (e) {}

    if (ground > 0 && pos.z >= ground - 1 && pos.z < ground + 3 && Math.abs(vz) < 3) {
        safePos = { x: pos.x, y: pos.y, z: ground + 1 };
        fixCount = 0;
        return;
    }
    var under = ground > 0 && pos.z < ground - 3 && vz < -3;
    if (!under || Date.now() - lastFix < 3000) return;
    if (fixCount >= 3) return;
    lastFix = Date.now(); fixCount++;
    try { ent.setVelocity(0, 0, 0); } catch (e) {}
    ent.setCoordsNoOffset(pos.x, pos.y, ground + 1, false, false, false);
    if (dbgOn) mp.events.call('hud:notify', 'warn', '[dbg] провал под текстуры — поднят на поверхность', 3000);
}, 250);

mp.events.add('render', function () {
    if (!holdEnt || !dbgOn) return;
    mp.game.graphics.drawText('Загрузка карты…', [0.5, 0.86], { font: 4, color: [255, 255, 255, 220], scale: [0.45, 0.45], outline: true });
});

mp.events.add('adm:unstuck', function () {
    var p = mp.players.local, ent = p.vehicle || p, pos = ent.position;
    var src = safePos || pos;
    reqColl(src.x, src.y, src.z);
    var g = 0;
    try { g = mp.game.gameplay.getGroundZFor3dCoord(src.x, src.y, src.z + 100, 0, false); } catch (e) {}
    ent.setCoordsNoOffset(src.x, src.y, g > 0 ? g + 1 : src.z + 1, false, false, false);
    fixCount = 0;
    mp.events.call('hud:notify', 'ok', 'Вы перемещены на поверхность', 2500);
});

mp.events.add('adm:ipl', function (n) { try { mp.game.streaming.requestIpl(n); } catch (e) {} });
mp.events.add('adm:intcheck', function (arg) {
    if (!dbgOn) return;
    var pos = mp.players.local.position, out = [];
    if (arg) {
        var h = mp.game.joaat(arg);
        out.push('Модель «' + arg + '»: ' + (mp.game.streaming.isModelInCdimage(h) ? 'ЕСТЬ в игре' : 'НЕТ — игра не видит DLC'));
        try { out.push('IPL «' + arg + '»: ' + (mp.game.streaming.isIplActive(arg) ? 'загружен' : 'не загружен')); } catch (e) {}
    }
    var id = 0;
    try { id = mp.game.interior.getInteriorAtCoords(pos.x, pos.y, pos.z); } catch (e) {}
    out.push('Интерьер здесь: ' + (id ? 'ID ' + id + (mp.game.interior.isInteriorReady(id) ? ', загружен' : ', НЕ загружен') : 'нет'));
    out.push('Координаты: ' + pos.x.toFixed(1) + ', ' + pos.y.toFixed(1) + ', ' + pos.z.toFixed(1));
    out.forEach(function (s) { mp.gui.chat.push('!{#7fd3ff}[intcheck] ' + s); });
});

mp.events.add('dlc:load', function (json, dev) {
    var list = [];
    try { list = JSON.parse(json); } catch (e) { return; }
    var res = [];
    list.forEach(function (d) {
        var ipl = 0, found = 0;
        d.y.forEach(function (n) {
            try { if (!mp.game.streaming.isIplActive(n)) mp.game.streaming.requestIpl(n); if (mp.game.streaming.isIplActive(n)) ipl++; } catch (e) {}
        });
        d.m.forEach(function (n) { try { if (mp.game.streaming.isModelInCdimage(mp.game.joaat(n))) found++; } catch (e) {} });
        res.push({ n: d.n, found: found, total: d.m.length, ipl: ipl + '/' + d.y.length });
    });
    try {
        var pos = mp.players.local.position;
        var id = mp.game.interior.getInteriorAtCoords(pos.x, pos.y, pos.z);
        if (id) { mp.game.interior.refreshInterior(id); }
    } catch (e) {}
    if (dev && res.length) mp.events.callRemote('dlc:result', JSON.stringify(res));
});
