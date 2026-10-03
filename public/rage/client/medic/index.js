var busyEnd = 0;
var busyLabel = '';
var lastE = 0;
var CALL_BLIPS = {};

function notify(t) {
    try { mp.game.graphics.notify(t); } catch (e) {}
}

mp.keys.bind(0x45, true, function () {
    if (mp.gui.cursor.visible) return;
    if (Date.now() - lastE < 600) return;
    lastE = Date.now();
    mp.events.callRemote('medic:interact');
});

mp.events.add('medic:busy', function (ms, label) {
    busyEnd = Date.now() + ms;
    busyLabel = label;
});

mp.events.add('medic:hint', function (t) {
    notify(t);
});

mp.events.add('medic:alert', function (raw) {
    var c;
    try { c = JSON.parse(raw); } catch (e) { return; }
    if (CALL_BLIPS[c.id]) return;
    try {
        CALL_BLIPS[c.id] = mp.blips.new(153, new mp.Vector3(c.x, c.y, c.z), {
            name: '\u0412\u044b\u0437\u043e\u0432 #' + c.id + ' ' + c.name,
            color: 1,
            shortRange: false
        });
        CALL_BLIPS[c.id].setFlashes(true);
    } catch (e) {}
    notify('~r~EMS~w~ \u0432\u044b\u0437\u043e\u0432 #' + c.id + '~n~' + c.name + ': ' + c.reason + '~n~~y~/accept ' + c.id);
    try { mp.game.audio.playSoundFrontend(-1, 'Event_Message_Purple', 'GTAO_FM_Events_Soundset', true); } catch (e) {}
});

mp.events.add('medic:callClear', function (id) {
    var b = CALL_BLIPS[id];
    if (b) {
        try { b.destroy(); } catch (e) {}
        delete CALL_BLIPS[id];
    }
});

mp.events.add('medic:dutyOff', function () {
    for (var id in CALL_BLIPS) {
        try { CALL_BLIPS[id].destroy(); } catch (e) {}
    }
    CALL_BLIPS = {};
});

mp.events.add('medic:route', function (x, y) {
    try { mp.game.ui.setNewWaypoint(x, y); } catch (e) {}
});

mp.events.add('render', function () {
    var now = Date.now();
    if (busyEnd <= now) return;
    mp.game.controls.disableControlAction(0, 30, true);
    mp.game.controls.disableControlAction(0, 31, true);
    mp.game.controls.disableControlAction(0, 21, true);
    mp.game.controls.disableControlAction(0, 22, true);
    mp.game.controls.disableControlAction(0, 24, true);
    mp.game.graphics.drawText(busyLabel + ': ' + Math.ceil((busyEnd - now) / 1000) + ' \u0441\u0435\u043a', [0.5, 0.86], {
        font: 4, color: [255, 255, 255, 235], scale: [0.55, 0.55], outline: true
    });
});

mp.game.streaming.removeIpl('RC12B_Destroyed');
['RC12B_Default', 'RC12B_Fixed', 'RC12B_HospitalInterior'].forEach(function (n) {
    mp.game.streaming.requestIpl(n);
});
