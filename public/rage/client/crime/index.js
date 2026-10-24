var cZones = [], cBlips = [], cWar = null, cDealer = null, cAdd = { lv: 0, high: 0, wd: 0 }, cBr = null, cOpen = false, cDHint = false;
function cUI(on, code) {
    if (on && !cBr) cBr = mp.browsers.new('package://cef/crime/index.html');
    if (!cBr) return;
    cBr.active = on; cOpen = on; global.crimeOpen = on;
    mp.gui.cursor.show(on, on);
    mp.gui.chat.activate(!on);
    if (on && code) { var run = function () { if (cBr) cBr.execute(code); }; setTimeout(run, 120); setTimeout(run, 600); }
}
var cBases = [], cGarage = null, cGHint = false;
function fl(n) { n = Number(n) || 0; return n % 1 === 0 ? n + 0.0001 : n; }
function areaBlip(x, y, w, col, alpha, flash) {
    var b = mp.game.invoke('0xCE5D0E5E315DB238', fl(x), fl(y), fl(30), fl(w), fl(w));
    if (!b) return 0;
    mp.game.invoke('0xF87683CDF73C3F6E', b, 0);
    mp.game.invoke('0x03D7FB09E75D6B7E', b, col);
    mp.game.invoke('0x45FF974EEE1C8734', b, alpha);
    mp.game.invoke('0xBE8BE4FE60E27B72', b, true);
    if (flash) mp.game.invoke('0xB14552383D39CE3E', b, true);
    return b;
}
mp.events.add('crime:zones', function (j) {
    var d; try { d = JSON.parse(j); } catch (e) { return; }
    cBlips.forEach(function (b) { try { mp.game.ui.removeBlip(b); } catch (e) {} });
    cBlips = [];
    cZones = d.z;
    var war = {}; (d.w || []).forEach(function (w) { war[w.z] = 1; });
    cZones.forEach(function (z) {
        try { var bb = areaBlip(z[2], z[3], d.s - 3, z[4] || 4, z[4] ? (z[6] ? 170 : 120) : 45, !!war[z[0]]); if (bb) cBlips.push(bb); } catch (e) { mp.console.logError('[crime] zone blip: ' + e.message); }
    });
    cBases = d.b || [];
    cGarage = null;
    cBases.forEach(function (b) {
        try {
            var ab = areaBlip(b[2], b[3], d.bs, b[4], 230, false); if (ab) cBlips.push(ab);
            var ic = mp.game.ui.addBlipForCoord(b[2], b[3], 30);
            mp.game.ui.setBlipSprite(ic, b[0] === d.me ? 40 : 84);
            mp.game.ui.setBlipColour(ic, b[4]);
            mp.game.ui.setBlipScale(ic, 0.8);
            mp.game.ui.setBlipAsShortRange(ic, b[0] !== d.me);
            mp.game.invoke('0xF9113A30DE5C6670', 'STRING');
            mp.game.invoke('0x6C188BE134E074AA', 'База: ' + b[1]);
            mp.game.invoke('0xBC38B49BCB83BC9B', ic);
            cBlips.push(ic);
        } catch (e) {}
        if (b[0] === d.me) cGarage = { x: b[6], y: b[7], z: b[8], c: b[5] };
    });
});
function nearGarage() {
    if (!cGarage) return false;
    var p = mp.players.local.position;
    return !mp.players.local.vehicle && mp.game.system.vdist(p.x, p.y, p.z, cGarage.x, cGarage.y, cGarage.z) < 2.5;
}
setInterval(function () {
    var n = nearGarage();
    if (n && !cGHint) mp.events.call('hud:notify', 'ok', 'Гараж организации: нажмите E', 3000);
    cGHint = n;
}, 400);
mp.events.add('crime:war', function (j) { if (!j) { cWar = null; return; } try { cWar = JSON.parse(j); cWar.at = Date.now(); } catch (e) {} });
mp.events.add('crime:dealer', function (x, y, z, mine) {
    cDealer = [x, y, z, mine];
});
mp.events.add('crime:addict', function (lv, high, wd) {
    var was = cAdd.wd, wasH = cAdd.high;
    cAdd = { lv: lv, high: high, wd: wd };
    try {
        if (high && !wasH) mp.game.graphics.startScreenEffect('DrugsMichaelAliensFight', 0, true);
        if (!high && wasH) mp.game.graphics.stopScreenEffect('DrugsMichaelAliensFight');
        if (wd && !was) mp.game.graphics.startScreenEffect('DeathFailOut', 0, true);
        if (!wd && was) mp.game.graphics.stopScreenEffect('DeathFailOut');
    } catch (e) {}
});
setInterval(function () {
    if (!cAdd.wd) return;
    try { mp.game.cam.shakeGameplayCam('DRUNK_SHAKE', Math.min(2, cAdd.lv / 40)); } catch (e) {}
    if (Math.random() < 0.3) mp.events.call('hud:notify', 'error', ['Вас трясёт…', 'Ломает кости', 'Холодный пот', 'Нужна доза…'][Math.floor(Math.random() * 4)], 2500);
}, 15000);

function nearDealer() {
    if (!cDealer) return false;
    var p = mp.players.local.position;
    return !mp.players.local.vehicle && mp.game.system.vdist(p.x, p.y, p.z, cDealer[0], cDealer[1], cDealer[2]) < 2.5;
}
setInterval(function () {
    var n = nearDealer();
    if (n && !cDHint) mp.events.call('hud:notify', 'ok', cDealer[3] ? 'Поставщик: нажмите E' : 'Подозрительный тип…', 3000);
    cDHint = n;
}, 400);
mp.keys.bind(0x45, false, function () {
    if (!cOpen && nearGarage() && !mp.players.local.isTypingInTextChat && !mp.gui.cursor.visible) { mp.events.callRemote('srv:crime:garage'); return; }
    if (cOpen || !nearDealer() || mp.players.local.isTypingInTextChat || mp.gui.cursor.visible) return;
    if (global.jobHere && global.jobHere()) return;
    mp.events.callRemote('srv:crime:dealer');
});
mp.events.add('crime:shop', function (j) { cUI(true, 'window.shop && window.shop(' + JSON.stringify(j) + ');'); });
mp.events.add('crime:garage', function (j) { cUI(true, 'window.garage && window.garage(' + JSON.stringify(j) + ');'); });
mp.events.add('crime:close', function () { if (cOpen) cUI(false); });
mp.events.add('cef:crime:car', function (m) { mp.events.callRemote('srv:crime:car', String(m)); });
mp.events.add('crime:search', function (j) { cUI(true, 'window.search && window.search(' + JSON.stringify(j) + ');'); });
mp.events.add('cef:crime:close', function () { cUI(false); });
mp.events.add('cef:crime:buy', function (k, q) { mp.events.callRemote('srv:crime:buy', String(k), Number(q) || 1); });
mp.events.add('cef:crime:seize', function (id, j) { cUI(false); mp.events.callRemote('srv:crime:seize', Number(id), j); });

mp.events.add('render', function () {
    var me = mp.players.local, pos = me.position;
    if (cDealer && cDealer[3]) {
        var dx = pos.x - cDealer[0], dy = pos.y - cDealer[1];
        if (dx * dx + dy * dy < 400) mp.game.graphics.drawText('🌿 Поставщик', [cDealer[0], cDealer[1], cDealer[2] + 1.2], { font: 4, color: [140, 230, 120, 220], scale: [0.38, 0.38], outline: true, centre: true });
    }
    if (cGarage) {
        var gx = pos.x - cGarage.x, gy = pos.y - cGarage.y;
        if (gx * gx + gy * gy < 900) {
            var col = parseInt(cGarage.c.replace('#', ''), 16);
            mp.game.graphics.drawMarker(36, cGarage.x, cGarage.y, cGarage.z, 0, 0, 0, 0, 0, 0, 1, 1, 1, (col >> 16) & 255, (col >> 8) & 255, col & 255, 200, true, true, 2, false, null, null, false);
        }
    }
    if (cWar) {
        var left = Math.max(0, cWar.left - Math.floor((Date.now() - cWar.at) / 1000));
        mp.game.graphics.drawText('⚔ ВОЙНА · ' + cWar.n + ' · ' + Math.floor(left / 60) + ':' + ('0' + left % 60).slice(-2), [0.5, 0.03], { font: 4, color: [255, 90, 90, 255], scale: [0.5, 0.5], outline: true, centre: true });
        mp.game.graphics.drawText(cWar.a + ': ' + cWar.ka + ' убийств · ' + cWar.ia + ' на точке    |    ' + cWar.d + ': ' + cWar.kd + ' убийств · ' + cWar.id + ' на точке', [0.5, 0.065], { font: 4, color: [255, 255, 255, 230], scale: [0.36, 0.36], outline: true, centre: true });
    }
    if (cAdd.lv > 0) {
        var c = cAdd.wd ? [255, 80, 80, 230] : cAdd.high ? [160, 255, 140, 230] : [200, 200, 200, 160];
        mp.game.graphics.drawText('🌿 ' + cAdd.lv + '%' + (cAdd.wd ? ' ЛОМКА' : cAdd.high ? ' кайф' : ''), [0.085, 0.77], { font: 4, color: c, scale: [0.34, 0.34], outline: true, centre: true });
    }
    if (cAdd.high) { try { mp.game.controls.disableControlAction(0, 24, false); } catch (e) {} }
});
