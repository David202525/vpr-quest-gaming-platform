const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'media_data.json');
const S = Object.assign({ list: {}, codes: {}, used: {}, cfg: { bonusMoney: 5000, bonusCoins: 0, refCoins: 10, maxLvl: 3 } }, (function () { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch (e) { return {}; } })());
let dirty = false;
setInterval(function () { if (dirty) { dirty = false; try { fs.writeFileSync(FILE, JSON.stringify(S)); } catch (e) {} } }, 5000);

const WEEK = 7 * 86400000;
const CARS = ['elegy', 'sultanrs', 'zentorno', 'comet2', 'kuruma', 'bati', 'sanchez', 'baller', 'dubsta2', 'stretch', 'police3', 'akuma'];
const WEATHERS = ['CLEAR', 'EXTRASUNNY', 'CLOUDS', 'OVERCAST', 'RAIN', 'THUNDER', 'FOGGY', 'SMOG', 'XMAS', 'SNOWLIGHT', 'HALLOWEEN', 'NEUTRAL'];

function sid(p) { const a = p.account || p.admAcc; return a && a.id ? Number(a.id) : 0; }
function nick(p) { const a = p.account; return String((a && a.nick) || p.name).replace(/_/g, ' '); }
function notify(p, type, text) { if (typeof global.hudNotify === 'function') global.hudNotify(p, type, text); else p.outputChatBox(text); }
function admLvl(p) { return global.AdminSystem && global.AdminSystem.realLvl ? global.AdminSystem.realLvl(p) : 0; }
function UI() { return global.UiSystem; }
function M() { return global.MoneySystem; }
function rec(id) { return S.list[String(id)] || null; }
function me(p) { return rec(sid(p)); }
function online(id) { return mp.players.toArray().find(function (x) { return sid(x) === Number(id); }) || null; }
function coins(id, n, why) {
    const U = UI();
    if (!U || !U.addCoins) return false;
    const r = U.addCoins(null, '#' + id, n);
    if (global.SLog) try { global.SLog.add('donate', { actor: null, action: 'media', amount: n, details: '#' + id + ' ' + why }); } catch (e) {}
    return r && r.ok;
}
function applyBadge(p) {
    const m = me(p);
    const want = m && m.badge !== false ? 'media' : 0;
    if (want) p.setVariable('mediaBadge', 1); else p.setVariable('mediaBadge', 0);
}

/* ---------- еженедельная зарплата ---------- */
function payWeek() {
    const now = Date.now();
    Object.keys(S.list).forEach(function (k) {
        const m = S.list[k];
        if (!m.salary || m.paused) return;
        if (!m.nextPay) m.nextPay = now + WEEK;
        if (now < m.nextPay) return;
        m.nextPay = now + WEEK;
        coins(k, m.salary, 'зарплата медиа');
        m.hist = (m.hist || []).concat([{ t: now, n: m.salary, w: 'Зарплата за неделю' }]).slice(-30);
        m.paid = (m.paid || 0) + m.salary;
        dirty = true;
        const p = online(k);
        if (p) notify(p, 'ok', 'Медиа-зарплата: +' + m.salary + ' RC');
    });
}
setInterval(payWeek, 60000);

/* ---------- панель партнёра ---------- */
function panel(p) {
    const m = me(p);
    if (!m) return null;
    const c = m.code ? S.codes[m.code] : null;
    return {
        name: nick(p), since: m.since, salary: m.salary || 0, nextPay: m.nextPay || 0, paid: m.paid || 0, paused: !!m.paused,
        code: m.code || '', uses: c ? c.uses : 0, refPaid: c ? c.coins || 0 : 0, cfg: S.cfg,
        badge: m.badge !== false, streamer: !!m.streamer,
        fly: !m.flyBan, flyReason: m.flyBan ? m.flyBan.reason : '', flying: !!p.mediaFly,
        hist: (m.hist || []).slice(-10).reverse(),
        cars: CARS, weathers: WEATHERS, car: p.mediaCar && mp.vehicles.exists(p.mediaCar) ? { m: p.mediaCarModel, left: Math.max(0, p.mediaCarUntil - Date.now()) } : null
    };
}
function send(p, extra) { const d = panel(p); if (d) p.call('media:open', [JSON.stringify(Object.assign(d, extra || {}))]); }

mp.events.add('srv:media:open', function (p) {
    if (!me(p)) return;
    send(p);
});
mp.events.addCommand('media', function (p) { if (!me(p)) return notify(p, 'warn', 'Панель доступна только медиа-партнёрам'); send(p); });
function carClear(p) {
    if (p.mediaCar && mp.vehicles.exists(p.mediaCar)) p.mediaCar.destroy();
    p.mediaCar = null;
}
mp.events.add('srv:media:act', function (p, act, val) {
    const m = me(p);
    if (!m) return;
    val = String(val || '');
    const reply = function (o) { send(p, o); };
    if (act === 'code') {
        const code = val.trim().toUpperCase();
        if (!/^[A-Z0-9_]{3,16}$/.test(code)) return reply({ err: 'Промокод: 3–16 символов, латиница, цифры, _' });
        if (m.code === code) return reply({ err: 'Это уже ваш промокод' });
        if (S.codes[code]) return reply({ err: 'Такой промокод уже занят' });
        if (m.code && S.codes[m.code] && S.codes[m.code].uses > 0) return reply({ err: 'Промокод уже активировали — сменить нельзя. Обратитесь к администрации' });
        if (m.code) delete S.codes[m.code];
        S.codes[code] = { owner: sid(p), uses: 0, coins: 0 };
        m.code = code; dirty = true;
        return reply({ ok: 'Промокод ' + code + ' создан' });
    }
    if (act === 'badge') { m.badge = m.badge === false; dirty = true; applyBadge(p); return reply({ ok: m.badge ? 'Метка «Медиа» включена' : 'Метка «Медиа» скрыта' }); }
    if (act === 'streamer') { m.streamer = !m.streamer; dirty = true; p.call('media:streamer', [m.streamer ? 1 : 0]); return reply({ ok: m.streamer ? 'Режим стримера включён' : 'Режим стримера выключен' }); }
    if (act === 'weather') { if (WEATHERS.indexOf(val) < 0 && val !== 'reset') return; p.call('media:weather', [val]); return reply({ ok: val === 'reset' ? 'Погода как на сервере' : 'Погода (только у вас): ' + val }); }
    if (act === 'time') { const h = Number(val); p.call('media:time', [isFinite(h) ? h : -1]); return reply({ ok: h >= 0 ? 'Время (только у вас): ' + h + ':00' : 'Время как на сервере' }); }
    if (act === 'car') {
        if (CARS.indexOf(val) < 0) return;
        if (p.vehicle) return reply({ err: 'Выйдите из транспорта' });
        if (p.dimension !== 0) return reply({ err: 'Только на улице' });
        if (p.mediaCarAt && Date.now() - p.mediaCarAt < 60000) return reply({ err: 'Не чаще раза в минуту' });
        carClear(p);
        const h = (p.heading || 0) * Math.PI / 180;
        const v = mp.vehicles.new(mp.joaat(val), new mp.Vector3(p.position.x - Math.sin(h) * 3, p.position.y + Math.cos(h) * 3, p.position.z + 0.3), { heading: p.heading || 0, numberPlate: 'MEDIA', dimension: 0, engine: false });
        v.setVariable('fuel', 100); v.setVariable('pub', 1); v.jobOwner = p.id;
        p.mediaCar = v; p.mediaCarModel = val; p.mediaCarAt = Date.now(); p.mediaCarUntil = Date.now() + 30 * 60000;
        setTimeout(function () { if (mp.players.exists(p) && mp.vehicles.exists(v)) try { p.putIntoVehicle(v, 0); } catch (e) {} }, 400);
        return reply({ ok: 'Машина на 30 минут: ' + val });
    }
    if (act === 'fly') { flyCmd(p); return; }
    if (act === 'carDel') { carClear(p); return reply({ ok: 'Машина убрана' }); }
});
setInterval(function () {
    mp.players.forEach(function (p) {
        if (p.mediaCar && Date.now() > p.mediaCarUntil) {
            const v = p.mediaCar;
            if (mp.vehicles.exists(v) && v.getOccupants && v.getOccupants().length) return;
            carClear(p); notify(p, 'warn', 'Время машины для контента истекло');
        }
    });
}, 15000);
mp.events.add('playerQuit', carClear);

/* ---------- промокод для игроков ---------- */
mp.events.addCommand('promo', function (p, full) {
    const code = String(full || '').trim().toUpperCase();
    if (!code) return notify(p, 'warn', 'Введите: /promo [код]');
    const c = S.codes[code];
    if (!c) return notify(p, 'error', 'Промокод не найден');
    const id = sid(p);
    if (!id) return;
    if (c.owner === id) return notify(p, 'error', 'Нельзя активировать свой промокод');
    if (S.used[id]) return notify(p, 'error', 'Вы уже активировали промокод');
    const lv = UI() && UI().lvlOf ? UI().lvlOf(p) : 1;
    if (lv > S.cfg.maxLvl && admLvl(p) < 1) return notify(p, 'error', 'Промокод доступен только до ' + S.cfg.maxLvl + ' уровня');
    S.used[id] = code; c.uses++; dirty = true;
    if (S.cfg.bonusMoney && M()) M().addBank(p, S.cfg.bonusMoney);
    if (S.cfg.bonusCoins) coins(id, S.cfg.bonusCoins, 'бонус промокода ' + code);
    if (S.cfg.refCoins) { coins(c.owner, S.cfg.refCoins, 'активация промокода'); c.coins = (c.coins || 0) + S.cfg.refCoins; }
    notify(p, 'ok', 'Промокод активирован! ' + (S.cfg.bonusMoney ? '+$' + S.cfg.bonusMoney + ' на счёт' : '') + (S.cfg.bonusCoins ? ' +' + S.cfg.bonusCoins + ' RC' : ''));
    const o = online(c.owner);
    if (o) notify(o, 'ok', nick(p) + ' активировал ваш промокод ' + code + (S.cfg.refCoins ? ' (+' + S.cfg.refCoins + ' RC)' : ''));
});

/* ---------- F4: управление (7+) ---------- */
function admView() {
    return {
        cfg: S.cfg,
        list: Object.keys(S.list).map(function (k) {
            const m = S.list[k], c = m.code ? S.codes[m.code] : null;
            const op = online(k); return { fly: !m.flyBan, flyReason: m.flyBan ? m.flyBan.reason + ' (' + m.flyBan.by + ')' : '', flying: !!(op && op.mediaFly), id: Number(k), name: m.name, salary: m.salary || 0, nextPay: m.nextPay || 0, paid: m.paid || 0, paused: !!m.paused, code: m.code || '', uses: c ? c.uses : 0, on: !!online(k), since: m.since };
        })
    };
}
function admFind(v) {
    v = String(v || '').trim();
    if (!v) return null;
    if (v[0] === '#') { const id = Number(v.slice(1)); const p = online(id); return id ? { id: id, name: p ? nick(p) : (S.list[id] ? S.list[id].name : '#' + id), p: p } : null; }
    const t = mp.players.at(Number(v));
    if (t && mp.players.exists(t) && sid(t)) return { id: sid(t), name: nick(t), p: t };
    const n = v.toLowerCase();
    const x = mp.players.toArray().find(function (pp) { return sid(pp) && (pp.name.toLowerCase() === n || nick(pp).toLowerCase() === n); });
    return x ? { id: sid(x), name: nick(x), p: x } : null;
}
function admAct(p, d) {
    if (admLvl(p) < 7) return { err: 'Медиа управляет администрация с 7 уровня' };
    const op = d.op;
    const A = global.AdminSystem;
    const log = function (t) { if (A && A.log) try { A.log(p, 'media', t); } catch (e) {} };
    if (op === 'add') {
        const T = admFind(d.who);
        if (!T) return { err: 'Игрок не найден (ID в сети или #static)' };
        if (S.list[T.id]) return { err: 'Уже медиа-партнёр' };
        const sal = Math.max(0, Math.min(100000, Math.floor(Number(d.salary) || 0)));
        S.list[T.id] = { name: T.name, since: Date.now(), salary: sal, nextPay: Date.now() + WEEK, paid: 0, hist: [], badge: true };
        dirty = true; log('add ' + T.name + ' ' + sal);
        if (T.p) { applyBadge(T.p); notify(T.p, 'ok', 'Вы стали медиа-партнёром AMRP! Панель — F10'); T.p.call('media:role', [1]); }
        return { ok: T.name + ' назначен медиа-партнёром' };
    }
    const m = S.list[String(d.id)];
    if (!m) return { err: 'Партнёр не найден' };
    const p2 = online(d.id);
    if (op === 'del') {
        if (m.code) delete S.codes[m.code];
        delete S.list[String(d.id)]; dirty = true; log('del ' + m.name);
        if (p2 && p2.mediaFly) flyStop(p2, 'статус медиа снят');
        if (p2) { p2.setVariable('mediaBadge', 0); p2.call('media:role', [0]); p2.call('media:streamer', [0]); notify(p2, 'warn', 'Статус медиа-партнёра снят'); }
        return { ok: m.name + ' больше не медиа' };
    }
    if (op === 'fly') {
        if (m.flyBan) { m.flyBan = null; dirty = true; log('flyon ' + m.name); if (p2) notify(p2, 'ok', 'Администрация вернула вам полёт /fly'); return { ok: 'Полёт возвращён: ' + m.name }; }
        const reason = String(d.reason || '').trim().slice(0, 100) || 'нарушение правил использования';
        m.flyBan = { by: nick(p), reason: reason, at: Date.now() }; dirty = true; log('flyoff ' + m.name + ' ' + reason);
        if (p2) { if (p2.mediaFly) flyStop(p2, 'полёт забран администрацией'); notify(p2, 'error', 'Полёт /fly забран: ' + reason); }
        return { ok: 'Полёт забран у ' + m.name };
    }
    if (op === 'flystop') { if (!p2 || !p2.mediaFly) return { err: 'Партнёр сейчас не летает' }; flyStop(p2, 'остановлено администратором'); log('flystop ' + m.name); return { ok: 'Полёт остановлен' }; }
    if (op === 'salary') { m.salary = Math.max(0, Math.min(100000, Math.floor(Number(d.value) || 0))); dirty = true; log('salary ' + m.name + ' ' + m.salary); return { ok: 'Зарплата ' + m.name + ': ' + m.salary + ' RC/нед' }; }
    if (op === 'pause') { m.paused = !m.paused; if (!m.paused) m.nextPay = Date.now() + WEEK; dirty = true; return { ok: m.paused ? 'Выплаты приостановлены' : 'Выплаты возобновлены' }; }
    if (op === 'paynow') {
        if (!m.salary) return { err: 'Зарплата 0' };
        coins(d.id, m.salary, 'зарплата медиа (досрочно)');
        m.hist = (m.hist || []).concat([{ t: Date.now(), n: m.salary, w: 'Выплата досрочно' }]).slice(-30);
        m.paid = (m.paid || 0) + m.salary; m.nextPay = Date.now() + WEEK; dirty = true; log('paynow ' + m.name);
        if (p2) notify(p2, 'ok', 'Медиа-зарплата: +' + m.salary + ' RC');
        return { ok: 'Выплачено ' + m.salary + ' RC' };
    }
    return null;
}
function cfgAct(p, d) {
    if (admLvl(p) < 7) return { err: 'Нужен 7 уровень' };
    S.cfg.bonusMoney = Math.max(0, Math.min(1000000, Math.floor(Number(d.bonusMoney) || 0)));
    S.cfg.bonusCoins = Math.max(0, Math.min(10000, Math.floor(Number(d.bonusCoins) || 0)));
    S.cfg.refCoins = Math.max(0, Math.min(10000, Math.floor(Number(d.refCoins) || 0)));
    S.cfg.maxLvl = Math.max(1, Math.min(100, Math.floor(Number(d.maxLvl) || 3)));
    dirty = true;
    return { ok: 'Настройки промокодов сохранены' };
}

mp.events.add('playerReady', function (p) { setTimeout(function () { if (!mp.players.exists(p)) return; const m = me(p); p.call('media:role', [m ? 1 : 0]); if (m) { applyBadge(p); if (m.streamer) p.call('media:streamer', [1]); } }, 6000); });
setInterval(function () {
    mp.players.forEach(function (p) {
        if (!sid(p) || p.mediaChecked) return;
        p.mediaChecked = true;
        const m = me(p);
        p.call('media:role', [m ? 1 : 0]);
        if (m) { applyBadge(p); if (m.streamer) p.call('media:streamer', [1]); }
    });
}, 5000);

/* ---------- полёт /fly для медиа ---------- */
const FLY_RADIUS = 400;
function flyLog(p, t) {
    const A = global.AdminSystem;
    if (A && A.log) try { A.log(p, 'mediafly', t); } catch (e) {}
    if (global.SLog) try { global.SLog.add('media', { actor: nick(p), action: 'fly', details: t }); } catch (e) {}
}
function flyWhyNot(p) {
    const m = me(p);
    if (!m) return null;
    if (m.flyBan) return 'Полёт забран администрацией' + (m.flyBan.reason ? ': ' + m.flyBan.reason : '');
    if (p.vehicle) return 'Выйдите из транспорта';
    if (p.health <= 0) return 'Нельзя во время смерти';
    if (p.getVariable('cuffed')) return 'Нельзя в наручниках';
    if (global.WantedSystem && global.WantedSystem.get(p) > 0) return 'Нельзя в розыске';
    if (global.JailSystem && global.JailSystem.info(p)) return 'Нельзя в заключении';
    if (p.mediaHitAt && Date.now() - p.mediaHitAt < 60000) return 'Нельзя в течение минуты после получения урона';
    return '';
}
function flyStop(p, why) {
    if (!p.mediaFly) return;
    const st = p.mediaFly;
    p.mediaFly = null;
    p.alpha = 255;
    p.call('media:flyStop');
    if (st.pos) { p.position = st.pos; p.dimension = st.dim; }
    flyLog(p, 'выкл' + (why ? ' (' + why + ')' : '') + ' · ' + Math.round((Date.now() - st.since) / 1000) + ' сек');
    if (why) notify(p, 'warn', 'Полёт завершён: ' + why);
}
function flyCmd(p) {
    const m = me(p);
    if (!m) return false;
    if (p.mediaFly) { flyStop(p); return true; }
    const why = flyWhyNot(p);
    if (why) { notify(p, 'error', why); return true; }
    p.mediaFly = { since: Date.now(), pos: p.position, dim: p.dimension };
    p.alpha = 0;
    p.call('media:flyStart', [FLY_RADIUS]);
    flyLog(p, 'вкл');
    return true;
}
mp.events.add('srv:media:fly', function (p) { flyCmd(p); });
mp.events.add('srv:media:flyEnd', function (p) { flyStop(p); });
mp.events.add('playerDamage', function (p) { p.mediaHitAt = Date.now(); });
mp.events.add('playerDeath', function (p) { if (p.mediaFly) flyStop(p, 'смерть'); });
mp.events.add('playerQuit', function (p) { if (p.mediaFly) { p.mediaFly = null; flyLog(p, 'выход с сервера'); } });
setInterval(function () {
    mp.players.forEach(function (p) {
        if (!p.mediaFly) return;
        const m = me(p);
        if (!m) return flyStop(p, 'статус медиа снят');
        if (m.flyBan) return flyStop(p, 'полёт забран администрацией');
        if (global.WantedSystem && global.WantedSystem.get(p) > 0) return flyStop(p, 'вы в розыске');
        if (p.getVariable('cuffed')) return flyStop(p, 'наручники');
        if (global.JailSystem && global.JailSystem.info(p)) return flyStop(p, 'заключение');
    });
}, 1000);

global.MediaSystem = { admView: admView, admAct: admAct, cfgAct: cfgAct, flyCmd: flyCmd, is: function (p) { return !!me(p); } };
console.log('[media] медиа-партнёров: ' + Object.keys(S.list).length);
