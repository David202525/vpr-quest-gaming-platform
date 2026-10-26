const fs = require('fs');
const path = require('path');
let db = null;
try { db = require('../database'); } catch (e) { try { db = require('./database'); } catch (e2) { db = null; } }

const FILE = path.join(__dirname, 'ems_data.json');
const DB = (function () { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch (e) { return {}; } })();
if (!DB.st) DB.st = {};
if (!DB.cert) DB.cert = [];
if (!DB.log) DB.log = [];
if (!DB.beds) DB.beds = [];
if (!DB.er) DB.er = [];
let dirty = false;
function mark() { dirty = true; }
setInterval(function () { if (!dirty) return; dirty = false; fs.writeFile(FILE, JSON.stringify(DB), function () {}); }, 5000);

const CFG = {
    wardSelf: 30000,
    wardMedic: 15000,
    medicFee: 250,
    base: { urgent: 400, call: 200 },
    perM: 0.25,
    distCap: 800,
    fastMs: 240000,
    fastK: 1.25,
    noCall: { revive: 250, deliver: 350, heal: 0 },
    callTimeout: 600000,
    erCar: 30,
    erFoot: 6,
    nearBlock: 40
};
const RANKS = ['Интерн', 'Фельдшер', 'Врач', 'Зав. отделением', 'Главврач'];
const DEF_BEDS = [
    { x: 324.2, y: -582.8, z: 43.28, h: 340.0 },
    { x: 322.6, y: -587.2, z: 43.28, h: 340.0 },
    { x: 317.7, y: -585.3, z: 43.28, h: 160.0 },
    { x: 319.4, y: -581.0, z: 43.28, h: 160.0 }
];
const DEF_ER = [{ x: 298.67, y: -584.43, z: 43.26 }];
const AMB = mp.joaat('ambulance') >>> 0;
const wardBusy = {};
const lastClosed = {};

function A(p) { return p && p.account ? p.account : null; }
function isMedic(p) { const a = A(p); return !!a && a.job === 'medic'; }
function onDuty(p) { const a = A(p); return !!a && a.medicDuty === true; }
function isDown(p) { const a = A(p); return !!a && a.downed === true; }
function sid(p) { const a = A(p); return a && a.id ? Number(a.id) : 0; }
function nick(p) { const a = A(p); return String((a && a.nick) || p.name).replace(/_/g, ' '); }
function rank(p) { const a = A(p); if (!a) return 0; if (Number(a.leader) === 1) return 5; return Math.max(1, Math.min(5, Number(a.job_rank) || 1)); }
function isChief(p) { return isMedic(p) && rank(p) >= 5; }
function notify(p, t, x) { if (typeof global.hudNotify === 'function') global.hudNotify(p, t, x); else p.outputChatBox(x); }
function chat(p, x) { p.outputChatBox('!{#ff5c5c}[EMS] !{#ffffff}' + x); }
function dist(a, b) { const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z; return Math.sqrt(dx * dx + dy * dy + dz * dz); }
function adm(p) { const D = global.DeathSystem; return D && D.adminLvl ? D.adminLvl(p) : 0; }
function beds() { return DEF_BEDS.concat(DB.beds); }
function ers() { return DEF_ER.concat(DB.er); }
function isAmb(v) { return !!(v && mp.vehicles.exists(v) && (v.model >>> 0) === AMB); }
function occ(v) { try { return v.getOccupants ? v.getOccupants() : []; } catch (e) { return []; } }

function St(id, n) {
    if (!DB.st[id]) DB.st[id] = { n: n || '#' + id, saved: 0, fail: 0, earn: 0, streak: 0 };
    if (n) DB.st[id].n = n;
    return DB.st[id];
}
function log(x) { DB.log.unshift({ t: Date.now(), x: x }); if (DB.log.length > 80) DB.log.length = 80; mark(); }
function MC() { return global.MedicCalls; }
function calls() { return MC() ? MC().list() : []; }
function callOf(p) { return calls().find(function (c) { return c.pid === p.id; }) || null; }
function chiefs() { return mp.players.toArray().filter(isChief); }

function saveMoney(p) {
    const a = A(p);
    if (!a || !db) return;
    try { const r = db.query('UPDATE accounts SET money = ? WHERE id = ?', [a.money || 0, a.id]); if (r && r.catch) r.catch(function () {}); } catch (e) {}
}
function pay(p, n) { const a = A(p); if (!a || n <= 0) return; a.money = (a.money || 0) + n; saveMoney(p); }
function charge(p, n) { const a = A(p); if (!a) return 0; const t = Math.min(a.money || 0, n); a.money = (a.money || 0) - t; saveMoney(p); return t; }

function patientPos(c) {
    const t = mp.players.at(c.pid);
    return t && mp.players.exists(t) ? t.position : c.pos;
}
function estimate(c, m) {
    const d = dist(m.position, patientPos(c));
    return (c.urgent ? CFG.base.urgent : CFG.base.call) + Math.min(CFG.distCap, Math.round(d * CFG.perM));
}

/* ---------- переноска ---------- */
function carrying(m) {
    if (m.emsCarry === undefined || m.emsCarry === null) return null;
    const t = mp.players.at(m.emsCarry);
    return t && mp.players.exists(t) && t.emsBy === m.id ? t : null;
}
function layDown(t) {
    setTimeout(function () {
        if (mp.players.exists(t) && isDown(t) && !t.vehicle && t.emsBy === null) { try { t.playAnimation('combat@damage@writhe', 'writhe_loop', 2, 1); } catch (e) {} }
    }, 350);
}
function release(m, t, lay) {
    if (m && mp.players.exists(m)) { m.emsCarry = null; try { m.stopAnimation(); } catch (e) {} }
    if (t && mp.players.exists(t)) {
        t.emsBy = null;
        try { t.setVariable('carriedBy', -1); } catch (e) {}
        try { t.stopAnimation(); } catch (e) {}
        if (lay) layDown(t);
    }
}
function pick(m, t) {
    if (t.emsBy !== undefined && t.emsBy !== null) return notify(m, 'error', 'Пациента уже несут');
    if (t.vehicle) return;
    m.emsCarry = t.id;
    t.emsBy = m.id;
    t.setVariable('carriedBy', m.id);
    try { t.stopAnimation(); } catch (e) {}
    t.playAnimation('nm', 'firemans_carry', 8, 1);
    m.playAnimation('missfinale_c2mcs_1', 'fin_c2_mcs_1_camman', 8, 49);
    notify(m, 'ok', 'Пациент на руках. Отнесите его в скорую или в приёмное отделение');
    notify(t, 'ok', 'Врач ' + nick(m) + ' несёт вас к скорой');
}
function nearAmb(m, r) {
    let best = null, bd = r;
    mp.vehicles.forEach(function (v) {
        if (!isAmb(v) || v.dimension !== m.dimension) return;
        const d = dist(v.position, m.position);
        if (d < bd) { bd = d; best = v; }
    });
    return best;
}
function freeSeat(v) {
    const o = occ(v);
    const seats = [2, 3, 1];
    for (let i = 0; i < seats.length; i++) if (!o.some(function (x) { return x.seat === seats[i]; })) return seats[i];
    return -1;
}
function nearER(m, r) { return ers().some(function (e) { return dist(m.position, e) <= r; }); }
function nearestDown(m, r) {
    let best = null, bd = r;
    mp.players.forEach(function (t) {
        if (t === m || !isDown(t) || t.vehicle || t.dimension !== m.dimension) return;
        if (t.emsBy !== undefined && t.emsBy !== null) return;
        const d = dist(t.position, m.position);
        if (d < bd) { bd = d; best = t; }
    });
    return best;
}
function load(m, t, v, seat) {
    release(m, t, false);
    setTimeout(function () {
        if (!mp.players.exists(t) || !mp.vehicles.exists(v)) return;
        try { t.putIntoVehicle(v, seat); } catch (e) {}
        t.emsVeh = v;
        notify(m, 'ok', 'Пациент в машине. Везите его в приёмное отделение больницы');
        if (mp.players.exists(m)) m.call('medic:route', [DEF_ER[0].x, DEF_ER[0].y]);
    }, 200);
}

/* ---------- стационар ---------- */
function toWard(p, ms, text) {
    const list = beds();
    let i = -1;
    for (let k = 0; k < list.length; k++) { if (!wardBusy[k]) { i = k; break; } }
    const b = i >= 0 ? list[i] : list[0];
    if (i >= 0) wardBusy[i] = p.id;
    p.emsWard = Date.now() + ms;
    setTimeout(function () {
        if (!mp.players.exists(p)) return;
        p.dimension = 0;
        p.position = new mp.Vector3(b.x + (i < 0 ? 1.2 : 0), b.y, b.z);
        p.heading = b.h;
        setTimeout(function () {
            if (!mp.players.exists(p)) return;
            try { p.playAnimation('amb@world_human_sunbathe@male@back@base', 'base', 1, 1); } catch (e) {}
            p.call('medic:busy', [ms, 'Лечение в стационаре']);
        }, 400);
        if (text) notify(p, 'ok', text);
    }, 300);
    setTimeout(function () {
        if (i >= 0 && wardBusy[i] === p.id) wardBusy[i] = null;
        if (!mp.players.exists(p)) return;
        p.emsWard = 0;
        try { p.stopAnimation(); } catch (e) {}
        if (!isDown(p)) p.health = 100;
        notify(p, 'ok', 'Лечение окончено, вас выписали из больницы');
    }, ms + 300);
}

/* ---------- вызовы, премии, рейтинг ---------- */
function accepted(m, c) {
    c.takenBy = m;
    c.takenAt = Date.now();
    c.prize = estimate(c, m);
    notify(m, 'ok', 'Вызов #' + c.id + ' принят. Премия за спасение: $' + c.prize + ' (+25% если успеете за 4 мин)');
    const t = mp.players.at(c.pid);
    if (t && mp.players.exists(t) && global.DeathSystem && global.DeathSystem.info) global.DeathSystem.info(t);
    push();
}
function closed(c) {
    lastClosed[c.pid] = c;
    setTimeout(function () { if (lastClosed[c.pid] === c) delete lastClosed[c.pid]; }, 5000);
    push();
}
function flagCert(m, s) {
    const id = sid(m);
    let r = DB.cert.find(function (x) { return x.id === id; });
    if (!r) { r = { id: id, n: nick(m), at: 0, f: 0 }; DB.cert.unshift(r); }
    r.n = nick(m); r.at = Date.now(); r.f = s.streak;
    mark();
    chiefs().forEach(function (ch) {
        if (ch === m) return;
        notify(ch, 'warn', 'Сотрудник ' + nick(m) + ' не успел на вызов. Необходимо направить его на переаттестацию');
        chat(ch, '!{#ffcc66}Сотрудник ' + nick(m) + ' не успел на вызов (провалов подряд: ' + s.streak + '). Необходимо направить на переаттестацию — планшет F6');
    });
}
function fail(c, text) {
    c.done = true;
    const m = c.takenBy;
    if (!m || !mp.players.exists(m) || !m.account) return;
    const s = St(sid(m), nick(m));
    s.fail++; s.streak++;
    mark();
    notify(m, 'error', text);
    chat(m, '!{#ff8a8a}' + text + ' (-1 к рейтингу)');
    m.call('medic:callClear', [c.id]);
    log(nick(m) + ' не успел на вызов #' + c.id + ' (' + c.name + ')');
    flagCert(m, s);
    push();
}
function rescued(m, t, kind) {
    const c = callOf(t) || lastClosed[t.id];
    let prize = 0, note = '';
    const mine = c && !c.done && c.takenBy === m;
    if (mine) {
        prize = c.prize || estimate(c, m);
        if (Date.now() - c.takenAt < CFG.fastMs) { prize = Math.round(prize * CFG.fastK); note = ' (бонус за скорость)'; }
        c.done = true;
    } else {
        if (kind === 'heal') return;
        prize = CFG.noCall[kind] || 0;
        if (c && !c.done) {
            c.done = true;
            if (c.takenBy && c.takenBy !== m && mp.players.exists(c.takenBy)) notify(c.takenBy, 'warn', 'Вызов #' + c.id + ' закрыл ' + nick(m));
        }
    }
    const s = St(sid(m), nick(m));
    s.saved++; s.earn += prize;
    mark();
    pay(m, prize);
    notify(m, 'ok', 'Пациент спасён! Премия $' + prize + note);
    chat(m, 'Пациент ' + nick(t) + ' спасён. Премия: !{#8fd14f}$' + prize + note);
    log(nick(m) + ' спас ' + nick(t) + (kind === 'deliver' ? ' (доставка в больницу)' : kind === 'revive' ? ' (реанимация)' : ' (лечение)') + ' — $' + prize);
    push();
}
function deliver(m, t) {
    const inCar = !!t.vehicle;
    if (t.emsBy === m.id) release(m, t, false);
    if (inCar) { try { t.removeFromVehicle(); } catch (e) {} }
    t.emsVeh = null;
    setTimeout(function () {
        if (!mp.players.exists(t)) return;
        if (mp.players.exists(m)) rescued(m, t, 'deliver');
        if (global.DeathSystem) global.DeathSystem.revive(t);
        const fee = charge(t, CFG.medicFee);
        toWard(t, CFG.wardMedic, 'Вас доставил врач ' + (mp.players.exists(m) ? nick(m) : '') + '. Счёт за лечение: $' + fee);
    }, inCar ? 400 : 50);
}
function afterRespawn(p) {
    const c = callOf(p);
    if (c && c.takenBy && !c.done) fail(c, 'Человеку помог неравнодушный прохожий добраться до больницы — ваш вызов #' + c.id + ' отменён');
    if (p.emsBy !== undefined && p.emsBy !== null) { const m = mp.players.at(p.emsBy); release(m, p, false); }
    p.emsVeh = null;
    toWard(p, CFG.wardSelf, 'Вас доставили в приёмное отделение. Лечение займёт ' + Math.round(CFG.wardSelf / 1000) + ' сек');
}
function coming(p) {
    const c = callOf(p);
    if (!c || !c.takenBy || !mp.players.exists(c.takenBy)) return null;
    return { n: nick(c.takenBy), d: Math.round(dist(c.takenBy.position, p.position)) };
}
function busy(p) {
    if (p.emsBy !== undefined && p.emsBy !== null) return 'Вас несёт врач';
    if (p.vehicle && isAmb(p.vehicle)) return 'Вас везут в больницу на скорой';
    const c = callOf(p);
    if (c && c.takenBy && mp.players.exists(c.takenBy) && dist(c.takenBy.position, p.position) < CFG.nearBlock) return 'Врач уже рядом с вами';
    return '';
}

/* ---------- взаимодействие E ---------- */
function interact(m) {
    if (!m.account || isDown(m) || !onDuty(m)) return false;
    const t = carrying(m);
    if (t) {
        if (m.hospDoor) return false;
        if (nearER(m, CFG.erFoot)) { deliver(m, t); return true; }
        const v = nearAmb(m, 4.5);
        if (v) {
            const s = freeSeat(v);
            if (s < 0) { notify(m, 'error', 'В скорой нет свободных мест'); return true; }
            load(m, t, v, s);
            return true;
        }
        release(m, t, true);
        notify(m, 'warn', 'Вы опустили пациента на землю');
        return true;
    }
    if (m.vehicle) {
        if (!isAmb(m.vehicle) || m.seat !== 0) return false;
        const pts = occ(m.vehicle).filter(function (o) { return o !== m && isDown(o); });
        if (!pts.length) return false;
        if (!nearER(m, CFG.erCar)) { notify(m, 'warn', 'Подъезжайте к приёмному отделению больницы (метка на карте)'); return true; }
        pts.forEach(function (o) { deliver(m, o); });
        return true;
    }
    const d = nearestDown(m, 2.5);
    if (d) { pick(m, d); return true; }
    const v = nearAmb(m, 4.5);
    if (v) {
        const pts = occ(v).filter(isDown);
        if (pts.length) {
            const o = pts[0];
            try { o.removeFromVehicle(); } catch (e) {}
            o.emsVeh = null;
            setTimeout(function () { if (mp.players.exists(o) && mp.players.exists(m)) { o.position = m.position; pick(m, o); } }, 450);
            return true;
        }
    }
    return false;
}

function hintFor(m) {
    const t = carrying(m);
    if (t) {
        if (nearER(m, CFG.erFoot)) return 'E — сдать пациента в приёмное отделение';
        if (nearAmb(m, 4.5)) return 'E — положить пациента в скорую';
        return 'Вы несёте пациента · E — опустить';
    }
    if (m.vehicle) {
        if (isAmb(m.vehicle) && m.seat === 0 && occ(m.vehicle).some(function (o) { return o !== m && isDown(o); })) {
            return nearER(m, CFG.erCar) ? 'E — передать пациента в приёмное отделение' : 'Пациент в машине · везите в приёмное отделение';
        }
        return '';
    }
    if (nearestDown(m, 2.5)) return 'E — взять на руки · /revive — реанимация на месте';
    const v = nearAmb(m, 4.5);
    if (v && occ(v).some(isDown)) return 'E — достать пациента из скорой';
    return '';
}

setInterval(function () {
    const now = Date.now();
    mp.players.forEach(function (m) {
        if (!m.account) return;
        const h = onDuty(m) ? hintFor(m) : '';
        if (h !== (m.emsHint || '')) { m.emsHint = h; m.call('ems:hint', [h]); }
        if (m.emsCarry !== undefined && m.emsCarry !== null && (!onDuty(m) || !carrying(m))) {
            const t = mp.players.at(m.emsCarry);
            release(m, t && mp.players.exists(t) && t.emsBy === m.id ? t : null, true);
        }
    });
    calls().forEach(function (c) {
        if (!c.takenBy || c.done) return;
        if (!mp.players.exists(c.takenBy) || !onDuty(c.takenBy)) { c.taken = null; c.takenBy = null; push(); return; }
        if (!c.urgent && now - c.takenAt > CFG.callTimeout) {
            const m = c.takenBy;
            fail(c, 'Вы не прибыли на вызов #' + c.id + ' вовремя — вызов отменён');
            c.done = false; c.taken = null; c.takenBy = null;
            if (mp.players.exists(m)) m.call('medic:callClear', [c.id]);
        }
    });
}, 800);

mp.events.add('playerQuit', function (p) {
    const t = carrying(p);
    if (t) release(p, t, true);
    if (p.emsBy !== undefined && p.emsBy !== null) { const m = mp.players.at(p.emsBy); if (m && mp.players.exists(m)) release(m, null, false); }
    Object.keys(wardBusy).forEach(function (k) { if (wardBusy[k] === p.id) wardBusy[k] = null; });
});
mp.events.add('playerDeath', function (p) {
    if (p.emsBy !== undefined && p.emsBy !== null) { const m = mp.players.at(p.emsBy); release(m && mp.players.exists(m) ? m : null, p, false); p.emsBy = null; }
    const t = carrying(p);
    if (t) release(p, t, true);
});

/* ---------- планшет ---------- */
function rating() {
    return Object.keys(DB.st).map(function (id) {
        const s = DB.st[id];
        return { id: Number(id), n: s.n, saved: s.saved, fail: s.fail, earn: s.earn, score: s.saved - s.fail };
    }).sort(function (a, b) { return b.score - a.score || b.saved - a.saved || a.fail - b.fail; });
}
function tabData(p) {
    const me = sid(p), R = rating();
    const s = St(me, nick(p));
    const pos = R.findIndex(function (x) { return x.id === me; }) + 1;
    const on = mp.players.toArray().filter(isMedic);
    return {
        ems: true, f: 'medic', fn: 'EMS', duty: onDuty(p), chief: isChief(p), members: [],
        me: { id: me, n: nick(p), r: rank(p), rn: RANKS[rank(p) - 1], lead: isChief(p), dep: false, manage: isChief(p) },
        calls: onDuty(p) ? calls().filter(function (c) { return !c.done; }).map(function (c) {
            const pp = patientPos(c);
            return { id: c.id, n: String(c.name).replace(/_/g, ' '), r: c.reason, u: !!c.urgent, d: Math.round(dist(p.position, pp)), x: pp.x, y: pp.y, age: Date.now() - (c.at || Date.now()),
                by: c.takenBy && mp.players.exists(c.takenBy) ? nick(c.takenBy) : '', mine: c.takenBy === p, prize: c.takenBy === p ? c.prize : estimate(c, p) };
        }) : [],
        my: { saved: s.saved, fail: s.fail, earn: s.earn, streak: s.streak, pos: pos, total: R.length },
        rating: R.slice(0, 50),
        staff: on.map(function (x) { return { n: nick(x), rn: RANKS[rank(x) - 1], duty: onDuty(x) }; }),
        cert: isChief(p) ? DB.cert : [],
        log: DB.log.slice(0, 40),
        cfg: { urgent: CFG.base.urgent, call: CFG.base.call, fee: CFG.medicFee }
    };
}
function openTab(p) {
    if (!isMedic(p)) return;
    p.call('gov:tablet', [JSON.stringify(tabData(p))]);
}
let pushT = null;
function push() {
    if (pushT) return;
    pushT = setTimeout(function () {
        pushT = null;
        mp.players.forEach(function (m) { if (isMedic(m)) m.call('ems:tabUpd', [JSON.stringify(tabData(m))]); });
    }, 600);
}
function tabAct(p, d) {
    if (!isMedic(p)) return;
    const toast = function (t, ok) { p.call('gov:tabToast', [t, ok ? 1 : 0]); };
    if (d.a === 'accept') {
        if (!onDuty(p)) return toast('Сначала заступите на смену', 0);
        if (MC()) MC().accept(p, Number(d.id));
        return openTab(p);
    }
    if (d.a === 'certok') {
        if (!isChief(p)) return toast('Только главврач', 0);
        const id = Number(d.id);
        DB.cert = DB.cert.filter(function (x) { return x.id !== id; });
        const s = DB.st[id];
        if (s) { s.streak = 0; log(nick(p) + ' провёл переаттестацию: ' + s.n); }
        mark();
        toast('Переаттестация засчитана', 1);
        return openTab(p);
    }
    openTab(p);
}

/* ---------- точки ---------- */
const bedObjs = [];
function spawnBedObj(b) {
    try { bedObjs.push(mp.objects.new(mp.joaat('v_med_bed2'), new mp.Vector3(b.x, b.y, b.z - 1.0), { rotation: new mp.Vector3(0, 0, b.h), dimension: 0 })); } catch (e) {}
}
DB.beds.forEach(spawnBedObj);
function spawnER(e) {
    try {
        mp.markers.new(1, new mp.Vector3(e.x, e.y, e.z - 1.0), 3.0, { color: [255, 60, 80, 90], dimension: 0 });
        mp.labels.new('Приёмное отделение EMS', new mp.Vector3(e.x, e.y, e.z + 0.6), { los: false, font: 4, drawDistance: 25, color: [255, 120, 130, 255], dimension: 0 });
    } catch (e2) {}
}
ers().forEach(spawnER);

mp.events.addCommand('emsbed', function (p) {
    if (adm(p) < 4) return;
    const b = { x: Number(p.position.x.toFixed(2)), y: Number(p.position.y.toFixed(2)), z: Number(p.position.z.toFixed(2)), h: Number(p.heading.toFixed(1)) };
    DB.beds.push(b); mark(); spawnBedObj(b);
    chat(p, 'Койка добавлена. Всего коек в стационаре: ' + beds().length);
});
mp.events.addCommand('emser', function (p) {
    if (adm(p) < 4) return;
    const e = { x: Number(p.position.x.toFixed(2)), y: Number(p.position.y.toFixed(2)), z: Number(p.position.z.toFixed(2)) };
    DB.er.push(e); mark(); spawnER(e);
    chat(p, 'Точка приёмного отделения добавлена');
});
mp.events.addCommand('emstop', function (p) {
    const R = rating().slice(0, 10);
    if (!R.length) return chat(p, 'Рейтинг врачей пока пуст');
    chat(p, 'Лучшие врачи штата:');
    R.forEach(function (x, i) { p.outputChatBox('!{#ffffff}' + (i + 1) + '. ' + x.n + ' !{#8fd14f}спасено ' + x.saved + ' !{#ff8a8a}провалов ' + x.fail); });
});

global.EmsSystem = { interact: interact, accepted: accepted, closed: closed, rescued: rescued, afterRespawn: afterRespawn, coming: coming, busy: busy, openTab: openTab, tabAct: tabAct, push: push };
console.log('[ems] койки, переноска, вызовы и рейтинг врачей загружены');
