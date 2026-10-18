const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'redcams.json');
const CYCLE = 40000, GREEN = 16000, YELLOW = 3000;
const S = Object.assign({ cams: [], fine: 300, on: true }, (function () { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch (e) { return {}; } })());
function save() { try { fs.writeFileSync(FILE, JSON.stringify(S)); } catch (e) {} }

function acc(p) { return p.account || p.admAcc || null; }
function sid(p) { const a = acc(p); return a && a.id ? Number(a.id) : 0; }
function admLvl(p) { return global.AdminSystem && global.AdminSystem.lvl ? global.AdminSystem.lvl(p) : 0; }
function notify(p, type, text) { if (typeof global.hudNotify === 'function') global.hudNotify(p, type, text); else p.outputChatBox(text); }
function msg(p, t, c) { p.outputChatBox('!{' + (c || '#ffcc66') + '}' + t); }

function phase(g, t) {
    t = ((t || Date.now()) % CYCLE + CYCLE) % CYCLE;
    if (g) t = (t + CYCLE / 2) % CYCLE;
    return t < GREEN ? 0 : t < GREEN + YELLOW ? 2 : 1;
}
function axisGroup(h) { h = ((h % 180) + 180) % 180; return h >= 45 && h < 135 ? 1 : 0; }

function pub() { return JSON.stringify({ on: S.on, cams: S.cams, cycle: CYCLE, green: GREEN, yellow: YELLOW }); }
function send(p) { if (p) p.call('redcam:data', [pub(), Date.now()]); else { const j = pub(), t = Date.now(); mp.players.forEach(function (x) { x.call('redcam:data', [j, t]); }); } }
mp.events.add('playerReady', function (p) { setTimeout(function () { if (mp.players.exists(p)) send(p); }, 3000); });
setInterval(function () { const t = Date.now(); mp.players.forEach(function (x) { x.call('redcam:time', [t]); }); }, 120000);

const pending = {};
mp.events.add('srv:redcam:light', function (p, x, y, z) {
    const c = pending[p.id];
    if (!c) return;
    delete pending[p.id];
    x = Number(x); y = Number(y); z = Number(z);
    if (isFinite(x) && isFinite(y) && x !== 0 && Math.hypot(x - c.x, y - c.y) < 60) { c.lx = x; c.ly = y; c.lz = z; }
    S.cams.push(c); save(); send();
    msg(p, 'Камера №' + S.cams.length + ' «' + c.n + '» установлена' + (c.lx ? ' и привязана к светофору' : ' (светофор не найден — сигнал будет по общему циклу)'), '#8fd14f');
});

mp.events.addCommand('redcam', function (p, full) {
    if (admLvl(p) < 5) return notify(p, 'error', 'Доступно с 5 уровня администрации');
    const a = String(full || '').trim().split(/\s+/);
    const c = a[0];
    if (c === 'add') {
        const e = p.vehicle || p;
        const w = Math.max(4, Math.min(30, Number(a[1]) || 10));
        const n = a.slice(Number(a[1]) ? 2 : 1).join(' ').slice(0, 40) || 'Перекрёсток';
        const h = Number(p.vehicle ? p.vehicle.heading : p.heading) || 0;
        pending[p.id] = { n: n, x: e.position.x, y: e.position.y, z: e.position.z, h: h, w: w, g: axisGroup(h) };
        p.call('redcam:findLight', [e.position.x, e.position.y, e.position.z, h]);
        setTimeout(function () { if (pending[p.id]) { const cc = pending[p.id]; delete pending[p.id]; S.cams.push(cc); save(); send(); msg(p, 'Камера №' + S.cams.length + ' установлена (без привязки к светофору)', '#8fd14f'); } }, 2500);
        return;
    }
    if (c === 'del') {
        const i = Number(a[1]) - 1;
        if (!S.cams[i]) return msg(p, 'Нет камеры с таким номером — /redcam list');
        S.cams.splice(i, 1); save(); send();
        return msg(p, 'Камера удалена', '#8fd14f');
    }
    if (c === 'near') {
        let best = -1, bd = 1e9;
        S.cams.forEach(function (k, i) { const d = Math.hypot(k.x - p.position.x, k.y - p.position.y); if (d < bd) { bd = d; best = i; } });
        if (best < 0) return msg(p, 'Камер нет');
        const k = S.cams[best];
        return msg(p, '№' + (best + 1) + ' «' + k.n + '» · ' + bd.toFixed(0) + ' м · ширина ' + k.w + ' м · группа ' + k.g + ' · сейчас ' + ['зелёный', 'красный', 'жёлтый'][phase(k.g)], '#7fd4ff');
    }
    if (c === 'group') {
        const i = Number(a[1]) - 1;
        if (!S.cams[i]) return msg(p, '/redcam group [№] — поменять фазу камеры (если светофор и штраф не совпадают)');
        S.cams[i].g = S.cams[i].g ? 0 : 1; save(); send();
        return msg(p, 'Камера №' + (i + 1) + ': фаза переключена', '#8fd14f');
    }
    if (c === 'width') {
        const i = Number(a[1]) - 1, w = Number(a[2]);
        if (!S.cams[i] || !(w >= 4 && w <= 30)) return msg(p, '/redcam width [№] [4-30 м]');
        S.cams[i].w = w; save(); send();
        return msg(p, 'Ширина камеры №' + (i + 1) + ': ' + w + ' м', '#8fd14f');
    }
    if (c === 'fine') {
        const v = Math.floor(Number(a[1]));
        if (!(v >= 10 && v <= 100000)) return msg(p, '/redcam fine [сумма] — сейчас $' + S.fine);
        S.fine = v; save();
        return msg(p, 'Штраф за красный: $' + v, '#8fd14f');
    }
    if (c === 'on' || c === 'off') { S.on = c === 'on'; save(); send(); return msg(p, 'Камеры ' + (S.on ? 'включены' : 'выключены'), '#8fd14f'); }
    if (c === 'show') { p.call('redcam:show'); return; }
    if (c === 'list') {
        if (!S.cams.length) return msg(p, 'Камер пока нет');
        return S.cams.forEach(function (k, i) { msg(p, (i + 1) + '. ' + k.n + ' · (' + k.x.toFixed(0) + ', ' + k.y.toFixed(0) + ') · ' + k.w + ' м' + (k.lx ? ' · 🚦' : ''), '#ffffff'); });
    }
    msg(p, '/redcam add [ширина м] [название] — встаньте на машине ПЕРЕД стоп-линией лицом к светофору');
    msg(p, '/redcam list · near · del [№] · group [№] · width [№] [м] · fine [сумма] · show · on/off');
});

const last = {};
mp.events.add('srv:redcam:hit', function (p, idx) {
    if (!S.on) return;
    const k = S.cams[Number(idx)];
    const v = p.vehicle;
    if (!k || !v || !mp.vehicles.exists(v) || (p.seat !== 0 && p.seat !== -1)) return;
    if ((Number(v.getVariable('siren')) || 0) > 0 || v.getVariable('gov')) return;
    if (Math.hypot(v.position.x - k.x, v.position.y - k.y) > 40) return;
    const now = Date.now();
    if (phase(k.g, now) !== 1 && phase(k.g, now - 1200) !== 1) return;
    const id = sid(p);
    if (!id || (last[id] && now - last[id] < 30000)) return;
    last[id] = now;
    const plate = String(v.numberPlate || '').trim();
    const GF = global.GovFaction;
    if (!GF || !GF.autoFine) return;
    GF.autoFine(p, S.fine, 'Проезд на красный · ' + k.n + (plate ? ' (' + plate + ')' : ''), 'Дорожная камера');
    notify(p, 'warn', '📸 Камера «' + k.n + '»: проезд на красный. Штраф ' + GF.money(S.fine) + '. Оплатить: /fines');
    p.call('traffic:flash');
    if (global.SLog) try { global.SLog.add('wanted', { actor: p, action: 'redlight', details: k.n + ' $' + S.fine }); } catch (e) {}
});

global.RedCams = { phase: phase };
console.log('[traffic] камеры на светофорах: ' + S.cams.length);
