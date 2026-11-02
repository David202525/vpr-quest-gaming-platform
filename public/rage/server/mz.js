const LAY = require('./hospital_layout.js');
const P = LAY.P;
const CFG = { recPrice: 500, surgeryPay: 600, surgeryTime: 12000, heliRank: 3, heliModel: 'polmav', heliLivery: 1, nurse: 's_f_y_scrubs_01' };
const KEYS = {
    reception: 'Регистратура (медсестра)',
    surgery: 'Операционный стол',
    chief: 'Кабинет главврача',
    liftDown: 'Лифт — 1 этаж',
    liftUp: 'Лифт — крыша',
    heli: 'Вертолёт на крыше'
};

function A(p) { return p && p.account ? p.account : null; }
function isMedic(p) { const a = A(p); return !!a && a.job === 'medic'; }
function onDuty(p) { const a = A(p); return !!a && a.medicDuty === true; }
function isDown(p) { const a = A(p); return !!a && a.downed === true; }
function rank(p) { const a = A(p); if (!isMedic(p)) return 0; if (Number(a.leader) === 1) return 5; return Math.max(1, Math.min(5, Number(a.job_rank) || 1)); }
function adm(p) { const D = global.DeathSystem; return D && D.adminLvl ? D.adminLvl(p) : 0; }
function notify(p, t, x) { if (typeof global.hudNotify === 'function') global.hudNotify(p, t, x); else p.outputChatBox(x); }
function chat(p, x) { p.outputChatBox('!{#ff5c5c}[EMS] !{#ffffff}' + x); }
function V(o, dz) { return new mp.Vector3(o.x, o.y, o.z + (dz || 0)); }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z); }
function pay(p, n) {
    const M = global.MoneySystem;
    if (M && M.get && M.set) { const m = M.get(p); if (m < n) return false; M.set(p, m - n, M.bank(p)); return true; }
    const a = A(p); if ((a.money || 0) < n) return false; a.money -= n; return true;
}
function give(p, n) {
    if (global.MoneySystem && global.MoneySystem.add) return global.MoneySystem.add(p, n);
    const a = A(p); a.money = (a.money || 0) + n;
}

const objs = [];
let nurse = null;
function build() {
    objs.forEach(function (o) { try { o.destroy(); } catch (e) {} });
    objs.length = 0;
    if (nurse) { try { nurse.destroy(); } catch (e) {} nurse = null; }
    Object.keys(KEYS).forEach(function (k) {
        const o = P[k];
        if (!o) return;
        const s = mp.colshapes.newSphere(o.x, o.y, o.z, k === 'heli' ? 3 : 1.5, 0);
        s.mzZone = k;
        objs.push(s);
        if (k !== 'reception') objs.push(mp.markers.new(1, V(o, -1), k === 'heli' ? 4 : 1.1, { color: k === 'heli' ? [60, 140, 255, 110] : [255, 60, 80, 120], dimension: 0 }));
        objs.push(mp.labels.new(KEYS[k], V(o, k === 'reception' ? 1.2 : 0.4), { los: true, font: 4, drawDistance: 12, color: [255, 150, 160, 255], dimension: 0 }));
    });
    if (P.reception) {
        const r = P.reception;
        const h = r.h || 0, rad = h * Math.PI / 180;
        try { nurse = mp.peds.new(mp.joaat(CFG.nurse), new mp.Vector3(r.x - Math.sin(rad) * 1.2, r.y + Math.cos(rad) * 1.2, r.z), { dynamic: false, frozen: true, invincible: true, heading: (h + 180) % 360, dimension: 0 }); } catch (e) { nurse = null; }
    }
}
build();
LAY.onChange(build);

mp.events.add('playerEnterColshape', function (p, s) {
    if (!s.mzZone) return;
    p.mzZone = s.mzZone;
    const k = s.mzZone;
    let t = '';
    if (k === 'reception') t = 'E — регистратура: лечение $' + CFG.recPrice + ' (если нет врачей на смене)';
    else if (k === 'surgery') t = onDuty(p) ? 'E — провести операцию пациенту рядом' : 'Операционная. Ждите врача';
    else if (k === 'chief') t = isMedic(p) && rank(p) >= 5 ? 'E — рабочий планшет главврача' : 'Кабинет главврача';
    else if (k === 'liftDown') t = P.liftUp ? 'E — лифт на крышу' : '';
    else if (k === 'liftUp') t = P.liftDown ? 'E — лифт вниз' : '';
    else if (k === 'heli') t = onDuty(p) && rank(p) >= CFG.heliRank ? 'E — вызвать санитарный вертолёт' : 'Вертолётная площадка EMS';
    if (t) p.call('medic:hint', [t]);
});
mp.events.add('playerExitColshape', function (p, s) { if (s.mzZone && p.mzZone === s.mzZone) p.mzZone = null; });

function medicsOnDuty() { return mp.players.toArray().filter(onDuty).length; }

function reception(p) {
    if (isDown(p)) return;
    if (medicsOnDuty() > 0 && !onDuty(p)) return notify(p, 'warn', 'Врачи на смене — обратитесь к ним или вызовите /911');
    if (p.health >= 100) return notify(p, 'info', 'Медсестра: «Вы здоровы»');
    if (!pay(p, CFG.recPrice)) return notify(p, 'error', 'Лечение в регистратуре стоит $' + CFG.recPrice);
    p.call('medic:busy', [5000, 'Перевязка']);
    setTimeout(function () { if (mp.players.exists(p)) { p.health = 100; notify(p, 'ok', 'Медсестра вас подлатала'); } }, 5000);
}

function surgery(p) {
    if (!onDuty(p)) return notify(p, 'error', 'Операции проводят только врачи на смене');
    if (p.mzBusy) return;
    const st = P.surgery;
    let t = null, best = 3.5;
    mp.players.forEach(function (x) { if (x === p || !x.account) return; const d = dist(x.position, st); if (d < best && (isDown(x) || x.health < 100)) { best = d; t = x; } });
    if (!t) return notify(p, 'warn', 'У операционного стола нет раненых пациентов');
    p.mzBusy = true;
    t.position = V(st, 0.3); t.heading = st.h || 0;
    try { t.playAnimation('amb@world_human_sunbathe@male@back@base', 'base', 1, 1); } catch (e) {}
    p.playAnimation('mini@cpr@char_a@cpr_str', 'cpr_pumpchest', 1, 1);
    p.call('medic:busy', [CFG.surgeryTime, 'Операция']);
    notify(t, 'info', 'Вам проводят операцию…');
    setTimeout(function () {
        if (mp.players.exists(p)) { p.mzBusy = false; p.stopAnimation(); }
        if (!mp.players.exists(t)) return;
        try { t.stopAnimation(); } catch (e) {}
        if (isDown(t) && global.DeathSystem) global.DeathSystem.revive(t);
        t.health = 100;
        notify(t, 'ok', 'Операция прошла успешно');
        if (mp.players.exists(p)) {
            give(p, CFG.surgeryPay);
            notify(p, 'ok', 'Операция завершена · +$' + CFG.surgeryPay);
            if (global.EmsSystem && global.EmsSystem.rescued) try { global.EmsSystem.rescued(p, t, 'revive'); } catch (e) {}
        }
    }, CFG.surgeryTime);
}

const helis = {};
function heli(p) {
    if (!onDuty(p)) return notify(p, 'error', 'Сначала заступите на смену');
    if (rank(p) < CFG.heliRank) return notify(p, 'error', 'Вертолёт — с ранга «Врач»');
    const old = helis[p.id];
    if (old && mp.vehicles.exists(old)) old.destroy();
    const h = P.heli;
    const v = mp.vehicles.new(mp.joaat(CFG.heliModel), V(h, 0.5), { heading: h.h || 0, numberPlate: 'EMS ' + p.id, dimension: p.dimension });
    try { v.livery = CFG.heliLivery; } catch (e) {}
    helis[p.id] = v;
    setTimeout(function () { if (mp.players.exists(p) && mp.vehicles.exists(v)) p.putIntoVehicle(v, 0); }, 300);
    notify(p, 'ok', 'Санитарный вертолёт готов');
}

function lift(p, to) {
    const o = P[to];
    if (!o) return;
    p.call('medic:busy', [1500, 'Лифт']);
    setTimeout(function () { if (mp.players.exists(p)) { p.position = V(o, 0.2); p.heading = o.h || 0; } }, 1500);
}

mp.events.add('medic:interact', function (p) {
    if (!p.account || !p.mzZone || isDown(p)) return;
    if (p.emsUsedE && Date.now() - p.emsUsedE < 400) return;
    const k = p.mzZone;
    if (k === 'reception') return reception(p);
    if (k === 'surgery') return surgery(p);
    if (k === 'chief') { if (isMedic(p) && rank(p) >= 5 && global.EmsSystem) return global.EmsSystem.openTab(p); return notify(p, 'error', 'Кабинет только для главврача'); }
    if (k === 'liftDown') return lift(p, 'liftUp');
    if (k === 'liftUp') return lift(p, 'liftDown');
    if (k === 'heli') return heli(p);
});

mp.events.add('playerQuit', function (p) {
    const v = helis[p.id];
    if (v && mp.vehicles.exists(v)) v.destroy();
    delete helis[p.id];
});

const HELP = '/mzpoint [reception|surgery|chief|liftdown|liftup|heli|list] · убрать: /mzpoint [имя] clear';
mp.events.addCommand('mzpoint', function (p, full, a, b) {
    if (adm(p) < 4) return;
    const map = { reception: 'reception', surgery: 'surgery', chief: 'chief', liftdown: 'liftDown', liftup: 'liftUp', heli: 'heli' };
    const k = map[String(a || '').toLowerCase()];
    if (String(a || '').toLowerCase() === 'list') {
        Object.keys(KEYS).forEach(function (x) { const o = P[x]; p.outputChatBox('!{#ffffff}' + KEYS[x] + ': ' + (o ? o.x + ', ' + o.y + ', ' + o.z : '!{#e05555}не поставлено')); });
        return;
    }
    if (!k) return chat(p, HELP);
    if (String(b || '').toLowerCase() === 'clear') { P[k] = null; LAY.save(); return chat(p, KEYS[k] + ' — убрано'); }
    P[k] = { x: +p.position.x.toFixed(2), y: +p.position.y.toFixed(2), z: +p.position.z.toFixed(2), h: +p.heading.toFixed(1) };
    LAY.save();
    chat(p, KEYS[k] + ' — сохранено' + (k === 'reception' ? '. Встаньте перед стойкой лицом к ней — медсестра появится напротив' : ''));
});

const PR = global.PointReg || require('./points.js');
PR.provider(function () {
    return Object.keys(KEYS).map(function (k) {
        return { id: 'mz.' + k, g: 'Больница Mount Zonah', n: KEYS[k], get: function () { return P[k]; }, set: function (v) { P[k] = v; LAY.save(); }, del: function () { P[k] = null; LAY.save(); } };
    });
});

global.MzSystem = { build: build, CFG: CFG };
console.log('[mz] интерьер Mount Zonah: регистратура, операционная, главврач, лифт, вертолёт');
