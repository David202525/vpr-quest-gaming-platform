var csBr = null, csOpen = false, csShops = [], csBlips = [], csNear = null, csHint = false, csSaved = null, csCam = null, csMode = '', csHead = 0;
var CS_COMPS = [1, 3, 4, 5, 6, 7, 8, 11], CS_PROPS = [0, 1, 6];

mp.events.add('cs:shops', function (j) {
    try { csShops = JSON.parse(j) || []; } catch (e) { csShops = []; }
    csBlips.forEach(function (b) { try { b.destroy(); } catch (e) {} });
    csBlips = csShops.map(function (s) { return mp.blips.new(73, new mp.Vector3(s[2], s[3], s[4]), { dimension: 4294967295, name: 'Магазин одежды', color: 4, shortRange: true, scale: 0.8 }); });
});

function csSave() {
    var me = mp.players.local, s = { c: {}, p: {} };
    CS_COMPS.forEach(function (c) { s.c[c] = [me.getDrawableVariation(c), me.getTextureVariation(c)]; });
    CS_PROPS.forEach(function (c) { s.p[c] = [me.getPropIndex(c), me.getPropTextureIndex(c)]; });
    return s;
}
function csRestore(s) {
    if (!s) return;
    var me = mp.players.local;
    Object.keys(s.c).forEach(function (c) { try { me.setComponentVariation(Number(c), s.c[c][0], s.c[c][1], 2); } catch (e) {} });
    Object.keys(s.p).forEach(function (c) {
        try { if (s.p[c][0] < 0) me.clearProp(Number(c)); else me.setPropIndex(Number(c), s.p[c][0], s.p[c][1], true); } catch (e) {}
    });
}
function csCamOn() {
    var me = mp.players.local, pos = me.position;
    csHead = me.getHeading();
    var r = (csHead) * Math.PI / 180;
    var cx = pos.x - Math.sin(r) * 2.6, cy = pos.y + Math.cos(r) * 2.6;
    csCam = mp.cameras.new('DEFAULT_SCRIPTED_CAMERA', new mp.Vector3(cx, cy, pos.z + 0.35), new mp.Vector3(0, 0, 0), 42);
    csCam.pointAtCoord(pos.x, pos.y, pos.z + 0.1);
    csCam.setActive(true);
    mp.game.cam.renderScriptCams(true, true, 500, true, false);
    me.freezePosition(true);
    mp.game.ui.displayRadar(false);
    mp.events.call('hud:show', false);
}
function csCamOff() {
    if (csCam) { try { csCam.setActive(false); csCam.destroy(); } catch (e) {} csCam = null; }
    mp.game.cam.renderScriptCams(false, true, 400, true, false);
    mp.players.local.freezePosition(false);
    mp.game.ui.displayRadar(true);
    mp.events.call('hud:show', true);
}
function csUI(on) {
    if (on && !csBr) csBr = mp.browsers.new('package://cef/clothes/index.html');
    if (!csBr) return;
    csBr.active = on; csOpen = on; global.clothesOpen = on;
    mp.gui.cursor.show(on, on);
    mp.gui.chat.activate(!on);
}
function csExec(fn, j) {
    var run = function () { if (csBr) csBr.execute('window.' + fn + ' && window.' + fn + '(' + JSON.stringify(j) + ');'); };
    setTimeout(run, 150); setTimeout(run, 700);
}

mp.events.add('cs:open', function (j) {
    var d; try { d = JSON.parse(j); } catch (e) { return; }
    csMode = d.mode;
    csSaved = csSave();
    csUI(true); csCamOn();
    csExec('csOpen', j);
});
function csClose() {
    if (!csOpen) return;
    csUI(false); csCamOff();
    csRestore(csSaved); csSaved = null;
}
mp.events.add('cef:cs:close', csClose);
mp.keys.bind(0x1B, false, function () { if (csOpen) csClose(); });

mp.events.add('cef:cs:try', function (j) {
    var d; try { d = JSON.parse(j); } catch (e) { return; }
    var me = mp.players.local;
    csRestore(csSaved);
    try {
        if (d.p !== undefined && d.p !== null) me.setPropIndex(Number(d.p), Number(d.d), Number(d.tx) || 0, true);
        else {
            me.setComponentVariation(Number(d.c), Number(d.d), Number(d.tx) || 0, 2);
            if (Number(d.c) === 11) {
                me.setComponentVariation(3, Number(d.t) >= 0 ? Number(d.t) : 15, 0, 2);
                me.setComponentVariation(8, Number(d.u) >= 0 ? Number(d.u) : 15, Number(d.ut) || 0, 2);
            }
        }
    } catch (e) {}
});
mp.events.add('cef:cs:reset', function () { csRestore(csSaved); });
mp.events.add('cef:cs:rot', function (deg) { csHead = (csHead + Number(deg) + 360) % 360; mp.players.local.setHeading(csHead); });
mp.events.add('cef:cs:zoom', function (part) {
    if (!csCam) return;
    var me = mp.players.local, pos = me.position, r = me.getHeading() * Math.PI / 180;
    var zz = part === 'head' ? 0.65 : part === 'legs' ? -0.45 : part === 'feet' ? -0.85 : 0.1;
    var dd = part === 'body' ? 2.6 : 1.3;
    csCam.setCoord(pos.x - Math.sin(r) * dd, pos.y + Math.cos(r) * dd, pos.z + zz + 0.15);
    csCam.pointAtCoord(pos.x, pos.y, pos.z + zz);
});
mp.events.add('cef:cs:count', function (j) {
    var d; try { d = JSON.parse(j); } catch (e) { return; }
    var me = mp.players.local, out = { k: d.k, n: 0, t: 0 };
    try {
        if (d.p !== undefined && d.p !== null) { out.n = me.getNumberOfPropDrawableVariations(Number(d.p)); if (d.d !== undefined) out.t = me.getNumberOfPropTextureVariations(Number(d.p), Number(d.d)); }
        else { out.n = me.getNumberOfDrawableVariations(Number(d.c)); if (d.d !== undefined) out.t = me.getNumberOfTextureVariations(Number(d.c), Number(d.d)); }
    } catch (e) {}
    if (csBr) csBr.execute('window.csCount && window.csCount(' + JSON.stringify(JSON.stringify(out)) + ');');
});
mp.events.add('cef:cs:range', function (j) {
    var d; try { d = JSON.parse(j); } catch (e) { return; }
    var me = mp.players.local, out = [];
    for (var i = Number(d.from); i <= Number(d.to) && out.length < 300; i++) {
        var t = 0;
        try { t = d.p !== undefined && d.p !== null ? me.getNumberOfPropTextureVariations(Number(d.p), i) : me.getNumberOfTextureVariations(Number(d.c), i); } catch (e) {}
        if (t <= 0) continue;
        var tx = []; for (var k = 0; k < Math.min(t, 32); k++) tx.push(k);
        var nm = Array.isArray(d.nm) && d.nm[i - Number(d.from)] ? d.nm[i - Number(d.from)] : d.name + ' #' + i;
        out.push({ n: nm, sex: d.sex, slot: d.slot, d: i, tx: tx, t: d.t, u: -1, price: d.price, cap: d.cap });
    }
    mp.events.callRemote('srv:ce:bulk', JSON.stringify(out));
});

mp.events.add('cef:cs:buy', function (shop, id, tx, wear) { mp.events.callRemote('srv:cs:buy', Number(shop), Number(id), Number(tx), Number(wear) ? 1 : 0); });
mp.events.add('cs:bought', function (slot, worn, m) {
    if (Number(worn)) setTimeout(function () { if (csOpen) csSaved = csSave(); }, 700);
    if (csBr) csBr.execute('window.csBought && window.csBought(' + JSON.stringify(String(slot)) + ',' + Number(worn) + ',' + Number(m) + ');');
});
mp.events.add('cef:ce:save', function (j) { mp.events.callRemote('srv:ce:save', j); });
mp.events.add('cef:ce:del', function (id) { mp.events.callRemote('srv:ce:del', Number(id)); });
mp.events.add('cs:editList', function (j) { if (csBr) csBr.execute('window.csEditList && window.csEditList(' + JSON.stringify(j) + ');'); });

setInterval(function () {
    var me = mp.players.local, pos = me.position, n = null;
    if (!me.vehicle && me.dimension === 0) {
        for (var i = 0; i < csShops.length; i++) {
            var s = csShops[i];
            if (mp.game.system.vdist(pos.x, pos.y, pos.z, s[2], s[3], s[4]) < 2.0) { n = s; break; }
        }
    }
    if (n && !csHint) mp.events.call('hud:notify', 'ok', n[1] + ': нажмите E', 2500);
    csHint = !!n; csNear = n;
}, 400);
mp.keys.bind(0x45, false, function () {
    if (!csNear || csOpen || mp.players.local.isTypingInTextChat || mp.gui.cursor.visible) return;
    mp.events.callRemote('srv:cs:open', csNear[0]);
});
mp.events.add('render', function () {
    if (!csShops.length) return;
    var pos = mp.players.local.position;
    csShops.forEach(function (s) {
        var dx = pos.x - s[2], dy = pos.y - s[3];
        if (dx * dx + dy * dy > 900) return;
        mp.game.graphics.drawMarker(1, s[2], s[3], s[4] - 1, 0, 0, 0, 0, 0, 0, 1.2, 1.2, 0.4, 190, 120, 255, 120, false, false, 2, false, null, null, false);
        mp.game.graphics.drawText('👕 ' + s[1], [s[2], s[3], s[4] + 1.0], { font: 4, color: [255, 255, 255, 230], scale: [0.38, 0.38], outline: true, centre: true });
    });
});