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
var OLD_Z = [[-120, -1600], [-200, -1500], [80, -1750], [200, -1500], [380, -1900], [800, -2200], [1350, -1600], [1150, -1400], [750, -1050], [1100, -650], [-1250, -1500], [-1500, -650], [-650, -950], [400, -1000], [400, -800], [200, -2600]];
function purgeOld() {
    var kill = [];
    try {
        var b = mp.game.ui.getFirstBlipInfoId(9), guard = 0;
        while (b && mp.game.ui.doesBlipExist(b) && guard++ < 2000) {
            var c = mp.game.ui.getBlipInfoIdCoord(b);
            if (c && OLD_Z.some(function (o) { return Math.abs(o[0] - c.x) < 3 && Math.abs(o[1] - c.y) < 3; })) kill.push(b);
            b = mp.game.ui.getNextBlipInfoId(9);
        }
    } catch (e) {}
    kill.forEach(function (x) { try { mp.game.ui.removeBlip(x); } catch (e) {} });
}
setTimeout(purgeOld, 1000);
setTimeout(purgeOld, 8000);
mp.events.add('crime:zones', function (j) {
    purgeOld();
    var d; try { d = JSON.parse(j); } catch (e) { return; }
    cBlips.forEach(function (b) { try { mp.game.ui.removeBlip(b); } catch (e) {} });
    cBlips = [];
    cZones = d.z;
    var war = {}; (d.w || []).forEach(function (w) { war[w.z] = 1; });
    cZones.forEach(function (z) {
        try { var bb = areaBlip(z[2], z[3], d.s, z[4] || 4, z[4] ? (z[6] ? 170 : 120) : 45, !!war[z[0]]); if (bb) cBlips.push(bb); } catch (e) { mp.console.logError('[crime] zone blip: ' + e.message); }
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
        if (b[0] === d.me) cGarage = { x: b[6], y: b[7], z: b[8], c: b[5], d: b[9] || 0 };
    });
});
function nearGarage() {
    if (!cGarage) return false;
    var p = mp.players.local.position;
    return !mp.players.local.vehicle && mp.players.local.dimension === cGarage.d && mp.game.system.vdist(p.x, p.y, p.z, cGarage.x, cGarage.y, cGarage.z) < 2.5;
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
        if (gx * gx + gy * gy < 900 && me.dimension === cGarage.d) {
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

var cPts = null, cPtBlips = [], cNeutral = false, cPtHint = '';
function rgbOf(c) { var n = parseInt(String(c || '#ffffff').replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function ptBlip(x, y, z, sprite, col, name, short) {
    var b = mp.game.ui.addBlipForCoord(x, y, z);
    mp.game.ui.setBlipSprite(b, sprite); mp.game.ui.setBlipColour(b, col); mp.game.ui.setBlipScale(b, 0.75);
    mp.game.ui.setBlipAsShortRange(b, !!short);
    mp.game.invoke('0xF9113A30DE5C6670', 'STRING'); mp.game.invoke('0x6C188BE134E074AA', name); mp.game.invoke('0xBC38B49BCB83BC9B', b);
    return b;
}
mp.events.add('crime:points', function (j) {
    try { cPts = JSON.parse(j); } catch (e) { return; }
    cPtBlips.forEach(function (b) { try { mp.game.ui.removeBlip(b); } catch (e) {} });
    cPtBlips = [];
    try {
        var b = cPts.buyer;
        cPtBlips.push(ptBlip(b[0], b[1], b[2], 500, 2, 'Скупщик (нейтральная территория)', false));
        var r = mp.game.invoke('0x46818D79B1F7499A', b[0] + 0.0001, b[1] + 0.0001, b[2] + 0.0001, cPts.nr + 0.0001);
        mp.game.invoke('0x03D7FB09E75D6B7E', r, 0); mp.game.invoke('0x45FF974EEE1C8734', r, 90);
        cPtBlips.push(r);
        if (cPts.stash) cPtBlips.push(ptBlip(cPts.stash[0], cPts.stash[1], cPts.stash[2], 478, 0, 'Общак организации', true));
        if (cPts.bench) cPtBlips.push(ptBlip(cPts.bench[0], cPts.bench[1], cPts.bench[2], 566, 0, 'Верстак', true));
        if (cPts.garage) cPtBlips.push(ptBlip(cPts.garage[0], cPts.garage[1], cPts.garage[2], cPts.ug ? 50 : 357, 3, cPts.ug ? 'Въезд в подземный гараж' : 'Гараж организации', false));
        if (cPts.door) cPtBlips.push(ptBlip(cPts.door[0], cPts.door[1], cPts.door[2], 40, 0, 'Вход в особняк', true));
        if (cPts.ipl) try { mp.game.streaming.requestIpl(cPts.ipl); } catch (e) {}
        if (cPts.green) cPtBlips.push(ptBlip(cPts.green[0], cPts.green[1], cPts.green[2], 469, 2, 'Теплица', false));
    } catch (e) { mp.console.logError('[crime] points: ' + e.message); }
});
var cDoorArm = {}, cDoorBusy = 0;
function crDoorTrig(id, a, r, dim, what) {
    if (!a) return;
    var me = mp.players.local, p = me.position;
    if (me.dimension !== dim) { cDoorArm[id] = false; return; }
    var d = mp.game.system.vdist(p.x, p.y, p.z, a[0], a[1], a[2]);
    if (d > r + 2) { cDoorArm[id] = true; return; }
    if (d < r && cDoorArm[id] && Date.now() > cDoorBusy) {
        cDoorArm[id] = false; cDoorBusy = Date.now() + 2000;
        mp.game.cam.doScreenFadeOut(250);
        setTimeout(function () { mp.events.callRemote('srv:crime:door', what); }, 260);
        setTimeout(function () { mp.game.cam.doScreenFadeIn(400); }, 1100);
    }
}
setInterval(function () {
    if (!cPts) return;
    var me = mp.players.local, veh = me.vehicle;
    if (veh && veh.getPedInSeat(-1) !== me.handle) return;
    if (cPts.door && !veh) { crDoorTrig('din', cPts.door, 1.3, 0, 'in'); crDoorTrig('dout', cPts.din, 1.3, cPts.idim, 'out'); }
    if (cPts.ug && cPts.garage) {
        crDoorTrig('gin', cPts.garage, veh ? 4 : 1.5, 0, 'gin');
        if (veh) crDoorTrig('goutv', cPts.ug.drive, 3.5, cPts.ug.dim, 'gout'); else crDoorTrig('gout', cPts.ug.walk, 1.3, cPts.ug.dim, 'gout');
    }
}, 150);
mp.events.add('crime:neutral', function (on) { cNeutral = !!on; });
function near3(a, r) {
    if (!a) return false;
    var p = mp.players.local.position;
    return !mp.players.local.vehicle && mp.game.system.vdist(p.x, p.y, p.z, a[0], a[1], a[2]) < r;
}
var cRobV = null, cRobEnd = 0, cRobDur = 0;
function robTruck() {
    var me = mp.players.local, best = null;
    if (!mp.players.local.getVariable('org') || me.vehicle) return null;
    mp.vehicles.forEachInStreamRange(function (v) {
        var m = v.getVariable('govModel');
        if (v.getVariable('gov') !== 'army' || (m !== 'barracks' && m !== 'barracks3') || !(Number(v.getVariable('crates')) > 0)) return;
        var h = v.getHeading() * Math.PI / 180, rx = v.position.x + Math.sin(h) * 4.5, ry = v.position.y - Math.cos(h) * 4.5;
        if (mp.game.system.vdist(me.position.x, me.position.y, me.position.z, rx, ry, v.position.z) < 3) best = v;
    });
    return best;
}
mp.events.add('crime:robbing', function (sec) { cRobDur = sec * 1000; cRobEnd = sec ? Date.now() + cRobDur : 0; });
var cOrgV = null;
function rearOf(v) { var h = v.getHeading() * Math.PI / 180, mn = mp.game.gameplay.getModelDimensions(v.model).min; var back = Math.abs(mn.y) + 0.8; return { x: v.position.x + Math.sin(h) * back, y: v.position.y - Math.cos(h) * back, z: v.position.z }; }
function orgCar() {
    var me = mp.players.local, my = me.getVariable('org'), best = null;
    if (!my || me.vehicle) return null;
    mp.vehicles.forEachInStreamRange(function (v) {
        if (v.getVariable('org') !== my) return;
        var r; try { r = rearOf(v); } catch (e) { return; }
        if (mp.game.system.vdist(me.position.x, me.position.y, me.position.z, r.x, r.y, r.z) < 2.2) best = v;
    });
    return best;
}
function whichPt() {
    var carry = !!mp.players.local.getVariable('crateCarry');
    if (carry && cPts && near3(cPts.stash, 3)) return 'stashCrate';
    cOrgV = orgCar();
    if (cOrgV && carry) return 'load';
    if (cOrgV && !carry && Number(cOrgV.getVariable('loot')) > 0 && cPts && cPts.stash && Math.hypot(mp.players.local.position.x - cPts.stash[0], mp.players.local.position.y - cPts.stash[1]) < 40) return 'unload';
    cRobV = carry ? null : robTruck();
    if (cRobV) return 'rob';
    if (carry || !cPts) return '';
    if (near3(cPts.stash, 2.5)) return 'stash';
    if (near3(cPts.bench, 2.5)) return 'bench';
    if (near3(cPts.green, 4)) return 'green';
    if (near3(cPts.buyer, 2.5)) return 'buyer';
    return '';
}
setInterval(function () {
    var w = whichPt();
    if (w && w !== cPtHint) mp.events.call('hud:notify', 'ok', { stash: 'Общак: нажмите E', bench: 'Верстак: нажмите E', green: 'Теплица: нажмите E', buyer: 'Скупщик: нажмите E', rob: 'Армейский грузовик: E — вскрыть кузов / взять ящик', load: 'E — закинуть ящик в багажник', unload: 'E — достать ящик из багажника', stashCrate: 'E — сдать ящик в общак' }[w], 3000);
    cPtHint = w;
}, 400);
mp.keys.bind(0x45, false, function () {
    if (cOpen || mp.players.local.isTypingInTextChat || mp.gui.cursor.visible) return;
    var w = whichPt();
    if (w === 'stash') mp.events.callRemote('srv:crime:stash');
    else if (w === 'green') mp.events.callRemote('srv:crime:green');
    else if (w === 'buyer') mp.events.callRemote('srv:crime:buyer');
    else if (w === 'bench') mp.events.callRemote('srv:crime:bench');
    else if (w === 'rob' && cRobV) mp.events.callRemote('srv:crime:rob', cRobV.remoteId);
    else if (w === 'load' && cOrgV) mp.events.callRemote('srv:crime:load', cOrgV.remoteId);
    else if (w === 'unload' && cOrgV) mp.events.callRemote('srv:crime:unload', cOrgV.remoteId);
    else if (w === 'stashCrate') mp.events.callRemote('srv:crime:stashCrate');
});
mp.events.add('crime:stash', function (j) { if (cOpen && cBr) cBr.execute('window.stash && window.stash(' + JSON.stringify(j) + ');'); else cUI(true, 'window.stash && window.stash(' + JSON.stringify(j) + ');'); });
mp.events.add('crime:green', function (j) { if (cOpen && cBr) cBr.execute('window.green && window.green(' + JSON.stringify(j) + ');'); else cUI(true, 'window.green && window.green(' + JSON.stringify(j) + ');'); });
mp.events.add('crime:buyer', function (j) { if (cOpen && cBr) cBr.execute('window.buyer && window.buyer(' + JSON.stringify(j) + ');'); else cUI(true, 'window.buyer && window.buyer(' + JSON.stringify(j) + ');'); });
mp.events.add('cef:crime:stashOp', function (op, k, n) { mp.events.callRemote('srv:crime:stashOp', String(op), String(k), Number(n) || 1); });
mp.events.add('cef:crime:pot', function (op, i) { mp.events.callRemote('srv:crime:pot', String(op), Number(i) || 0); });
mp.events.add('crime:bench', function (j) { if (cOpen && cBr) cBr.execute('window.bench && window.bench(' + JSON.stringify(j) + ');'); else cUI(true, 'window.bench && window.bench(' + JSON.stringify(j) + ');'); });
mp.events.add('cef:crime:craft', function (i) { mp.events.callRemote('srv:crime:craft', Number(i)); });
mp.events.add('cef:crime:sell', function (k, n) { mp.events.callRemote('srv:crime:sell', String(k), Number(n) || 1); });
mp.events.add('render', function () {
    if (cNeutral) {
        mp.game.controls.disableControlAction(0, 24, true); mp.game.controls.disableControlAction(0, 25, true);
        mp.game.controls.disableControlAction(0, 140, true); mp.game.controls.disableControlAction(0, 141, true); mp.game.controls.disableControlAction(0, 142, true);
        mp.game.controls.disableControlAction(0, 69, true); mp.game.controls.disableControlAction(0, 92, true);
        mp.game.graphics.drawText('🕊 Нейтральная территория', [0.5, 0.955], { font: 4, color: [140, 230, 140, 220], scale: [0.36, 0.36], outline: true, centre: true });
    }
    if (mp.players.local.getVariable('crateCarry')) {
        [24, 25, 140, 141, 142, 21, 22, 23].forEach(function (c) { mp.game.controls.disableControlAction(0, c, true); });
    }
    var myOrg = mp.players.local.getVariable('org');
    if (myOrg) mp.vehicles.forEachInStreamRange(function (v) {
        if (v.getVariable('org') !== myOrg) return;
        var n = Number(v.getVariable('loot')) || 0; if (!n) return;
        var vp = v.position, lp = mp.players.local.position;
        if (mp.game.system.vdist(lp.x, lp.y, lp.z, vp.x, vp.y, vp.z) < 20) mp.game.graphics.drawText('📦 ' + n + '/4', [vp.x, vp.y, vp.z + 1.6], { font: 4, color: [255, 220, 120, 230], scale: [0.35, 0.35], outline: true, centre: true });
    });
    if (!cPts) return;
    var me = mp.players.local.position;
    if (cRobEnd > Date.now()) {
        var pr = 1 - (cRobEnd - Date.now()) / cRobDur;
        mp.game.graphics.drawRect(0.5, 0.9, 0.2, 0.018, 0, 0, 0, 160);
        mp.game.graphics.drawRect(0.4 + 0.1 * pr, 0.9, 0.2 * pr, 0.012, 230, 80, 60, 230);
        mp.game.graphics.drawText('Вскрываем ящики… не отходите', [0.5, 0.86], { font: 4, color: [255, 255, 255, 230], scale: [0.36, 0.36], outline: true, centre: true });
    }
    var mydim = mp.players.local.dimension;
    if (cPts.ug && mydim === cPts.ug.dim && !mp.players.local.vehicle) mp.vehicles.forEachInStreamRange(function (v) {
        var r = Number(v.getVariable('orgRank')) || 0; if (!r || v.dimension !== mydim) return;
        var vp = v.position; if (mp.game.system.vdist(me.x, me.y, me.z, vp.x, vp.y, vp.z) > 9) return;
        mp.game.graphics.drawText(String(v.getVariable('orgModel') || '').toUpperCase() + '~n~~c~с ранга ' + r, [vp.x, vp.y, vp.z + 1.3], { font: 4, color: [255, 255, 255, 210], scale: [0.3, 0.3], outline: true, centre: true });
    });
    if (cPts.ug && cPts.garage && mydim === 0 && mp.game.system.vdist(me.x, me.y, me.z, cPts.garage[0], cPts.garage[1], cPts.garage[2]) < 40) mp.game.graphics.drawMarker(1, cPts.garage[0], cPts.garage[1], cPts.garage[2] - 1, 0, 0, 0, 0, 0, 0, 5, 5, 0.6, 80, 150, 255, 90, false, false, 2, false, null, null, false);
    if (cPts.ug && mydim === cPts.ug.dim) mp.game.graphics.drawMarker(1, cPts.ug.drive[0], cPts.ug.drive[1], cPts.ug.drive[2] - 1, 0, 0, 0, 0, 0, 0, 4, 4, 0.6, 80, 150, 255, 90, false, false, 2, false, null, null, false);
    [[cPts.door, 0, 'Вход'], [cPts.din, cPts.idim, 'Выход'], [cPts.ug && cPts.garage, 0, 'Подземный гараж'], [cPts.ug && cPts.ug.walk, cPts.ug && cPts.ug.dim, 'Выход'], [cPts.ug && cPts.ug.drive, cPts.ug && cPts.ug.dim, 'Выезд на улицу']].forEach(function (x) {
        var a = x[0]; if (!a || mydim !== x[1]) return;
        if (mp.game.system.vdist(me.x, me.y, me.z, a[0], a[1], a[2]) > 12) return;
        mp.game.graphics.drawText(x[2], [a[0], a[1], a[2] + 1.1], { font: 4, color: [255, 255, 255, 190], scale: [0.32, 0.32], outline: true, centre: true });
    });
    [['stash', cPts.stash, 29, cPts.c], ['bench', cPts.bench, 29, cPts.c], ['green', cPts.green, 1, '#6fd36a'], ['buyer', cPts.buyer, 29, '#6fd36a']].forEach(function (m) {
        var a = m[1]; if (!a) return;
        var dx = me.x - a[0], dy = me.y - a[1];
        if (dx * dx + dy * dy > 900) return;
        var c = rgbOf(m[3]);
        mp.game.graphics.drawMarker(m[2], a[0], a[1], a[2] - (m[2] === 1 ? 1 : 0), 0, 0, 0, 0, 0, 0, m[2] === 1 ? 2.5 : 0.8, m[2] === 1 ? 2.5 : 0.8, m[2] === 1 ? 0.6 : 0.8, c[0], c[1], c[2], 170, m[2] !== 1, true, 2, false, null, null, false);
    });
});

var captOpenNow = false;
mp.events.add('crime:capt', function (j) {
    if (captOpenNow && cOpen && cBr) cBr.execute('window.capt && window.capt(' + JSON.stringify(j) + ');');
    else { captOpenNow = true; cUI(true, 'window.capt && window.capt(' + JSON.stringify(j) + ');'); }
});
mp.events.add('crime:captMsg', function (t, ok) { if (cBr) cBr.execute('window.captMsg && window.captMsg(' + JSON.stringify(String(t)) + ',' + (ok ? 1 : 0) + ');'); });
mp.events.add('cef:crime:capt', function (zi, def) { mp.events.callRemote('srv:crime:capt', Number(zi), String(def || '')); });
mp.events.add('cef:crime:close', function () { captOpenNow = false; });
