const db = require('./database');

const CFG = {
    adminLevel: 2,
    leaderAdminLevel: 4,
    hospitalName: 'Pillbox Hill Medical Center',
    hospitalArea: 'центр города, район Пиллбокс-Хилл',
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
    ranks: ['', 'Интерн', 'Фельдшер', 'Врач', 'Зав. отделением', 'Главврач'],
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
        console.log('[EMS] DeathSystem не найден');
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
        const tag = c.urgent ? '!{#ff3b3b}СРОЧНО' : '!{#ffcc00}Вызов';
        m.outputChatBox(tag + ' #' + c.id + ' !{#ffffff}' + c.name + ' (ID ' + p.id + ') - ' + reason);
        m.outputChatBox('!{#aaaaaa}Расстояние: ' + meters + ' м, принять: !{#ffffff}/accept ' + c.id);
        m.call('medic:alert', [payload(c)]);
    });

    if (!urgent) {
        if (list.length > 0) msg(p, 'Вызов отправлен. Врачей на смене: ' + list.length);
        else msg(p, 'Сейчас нет врачей на смене. Вызов сохранён.');
    } else if (list.length > 0) {
        p.outputChatBox('!{#8fd14f}Медиков на смене: ' + list.length + '. Помощь уже в пути.');
    } else {
        p.outputChatBox('!{#ffcc66}Медиков на смене нет. Можно дождаться или ввести /respawn');
    }
}

mp.events.add('medic:downed', function (player, reason) {
    if (!mp.players.exists(player)) return;
    createCall(player, 'Тяжело ранен (' + reason + ')', true);
});

mp.events.add('medic:resolved', function (player) {
    const c = callOf(player);
    if (c) closeCall(c);
});

function doRevive(medic, target) {
    if (!isDown(target)) return msg(medic, 'Пациент не ранен.');
    if (target.medicReviving) return msg(medic, 'Пациента уже реанимируют.');

    const range = dist(medic, target);
    if (range > 3) return msg(medic, 'Подойдите ближе.');

    target.medicReviving = true;
    medic.playAnimation('mini@cpr@char_a@cpr_str', 'cpr_pumpchest', 1, 1);
    medic.call('medic:busy', [CFG.reviveTime, 'Реанимация']);
    msg(target, medic.name + ' проводит реанимацию...');

    setTimeout(function () {
        if (!mp.players.exists(target)) return;
        target.medicReviving = false;
        if (!mp.players.exists(medic)) return;
        medic.stopAnimation();

        const range2 = dist(medic, target);
        if (!isDown(target) || range2 > 4) return msg(medic, 'Реанимация прервана.');
        if (!doReviveCore(target)) return msg(medic, 'Не удалось поднять пациента.');

        giveMoney(medic, CFG.revivePay);
        msg(medic, 'Пациент спасён. Премия: $' + CFG.revivePay);

        mp.players.forEach(function (m) {
            if (isMedic(m) && m !== medic) {
                m.outputChatBox('!{#ff8a8a}[Рация] !{#ffffff}' + medic.name + ' спас ' + target.name);
            }
        });
    }, CFG.reviveTime);
}

function doHeal(medic, target) {
    if (isDown(target)) return doRevive(medic, target);

    const range = dist(medic, target);
    if (range > 3) return msg(medic, 'Подойдите ближе.');
    if (target.health >= 100) return msg(medic, 'Пациент здоров.');

    if (!takeMoney(target, CFG.healPrice)) {
        msg(target, 'Не хватает денег на лечение: $' + CFG.healPrice);
        return msg(medic, 'У пациента нет денег.');
    }

    target.health = 100;
    giveMoney(medic, CFG.healPay);
    medic.playAnimation('mp_common', 'givetake1_a', 1, 0);
    msg(target, medic.name + ' вылечил вас. Оплата: $' + CFG.healPrice);
    msg(medic, 'Пациент вылечен. Заработок: $' + CFG.healPay);

    const c = callOf(target);
    if (c) closeCall(c);
}

const bedBusy = {};

function useBed(p, i) {
    if (isDown(p)) return;
    if (bedBusy[i]) return msg(p, 'Койка занята.');
    if (p.health >= 100) return msg(p, 'Вы здоровы.');
    if (!takeMoney(p, CFG.bedPrice)) return msg(p, 'Лечение стоит $' + CFG.bedPrice);

    const b = CFG.beds[i];
    bedBusy[i] = p.id;
    p.position = new mp.Vector3(b.x, b.y, b.z);
    p.heading = b.h;
    p.playAnimation('amb@world_human_sunbathe@male@back@base', 'base', 1, 1);
    p.call('medic:busy', [CFG.bedTime, 'Лечение']);

    setTimeout(function () {
        bedBusy[i] = null;
        if (!mp.players.exists(p)) return;
        p.stopAnimation();
        p.health = 100;
        msg(p, 'Вы полностью вылечены. Оплата: $' + CFG.bedPrice);
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
    if (!isMedic(p)) return msg(p, 'Вы не состоите во фракции EMS.');

    const now = !onDuty(p);
    p.account.medicDuty = now;
    applyUniform(p, now);

    if (now) {
        msg(p, 'Вы заступили на смену. Ранг: ' + CFG.ranks[rank(p)]);
        calls.forEach(function (c) { p.call('medic:alert', [payload(c)]); });
        if (calls.length > 0) msg(p, 'Активных вызовов: ' + calls.length + '. Список: /calls');
    } else {
        removeCar(p);
        p.call('medic:dutyOff');
        msg(p, 'Смена окончена.');
    }
}

function spawnAmbulance(p) {
    if (!onDuty(p)) return msg(p, 'Сначала заступите на смену.');
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

    msg(p, 'Скорая подана.');
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
    name: 'Больница EMS',
    color: 1,
    shortRange: true
});

mp.events.add('playerEnterColshape', function (p, s) {
    if (s.medicZone === undefined) return;
    p.medicZone = s.medicZone;

    let hint = '';
    if (s.medicZone === 'locker') {
        if (isMedic(p)) hint = 'E - начать/закончить смену';
    } else if (s.medicZone === 'garage') {
        if (onDuty(p)) hint = 'E - вызвать скорую';
    } else {
        hint = 'E - лечь на койку ($' + CFG.bedPrice + ')';
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
    const reason = text && text.trim() ? text.trim() : 'Нужна медпомощь';
    createCall(p, reason, false);
});

mp.events.addCommand('duty', function (p) {
    toggleDuty(p);
});

mp.events.addCommand('calls', function (p) {
    if (!onDuty(p)) return msg(p, 'Вы не на смене.');
    if (calls.length === 0) return msg(p, 'Активных вызовов нет.');

    msg(p, 'Активные вызовы:');
    calls.forEach(function (c) {
        const t = mp.players.at(c.pid);
        let where = '?';
        if (t && mp.players.exists(t)) where = Math.round(dist(p, t)) + ' м';
        const col = c.urgent ? '!{#ff3b3b}' : '!{#ffcc00}';
        const who = c.taken ? ', принял ' + c.taken : '';
        p.outputChatBox(col + '#' + c.id + ' !{#ffffff}' + c.name + ' - ' + c.reason + ' !{#aaaaaa}(' + where + ')' + who);
    });
});

mp.events.addCommand('accept', function (p, arg) {
    if (!onDuty(p)) return msg(p, 'Вы не на смене.');

    const id = parseInt(arg, 10);
    let c = null;
    for (let i = 0; i < calls.length; i++) {
        if (calls[i].id === id) c = calls[i];
    }

    if (!c) return msg(p, 'Вызов не найден. Список: /calls');
    if (c.taken) return msg(p, 'Вызов уже принял ' + c.taken);

    c.taken = p.name;
    const t = mp.players.at(c.pid);
    const alive = t && mp.players.exists(t);
    const pos = alive ? t.position : c.pos;

    p.call('medic:route', [pos.x, pos.y]);
    msg(p, 'Вы приняли вызов #' + c.id + '. Маршрут проложен.');

    medics().forEach(function (m) {
        if (m !== p) m.outputChatBox('!{#ff8a8a}[Рация] !{#ffffff}' + p.name + ' принял вызов #' + c.id);
    });

    if (alive) msg(t, 'Врач ' + p.name + ' едет к вам.');
});

mp.events.addCommand('heal', function (p, arg) {
    if (!onDuty(p)) return msg(p, 'Вы не на смене.');
    const t = findPlayer(arg);
    if (!t || t === p) return msg(p, 'Использование: /heal [id]');
    doHeal(p, t);
});

mp.events.addCommand('revive', function (p, arg) {
    const t = arg ? findPlayer(arg) : nearestDown(p, 3);

    if (isAdmin(p) && !onDuty(p)) {
        if (!t) return msg(p, 'Использование: /revive [id]');
        if (!doReviveCore(t)) return msg(p, 'Игрок не ранен.');
        return msg(p, 'Вы подняли ' + t.name);
    }

    if (!onDuty(p)) return msg(p, 'Только медики на смене.');
    if (!t || t === p) return msg(p, 'Рядом нет раненых.');
    doRevive(p, t);
});

mp.events.addCommand('m', function (p, text) {
    if (!isMedic(p)) return;
    if (!text) return msg(p, 'Использование: /m [текст]');
    mp.players.forEach(function (t) {
        if (isMedic(t)) {
            t.outputChatBox('!{#ff8a8a}[Рация] ' + CFG.ranks[rank(p)] + ' ' + p.name + ': !{#ffffff}' + text);
        }
    });
});

mp.events.addCommand('medics', function (p) {
    const list = mp.players.toArray().filter(isMedic);
    if (list.length === 0) return msg(p, 'Врачей в сети нет.');
    list.forEach(function (t) {
        const st = onDuty(t) ? ' !{#66ff66}[на смене]' : ' !{#888888}[не на смене]';
        p.outputChatBox('!{#ffffff}' + t.name + ' - ' + CFG.ranks[rank(t)] + st);
    });
});

function canManage(p, need) {
    return isAdmin(p) || rank(p) >= need;
}

mp.events.addCommand('invite', function (p, arg) {
    if (!canManage(p, 4)) return msg(p, 'Недостаточно прав.');
    const t = findPlayer(arg);
    if (!t) return msg(p, 'Использование: /invite [id]');
    if (isMedic(t)) return msg(p, 'Игрок уже во фракции.');

    t.account.job = 'medic';
    t.account.job_rank = 1;
    saveJob(t);

    msg(p, t.name + ' принят во фракцию.');
    msg(t, 'Вас приняли в EMS. Ранг: ' + CFG.ranks[1] + '. Смена: /duty');
});

mp.events.addCommand('uninvite', function (p, arg) {
    if (!canManage(p, 4)) return msg(p, 'Недостаточно прав.');
    const t = findPlayer(arg);
    if (!t || !isMedic(t)) return msg(p, 'Игрок не во фракции.');

    if (onDuty(t)) toggleDuty(t);
    t.account.job = null;
    t.account.job_rank = 0;
    saveJob(t);

    msg(p, t.name + ' уволен.');
    msg(t, 'Вас уволили из EMS.');
});

mp.events.addCommand('setrank', function (p, args) {
    if (!canManage(p, 5)) return msg(p, 'Недостаточно прав.');

    const parts = String(args || '').split(' ');
    const t = findPlayer(parts[0]);
    const r = parseInt(parts[1], 10);

    if (!t || !isMedic(t) || isNaN(r) || r < 1 || r > 5) {
        return msg(p, 'Использование: /setrank [id] [1-5]');
    }

    t.account.job_rank = r;
    saveJob(t);

    msg(p, t.name + ' теперь ' + CFG.ranks[r]);
    msg(t, 'Ваш новый ранг: ' + CFG.ranks[r]);
});

mp.events.addCommand('makeleader', function (p, arg) {
    if (adminLevelOf(p) < CFG.leaderAdminLevel) {
        return msg(p, 'Выдавать лидерку может администратор ' + CFG.leaderAdminLevel + ' уровня и выше.');
    }

    const t = findPlayer(arg);
    if (!t) return msg(p, 'Использование: /makeleader [id]');

    t.account.job = 'medic';
    t.account.job_rank = 5;
    saveJob(t);

    const L = CFG.locker;

    t.outputChatBox(' ');
    t.outputChatBox('!{#ff5c5c}========== EMS ==========');
    t.outputChatBox('!{#8fd14f}Вам выдали лидерку фракции EMS!');
    t.outputChatBox('!{#ffffff}Должность: !{#ffcc00}' + CFG.ranks[5]);
    t.outputChatBox('!{#ffffff}Выдал: !{#ffcc00}' + p.name);
    t.outputChatBox('!{#ffffff}Больница: !{#ffcc00}' + CFG.hospitalName);
    t.outputChatBox('!{#ffffff}Где: !{#aaaaaa}' + CFG.hospitalArea);
    t.outputChatBox('!{#ffffff}Ищите !{#ff5c5c}красный маркер !{#ffffff}у входа - это раздевалка.');
    t.outputChatBox('!{#ffffff}Встаньте на него и нажмите !{#ffcc00}E!{#ffffff}, чтобы заступить на смену.');
    t.outputChatBox('!{#ffffff}Синий маркер рядом - выдача скорой.');
    t.outputChatBox('!{#aaaaaa}Метка на карте. Команды: /duty /calls /accept /heal /revive /invite /setrank /m');
    t.outputChatBox('!{#ff5c5c}=========================');

    t.call('medic:route', [L.x, L.y]);

    if (t !== p) msg(p, t.name + ' назначен главврачом. Ему отправлена инструкция и маршрут.');

    mp.players.forEach(function (a) {
        if (a !== p && a !== t && isAdmin(a)) {
            a.outputChatBox('!{#aaaaaa}[A] ' + p.name + ' выдал лидерку EMS игроку ' + t.name + ' (ID ' + t.id + ')');
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

console.log('[EMS] фракция медиков загружена');

module.exports = { isMedic: isMedic, onDuty: onDuty };
