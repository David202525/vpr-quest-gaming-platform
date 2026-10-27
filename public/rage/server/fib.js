const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'fib_data.json');
const DB = (function () { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch (e) { return {}; } })();
if (!DB.cases) DB.cases = {};
if (!DB.covers) DB.covers = {};
let dirty = false;
function mark() { dirty = true; }
setInterval(function () { if (dirty) { dirty = false; fs.writeFile(FILE, JSON.stringify(DB), function () {}); } }, 5000);

const NEED = { case: 2, order: 3, check: 4, listen: 5, cover: 7 };
const COVER_TO = ['lspd', 'sheriff', 'army', 'gov', 'medic', 'lic', 'news'];
const POLICE = ['lspd', 'sheriff'];

function G() { return global.GovFaction; }
function q(sql, a) { const A = global.AdminCore; return A && A.q ? A.q(sql, a) : Promise.resolve([]); }
function notify(p, t, x) { if (typeof global.hudNotify === 'function') global.hudNotify(p, t, x); else p.outputChatBox(x); }
function sid(p) { return p && p.account && p.account.id ? Number(p.account.id) : 0; }
function nick(p) { return String((p.account && p.account.nick) || p.name).replace(/_/g, ' '); }
function realFac(p) { if (p.ucover) return 'fib'; return p.account && p.account.job ? String(p.account.job) : ''; }
function realRank(p) { if (p.ucover) return p.ucover.leader ? 99 : p.ucover.rank; const a = p.account; if (!a) return 0; return Number(a.leader) === 1 ? 99 : Number(a.job_rank) || 0; }
function isFib(p) { return realFac(p) === 'fib'; }
function fibRank(p) { return isFib(p) ? realRank(p) : 0; }
function clean(t) { return String(t || '').replace(/!\{[^}]*\}/g, '').replace(/[<>]/g, '').trim().slice(0, 180); }
function find(s) {
    s = String(s || '').trim();
    if (!s) return null;
    if (s[0] === '#') { const id = Number(s.slice(1)); return mp.players.toArray().find(function (x) { return sid(x) === id; }) || null; }
    const n = Number(s);
    if (String(n) === s) { const p = mp.players.at(n); return p && mp.players.exists(p) ? p : null; }
    return mp.players.toArray().find(function (x) { return x.name.toLowerCase() === s.toLowerCase(); }) || null;
}
function need(p, k) {
    if (!isFib(p)) { notify(p, 'error', 'Доступно только агентам FIB'); return false; }
    if (fibRank(p) < NEED[k]) { notify(p, 'warn', 'Нужен ' + NEED[k] + ' ранг FIB'); return false; }
    return true;
}
function fname(f) { const N = G() && G().NAMES; return (N && N[f]) || (global.CrimeSystem && global.CrimeSystem.ORGS[f] && global.CrimeSystem.ORGS[f].n) || f || 'гражданский'; }
function toFib(line) { mp.players.forEach(function (x) { if (x.account && isFib(x)) x.outputChatBox(line); }); }
function flog(t) { if (G() && G().flog) try { G().flog('fib', t); } catch (e) {} }

/* ===== 1. Дела FIB: LSPD и шерифы не могут снять или изменить ===== */
function isCase(id) { return !!DB.cases[Number(id)]; }
function canTouchWanted(p, id) {
    if (!isCase(id)) return true;
    if (isFib(p)) return true;
    const A = global.AdminSystem;
    if (A && A.lvl && A.lvl(p) >= 3) return true;
    return false;
}
mp.events.addCommand('case', function (p, full) {
    if (!need(p, 'case')) return;
    const a = String(full || '').trim().split(/\s+/);
    const t = find(a[0]);
    const why = a.slice(1).join(' ');
    if (!t || !sid(t)) return notify(p, 'warn', '/case [id] [причина] — забрать дело под контроль FIB');
    DB.cases[sid(t)] = { by: nick(p), r: clean(why) || 'федеральное дело', d: Date.now() };
    mark();
    const W = global.WantedSystem;
    if (W && W.info && !W.info(sid(t))) W.setById(sid(t), 1, 'Федеральное дело: ' + (clean(why) || 'FIB'), nick(p));
    toFib('!{#a9b2c6}[FIB] ' + nick(p) + ' взял дело ' + nick(t) + ' #' + sid(t) + ' под контроль FIB' + (why ? ': ' + clean(why) : ''));
    mp.players.forEach(function (x) { if (x.account && POLICE.indexOf(realFac(x)) >= 0) x.outputChatBox('!{#a9b2c6}[FIB] Дело #' + sid(t) + ' (' + nick(t) + ') передано FIB. Розыск меняет только FIB.'); });
    flog(nick(p) + ' забрал дело #' + sid(t));
});
mp.events.addCommand('uncase', function (p, full) {
    if (!need(p, 'case')) return;
    const s = String(full || '').trim();
    const t = find(s);
    const id = t ? sid(t) : Number(s.replace('#', ''));
    if (!id || !DB.cases[id]) return notify(p, 'warn', '/uncase [id|#static] — вернуть дело полиции');
    delete DB.cases[id]; mark();
    toFib('!{#a9b2c6}[FIB] ' + nick(p) + ' вернул дело #' + id + ' полиции');
});
mp.events.addCommand('cases', function (p) {
    if (!need(p, 'case')) return;
    const k = Object.keys(DB.cases);
    if (!k.length) return p.outputChatBox('!{#a9b2c6}[FIB] Активных дел нет');
    p.outputChatBox('!{#a9b2c6}=== Дела FIB (' + k.length + ') ===');
    k.slice(-20).forEach(function (id) { const c = DB.cases[id]; p.outputChatBox('!{#ffffff}#' + id + ' !{#cccccc}— ' + c.r + ' · ведёт ' + c.by); });
});

/* ===== 2. Приказы полиции ===== */
mp.events.addCommand('fo', function (p, full) {
    if (!need(p, 'order')) return;
    const t = clean(full);
    if (!t) return notify(p, 'warn', '/fo [текст] — приказ для LSPD и шерифов');
    const line = '!{#a9b2c6}[FIB → Полиция] !{#ffffff}' + nick(p) + ': !{#ffd36b}' + t;
    mp.players.forEach(function (x) { if (x.account && (POLICE.indexOf(realFac(x)) >= 0 || isFib(x))) x.outputChatBox(line); });
    flog(nick(p) + ' приказ полиции: ' + t.slice(0, 60));
});

/* ===== 3. Досье на госслужащих ===== */
async function dossier(p, id, t) {
    let row = null;
    if (!t) row = (await q('SELECT id, nick, login, job, job_rank, leader, last_login FROM accounts WHERE id = ? LIMIT 1', [id]))[0];
    const f = t ? realFac(t) : row && row.job;
    if (!t && !row) return notify(p, 'warn', 'Человек не найден');
    const name = t ? nick(t) : String(row.nick || row.login).replace(/_/g, ' ');
    const r = t ? realRank(t) : (Number(row.leader) === 1 ? 99 : Number(row.job_rank) || 0);
    const W = global.WantedSystem, w = W && W.info ? W.info(id) : null;
    const isGovF = G() && G().isGov ? G().isGov(f) || f === 'medic' : false;
    p.outputChatBox('!{#a9b2c6}━━━ Досье FIB · ' + name + ' #' + id + ' ━━━');
    p.outputChatBox('!{#ffffff}Место службы: !{#ffd36b}' + fname(f) + (f ? ' · ' + (r === 99 ? 'лидер' : r + ' ранг') : '') + (isGovF ? '' : ' !{#9a9aa8}(не госслужащий)'));
    if (t && t.ucover) p.outputChatBox('!{#ff8a4c}Под прикрытием в ' + fname(t.ucover.as) + (fibRank(p) >= NEED.cover ? ' · с ' + new Date(t.ucover.since).toLocaleTimeString('ru-RU') : ''));
    p.outputChatBox('!{#ffffff}Розыск: ' + (w ? w.s + '★ · ' + w.r + ' (выдал ' + w.by + ')' : 'нет') + (isCase(id) ? ' !{#a9b2c6}[дело FIB]' : ''));
    if (t) p.outputChatBox('!{#ffffff}В сети · ID ' + t.id + ' · ' + (G() && G().fines ? 'штрафов: ' + ((G().fines(id) || []).length || 0) : ''));
    else if (row && row.last_login) p.outputChatBox('!{#9a9aa8}Не в сети · последний вход ' + new Date(row.last_login).toLocaleString('ru-RU'));
    flog(nick(p) + ' запросил досье #' + id);
}
mp.events.addCommand('gcheck', function (p, full) {
    if (!need(p, 'check')) return;
    const s = String(full || '').trim();
    if (!s) return notify(p, 'warn', '/gcheck [id|#static] — досье сотрудника · /gcheck [фракция] — состав онлайн');
    const fl = s.toLowerCase();
    if (COVER_TO.concat(['fib']).indexOf(fl) >= 0) {
        const list = mp.players.toArray().filter(function (x) { return x.account && (x.account.job === fl); });
        p.outputChatBox('!{#a9b2c6}━━━ ' + fname(fl) + ' онлайн: ' + list.length + ' ━━━');
        list.forEach(function (x) { p.outputChatBox('!{#ffffff}' + nick(x) + ' [' + x.id + '] #' + sid(x) + ' · ' + (Number(x.account.leader) === 1 ? 'лидер' : (x.account.job_rank || 0) + ' ранг') + (x.ucover ? ' !{#ff8a4c}(агент FIB)' : '')); });
        return;
    }
    const t = find(s);
    const id = t ? sid(t) : Number(s.replace('#', ''));
    if (!id) return notify(p, 'warn', 'Человек не найден');
    dossier(p, id, t);
});

/* ===== 4. Прослушка раций банд и мафий ===== */
mp.events.addCommand('listen', function (p, full) {
    if (!need(p, 'listen')) return;
    const k = String(full || '').trim().toLowerCase();
    const C = global.CrimeSystem;
    if (!k || k === 'off' || k === 'выкл') { p.fibTap = null; return notify(p, 'ok', 'Прослушка выключена'); }
    if (k !== 'all' && !(C && C.ORGS[k])) return notify(p, 'warn', '/listen [' + (C ? Object.keys(C.ORGS).join('|') : 'org') + '|all|off]');
    p.fibTap = k;
    notify(p, 'ok', 'Прослушка: ' + (k === 'all' ? 'все банды и мафии' : C.ORGS[k].n));
    flog(nick(p) + ' включил прослушку ' + k);
});
function tap(org, line) {
    mp.players.forEach(function (x) {
        if (!x.fibTap || !isFib(x)) return;
        if (x.fibTap === 'all' || x.fibTap === org) x.outputChatBox('!{#6f7a8f}[Прослушка] ' + String(line).replace(/^!\{[^}]*\}/, ''));
    });
}

/* ===== 5. Работа под прикрытием ===== */
function coverStart(p, f, r) {
    const a = p.account;
    p.ucover = { as: f, rank: Number(a.job_rank) || 1, leader: Number(a.leader) === 1, since: Date.now() };
    DB.covers[sid(p)] = { as: f, r: r, rank: p.ucover.rank, leader: p.ucover.leader, since: p.ucover.since }; mark();
    a.job = f; a.job_rank = r; a.leader = 0;
    if (G() && G().sync) try { G().sync(p); } catch (e) {}
}
function coverEnd(p, silent) {
    if (!p.ucover) return;
    const c = p.ucover, a = p.account;
    if (a) { a.job = 'fib'; a.job_rank = c.leader ? 10 : c.rank; a.leader = c.leader ? 1 : 0; }
    q('UPDATE accounts SET job = ?, job_rank = ?, leader = ? WHERE id = ?', ['fib', c.leader ? 10 : c.rank, c.leader ? 1 : 0, sid(p)]);
    delete DB.covers[sid(p)]; mark();
    p.ucover = null;
    if (G() && G().sync) try { G().sync(p); } catch (e) {}
    if (!silent) { notify(p, 'ok', 'Вы вернулись в FIB'); toFib('!{#a9b2c6}[FIB] ' + nick(p) + ' вышел из-под прикрытия'); }
}
mp.events.addCommand('ucover', function (p, full) {
    if (p.ucover) return notify(p, 'warn', 'Вы уже под прикрытием в ' + fname(p.ucover.as) + ' · /uncover — выйти');
    if (!need(p, 'cover')) return;
    const a = String(full || '').trim().toLowerCase().split(/\s+/);
    const f = a[0], r = Math.max(1, Math.min(5, Math.floor(Number(a[1]) || 1)));
    if (COVER_TO.indexOf(f) < 0) return notify(p, 'warn', '/ucover [' + COVER_TO.join('|') + '] [ранг 1-5]');
    coverStart(p, f, r);
    notify(p, 'ok', 'Вы внедрены в ' + fname(f) + ' (' + r + ' ранг). Их рация, планшет и права теперь ваши. FIB-рация: /fr · выйти: /uncover');
    toFib('!{#a9b2c6}[FIB] ' + nick(p) + ' ушёл под прикрытие');
    flog(nick(p) + ' внедрён в ' + fname(f) + ' (' + r + ' ранг)');
});
mp.events.addCommand('uncover', function (p) {
    if (!p.ucover) return notify(p, 'warn', 'Вы не под прикрытием');
    coverEnd(p);
});
mp.events.addCommand('covers', function (p) {
    if (!need(p, 'cover')) return;
    const list = mp.players.toArray().filter(function (x) { return x.ucover; });
    if (!list.length) return p.outputChatBox('!{#a9b2c6}[FIB] Агентов под прикрытием нет');
    p.outputChatBox('!{#a9b2c6}=== Агенты под прикрытием ===');
    list.forEach(function (x) { p.outputChatBox('!{#ffffff}' + nick(x) + ' [' + x.id + '] → ' + fname(x.ucover.as) + ' · ' + Math.round((Date.now() - x.ucover.since) / 60000) + ' мин'); });
});
mp.events.addCommand('fr', function (p, full) {
    if (!isFib(p)) return;
    const t = clean(full);
    if (!t) return notify(p, 'warn', '/fr [текст] — защищённый канал FIB');
    toFib('!{#a9b2c6}[FIB · защищ.] ' + nick(p) + (p.ucover ? ' (агент)' : '') + ': !{#ffffff}' + t);
});
setInterval(function () {
    mp.players.forEach(function (p) {
        if (p.ucover && p.account && p.account.job !== p.ucover.as) { notify(p, 'error', 'Прикрытие раскрыто — вас убрали из ' + fname(p.ucover.as)); toFib('!{#a9b2c6}[FIB] Агент ' + nick(p) + ' потерял прикрытие'); return coverEnd(p, true); }
        if (p.ucover || !p.account || !sid(p)) return;
        const c = DB.covers[sid(p)];
        if (!c) return;
        if (p.account.job === c.as || p.account.job === 'fib') {
            p.ucover = { as: c.as, rank: c.rank, leader: c.leader, since: c.since };
            p.account.job = c.as; p.account.job_rank = c.r; p.account.leader = 0;
            if (G() && G().sync) try { G().sync(p); } catch (e) {}
            notify(p, 'warn', 'Вы всё ещё под прикрытием в ' + fname(c.as) + ' · /uncover — вернуться в FIB');
        } else { delete DB.covers[sid(p)]; mark(); }
    });
}, 4000);
mp.events.add('playerQuit', function (p) {
    if (!p.ucover) return;
    q('UPDATE accounts SET job = ?, job_rank = ?, leader = ? WHERE id = ?', ['fib', p.ucover.leader ? 10 : p.ucover.rank, p.ucover.leader ? 1 : 0, sid(p)]);
});

global.FibSystem = { isCase: isCase, canTouchWanted: canTouchWanted, tap: tap, isFib: isFib, realFac: realFac, coverEnd: coverEnd };
console.log('[fib] FIB: дела, приказы, досье, прослушка, работа под прикрытием');
module.exports = global.FibSystem;
