const MALE = mp.game.joaat('mp_m_freemode_01');
const FEMALE = mp.game.joaat('mp_f_freemode_01');

const COLOR_TYPE = { 1: 1, 2: 1, 10: 1, 4: 2, 5: 2, 8: 2 };

function num(v, def) {
    const n = Number(v);
    return isNaN(n) ? def : n;
}

function safe(fn) {
    try { fn(); } catch (e) { mp.console.logWarning('[appearance] ' + e.message); }
}

function setOverlay(p, o) {
    const id = num(o.id, 0);
    const index = num(o.index, 255);
    const opacity = num(o.opacity, 1.0);
    const color = num(o.color, 0);
    const color2 = num(o.color2, color);
    try {
        p.setHeadOverlay(id, index, opacity, color, color2);
    } catch (e) {
        mp.game.ped.setPedHeadOverlay(p.handle, id, index, opacity);
        if (COLOR_TYPE[id]) mp.game.ped.setPedHeadOverlayColor(p.handle, id, COLOR_TYPE[id], color, color2);
    }
}

function apply(p, a) {
    if (!p || !a) return;
    const model = a.gender ? FEMALE : MALE;
    if (p.model !== model) {
        p.model = model;
        safe(function () { p.setDefaultComponentVariation(); });
    }

    const par = a.parents || {};
    safe(function () {
        p.setHeadBlendData(
            num(par.mother, 21), num(par.father, 0), 0,
            num(par.mother, 21), num(par.father, 0), 0,
            num(par.similarity, 0.5), num(par.skinSimilarity, 0.5), 0.0, false
        );
    });

    (a.features || []).forEach(function (v, i) {
        safe(function () { p.setFaceFeature(i, num(v, 0)); });
    });

    (a.overlays || []).forEach(function (o) {
        safe(function () { setOverlay(p, o); });
    });

    const h = a.hair || {};
    safe(function () { p.setComponentVariation(2, num(h.style, 0), 0, 2); });
    safe(function () { p.setHairColor(num(h.color, 0), num(h.highlight, 0)); });
    safe(function () { p.setEyeColor(num(a.eyeColor, 0)); });
}

mp.events.add('local:applyAppearance', function (json) {
    let a = json;
    if (typeof json === 'string') {
        try { a = JSON.parse(json); } catch (e) { return; }
    }
    setTimeout(function () { apply(mp.players.local, a); }, 0);
});

mp.events.add('appearance:apply', function (json) {
    mp.events.call('local:applyAppearance', json);
});

exports.apply = apply;
