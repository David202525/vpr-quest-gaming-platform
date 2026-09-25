const MODELS = ['a_m_m_hillbilly_01', 'a_m_m_tramp_01', 'a_m_y_methhead_01', 'a_m_m_farmer_01'];

let on = false;
let outbreak = false;
let wave = 1;
let safe = [];
let blips = [];
let phaseLeft = 0;
let phaseSync = 0;
let list = [];
let kills = 0;
let fxText = null;
let fxTime = 0;
let relGroup = 0;
let tick = 0;
let ready = [];
let debug = false;

const G = function () { return mp.game; };

function T(fn, a, b, c, d, e, f, g, h2, i2) {
    try { return fn(a, b, c, d, e, f, g, h2, i2); } catch (err) { if (debug) mp.gui.chat.push('!{#e05555}' + err); return null; }
}

function rnd(a, b) { return a + Math.random() * (b - a); }

function flat(ax, ay, bx, by) { return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by)); }

function speedNow() { return outbreak ? (wave > 5 ? 1.45 : 1.25) : 1.0; }

function inSafe(x, y, pad) {
    let hit = false;
    safe.forEach(function (s) { if (flat(x, y, s.x, s.y) < s.r + pad) hit = true; });
    return hit;
}

function drawZones() {
    const ui = G().ui;
    blips.forEach(function (b) { T(ui.removeBlip, b); });
    blips = [];
    safe.forEach(function (s) {
        const b = T(ui.addBlipForRadius, s.x, s.y, s.z, s.r);
        if (!b) return;
        T(ui.setBlipColour, b, 2);
        T(ui.setBlipAlpha, b, 90);
        blips.push(b);
    });
}

function groundZ(x, y, z) {
    const r = T(G().gameplay.getGroundZFor3dCoord, x, y, z, 0.0, false, false);
    if (r === null) return null;
    const v = r && typeof r === 'object' ? r.groundZ : r;
    return typeof v === 'number' && v > 1 ? v : null;
}

function loadModels() {
    ready = [];
    MODELS.forEach(function (name) {
        const hash = G().joaat(name);
        T(G().streaming.requestModel, hash);
        ready.push(hash);
    });
}

function initGroups() {
    if (relGroup) return;
    const ped = G().ped;
    relGroup = G().joaat('ZOMBIES');
    const pl = G().joaat('PLAYER');
    T(ped.addRelationshipGroup, 'ZOMBIES', relGroup);
    T(ped.setRelationshipBetweenGroups, 5, relGroup, pl);
    T(ped.setRelationshipBetweenGroups, 5, pl, relGroup);
    T(ped.setRelationshipBetweenGroups, 0, relGroup, relGroup);
}

function chase(z, d) {
    const me = mp.players.local.handle;
    const sp = speedNow();
    if (d < 14) {
        if (z.mode === 'fight') return;
        z.mode = 'fight';
        T(G().ped.setPedMoveRateOverride, z.h, sp);
        T(G().task.combatPed, z.h, me, 0, 16);
        return;
    }
    if (z.mode === 'run') return;
    z.mode = 'run';
    T(G().ped.setPedMoveRateOverride, z.h, sp);
    T(G().task.goToEntity, z.h, me, -1, 1.0, 2.0, 1073741824.0, 0);
}

function reset(z) {
    z.mode = '';
    T(G().ped.clearPedTasksImmediately, z.h);
    T(G().entity.freezeEntityPosition, z.h, false);
}

function tune(h, hp) {
    const ped = G().ped;
    const ent = G().entity;
    T(ent.setEntityAsMissionEntity, h, true, true);
    T(ent.setEntityHealth, h, hp);
    T(ent.freezeEntityPosition, h, false);
    T(ped.setPedMaxHealth, h, hp);
    T(ped.setPedRelationshipGroupHash, h, relGroup);
    T(ped.setPedAsEnemy, h, true);
    T(ped.setBlockingOfNonTemporaryEvents, h, true);
    T(ped.setPedFleeAttributes, h, 0, false);
    T(ped.setPedCombatAbility, h, 100);
    T(ped.setPedCombatRange, h, 2);
    T(ped.setPedCombatMovement, h, 3);
    T(ped.setPedCombatAttributes, h, 46, true);
    T(ped.setPedCombatAttributes, h, 5, true);
    T(ped.setPedCombatAttributes, h, 1, true);
    T(ped.setPedCombatAttributes, h, 16, true);
    T(ped.setPedCombatAttributes, h, 17, false);
    T(ped.setPedCombatAttributes, h, 0, false);
    T(ped.setPedSeeingRange, h, 400.0);
    T(ped.setPedHearingRange, h, 400.0);
    T(ped.setPedAlertness, h, 3);
    T(ped.setPedCanRagdoll, h, false);
    T(ped.setPedSuffersCriticalHits, h, true);
    T(ped.setPedCanEvasiveDive, h, false);
    T(ped.setPedPathCanUseClimbovers, h, true);
    T(ped.setPedPathCanDropFromHeight, h, true);
}

function spawn() {
    if (!ready.length) { loadModels(); return; }
    const hash = ready[Math.floor(Math.random() * ready.length)];
    const loaded = T(G().streaming.hasModelLoaded, hash);
    if (!loaded) { T(G().streaming.requestModel, hash); return; }
    const p = mp.players.local.position;
    const ang = Math.random() * Math.PI * 2;
    const r = outbreak ? rnd(40, 120) : rnd(70, 160);
    const x = p.x + Math.cos(ang) * r;
    const y = p.y + Math.sin(ang) * r;
    if (inSafe(x, y, 25)) return;
    const g = groundZ(x, y, p.z + 80);
    const z = (g === null ? p.z : g) + 1;
    const h = T(G().ped.createPed, 26, hash, x, y, z, Math.random() * 360, false, true);
    if (!h) return;
    tune(h, outbreak ? 120 + wave * 25 : 90);
    const item = { h: h, last: 0, dead: false, chk: 0, px: x, py: y, mode: '', stuck: 0 };
    list.push(item);
    chase(item, r);
}

function remove(h) {
    T(G().ped.deletePed, h);
    T(G().entity.deleteEntity, h);
}

function clearAll() {
    list.forEach(function (z) { remove(z.h); });
    list = [];
}

function update() {
    const pos = mp.players.local.position;
    if (inSafe(pos.x, pos.y, 0)) { if (list.length) clearAll(); return; }
    const limit = outbreak ? Math.min(28, 10 + wave * 2) : 4;
    const rate = outbreak ? 25 : 300;
    const burst = outbreak ? 3 : 1;
    const now = Date.now();
    const alive = [];
    const ent = G().entity;

    list.forEach(function (z) {
        if (!T(ent.doesEntityExist, z.h)) return;
        const c = T(ent.getEntityCoords, z.h, true);
        if (!c) return;

        if (T(ent.isEntityDead, z.h)) {
            if (!z.dead) {
                z.dead = true;
                mp.events.callRemote('srv:zombieKill');
                setTimeout(function () { remove(z.h); }, 8000);
            }
            alive.push(z);
            return;
        }

        const d = flat(c.x, c.y, pos.x, pos.y);
        if (d > 400 || inSafe(c.x, c.y, 0)) { remove(z.h); return; }

        if (d < 2.6 && now - z.last > 1400) {
            z.last = now;
            mp.events.callRemote('srv:zombieHit', outbreak ? 6 + Math.floor(wave / 2) : 4);
            T(G().cam.shakeGameplayCam, 'SMALL_EXPLOSION_SHAKE', 0.15);
        }

        chase(z, d);

        if (now - z.chk > 2500) {
            const moved = flat(c.x, c.y, z.px, z.py);
            z.px = c.x;
            z.py = c.y;
            z.chk = now;
            if (moved < 0.8 && d > 3) {
                z.stuck++;
                reset(z);
                chase(z, d);
                if (z.stuck > 3) { remove(z.h); return; }
            } else {
                z.stuck = 0;
            }
        }
        alive.push(z);
    });

    list = alive;

    if (list.length < limit && tick % rate === 0) {
        let b = 0;
        while (b < burst && list.length < limit) { spawn(); b++; }
    }
}

function label(text, y, scale, alpha) {
    const opt = { font: 4, color: [255, 255, 255, alpha], scale: [scale, scale], outline: true, centre: true };
    G().graphics.drawText(text, [0.5, y], opt);
}

mp.events.add('render', function () {
    if (!on) return;
    tick++;
    T(update);

    const pos = mp.players.local.position;
    const left = Math.max(0, phaseLeft - (Date.now() - phaseSync));
    const m = Math.floor(left / 60000);
    const s = Math.floor((left % 60000) / 1000);
    const timer = m + ':' + (s < 10 ? '0' + s : s);

    if (inSafe(pos.x, pos.y, 0)) {
        label('~g~БЕЗОПАСНАЯ ЗОНА~w~   ' + (outbreak ? 'прорыв' : 'затишье') + ' ' + timer, 0.035, 0.42, 215);
    } else if (outbreak) {
        label('~r~ПРОРЫВ ЗАРАЖЁННЫХ~w~   волна ' + wave + '   рядом: ' + list.length + '   до конца ' + timer, 0.035, 0.44, 220);
    } else {
        label('~y~затишье~w~   до прорыва ' + timer + '   убито: ' + kills, 0.035, 0.4, 180);
    }

    const gfx = G().graphics;
    safe.forEach(function (s2) {
        if (flat(s2.x, s2.y, pos.x, pos.y) > s2.r + 60) return;
        const w2 = s2.r * 2;
        try {
            gfx.drawMarker(1, s2.x, s2.y, s2.z - 1, 0, 0, 0, 0, 0, 0, w2, w2, 2.0, 80, 220, 90, 40, false, false, 2, false, null, null, false);
        } catch (e) {}
    });

    if (fxText && Date.now() - fxTime < 2200) label(fxText, 0.78, 0.52, 230);
});

mp.events.add('srv:zombieState', function (state, ob, w, safeJson, left) {
    const was = outbreak;
    on = !!state;
    outbreak = !!ob;
    wave = Number(w) || 1;
    phaseLeft = Number(left) || 0;
    phaseSync = Date.now();

    let parsed = [];
    try { parsed = JSON.parse(safeJson); } catch (e) { parsed = []; }
    safe = parsed.map(function (s) { return { x: s.x, y: s.y, z: s.z || 30, r: s.r || 120 }; });
    drawZones();

    if (!on) { clearAll(); return; }
    initGroups();
    loadModels();
    if (was !== outbreak) clearAll();
});

mp.events.add('srv:zombieKillFx', function (reward, total) {
    kills = Number(total) || kills + 1;
    fxText = '+' + reward + '$';
    fxTime = Date.now();
});

mp.events.add('srv:zombieDebug', function () {
    debug = !debug;
    const p = mp.players.local.position;
    let run = 0;
    let fight = 0;
    list.forEach(function (z) {
        if (z.mode === 'run') run++;
        if (z.mode === 'fight') fight++;
    });
    mp.gui.chat.push('!{#8fd14f}Отладка: ' + (debug ? 'вкл' : 'выкл') + ' | фаза: ' + (outbreak ? 'прорыв' : 'затишье'));
    mp.gui.chat.push('!{#8fd14f}Рядом: ' + list.length + ' | бегут: ' + run + ' | дерутся: ' + fight);
    mp.gui.chat.push('!{#8fd14f}Координаты: ' + p.x.toFixed(0) + ', ' + p.y.toFixed(0) + ', ' + p.z.toFixed(0));
});
