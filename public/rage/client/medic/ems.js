var emsHint = '';
var attached = {};

mp.events.add('ems:hint', function (t) { emsHint = t || ''; });

function loadDict(d) {
    if (mp.game.streaming.hasAnimDictLoaded(d)) return true;
    mp.game.streaming.requestAnimDict(d);
    return false;
}

function carrierOf(p) {
    var id = -1;
    try { id = p.getVariable('carriedBy'); } catch (e) {}
    if (id === undefined || id === null || id < 0) return null;
    var c = mp.players.atRemoteId(id);
    return c && c.handle ? c : null;
}

setInterval(function () {
    mp.players.forEachInStreamRange(function (p) {
        if (!p.handle) return;
        var c = carrierOf(p);
        var key = p.remoteId;
        if (c) {
            if (attached[key] === c.remoteId) return;
            if (!loadDict('nm')) return;
            try {
                p.attachTo(c.handle, 0, 0.27, 0.15, 0.63, 0.5, 0.5, 180, false, false, false, false, 2, false);
                p.taskPlayAnim('nm', 'firemans_carry', 8, -8, -1, 33, 0, false, false, false);
                attached[key] = c.remoteId;
            } catch (e) {}
        } else if (attached[key] !== undefined) {
            delete attached[key];
            try { p.detach(true, false); } catch (e) {}
        }
    });
}, 250);

mp.events.add('render', function () {
    var me = mp.players.local;
    var c = carrierOf(me);
    if (c && !mp.game.invoke('0x1F0B79228E461EC9', me.handle, 'nm', 'firemans_carry', 3)) {
        if (loadDict('nm')) { try { me.taskPlayAnim('nm', 'firemans_carry', 8, -8, -1, 33, 0, false, false, false); } catch (e) {} }
    }
    if (!emsHint || mp.gui.cursor.visible) return;
    mp.game.graphics.drawText(emsHint, [0.5, 0.82], { font: 4, color: [255, 255, 255, 235], scale: [0.42, 0.42], outline: true });
});
