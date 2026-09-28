function keep(b) {
    if (!global.__keep) global.__keep = [];
    global.__keep.push(b);
}

function adminOpen() {
    if (global.__admin) return;

    const b = mp.browsers.new('package://admin/index.html');
    global.__admin = b;
    keep(b);

    mp.gui.cursor.show(true, true);
    mp.gui.cursor.visible = true;

    mp.events.callRemote('srv:adminOpen');
}

function adminClose() {
    const b = global.__admin;
    if (!b) return;

    global.__admin = null;
    try { b.destroy(); } catch (e) {}

    mp.gui.cursor.show(false, false);
    mp.gui.cursor.visible = false;
}

mp.events.add('admin:close', adminClose);

mp.events.add('admin:act', (a, id, extra) => {
    mp.events.callRemote('srv:adminAct', a, Number(id) || 0, String(extra || ''));
    setTimeout(() => mp.events.callRemote('srv:adminOpen'), 600);
});

mp.events.add('admin:loot', (cmd, arg) => {
    mp.events.callRemote('srv:adminLoot', String(cmd), String(arg || ''));
});

mp.events.add('srv:adminData', (json) => {
    const b = global.__admin;
    if (!b) return;
    try { b.execute(`setData(${JSON.stringify(json)})`); } catch (e) {}
});

let radarBlips = [];

mp.events.add('srv:lootRadar', (json) => {
    for (let i = 0; i < radarBlips.length; i++) {
        try { mp.game.ui.removeBlip(radarBlips[i]); } catch (e) {}
    }
    radarBlips = [];

    let arr = [];
    try { arr = JSON.parse(json); } catch (e) { arr = []; }

    for (let i = 0; i < arr.length; i++) {
        const s = arr[i];
        try {
            const b = mp.game.ui.addBlipForCoord(s.x, s.y, s.z);
            mp.game.ui.setBlipSprite(b, 478);
            mp.game.ui.setBlipColour(b, 5);
            mp.game.ui.setBlipScale(b, 0.7);
            mp.game.ui.setBlipAsShortRange(b, false);
            mp.game.ui.beginTextCommandSetBlipName('STRING');
            mp.game.ui.addTextComponentSubstringPlayerName(s.n);
            mp.game.ui.endTextCommandSetBlipName(b);
            radarBlips.push(b);
        } catch (e) {}
    }
});

let fly = false;
let flyPos = null;
let speed = 1.0;

function flyOn() {
    if (fly) return;
    fly = true;

    const p = mp.players.local;
    flyPos = p.position;

    p.freezePosition(true);
    p.setInvincible(true);
    p.setCollision(false, false);
    p.setAlpha(0);
    p.setVisible(false, false);

    mp.game.ui.displayRadar(false);
    mp.events.callRemote('srv:flyState', true);
    mp.gui.chat.push('!{#ffd257}Polet: W/S - vpered, Shift - bystree, F2 - prizemlitsya');
}

function flyOff(land) {
    if (!fly) return;
    fly = false;

    const p = mp.players.local;

    p.freezePosition(false);
    p.setInvincible(false);
    p.setCollision(true, true);
    p.setAlpha(255);
    p.setVisible(true, false);

    mp.game.ui.displayRadar(true);

    if (land && flyPos) {
        p.position = flyPos;
        mp.events.callRemote('srv:flyLand', flyPos.x, flyPos.y, flyPos.z);
    } else {
        mp.events.callRemote('srv:flyState', false);
    }

    flyPos = null;
}

mp.events.add('render', () => {
    if (!fly || !flyPos) return;

    mp.game.controls.disableControlAction(0, 32, true);
    mp.game.controls.disableControlAction(0, 33, true);
    mp.game.controls.disableControlAction(0, 34, true);
    mp.game.controls.disableControlAction(0, 35, true);

    const rot = mp.game.cam.getGameplayCamRot(2);
    const rz = rot.z * Math.PI / 180;
    const rx = rot.x * Math.PI / 180;

    const fx = -Math.sin(rz) * Math.cos(rx);
    const fy = Math.cos(rz) * Math.cos(rx);
    const fz = Math.sin(rx);

    const rxv = Math.cos(rz);
    const ryv = Math.sin(rz);

    speed = mp.keys.isDown(0x10) ? 3.2 : (mp.keys.isDown(0x11) ? 0.3 : 1.0);

    let x = flyPos.x, y = flyPos.y, z = flyPos.z;

    if (mp.keys.isDown(0x57)) { x += fx * speed; y += fy * speed; z += fz * speed; }
    if (mp.keys.isDown(0x53)) { x -= fx * speed; y -= fy * speed; z -= fz * speed; }
    if (mp.keys.isDown(0x41)) { x -= rxv * speed; y -= ryv * speed; }
    if (mp.keys.isDown(0x44)) { x += rxv * speed; y += ryv * speed; }
    if (mp.keys.isDown(0x20)) { z += speed; }
    if (mp.keys.isDown(0x43)) { z -= speed; }

    flyPos = new mp.Vector3(x, y, z);
    mp.players.local.position = flyPos;

    mp.game.graphics.drawText('~y~FLY~w~  speed ' + speed.toFixed(1) + '  ~c~F2 - land', [0.5, 0.94], {
        font: 4, color: [255, 255, 255, 200], scale: [0.4, 0.4], outline: true, centre: true
    });
});

mp.keys.bind(0x72, false, () => {
    if (global.__auth) return;
    if (global.__admin) adminClose();
    else adminOpen();
});

mp.keys.bind(0x73, false, () => {
    if (global.__auth) return;
    if (fly) flyOff(true);
    else flyOn();
});

mp.events.add('fly:land', () => { if (fly) flyOff(true); });
