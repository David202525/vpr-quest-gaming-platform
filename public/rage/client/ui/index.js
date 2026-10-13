var deadState = null;
var uiBrowser = mp.browsers.new('package://cef/ui/index.html');
var uiOpen = null;
var freeCursor = false;
var skillStat = { shots: 0, drive: 0, run: 0 };
var lastPos = null;
var lastShot = 0;
var gpsBlip = null;
var VNAMES = {};
var uiTyping = false;
var uiReady = false;
var uiSet = { hud: true, chat: true, sound: true, hints: true };

function uiExec(code) { if (uiBrowser) uiBrowser.execute(code); }
function uiCall(fn, a, b) {
    uiExec('window.' + fn + ' && window.' + fn + '(' + JSON.stringify(a) + (b !== undefined ? ',' + JSON.stringify(b) : '') + ');');
}


function busy() {
    if (!uiReady) return true;
    if (deadState) return true;
    if (uiTyping) return true;
    if (!uiOpen && mp.gui.cursor.visible && !freeCursor) return true;
    if (mp.players.local.isTypingInTextChat) return true;
    if (typeof admOpen !== 'undefined' && admOpen) return true;
    return false;
}

function cursorSync() {
    var need = !!uiOpen || freeCursor || !!deadState;
    mp.gui.cursor.show(need, need);
}

function nearVeh() {
    var p = mp.players.local;
    var best = null, bd = 4.5;
    mp.vehicles.forEachInStreamRange(function (v) {
        if (v.dimension !== p.dimension) return;
        var d = mp.game.system.vdist(p.position.x, p.position.y, p.position.z, v.position.x, v.position.y, v.position.z);
        if (d < bd) { bd = d; best = v; }
    });
    return best;
}

function vehName(v) {
    try {
        var m = mp.game.vehicle.getDisplayNameFromVehicleModel(v.model);
        var n = mp.game.ui.getLabelText(m);
        return (n && n !== 'NULL' ? n : m).toUpperCase();
    } catch (e) { return 'ТРАНСПОРТ'; }
}

function openUi(name, opt) {
    if (uiOpen === name) return closeUi();
    if (uiOpen && !(opt && opt.fromUi)) return;
    if (busy()) return;
    if (uiOpen) closeUi(true);
    uiOpen = name;
    uiCall('uiOpen', name, opt || {});
    if (name === 'inv') {
        var side = 'ground', vid = -1, vn = '';
        if (opt && opt.trunk) {
            var v = mp.players.local.vehicle || nearVeh();
            if (v) { side = 'trunk'; vid = v.remoteId; vn = vehName(v); }
        }
        mp.events.callRemote('srv:inv:open', side, vid, vn);
    }
    if (name === 'phone') mp.events.callRemote('srv:phone:get');
    if (name === 'menu') mp.events.callRemote('srv:menu:get');
    if (name === 'docs' && !(opt && opt.shown)) mp.events.callRemote('srv:docs:get');
    if (name === 'fuel') mp.events.callRemote('srv:fuel:get');
    mp.gui.chat.activate(false);
    cursorSync();
}

function closeUi(silent) {
    if (!uiOpen) return;
    if (uiOpen === 'atm') mp.events.callRemote('srv:atm:close');
    if (uiOpen === 'biz') mp.events.callRemote('srv:biz:close');
    if (uiOpen === 'shop') mp.events.callRemote('srv:shop:close');
    uiOpen = null;
    uiTyping = false;
    if (!silent) uiCall('uiClose', '');
    mp.gui.chat.activate(true);
    cursorSync();
}

mp.keys.bind(0x49, false, function () { openUi('inv'); });
mp.keys.bind(0xC0, false, function () { openUi('inv', { trunk: !!(mp.players.local.vehicle || nearVeh()) }); });
mp.keys.bind(0x72, false, function () { openUi('phone'); });
mp.keys.bind(0x4D, false, function () { openUi('menu'); });
mp.keys.bind(0x71, false, function () {
    if (!uiReady || uiTyping || mp.players.local.isTypingInTextChat) return;
    if (uiOpen) return;
    if (!freeCursor && mp.gui.cursor.visible) return;
    freeCursor = !freeCursor;
    cursorSync();
});

mp.events.add('render', function () {
    if (uiOpen || freeCursor) {
        mp.game.controls.disableControlAction(0, 1, true);
        mp.game.controls.disableControlAction(0, 2, true);
        mp.game.controls.disableControlAction(0, 24, true);
        mp.game.controls.disableControlAction(0, 25, true);
        mp.game.controls.disableControlAction(0, 140, true);
        mp.game.controls.disableControlAction(0, 141, true);
        mp.game.controls.disableControlAction(0, 142, true);
        mp.game.controls.disableControlAction(0, 200, true);
        mp.game.controls.disableControlAction(0, 199, true);
    }
    var p = mp.players.local;
    if (p.isShooting()) {
        var now = Date.now();
        if (now - lastShot > 80) { skillStat.shots++; lastShot = now; }
    }
});

setInterval(function () {
    var p = mp.players.local;
    var pos = p.position;
    if (lastPos) {
        var d = mp.game.system.vdist(pos.x, pos.y, pos.z, lastPos.x, lastPos.y, lastPos.z);
        if (d < 200) {
            if (p.vehicle && p.vehicle.getPedInSeat(-1) === p.handle) skillStat.drive += d;
            else if (!p.vehicle && (p.isSprinting() || p.isRunning())) skillStat.run += d;
        }
    }
    lastPos = pos;
}, 1000);

setInterval(function () {
    if (skillStat.shots || skillStat.drive > 1 || skillStat.run > 1) {
        mp.events.callRemote('srv:skills:tick', JSON.stringify(skillStat));
        skillStat = { shots: 0, drive: 0, run: 0 };
    }
}, 30000);

mp.events.add('ui:data', function (kind, json) {
    if (kind === 'menu') {
        try {
            var d = JSON.parse(json);
            d.vehicles.forEach(function (v) {
                if (!VNAMES[v.model]) {
                    try {
                        var lbl = mp.game.ui.getLabelText(mp.game.vehicle.getDisplayNameFromVehicleModel(mp.game.joaat(v.model)));
                        VNAMES[v.model] = lbl && lbl !== 'NULL' ? lbl : v.model;
                    } catch (e) { VNAMES[v.model] = v.model; }
                }
                v.name = VNAMES[v.model];
            });
            json = JSON.stringify(d);
        } catch (e) {}
    }
    uiExec('window.uiData && window.uiData(' + JSON.stringify(kind) + ',' + json + ');');
});

mp.events.add('phone:sms', function (from, text) {
    mp.events.call('hud:notify', 'warn', 'SMS от ' + from + ': ' + text, 6000);
    if (uiSet.sound) mp.game.audio.playSoundFrontend(-1, 'Text_Arrive_Tone', 'Phone_SoundSet_Default', true);
});

mp.events.add('phone:gps', function (x, y, name) {
    mp.game.ui.setNewWaypoint(x, y);
    mp.events.call('hud:notify', 'ok', 'Метка поставлена: ' + name, 3000);
});

mp.events.add('inv:ammoReq', function (hash) {
    var n = 0;
    try { n = mp.game.invoke('0x015A522136D7F951', mp.players.local.handle, hash); } catch (e) {}
    mp.events.callRemote('srv:inv:ammo', Number(n) || 0);
});

mp.events.add('inv:clearProp', function (idx) {
    try { mp.players.local.clearProp(idx); } catch (e) {}
});

mp.events.add('cef:ui:close', function () { closeUi(true); });
mp.events.add('cef:ui:open', function (name) { openUi(name, { fromUi: true }); });
mp.events.add('cef:inv:act', function (json) { mp.events.callRemote('srv:inv:act', json); });
mp.events.add('cef:menu:buy', function (k) { mp.events.callRemote('srv:menu:buy', k); });
mp.events.add('cef:menu:claim', function (l) { mp.events.callRemote('srv:menu:claim', l); });
mp.events.add('cef:menu:report', function (t) { mp.events.callRemote('srv:menu:report', t); });
mp.events.add('cef:phone:sms', function (to, t) { mp.events.callRemote('srv:phone:sms', to, t); });
mp.events.add('cef:phone:contact', function (json) { mp.events.callRemote('srv:phone:contact', json); });
mp.events.add('cef:phone:bank', function (op, sum, to) { mp.events.callRemote('srv:phone:bank', op, sum, to || ''); });
mp.events.add('cef:phone:gps', function (i) { mp.events.callRemote('srv:phone:gps', i); });
mp.events.add('cef:phone:refresh', function () { mp.events.callRemote('srv:phone:get'); });
mp.events.add('cef:phone:camera', function () {
    closeUi();
    mp.gui.takeScreenshot('photo_' + Date.now() + '.png', 1, 100, 0);
    mp.events.call('hud:notify', 'ok', 'Фото сохранено в папку screenshots', 3000);
});

mp.events.add('cef:ui:typing', function (on) { uiTyping = !!on; });
mp.events.add('cef:ui:set', function (k, on) {
    uiSet[k] = !!on;
    if (k === 'hud') mp.events.call('hud:show', !!on);
    if (k === 'chat') mp.gui.chat.show(!!on);
    if (k === 'hints') mp.events.call('hud:hints', !!on);
});

mp.events.add('ui:ready', function (on) {
    uiReady = !!on;
    if (!uiReady) { closeUi(); freeCursor = false; }
});
mp.events.add('creator:start', function () { uiReady = false; closeUi(); freeCursor = false; });
mp.events.add('creator:done', function () { setTimeout(function () { uiReady = true; }, 1500); });
global.uiBusy = function () { return !!uiOpen; };

mp.events.add('ui:docs', function (json) {
    var d = null;
    try { d = JSON.parse(json); } catch (e) { return; }
    if (!d.own && uiOpen && uiOpen !== 'docs') return;
    if (uiOpen !== 'docs') {
        if (uiOpen) closeUi(true);
        uiOpen = 'docs';
        uiCall('uiOpen', 'docs', { shown: !d.own });
        mp.gui.chat.activate(false);
        cursorSync();
    }
    uiExec('window.uiData && window.uiData("docs",' + json + ');');
});
mp.events.add('ui:openDocs', function () { openUi('docs', { fromUi: true }); });
mp.events.add('cef:docs:show', function (i) { mp.events.callRemote('srv:docs:show', i); });

/* ================= DEATH ================= */
function deathPush() {
    if (!deadState) return;
    uiExec('window.deathShow && window.deathShow(' + JSON.stringify({
        reason: deadState.reason,
        left: Math.max(0, deadState.until - Date.now()),
        called: deadState.called, medics: deadState.medics
    }) + ');');
}
mp.events.add('srv:death', function (reason, ms) {
    if (uiOpen) closeUi();
    freeCursor = false;
    var was = deadState;
    deadState = { reason: reason || 'Ранение', until: Date.now() + Number(ms || 0), called: was ? was.called : false, medics: was ? was.medics : 0 };
    mp.gui.chat.activate(true);
    mp.gui.cursor.show(true, true);
    deathPush();
});
mp.events.add('death:info', function (json) {
    if (!deadState) return;
    try {
        var d = JSON.parse(json);
        deadState.called = !!d.called;
        deadState.medics = d.medics || 0;
        deadState.until = Date.now() + Number(d.left || 0);
    } catch (e) {}
    deathPush();
});
mp.events.add('srv:deathEnd', function () {
    deadState = null;
    uiExec('window.deathHide && window.deathHide();');
    try { mp.players.local.clearTasksImmediately(); } catch (e) {}
    cursorSync();
});
mp.events.add('cef:death:call', function () { if (deadState) mp.events.callRemote('srv:death:call'); });
mp.events.add('cef:death:hospital', function () {
    if (!deadState || Date.now() < deadState.until) return;
    mp.events.callRemote('srv:death:hospital');
});
mp.keys.bind(0x45, false, function () {
    if (!deadState || mp.players.local.isTypingInTextChat) return;
    mp.events.callRemote('srv:death:call');
});
mp.keys.bind(0x0D, false, function () {
    if (!deadState || mp.players.local.isTypingInTextChat) return;
    if (Date.now() < deadState.until) return;
    mp.events.callRemote('srv:death:hospital');
});
setInterval(function () {
    if (!deadState) return;
    if (typeof admOpen !== 'undefined' && admOpen) return;
    if (!mp.gui.cursor.visible && !mp.players.local.isTypingInTextChat) mp.gui.cursor.show(true, true);
    deathPush();
}, 1000);
mp.events.add('render', function () {
    if (!deadState || (typeof admOpen !== 'undefined' && admOpen)) return;
    for (var i = 0; i <= 360; i++) {
        if (i === 1 || i === 2 || i === 245 || i === 249) continue;
        mp.game.controls.disableControlAction(0, i, true);
    }
    mp.game.controls.enableControlAction(0, 1, true);
    mp.game.controls.enableControlAction(0, 2, true);
    mp.game.controls.enableControlAction(0, 245, true);
    mp.game.controls.enableControlAction(0, 249, true);
});
setTimeout(function () { mp.events.callRemote('srv:death:sync'); }, 4000);

mp.events.add('ui:fuelOpen', function () { if (!uiOpen) openUi('fuel', { fromUi: true }); });
mp.events.add('ui:fuelDone', function () { if (uiOpen === 'fuel') closeUi(); });
mp.events.add('cef:fuel:buy', function (t, l, pay) { mp.events.callRemote('srv:fuel:buy', t, Number(l), pay); });

/* ================= ATM ================= */
var ATM_LIST = [];
var atmNear = -1;
var atmHinted = -1;
mp.events.add('atm:list', function (json) { try { ATM_LIST = JSON.parse(json); } catch (e) {} });
setTimeout(function () { mp.events.callRemote('srv:atm:list'); }, 5000);
setInterval(function () {
    var p = mp.players.local, pos = p.position, best = -1, bd = 2.6;
    if (!p.vehicle) for (var i = 0; i < ATM_LIST.length; i++) {
        var a = ATM_LIST[i];
        var d = mp.game.system.vdist(pos.x, pos.y, pos.z, a[1], a[2], a[3]);
        if (d < bd) { bd = d; best = a[0]; }
    }
    atmNear = best;
    if (best >= 0 && atmHinted !== best && !uiOpen) { atmHinted = best; mp.events.call('hud:notify', 'ok', 'Банкомат: нажмите E', 3000); }
    if (best < 0) atmHinted = -1;
}, 400);
mp.keys.bind(0x45, false, function () {
    if (atmNear < 0 || busy() || uiOpen || bizNear) return;
    mp.events.callRemote('srv:atm:open', atmNear);
});
mp.events.add('ui:atmOpen', function () { if (!uiOpen) openUi('atm', { fromUi: true }); });
mp.events.add('ui:openCard', function (json) {
    if (uiOpen && uiOpen !== 'card') closeUi(true);
    if (uiOpen !== 'card') { uiOpen = 'card'; uiCall('uiOpen', 'card', {}); mp.gui.chat.activate(false); cursorSync(); }
    uiExec('window.uiData && window.uiData("card",' + json + ');');
});
mp.events.add('cef:atm:getcard', function () { mp.events.callRemote('srv:atm:getcard'); });
mp.events.add('cef:atm:pin', function (pin) { mp.events.callRemote('srv:atm:pin', String(pin)); });
mp.events.add('cef:atm:op', function (op, sum, to) { mp.events.callRemote('srv:atm:op', op, Number(sum), String(to || '')); });
mp.events.add('cef:atm:pinchange', function (a, b) { mp.events.callRemote('srv:atm:pinchange', String(a), String(b)); });
mp.events.add('cef:atm:biz', function (act, val) { mp.events.callRemote('srv:atm:biz', act, String(val === undefined ? '' : val)); });

/* ================= BUSINESS POINTS (невидимые) ================= */
var BIZ_PTS = [];
var bizNear = null;
var bizHinted = '';
mp.events.add('biz:points', function (json) { try { BIZ_PTS = JSON.parse(json); } catch (e) {} });
setInterval(function () {
    var p = mp.players.local, pos = p.position, best = null, bd = 2.2;
    if (!p.vehicle) for (var i = 0; i < BIZ_PTS.length; i++) {
        var b = BIZ_PTS[i];
        if (b[0] === 'shop' || b[0] === 'gun') continue;
        var d = mp.game.system.vdist(pos.x, pos.y, pos.z, b[2], b[3], b[4]);
        if (d < bd) { bd = d; best = b; }
    }
    bizNear = best;
    var k = best ? best[0] + best[1] : '';
    if (best && bizHinted !== k && !uiOpen) { bizHinted = k; mp.events.call('hud:notify', 'ok', best[5] + (best[6] ? ': продаётся! Нажмите E' : ': нажмите E — управление бизнесом'), 3500); }
    if (!best) bizHinted = '';
}, 400);
mp.keys.bind(0x45, false, function () {
    if (!bizNear || busy() || uiOpen) return;
    mp.events.callRemote('srv:biz:open', bizNear[0], bizNear[1]);
});
mp.events.add('ui:bizOpen', function (json) {
    if (uiOpen && uiOpen !== 'biz') closeUi(true);
    if (uiOpen !== 'biz') { uiOpen = 'biz'; uiCall('uiOpen', 'biz', {}); mp.gui.chat.activate(false); cursorSync(); }
    uiExec('window.uiData && window.uiData("biz",' + json + ');');
});
mp.events.add('cef:biz:open', function (kind, id) { mp.events.callRemote('srv:biz:open', kind, Number(id)); });
mp.events.add('cef:biz:act', function (act, val) { mp.events.callRemote('srv:biz:act', act, String(val === undefined ? '' : val)); });

/* ================= SHOPS ================= */
var SHOP_LIST = [];
var shopNear = null;
var shopHinted = 0;
mp.events.add('shop:list', function (json) { try { SHOP_LIST = JSON.parse(json); } catch (e) {} });
setTimeout(function () { mp.events.callRemote('srv:shop:list'); }, 5500);
setInterval(function () {
    var p = mp.players.local, pos = p.position, best = null, bd = 2.4;
    if (!p.vehicle) for (var i = 0; i < SHOP_LIST.length; i++) {
        var s = SHOP_LIST[i];
        var d = mp.game.system.vdist(pos.x, pos.y, pos.z, s[2], s[3], s[4]);
        if (d < bd) { bd = d; best = s; }
    }
    shopNear = best;
    if (best && shopHinted !== best[1] && !uiOpen) { shopHinted = best[1]; mp.events.call('hud:notify', 'ok', best[5] + ': нажмите E — открыть магазин', 3000); }
    if (!best) shopHinted = 0;
}, 400);
mp.keys.bind(0x45, false, function () {
    if (!shopNear || busy() || uiOpen) return;
    mp.events.callRemote('srv:shop:open', shopNear[1]);
});
mp.events.add('ui:shopOpen', function () { if (!uiOpen) openUi('shop', { fromUi: true }); });
mp.events.add('cef:shop:buy', function (k, qn, pay) { mp.events.callRemote('srv:shop:buy', k, Number(qn), pay); });

/* метка «продаётся»: маленький значок $ только у свободных бизнесов и только вблизи */
mp.events.add('render', function () {
    if (uiOpen) return;
    var pos = mp.players.local.position;
    for (var i = 0; i < BIZ_PTS.length; i++) {
        var b = BIZ_PTS[i];
        if (!b[6]) continue;
        var dx = pos.x - b[2], dy = pos.y - b[3];
        var d2 = dx * dx + dy * dy;
        if (d2 > 400) continue;
        var a = d2 < 16 ? 200 : 120;
        mp.game.graphics.drawMarker(29, b[2], b[3], b[4] + 0.15, 0, 0, 0, 0, 0, 0, 0.32, 0.32, 0.32, 242, 182, 50, a, true, true, 2, false, null, null, false);
    }
});
