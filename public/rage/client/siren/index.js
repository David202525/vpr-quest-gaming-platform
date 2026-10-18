var NAMES = ['Мигалки выключены', 'Мигалки без звука', 'Мигалки со звуком'];
var HOLD = 280;
var eDown = 0, hornSent = false;
function isEmergency(v) {
    try { return v.getClass() === 18 || !!v.getVariable('gov'); } catch (e) { return false; }
}
function blocked() {
    return !!(mp.players.local.isTypingInTextChat || global.chatOpen || global.authOpen || global.creatorOpen || global.intOpen || mp.gui.cursor.visible);
}
function applySiren(v) {
    if (!v || !v.handle) return;
    var m = Number(v.getVariable('siren')) || 0;
    try { mp.game.invoke('0xD8050E0EB60CF274', v.handle, m === 1); } catch (e) {}
    try { if (!!v.isSirenOn() !== (m > 0)) v.setSiren(m > 0); } catch (e) {}
}
function myEmergency() {
    var me = mp.players.local, v = me.vehicle;
    if (!v || !isEmergency(v)) return null;
    try { if (v.getPedInSeat(-1) !== me.handle) return null; } catch (e) { return null; }
    return v;
}
function cycle(v) {
    var m = ((Number(v.getVariable('siren')) || 0) + 1) % 3;
    mp.events.callRemote('srv:siren:set', m);
    mp.events.call('hud:notify', m ? 'ok' : 'warn', NAMES[m] + ' · E — режим, держать E — сигнал', 2500);
}
mp.events.addDataHandler('siren', function (v) { if (v && v.type === 'vehicle') applySiren(v); });
mp.events.add('entityStreamIn', function (e) { if (e && e.type === 'vehicle') applySiren(e); });
mp.events.add('render', function () {
    var v = myEmergency();
    if (!v) { if (hornSent) { hornSent = false; mp.events.callRemote('srv:siren:horn', false); } eDown = 0; return; }
    mp.game.controls.disableControlAction(0, 86, true);
    var down = false;
    try { down = mp.keys.isDown(0x45) && !blocked(); } catch (e) {}
    if (down) {
        if (!eDown) eDown = Date.now();
        if (!hornSent && Date.now() - eDown > HOLD) { hornSent = true; mp.events.callRemote('srv:siren:horn', true); }
    } else if (eDown) {
        if (hornSent) { hornSent = false; mp.events.callRemote('srv:siren:horn', false); }
        else if (!global.fuelStationNear) cycle(v);
        eDown = 0;
    }
});
setInterval(function () {
    mp.vehicles.forEachInStreamRange(function (v) {
        var s = v.getVariable('siren');
        if (s !== undefined && s !== null) applySiren(v);
        if (v.getVariable('horn') && v.handle) { try { mp.game.invoke('0x9C8C6504B5B63D2C', v.handle, 150, mp.game.joaat('HELDDOWN'), false); } catch (e) {} }
    });
}, 100);
