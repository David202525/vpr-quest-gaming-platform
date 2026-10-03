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
    crate: ['prop_box_wood02a'],
    bush: ['prop_bush_lrg_04b', 'prop_bush_med_03', 'prop_bush_lrg_02'],
    grass: ['prop_grass_dry_02', 'prop_grass_dry_03'],
    milcrate: ['prop_mil_crate_01', 'prop_mil_crate_02'],
    light: ['prop_worklight_03b', 'prop_worklight_04c'],
    gate: ['prop_sec_barrier_ld_01a'],
    milgate: ['prop_gate_military_01'],
    flag: ['prop_flag_us'],
    sat: ['prop_satdish_l_02'],
    cabin: ['prop_portacabin01'],
    container: ['prop_container_01a', 'prop_container_05a'],
    tent: ['prop_skid_tent_01', 'prop_skid_tent_03'],
    gen: ['prop_generator_03a'],
    tank: ['prop_fueltank_02a'],
    chair: ['prop_table_03b_cs'],
    tower: ['prop_watertower02']
};

const VEHS = {
    tank: 'rhino',
    apc: 'apc',
    truck: 'barracks',
    truck2: 'barracks3',
    jeep: 'crusader',
    armored: 'insurgent2',
    halftrack: 'halftrack'
};

const STATIC = ['obj', 'veh'];

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
    if (it.k === 'veh') {
        try {
            const v = mp.vehicles.new(mp.joaat(it.m), new mp.Vector3(it.x, it.y, it.z + 1.0), {
                heading: it.h,
                locked: true,
                engine: false,
                dimension: 0
            });
            v.apocStatic = true;
            ents[it.id] = v;
        } catch (e) {
            console.log('[apoc] veh ' + it.m + ': ' + e.message);
        }
        return;
    }
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
    try {
        if (o) o.destroy();
    } catch (e) {}
    delete ents[it.id];
}

function fxList() {
    return data.items.filter(function (it) {
        return STATIC.indexOf(it.k) === -1;
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
    msg(p, 'Техника: /pveh [' + Object.keys(VEHS).join(', ') + '] [поворот]');
    msg(p, '/fire [1-3] /smoke /apoc /overgrow [кол-во] /wreckzone [кол-во]');
    msg(p, 'Готовое: /blockpost /milpost /milbase [20-90] /milhouse');
    msg(p, '/propdel /propundo [кол-во] /propclear [радиус]');
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

function batch(p, list) {
    list.forEach(function (e) {
        const pos = at(p, e[2], e[3], e[4] || 0);
        if (e[0] === 'veh') add(p, 'veh', e[1], pos);
        else if (e[0] === 'fire') add(p, 'fire', '', pos, e[1]);
        else add(p, 'obj', TYPES[e[1]] ? pick(TYPES[e[1]]) : e[1], pos);
    });
    save();
    broadcast();
}

mp.events.addCommand('pveh', function (p, arg) {
    if (!isAdmin(p)) return;
    const parts = String(arg || '').trim().split(' ');
    const model = VEHS[parts[0]] || parts[0];
    if (!model) return msg(p, 'Пиши: /pveh tank. Типы: ' + Object.keys(VEHS).join(', '));
    const turn = parseFloat(parts[1]) || 0;
    add(p, 'veh', model, at(p, 6, 0, turn));
    save();
    msg(p, 'Техника поставлена: ' + model);
});

mp.events.addCommand('milpost', function (p) {
    if (!isAdmin(p)) return;
    batch(p, [
        ['obj', 'milgate', 10, 0],
        ['obj', 'concrete', 10, -5], ['obj', 'concrete', 10, 5],
        ['obj', 'concrete', 10, -8], ['obj', 'concrete', 10, 8],
        ['obj', 'sandbag', 13, -6], ['obj', 'sandbag', 13, 6],
        ['obj', 'hesco', 14, -10, 90], ['obj', 'hesco', 14, 10, 90],
        ['obj', 'light', 12, -7, 180], ['obj', 'light', 12, 7, 180],
        ['obj', 'flag', 15, -9],
        ['obj', 'milcrate', 15, 7], ['obj', 'milcrate', 16, 8],
        ['veh', 'apc', 18, -6, 0],
        ['veh', 'rhino', 20, 6, 0],
        ['veh', 'barracks', 26, 0, 90]
    ]);
    msg(p, 'Военный блокпост построен');
});

function houseBlock(list, f, side) {
    list.push(['obj', 'cabin', f, side, 90]);
    list.push(['obj', 'cabin', f + 6, side, 90]);
    list.push(['obj', 'tent', f + 12, side, 90]);
    list.push(['obj', 'container', f, side + 7, 90]);
}

mp.events.addCommand('milbase', function (p, arg) {
    if (!isAdmin(p)) return;
    let size = parseInt(arg, 10);
    if (isNaN(size) || size < 20 || size > 90) size = 50;
    const half = Math.round(size / 2);
    const front = 8;
    const back = front + size;
    const mid = (front + back) / 2;
    const list = [];
    for (let i = -half; i <= half; i += 3) {
        if (Math.abs(i) > 4) list.push(['obj', 'hesco', front, i]);
        list.push(['obj', 'hesco', back, i]);
    }
    for (let f = front + 3; f <= back - 3; f += 3) {
        list.push(['obj', 'hesco', f, -half, 90]);
        list.push(['obj', 'hesco', f, half, 90]);
    }
    list.push(['obj', 'milgate', front, 0]);
    list.push(['obj', 'light', front + 2, -5, 180], ['obj', 'light', front + 2, 5, 180]);
    list.push(['obj', 'light', back - 2, -half + 2, 45], ['obj', 'light', back - 2, half - 2, -45]);
    list.push(['obj', 'light', mid, -half + 2, 90], ['obj', 'light', mid, half - 2, -90]);
    list.push(['obj', 'sandbag', front + 5, -5], ['obj', 'sandbag', front + 5, 5]);
    list.push(['obj', 'sandbag', front + 7, -7], ['obj', 'sandbag', front + 7, 7]);
    list.push(['obj', 'flag', back - 3, 0], ['obj', 'sat', back - 5, -half + 5]);
    list.push(['obj', 'tower', back - 5, half - 5]);
    list.push(['obj', 'gen', back - 8, -half + 8], ['obj', 'tank', back - 8, half - 8]);
    houseBlock(list, mid - 4, -half + 6);
    if (size >= 40) houseBlock(list, mid - 4, half - 12);
    if (size >= 70) houseBlock(list, back - 20, 0);
    for (let c = 0; c < 6; c++) {
        list.push(['obj', 'milcrate', back - 6 - (c % 3) * 2, half - 14 - Math.floor(c / 3) * 2]);
    }
    list.push(['veh', 'barracks', front + 14, -half + 5, 0], ['veh', 'barracks3', front + 14, -half + 10, 0]);
    list.push(['veh', 'crusader', front + 20, -half + 5, 0], ['veh', 'crusader', front + 20, -half + 10, 0]);
    list.push(['veh', 'insurgent2', front + 14, half - 5, 0], ['veh', 'apc', front + 20, half - 5, 0]);
    list.push(['veh', 'rhino', front + 10, half - 10, 0], ['veh', 'rhino', front + 10, -half + 15, 0]);
    batch(p, list);
    msg(p, 'База ' + size + 'x' + size + ' м готова: казармы, палатки, вышка, генератор (' + list.length + ' объектов)');
});

mp.events.addCommand('milhouse', function (p) {
    if (!isAdmin(p)) return;
    const list = [];
    houseBlock(list, 6, 0);
    list.push(['obj', 'light', 4, -4, 180], ['obj', 'light', 4, 4, 180]);
    list.push(['obj', 'gen', 6, -6], ['obj', 'milcrate', 10, -6]);
    batch(p, list);
    msg(p, 'Жилой блок построен: 2 казармы, палатка, контейнер');
});

mp.events.addCommand('wreckzone', function (p, arg) {
    if (!isAdmin(p)) return;
    let n = parseInt(arg, 10);
    if (isNaN(n) || n < 1 || n > 40) n = 12;
    const list = [];
    for (let i = 0; i < n; i++) {
        const fwd = 4 + Math.random() * 40;
        const side = (Math.random() - 0.5) * 12;
        const rot = Math.random() * 360;
        const r = Math.random();
        const t = r < 0.55 ? 'wreck' : r < 0.65 ? 'bus' : r < 0.8 ? 'tyres' : 'trash';
        list.push(['obj', t, fwd, side, rot]);
    }
    for (let j = 0; j < Math.ceil(n / 2); j++) {
        list.push(['obj', Math.random() < 0.6 ? 'bush' : 'grass', 4 + Math.random() * 40, (Math.random() - 0.5) * 16, Math.random() * 360]);
    }
    if (Math.random() < 0.5) list.push(['fire', 1, 10 + Math.random() * 25, (Math.random() - 0.5) * 8]);
    batch(p, list);
    msg(p, 'Заброшенная улица: ' + list.length + ' объектов впереди тебя');
});

mp.events.addCommand('overgrow', function (p, arg) {
    if (!isAdmin(p)) return;
    let n = parseInt(arg, 10);
    if (isNaN(n) || n < 1 || n > 40) n = 15;
    const list = [];
    for (let i = 0; i < n; i++) {
        const a = Math.random() * 360;
        const d = 2 + Math.random() * 18;
        const rad = a * Math.PI / 180;
        list.push(['obj', Math.random() < 0.6 ? 'bush' : 'grass', Math.cos(rad) * d, Math.sin(rad) * d, Math.random() * 360]);
    }
    batch(p, list);
    msg(p, 'Заросли вокруг: ' + n);
});

mp.events.addCommand('propdel', function (p) {
    if (!isAdmin(p)) return;
    const it = near(p, 5);
    if (!it) return msg(p, 'Рядом ничего нет (5 м)');
    remove(it);
    save();
    if (STATIC.indexOf(it.k) === -1) broadcast();
    msg(p, 'Удалено');
});

mp.events.addCommand('propundo', function (p, arg) {
    if (!isAdmin(p)) return;
    let n = parseInt(arg, 10);
    if (isNaN(n) || n < 1) n = 1;
    const list = p.apocLast || [];
    let done = 0;
    while (done < n && list.length) {
        const id = list.pop();
        const it = data.items.find(function (x) {
            return x.id === id;
        });
        if (it) {
            remove(it);
            done++;
        }
    }
    if (!done) return msg(p, 'Нечего отменять');
    save();
    broadcast();
    msg(p, 'Убрано объектов: ' + done);
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

global.ApocSystem = {
    clearArea: function (x, y, r) {
        const del = data.items.filter(function (it) {
            const dx = it.x - x;
            const dy = it.y - y;
            return Math.sqrt(dx * dx + dy * dy) <= r;
        });
        del.forEach(remove);
        if (del.length) {
            save();
            broadcast();
        }
        return del.length;
    }
};
