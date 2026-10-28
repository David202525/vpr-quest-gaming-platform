const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'outfits_data.json');
const DEF = {
    prison: { n: 'Роба заключённого',
        m: { c: { 3: [0, 0], 4: [3, 7], 6: [12, 12], 8: [15, 0], 11: [5, 0] }, p: { 0: [-1, 0] } },
        f: { c: { 3: [14, 0], 4: [3, 15], 6: [66, 5], 8: [14, 0], 11: [49, 0] }, p: { 0: [-1, 0] } } },
    farm: { n: 'Одежда фермера',
        m: { c: { 3: [1, 0], 4: [90, 0], 6: [25, 0], 8: [15, 0], 11: [43, 0] }, p: { 0: [105, 0] } },
        f: { c: { 3: [9, 0], 4: [93, 0], 6: [26, 0], 8: [14, 0], 11: [27, 0] }, p: { 0: [104, 0] } } },
    loader: { n: 'Спецовка грузчика',
        m: { c: { 3: [0, 0], 4: [9, 7], 6: [25, 0], 8: [59, 1], 11: [0, 0] }, p: { 0: [145, 1] } },
        f: { c: { 3: [14, 0], 4: [97, 8], 6: [26, 0], 8: [36, 1], 11: [0, 0] }, p: { 0: [144, 1] } } },
    build: { n: 'Спецовка строителя',
        m: { c: { 3: [0, 0], 4: [9, 7], 6: [25, 0], 8: [59, 0], 11: [0, 0] }, p: { 0: [145, 0] } },
        f: { c: { 3: [14, 0], 4: [97, 8], 6: [26, 0], 8: [36, 0], 11: [0, 0] }, p: { 0: [144, 0] } } },
    garbage: { n: 'Форма мусорщика',
        m: { c: { 3: [0, 0], 4: [9, 4], 6: [25, 0], 8: [59, 2], 11: [0, 0] }, p: { 0: [-1, 0] } },
        f: { c: { 3: [14, 0], 4: [97, 4], 6: [26, 0], 8: [36, 2], 11: [0, 0] }, p: { 0: [-1, 0] } } }
};
const SKINS = {
    prison: { m: ['s_m_y_prisoner_01', 'u_m_y_prisoner_01', 's_m_y_prismuscl_01'], f: [] },
    farm: { m: ['a_m_m_farmer_01', 'a_m_m_hillbilly_01', 'a_m_m_hillbilly_02'], f: [] },
    loader: { m: ['s_m_m_dockwork_01', 's_m_y_dockwork_01'], f: [] },
    build: { m: ['s_m_y_construct_01', 's_m_y_construct_02'], f: [] },
    garbage: { m: ['s_m_y_garbage'], f: [] },
    collector: { m: ['s_m_m_armoured_01', 's_m_m_armoured_02'], f: [] }
};
DEF.collector = { n: 'Форма инкассатора', m: null, f: null };
const SAVED = (function () { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch (e) { return {}; } })();
function save() { fs.writeFile(FILE, JSON.stringify(SAVED), function () {}); }
function female(p) { return p.account ? Number(p.account.gender) === 1 : p.model === mp.joaat('mp_f_freemode_01'); }
function outfitOf(k, p) { const g = female(p) ? 'f' : 'm'; return (SAVED[k] && SAVED[k][g]) || (DEF[k] && DEF[k][g]) || null; }
function notify(p, t, x) { if (typeof global.hudNotify === 'function') global.hudNotify(p, t, x); else p.outputChatBox(x); }
function admLvl(p) { return global.AdminSystem && global.AdminSystem.realLvl ? global.AdminSystem.realLvl(p) : 0; }

function mode() { return SAVED._mode || 'skin'; }
function keepGear(p, fn) {
    const hp = p.health, ar = p.armour, w = p.uiWeapon;
    fn();
    setTimeout(function () {
        if (!mp.players.exists(p)) return;
        try { p.health = hp; p.armour = ar; } catch (e) {}
        if (w && p.uiWeapon === w) { try { p.giveWeapon(w.hash, w.ammo || 100); } catch (e) {} }
    }, 300);
}
function skinFor(k, p) {
    const g = female(p) ? 'f' : 'm';
    const L = (SAVED._skins && SAVED._skins[k] && SAVED._skins[k][g]) || (SKINS[k] && SKINS[k][g]) || [];
    if (!L.length) return '';
    const sid = p.account && p.account.id ? Number(p.account.id) : p.id;
    return L[sid % L.length];
}
function wear(p, k) {
    if (!mp.players.exists(p)) return false;
    if (k !== 'prison' && (p.getVariable('duty') || p.govSkin)) return false;
    const sk = mode() === 'skin' ? skinFor(k, p) : '';
    if (p.outfitOn === k && sk && p.model === mp.joaat(sk)) return true;
    if (p.outfitOn === k && !sk && k !== 'prison') return true;
    if (p.outfitOn === k && !sk && p.outfitAt && Date.now() - p.outfitAt < 60000) return true;
    if (sk) {
        if (p.govSkin) p.govSkin = null;
        p.outfitAt = Date.now();
        p.outfitOn = k;
        p.jobSkin = sk;
        keepGear(p, function () { p.model = mp.joaat(sk); });
        return true;
    }
    const o = outfitOf(k, p);
    if (!o) return false;
    if (p.jobSkin) restoreModel(p);
    p.outfitAt = Date.now();
    p.outfitOn = k;
    p.uniPending = { n: (DEF[k] && DEF[k].n) || k, c: o.c, p: o.p || {} };
    setTimeout(function () { if (mp.players.exists(p) && p.outfitOn === k) p.call('gov:uniCheck', [JSON.stringify({ c: o.c, p: o.p || {} })]); }, p.jobSkin === null ? 900 : 0);
    return true;
}
function restoreModel(p) {
    p.jobSkin = null;
    keepGear(p, function () {
        if (global.CreatorSystem && p.account) global.CreatorSystem.apply(p, p.account);
        else p.model = mp.joaat(female(p) ? 'mp_f_freemode_01' : 'mp_m_freemode_01');
    });
}
function off(p) {
    if (!mp.players.exists(p) || !p.outfitOn) return;
    p.outfitOn = null;
    p.uniPending = null;
    if (p.jobSkin) {
        restoreModel(p);
        setTimeout(function () { if (mp.players.exists(p) && global.UiSystem && global.UiSystem.redress) global.UiSystem.redress(p); }, 700);
        return;
    }
    if (p.getVariable('duty')) return;
    try { [1, 7, 9, 10].forEach(function (c) { p.setClothes(c, 0, 0, 0); }); p.setProp(0, -1, 0); p.call('inv:clearProp', [0]); } catch (e) {}
    setTimeout(function () { if (mp.players.exists(p) && global.UiSystem && global.UiSystem.redress) global.UiSystem.redress(p); }, 200);
}
mp.events.add('playerQuit', function (p) { p.outfitOn = null; p.jobSkin = null; });
mp.events.add('playerSpawn', function (p) {
    const k = p.outfitOn;
    if (!k || k === 'prison') return;
    p.outfitOn = null; p.jobSkin = null;
    setTimeout(function () { if (mp.players.exists(p) && p.job) wear(p, k); }, 1500);
});

mp.events.addCommand('outfit', function (p, full) {
    if (admLvl(p) < 5) return notify(p, 'error', 'Доступно с 5 уровня администрации');
    const a = String(full || '').trim().split(/\s+/);
    const cmd = (a[0] || '').toLowerCase(), k = (a[1] || '').toLowerCase();
    const keys = Object.keys(DEF).join('/');
    if (cmd === 'save' && DEF[k]) {
        const o = { c: {}, p: {} };
        [3, 4, 5, 6, 7, 8, 9, 10, 11].forEach(function (c) { try { const x = p.getClothes(c); o.c[c] = [x.drawable, x.texture]; } catch (e) {} });
        [0, 1].forEach(function (c) { try { const x = p.getProp(c); o.p[c] = [x.drawable === 255 ? -1 : x.drawable, x.texture]; } catch (e) {} });
        const g = female(p) ? 'f' : 'm';
        if (!SAVED[k]) SAVED[k] = {};
        SAVED[k][g] = o; save();
        return notify(p, 'ok', 'Сохранено: «' + DEF[k].n + '» (' + (g === 'f' ? 'женский' : 'мужской') + ' вариант) — по вашей текущей одежде');
    }
    if (cmd === 'mode' && (k === 'skin' || k === 'clothes')) { SAVED._mode = k; save(); return notify(p, 'ok', 'Режим рабочей формы: ' + (k === 'skin' ? 'скины персонажей (ped)' : 'одежда на своего персонажа')); }
    if (cmd === 'skin' && DEF[k]) {
        const g = (a[2] || '').toLowerCase() === 'f' ? 'f' : 'm';
        const list = a.slice(3).filter(Boolean);
        if (!SAVED._skins) SAVED._skins = {};
        if (!SAVED._skins[k]) SAVED._skins[k] = {};
        SAVED._skins[k][g] = list; save();
        return notify(p, 'ok', 'Скины «' + DEF[k].n + '» (' + (g === 'f' ? 'Ж' : 'М') + '): ' + (list.join(', ') || 'нет — будет одежда'));
    }
    if (cmd === 'reset' && DEF[k]) { delete SAVED[k]; save(); return notify(p, 'ok', 'Сброшено по умолчанию: ' + DEF[k].n); }
    if (cmd === 'try' && DEF[k]) { p.outfitOn = null; wear(p, k); return; }
    if (cmd === 'off') return off(p);
    p.outputChatBox('!{#ffcc66}/outfit save [' + keys + '] — сохранить текущую одежду как форму (отдельно для М и Ж)');
    p.outputChatBox('!{#ffcc66}/outfit try [' + keys + '] — примерить · /outfit off — снять · /outfit reset [..] — по умолчанию');
    p.outputChatBox('!{#ffcc66}/outfit mode skin|clothes — скины (сейчас: ' + mode() + ') · /outfit skin [форма] [m|f] [ped1 ped2 ...] — свои скины с wiki.rage.mp/wiki/Peds');
});

global.Outfits = { wear: wear, off: off, DEF: DEF };
console.log('[outfits] рабочая одежда: ' + Object.keys(DEF).join(', '));
module.exports = global.Outfits;
