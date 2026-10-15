const db = require('../database');
const cfg = require('../config');

const MALE = mp.joaat('mp_m_freemode_01');
const FEMALE = mp.joaat('mp_f_freemode_01');

async function q(sql, args) {
    const r = await db.query(sql, args || []);
    return Array.isArray(r) && Array.isArray(r[0]) ? r[0] : r;
}

function parse(json) {
    if (!json) return null;
    if (typeof json === 'object') return json;
    try { return JSON.parse(json); } catch (e) { return null; }
}

function apply(p, acc) {
    const a = parse(acc.appearance);
    p.model = Number(acc.gender) ? FEMALE : MALE;
    if (!a) return;
    const par = a.parents || {};
    const hair = a.hair || {};
    try {
        p.setCustomization(!Number(acc.gender),
            Number(par.mother) || 21, Number(par.father) || 0, 0,
            Number(par.mother) || 21, Number(par.father) || 0, 0,
            Number(par.similarity) || 0.5, Number(par.skinSimilarity) || 0.5, 0,
            Number(a.eyeColor) || 0, Number(hair.color) || 0, Number(hair.highlight) || 0,
            (a.features || []).map(Number));
    } catch (e) {}
    (a.overlays || []).forEach(function (o) {
        try { p.setHeadOverlay(Number(o.id), [Number(o.index), Number(o.opacity), Number(o.color) || 0, Number(o.color2 !== undefined ? o.color2 : o.color) || 0]); } catch (e) {}
    });
    try { p.setClothes(2, Number(hair.style) || 0, 0, 0); } catch (e) {}
    p.setVariable('appearance', JSON.stringify(a));
    setTimeout(function () { if (mp.players.exists(p)) p.call('appearance:apply', [JSON.stringify(a)]); }, 500);
}

function start(p) {
    p.setVariable('creating', true);
    p.dimension = 1000 + p.id;
    p.spawn(new mp.Vector3(cfg.creatorPos.x, cfg.creatorPos.y, cfg.creatorPos.z));
    p.heading = cfg.creatorPos.heading;
    p.model = MALE;
    p.call('auth:hide');
    setTimeout(function () { if (mp.players.exists(p)) p.call('creator:start'); }, 600);
}

mp.events.add('creator:finish', async function (p, firstname, lastname, gender, json) {
    const a = p.account;
    if (!a || !p.getVariable('creating')) return;
    const re = /^[A-Za-zА-Яа-яЁё]{2,16}$/;
    firstname = String(firstname || '').trim();
    lastname = String(lastname || '').trim();
    if (!re.test(firstname) || !re.test(lastname)) return p.call('creator:error', ['Имя и фамилия: только буквы, от 2 до 16 символов']);
    const cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); };
    const nick = cap(firstname) + ' ' + cap(lastname);
    if (global.SLog) global.SLog.add('name', { actor: a.login || p.name, action: 'create', details: 'создан персонаж ' + nick });
    const look = parse(json);
    if (!look) return p.call('creator:error', ['Ошибка внешности, попробуйте ещё раз']);
    try {
        const ex = await q('SELECT id FROM accounts WHERE nick = ? AND id <> ? LIMIT 1', [nick, a.id]);
        if (ex.length) return p.call('creator:error', ['Имя ' + nick + ' уже занято']);
        const g = Number(gender) ? 1 : 0;
        await q('UPDATE accounts SET nick = ?, gender = ?, appearance = ?, pos_x = ?, pos_y = ?, pos_z = ?, heading = ?, dimension = 0 WHERE id = ?',
            [nick, g, JSON.stringify(look), cfg.spawn.x, cfg.spawn.y, cfg.spawn.z, cfg.spawn.heading, a.id]);
        Object.assign(a, { nick: nick, gender: g, appearance: JSON.stringify(look), pos_x: cfg.spawn.x, pos_y: cfg.spawn.y, pos_z: cfg.spawn.z, heading: cfg.spawn.heading, dimension: 0 });
        console.log('[creator] создан персонаж ' + nick);
        p.call('creator:done');
        global.AuthSystem.spawn(p);
    } catch (e) {
        console.log('[creator] ' + e.message);
        p.call('creator:error', ['Ошибка сервера, попробуйте позже']);
    }
});

global.CreatorSystem = { start: start, apply: apply };
module.exports = global.CreatorSystem;
