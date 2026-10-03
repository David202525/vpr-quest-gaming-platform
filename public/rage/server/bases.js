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
    if (isAdmin(p)) {
        msg(p, 'Админ: /basecreate [family|army] [цена] [радиус] [название]');
        msg(p, '/basegive [база] [игрок] /basefree [база] /basedel [база] /baselist /basetp [база]');
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
    if (!b) return msg(p, 'Нет такой базы');
    clear(b);
    data.bases = data.bases.filter(function (x) { return x.id !== b.id; });
    save();
    msg(p, 'База удалена. Постройки убери через /propclear');
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

global.BaseSystem = { ownedBy: ownedBy, memberOf: memberOf, isArmy: isArmy };

console.log('[bases] баз: ' + data.bases.length + ', зарплата каждые ' + CFG.payMinutes + ' мин');
