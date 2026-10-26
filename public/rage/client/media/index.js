var mediaRole = false, mediaOpenF = false, mediaStreamer = false;
var mediaWeather = null, mediaHour = -1;
var mCam = null, mCamRot = null, mCamOn = false;
global.mediaOpen = function () { return mediaOpenF; };
function UX(c) { if (global.uiExecG) global.uiExecG(c); }
function CS() { if (global.cursorSyncG) global.cursorSyncG(); else mp.gui.cursor.show(false, false); }
function busy() {
    return global.chatOpen || global.authOpen || global.creatorOpen || global.introOpen || mp.players.local.isTypingInTextChat || (global.uiOpenG && global.uiOpenG());
}

mp.events.add('media:role', function (on) {
    mediaRole = !!Number(on);
    if (!mediaRole) { mClose(); camOff(); mediaWeather = null; mediaHour = -1; }
});
mp.events.add('media:streamer', function (on) {
    mediaStreamer = !!Number(on);
    var js = 'document.body.classList.toggle("streamer",' + (mediaStreamer ? 'true' : 'false') + ');';
    UX(js);
    if (global.hudExecG) global.hudExecG(js);
});
mp.events.add('media:weather', function (w) {
    if (w === 'reset') { mediaWeather = null; try { mp.game.gameplay.clearWeatherTypePersist(); } catch (e) {} return; }
    mediaWeather = String(w);
});
mp.events.add('media:time', function (h) { mediaHour = Number(h); });
setInterval(function () {
    if (!mediaRole) return;
    if (mediaWeather) try { mp.game.gameplay.setWeatherTypeNowPersist(mediaWeather); } catch (e) {}
}, 1000);
mp.events.add('render', function () {
    if (mediaRole && mediaHour >= 0) try { mp.game.time.setClockTime(mediaHour, 0, 0); } catch (e) {}
});

function mOpen(json) {
    UX('window.mediaMenu && window.mediaMenu(' + JSON.stringify(json) + ');');
    if (!mediaOpenF) { mediaOpenF = true; mp.gui.cursor.show(true, true); mp.gui.chat.activate(false); }
}
function mClose() {
    if (!mediaOpenF) return;
    mediaOpenF = false;
    UX('window.mediaMenu && window.mediaMenu(null);');
    CS();
    mp.gui.chat.activate(true);
}
mp.events.add('media:open', mOpen);
mp.events.add('cef:media:close', mClose);
mp.events.add('cef:media:act', function (a, v) {
    if (a === 'cam') { mClose(); return camOn(); }
    if (a === 'fly') { mClose(); return mp.events.callRemote('srv:media:fly'); }
    mp.events.callRemote('srv:media:act', String(a), String(v || ''));
});
mp.keys.bind(0x79, false, function () {
    if (!mediaRole) return;
    if (mCamOn) return camOff();
    if (mediaOpenF) return mClose();
    if (busy()) return;
    mp.events.callRemote('srv:media:open');
});
mp.events.add('playerCommand', function (cmd) {
    if (cmd !== 'media' && cmd !== 'медиа') return;
    if (!mediaRole) return mp.events.call('hud:notify', 'warn', 'Панель доступна только медиа-партнёрам', 3000);
    mp.events.callRemote('srv:media:open');
});

/* ---------- кинокамера ---------- */
function camOn() {
    if (mCamOn) return;
    var me = mp.players.local;
    var gr = { x: 0, z: me.getHeading() };
    try { var r0 = mp.game.cam.getGameplayCamRot(2); if (r0) gr = { x: r0.x, z: r0.z }; } catch (e) {}
    var pp = me.position, rz0 = gr.z * Math.PI / 180;
    var gp = new mp.Vector3(pp.x + Math.sin(rz0) * 3, pp.y - Math.cos(rz0) * 3, pp.z + 1);
    mCam = mp.cameras.new('DEFAULT_SCRIPTED_CAMERA', gp, new mp.Vector3(gr.x, 0, gr.z), 50);
    mCamRot = { x: gr.x, z: gr.z };
    mCam.setActive(true);
    mp.game.cam.renderScriptCams(true, true, 400, true, false);
    me.freezePosition(true);
    mCamOn = true;
    mp.game.ui.displayRadar(false);
    mp.events.call('hud:show', false);
    mp.gui.chat.show(false);
    mp.events.call('hud:notify', 'ok', 'Кинокамера: WASD, мышь, Q/E — вниз/вверх, Shift — быстрее, колесо — зум. F10 — выход', 6000);
}
function camOff() {
    if (!mCamOn) return;
    mCamOn = false;
    try { mCam.setActive(false); mCam.destroy(); } catch (e) {}
    mCam = null;
    mp.game.cam.renderScriptCams(false, true, 400, true, false);
    mp.players.local.freezePosition(false);
    mp.game.ui.displayRadar(true);
    mp.events.call('hud:show', true);
    mp.gui.chat.show(true);
}
var mFov = 50;
mp.events.add('render', function () {
    if (!mCamOn || !mCam) return;
    mp.game.controls.disableAllControlActions(0);
    [1, 2, 249].forEach(function (k) { mp.game.controls.enableControlAction(0, k, true); });
    var dx = mp.game.controls.getDisabledControlNormal(0, 1), dy = mp.game.controls.getDisabledControlNormal(0, 2);
    mCamRot.z -= dx * 8; mCamRot.x = Math.max(-89, Math.min(89, mCamRot.x - dy * 8));
    var rz = mCamRot.z * Math.PI / 180, rx = mCamRot.x * Math.PI / 180;
    var fw = { x: -Math.sin(rz) * Math.cos(rx), y: Math.cos(rz) * Math.cos(rx), z: Math.sin(rx) };
    var rt = { x: Math.cos(rz), y: Math.sin(rz) };
    var sp = mp.game.controls.isDisabledControlPressed(0, 21) ? 0.9 : 0.25;
    var c = mCam.getCoord(), n = { x: c.x, y: c.y, z: c.z };
    if (mp.game.controls.isDisabledControlPressed(0, 32)) { n.x += fw.x * sp; n.y += fw.y * sp; n.z += fw.z * sp; }
    if (mp.game.controls.isDisabledControlPressed(0, 33)) { n.x -= fw.x * sp; n.y -= fw.y * sp; n.z -= fw.z * sp; }
    if (mp.game.controls.isDisabledControlPressed(0, 34)) { n.x -= rt.x * sp; n.y -= rt.y * sp; }
    if (mp.game.controls.isDisabledControlPressed(0, 35)) { n.x += rt.x * sp; n.y += rt.y * sp; }
    if (mp.game.controls.isDisabledControlPressed(0, 44)) n.z -= sp;
    if (mp.game.controls.isDisabledControlPressed(0, 38)) n.z += sp;
    if (mp.game.controls.isDisabledControlJustPressed(0, 241)) mFov = Math.max(10, mFov - 4);
    if (mp.game.controls.isDisabledControlJustPressed(0, 242)) mFov = Math.min(90, mFov + 4);
    var pp = mp.players.local.position;
    var dd = Math.hypot(n.x - pp.x, n.y - pp.y, n.z - pp.z);
    if (dd > 120) { var k = 120 / dd; n.x = pp.x + (n.x - pp.x) * k; n.y = pp.y + (n.y - pp.y) * k; n.z = pp.z + (n.z - pp.z) * k; }
    mCam.setCoord(n.x, n.y, n.z);
    mCam.setRot(mCamRot.x, 0, mCamRot.z, 2);
    mCam.setFov(mFov);
    mp.game.ui.hideHudAndRadarThisFrame();
});

/* ---------- полёт /fly ---------- */
var mFly = false, mFlyCam = null, mFlyStart = null, mFlyR = 400, mFlySpeed = 1, mFlyPosAt = 0;
mp.events.add('media:flyStart', function (r) {
    var p = mp.players.local;
    if (mFly) return;
    if (mCamOn) camOff();
    mFlyR = Number(r) || 400;
    mFly = true;
    mFlyStart = p.position;
    var rot = { x: 0, z: p.getHeading() };
    try { var r0 = mp.game.cam.getGameplayCamRot(2); if (r0) rot = { x: r0.x, z: r0.z }; } catch (e) {}
    mFlyCam = mp.cameras.new('DEFAULT_SCRIPTED_CAMERA', new mp.Vector3(p.position.x, p.position.y, p.position.z + 1), new mp.Vector3(rot.x, 0, rot.z), 60);
    mFlyCam.setActive(true);
    mp.game.cam.renderScriptCams(true, false, 0, true, false);
    p.freezePosition(true);
    p.setAlpha(0);
    p.setCollision(false, false);
    p.setInvincible(true);
    mp.events.call('hud:notify', 'ok', 'Полёт: WASD, мышь, Q/E — вниз/вверх, Shift — быстрее, Alt — медленнее, колесо — скорость. /fly — выход', 7000);
});
function mFlyStop() {
    if (!mFly) return;
    var p = mp.players.local;
    mFly = false;
    if (mFlyCam) { mFlyCam.setActive(false); mFlyCam.destroy(); mFlyCam = null; }
    mp.game.cam.renderScriptCams(false, false, 0, true, false);
    try { mp.game.streaming.clearFocus(); } catch (e) {}
    p.freezePosition(false);
    p.setAlpha(255);
    p.setCollision(true, true);
    p.setInvincible(false);
    if (mFlyStart) p.setCoordsNoOffset(mFlyStart.x, mFlyStart.y, mFlyStart.z, false, false, false);
    mFlyStart = null;
}
mp.events.add('media:flyStop', mFlyStop);
mp.events.add('media:role', function (on) { if (!Number(on)) mFlyStop(); });
mp.keys.bind(0x08, false, function () { if (mFly && !mp.gui.cursor.visible) mp.events.callRemote('srv:media:flyEnd'); });
mp.events.add('render', function () {
    if (!mFly || !mFlyCam) return;
    var p = mp.players.local;
    mp.game.controls.disableAllControlActions(0);
    [245, 249, 1, 2, 241, 242].forEach(function (k) { mp.game.controls.enableControlAction(0, k, true); });
    if (mp.gui.cursor.visible) return;
    var dx = mp.game.controls.getDisabledControlNormal(0, 1) * 8, dy = mp.game.controls.getDisabledControlNormal(0, 2) * 8;
    if (mp.game.controls.isControlJustPressed(0, 241)) mFlySpeed = Math.min(4, mFlySpeed * 1.5);
    if (mp.game.controls.isControlJustPressed(0, 242)) mFlySpeed = Math.max(0.1, mFlySpeed / 1.5);
    var rot = mFlyCam.getRot(2);
    var rx = Math.max(-89, Math.min(89, rot.x - dy)), rz = rot.z - dx;
    mFlyCam.setRot(rx, 0, rz, 2);
    var sp = mFlySpeed;
    if (mp.keys.isDown(0x10)) sp *= 3;
    if (mp.keys.isDown(0x12)) sp *= 0.2;
    var a = rz * Math.PI / 180, b = rx * Math.PI / 180;
    var fx = -Math.sin(a) * Math.cos(b), fy = Math.cos(a) * Math.cos(b), fz = Math.sin(b);
    var c = mFlyCam.getCoord(), nx = c.x, ny = c.y, nz = c.z;
    if (mp.keys.isDown(0x57)) { nx += fx * sp; ny += fy * sp; nz += fz * sp; }
    if (mp.keys.isDown(0x53)) { nx -= fx * sp; ny -= fy * sp; nz -= fz * sp; }
    if (mp.keys.isDown(0x41)) { nx -= Math.cos(a) * sp; ny -= Math.sin(a) * sp; }
    if (mp.keys.isDown(0x44)) { nx += Math.cos(a) * sp; ny += Math.sin(a) * sp; }
    if (mp.keys.isDown(0x45)) nz += sp;
    if (mp.keys.isDown(0x51)) nz -= sp;
    var s = mFlyStart, ddx = nx - s.x, ddy = ny - s.y, dd = Math.hypot(ddx, ddy);
    if (dd > mFlyR) { nx = s.x + ddx * mFlyR / dd; ny = s.y + ddy * mFlyR / dd; }
    nz = Math.max(s.z - 60, Math.min(s.z + 300, nz));
    mFlyCam.setCoord(nx, ny, nz);
    p.setCoordsNoOffset(nx, ny, nz - 3, false, false, false);
    mp.game.streaming.setFocusArea(nx, ny, nz, 0, 0, 0);
    var left = Math.round(mFlyR - Math.min(mFlyR, dd));
    mp.game.graphics.drawText('ПОЛЁТ МЕДИА  x' + mFlySpeed.toFixed(1) + '   до границы ' + left + ' м   Backspace — выход', [0.5, 0.94], { font: 4, color: [217, 59, 200, 230], scale: [0.4, 0.4], outline: true });
});
