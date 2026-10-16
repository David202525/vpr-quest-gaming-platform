var NAMES = ['Мигалки выключены', 'Мигалки без звука', 'Мигалки со звуком'];
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
mp.keys.bind(0x51, false, function () {
    var me = mp.players.local, v = me.vehicle;
    if (!v || blocked() || !isEmergency(v)) return;
    if (v.getPedInSeat(-1) !== me.handle) return mp.events.call('hud:notify', 'warn', 'Мигалками управляет водитель', 2500);
    var m = ((Number(v.getVariable('siren')) || 0) + 1) % 3;
    mp.events.callRemote('srv:siren:set', m);
    mp.events.call('hud:notify', m ? 'ok' : 'warn', NAMES[m] + ' · Q — сменить режим', 2500);
});
mp.events.addDataHandler('siren', function (v) { if (v && v.type === 'vehicle') applySiren(v); });
mp.events.add('entityStreamIn', function (e) { if (e && e.type === 'vehicle') applySiren(e); });
mp.events.add('render', function () {
    var v = mp.players.local.vehicle;
    if (v && isEmergency(v)) mp.game.controls.disableControlAction(0, 86, true);
});
setInterval(function () {
    mp.vehicles.forEachInStreamRange(function (v) { if (v.getVariable('siren') !== undefined && v.getVariable('siren') !== null) applySiren(v); });
}, 500);
