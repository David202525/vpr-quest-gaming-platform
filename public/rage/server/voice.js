const NEAR = 22;
const MEGA = 110;
const tracked = new Map();

function admMuted(p) {
    const A = global.AdminCore;
    const m = A && A.muted && A.muted[p.id];
    return !!(m && m > Date.now());
}
function callPeerId(p) {
    const P = global.PhoneSystem;
    if (!P || !P.state) return -1;
    try { const s = P.state(p); return s && s.st === 'talk' ? Number(s.rid) : -1; } catch (e) { return -1; }
}
function isGovCar(v) { return !!(v && mp.vehicles.exists(v) && v.getVariable('gov')); }
function frontSeat(p) { return typeof p.seat === 'number' && p.seat <= 1; }
function isGovMember(p) {
    const G = global.GovFaction;
    return !!(p.account && p.account.job && G && G.isGov && G.isGov(p.account.job));
}
function megaOk(p) { return isGovMember(p) && p.vehicle && isGovCar(p.vehicle) && frontSeat(p); }
function setMega(p, on) {
    if (!!p.getVariable('mega') === !!on) return;
    p.setVariable('mega', !!on);
    p.call('voice:mega', [!!on]);
}

function tick() {
    const all = mp.players.toArray().filter(function (p) { return mp.players.exists(p) && p.account; });
    all.forEach(function (s) {
        if (s.getVariable('mega') && !megaOk(s)) setMega(s, false);
        let set = tracked.get(s.id);
        if (!set) { set = new Set(); tracked.set(s.id, set); }
        const want = new Set();
        const peer = callPeerId(s);
        if (!admMuted(s)) {
            const range = (s.getVariable('mega') ? MEGA : NEAR) + 4;
            const sp = s.position;
            all.forEach(function (l) {
                if (l === s || l.id === peer || l.dimension !== s.dimension) return;
                const lp = l.position, dx = lp.x - sp.x, dy = lp.y - sp.y, dz = lp.z - sp.z;
                if ((s.vehicle && s.vehicle === l.vehicle) || dx * dx + dy * dy + dz * dz <= range * range) want.add(l.id);
            });
            if (global.RadioSystem) try { global.RadioSystem.targets(s).forEach(function (id) { if (id !== peer) want.add(id); }); } catch (e) {}
        }
        want.forEach(function (id) {
            if (set.has(id)) return;
            const l = mp.players.at(id);
            if (!l || !mp.players.exists(l)) return;
            try { s.enableVoiceTo(l); set.add(id); } catch (e) {}
        });
        Array.from(set).forEach(function (id) {
            if (want.has(id)) return;
            set.delete(id);
            if (id === peer) return;
            const l = mp.players.at(id);
            if (l && mp.players.exists(l)) { try { s.disableVoiceTo(l); } catch (e) {} }
        });
    });
}
setInterval(tick, 400);

mp.events.add('playerQuit', function (p) {
    tracked.delete(p.id);
    tracked.forEach(function (set) { set.delete(p.id); });
});
mp.events.add('playerExitVehicle', function (p) { if (p.getVariable('mega')) setMega(p, false); });

function toggleMega(p) {
    if (p.getVariable('mega')) { setMega(p, false); return notify(p, 'ok', 'Мегафон выключен'); }
    if (!isGovMember(p)) return notify(p, 'error', 'Мегафон доступен только сотрудникам гос. структур');
    if (!p.vehicle || !isGovCar(p.vehicle)) return notify(p, 'error', 'Мегафон есть только в служебной машине');
    if (!frontSeat(p)) return notify(p, 'error', 'Мегафоном пользуются водитель и пассажир спереди');
    setMega(p, true);
    notify(p, 'ok', 'Мегафон включён — удерживайте N и говорите. Вас слышно на ~' + MEGA + ' м');
}
function notify(p, t, x) { if (typeof global.hudNotify === 'function') global.hudNotify(p, t, x); else p.outputChatBox(x); }
mp.events.add('srv:voice:mega', toggleMega);
mp.events.addCommand('mega', toggleMega);

global.VoiceSystem = { NEAR: NEAR, MEGA: MEGA };
console.log('[voice] голосовой чат: рядом ' + NEAR + ' м, мегафон ' + MEGA + ' м');

mp.events.add('srv:voice:talk', function (p, on) {
    on = !!on;
    if (!!p.getVariable('talk') !== on) p.setVariable('talk', on);
});
