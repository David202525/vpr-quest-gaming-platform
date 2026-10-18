var MODELS = ['prop_traffic_01a', 'prop_traffic_01b', 'prop_traffic_01d', 'prop_traffic_02a', 'prop_traffic_02b', 'prop_traffic_03a', 'prop_traffic_03b', 'prop_traffic_lightset_01'].map(function (m) { return mp.game.joaat(m); });
var D = { on: true, cams: [], cycle: 40000, green: 16000, yellow: 3000 };
var timeOff = 0, worldOn = true, showUntil = 0, flashUntil = 0;
var lights = {};

mp.events.add('redcam:data', function (j, t) { try { D = JSON.parse(j); } catch (e) {} timeOff = Number(t) - Date.now(); });
mp.events.add('redcam:time', function (t) { timeOff = Number(t) - Date.now(); });
mp.events.add('adm:world', function (j) { try { worldOn = JSON.parse(j).traffic !== false; } catch (e) {} if (!worldOn) lights = {}; });
mp.events.add('redcam:show', function () { showUntil = showUntil > Date.now() ? 0 : Date.now() + 600000; mp.gui.chat.push('!{#7fd4ff}Показ камер ' + (showUntil ? 'включён на 10 минут' : 'выключен')); });
mp.events.add('traffic:flash', function () {
    flashUntil = Date.now() + 350;
    try { mp.game.audio.playSoundFrontend(-1, 'Camera_Shoot', 'Phone_Soundset_Franklin', true); } catch (e) {}
});

function phase(g) {
    var t = ((Date.now() + timeOff) % D.cycle + D.cycle) % D.cycle;
    if (g) t = (t + D.cycle / 2) % D.cycle;
    return t < D.green ? 0 : t < D.green + D.yellow ? 2 : 1;
}
function axisGroup(h) { h = ((h % 180) + 180) % 180; return h >= 45 && h < 135 ? 1 : 0; }
function coords(o) { var E = mp.game.entity; return E.getCoords ? E.getCoords(o, false) : E.getEntityCoords(o, false); }
function heading(o) { var E = mp.game.entity; return E.getHeading ? E.getHeading(o) : E.getEntityHeading(o); }

function findLights(x, y, z, r) {
    var out = [];
    MODELS.forEach(function (m) {
        var o = 0;
        try { o = mp.game.object.getClosestObjectOfType(x, y, z, r, m, false, false, false); } catch (e) {}
        if (o) out.push(o);
    });
    return out;
}

mp.events.add('redcam:findLight', function (x, y, z, h) {
    var rad = h * Math.PI / 180, fx = -Math.sin(rad), fy = Math.cos(rad);
    var best = null, bs = 1e9;
    [10, 20, 30, 40].forEach(function (d) {
        findLights(x + fx * d, y + fy * d, z, 18).forEach(function (o) {
            try {
                var c = coords(o);
                var along = (c.x - x) * fx + (c.y - y) * fy;
                if (along < 2 || along > 60) return;
                var lat = Math.abs((c.x - x) * fy - (c.y - y) * fx);
                var sc = along + lat * 2;
                if (sc < bs) { bs = sc; best = c; }
            } catch (e) {}
        });
    });
    if (best) mp.events.callRemote('srv:redcam:light', best.x, best.y, best.z);
    else mp.events.callRemote('srv:redcam:light', 0, 0, 0);
});

setInterval(function () {
    if (!worldOn) return;
    var pos = mp.players.local.position;
    [[0, 0], [35, 0], [-35, 0], [0, 35], [0, -35], [30, 30], [-30, -30], [30, -30], [-30, 30]].forEach(function (o) {
        findLights(pos.x + o[0], pos.y + o[1], pos.z, 30).forEach(function (h) {
            if (lights[h]) return;
            try {
                var c = coords(h); if (!c || !isFinite(c.x)) return;
                var g = axisGroup(heading(h));
                (D.cams || []).forEach(function (k) { if (k.lx && Math.hypot(c.x - k.lx, c.y - k.ly) < 4) g = k.g; });
                lights[h] = { x: c.x, y: c.y, g: g, st: -1 };
            } catch (e) {}
        });
    });
    Object.keys(lights).forEach(function (k) { var L = lights[k]; if (Math.hypot(L.x - pos.x, L.y - pos.y) > 200) delete lights[k]; });
}, 1500);

setInterval(function () {
    if (!worldOn) return;
    var force = Date.now() % 3000 < 260;
    Object.keys(lights).forEach(function (k) {
        var L = lights[k], s = phase(L.g);
        if (s === L.st && !force) return;
        L.st = s;
        try { mp.game.invoke('0x57C5DB656185EAC4', Number(k), s); } catch (e) {}
    });
}, 250);

var prev = {}, sentAt = 0;
setInterval(function () {
    if (!D.on || !D.cams.length) return;
    var p = mp.players.local, v = p.vehicle;
    if (!v) { prev = {}; return; }
    try { if (v.getPedInSeat(-1) !== p.handle) return; } catch (e) { return; }
    try { var cls = v.getClass(); if (cls === 18 || cls === 13 || cls === 14 || cls === 15 || cls === 16 || cls === 21) return; } catch (e) {}
    var pos = v.position, vel = v.getVelocity(), sp = Math.hypot(vel.x, vel.y);
    for (var i = 0; i < D.cams.length; i++) {
        var k = D.cams[i];
        var rx = pos.x - k.x, ry = pos.y - k.y;
        if (rx * rx + ry * ry > 3600) { delete prev[i]; continue; }
        var rad = k.h * Math.PI / 180, fx = -Math.sin(rad), fy = Math.cos(rad);
        var along = rx * fx + ry * fy, lat = Math.abs(rx * fy - ry * fx);
        var was = prev[i];
        prev[i] = along;
        if (was === undefined || lat > k.w / 2 || sp < 3) continue;
        if ((vel.x * fx + vel.y * fy) / sp < 0.5) continue;
        if (was < 0 && along >= 0 && phase(k.g) === 1 && Date.now() - sentAt > 5000) {
            sentAt = Date.now();
            mp.events.callRemote('srv:redcam:hit', i);
        }
    }
}, 80);

mp.events.add('render', function () {
    if (flashUntil > Date.now()) mp.game.graphics.drawRect(0.5, 0.5, 1, 1, 255, 255, 255, Math.floor(200 * (flashUntil - Date.now()) / 350), false);
    if (showUntil < Date.now()) return;
    var pos = mp.players.local.position;
    D.cams.forEach(function (k, i) {
        if (Math.hypot(pos.x - k.x, pos.y - k.y) > 120) return;
        var rad = k.h * Math.PI / 180, fx = -Math.sin(rad), fy = Math.cos(rad), px = fy, py = -fx, w = k.w / 2;
        var s = phase(k.g), c = s === 1 ? [255, 60, 60] : s === 2 ? [255, 200, 40] : [80, 220, 100];
        mp.game.graphics.drawLine(k.x - px * w, k.y - py * w, k.z + 0.2, k.x + px * w, k.y + py * w, k.z + 0.2, c[0], c[1], c[2], 255);
        mp.game.graphics.drawLine(k.x, k.y, k.z + 0.2, k.x + fx * 4, k.y + fy * 4, k.z + 0.2, 255, 255, 255, 200);
        mp.game.graphics.drawText('📸 №' + (i + 1) + ' ' + k.n, [k.x, k.y, k.z + 1.2], { font: 4, color: [c[0], c[1], c[2], 240], scale: [0.35, 0.35], outline: true, centre: true });
        if (k.lx) mp.game.graphics.drawLine(k.x, k.y, k.z + 0.2, k.lx, k.ly, k.lz + 2, 255, 255, 255, 90);
    });
});
