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

function safeCall(fn) {
    try {
        return fn();
    } catch (e) {
        if (debug) mp.gui.chat.push('!{#e05555}' + e);
        return null;
    }
}

function rnd(a, b) {
    return a + Math.random() * (b - a);
}

function flat(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
}

function inSafe(x, y, pad) {
    let hit = false;
    safe.forEach(function (s) {
        if (flat(x, y, s.x, s.y) < s.r + pad) hit = true;
    });
    return hit;
}

function drawZones() {
    blips.forEach(function (b) {
        safeCall(function () {
            mp.game.ui.removeBlip(b);
        });
    });
    blips = [];
    safe.forEach(function (s) {
        const b = safeCall(function () {
            return mp.game.ui.addBlipForRadius(s.x, s.y, s.z, s.r);
        });
        if (!b) return;
        safeCall(function () {
            mp.game.ui.setBlipColour(b, 2);
        });
        safeCall(function () {
            mp.game.ui.setBlipAlpha(b, 90);
        });
        blips.push(b);
    });
}

function groundZ(x, y, z) {
    const r = safeCall(function () {
        return mp.game.gameplay.getGroundZFor3dCoord(x, y, z, 0.0, false, false);
    });
    if (r === null) return null;
    const v = r && typeof r === 'object' ? r.groundZ : r;
    if (typeof v === 'number' && v > 1) return v;
    return null;
}

function loadModels() {
    ready = [];
    MODELS.forEach(function (name) {
        const hash = mp.game.joaat(name);
        safeCall(function () {
            mp.game.streaming.requestModel(hash);
        });
        ready.push(hash);
    });
}

function initGroups() {
    if (relGroup) return;
    relGroup = mp.game.joaat('ZOMBIES');
    const pl = mp.game.joaat('PLAYER');
    safeCall(function () {
        mp.game.ped.addRelationshipGroup('ZOMBIES', relGroup);
    });
    safeCall(function () {
        mp.game.ped.setRelationshipBetweenGroups(5, relGroup, pl);
    });
    safeCall(function () {
        mp.game.ped.setRelationshipBetweenGroups(5, pl, relGroup);
    });
    safeCall(function () {
        mp.game.ped.setRelationshipBetweenGroups(0, relGroup, relGroup);
    });
}

function attack(h, hard) {
    const me = mp.players.local.handle;
    const p = mp.players.local.position;
    if (hard) {
        safeCall(function () {
            mp.game.ped.clearPedTasksImmediately(h);
        });
    }
    safeCall(function () {
        mp.game.entity.setEntityAsMissionEntity(h, true, true);
    });
    safeCall(function () {
        mp.game.entity.freezeEntityPosition(h, false);
    });
    safeCall(function () {
        mp.game.ped.setBlockingOfNonTemporaryEvents(h, true);
    });
    safeCall(function () {
        mp.game.ped.setPedKeepTask(h, true);
    });
    safeCall(function () {
        mp.game.task.combatPed(h, me, 0, 16);
    });
    safeCall(function () {
        mp.game.task.goStraightToCoord(h, p.x, p.y, p.z, 2.0, -1, 0.0, 0.5);
    });
}

function tune(h, hp) {
    const speed = outbreak ? 1.25 : 0.9;
    const ped = mp.game.ped;
    safeCall(function () {
        mp.game.entity.setEntityHealth(h, hp);
    });
    safeCall(function () {
        ped.setPedMaxHealth(h, hp);
    });
    safeCall(function () {
        ped.setPedRelationshipGroupHash(h, relGroup);
    });
    safeCall(function () {
        ped.setPedCombatAbility(h, 100);
    });
    safeCall(function () {
        ped.setPedCombatRange(h, 2);
    });
    safeCall(function () {
        ped.setPedCombatMovement(h, 3);
    });
    safeCall(function () {
        ped.setPedFleeAttributes(h, 0, false);
    });
    safeCall(function () {
        ped.setPedCombatAttributes(h, 46, true);
    });
    safeCall(function () {
        ped.setPedCombatAttributes(h, 5, true);
    });
    safeCall(function () {
        ped.setPedCombatAttributes(h, 1, true);
    });
    safeCall(function () {
        ped.setPedCombatAttributes(h, 0, false);
    });
    safeCall(function () {
        ped.setPedSeeingRange(h, 300.0);
    });
    safeCall(function () {
        ped.setPedHearingRange(h, 350.0);
    });
    safeCall(function () {
        ped.setPedAlertness(h, 3);
    });
    safeCall(function () {
        ped.setPedCanRagdoll(h, true);
    });
    safeCall(function () {
        ped.setPedSuffersCriticalHits(h, true);
    });
    safeCall(function () {
        ped.setPedMoveRateOverride(h, speed);
    });
}

function spawn() {
    if (!ready.length) {
        loadModels();
        return;
    }
    const hash = ready[Math.floor(Math.random() * ready.length)];
    const loaded = safeCall(function () {
        return mp.game.streaming.hasModelLoaded(hash);
    });
    if (!loaded) {
        safeCall(function () {
            mp.game.streaming.requestModel(hash);
        });
        return;
    }
    const p = mp.players.local.position;
    const ang = Math.random() * Math.PI * 2;
    const r = outbreak ? rnd(45, 140) : rnd(80, 180);
    const x = p.x + Math.cos(ang) * r;
    const y = p.y + Math.sin(ang) * r;
    if (inSafe(x, y, 25)) return;
    const g = groundZ(x, y, p.z + 80);
    const z = (g === null ? p.z : g) + 1;
    const head = Math.random() * 360;
    const h = safeCall(function () {
        return mp.game.ped.createPed(26, hash, x, y, z, head, false, true);
    });
    if (!h) return;
    tune(h, outbreak ? 120 + wave * 25 : 90);
    attack(h, true);
    list.push({ h: h, last: 0, dead: false, retask: 0, chk: 0, px: x, py: y });
}

function remove(h) {
    safeCall(function () {
        mp.game.ped.deletePed(h);
    });
    safeCall(function () {
        mp.game.entity.deleteEntity(h);
    });
}

function clearAll() {
    list.forEach(function (z) {
        remove(z.h);
    });
    list = [];
}

function update() {
    const pos = mp.players.local.position;
    if (inSafe(pos.x, pos.y, 0)) {
        if (list.length) clearAll();
        return;
    }
    const limit = outbreak ? Math.min(28, 10 + wave * 2) : 4;
    const rate = outbreak ? 25 : 300;
    const burst = outbreak ? 3 : 1;
    const now = Date.now();
    const alive = [];
    list.forEach(function (z) {
        const exists = safeCall(function () {
            return mp.game.entity.doesEntityExist(z.h);
        });
        if (!exists) return;
        const c = safeCall(function () {
            return mp.game.entity.getEntityCoords(z.h, true);
        });
        if (!c) return;
        const dead = safeCall(function () {
            return mp.game.entity.isEntityDead(z.h);
        });
        if (dead) {
            if (!z.dead) {
                z.dead = true;
                mp.events.callRemote('srv:zombieKill');
                setTimeout(function () {
                    remove(z.h);
                }, 8000);
            }
            alive.push(z);
            return;
        }
        const d = flat(c.x, c.y, pos.x, pos.y);
        if (d > 400 || inSafe(c.x, c.y, 0)) {
            remove(z.h);
            return;
        }
        if (d < 2.5 && now - z.last > 1400) {
            z.last = now;
            mp.events.callRemote('srv:zombieHit', outbreak ? 6 + Math.floor(wave / 2) : 4);
            safeCall(function () {
                mp.game.cam.shakeGameplayCam('SMALL_EXPLOSION_SHAKE', 0.15);
            });
        }
        if (now - z.chk > 3000) {
            const moved = flat(c.x, c.y, z.px, z.py);
            z.px = c.x;
            z.py = c.y;
            z.chk = now;
            if (moved < 0.7 && d > 3) attack(z.h, true);
        }
        if (now - z.retask > 2000) {
            z.retask = now;
            attack(z.h, false);
        }
        alive.push(z);
    });
    list = alive;
    if (list.length < limit && tick % rate === 0) {
        let b = 0;
        while (b < burst && list.length < limit) {
            spawn();
            b++;
        }
    }
}

function label(text, y, scale, alpha) {
    mp.game.graphics.drawText(text, [0.5, y], {
        font: 4,
        color: [255, 255, 255, alpha],
        scale: [scale, scale],
        outline: true,
        centre: true
    });
}

mp.events.add('render', function () {
    if (!on) return;
    tick++;
    safeCall(update);
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
    safe.forEach(function (s2) {
        if (flat(s2.x, s2.y, pos.x, pos.y) > s2.r + 60) return;
        const size = s2.r * 2;
        safeCall(function () {
            mp.game.graphics.drawMarker(1, s2.x, s2.y, s2.z - 1, 0, 0, 0, 0, 0, 0, size, size, 2.0, 80, 220, 90, 40, false, false, 2, false, null, null, false);
        });
    });
    if (fxText && Date.now() - fxTime < 2200) {
        mp.game.graphics.drawText(fxText, [0.5, 0.78], {
            font: 4,
            color: [143, 209, 79, 230],
            scale: [0.52, 0.52],
            outline: true,
            centre: true
        });
    }
});

mp.events.add('srv:zombieState', function (state, ob, w, safeJson, left) {
    const was = outbreak;
    on = !!state;
    outbreak = !!ob;
    wave = Number(w) || 1;
    phaseLeft = Number(left) || 0;
    phaseSync = Date.now();
    let parsed = [];
    try {
        parsed = JSON.parse(safeJson);
    } catch (e) {
        parsed = [];
    }
    safe = parsed.map(function (s) {
        return { x: s.x, y: s.y, z: s.z || 30, r: s.r || 120 };
    });
    drawZones();
    if (!on) {
        clearAll();
        return;
    }
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
    mp.gui.chat.push('!{#8fd14f}Отладка: ' + (debug ? 'вкл' : 'выкл') + ' | фаза: ' + (outbreak ? 'прорыв' : 'затишье') + ' | рядом: ' + list.length);
    mp.gui.chat.push('!{#8fd14f}Координаты: ' + p.x.toFixed(0) + ', ' + p.y.toFixed(0) + ', ' + p.z.toFixed(0));
});
