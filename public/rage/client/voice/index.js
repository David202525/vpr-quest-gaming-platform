var NEAR = 22, MEGA = 110;
var talking = false, megaOn = false, lastHud = '';

try { mp.voiceChat.muted = true; } catch (e) {}

function inCall() {
    var c = global.phoneCallState && global.phoneCallState();
    return c && c.st === 'talk' ? c : null;
}
function blocked() {
    return mp.players.local.isTypingInTextChat || mp.gui.cursor.visible;
}
function micSet(on) {
    talking = on;
    if (inCall()) return;
    try { mp.voiceChat.muted = !on; } catch (e) {}
}
global.nDownAt = 0;
mp.keys.bind(0x4E, true, function () { if (!global.nDownAt) global.nDownAt = Date.now(); if (!talking && !blocked()) micSet(true); });
mp.keys.bind(0x4E, false, function () { setTimeout(function () { global.nDownAt = 0; }, 0); });
mp.keys.bind(0x4E, false, function () { if (talking) micSet(false); });

mp.keys.bind(0x55, false, function () {
    if (blocked()) return;
    var v = mp.players.local.vehicle;
    if (!v && !megaOn) return;
    mp.events.callRemote('srv:voice:mega');
});
mp.events.add('voice:mega', function (on) {
    megaOn = !!on;
    try { mp.game.audio.playSoundFrontend(-1, on ? 'SELECT' : 'BACK', 'HUD_FRONTEND_DEFAULT_SOUNDSET', true); } catch (e) {}
});

function minimap() {
    try {
        var sz = mp.game.graphics.getSafeZoneSize();
        var ar = mp.game.graphics.getScreenAspectRatio(false);
        var res = mp.game.graphics.getScreenActiveResolution(0, 0);
        var sx = 1 / res.x, sy = 1 / res.y;
        var w = sx * (res.x / (4 * ar));
        var left = sx * (res.x * (0.05 * (Math.abs(sz - 1) * 10)));
        var bottom = sy * (res.y * (0.05 * (Math.abs(sz - 1) * 10)));
        return { x: (left + w) * 100, y: bottom * 100 };
    } catch (e) { return { x: 16.5, y: 2 }; }
}

setInterval(function () {
    var me = mp.players.local;
    var call = inCall();
    var peer = call ? Number(call.rid) : -1;
    var veh = me.vehicle;
    mp.players.forEachInStreamRange(function (p) {
        if (p === me || p.remoteId === peer) return;
        try {
            var mega = !!p.getVariable('mega');
            if (veh && p.vehicle === veh) { p.voice3d = false; p.voiceVolume = 1.0; return; }
            var d = mp.game.system.vdist(me.position.x, me.position.y, me.position.z, p.position.x, p.position.y, p.position.z);
            var range = mega ? MEGA : NEAR;
            var vol = mega ? Math.min(1, 1.25 - d / range) : 1 - d / range;
            p.voice3d = true;
            p.voiceVolume = Math.max(0, Math.min(1, vol));
        } catch (e) {}
    });
    if (talking && blocked()) micSet(false);
    var active = false;
    try { active = !!(call || (talking && me.isVoiceActive !== false)); } catch (e) { active = talking || !!call; }
    var mm = minimap();
    var st = JSON.stringify({ on: active, mega: megaOn, call: !!call, x: Math.round(mm.x * 10) / 10, y: Math.round(mm.y * 10) / 10 });
    if (st !== lastHud) { lastHud = st; mp.events.call('hud:voice', st); }
}, 150);
