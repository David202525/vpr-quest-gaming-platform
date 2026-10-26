var qNpcs = [], qTarget = null, qBlip = null, qNpcBlips = {}, qCurNpc = null, qDlgOpen = false;
function QX(c) { if (global.uiExecG) global.uiExecG(c); }
function QCS() { if (global.cursorSyncG) global.cursorSyncG(); else mp.gui.cursor.show(false, false); }
global.questDlgOpen = function () { return qDlgOpen; };
function qBusy() {
    return global.chatOpen || global.authOpen || global.creatorOpen || global.introOpen || mp.players.local.isTypingInTextChat || (global.uiOpenG && global.uiOpenG());
}

mp.events.add('quest:npcs', function (json) {
    var list = [];
    try { list = JSON.parse(json) || []; } catch (e) {}
    Object.keys(qNpcBlips).forEach(function (k) { try { qNpcBlips[k].destroy(); } catch (e) {} });
    qNpcBlips = {};
    qNpcs = list;
    qNpcs.forEach(function (n) {
        try { qNpcBlips[n.id] = mp.blips.new(280, new mp.Vector3(n.p[0], n.p[1], n.p[2]), { color: 5, scale: 0.7, shortRange: true, name: n.n, dimension: 0 }); } catch (e) {}
    });
});

mp.events.add('quest:state', function (json) {
    var d = null;
    try { d = JSON.parse(json); } catch (e) {}
    qCurNpc = d ? d.npc : null;
    var t = d ? d.t : null;
    var same = qTarget && t && Math.abs(qTarget.x - t.x) < 0.5 && Math.abs(qTarget.y - t.y) < 0.5;
    qTarget = t;
    if (!same) {
        if (qBlip) { try { qBlip.destroy(); } catch (e) {} qBlip = null; }
        if (t) {
            try {
                qBlip = mp.blips.new(1, new mp.Vector3(t.x, t.y, t.z), { color: 5, scale: 1.0, shortRange: false, name: 'Сюжет: ' + t.n, dimension: 0 });
                qBlip.setRoute(true);
                qBlip.setRouteColour(5);
            } catch (e) {}
        }
    }
    if (t && d.wp) try { mp.game.ui.setNewWaypoint(t.x, t.y); } catch (e) {}
});

function qNear() {
    var p = mp.players.local.position, best = null, bd = 2.5;
    qNpcs.forEach(function (n) {
        var dx = p.x - n.p[0], dy = p.y - n.p[1], dz = p.z - n.p[2];
        var dd = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dd < bd) { bd = dd; best = n; }
    });
    return best;
}

mp.events.add('render', function () {
    if (!qNpcs.length || mp.players.local.dimension !== 0) return;
    var p = mp.players.local.position;
    qNpcs.forEach(function (n) {
        var dx = p.x - n.p[0], dy = p.y - n.p[1];
        var dd = dx * dx + dy * dy;
        if (dd > 400) return;
        var mine = qCurNpc === n.id;
        mp.game.graphics.drawText((mine ? '! ' : '') + n.n, [n.p[0], n.p[1], n.p[2] + 1.05], { font: 4, color: mine ? [255, 211, 79, 240] : [255, 255, 255, 200], scale: [0.35, 0.35], outline: true, centre: true });
        if (dd < 6.25 && !qDlgOpen) mp.game.graphics.drawText('[E] Поговорить', [n.p[0], n.p[1], n.p[2] + 0.85], { font: 4, color: [255, 255, 255, 220], scale: [0.3, 0.3], outline: true, centre: true });
    });
});

mp.keys.bind(0x45, false, function () {
    if (qDlgOpen || qBusy() || mp.players.local.vehicle) return;
    var n = qNear();
    if (n) mp.events.callRemote('srv:quest:talk', n.id);
});

mp.events.add('quest:dialog', function (json) {
    if (json === 'null' || !json) {
        if (!qDlgOpen) return;
        qDlgOpen = false;
        QX('window.questDialog && window.questDialog(null);');
        QCS();
        mp.gui.chat.activate(true);
        return;
    }
    QX('window.questDialog && window.questDialog(' + JSON.stringify(json) + ');');
    if (!qDlgOpen) { qDlgOpen = true; mp.gui.cursor.show(true, true); mp.gui.chat.activate(false); }
});
mp.events.add('cef:quest:answer', function (i) { mp.events.callRemote('srv:quest:answer', Number(i)); });
mp.events.add('cef:quest:close', function () { mp.events.callRemote('srv:quest:answer', -1); mp.events.call('quest:dialog', 'null'); });
mp.keys.bind(0x1B, false, function () { if (qDlgOpen) mp.events.call('cef:quest:close'); });
