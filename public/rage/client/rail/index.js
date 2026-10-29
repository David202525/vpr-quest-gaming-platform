var RL = null, RLremote = {}, RLride = null, RLmodels = false;
var RL_MODELS = ['freight', 'freightcar', 'freightcar2', 'freightcont1', 'freightcont2', 'freightgrain', 'tankercar', 'metrotrain'];

function rlLoad() {
    if (RLmodels) return;
    RL_MODELS.forEach(function (m) { try { mp.game.streaming.requestModel(mp.game.joaat(m)); } catch (e) {} });
    RLmodels = true;
}
function rlReady() { return RL_MODELS.every(function (m) { try { return mp.game.streaming.hasModelLoaded(mp.game.joaat(m)); } catch (e) { return true; } }); }
function rlExists(h) { try { return !!h && !!mp.game.invoke('0x7239B21A38F536BA', h); } catch (e) { return false; } }
function rlPos(h) { try { return mp.game.invokeVector3('0x3FEF770D40960D5A', h, true); } catch (e) { return null; } }
function rlSpeed(h) { try { return mp.game.invokeFloat('0xD5037BA82E12416F', h); } catch (e) { return 0; } }
function rlCruise(h, v) { try { mp.game.invoke('0x16469284DB8C62B5', h, v + 0.0001); } catch (e) {} }
function rlSetSpeed(h, v) { try { mp.game.invoke('0xAA0BC91BE0B796E3', h, v + 0.0001); } catch (e) {} }
function rlCarriage(h, i) { try { return mp.game.invoke('0x08AAFD0814722BC3', h, i); } catch (e) { return 0; } }
function rlCarriages(h) { var out = []; for (var i = 1; i < 40; i++) { var c = rlCarriage(h, i); if (!c || !rlExists(c)) break; out.push(c); } return out; }
function rlCreate(v, x, y, z, dir) {
    rlLoad();
    var h = 0;
    try { h = mp.game.vehicle.createMissionTrain(v, x, y, z, !!dir); } catch (e) {}
    if (!h) try { h = mp.game.invoke('0x63C6CCA8E68AE8C8', v, x + 0.0001, y + 0.0001, z + 0.0001, !!dir); } catch (e) {}
    return h;
}
function rlDelete(h) {
    if (!rlExists(h)) return;
    var all = [h].concat(rlCarriages(h));
    try { mp.game.vehicle.deleteMissionTrain(h); } catch (e) {}
    all.forEach(function (c) {
        if (!rlExists(c)) return;
        try { mp.game.invoke('0xAD738C3085FE7E11', c, true, true); } catch (e) {}
        try { mp.game.vehicle.deleteVehicle(c); } catch (e) {}
        try { mp.game.entity.deleteEntity(c); } catch (e) {}
    });
}
function rlDoors(h, open) {
    [h].concat(rlCarriages(h)).forEach(function (c) {
        for (var d = 0; d < 4; d++) {
            try { if (open) mp.game.invoke('0x7C65DAC73C35C862', c, d, false, false); else mp.game.invoke('0x93D9BD300D7789E5', c, d, false); } catch (e) {}
        }
    });
}
function kmh(ms) { return Math.round(ms * 3.6); }
function hint(t, ty) { mp.events.call('hud:notify', ty || 'ok', t, 4000); }

/* ======================= МАШИНИСТ ======================= */
mp.events.add('rail:start', function (j) {
    rlStop();
    var c; try { c = JSON.parse(j); } catch (e) { return; }
    RL = { c: c, i: 0, h: 0, speed: 0, target: 0, doors: false, doorAt: 0, stopAt: 0, near: false, sent: false, over: 0, fineAt: 0, brake: false, wagons: 0, blip: null, tries: 0, lim: c.max, wasClose: false };
    rlLoad();
    hint('Подготовка состава…');
    rlSpawnTry();
});
function rlSpawnTry() {
    if (!RL || RL.h) return;
    if (!rlReady() && RL.tries++ < 40) return setTimeout(rlSpawnTry, 250);
    var r = RL.c.rail;
    RL.h = rlCreate(RL.c.var, r[0], r[1], r[2], RL.c.dir);
    if (!RL.h) { if (RL.tries++ < 60) return setTimeout(rlSpawnTry, 500); hint('Не удалось подать состав — попробуйте ещё раз', 'error'); return; }
    rlSetSpeed(RL.h, 0); rlCruise(RL.h, 0);
    try { mp.game.invoke('0xAD738C3085FE7E11', RL.h, true, true); } catch (e) {}
    setTimeout(function () {
        if (!RL || !rlExists(RL.h)) return;
        try { mp.players.local.taskWarpIntoVehicle(RL.h, -1); } catch (e) { try { mp.game.invoke('0x9A7D091411C5F684', mp.players.local.handle, RL.h, -1); } catch (e2) {} }
        RL.wagons = rlCarriages(RL.h).length;
        mp.events.callRemote('srv:rail:wagons', RL.wagons + 1);
        RL.mass = RL.c.kind === 'freight' ? 1 + RL.wagons * 0.12 : 1 + RL.wagons * 0.05;
        hint('W — тяга, S — тормоз, ПРОБЕЛ — экстренный тормоз' + (RL.c.kind === 'metro' ? ', E — двери' : '') + '. Состав: ' + (RL.wagons + 1) + ' ваг.', 'ok');
        rlPoint();
    }, 600);
}
function rlStop() {
    if (!RL) return;
    if (RL.blip) try { RL.blip.destroy(); } catch (e) {}
    var h = RL.h;
    RL = null;
    try { if (mp.players.local.vehicle || mp.players.local.isInAnyVehicle(false)) { var p = rlPos(h); mp.players.local.clearTasksImmediately(); if (p) mp.players.local.position = new mp.Vector3(p.x + 3, p.y + 3, p.z + 1); } } catch (e) {}
    rlDelete(h);
}
mp.events.add('rail:stop', rlStop);
mp.events.add('rail:next', function (i) { if (!RL) return; RL.i = Number(i); RL.sent = false; RL.stopAt = 0; RL.wasClose = false; rlPoint(); });
function rlCur() { return RL && RL.c.st[RL.i]; }
function rlPoint() {
    if (RL.blip) try { RL.blip.destroy(); } catch (e) {}
    RL.blip = null;
    var s = rlCur(); if (!s) return;
    RL.blip = mp.blips.new(s.k === 'pass' ? 1 : 795, new mp.Vector3(s.x, s.y, s.z), { dimension: 0, color: s.k === 'pass' ? 5 : 46, name: s.n, shortRange: false, scale: 0.9 });
    try { RL.blip.setRoute(true); } catch (e) {}
}

mp.events.add('render', function () {
    if (!RL || !RL.h) return;
    var C = mp.game.controls;
    C.disableControlAction(0, 75, true);
    C.disableControlAction(27, 75, true);
    C.disableControlAction(0, 71, true); C.disableControlAction(0, 72, true);
    if (!rlExists(RL.h)) return;
    var typing = mp.players.local.isTypingInTextChat || mp.gui.cursor.visible;
    var dt = Math.min(0.1, mp.game.invokeFloat ? (mp.game.invokeFloat('0x15C40837039FFAF7') || 0.016) : 0.016);
    var m = RL.mass || 1, maxMs = RL.c.max / 3.6;
    if (!typing && !RL.doors && !RL.brake) {
        if (C.isDisabledControlPressed(0, 71) || C.isControlPressed(0, 32)) RL.target = Math.min(maxMs, RL.target + (2.2 / m) * dt * (1 - RL.target / (maxMs * 1.05)));
        if (C.isDisabledControlPressed(0, 72) || C.isControlPressed(0, 33)) RL.target = Math.max(0, RL.target - (3.5 / m) * dt);
    }
    if (RL.brake) RL.target = Math.max(0, RL.target - 9 * dt);
    RL.speed = RL.target;
    rlCruise(RL.h, RL.speed);
    if (RL.speed < 0.3 && RL.speed > 0) { /* дотягивание */ }

    var sp = rlSpeed(RL.h), p = rlPos(RL.h), s = rlCur();
    var d = s && p ? Math.hypot(p.x - s.x, p.y - s.y) : 0;
    var col = kmh(sp) > RL.lim ? [255, 90, 90, 255] : kmh(sp) > RL.lim - 8 ? [255, 200, 90, 255] : [255, 255, 255, 240];
    var G = mp.game.graphics;
    G.drawRect(0.5, 0.905, 0.36, 0.085, 10, 14, 22, 190);
    G.drawText(kmh(sp) + ' км/ч', [0.41, 0.868], { font: 7, color: col, scale: [0.75, 0.75], outline: true, centre: true });
    G.drawText('лимит ' + RL.lim + (RL.brake ? '  ·  ЭКСТР. ТОРМОЗ' : ''), [0.41, 0.912], { font: 4, color: RL.brake ? [255, 90, 90, 255] : [200, 200, 200, 220], scale: [0.32, 0.32], outline: true, centre: true });
    G.drawText(s ? (s.k === 'pass' ? 'Проследовать: ' : s.k === 'load' ? 'Погрузка: ' : s.k === 'unload' ? 'Выгрузка: ' : 'Станция: ') + s.n : '—', [0.55, 0.868], { font: 4, color: [127, 200, 255, 255], scale: [0.4, 0.4], outline: true, centre: true });
    G.drawText(s ? (d > 1000 ? (d / 1000).toFixed(1) + ' км' : Math.round(d) + ' м') + '  ·  тяга ' + Math.round(RL.target / maxMs * 100) + '%  ·  вагонов ' + (RL.wagons + 1) + (RL.c.kind === 'metro' ? '  ·  двери ' + (RL.doors ? 'ОТКР' : 'закр') : '') : '', [0.55, 0.9], { font: 4, color: [220, 220, 220, 230], scale: [0.32, 0.32], outline: true, centre: true });
    if (RL.stopAt && s) {
        var left = Math.max(0, Math.ceil((RL.stopAt - Date.now()) / 1000));
        G.drawText(s.k === 'load' ? 'Погрузка… ' + left + ' с' : s.k === 'unload' ? 'Выгрузка… ' + left + ' с' : 'Посадка пассажиров… ' + left + ' с', [0.5, 0.8], { font: 4, color: [127, 255, 170, 255], scale: [0.5, 0.5], outline: true, centre: true });
    } else if (s && s.k !== 'pass' && d < 70) {
        G.drawText(sp > 0.5 ? 'Остановите состав у платформы' : RL.c.kind === 'metro' && !RL.doors ? 'Нажмите E — открыть двери' : '', [0.5, 0.8], { font: 4, color: [255, 220, 120, 255], scale: [0.45, 0.45], outline: true, centre: true });
    }
});

setInterval(function () {
    if (!RL || !RL.h) return;
    if (!rlExists(RL.h)) { RL.h = 0; RL.tries = 0; hint('Состав потерян — подаём новый', 'warn'); rlSpawnTry(); return; }
    var me = mp.players.local, p = rlPos(RL.h), sp = rlSpeed(RL.h), s = rlCur();
    if (!p) return;
    mp.events.callRemote('srv:rail:pos', p.x, p.y, p.z, sp);
    if (!me.isInAnyVehicle(false)) { try { me.taskWarpIntoVehicle(RL.h, -1); } catch (e) {} }
    if (kmh(sp) > RL.lim + 8) {
        RL.over += 1;
        if (RL.over >= 8 && Date.now() - RL.fineAt > 30000) { RL.fineAt = Date.now(); RL.over = 0; mp.events.callRemote('srv:rail:fine', 'Превышение скорости: ' + kmh(sp) + ' при лимите ' + RL.lim); }
    } else RL.over = 0;
    if (!s || RL.sent) return;
    var d = Math.hypot(p.x - s.x, p.y - s.y);
    if (d < 60) RL.wasClose = true;
    if (s.k === 'pass') {
        if (d < 45) { RL.sent = true; if (s.lim) { RL.lim = s.lim; hint('Новый лимит скорости: ' + s.lim + ' км/ч'); } mp.events.callRemote('srv:rail:station', RL.i); }
        return;
    }
    if (RL.wasClose && d > 160) { RL.sent = true; RL.wasClose = false; mp.events.callRemote('srv:rail:skip', RL.i); return; }
    var ready = d < 45 && sp < 0.4 && (RL.c.kind !== 'metro' || RL.doors);
    if (ready && !RL.stopAt) RL.stopAt = Date.now() + RL.c.wait * 1000;
    if (!ready && RL.stopAt) { RL.stopAt = 0; if (d < 45) hint('Остановка прервана — нужно стоять' + (RL.c.kind === 'metro' ? ' с открытыми дверями' : ''), 'warn'); }
    if (RL.stopAt && Date.now() >= RL.stopAt) {
        RL.stopAt = 0; RL.sent = true;
        if (s.lim) RL.lim = s.lim; else RL.lim = RL.c.max;
        mp.events.callRemote('srv:rail:station', RL.i);
        if (RL.c.kind === 'metro') hint('Закройте двери (E) и отправляйтесь');
    }
}, 400);

mp.keys.bind(0x45, false, function () {
    if (!RL || !RL.h || RL.c.kind !== 'metro' || mp.players.local.isTypingInTextChat || mp.gui.cursor.visible) return;
    if (rlSpeed(RL.h) > 0.4) return hint('Двери открываются только на полной остановке', 'warn');
    if (Date.now() - RL.doorAt < 1500) return;
    RL.doorAt = Date.now();
    RL.doors = !RL.doors;
    if (RL.doors) RL.target = 0;
    rlDoors(RL.h, RL.doors);
    mp.game.audio.playSoundFrontend(-1, RL.doors ? 'CHECKPOINT_PERFECT' : 'TIMER_STOP', 'HUD_MINI_GAME_SOUNDSET', true);
});
mp.keys.bind(0x20, false, function () {
    if (!RL || !RL.h || mp.players.local.isTypingInTextChat || mp.gui.cursor.visible) return;
    RL.brake = !RL.brake;
    mp.game.audio.playSoundFrontend(-1, RL.brake ? 'TIMER_STOP' : 'CHECKPOINT_PERFECT', 'HUD_MINI_GAME_SOUNDSET', true);
});

/* ======================= ЧУЖИЕ ПОЕЗДА ======================= */
mp.events.add('rail:sync', function (j) {
    var list; try { list = JSON.parse(j) || []; } catch (e) { return; }
    var seen = {};
    list.forEach(function (t) {
        var id = t[0]; seen[id] = 1;
        var R = RLremote[id];
        if (R && (R.v !== t[1] || !rlExists(R.h))) { rlDelete(R.h); R = null; delete RLremote[id]; }
        if (!R) {
            rlLoad();
            if (!rlReady()) return;
            var h = rlCreate(t[1], t[3], t[4], t[5], t[2]);
            if (!h) return;
            R = RLremote[id] = { h: h, v: t[1] };
        }
        var p = rlPos(R.h);
        var far = !p || Math.hypot(p.x - t[3], p.y - t[4]) > 18;
        if (far) { try { mp.game.invoke('0x591CA673AA6AB736', R.h, t[3] + 0.0001, t[4] + 0.0001, t[5] + 0.0001); } catch (e) {} }
        var lag = p ? Math.hypot(p.x - t[3], p.y - t[4]) : 0;
        var sp = Math.abs(t[6]);
        rlCruise(R.h, sp + (lag > 4 && sp > 1 ? Math.min(4, lag * 0.3) : 0));
        if (sp < 0.05) rlSetSpeed(R.h, 0);
        R.sp = sp; R.at = Date.now();
    });
    Object.keys(RLremote).forEach(function (id) {
        if (seen[id]) return;
        if (RLride && String(RLride.d) === String(id)) rlLeave(true);
        rlDelete(RLremote[id].h); delete RLremote[id];
    });
});

/* ======================= ПАССАЖИРЫ ======================= */
function rlFreeSeat(c) {
    for (var s = 0; s < 8; s++) { try { if (mp.game.invoke('0x22AC59A870E6A669', c, s, false)) return s; } catch (e) {} }
    return -2;
}
function rlLeave(silent) {
    if (!RLride) return;
    RLride = null;
    var me = mp.players.local, p = me.position;
    try { me.clearTasksImmediately(); } catch (e) {}
    try { me.position = new mp.Vector3(p.x + 2.5, p.y + 2.5, p.z + 0.5); } catch (e) {}
    mp.events.callRemote('srv:rail:leave');
    if (!silent) hint('Вы вышли из поезда');
}
mp.events.add('rail:kick', function () { if (RLride) { rlLeave(true); hint('Машинист закончил смену — вы вышли из поезда', 'warn'); } });
mp.keys.bind(0x4A, false, function () {
    var me = mp.players.local;
    if (RL || me.isTypingInTextChat || mp.gui.cursor.visible) return;
    if (RLride) {
        var R0 = RLremote[RLride.d];
        if (R0 && (R0.sp || 0) > 0.6) return hint('Дождитесь остановки поезда', 'warn');
        return rlLeave(false);
    }
    if (me.vehicle) return;
    var best = null, bd = 9;
    Object.keys(RLremote).forEach(function (id) {
        var R = RLremote[id];
        if ((R.sp || 0) > 0.6) return;
        [R.h].concat(rlCarriages(R.h)).forEach(function (c, ci) {
            var p = rlPos(c); if (!p) return;
            var d = Math.hypot(p.x - me.position.x, p.y - me.position.y);
            if (d < bd && Math.abs(p.z - me.position.z) < 5) { bd = d; best = { d: id, c: c, ci: ci }; }
        });
    });
    if (!best) return;
    var seat = best.ci === 0 ? 0 : rlFreeSeat(best.c);
    if (seat === -2) seat = 0;
    try { me.taskWarpIntoVehicle(best.c, seat); } catch (e) { try { mp.game.invoke('0x9A7D091411C5F684', me.handle, best.c, seat); } catch (e2) {} }
    RLride = best;
    mp.events.callRemote('srv:rail:board', Number(best.d));
    hint('Вы в поезде. J — выйти на остановке');
});
setInterval(function () {
    var me = mp.players.local;
    if (RL) return;
    if (!RLride) {
        var pos = me.position;
        Object.keys(RLremote).some(function (id) {
            var R = RLremote[id], p = rlPos(R.h);
            if (p && (R.sp || 0) < 0.6 && Math.hypot(p.x - pos.x, p.y - pos.y) < 30 && !me.vehicle && (!R.hinted || Date.now() - R.hinted > 20000)) { R.hinted = Date.now(); hint('Поезд стоит у платформы: подойдите к вагону и нажмите J, чтобы сесть'); return true; }
            return false;
        });
        return;
    }
    if (!me.isInAnyVehicle(false)) { var R = RLremote[RLride.d]; if (R && (R.sp || 0) > 0.6) { try { me.taskWarpIntoVehicle(RLride.c, 0); } catch (e) {} } else { RLride = null; mp.events.callRemote('srv:rail:leave'); } }
}, 1000);
mp.events.add('render', function () {
    if (!RLride) return;
    mp.game.controls.disableControlAction(0, 75, true);
    mp.game.controls.disableControlAction(27, 75, true);
    mp.game.graphics.drawText('Вы пассажир поезда · J — выйти на остановке', [0.5, 0.94], { font: 4, color: [127, 200, 255, 230], scale: [0.35, 0.35], outline: true, centre: true });
});
