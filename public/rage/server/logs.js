const db = require('../database');

async function q(sql, args) {
    const r = await db.query(sql, args || []);
    return Array.isArray(r) && Array.isArray(r[0]) ? r[0] : r;
}

let ready = false;
const buf = [];

setTimeout(function () {
    q(`CREATE TABLE IF NOT EXISTS server_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        t BIGINT NOT NULL,
        cat VARCHAR(16) NOT NULL,
        tag VARCHAR(16) NULL,
        actor VARCHAR(64) NULL,
        actor_id INT NULL,
        target VARCHAR(64) NULL,
        target_id INT NULL,
        action VARCHAR(48) NOT NULL,
        details TEXT NULL,
        amount BIGINT NULL,
        ip VARCHAR(64) NULL,
        INDEX idx_cat (cat, id),
        INDEX idx_tag (tag, id),
        INDEX idx_actor (actor_id),
        INDEX idx_target (target_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
        .then(function () { ready = true; console.log('[logs] таблица server_logs готова'); })
        .catch(function (e) { console.log('[logs] ' + e.message); });
}, 1500);

function who(x) {
    if (x === null || x === undefined) return { n: null, id: null };
    if (typeof x === 'string') return { n: x.slice(0, 64), id: null };
    try {
        const a = x.account || x.admAcc || null;
        const n = a && a.nick ? String(a.nick).replace(/ /g, '_') : String(x.name || '');
        return { n: n.slice(0, 64), id: a && a.id ? Number(a.id) : null };
    } catch (e) { return { n: null, id: null }; }
}

function add(cat, o) {
    o = o || {};
    const a = who(o.actor), t = who(o.target);
    buf.push([
        Date.now(), String(cat).slice(0, 16), o.tag ? String(o.tag).slice(0, 16) : null,
        a.n, a.id, t.n, t.id,
        String(o.action || cat).slice(0, 48),
        o.details === undefined || o.details === null ? null : String(o.details).slice(0, 2000),
        o.amount === undefined || o.amount === null ? null : Math.round(Number(o.amount) || 0),
        o.ip ? String(o.ip).slice(0, 64) : null
    ]);
    if (buf.length > 5000) buf.splice(0, buf.length - 5000);
}

function flush() {
    if (!ready || !buf.length) return;
    const rows = buf.splice(0, 400);
    const ph = rows.map(function () { return '(?,?,?,?,?,?,?,?,?,?,?)'; }).join(',');
    const args = [].concat.apply([], rows);
    q('INSERT INTO server_logs (t, cat, tag, actor, actor_id, target, target_id, action, details, amount, ip) VALUES ' + ph, args)
        .catch(function (e) { console.log('[logs] запись: ' + e.message); });
}
setInterval(flush, 2000);

const origAddCommand = mp.events.addCommand.bind(mp.events);
const HIDE = { login: 1, register: 1, password: 1, changepass: 1 };
mp.events.addCommand = function (name, fn) {
    if (typeof name === 'object') {
        const o = {};
        Object.keys(name).forEach(function (k) { o[k] = wrap(k, name[k]); });
        return origAddCommand(o);
    }
    return origAddCommand(name, wrap(name, fn));
};
function wrap(name, fn) {
    return function (p, full) {
        try { add('cmd', { actor: p, action: '/' + name, details: HIDE[name] ? '***' : String(full || '') }); } catch (e) {}
        return fn.apply(this, arguments);
    };
}

mp.events.add('playerJoin', function (p) {
    add('connect', { actor: p.name, action: 'join', details: 'SC: ' + (p.socialClub || '-') + ' | serial: ' + String(p.serial || '-').slice(0, 24), ip: p.ip });
});
mp.events.add('playerQuit', function (p, type, reason) {
    add('connect', { actor: p, action: 'quit', details: (type || '') + (reason ? ' | ' + reason : ''), ip: p.ip });
});
mp.events.add('playerChat', function (p, text) {
    add('chat', { actor: p, action: 'chat', details: text });
});
mp.events.add('playerDeath', function (p, reason, killer) {
    if (killer && killer !== p && mp.players.exists(killer)) {
        add('kill', { actor: killer, target: p, action: 'kill', details: 'оружие: ' + reason + ' | ' + Math.round(p.position.x) + ', ' + Math.round(p.position.y) + ', ' + Math.round(p.position.z) });
    } else {
        add('kill', { actor: p, action: 'death', details: 'причина: ' + reason });
    }
});
mp.events.add('playerEnterVehicle', function (p, v, seat) {
    if (seat !== 0 && seat !== -1) return;
    let m = '';
    try { m = String(v.getVariable('modelName') || v.model); } catch (e) {}
    add('vehicle', { actor: p, action: 'drive', details: 'модель ' + m + ' | номер ' + (v.numberPlate || '-') });
});

const ADMIN_TAG = {
    ban: 'ban', unban: 'ban', offban: 'ban', gban: 'ban', ungban: 'ban', kick: 'ban', mute: 'ban', warn: 'ban',
    jail: 'arrest', demorgan: 'arrest', kpz: 'arrest', unjail: 'arrest',
    setname: 'name', nick: 'name',
    givemoney: 'money', setmoney: 'money', money: 'money', pay: 'money',
    giveitem: 'item', givedoc: 'item', takedoc: 'item', givegun: 'item', giveweapon: 'item',
    veh: 'vehicle', givecar: 'vehicle', delveh: 'vehicle'
};

const SLog = {
    add: add,
    admin: function (adminName, adminLvl, action, target, details) {
        add('admin', { tag: ADMIN_TAG[action] || null, actor: adminName, target: target === '-' ? null : target, action: action, details: details, amount: adminLvl });
    },
    money: function (p, oldM, oldB, newM, newB, reason) {
        const dm = newM - oldM, db2 = newB - oldB;
        if (!dm && !db2) return;
        add('money', { actor: p, action: reason || (dm + db2 >= 0 ? 'income' : 'expense'), amount: dm + db2, details: (dm ? 'наличные ' + (dm > 0 ? '+' : '') + dm + ' → ' + newM : '') + (dm && db2 ? ' | ' : '') + (db2 ? 'банк ' + (db2 > 0 ? '+' : '') + db2 + ' → ' + newB : '') });
    },
    q: q
};
global.SLog = SLog;
console.log('[logs] логирование сервера включено');
module.exports = SLog;
