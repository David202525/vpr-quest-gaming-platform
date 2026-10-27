const NEED = 7;
const R = { items: {}, prov: [] };

function add(id, o) { o.id = id; R.items[id] = o; }
function provider(fn) { R.prov.push(fn); }
function all() {
    let list = Object.keys(R.items).map(function (k) { return R.items[k]; });
    R.prov.forEach(function (f) {
        try { list = list.concat(f() || []); } catch (e) { console.log('[points] ' + e.message); }
    });
    return list;
}
function find(id) { return all().find(function (o) { return o.id === id; }) || null; }
function norm(v) {
    if (!v) return null;
    if (Array.isArray(v)) return { x: Number(v[0]), y: Number(v[1]), z: Number(v[2]), h: Number(v[3]) || 0 };
    if (!isFinite(v.x) || !isFinite(v.y)) return null;
    return { x: Number(v.x), y: Number(v.y), z: Number(v.z), h: Number(v.h) || 0 };
}
function getOf(o) { try { return norm(o.get()); } catch (e) { return null; } }
function dimOf(o) { try { return typeof o.dim === 'function' ? Number(o.dim()) || 0 : Number(o.dim) || 0; } catch (e) { return 0; } }
function r2(n) { return Math.round(n * 100) / 100; }
function admLvl(p) { return global.AdminSystem && global.AdminSystem.realLvl ? global.AdminSystem.realLvl(p) : 0; }
function notify(p, type, text) { if (typeof global.hudNotify === 'function') global.hudNotify(p, type, text); else p.outputChatBox(text); }
function ok(p) { if (admLvl(p) >= NEED) return true; notify(p, 'error', 'Редактор меток доступен с ' + NEED + ' уровня администрации'); return false; }

function payload(p) {
    const me = p.position;
    return all().map(function (o) {
        const v = getOf(o);
        const d = v ? Math.round(Math.hypot(v.x - me.x, v.y - me.y)) : -1;
        return { i: o.id, g: o.g, n: o.n, x: v ? r2(v.x) : null, y: v ? r2(v.y) : null, z: v ? r2(v.z) : null, h: v ? Math.round(v.h) : 0, d: d, r: o.reset ? 1 : 0, del: o.del ? 1 : 0 };
    });
}
function send(p, ev) { if (mp.players.exists(p)) p.call(ev || 'pts:data', [JSON.stringify(payload(p))]); }

function apply(p, o, v) {
    try {
        o.set(v);
        console.log('[points] ' + p.name + ' → ' + o.id + ' ' + JSON.stringify(v));
        if (global.SLog) { try { global.SLog.add('admin', { actor: p, action: 'point', details: o.g + ' / ' + o.n }); } catch (e) {} }
        notify(p, 'ok', 'Метка «' + o.n + '» перенесена');
    } catch (e) {
        notify(p, 'error', 'Не удалось сохранить: ' + e.message);
    }
}

function open(p) { if (ok(p)) send(p, 'pts:open'); }
mp.events.addCommand('points', open);
mp.events.addCommand('pts', open);
mp.events.add('srv:pts:list', function (p) { if (admLvl(p) >= NEED) send(p); });

mp.events.add('srv:pts:tp', function (p, id) {
    if (!ok(p)) return;
    const o = find(String(id)), v = o && getOf(o);
    if (!v) return notify(p, 'warn', 'У этой метки ещё нет позиции — нажмите «Сюда»');
    p.dimension = dimOf(o);
    p.position = new mp.Vector3(v.x, v.y, v.z + 0.3);
    p.heading = v.h;
});
mp.events.add('srv:pts:here', function (p, id) {
    if (!ok(p)) return;
    const o = find(String(id));
    if (!o) return;
    const e = p.vehicle || p;
    apply(p, o, { x: r2(e.position.x), y: r2(e.position.y), z: r2(e.position.z), h: Math.round(e.heading || p.heading || 0) });
    send(p);
});
mp.events.add('srv:pts:edit', function (p, id) {
    if (!ok(p)) return;
    const o = find(String(id));
    if (!o) return;
    let v = getOf(o);
    if (!v) v = { x: p.position.x, y: p.position.y, z: p.position.z, h: p.heading || 0 };
    const dm = dimOf(o);
    if (p.dimension !== dm || Math.hypot(p.position.x - v.x, p.position.y - v.y) > 60 || Math.abs(p.position.z - v.z) > 15) {
        p.dimension = dm;
        p.position = new mp.Vector3(v.x + 1.5, v.y + 1.5, v.z + 0.5);
    }
    p.call('pts:edit', [JSON.stringify({ i: o.id, n: o.g + ' · ' + o.n, x: v.x, y: v.y, z: v.z, h: v.h })]);
});
mp.events.add('srv:pts:save', function (p, id, json) {
    if (!ok(p)) return;
    const o = find(String(id));
    let v = null;
    try { v = norm(JSON.parse(json)); } catch (e) {}
    if (!o || !v || !isFinite(v.z)) return;
    v = { x: r2(v.x), y: r2(v.y), z: r2(v.z), h: Math.round(((v.h % 360) + 360) % 360) };
    apply(p, o, v);
});
mp.events.add('srv:pts:reset', function (p, id) {
    if (!ok(p)) return;
    const o = find(String(id));
    if (!o || !o.reset) return;
    try { o.reset(); notify(p, 'ok', 'Метка «' + o.n + '» сброшена на стандартную'); } catch (e) { notify(p, 'error', e.message); }
    send(p);
});
mp.events.add('srv:pts:del', function (p, id) {
    if (!ok(p)) return;
    const o = find(String(id));
    if (!o || !o.del) return;
    try { o.del(); notify(p, 'ok', 'Метка «' + o.n + '» удалена'); } catch (e) { notify(p, 'error', e.message); }
    send(p);
});

global.PointReg = { add: add, provider: provider, all: all, find: find };
module.exports = global.PointReg;
console.log('[points] редактор меток загружен (/points)');