const fs = require('fs');
const path = require('path');
const db = require('./database');

const CFG = {
    adminLevel: 4,
    payMinutes: 60,
    ownerPay: 5000,
    memberPay: 1500,
    armyPay: [0, 1000, 1500, 2000, 2500, 3000, 4000, 5000],
    armyBasePay: 500,
    armyRanks: ['', 'Рядовой', 'Ефрейтор', 'Сержант', 'Лейтенант', 'Капитан', 'Майор', 'Генерал'],
    maxMembers: 15
};

const FILE = path.join(__dirname, 'bases.json');

let data = { seq: 1, bases: [] };
const live = {};

function lvl(p) {
    const d = global.DeathSystem;
    if (d && typeof d.adminLvl === 'function') return d.adminLvl(p);
    return p && p.account ? Number(p.account.admin) || 0 : 0;
}

function isAdmin(p) {
    return lvl(p) >= CFG.adminLevel;
}

function msg(p, t) {
    p.outputChatBox('!{#7fbf3f}[БАЗА] !{#ffffff}' + t);
}

function accId(p) {
    return p && p.account ? p.account.id : null;
}

function save() {
    try {
        fs.writeFileSync(FILE, JSON.stringify(data, null, 1));
    } catch (e) {
        console.log('[bases] save: ' + e.message);
    }
}

function findPlayer(arg) {
    const id = parseInt(arg, 10);
    if (isNaN(id)) return null;
    const p = mp.players.at(id);
    if (!p || !mp.players.exists(p) || !p.account) return null;
    return p;
}

function byId(id) {
    return data.bases.find(function (b) {
        return b.id === Number(id);
    });
}

function ownedBy(p) {
    const id = accId(p);
    return data.bases.find(function (b) {
        return b.type === 'family' && b.owner === id;
    });
}

function memberOf(p) {
    const id = accId(p);
    return data.bases.find(function (b) {
        return b.type === 'family' && b.members.some(function (m) {
            return m.id === id;
        });
    });
}

function isArmy(p) {
    return !!p.account && p.account.job === 'army';
}

function armyRank(p) {
    return isArmy(p) ? Number(p.account.job_rank) || 1 : 0;
}

async function saveAcc(p, sql, vals) {
    try {
        await db.query(sql, vals);
    } catch (e) {
        console.log('[bases] db: ' + e.message);
    }
}

function pay(p, n, why) {
    p.account.money = (p.account.money || 0) + n;
    saveAcc(p, 'UPDATE accounts SET money = ? WHERE id = ?', [p.account.money, p.account.id]);
    msg(p, why + ': !{#7fff7f}+$' + n);
}

function draw(b) {
    clear(b);
    const pos = new mp.Vector3(b.x, b.y, b.z);
    const army = b.type === 'army';
    const label = army ? 'Военная база: ' + b.name : b.owner ? 'База семьи ' + b.name : 'Продаётся база: ' + b.name;
    try {
        live[b.id] = {
            blip: mp.blips.new(army ? 421 : b.owner ? 40 : 374, pos, {
                name: label,
                color: army ? 52 : b.owner ? 3 : 2,
                shortRange: true,
                dimension: 0
            }),
            shape: mp.colshapes.newSphere(b.x, b.y, b.z, b.r, 0)
        };
        live[b.id].shape.baseId = b.id;
    } catch (e) {
        console.log('[bases] draw: ' + e.message);
    }
}

function clear(b) {
    const l = live[b.id];
    if (!l) return;
    try { l.blip.destroy(); } catch (e) {}
    try { l.shape.destroy(); } catch (e) {}
    delete live[b.id];
}

function load() {
    try {
        data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch (e) {
        data = { seq: 1, bases: [] };
    }
    if (!data.bases) data.bases = [];
    data.bases.forEach(draw);
}

load();

mp.events.add('playerEnterColshape', function (p, shape) {
    if (!shape || !shape.baseId) return;
    const b = byId(shape.baseId);
    if (!b) return;
    if (b.type === 'army') {
        msg(p, isArmy(p) ? 'Ты на базе !{#c0a060}' + b.name : '!{#ff5c5c}Военная территория ' + b.name + '. Посторонним вход запрещён!');
        return;
    }
    if (!b.owner) {
        msg(p, 'База !{#c0a060}' + b.name + '!{#ffffff} продаётся. Цена: $' + b.price + '. Покупка через донат.');
        return;
    }
    const id = accId(p);
    const mine = b.owner === id || b.members.some(function (m) { return m.id === id; });
    msg(p, mine ? 'Добро пожаловать на базу !{#c0a060}' + b.name : 'Территория семьи !{#c0a060}' + b.name + '!{#ffffff}, владелец ' + b.ownerName);
});

function payday() {
    mp.players.forEach(function (p) {
        if (!p.account) return;
        const own = ownedBy(p);
        if (own) pay(p, CFG.ownerPay, 'Доход с базы ' + own.name);
        else if (memberOf(p)) pay(p, CFG.memberPay, 'Зарплата семьи ' + memberOf(p).name);
        if (isArmy(p)) {
            const r = armyRank(p);
            const bases = data.bases.filter(function (b) { return b.type === 'army'; }).length;
            const sum = (CFG.armyPay[r] || CFG.armyPay[1]) + CFG.armyBasePay * bases;
            pay(p, sum, 'Зарплата САФ (' + (CFG.armyRanks[r] || r) + ')');
        }
    });
}

setInterval(payday, CFG.payMinutes * 60 * 1000);

mp.events.addCommand('basehelp', function (p) {
    msg(p, '/baseinfo /baseinvite [id] /basekick [id] /baseleave /basemembers /basegps');
    msg(p, '/gate - открыть ворота, /baselock - пускать гостей, /basegate [gate|bar|fence] /basegatedel');
    if (isAdmin(p)) {
        msg(p, 'Админ: /basecreate [family|army] [цена] [радиус] [название]');
        msg(p, '/basegive [база] [игрок] /basefree [база] /basedel [база] /basewipe [база]');
        msg(p, '/baselist /basetp /basesetarmy /baseprice [база] [цена] /basename [база] [имя]');
        msg(p, '/setarmy [игрок] [ранг 1-7] /unarmy [игрок] /paydaynow');
    }
});

mp.events.addCommand('basecreate', function (p, args) {
    if (!isAdmin(p)) return;
    const a = String(args || '').trim().split(' ');
    const type = a[0] === 'army' ? 'army' : 'family';
    const price = parseInt(a[1], 10) || 0;
    const r = parseFloat(a[2]) || 40;
    const name = a.slice(3).join(' ') || ('База ' + data.seq);
    const b = {
        id: data.seq++,
        name: name,
        type: type,
        price: price,
        r: r,
        x: Number(p.position.x.toFixed(2)),
        y: Number(p.position.y.toFixed(2)),
        z: Number(p.position.z.toFixed(2)),
        owner: null,
        ownerName: '',
        members: []
    };
    data.bases.push(b);
    save();
    draw(b);
    msg(p, 'Создана база #' + b.id + ' "' + name + '" (' + type + ', радиус ' + r + ' м). Обустрой её: /milbase /prop');
});

mp.events.addCommand('baselist', function (p) {
    if (!isAdmin(p)) return;
    if (!data.bases.length) return msg(p, 'Баз пока нет');
    data.bases.forEach(function (b) {
        msg(p, '#' + b.id + ' ' + b.name + ' [' + b.type + '] ' + (b.owner ? 'владелец ' + b.ownerName : 'свободна') + ', $' + b.price);
    });
});

mp.events.addCommand('basetp', function (p, arg) {
    if (!isAdmin(p)) return;
    const b = byId(arg);
    if (!b) return msg(p, 'Нет такой базы');
    p.position = new mp.Vector3(b.x, b.y, b.z + 1);
});

mp.events.addCommand('basegive', function (p, args) {
    if (!isAdmin(p)) return;
    const a = String(args || '').trim().split(' ');
    const b = byId(a[0]);
    const t = findPlayer(a[1]);
    if (!b || b.type !== 'family') return msg(p, 'Нет такой семейной базы');
    if (!t) return msg(p, 'Игрок не найден');
    if (ownedBy(t)) return msg(p, 'У игрока уже есть база');
    b.owner = accId(t);
    b.ownerName = t.name;
    b.members = [];
    save();
    draw(b);
    msg(p, 'База #' + b.id + ' выдана ' + t.name);
    msg(t, 'Тебе выдана база !{#c0a060}' + b.name + '!{#ffffff}. Приглашай семью: /baseinvite [id]');
});

mp.events.addCommand('basefree', function (p, arg) {
    if (!isAdmin(p)) return;
    const b = byId(arg);
    if (!b) return msg(p, 'Нет такой базы');
    b.owner = null;
    b.ownerName = '';
    b.members = [];
    save();
    draw(b);
    msg(p, 'База #' + b.id + ' снова продаётся');
});

mp.events.addCommand('basedel', function (p, arg) {
    if (!isAdmin(p)) return;
    const b = byId(arg);
    if (!b) return msg(p, 'Нет такой базы. Список: /baselist');
    clear(b);
    removeGates(b);
    data.bases = data.bases.filter(function (x) { return x.id !== b.id; });
    save();
    msg(p, 'База "' + b.name + '" удалена. Постройки остались, снести: /basewipe');
});

mp.events.addCommand('basewipe', function (p, arg) {
    if (!isAdmin(p)) return;
    const b = byId(arg);
    const x = b ? b.x : p.position.x;
    const y = b ? b.y : p.position.y;
    const r = b ? b.r + 10 : 60;
    const a = global.ApocSystem;
    if (!a) return msg(p, 'Модуль построек не загружен');
    const n = a.clearArea(x, y, r);
    if (b) {
        clear(b);
        removeGates(b);
        data.bases = data.bases.filter(function (z) { return z.id !== b.id; });
        save();
    }
    msg(p, 'Снесено объектов: ' + n + (b ? '. База "' + b.name + '" удалена.' : ' (вокруг тебя, радиус 60 м)'));
});

mp.events.addCommand('baseprice', function (p, args) {
    if (!isAdmin(p)) return;
    const a = String(args || '').trim().split(' ');
    const base = byId(a[0]) || data.bases.find(function (x) { return inside(p, x, 15); });
    const sum = parseInt(a[1], 10);
    if (!base) return msg(p, 'Использование: /baseprice [номер базы] [цена]. Список: /baselist');
    if (isNaN(sum) || sum < 0) return msg(p, 'Цена базы "' + base.name + '": $' + base.price + '. Изменить: /baseprice ' + base.id + ' 500000');
    base.price = sum;
    save();
    draw(base);
    msg(p, 'Цена базы "' + base.name + '" теперь $' + sum);
});

mp.events.addCommand('basename', function (p, args) {
    if (!isAdmin(p)) return;
    const a = String(args || '').trim().split(' ');
    const base = byId(a[0]);
    const name = a.slice(1).join(' ');
    if (!base || !name) return msg(p, 'Использование: /basename [номер] [новое название]');
    base.name = name;
    save();
    draw(base);
    msg(p, 'База переименована: ' + name);
});

mp.events.addCommand('baseinfo', function (p) {
    const b = ownedBy(p) || memberOf(p);
    if (!b) return msg(p, 'У тебя нет базы');
    msg(p, b.name + ', владелец ' + b.ownerName + ', в семье ' + b.members.length + '/' + CFG.maxMembers);
    msg(p, 'Зарплата каждые ' + CFG.payMinutes + ' мин: владелец $' + CFG.ownerPay + ', участник $' + CFG.memberPay);
});

mp.events.addCommand('basegps', function (p) {
    const b = ownedBy(p) || memberOf(p);
    if (!b) return msg(p, 'У тебя нет базы');
    p.call('medic:route', [b.x, b.y]);
    msg(p, 'Метка на базу поставлена');
});

mp.events.addCommand('baseinvite', function (p, arg) {
    const b = ownedBy(p);
    if (!b) return msg(p, 'Приглашать может только владелец базы');
    const t = findPlayer(arg);
    if (!t) return msg(p, 'Игрок не найден');
    if (ownedBy(t) || memberOf(t)) return msg(p, 'Игрок уже в семье');
    if (b.members.length >= CFG.maxMembers) return msg(p, 'Семья заполнена');
    b.members.push({ id: accId(t), name: t.name });
    save();
    msg(p, t.name + ' принят в семью');
    msg(t, 'Ты принят в семью !{#c0a060}' + b.name + '!{#ffffff}. Метка на базу: /basegps');
});

mp.events.addCommand('basekick', function (p, arg) {
    const b = ownedBy(p);
    if (!b) return msg(p, 'Выгонять может только владелец');
    const t = findPlayer(arg);
    const id = t ? accId(t) : null;
    const before = b.members.length;
    b.members = b.members.filter(function (m) {
        return m.id !== id && m.name !== String(arg);
    });
    if (b.members.length === before) return msg(p, 'Такого участника нет. Список: /basemembers');
    save();
    msg(p, 'Участник исключён');
    if (t) msg(t, 'Тебя исключили из семьи ' + b.name);
});

mp.events.addCommand('baseleave', function (p) {
    const b = memberOf(p);
    if (!b) return msg(p, 'Ты не участник семьи');
    const id = accId(p);
    b.members = b.members.filter(function (m) { return m.id !== id; });
    save();
    msg(p, 'Ты покинул семью ' + b.name);
});

mp.events.addCommand('basemembers', function (p) {
    const b = ownedBy(p) || memberOf(p);
    if (!b) return msg(p, 'У тебя нет базы');
    msg(p, 'Владелец: ' + b.ownerName);
    msg(p, 'Участники: ' + (b.members.map(function (m) { return m.name; }).join(', ') || 'нет'));
});

mp.events.addCommand('setarmy', function (p, args) {
    if (!isAdmin(p)) return;
    const a = String(args || '').trim().split(' ');
    const t = findPlayer(a[0]);
    if (!t) return msg(p, 'Игрок не найден');
    let r = parseInt(a[1], 10);
    if (isNaN(r) || r < 1 || r > 7) r = 1;
    t.account.job = 'army';
    t.account.job_rank = r;
    saveAcc(t, 'UPDATE accounts SET job = ?, job_rank = ? WHERE id = ?', ['army', r, t.account.id]);
    msg(p, t.name + ' теперь в САФ: ' + CFG.armyRanks[r]);
    msg(t, 'Ты принят в САФ. Звание: !{#c0a060}' + CFG.armyRanks[r]);
});

mp.events.addCommand('unarmy', function (p, arg) {
    if (!isAdmin(p)) return;
    const t = findPlayer(arg);
    if (!t || !isArmy(t)) return msg(p, 'Игрок не в САФ');
    t.account.job = null;
    t.account.job_rank = 0;
    saveAcc(t, 'UPDATE accounts SET job = ?, job_rank = ? WHERE id = ?', [null, 0, t.account.id]);
    msg(p, t.name + ' уволен из САФ');
    msg(t, 'Ты уволен из САФ');
});

mp.events.addCommand('paydaynow', function (p) {
    if (!isAdmin(p)) return;
    payday();
    msg(p, 'Зарплата выдана всем');
});

const gateObjs = {};
const GATE_MODELS = { gate: 'prop_gate_military_01', bar: 'prop_sec_barrier_ld_01a', fence: 'prop_facgate_07b' };

function canEnter(p, b) {
    if (lvl(p) >= 2) return true;
    if (b.type === 'army') return isArmy(p);
    if (!b.owner || b.open) return true;
    const id = accId(p);
    return b.owner === id || b.members.some(function (m) { return m.id === id; });
}

function gateKey(b, i) {
    return b.id + '_' + i;
}

function spawnGate(b, i) {
    const g = b.gates[i];
    const k = gateKey(b, i);
    try { if (gateObjs[k]) gateObjs[k].destroy(); } catch (e) {}
    try {
        gateObjs[k] = mp.objects.new(mp.joaat(g.m), new mp.Vector3(g.x, g.y, g.z), {
            rotation: new mp.Vector3(0, 0, g.h),
            dimension: 0
        });
    } catch (e) {
        console.log('[bases] gate: ' + e.message);
    }
}

function spawnGates(b) {
    if (!b.gates) b.gates = [];
    b.gates.forEach(function (g, i) { spawnGate(b, i); });
}

function removeGates(b) {
    (b.gates || []).forEach(function (g, i) {
        const k = gateKey(b, i);
        try { if (gateObjs[k]) gateObjs[k].destroy(); } catch (e) {}
        delete gateObjs[k];
    });
}

data.bases.forEach(spawnGates);

function inside(p, b, extra) {
    const pos = p.vehicle ? p.vehicle.position : p.position;
    const dx = pos.x - b.x;
    const dy = pos.y - b.y;
    return Math.sqrt(dx * dx + dy * dy) <= b.r + (extra || 0) && Math.abs(pos.z - b.z) < 40;
}

setInterval(function () {
    mp.players.forEach(function (p) {
        if (!p.account || p.dimension !== 0) return;
        if (p.account.downed) return;
        const bad = data.bases.find(function (b) {
            return inside(p, b) && !canEnter(p, b);
        });
        if (!bad) {
            const pos = p.vehicle ? p.vehicle.position : p.position;
            p.baseSafe = { x: pos.x, y: pos.y, z: pos.z };
            return;
        }
        let s = p.baseSafe;
        if (!s) {
            const dx = p.position.x - bad.x;
            const dy = p.position.y - bad.y;
            const d = Math.sqrt(dx * dx + dy * dy) || 1;
            s = { x: bad.x + dx / d * (bad.r + 5), y: bad.y + dy / d * (bad.r + 5), z: p.position.z + 1 };
        }
        const v = new mp.Vector3(s.x, s.y, s.z + 0.3);
        if (p.vehicle && p.seat === 0) {
            p.vehicle.position = v;
            p.vehicle.velocity = new mp.Vector3(0, 0, 0);
        } else {
            p.position = v;
        }
        const now = Date.now();
        if (!p.baseWarn || now - p.baseWarn > 4000) {
            p.baseWarn = now;
            msg(p, bad.type === 'army' ? '!{#ff5c5c}Военная территория. Проход закрыт!' : '!{#ff5c5c}Частная территория семьи ' + bad.name + '. Вход только для своих!');
        }
    });
}, 1000);

mp.events.addCommand('basegate', function (p, arg) {
    const b = isAdmin(p) ? data.bases.find(function (x) { return inside(p, x, 10); }) : ownedBy(p);
    if (!b) return msg(p, 'Встань у своей базы');
    if (!inside(p, b, 10)) return msg(p, 'Ты слишком далеко от базы');
    if (!b.gates) b.gates = [];
    if (b.gates.length >= 4) return msg(p, 'Максимум 4 ворот');
    const m = GATE_MODELS[String(arg || '').trim()] || GATE_MODELS.gate;
    const r = p.heading * Math.PI / 180;
    b.gates.push({
        m: m,
        x: Number((p.position.x - Math.sin(r) * 3).toFixed(2)),
        y: Number((p.position.y + Math.cos(r) * 3).toFixed(2)),
        z: Number((p.position.z - 1).toFixed(2)),
        h: Number(p.heading.toFixed(1))
    });
    spawnGate(b, b.gates.length - 1);
    save();
    msg(p, 'Ворота поставлены. Открыть: /gate. Убрать: /basegatedel');
});

mp.events.addCommand('basegatedel', function (p) {
    const b = isAdmin(p) ? data.bases.find(function (x) { return inside(p, x, 10); }) : ownedBy(p);
    if (!b || !b.gates || !b.gates.length) return msg(p, 'Ворот нет');
    removeGates(b);
    b.gates.pop();
    spawnGates(b);
    save();
    msg(p, 'Последние ворота убраны');
});

mp.events.addCommand('gate', function (p) {
    let found = null;
    data.bases.forEach(function (b) {
        (b.gates || []).forEach(function (g, i) {
            const dx = p.position.x - g.x;
            const dy = p.position.y - g.y;
            if (Math.sqrt(dx * dx + dy * dy) < 15) found = { b: b, g: g, i: i };
        });
    });
    if (!found) return msg(p, 'Рядом нет ворот');
    if (!canEnter(p, found.b)) return msg(p, '!{#ff5c5c}Ворота открываются только для своих');
    const k = gateKey(found.b, found.i);
    const o = gateObjs[k];
    if (!o || o.baseOpen) return;
    o.baseOpen = true;
    o.position = new mp.Vector3(found.g.x, found.g.y, found.g.z - 6);
    msg(p, 'Ворота открыты на 10 секунд');
    setTimeout(function () {
        try {
            o.position = new mp.Vector3(found.g.x, found.g.y, found.g.z);
            o.baseOpen = false;
        } catch (e) {}
    }, 10000);
});

mp.events.addCommand('baselock', function (p) {
    const b = ownedBy(p);
    if (!b) return msg(p, 'Только для владельца базы');
    b.open = !b.open;
    save();
    msg(p, b.open ? 'База открыта для всех (гости могут заходить)' : 'База закрыта: вход только для семьи');
});

mp.events.addCommand('basesetarmy', function (p, arg) {
    if (!isAdmin(p)) return;
    const b = byId(arg);
    if (!b) return msg(p, 'Нет такой базы');
    b.type = b.type === 'army' ? 'family' : 'army';
    save();
    draw(b);
    msg(p, 'Тип базы: ' + b.type);
});

global.BaseSystem = { ownedBy: ownedBy, memberOf: memberOf, isArmy: isArmy };

console.log('[bases] баз: ' + data.bases.length + ', зарплата каждые ' + CFG.payMinutes + ' мин');