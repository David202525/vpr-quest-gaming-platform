const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'apoc_props.json');
const ADMIN_LEVEL = 2;

const TYPES = {
    wreck: ['prop_rub_carwreck_2', 'prop_rub_carwreck_3', 'prop_rub_carwreck_7'],
    bus: ['prop_rub_buswreck_01', 'prop_rub_buswreck_03'],
    concrete: ['prop_mp_conc_barrier_01'],
    sandbag: ['prop_mb_sandblock_01', 'prop_mb_sandblock_02'],
    hesco: ['prop_mb_hesco_06'],
    barrier: ['prop_mp_barrier_02b'],
    fence: ['prop_const_fence02a'],
    barrel: ['prop_barrel_02a'],
    tyres: ['prop_rub_tyre_01'],
    trash: ['prop_rub_binbag_01', 'prop_rub_binbag_03'],
    crate: ['prop_box_wood02a']
};

let data = { on: false, items: [] };
let seq = 1;
const ents = {};

function lvl(p) {
    const d = global.DeathSystem;
    if (d && typeof d.adminLvl === 'function') return d.adminLvl(p);
    return p && p.account ? Number(p.account.admin) || 0 : 0;
}

function isAdmin(p) {
    return lvl(p) >= ADMIN_LEVEL;
}

function msg(p, t) {
    p.outputChatBox('!{#c0a060}[APOC] !{#ffffff}' + t);
}

function save() {
    try {
        fs.writeFileSync(FILE, JSON.stringify(data));
    } catch (e) {
        console.log('[apoc] save: ' + e.message);
    }
}

function spawn(it) {
    if (it.k !== 'obj') return;
    try {
        const pos = new mp.Vector3(it.x, it.y, it.z);
        ents[it.id] = mp.objects.new(mp.joaat(it.m), pos, {
            rotation: new mp.Vector3(0, 0, it.h),
            dimension: 0
        });
    } catch (e) {
        console.log('[apoc] spawn ' + it.m + ': ' + e.message);
    }
}

function unspawn(it) {
    const o = ents[it.id];
    if (o && mp.objects.exists(o)) o.destroy();
    delete ents[it.id];
}

function fxList() {
    return data.items.filter(function (it) {
        return it.k !== 'obj';
    });
}

function stateJson() {
    return JSON.stringify({ on: data.on, fx: fxList() });
}

function broadcast() {
    const s = stateJson();
    mp.players.forEach(function (p) {
        p.call('apoc:state', [s]);
    });
}

function add(p, k, m, pos, s) {
    const it = {
        id: seq++,
        k: k,
        m: m || '',
        x: Number(pos.x.toFixed(2)),
        y: Number(pos.y.toFixed(2)),
        z: Number(pos.z.toFixed(2)),
        h: Number((pos.h || 0).toFixed(1)),
        s: s || 1
    };
    data.items.push(it);
    spawn(it);
    if (!p.apocLast) p.apocLast = [];
    p.apocLast.push(it.id);
    return it;
}

function remove(it) {
    unspawn(it);
    data.items = data.items.filter(function (x) {
        return x.id !== it.id;
    });
}

function at(p, fwd, right, turn) {
    const h = p.heading;
    const r = h * Math.PI / 180;
    const fx = -Math.sin(r);
    const fy = Math.cos(r);
    const rx = Math.cos(r);
    const ry = Math.sin(r);
    return {
        x: p.position.x + fx * fwd + rx * right,
        y: p.position.y + fy * fwd + ry * right,
        z: p.position.z - 1.0,
        h: h + (turn || 0)
    };
}

function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function near(p, r) {
    let best = null;
    let bd = r;
    data.items.forEach(function (it) {
        const dx = it.x - p.position.x;
        const dy = it.y - p.position.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < bd) {
            bd = d;
            best = it;
        }
    });
    return best;
}

function load() {
    try {
        data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch (e) {
        data = { on: false, items: [] };
    }
    if (!data.items) data.items = [];
    data.items.forEach(function (it) {
        if (it.id >= seq) seq = it.id + 1;
        spawn(it);
    });
    if (data.on) mp.world.weather = 'FOGGY';
}

load();

mp.events.add('apoc:sync', function (p) {
    p.call('apoc:state', [stateJson()]);
});

mp.events.add('playerReady', function (p) {
    p.call('apoc:state', [stateJson()]);
});

mp.events.addCommand('proplist', function (p) {
    if (!isAdmin(p)) return;
    msg(p, 'Объекты: ' + Object.keys(TYPES).join(', '));
    msg(p, '/prop [тип] [поворот] - поставить перед собой');
    msg(p, '/fire [1-3] /smoke /blockpost /apoc');
    msg(p, '/propdel /propundo /propclear [радиус]');
});

mp.events.addCommand('prop', function (p, args) {
    if (!isAdmin(p)) return;
    const parts = String(args || '').trim().split(' ');
    const type = parts[0];
    if (!type) return msg(p, 'Пиши: /prop wreck. Список: /proplist');
    const turn = parseFloat(parts[1]) || 0;
    const model = TYPES[type] ? pick(TYPES[type]) : type;
    add(p, 'obj', model, at(p, 2.5, 0, turn));
    save();
    msg(p, 'Поставлено: ' + model);
});

mp.events.addCommand('fire', function (p, arg) {
    if (!isAdmin(p)) return;
    let s = parseInt(arg, 10);
    if (isNaN(s) || s < 1 || s > 3) s = 1;
    add(p, 'fire', '', at(p, 2.0, 0, 0), s);
    save();
    broadcast();
    msg(p, 'Огонь размером ' + s + ' поставлен');
});

mp.events.addCommand('smoke', function (p) {
    if (!isAdmin(p)) return;
    add(p, 'smoke', '', at(p, 2.0, 0, 0), 1);
    save();
    broadcast();
    msg(p, 'Дым поставлен');
});

mp.events.addCommand('blockpost', function (p) {
    if (!isAdmin(p)) return;
    add(p, 'obj', 'prop_mp_conc_barrier_01', at(p, 8, -6, 0));
    add(p, 'obj', 'prop_mp_conc_barrier_01', at(p, 8, -3, 0));
    add(p, 'obj', 'prop_mp_barrier_02b', at(p, 8, 0, 0));
    add(p, 'obj', 'prop_mp_conc_barrier_01', at(p, 8, 3, 0));
    add(p, 'obj', 'prop_mp_conc_barrier_01', at(p, 8, 6, 0));
    add(p, 'obj', 'prop_mb_sandblock_01', at(p, 10, -4, 0));
    add(p, 'obj', 'prop_mb_sandblock_01', at(p, 10, 4, 0));
    add(p, 'obj', 'prop_rub_carwreck_3', at(p, 5, -8, 30));
    add(p, 'obj', 'prop_barrel_02a', at(p, 10, 7, 0));
    add(p, 'fire', '', at(p, 10, 7, 0), 1);
    save();
    broadcast();
    msg(p, 'Блокпост построен. Убрать по одному: /propundo');
});

mp.events.addCommand('propdel', function (p) {
    if (!isAdmin(p)) return;
    const it = near(p, 5);
    if (!it) return msg(p, 'Рядом ничего нет (5 м)');
    remove(it);
    save();
    if (it.k !== 'obj') broadcast();
    msg(p, 'Удалено');
});

mp.events.addCommand('propundo', function (p) {
    if (!isAdmin(p)) return;
    const list = p.apocLast || [];
    const id = list.pop();
    const it = data.items.find(function (x) {
        return x.id === id;
    });
    if (!it) return msg(p, 'Нечего отменять');
    remove(it);
    save();
    if (it.k !== 'obj') broadcast();
    msg(p, 'Последний объект убран');
});

mp.events.addCommand('propclear', function (p, arg) {
    if (!isAdmin(p)) return;
    let r = parseFloat(arg);
    if (isNaN(r) || r <= 0) r = 20;
    const del = data.items.filter(function (it) {
        const dx = it.x - p.position.x;
        const dy = it.y - p.position.y;
        return Math.sqrt(dx * dx + dy * dy) <= r;
    });
    del.forEach(remove);
    save();
    broadcast();
    msg(p, 'Удалено объектов: ' + del.length);
});

mp.events.addCommand('apoc', function (p) {
    if (!isAdmin(p)) return;
    data.on = !data.on;
    mp.world.weather = data.on ? 'FOGGY' : 'CLEAR';
    save();
    broadcast();
    msg(p, data.on ? 'Апокалипсис включен' : 'Апокалипсис выключен');
});

console.log('[apoc] загружено объектов: ' + data.items.length);
