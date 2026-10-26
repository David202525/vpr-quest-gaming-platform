var HO = { x: -2900.0, y: -3900.0, z: 150.0 };
var H_W = 26, H_D = 18, H_H = 4;
var hObjs = [], hDoors = [], hBuilt = false, hBuilding = false;
var M_SLAB = 'stt_prop_stunt_bblock_xl1';
var M_WALL = 'stt_prop_stunt_bblock_xl1';
var M_DOOR = 'v_ilev_cor_doorglassa';
var M_PART = 'gr_prop_inttruck_doorblocker';

var FURN = [
    ['v_corp_maindesk', 5.5, 12.2, 0, 180],
    ['v_med_cor_reception_glass', 5.5, 13.2, 0, 180],
    ['v_corp_offchair', 5.5, 13.4, 0, 0],
    ['v_med_hospseating1', 0.8, 4.0, 0, 270],
    ['v_med_hospseating1', 0.8, 7.0, 0, 270],
    ['v_med_hospseating3', 0.8, 10.0, 0, 270],
    ['v_med_p_planter', 0.8, 0.8, 0, 0],
    ['v_med_p_planter', 10.3, 0.8, 0, 0],
    ['v_med_p_planter', 0.8, 17.2, 0, 0],
    ['v_med_cor_whiteboard', 3.0, 17.85, 1.4, 180],
    ['v_med_cor_flatscreentv', 0.15, 13.5, 2.2, 270],
    ['v_med_cor_largecupboard', 8.6, 17.55, 0, 180],
    ['v_med_cor_largecupboard', 10.6, 17.55, 0, 180],
    ['v_med_cooler', 10.6, 3.0, 0, 90],
    ['v_med_trolley', 25.2, 9.0, 0, 90],
    ['v_med_cor_wallunita', 25.75, 6.0, 0, 90],
    ['v_med_cor_wallunita', 25.75, 12.0, 0, 90],
    ['v_med_examlight', 24.8, 4.0, 0, 0],
    ['v_med_examlight', 24.8, 14.0, 0, 0],
    ['v_med_cor_medstool', 12.5, 9.0, 0, 0]
];
var BEDS = [[14.0, 1.6, 180], [17.0, 1.6, 180], [20.0, 1.6, 180], [23.0, 1.6, 180], [14.0, 16.4, 0], [17.0, 16.4, 0], [20.0, 16.4, 0], [23.0, 16.4, 0]];
var LIGHTS = [[3, 4], [3, 13], [8, 4], [8, 13], [14, 4], [14, 14], [19, 4], [19, 14], [24, 4], [24, 14], [18.5, 9]];

function H(n) { return mp.game.joaat(n); }
function inside(pos) { return pos.x > HO.x - 3 && pos.x < HO.x + H_W + 3 && pos.y > HO.y - 3 && pos.y < HO.y + H_D + 3 && pos.z > HO.z - 15 && pos.z < HO.z + 10; }
function near(pos) { var dx = pos.x - (HO.x + H_W / 2), dy = pos.y - (HO.y + H_D / 2); return dx * dx + dy * dy < 160 * 160; }

function loadModels(list, cb, tries) {
    var all = true;
    list.forEach(function (m) { var h = H(m); if (!mp.game.streaming.hasModelLoaded(h)) { all = false; mp.game.streaming.requestModel(h); } });
    if (all || (tries || 0) > 60) return cb();
    setTimeout(function () { loadModels(list, cb, (tries || 0) + 1); }, 100);
}

function spawn(m, lx, ly, lz, rx, ry, rz) {
    var o = mp.objects.new(H(m), new mp.Vector3(HO.x + lx, HO.y + ly, HO.z + lz), { rotation: new mp.Vector3(rx || 0, ry || 0, rz || 0), dimension: 0 });
    hObjs.push(o);
    return o;
}

var ROTS = [
    { r: [0, 0, 0], e: function (d) { return [d.x, d.y, d.z]; }, c: function (v) { return [v.x, v.y, v.z]; } },
    { r: [0, 0, 90], e: function (d) { return [d.y, d.x, d.z]; }, c: function (v) { return [-v.y, v.x, v.z]; } },
    { r: [90, 0, 0], e: function (d) { return [d.x, d.z, d.y]; }, c: function (v) { return [v.x, -v.z, v.y]; } },
    { r: [0, 90, 0], e: function (d) { return [d.z, d.y, d.x]; }, c: function (v) { return [v.z, v.y, -v.x]; } }
];
function box(m, x1, y1, z1, x2, y2, z2, al) {
    var dm;
    try { dm = mp.game.gameplay.getModelDimensions(H(m)); } catch (e) { return; }
    var d = { x: dm.max.x - dm.min.x, y: dm.max.y - dm.min.y, z: dm.max.z - dm.min.z };
    var mc = { x: (dm.max.x + dm.min.x) / 2, y: (dm.max.y + dm.min.y) / 2, z: (dm.max.z + dm.min.z) / 2 };
    var L = [x2 - x1, y2 - y1, z2 - z1];
    var thin = L.indexOf(Math.min.apply(null, L));
    var best = null, bc = 1e9;
    ROTS.forEach(function (R) {
        var e = R.e(d);
        if (e[0] < 0.01 || e[1] < 0.01 || e[2] < 0.01) return;
        var cnt = 1;
        for (var i = 0; i < 3; i++) if (i !== thin) cnt *= Math.ceil(L[i] / e[i] - 0.02);
        var cost = cnt * 10 + e[thin];
        if (cost < bc) { bc = cost; best = R; }
    });
    if (!best) return;
    var e = best.e(d), c = best.c(mc);
    var n = [0, 1, 2].map(function (i) { return i === thin ? 1 : Math.max(1, Math.ceil(L[i] / e[i] - 0.02)); });
    var st = [0, 1, 2].map(function (i) { return n[i] > 1 ? (L[i] - e[i]) / (n[i] - 1) : 0; });
    var lo = [x1, y1, z1];
    for (var a = 0; a < n[0]; a++) for (var b = 0; b < n[1]; b++) for (var k = 0; k < n[2]; k++) {
        var p = [a, b, k].map(function (q, i) {
            if (i === thin) return (al === 'hi' ? lo[i] + L[i] - e[i] / 2 : al === 'lo' ? lo[i] + e[i] / 2 : lo[i] + L[i] / 2) - c[i];
            return (n[i] > 1 ? lo[i] + e[i] / 2 + q * st[i] : lo[i] + L[i] / 2) - c[i];
        });
        spawn(m, p[0], p[1], p[2], best.r[0], best.r[1], best.r[2]);
    }
}

function build() {
    if (hBuilt || hBuilding) return;
    hBuilding = true;
    var models = [M_SLAB, M_PART, M_DOOR, 'v_med_bed2', 'v_med_hospheadwall1', 'v_med_bedtable', 'v_med_cor_downlight'].concat(FURN.map(function (f) { return f[0]; }));
    loadModels(models, function () {
        box(M_SLAB, -0.5, -0.5, -0.15, H_W + 0.5, H_D + 0.5, 0, 'hi');
        box(M_WALL, -0.5, -0.5, H_H, H_W + 0.5, H_D + 0.5, H_H + 0.15, 'lo');
        box(M_WALL, -0.5, -0.15, -0.2, H_W + 0.5, 0, H_H + 0.2, 'hi');
        box(M_WALL, -0.5, H_D, -0.2, H_W + 0.5, H_D + 0.15, H_H + 0.2, 'lo');
        box(M_WALL, -0.15, -0.5, -0.2, 0, H_D + 0.5, H_H + 0.2, 'hi');
        box(M_WALL, H_W, -0.5, -0.2, H_W + 0.15, H_D + 0.5, H_H + 0.2, 'lo');
        box(M_PART, 11, 0, 0, 11.15, 8, H_H);
        box(M_PART, 11, 10, 0, 11.15, H_D, H_H);
        box(M_PART, 11, 8, 2.3, 11.15, 10, H_H);

        [[4.5, 0], [6.5, 180]].forEach(function (d) { var o = spawn(M_DOOR, d[0], 0.05, 0, 0, 0, d[1]); o.hFix = true; });
        hDoors = [
            { o: spawn(M_DOOR, 11.08, 8.0, 0, 0, 0, 90), h0: 90, open: 0, cur: 90 },
            { o: spawn(M_DOOR, 11.08, 10.0, 0, 0, 0, 270), h0: 270, open: 360, cur: 270 }
        ];

        BEDS.forEach(function (b) {
            spawn('v_med_bed2', b[0], b[1], 0, 0, 0, b[2]);
            spawn('v_med_hospheadwall1', b[0], b[2] === 180 ? 0.12 : H_D - 0.12, 0.9, 0, 0, b[2] === 180 ? 0 : 180);
            spawn('v_med_bedtable', b[0] + 1.3, b[1], 0, 0, 0, 0);
        });
        FURN.forEach(function (f) { spawn(f[0], f[1], f[2], f[3], 0, 0, f[4]); });
        LIGHTS.forEach(function (l) { spawn('v_med_cor_downlight', l[0], l[1], H_H - 0.08, 0, 0, 0); });

        hBuilt = true; hBuilding = false;
        setTimeout(fixAll, 300);
        setTimeout(fixAll, 1500);
    });
}
function fixAll() {
    hObjs.forEach(function (o) {
        if (!o || !o.handle) return;
        try { o.freezePosition(true); o.setInvincible(true); o.setCanBeDamaged(false); } catch (e) {}
    });
}
function destroy() {
    hObjs.forEach(function (o) { try { o.destroy(); } catch (e) {} });
    hObjs = []; hDoors = []; hBuilt = false;
}

setInterval(function () {
    var pos = mp.players.local.position;
    if (near(pos)) build();
    else if (hBuilt) destroy();
}, 1000);

mp.events.add('hosp:arrive', function () {
    var me = mp.players.local;
    build();
    try { me.freezePosition(true); } catch (e) {}
    setTimeout(function () { fixAll(); try { me.freezePosition(false); } catch (e) {} }, 1600);
});

var lastFall = 0;
mp.events.add('render', function () {
    if (!hBuilt) return;
    var me = mp.players.local, pos = me.position;
    if (!inside(pos)) return;
    LIGHTS.forEach(function (l) { mp.game.graphics.drawLightWithRange(HO.x + l[0], HO.y + l[1], HO.z + H_H - 0.4, 255, 250, 240, 9.0, 1.4); });
    if (pos.z < HO.z - 3 && Date.now() - lastFall > 3000) {
        lastFall = Date.now();
        try { me.freezePosition(true); me.setCoordsNoOffset(HO.x + 5.5, HO.y + 2.5, HO.z + 1.0, false, false, false); } catch (e) {}
        setTimeout(function () { try { me.freezePosition(false); } catch (e) {} }, 1200);
    }
    hDoors.forEach(function (d) {
        if (!d.o || !d.o.handle) return;
        var dp = d.o.position, want = d.h0;
        var anyNear = false;
        mp.players.forEachInStreamRange(function (p) {
            if (anyNear) return;
            var q = p.position;
            if (Math.abs(q.x - (HO.x + 11.1)) < 2.2 && Math.abs(q.y - (HO.y + 9)) < 1.6 && Math.abs(q.z - dp.z - 1) < 2) anyNear = true;
        });
        if (anyNear) want = d.open;
        var diff = want - d.cur;
        if (Math.abs(diff) < 0.5) return;
        d.cur += Math.max(-6, Math.min(6, diff));
        try { d.o.setRotation(0, 0, d.cur, 2, true); d.o.setCollision(Math.abs(d.cur - d.h0) < 5, true); } catch (e) {}
    });
});
