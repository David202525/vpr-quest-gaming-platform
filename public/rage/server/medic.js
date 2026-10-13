const db = require('./database');

const CFG = {
    adminLevel: 2,
    leaderAdminLevel: 4,
    hospitalName: 'Pillbox Hill Medical Center',
    hospitalArea: '\u0446\u0435\u043d\u0442\u0440 \u0433\u043e\u0440\u043e\u0434\u0430, \u0440\u0430\u0439\u043e\u043d \u041f\u0438\u043b\u043b\u0431\u043e\u043a\u0441-\u0425\u0438\u043b\u043b',
    locker: { x: 311.5, y: -593.5, z: 43.28 },
    garage: { x: 294.5, y: -609.5, z: 43.3, h: 70.0 },
    beds: [
        { x: 324.2, y: -582.8, z: 43.28, h: 340.0 },
        { x: 322.6, y: -587.2, z: 43.28, h: 340.0 },
        { x: 317.7, y: -585.3, z: 43.28, h: 160.0 },
        { x: 319.4, y: -581.0, z: 43.28, h: 160.0 }
    ],
    bedModel: 'v_med_bed2',
    bedPrice: 300,
    healPrice: 200,
    healPay: 150,
    revivePay: 400,
    bedTime: 10000,
    reviveTime: 7000,
    ranks: ['', '\u0418\u043d\u0442\u0435\u0440\u043d', '\u0424\u0435\u043b\u044c\u0434\u0448\u0435\u0440', '\u0412\u0440\u0430\u0447', '\u0417\u0430\u0432. \u043e\u0442\u0434\u0435\u043b\u0435\u043d\u0438\u0435\u043c', '\u0413\u043b\u0430\u0432\u0432\u0440\u0430\u0447'],
    uniformMale: [[3, 85, 0], [4, 96, 0], [6, 51, 0], [8, 15, 0], [11, 250, 0]],
    uniformFemale: [[3, 109, 0], [4, 99, 0], [6, 52, 0], [8, 14, 0], [11, 258, 0]]
};

function DS() {
    return global.DeathSystem || null;
}

function acc(p) {
    return p && p.account ? p.account : null;
}

function isMedic(p) {
    const a = acc(p);
    return !!a && a.job === 'medic';
}

function rank(p) {
    if (!isMedic(p)) return 0;
    return Number(acc(p).job_rank) || 1;
}

function onDuty(p) {
    const a = acc(p);
    return !!a && a.medicDuty === true;
}

function isDown(p) {
    const a = acc(p);
    return !!a && a.downed === true;
}

function msg(p, t) {
    p.outputChatBox('!{#ff5c5c}[EMS] !{#ffffff}' + t);
}

function medics() {
    return mp.players.toArray().filter(onDuty);
}

function dist(a, b) {
    const dx = a.position.x - b.position.x;
    const dy = a.position.y - b.position.y;
    const dz = a.position.z - b.position.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function adminLevelOf(p) {
    const d = DS();
    if (d && typeof d.adminLvl === 'function') return d.adminLvl(p);
    const a = acc(p);
    return a ? Number(a.admin) || 0 : 0;
}

function isAdmin(p) {
    return adminLevelOf(p) >= CFG.adminLevel;
}

function doReviveCore(t) {
    const d = DS();
    if (!d) {
        console.log('[EMS] DeathSystem \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d');
        return false;
    }
    return d.revive(t);
}

function findPlayer(arg) {
    const id = parseInt(arg, 10);
    if (isNaN(id)) return null;
    const p = mp.players.at(id);
    if (!p || !mp.players.exists(p) || !p.account) return null;
    return p;
}

async function saveJob(p) {
    const a = acc(p);
    if (!a) return;
    try {
        await db.query('UPDATE accounts SET job = ?, job_rank = ? WHERE id = ?', [a.job || null, a.job_rank || 0, a.id]);
    } catch (e) {
        console.log('[EMS] saveJob: ' + e.message);
    }
}

async function saveMoney(p) {
    const a = acc(p);
    if (!a) return;
    try {
        await db.query('UPDATE accounts SET money = ? WHERE id = ?', [a.money || 0, a.id]);
    } catch (e) {
        console.log('[EMS] saveMoney: ' + e.message);
    }
}

function takeMoney(p, n) {
    const a = acc(p);
    if (!a) return false;
    const have = a.money || 0;
    if (have < n) return false;
    a.money = have - n;
    saveMoney(p);
    return true;
}

function giveMoney(p, n) {
    const a = acc(p);
    if (!a) return;
    a.money = (a.money || 0) + n;
    saveMoney(p);
}

let calls = [];
let callSeq = 1;

function payload(c) {
    return JSON.stringify({
        id: c.id,
        name: c.name,
        reason: c.reason,
        x: c.pos.x,
        y: c.pos.y,
        z: c.pos.z
    });
}

function callOf(p) {
    for (let i = 0; i < calls.length; i++) {
        if (calls[i].pid === p.id) return calls[i];
    }
    return null;
}

function closeCall(c) {
    calls = calls.filter(function (x) { return x.id !== c.id; });
    medics().forEach(function (m) { m.call('medic:callClear', [c.id]); });
}

function createCall(p, reason, urgent) {
    const old = callOf(p);
    if (old) closeCall(old);

    const c = {
        id: callSeq++,
        pid: p.id,
        name: p.name,
        reason: reason,
        urgent: !!urgent,
        pos: { x: p.position.x, y: p.position.y, z: p.position.z },
        taken: null
    };
    calls.push(c);

    const list = medics();
    list.forEach(function (m) {
        const meters = Math.round(dist(m, p));
        const tag = c.urgent ? '!{#ff3b3b}\u0421\u0420\u041e\u0427\u041d\u041e' : '!{#ffcc00}\u0412\u044b\u0437\u043e\u0432';
        m.outputChatBox(tag + ' #' + c.id + ' !{#ffffff}' + c.name + ' (ID ' + p.id + ') - ' + reason);
        m.outputChatBox('!{#aaaaaa}\u0420\u0430\u0441\u0441\u0442\u043e\u044f\u043d\u0438\u0435: ' + meters + ' \u043c, \u043f\u0440\u0438\u043d\u044f\u0442\u044c: !{#ffffff}/accept ' + c.id);
        m.call('medic:alert', [payload(c)]);
    });

    if (!urgent) {
        if (list.length > 0) msg(p, '\u0412\u044b\u0437\u043e\u0432 \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d. \u0412\u0440\u0430\u0447\u0435\u0439 \u043d\u0430 \u0441\u043c\u0435\u043d\u0435: ' + list.length);
        else msg(p, '\u0421\u0435\u0439\u0447\u0430\u0441 \u043d\u0435\u0442 \u0432\u0440\u0430\u0447\u0435\u0439 \u043d\u0430 \u0441\u043c\u0435\u043d\u0435. \u0412\u044b\u0437\u043e\u0432 \u0441\u043e\u0445\u0440\u0430\u043d\u0451\u043d.');
    } else if (list.length > 0) {
        p.outputChatBox('!{#8fd14f}\u041c\u0435\u0434\u0438\u043a\u043e\u0432 \u043d\u0430 \u0441\u043c\u0435\u043d\u0435: ' + list.length + '. \u041f\u043e\u043c\u043e\u0449\u044c \u0443\u0436\u0435 \u0432 \u043f\u0443\u0442\u0438.');
    } else {
        p.outputChatBox('!{#ffcc66}\u041c\u0435\u0434\u0438\u043a\u043e\u0432 \u043d\u0430 \u0441\u043c\u0435\u043d\u0435 \u043d\u0435\u0442. \u041c\u043e\u0436\u043d\u043e \u0434\u043e\u0436\u0434\u0430\u0442\u044c\u0441\u044f \u0438\u043b\u0438 \u0432\u0432\u0435\u0441\u0442\u0438 /respawn');
    }
}

mp.events.add('medic:downed', function (player, reason) {
    if (!mp.players.exists(player)) return;
    createCall(player, '\u0422\u044f\u0436\u0435\u043b\u043e \u0440\u0430\u043d\u0435\u043d (' + reason + ')', true);
});

mp.events.add('medic:resolved', function (player) {
    const c = callOf(player);
    if (c) closeCall(c);
});

function doRevive(medic, target) {
    if (!isDown(target)) return msg(medic, '\u041f\u0430\u0446\u0438\u0435\u043d\u0442 \u043d\u0435 \u0440\u0430\u043d\u0435\u043d.');
    if (target.medicReviving) return msg(medic, '\u041f\u0430\u0446\u0438\u0435\u043d\u0442\u0430 \u0443\u0436\u0435 \u0440\u0435\u0430\u043d\u0438\u043c\u0438\u0440\u0443\u044e\u0442.');

    const range = dist(medic, target);
    if (range > 3) return msg(medic, '\u041f\u043e\u0434\u043e\u0439\u0434\u0438\u0442\u0435 \u0431\u043b\u0438\u0436\u0435.');

    target.medicReviving = true;
    medic.playAnimation('mini@cpr@char_a@cpr_str', 'cpr_pumpchest', 1, 1);
    medic.call('medic:busy', [CFG.reviveTime, '\u0420\u0435\u0430\u043d\u0438\u043c\u0430\u0446\u0438\u044f']);
    msg(target, medic.name + ' \u043f\u0440\u043e\u0432\u043e\u0434\u0438\u0442 \u0440\u0435\u0430\u043d\u0438\u043c\u0430\u0446\u0438\u044e...');

    setTimeout(function () {
        if (!mp.players.exists(target)) return;
        target.medicReviving = false;
        if (!mp.players.exists(medic)) return;
        medic.stopAnimation();

        const range2 = dist(medic, target);
        if (!isDown(target) || range2 > 4) return msg(medic, '\u0420\u0435\u0430\u043d\u0438\u043c\u0430\u0446\u0438\u044f \u043f\u0440\u0435\u0440\u0432\u0430\u043d\u0430.');
        if (!doReviveCore(target)) return msg(medic, '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043f\u043e\u0434\u043d\u044f\u0442\u044c \u043f\u0430\u0446\u0438\u0435\u043d\u0442\u0430.');

        giveMoney(medic, CFG.revivePay);
        msg(medic, '\u041f\u0430\u0446\u0438\u0435\u043d\u0442 \u0441\u043f\u0430\u0441\u0451\u043d. \u041f\u0440\u0435\u043c\u0438\u044f: $' + CFG.revivePay);

        mp.players.forEach(function (m) {
            if (isMedic(m) && m !== medic) {
                m.outputChatBox('!{#ff8a8a}[\u0420\u0430\u0446\u0438\u044f] !{#ffffff}' + medic.name + ' \u0441\u043f\u0430\u0441 ' + target.name);
            }
        });
    }, CFG.reviveTime);
}

function doHeal(medic, target) {
    if (isDown(target)) return doRevive(medic, target);

    const range = dist(medic, target);
    if (range > 3) return msg(medic, '\u041f\u043e\u0434\u043e\u0439\u0434\u0438\u0442\u0435 \u0431\u043b\u0438\u0436\u0435.');
    if (target.health >= 100) return msg(medic, '\u041f\u0430\u0446\u0438\u0435\u043d\u0442 \u0437\u0434\u043e\u0440\u043e\u0432.');

    if (!takeMoney(target, CFG.healPrice)) {
        msg(target, '\u041d\u0435 \u0445\u0432\u0430\u0442\u0430\u0435\u0442 \u0434\u0435\u043d\u0435\u0433 \u043d\u0430 \u043b\u0435\u0447\u0435\u043d\u0438\u0435: $' + CFG.healPrice);
        return msg(medic, '\u0423 \u043f\u0430\u0446\u0438\u0435\u043d\u0442\u0430 \u043d\u0435\u0442 \u0434\u0435\u043d\u0435\u0433.');
    }

    target.health = 100;
    giveMoney(medic, CFG.healPay);
    medic.playAnimation('mp_common', 'givetake1_a', 1, 0);
    msg(target, medic.name + ' \u0432\u044b\u043b\u0435\u0447\u0438\u043b \u0432\u0430\u0441. \u041e\u043f\u043b\u0430\u0442\u0430: $' + CFG.healPrice);
    msg(medic, '\u041f\u0430\u0446\u0438\u0435\u043d\u0442 \u0432\u044b\u043b\u0435\u0447\u0435\u043d. \u0417\u0430\u0440\u0430\u0431\u043e\u0442\u043e\u043a: $' + CFG.healPay);

    const c = callOf(target);
    if (c) closeCall(c);
}

const bedBusy = {};

function useBed(p, i) {
    if (isDown(p)) return;
    if (bedBusy[i]) return msg(p, '\u041a\u043e\u0439\u043a\u0430 \u0437\u0430\u043d\u044f\u0442\u0430.');
    if (p.health >= 100) return msg(p, '\u0412\u044b \u0437\u0434\u043e\u0440\u043e\u0432\u044b.');
    if (!takeMoney(p, CFG.bedPrice)) return msg(p, '\u041b\u0435\u0447\u0435\u043d\u0438\u0435 \u0441\u0442\u043e\u0438\u0442 $' + CFG.bedPrice);

    const b = CFG.beds[i];
    bedBusy[i] = p.id;
    p.position = new mp.Vector3(b.x, b.y, b.z);
    p.heading = b.h;
    p.playAnimation('amb@world_human_sunbathe@male@back@base', 'base', 1, 1);
    p.call('medic:busy', [CFG.bedTime, '\u041b\u0435\u0447\u0435\u043d\u0438\u0435']);

    setTimeout(function () {
        bedBusy[i] = null;
        if (!mp.players.exists(p)) return;
        p.stopAnimation();
        p.health = 100;
        msg(p, '\u0412\u044b \u043f\u043e\u043b\u043d\u043e\u0441\u0442\u044c\u044e \u0432\u044b\u043b\u0435\u0447\u0435\u043d\u044b. \u041e\u043f\u043b\u0430\u0442\u0430: $' + CFG.bedPrice);
    }, CFG.bedTime);
}

function applyUniform(p, on) {
    const male = p.model === mp.joaat('mp_m_freemode_01');
    const female = p.model === mp.joaat('mp_f_freemode_01');
    if (!male && !female) return;

    if (on) {
        p.medicOld = [3, 4, 6, 8, 11].map(function (c) { return [c, p.getClothes(c)]; });
        const set = male ? CFG.uniformMale : CFG.uniformFemale;
        set.forEach(function (u) { p.setClothes(u[0], u[1], u[2], 0); });
    } else if (p.medicOld) {
        p.medicOld.forEach(function (o) {
            if (o[1]) p.setClothes(o[0], o[1].drawable, o[1].texture, o[1].palette || 0);
        });
        p.medicOld = null;
    }
}

function removeCar(p) {
    if (p.medicCar && mp.vehicles.exists(p.medicCar)) p.medicCar.destroy();
    p.medicCar = null;
}

function toggleDuty(p) {
    if (!isMedic(p)) return msg(p, '\u0412\u044b \u043d\u0435 \u0441\u043e\u0441\u0442\u043e\u0438\u0442\u0435 \u0432\u043e \u0444\u0440\u0430\u043a\u0446\u0438\u0438 EMS.');

    const now = !onDuty(p);
    p.account.medicDuty = now;
    applyUniform(p, now);

    if (now) {
        msg(p, '\u0412\u044b \u0437\u0430\u0441\u0442\u0443\u043f\u0438\u043b\u0438 \u043d\u0430 \u0441\u043c\u0435\u043d\u0443. \u0420\u0430\u043d\u0433: ' + CFG.ranks[rank(p)]);
        calls.forEach(function (c) { p.call('medic:alert', [payload(c)]); });
        if (calls.length > 0) msg(p, '\u0410\u043a\u0442\u0438\u0432\u043d\u044b\u0445 \u0432\u044b\u0437\u043e\u0432\u043e\u0432: ' + calls.length + '. \u0421\u043f\u0438\u0441\u043e\u043a: /calls');
    } else {
        removeCar(p);
        p.call('medic:dutyOff');
        msg(p, '\u0421\u043c\u0435\u043d\u0430 \u043e\u043a\u043e\u043d\u0447\u0435\u043d\u0430.');
    }
}

function spawnAmbulance(p) {
    if (!onDuty(p)) return msg(p, '\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u0437\u0430\u0441\u0442\u0443\u043f\u0438\u0442\u0435 \u043d\u0430 \u0441\u043c\u0435\u043d\u0443.');
    removeCar(p);

    const g = CFG.garage;
    p.medicCar = mp.vehicles.new(mp.joaat('ambulance'), new mp.Vector3(g.x, g.y, g.z), {
        heading: g.h,
        numberPlate: 'EMS ' + p.id,
        dimension: p.dimension
    });

    setTimeout(function () {
        if (mp.players.exists(p) && p.medicCar && mp.vehicles.exists(p.medicCar)) {
            p.putIntoVehicle(p.medicCar, 0);
        }
    }, 300);

    msg(p, '\u0421\u043a\u043e\u0440\u0430\u044f \u043f\u043e\u0434\u0430\u043d\u0430.');
}

function nearestDown(p, r) {
    let best = null;
    let bestRange = r;
    mp.players.forEach(function (t) {
        if (t === p || !isDown(t)) return;
        const range = dist(p, t);
        if (range < bestRange) {
            bestRange = range;
            best = t;
        }
    });
    return best;
}

function zone(pos, id, color) {
    mp.markers.new(1, new mp.Vector3(pos.x, pos.y, pos.z - 1.0), 1.2, { color: color, dimension: 0 });
    const s = mp.colshapes.newSphere(pos.x, pos.y, pos.z, 1.6, 0);
    s.medicZone = id;
}

zone(CFG.locker, 'locker', [255, 60, 60, 140]);
zone(CFG.garage, 'garage', [60, 140, 255, 140]);

CFG.beds.forEach(function (b, i) {
    mp.objects.new(mp.joaat(CFG.bedModel), new mp.Vector3(b.x, b.y, b.z - 1.0), {
        rotation: new mp.Vector3(0, 0, b.h),
        dimension: 0
    });
    const s = mp.colshapes.newSphere(b.x, b.y, b.z, 1.4, 0);
    s.medicZone = i;
});

mp.blips.new(61, new mp.Vector3(CFG.locker.x, CFG.locker.y, CFG.locker.z), {
    name: '\u0411\u043e\u043b\u044c\u043d\u0438\u0446\u0430 EMS',
    color: 1,
    shortRange: true
});

mp.events.add('playerEnterColshape', function (p, s) {
    if (s.medicZone === undefined) return;
    p.medicZone = s.medicZone;

    let hint = '';
    if (s.medicZone === 'locker') {
        if (isMedic(p)) hint = 'E - \u043d\u0430\u0447\u0430\u0442\u044c/\u0437\u0430\u043a\u043e\u043d\u0447\u0438\u0442\u044c \u0441\u043c\u0435\u043d\u0443';
    } else if (s.medicZone === 'garage') {
        if (onDuty(p)) hint = 'E - \u0432\u044b\u0437\u0432\u0430\u0442\u044c \u0441\u043a\u043e\u0440\u0443\u044e';
    } else {
        hint = 'E - \u043b\u0435\u0447\u044c \u043d\u0430 \u043a\u043e\u0439\u043a\u0443 ($' + CFG.bedPrice + ')';
    }

    if (hint) p.call('medic:hint', [hint]);
});

mp.events.add('playerExitColshape', function (p, s) {
    if (s.medicZone !== undefined && p.medicZone === s.medicZone) p.medicZone = null;
});

mp.events.add('medic:interact', function (p) {
    if (!p.account || isDown(p)) return;

    if (onDuty(p)) {
        const t = nearestDown(p, 2.5);
        if (t) return doRevive(p, t);
    }

    if (p.medicZone === 'locker') return toggleDuty(p);
    if (p.medicZone === 'garage') return spawnAmbulance(p);
    if (typeof p.medicZone === 'number') return useBed(p, p.medicZone);
});

mp.events.add('playerQuit', function (p) {
    removeCar(p);
    const c = callOf(p);
    if (c) closeCall(c);
    Object.keys(bedBusy).forEach(function (i) {
        if (bedBusy[i] === p.id) bedBusy[i] = null;
    });
});

mp.events.addCommand('911', function (p, text) {
    if (!p.account) return;
    const reason = text && text.trim() ? text.trim() : '\u041d\u0443\u0436\u043d\u0430 \u043c\u0435\u0434\u043f\u043e\u043c\u043e\u0449\u044c';
    createCall(p, reason, false);
});

mp.events.addCommand('duty', function (p) {
    toggleDuty(p);
});

mp.events.addCommand('calls', function (p) {
    if (!onDuty(p)) return msg(p, '\u0412\u044b \u043d\u0435 \u043d\u0430 \u0441\u043c\u0435\u043d\u0435.');
    if (calls.length === 0) return msg(p, '\u0410\u043a\u0442\u0438\u0432\u043d\u044b\u0445 \u0432\u044b\u0437\u043e\u0432\u043e\u0432 \u043d\u0435\u0442.');

    msg(p, '\u0410\u043a\u0442\u0438\u0432\u043d\u044b\u0435 \u0432\u044b\u0437\u043e\u0432\u044b:');
    calls.forEach(function (c) {
        const t = mp.players.at(c.pid);
        let where = '?';
        if (t && mp.players.exists(t)) where = Math.round(dist(p, t)) + ' \u043c';
        const col = c.urgent ? '!{#ff3b3b}' : '!{#ffcc00}';
        const who = c.taken ? ', \u043f\u0440\u0438\u043d\u044f\u043b ' + c.taken : '';
        p.outputChatBox(col + '#' + c.id + ' !{#ffffff}' + c.name + ' - ' + c.reason + ' !{#aaaaaa}(' + where + ')' + who);
    });
});

mp.events.addCommand('accept', function (p, arg) {
    if (!onDuty(p)) return msg(p, '\u0412\u044b \u043d\u0435 \u043d\u0430 \u0441\u043c\u0435\u043d\u0435.');

    const id = parseInt(arg, 10);
    let c = null;
    for (let i = 0; i < calls.length; i++) {
        if (calls[i].id === id) c = calls[i];
    }

    if (!c) return msg(p, '\u0412\u044b\u0437\u043e\u0432 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d. \u0421\u043f\u0438\u0441\u043e\u043a: /calls');
    if (c.taken) return msg(p, '\u0412\u044b\u0437\u043e\u0432 \u0443\u0436\u0435 \u043f\u0440\u0438\u043d\u044f\u043b ' + c.taken);

    c.taken = p.name;
    const t = mp.players.at(c.pid);
    const alive = t && mp.players.exists(t);
    const pos = alive ? t.position : c.pos;

    p.call('medic:route', [pos.x, pos.y]);
    msg(p, '\u0412\u044b \u043f\u0440\u0438\u043d\u044f\u043b\u0438 \u0432\u044b\u0437\u043e\u0432 #' + c.id + '. \u041c\u0430\u0440\u0448\u0440\u0443\u0442 \u043f\u0440\u043e\u043b\u043e\u0436\u0435\u043d.');

    medics().forEach(function (m) {
        if (m !== p) m.outputChatBox('!{#ff8a8a}[\u0420\u0430\u0446\u0438\u044f] !{#ffffff}' + p.name + ' \u043f\u0440\u0438\u043d\u044f\u043b \u0432\u044b\u0437\u043e\u0432 #' + c.id);
    });

    if (alive) msg(t, '\u0412\u0440\u0430\u0447 ' + p.name + ' \u0435\u0434\u0435\u0442 \u043a \u0432\u0430\u043c.');
});

mp.events.addCommand('heal', function (p, arg) {
    if (!onDuty(p)) return msg(p, '\u0412\u044b \u043d\u0435 \u043d\u0430 \u0441\u043c\u0435\u043d\u0435.');
    const t = findPlayer(arg);
    if (!t || t === p) return msg(p, '\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0435: /heal [id]');
    doHeal(p, t);
});

mp.events.addCommand('revive', function (p, arg) {
    const t = arg ? findPlayer(arg) : nearestDown(p, 3);

    if (isAdmin(p) && !onDuty(p)) {
        if (!t) return msg(p, '\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0435: /revive [id]');
        if (!doReviveCore(t)) return msg(p, '\u0418\u0433\u0440\u043e\u043a \u043d\u0435 \u0440\u0430\u043d\u0435\u043d.');
        return msg(p, '\u0412\u044b \u043f\u043e\u0434\u043d\u044f\u043b\u0438 ' + t.name);
    }

    if (!onDuty(p)) return msg(p, '\u0422\u043e\u043b\u044c\u043a\u043e \u043c\u0435\u0434\u0438\u043a\u0438 \u043d\u0430 \u0441\u043c\u0435\u043d\u0435.');
    if (!t || t === p) return msg(p, '\u0420\u044f\u0434\u043e\u043c \u043d\u0435\u0442 \u0440\u0430\u043d\u0435\u043d\u044b\u0445.');
    doRevive(p, t);
});

mp.events.addCommand('m', function (p, text) {
    if (!isMedic(p)) return;
    if (!text) return msg(p, '\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0435: /m [\u0442\u0435\u043a\u0441\u0442]');
    mp.players.forEach(function (t) {
        if (isMedic(t)) {
            t.outputChatBox('!{#ff8a8a}[\u0420\u0430\u0446\u0438\u044f] ' + CFG.ranks[rank(p)] + ' ' + p.name + ': !{#ffffff}' + text);
        }
    });
});

mp.events.addCommand('medics', function (p) {
    const list = mp.players.toArray().filter(isMedic);
    if (list.length === 0) return msg(p, '\u0412\u0440\u0430\u0447\u0435\u0439 \u0432 \u0441\u0435\u0442\u0438 \u043d\u0435\u0442.');
    list.forEach(function (t) {
        const st = onDuty(t) ? ' !{#66ff66}[\u043d\u0430 \u0441\u043c\u0435\u043d\u0435]' : ' !{#888888}[\u043d\u0435 \u043d\u0430 \u0441\u043c\u0435\u043d\u0435]';
        p.outputChatBox('!{#ffffff}' + t.name + ' - ' + CFG.ranks[rank(t)] + st);
    });
});

function canManage(p, need) {
    return isAdmin(p) || rank(p) >= need;
}

mp.events.addCommand('invite', function (p, arg) {
    if (!canManage(p, 4)) return msg(p, '\u041d\u0435\u0434\u043e\u0441\u0442\u0430\u0442\u043e\u0447\u043d\u043e \u043f\u0440\u0430\u0432.');
    const t = findPlayer(arg);
    if (!t) return msg(p, '\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0435: /invite [id]');
    if (isMedic(t)) return msg(p, '\u0418\u0433\u0440\u043e\u043a \u0443\u0436\u0435 \u0432\u043e \u0444\u0440\u0430\u043a\u0446\u0438\u0438.');

    t.account.job = 'medic';
    t.account.job_rank = 1;
    saveJob(t);

    msg(p, t.name + ' \u043f\u0440\u0438\u043d\u044f\u0442 \u0432\u043e \u0444\u0440\u0430\u043a\u0446\u0438\u044e.');
    msg(t, '\u0412\u0430\u0441 \u043f\u0440\u0438\u043d\u044f\u043b\u0438 \u0432 EMS. \u0420\u0430\u043d\u0433: ' + CFG.ranks[1] + '. \u0421\u043c\u0435\u043d\u0430: /duty');
});

mp.events.addCommand('uninvite', function (p, arg) {
    if (!canManage(p, 4)) return msg(p, '\u041d\u0435\u0434\u043e\u0441\u0442\u0430\u0442\u043e\u0447\u043d\u043e \u043f\u0440\u0430\u0432.');
    const t = findPlayer(arg);
    if (!t || !isMedic(t)) return msg(p, '\u0418\u0433\u0440\u043e\u043a \u043d\u0435 \u0432\u043e \u0444\u0440\u0430\u043a\u0446\u0438\u0438.');

    if (onDuty(t)) toggleDuty(t);
    t.account.job = null;
    t.account.job_rank = 0;
    saveJob(t);

    msg(p, t.name + ' \u0443\u0432\u043e\u043b\u0435\u043d.');
    msg(t, '\u0412\u0430\u0441 \u0443\u0432\u043e\u043b\u0438\u043b\u0438 \u0438\u0437 EMS.');
});

mp.events.addCommand('setrank', function (p, args) {
    if (!canManage(p, 5)) return msg(p, '\u041d\u0435\u0434\u043e\u0441\u0442\u0430\u0442\u043e\u0447\u043d\u043e \u043f\u0440\u0430\u0432.');

    const parts = String(args || '').split(' ');
    const t = findPlayer(parts[0]);
    const r = parseInt(parts[1], 10);

    if (!t || !isMedic(t) || isNaN(r) || r < 1 || r > 5) {
        return msg(p, '\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0435: /setrank [id] [1-5]');
    }

    t.account.job_rank = r;
    saveJob(t);

    msg(p, t.name + ' \u0442\u0435\u043f\u0435\u0440\u044c ' + CFG.ranks[r]);
    msg(t, '\u0412\u0430\u0448 \u043d\u043e\u0432\u044b\u0439 \u0440\u0430\u043d\u0433: ' + CFG.ranks[r]);
});

mp.events.addCommand('makeleader', function (p, arg) {
    if (adminLevelOf(p) < CFG.leaderAdminLevel) {
        return msg(p, '\u0412\u044b\u0434\u0430\u0432\u0430\u0442\u044c \u043b\u0438\u0434\u0435\u0440\u043a\u0443 \u043c\u043e\u0436\u0435\u0442 \u0430\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440 ' + CFG.leaderAdminLevel + ' \u0443\u0440\u043e\u0432\u043d\u044f \u0438 \u0432\u044b\u0448\u0435.');
    }

    const t = findPlayer(arg);
    if (!t) return msg(p, '\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0435: /makeleader [id]');

    t.account.job = 'medic';
    t.account.job_rank = 5;
    saveJob(t);

    const L = CFG.locker;

    t.outputChatBox(' ');
    t.outputChatBox('!{#ff5c5c}========== EMS ==========');
    t.outputChatBox('!{#8fd14f}\u0412\u0430\u043c \u0432\u044b\u0434\u0430\u043b\u0438 \u043b\u0438\u0434\u0435\u0440\u043a\u0443 \u0444\u0440\u0430\u043a\u0446\u0438\u0438 EMS!');
    t.outputChatBox('!{#ffffff}\u0414\u043e\u043b\u0436\u043d\u043e\u0441\u0442\u044c: !{#ffcc00}' + CFG.ranks[5]);
    t.outputChatBox('!{#ffffff}\u0412\u044b\u0434\u0430\u043b: !{#ffcc00}' + p.name);
    t.outputChatBox('!{#ffffff}\u0411\u043e\u043b\u044c\u043d\u0438\u0446\u0430: !{#ffcc00}' + CFG.hospitalName);
    t.outputChatBox('!{#ffffff}\u0413\u0434\u0435: !{#aaaaaa}' + CFG.hospitalArea);
    t.outputChatBox('!{#ffffff}\u0418\u0449\u0438\u0442\u0435 !{#ff5c5c}\u043a\u0440\u0430\u0441\u043d\u044b\u0439 \u043c\u0430\u0440\u043a\u0435\u0440 !{#ffffff}\u0443 \u0432\u0445\u043e\u0434\u0430 - \u044d\u0442\u043e \u0440\u0430\u0437\u0434\u0435\u0432\u0430\u043b\u043a\u0430.');
    t.outputChatBox('!{#ffffff}\u0412\u0441\u0442\u0430\u043d\u044c\u0442\u0435 \u043d\u0430 \u043d\u0435\u0433\u043e \u0438 \u043d\u0430\u0436\u043c\u0438\u0442\u0435 !{#ffcc00}E!{#ffffff}, \u0447\u0442\u043e\u0431\u044b \u0437\u0430\u0441\u0442\u0443\u043f\u0438\u0442\u044c \u043d\u0430 \u0441\u043c\u0435\u043d\u0443.');
    t.outputChatBox('!{#ffffff}\u0421\u0438\u043d\u0438\u0439 \u043c\u0430\u0440\u043a\u0435\u0440 \u0440\u044f\u0434\u043e\u043c - \u0432\u044b\u0434\u0430\u0447\u0430 \u0441\u043a\u043e\u0440\u043e\u0439.');
    t.outputChatBox('!{#aaaaaa}\u041c\u0435\u0442\u043a\u0430 \u043d\u0430 \u043a\u0430\u0440\u0442\u0435. \u041a\u043e\u043c\u0430\u043d\u0434\u044b: /duty /calls /accept /heal /revive /invite /setrank /m');
    t.outputChatBox('!{#ff5c5c}=========================');

    t.call('medic:route', [L.x, L.y]);

    if (t !== p) msg(p, t.name + ' \u043d\u0430\u0437\u043d\u0430\u0447\u0435\u043d \u0433\u043b\u0430\u0432\u0432\u0440\u0430\u0447\u043e\u043c. \u0415\u043c\u0443 \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0430 \u0438\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0438\u044f \u0438 \u043c\u0430\u0440\u0448\u0440\u0443\u0442.');

    mp.players.forEach(function (a) {
        if (a !== p && a !== t && isAdmin(a)) {
            a.outputChatBox('!{#aaaaaa}[A] ' + p.name + ' \u0432\u044b\u0434\u0430\u043b \u043b\u0438\u0434\u0435\u0440\u043a\u0443 EMS \u0438\u0433\u0440\u043e\u043a\u0443 ' + t.name + ' (ID ' + t.id + ')');
        }
    });

    console.log('[EMS] ' + p.name + ' -> makeleader -> ' + t.name);
});

mp.events.addCommand('medpos', function (p) {
    if (!isAdmin(p)) return;
    const s = '{ x: ' + p.position.x.toFixed(2) + ', y: ' + p.position.y.toFixed(2) + ', z: ' + p.position.z.toFixed(2) + ', h: ' + p.heading.toFixed(1) + ' }';
    p.outputChatBox(s);
    console.log('[medpos] ' + s);
});

console.log('[EMS] \u0444\u0440\u0430\u043a\u0446\u0438\u044f \u043c\u0435\u0434\u0438\u043a\u043e\u0432 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u0430');

module.exports = { isMedic: isMedic, onDuty: onDuty };

const fs = require('fs');
const path = require('path');
const DOOR_FILE = path.join(__dirname, 'hospital_doors.json');

let DOORS = {
    out: { x: 298.67, y: -584.43, z: 43.26, h: 70.0 },
    in: { x: 307.0, y: -595.0, z: 43.28, h: 250.0 }
};

try {
    DOORS = JSON.parse(fs.readFileSync(DOOR_FILE, 'utf8'));
} catch (e) {}

const doorObjs = [];

function buildDoors() {
    doorObjs.forEach(function (o) {
        try { o.destroy(); } catch (e) {}
    });
    doorObjs.length = 0;
    ['out', 'in'].forEach(function (k) {
        const d = DOORS[k];
        const v = new mp.Vector3(d.x, d.y, d.z - 1.0);
        const opt = { color: [255, 255, 255, 120], dimension: 0 };
        doorObjs.push(mp.markers.new(1, v, 1.0, opt));
        const s = mp.colshapes.newSphere(d.x, d.y, d.z, 1.3, 0);
        s.hospDoor = k;
        doorObjs.push(s);
    });
}

buildDoors();

mp.events.add('playerEnterColshape', function (p, s) {
    if (!s.hospDoor) return;
    p.hospDoor = s.hospDoor;
    let t = 'E - выйти на улицу';
    if (s.hospDoor === 'out') t = 'E - войти в больницу';
    p.call('medic:hint', [t]);
});

mp.events.add('playerExitColshape', function (p, s) {
    if (!s.hospDoor) return;
    if (p.hospDoor === s.hospDoor) p.hospDoor = null;
});

mp.events.add('medic:interact', function (p) {
    if (!p.hospDoor || !p.account) return;
    if (p.account.downed || p.vehicle) return;
    const key = p.hospDoor === 'out' ? 'in' : 'out';
    const to = DOORS[key];
    p.hospDoor = null;
    p.position = new mp.Vector3(to.x, to.y, to.z);
    p.heading = to.h;
});

mp.events.addCommand('hospdoor', function (p, arg) {
    if (!isAdmin(p)) return;
    const k = String(arg || '').trim();
    if (k !== 'in' && k !== 'out') {
        return msg(p, 'Пиши: /hospdoor out или /hospdoor in');
    }
    DOORS[k] = {
        x: Number(p.position.x.toFixed(2)),
        y: Number(p.position.y.toFixed(2)),
        z: Number(p.position.z.toFixed(2)),
        h: Number(p.heading.toFixed(1))
    };
    fs.writeFileSync(DOOR_FILE, JSON.stringify(DOORS, null, 2));
    buildDoors();
    msg(p, 'Точка двери сохранена: ' + k);
});
