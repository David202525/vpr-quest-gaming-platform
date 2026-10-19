mp.nametags.enabled = false;

var names = {};
var FEMALE = mp.game.joaat('mp_f_freemode_01');
var intBrowser = mp.browsers.new('package://cef/social/index.html');
var intTarget = null;
var offerUntil = 0;
global.intOpen = false;

mp.events.add('social:names', function (json) {
    try { names = JSON.parse(json) || {}; } catch (e) { names = {}; }
});

function sidOf(p) { return Number(p.getVariable('sid')) || 0; }
function titleOf(p) {
    var s = sidOf(p);
    if (s && names[s]) return names[s];
    return p.model === FEMALE ? 'Гражданка' : 'Гражданин';
}
function intExec(code) { if (intBrowser) intBrowser.execute(code); }

mp.events.add('render', function () {
    if (global.authOpen || global.creatorOpen) return;
    var me = mp.players.local;
    var mp0 = me.position;
    mp.players.forEachInStreamRange(function (p) {
        if (p === me || !p.handle || p.dimension !== me.dimension) return;
        var s = sidOf(p);
        if (!s) return;
        if (p.getAlpha && p.getAlpha() < 50) return;
        var pos = p.position;
        var d = mp.game.system.vdist(mp0.x, mp0.y, mp0.z, pos.x, pos.y, pos.z);
        if (d > 20) return;
        if (!me.hasClearLosToEntity(p.handle, 17)) return;
        var head = p.getBoneCoords(12844, 0, 0, 0);
        var z = (head ? head.z : pos.z + 0.7) + 0.38 + d * 0.012;
        var k = Math.max(0.24, 0.42 - d * 0.009);
        var known = !!names[s];
        mp.game.graphics.drawText(titleOf(p), [pos.x, pos.y, z], { font: 4, color: known ? [255, 255, 255, 235] : [210, 210, 220, 225], scale: [k, k], outline: true, centre: true });
        mp.game.graphics.drawText('#' + s, [pos.x, pos.y, z - 0.1 - d * 0.004], { font: 4, color: [193, 140, 255, 235], scale: [k * 0.85, k * 0.85], outline: true, centre: true });
    });
});

function nearest() {
    var me = mp.players.local;
    var best = null, bd = 3;
    mp.players.forEachInStreamRange(function (p) {
        if (p === me || !p.handle || p.dimension !== me.dimension || !sidOf(p)) return;
        var d = mp.game.system.vdist(me.position.x, me.position.y, me.position.z, p.position.x, p.position.y, p.position.z);
        if (d < bd) { bd = d; best = p; }
    });
    return best;
}

function intClose() {
    if (!global.intOpen) return;
    global.intOpen = false;
    intTarget = null;
    intExec('window.intClose && window.intClose();');
    if (typeof cursorSync === 'function') cursorSync(); else mp.gui.cursor.show(false, false);
    mp.gui.chat.activate(true);
}

var SEAT_DOORS = ['door_pside_f', 'door_dside_r', 'door_pside_r'];
function nearestVehicle(max) {
    var me = mp.players.local, best = null, bd = max;
    mp.vehicles.forEachInStreamRange(function (v) {
        if (!v.handle || v.dimension !== me.dimension) return;
        var d = mp.game.system.vdist(me.position.x, me.position.y, me.position.z, v.position.x, v.position.y, v.position.z);
        if (d < bd) { bd = d; best = v; }
    });
    return best ? { v: best, d: bd } : null;
}
function enterAsPassenger() {
    var me = mp.players.local;
    if (me.getVariable('cuffed')) return false;
    var nv = nearestVehicle(5.5);
    if (!nv) {
        var big = nearestVehicle(14);
        if (big) { var mx = 0; try { mx = big.v.getMaxNumberOfPassengers(); } catch (e) {} if (mx >= 5) nv = big; }
    }
    if (!nv) return false;
    var pl = nearest();
    if (pl) {
        var dp = mp.game.system.vdist(me.position.x, me.position.y, me.position.z, pl.position.x, pl.position.y, pl.position.z);
        if (dp < 1.6 && dp < nv.d - 1) return false;
    }
    var v = nv.v, max = 0;
    try { max = v.getMaxNumberOfPassengers(); } catch (e) { max = 1; }
    if (max < 1) { mp.events.call('hud:notify', 'warn', 'В этом транспорте нет мест для пассажира', 2500); return true; }
    var best = -2, bd = 1e9;
    for (var s = 0; s < max; s++) {
        var free = true;
        try { free = v.isSeatFree(s); } catch (e) {}
        if (!free) continue;
        var d = 0;
        try {
            var bi = SEAT_DOORS[s] ? v.getBoneIndexByName(SEAT_DOORS[s]) : -1;
            if (bi >= 0) { var bp = v.getWorldPositionOfBone(bi); d = mp.game.system.vdist(me.position.x, me.position.y, me.position.z, bp.x, bp.y, bp.z); }
            else d = 50 + s;
        } catch (e) { d = 50 + s; }
        if (d < bd) { bd = d; best = s; }
    }
    if (best < -1) { mp.events.call('hud:notify', 'warn', 'Свободных мест нет', 2500); return true; }
    if (max >= 3) {
        var cls = 0; try { cls = v.getClass(); } catch (e) {}
        if (max >= 5 || cls === 15 || cls === 16 || cls === 19 || cls === 20) {
            if (!(bd < 2.5 && best <= 2)) {
                var seat = best;
                try { me.taskWarpIntoVehicle(v.handle, seat); } catch (e) { try { me.setIntoVehicle(v.handle, seat); } catch (e2) { return false; } }
                mp.events.call('hud:notify', 'ok', 'Вы заняли место №' + (seat + 2) + ' из ' + (max + 1), 2000);
                return true;
            }
        }
    }
    try { me.taskEnterVehicle(v.handle, 6000, best, 1.0, 1, 0); } catch (e) { return false; }
    return true;
}

function intOpenMenu() {
    var t = nearest();
    if (!t) { mp.events.call('hud:notify', 'warn', 'Рядом никого нет', 2500); return; }
    intTarget = t;
    global.intOpen = true;
    var items = [
        { id: 'shake', t: 'Пожать руку', ic: '🤝', d: 'Познакомиться — увидите ник друг друга' },
        { id: 'passport', t: 'Паспорт', ic: '🪪', d: 'Показать паспорт — человек узнает ваш ник' },
        { id: 'pay', t: 'Дать денег', ic: '💵', d: 'Передать наличные' },
        { id: 'wave', t: 'Помахать', ic: '👋', d: 'Поприветствовать' }
    ];
    if (mp.players.local.getVariable('cop')) {
        items.push({ id: 'chklic', t: 'Проверить права', ic: '📋', d: 'Проверить категории и выбрать наказание' });
        items.push({ id: 'revdrive', t: 'Изъять права', ic: '🚗', d: 'Забрать водительское удостоверение' });
        items.push({ id: 'revgun', t: 'Изъять лиц. оружия', ic: '🔫', d: 'Забрать лицензию на оружие' });
    }
    var who = titleOf(t) + ' · #' + sidOf(t);
    intExec('window.intOpen && window.intOpen(' + JSON.stringify({ who: who, items: items }) + ');');
    mp.gui.chat.activate(false);
    mp.gui.cursor.show(true, true);
}

mp.keys.bind(0x47, false, function () {
    if (global.authOpen || global.creatorOpen || global.gateEditOpen) return;
    if (global.intOpen) { intClose(); return; }
    var me = mp.players.local;
    if (me.isTypingInTextChat || me.isDead()) return;
    if (me.vehicle) return;
    if (typeof global.uiBusy === 'function' && global.uiBusy()) return;
    if (typeof admOpen !== 'undefined' && admOpen) return;
    if (mp.gui.cursor.visible) return;
    if (enterAsPassenger()) return;
    intOpenMenu();
});

mp.events.add('cef:int:close', intClose);
mp.events.add('cef:int:pick', function (id, arg) {
    var t = intTarget;
    intClose();
    if (!t || !mp.players.exists(t)) return;
    if (id === 'shake') mp.events.callRemote('srv:int:shake', t.remoteId);
    else if (id === 'passport') mp.events.callRemote('srv:int:passport', t.remoteId);
    else if (id === 'pay') mp.events.callRemote('srv:int:pay', t.remoteId, Number(arg) || 0);
    else if (id === 'wave') mp.events.callRemote('srv:int:wave');
    else if (id === 'chklic') mp.events.callRemote('srv:lic:check', t.remoteId);
    else if (id === 'revdrive') mp.events.callRemote('srv:cop:revoke', t.remoteId, 'drive');
    else if (id === 'revgun') mp.events.callRemote('srv:cop:revoke', t.remoteId, 'gun');
});

mp.events.add('social:offer', function (text, ms) {
    offerUntil = Date.now() + Number(ms || 15000);
    intExec('window.offerShow && window.offerShow(' + JSON.stringify(text) + ',' + Number(ms || 15000) + ');');
});
function answer(yes) {
    if (Date.now() > offerUntil) return;
    if (mp.players.local.isTypingInTextChat || mp.gui.cursor.visible) return;
    offerUntil = 0;
    intExec('window.offerHide && window.offerHide();');
    mp.events.callRemote('srv:int:answer', yes);
}
mp.keys.bind(0x59, false, function () { var c = global.phoneCallState && global.phoneCallState(); if (c && c.st === 'ring' && !c.out && !mp.players.local.isTypingInTextChat) return mp.events.callRemote('srv:call:answer'); answer(true); });
mp.keys.bind(0x4E, false, function () { if (global.nDownAt && Date.now() - global.nDownAt > 350) return; var c = global.phoneCallState && global.phoneCallState(); if (c && !mp.players.local.isTypingInTextChat && (c.st === 'ring' || c.st === 'talk')) return mp.events.callRemote('srv:call:end'); answer(false); });

mp.events.add('render', function () {
    if (!global.intOpen) return;
    if (!intTarget || !mp.players.exists(intTarget)) { intClose(); return; }
    var me = mp.players.local, p = intTarget.position;
    if (mp.game.system.vdist(me.position.x, me.position.y, me.position.z, p.x, p.y, p.z) > 4.5) { intClose(); return; }
    if (!mp.gui.cursor.visible) mp.gui.cursor.show(true, true);
    mp.game.controls.disableControlAction(0, 1, true);
    mp.game.controls.disableControlAction(0, 2, true);
    mp.game.controls.disableControlAction(0, 24, true);
    mp.game.controls.disableControlAction(0, 25, true);
    mp.game.controls.disableControlAction(0, 140, true);
    mp.game.controls.disableControlAction(0, 141, true);
    mp.game.controls.disableControlAction(0, 142, true);
    mp.game.controls.disableControlAction(0, 200, true);
});
