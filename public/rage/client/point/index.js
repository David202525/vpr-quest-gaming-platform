var ptOn = false, ptPeds = {};
function inv() { try { return mp.game.invoke.apply(mp.game, arguments); } catch (e) { return 0; } }
function startFor(p, tries) {
    if (!p || !p.handle) return;
    mp.game.streaming.requestAnimDict('anim@mp_point');
    if (!mp.game.streaming.hasAnimDictLoaded('anim@mp_point')) { if ((tries || 0) < 20) setTimeout(function () { if (mp.players.exists(p)) startFor(p, (tries || 0) + 1); }, 50); return; }
    inv('0x0725A4CCFDED9A70', p.handle, 0, 1, 1, 1);
    inv('0x2D537BA194896636', p.handle, 'task_mp_pointing', 0.5, false, 'anim@mp_point', 24);
    ptPeds[p.remoteId] = p;
}
function stopFor(p) {
    if (!p || !p.handle) return;
    inv('0xD01015C7316AE176', p.handle, 'Stop');
    if (!p.isInjured()) p.clearTasks();
    inv('0x0725A4CCFDED9A70', p.handle, 1, 1, 1, 1);
    delete ptPeds[p.remoteId];
}
function canPoint() {
    var me = mp.players.local;
    return !me.vehicle && !me.isDead() && !me.isSwimming() && !me.isRagdoll() && !me.isFalling();
}
function toggle() {
    if (mp.players.local.isTypingInTextChat || mp.gui.cursor.visible) return;
    if (!ptOn && !canPoint()) return;
    ptOn = !ptOn;
    if (ptOn) startFor(mp.players.local); else stopFor(mp.players.local);
    mp.events.callRemote('srv:point', ptOn);
}
mp.keys.bind(0xBE, false, toggle);

function upd(p) {
    var cam = mp.game.cam.getGameplayCamRot(2), head = p.getHeading();
    var pitch = Math.max(-70, Math.min(42, cam.x));
    var yaw = cam.z - head;
    if (yaw > 180) yaw -= 360; if (yaw < -180) yaw += 360;
    yaw = Math.max(-180, Math.min(180, yaw));
    if (p !== mp.players.local) { pitch = p.getVariable('ptP') || 0; yaw = p.getVariable('ptY') || 0; }
    inv('0xD5BB4025AE449A4E', p.handle, 'Pitch', (pitch + 70) / 112);
    inv('0xD5BB4025AE449A4E', p.handle, 'Heading', (yaw * -1 + 180) / 360);
    inv('0xB0A6CFD2C69C1088', p.handle, 'isBlocked', false);
    inv('0xB0A6CFD2C69C1088', p.handle, 'isFirstPerson', inv('0xEE778F8C7E1142E2', inv('0x19CAFA3C87F7C2FF')) === 4);
}
var lastSend = 0;
mp.events.add('render', function () {
    var me = mp.players.local;
    if (ptOn) {
        if (!canPoint()) { ptOn = false; stopFor(me); mp.events.callRemote('srv:point', false); return; }
        upd(me);
        if (Date.now() - lastSend > 300) {
            lastSend = Date.now();
            var cam = mp.game.cam.getGameplayCamRot(2), yaw = cam.z - me.getHeading();
            if (yaw > 180) yaw -= 360; if (yaw < -180) yaw += 360;
            mp.events.callRemote('srv:pointDir', Math.round(Math.max(-70, Math.min(42, cam.x))), Math.round(yaw));
        }
    }
    Object.keys(ptPeds).forEach(function (k) {
        var p = ptPeds[k];
        if (p === me) return;
        if (!mp.players.exists(p) || !p.handle) { delete ptPeds[k]; return; }
        upd(p);
    });
});
mp.events.addDataHandler('pointing', function (p, v) {
    if (!p || p.type !== 'player' || p === mp.players.local || !p.handle) return;
    if (v) startFor(p); else stopFor(p);
});
mp.events.add('entityStreamIn', function (e) {
    if (e && e.type === 'player' && e !== mp.players.local && e.getVariable('pointing')) setTimeout(function () { if (mp.players.exists(e)) startFor(e); }, 300);
});
mp.events.add('entityStreamOut', function (e) { if (e && e.type === 'player') delete ptPeds[e.remoteId]; });
