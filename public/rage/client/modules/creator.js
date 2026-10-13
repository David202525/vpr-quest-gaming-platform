let creatorBrowser = null;
let creatorCam = null;
let current = null;
let baseHeading = 0;

function defaultAppearance(gender) {
    return {
        gender: gender,
        parents: { father: 0, mother: 21, similarity: 0.5, skinSimilarity: 0.5 },
        features: new Array(20).fill(0),
        overlays: [
            { id: 1, index: 255, opacity: 1.0, color: 0 },
            { id: 2, index: 0, opacity: 1.0, color: 0 },
            { id: 3, index: 255, opacity: 0.0, color: 0 },
            { id: 4, index: 255, opacity: 0.0, color: 0 },
            { id: 5, index: 255, opacity: 0.0, color: 0 },
            { id: 8, index: 255, opacity: 0.0, color: 0 }
        ],
        hair: { style: 0, color: 0, highlight: 0 },
        eyeColor: 0
    };
}

function applyNow() {
    mp.events.call('local:applyAppearance', JSON.stringify(current));
}

function camTo(zone) {
    if (!creatorCam) return;
    const pos = mp.players.local.position;
    const h = (baseHeading * Math.PI) / 180;
    const fx = -Math.sin(h);
    const fy = Math.cos(h);
    const presets = {
        face: { d: 0.85, z: 0.65, look: 0.65, fov: 26 },
        body: { d: 2.4, z: 0.2, look: 0.0, fov: 45 },
        legs: { d: 1.6, z: -0.4, look: -0.5, fov: 40 }
    };
    const c = presets[zone] || presets.body;
    creatorCam.setCoord(pos.x + fx * c.d, pos.y + fy * c.d, pos.z + c.z);
    creatorCam.pointAtCoord(pos.x, pos.y, pos.z + c.look);
    creatorCam.setFov(c.fov);
}

mp.events.add('creator:start', function () {
    current = defaultAppearance(0);
    const local = mp.players.local;
    local.freezePosition(true);
    baseHeading = local.getHeading();
    mp.game.ui.displayRadar(false);
    mp.gui.chat.show(false);

    creatorCam = mp.cameras.new('creatorCam', local.position, new mp.Vector3(0, 0, 0), 45);
    creatorCam.setActive(true);
    mp.game.cam.renderScriptCams(true, false, 0, true, false);
    camTo('body');

    applyNow();

    creatorBrowser = mp.browsers.new('package://cef/creator/index.html');
    mp.gui.cursor.show(true, true);
});

mp.events.add('cef:creator:rotate', function (dir) {
    const local = mp.players.local;
    local.setHeading(local.getHeading() + (Number(dir) > 0 ? 20 : -20));
});

mp.events.add('cef:creator:camZone', function (zone) {
    camTo(zone);
});

mp.events.add('cef:creator:update', function (field, json) {
    if (!current) return;
    let value;
    try { value = JSON.parse(json); } catch (e) { return; }

    if (field === 'all') {
        current = value;
    } else if (field === 'gender') {
        current = defaultAppearance(value ? 1 : 0);
    } else if (field === 'parents') {
        current.parents = value;
    } else if (field === 'feature') {
        current.features[value.index] = value.value;
    } else if (field === 'overlay') {
        const ex = current.overlays.find(function (x) { return x.id === value.id; });
        if (ex) Object.assign(ex, value); else current.overlays.push(value);
    } else if (field === 'hair') {
        current.hair = value;
    } else if (field === 'eyeColor') {
        current.eyeColor = value;
    }
    applyNow();
});

mp.events.add('cef:creator:finish', function (firstname, lastname) {
    if (!current) return;
    mp.events.callRemote('creator:finish', firstname, lastname, current.gender, JSON.stringify(current));
});

mp.events.add('creator:error', function (msg) {
    if (creatorBrowser) creatorBrowser.execute('window.creatorError(' + JSON.stringify(msg) + ');');
});

mp.events.add('creator:done', function () {
    if (creatorBrowser) { creatorBrowser.destroy(); creatorBrowser = null; }
    if (creatorCam) { creatorCam.setActive(false); creatorCam.destroy(); creatorCam = null; }
    mp.game.cam.renderScriptCams(false, false, 0, true, false);
    mp.players.local.freezePosition(false);
    mp.game.ui.displayRadar(true);
    mp.gui.chat.show(true);
    mp.gui.cursor.show(false, false);
    current = null;
});