var MODELS = ['prop_traffic_01a', 'prop_traffic_01b', 'prop_traffic_01d', 'prop_traffic_02a', 'prop_traffic_02b', 'prop_traffic_03a', 'prop_traffic_03b', 'prop_traffic_lightset_01'].map(function (m) { return mp.game.joaat(m); });
var CYCLE = 40000;
var timeOff = 0, enabled = true;
var lights = {};
var flashUntil = 0;

mp.events.add('traffic:sync', function (t) { timeOff = Number(t) - Date.now(); });
mp.events.add('adm:world', function (json) { try { enabled = JSON.parse(json).traffic !== false; } catch (e) {} if (!enabled) lights = {}; });
mp.events.add('traffic:flash', function () {
    flashUntil = Date.now() + 350;
    try { mp.game.audio.playSoundFrontend(-1, 'Camera_Shoot', 'Phone_Soundset_Franklin', true); } catch (e) {}
});

function phase(group) {
    var t = ((Date.now() + timeOff) % CYCLE + CYCLE) % CYCLE;
    if (group) t = (t + CYCLE / 2) % CYCLE;
    if (t < 16000) return 0;
    if (t < 19000) return 2;
    return 1;
}
function groupOf(h) {
    h = ((h % 180) + 180) % 180;
    return h >= 45 && h < 135 ? 1 : 0;
}
function scanAt(x, y, z, r) {
    MODELS.forEach(function (m) {
        var o = 0;
        try { o = mp.game.object.getClosestObjectOfType(x, y, z, r, m, false, false, false); } catch (e) {}
        if (!o || lights[o]) return;
        try {
            var E = mp.game.entity;
            var pos = E.getCoords ? E.getCoords(o, false) : E.getEntityCoords(o, false);
            var h = E.getHeading ? E.getHeading(o) : E.getEntityHeading(o);
            if (!pos || !isFinite(pos.x)) return;
            var rad = h * Math.PI / 180;
            lights[o] = { x: pos.x, y: pos.y, z: pos.z, fx: -Math.sin(rad), fy: Math.cos(rad), g: groupOf(h), st: -1, seen: Date.now() };
        } catch (e) {}
    });
}
setInterval(function () {
    if (!enabled) return;
    var p = mp.players.local, pos = p.position;
    var offs = [[0, 0], [35, 0], [-35, 0], [0, 35], [0, -35], [30, 30], [-30, -30], [30, -30], [-30, 30]];
    offs.forEach(function (o) { scanAt(pos.x + o[0], pos.y + o[1], pos.z, 30); });
    var v = p.vehicle;
    if (v) {
        var vel = v.getVelocity(), sp = Math.hypot(vel.x, vel.y);
        if (sp > 2) { var dx = vel.x / sp, dy = vel.y / sp; [15, 30, 45].forEach(function (d) { scanAt(pos.x + dx * d, pos.y + dy * d, pos.z, 18); }); }
    }
    var now = Date.now();
    Object.keys(lights).forEach(function (k) {
        var L = lights[k];
        if (Math.hypot(L.x - pos.x, L.y - pos.y) > 180) { delete lights[k]; return; }
    });
}, 1200);

setInterval(function () {
    if (!enabled) return;
    var force = Date.now() % 3000 < 260;
    Object.keys(lights).forEach(function (k) {
        var L = lights[k], s = phase(L.g);
        if (s === L.st && !force) return;
        L.st = s;
        try { mp.game.invoke('0x57C5DB656185EAC4', Number(k), s); } catch (e) {}
    });
}, 250);

var track = {};
var reported = 0;
setInterval(function () {
    if (!enabled) return;
    var p = mp.players.local, v = p.vehicle;
    if (!v) { track = {}; return; }
    try { if (v.getPedInSeat(-1) !== p.handle) return; } catch (e) { return; }
    try { var cls = v.getClass(); if (cls === 18 || cls === 13 || cls === 14 || cls === 15 || cls === 16 || cls === 21) return; } catch (e) {}
    if ((Number(v.getVariable('siren')) || 0) > 0) return;
    var vel = v.getVelocity(), sp = Math.hypot(vel.x, vel.y);
    var pos = v.position;
    if (sp < 4) { track = {}; return; }
    var dx = vel.x / sp, dy = vel.y / sp;
    Object.keys(lights).forEach(function (k) {
        var L = lights[k];
        var rx = L.x - pos.x, ry = L.y - pos.y;
        var along = rx * dx + ry * dy;
        var lat = Math.abs(rx * dy - ry * dx);
        if (Math.abs(along) > 45 || lat > 16) { delete track[k]; return; }
        if (Math.abs(L.fx * dx + L.fy * dy) < 0.8) { delete track[k]; return; }
        var red = phase(L.g) === 1;
        var T = track[k] || (track[k] = { prev: along, redSeen: false });
        if (along > 8 && along < 35) T.redSeen = red;
        if (T.prev > 0 && along <= 0 && T.redSeen && red && Date.now() - reported > 45000) {
            reported = Date.now();
            mp.events.callRemote('srv:traffic:red', L.x, L.y);
        }
        T.prev = along;
    });
}, 100);

mp.events.add('render', function () {
    if (flashUntil > Date.now()) {
        var a = Math.floor(200 * (flashUntil - Date.now()) / 350);
        mp.game.graphics.drawRect(0.5, 0.5, 1, 1, 255, 255, 255, a, false);
    }
});
