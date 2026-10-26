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
    var gp = mp.game.cam.getGameplayCamCoord(), gr = mp.game.cam.getGameplayCamRot(2);
    mCam = mp.cameras.new('mediaCam', gp, gr, 50);
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
