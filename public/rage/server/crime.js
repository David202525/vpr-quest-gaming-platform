const fs = require('fs');
const path = require('path');
let db = null;
try { db = require('../database'); } catch (e) { try { db = require('./database'); } catch (e2) { db = null; } }

const FILE = path.join(__dirname, 'crime_data.json');
const S = Object.assign({ orgs: {}, zones: {}, addict: {}, dealer: null, buyer: null, stash: {}, wars: [] }, (function () { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch (e) { return {}; } })());
let dirty = false;
function mark() { dirty = true; }
setInterval(function () { if (dirty) { dirty = false; try { fs.writeFileSync(FILE, JSON.stringify(S)); } catch (e) {} } }, 5000);
async function q(sql, args) { if (!db) return []; try { const r = await db.query(sql, args || []); return Array.isArray(r) && Array.isArray(r[0]) ? r[0] : r; } catch (e) { console.log('[crime] db: ' + e.message); return []; } }

/* ======================= ОРГАНИЗАЦИИ ======================= */
const ORGS = {
    ballas: { n: 'Ballas', t: 'gang', c: '#9b4fd1', bc: 27, rgb: [120, 40, 170], home: [85.0, -1959.0, 20.8, 40], cars: [['buccaneer2', 1], ['chino2', 1], ['faction2', 3], ['moonbeam2', 5]] },
    families: { n: 'The Families', t: 'gang', c: '#3fb34f', bc: 2, rgb: [30, 140, 50], home: [-161.0, -1638.0, 34.0, 50], cars: [['virgo3', 1], ['primo2', 1], ['sabregt2', 3], ['tornado5', 5]] },
    vagos: { n: 'Los Santos Vagos', t: 'gang', c: '#f0c82a', bc: 5, rgb: [230, 190, 20], home: [331.0, -2040.0, 20.9, 140], cars: [['voodoo', 1], ['minivan2', 1], ['slamvan3', 3], ['buccaneer2', 5]] },
    marabunta: { n: 'Marabunta Grande', t: 'gang', c: '#3a8fe0', bc: 3, rgb: [30, 100, 200], home: [1438.0, -1490.0, 63.6, 340], cars: [['tornado', 1], ['peyote', 1], ['impaler', 3], ['savestra', 5]] },
    bloods: { n: 'Bloods', t: 'gang', c: '#e03a3a', bc: 1, rgb: [190, 20, 20], home: [480.0, -1780.0, 28.6, 90], cars: [['manana', 1], ['emperor', 1], ['dukes', 3], ['gauntlet', 5]] },
    lcn: { n: 'La Cosa Nostra', t: 'mafia', c: '#c9a24a', bc: 46, rgb: [150, 120, 50], home: [-1520.0, 110.0, 50.0, 300], cars: [['cognoscenti', 1], ['schafter3', 2], ['baller4', 4], ['stretch', 6]] },
    russian: { n: 'Русская мафия', t: 'mafia', c: '#9aa3b0', bc: 39, rgb: [70, 75, 85], home: [-1462.0, -32.0, 54.6, 40], cars: [['huntley', 1], ['schafter2', 2], ['xls2', 4], ['cog55', 6]] },
    yakuza: { n: 'Yakuza', t: 'mafia', c: '#d23b6b', bc: 48, rgb: [170, 20, 70], home: [-794.0, 182.0, 72.8, 110], cars: [['sultan', 1], ['kuruma', 2], ['fugitive', 4], ['superd', 6]] }
};
const RANKS = {
    gang: ['Новичок', 'Шестёрка', 'Боец', 'Бывалый', 'Уважаемый', 'Старший', 'Правая рука', 'Смотрящий', 'Лидер'],
    mafia: ['Аутсайдер', 'Шестёрка', 'Солдат', 'Боец', 'Капореджиме', 'Консильери', 'Младший босс', 'Дон']
};
function O(k) {
    if (!S.orgs[k]) S.orgs[k] = {};
    const o = S.orgs[k];
    if (!o.ranks) o.ranks = RANKS[ORGS[k].t].slice();
    if (!o.deps) o.deps = [];
    if (o.bank === undefined) o.bank = 0;
    if (!o.log) o.log = [];
    return o;
}
function olog(k, t) { const o = O(k); o.log.unshift({ t: Date.now(), x: t }); if (o.log.length > 80) o.log.length = 80; mark(); }

function notify(p, type, text) { if (typeof global.hudNotify === 'function') global.hudNotify(p, type, text); else p.outputChatBox(text); }
function sid(p) { return p && p.account && p.account.id ? Number(p.account.id) : 0; }
function nick(p) { return String((p.account && p.account.nick) || p.name).replace(/_/g, ' '); }
function org(p) { const j = p && p.account && p.account.job; return j && ORGS[j] ? j : ''; }
function rank(p) { const a = p.account; if (!a) return 0; if (Number(a.leader) === 1) return 99; return Number(a.job_rank) || 1; }
function isLeader(p) { const a = p.account; return !!(a && org(p) && (Number(a.leader) === 1 || Number(a.job_rank) >= O(org(p)).ranks.length)); }
function isDep(p) { const k = org(p); return !!k && O(k).deps.indexOf(sid(p)) >= 0; }
function mgr(p) { return isLeader(p) || isDep(p); }
function rankName(k, r) { const R = O(k).ranks; return R[Math.max(0, Math.min(R.length, r) - 1)] || ('Ранг ' + r); }
function admLvl(p) { return global.AdminSystem && global.AdminSystem.realLvl ? global.AdminSystem.realLvl(p) : 0; }
function money(n) { return '$' + String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function online(id) { return mp.players.toArray().find(function (x) { return sid(x) === Number(id); }) || null; }
function U() { return global.UiSystem; }
function M() { return global.MoneySystem; }
function isCop(p) { const j = p.account && p.account.job; return ['lspd', 'sheriff', 'fib', 'army'].indexOf(j) >= 0; }
function dist2(a, x, y) { return Math.hypot(a.x - x, a.y - y); }
function clean(t) { return String(t || '').replace(/!\{[^}]*\}/g, '').replace(/[<>]/g, '').trim().slice(0, 160); }
function pay(p, sum) {
    const m = M(); if (!m) return false;
    const cash = m.get(p), bank = m.bank(p);
    if (cash + bank < sum) return false;
    const fb = Math.max(0, sum - cash);
    m.set(p, cash - (sum - fb), bank - fb, 'crime');
    return true;
}
function sync(p) {
    const k = org(p);
    if ((p.getVariable('org') || '') !== k) p.setVariable('org', k);
}
setInterval(function () { mp.players.forEach(function (p) { if (p.account) sync(p); }); }, 3000);

async function setOrg(t, k, r, leader) {
    t.account.job = k || null; t.account.job_rank = k ? r : 0; t.account.leader = leader ? 1 : 0;
    await q('UPDATE accounts SET job = ?, job_rank = ?, leader = ? WHERE id = ?', [k || null, k ? r : 0, leader ? 1 : 0, sid(t)]);
    sync(t);
}

/* ---- приглашение / управление ---- */
mp.events.addCommand('oinvite', function (p, full) {
    const k = org(p);
    if (!k || !mgr(p)) return notify(p, 'warn', 'Приглашать могут лидер и заместители банды / мафии');
    const t = mp.players.at(Number(String(full || '').trim()));
    if (!t || !t.account || t === p) return p.outputChatBox('!{#ffcc66}/oinvite [id] — игрок должен стоять рядом');
    if (t.position.subtract(p.position).length() > 5) return notify(p, 'warn', 'Игрок должен быть рядом');
    if (t.account.job) return notify(p, 'warn', 'Игрок уже состоит в организации');
    t.orgInvite = { k: k, by: sid(p), at: Date.now() };
    t.call('social:offer', [nick(p) + ' зовёт вас в ' + ORGS[k].n, 30000]);
    notify(p, 'ok', 'Приглашение отправлено');
});
mp.events.add('srv:int:answer', async function (t, yes) {
    const o = t.orgInvite;
    if (!o || Date.now() - o.at > 30000) return;
    t.orgInvite = null;
    const by = online(o.by);
    if (!yes) { if (by) notify(by, 'warn', nick(t) + ' отказался'); return; }
    if (t.account.job) return;
    await setOrg(t, o.k, 1, false);
    olog(o.k, nick(t) + ' вступил' + (by ? ' (позвал ' + nick(by) + ')' : ''));
    notify(t, 'ok', 'Вы вступили в ' + ORGS[o.k].n + '. Рация: /f · помощь: /help');
    if (by) notify(by, 'ok', nick(t) + ' теперь с вами');
});
async function manage(p, id, act) {
    const k = org(p);
    if (!k || !mgr(p)) return notify(p, 'warn', 'Только лидер или заместитель');
    const r = (await q('SELECT id, nick, login, job, job_rank, leader FROM accounts WHERE id = ? LIMIT 1', [id]))[0];
    if (!r || r.job !== k) return notify(p, 'warn', 'Это не ваш человек');
    if (Number(r.leader) === 1 || Number(r.id) === sid(p)) return notify(p, 'warn', 'Нельзя');
    const o = O(k), t = online(id), n = String(r.nick || r.login).replace(/_/g, ' ');
    let nr = Number(r.job_rank) || 1;
    if (act === 'up') nr = Math.min(o.ranks.length - 1, nr + 1);
    if (act === 'down') nr = Math.max(1, nr - 1);
    if (act === 'kick') {
        await q('UPDATE accounts SET job = NULL, job_rank = 0, leader = 0 WHERE id = ?', [id]);
        o.deps = o.deps.filter(function (x) { return x !== Number(id); });
        if (t) { t.account.job = null; t.account.job_rank = 0; sync(t); notify(t, 'error', 'Вас выгнали из ' + ORGS[k].n); }
        olog(k, nick(p) + ' выгнал ' + n); return notify(p, 'ok', n + ' выгнан');
    }
    if (act === 'dep') {
        if (!isLeader(p)) return notify(p, 'warn', 'Заместителей назначает лидер');
        const i = o.deps.indexOf(Number(id));
        if (i >= 0) o.deps.splice(i, 1); else o.deps.push(Number(id));
        mark(); olog(k, nick(p) + (i >= 0 ? ' снял зама ' : ' назначил замом ') + n);
        return notify(p, 'ok', i >= 0 ? 'Зам снят' : n + ' — заместитель');
    }
    await q('UPDATE accounts SET job_rank = ? WHERE id = ?', [nr, id]);
    if (t) { t.account.job_rank = nr; notify(t, 'ok', 'Ваш ранг: ' + rankName(k, nr)); }
    olog(k, nick(p) + ': ' + n + ' → ' + rankName(k, nr));
    notify(p, 'ok', n + ' → ' + rankName(k, nr));
}
[['orankup', 'up'], ['orankdown', 'down'], ['okick', 'kick'], ['odep', 'dep']].forEach(function (c) {
    mp.events.addCommand(c[0], function (p, full) {
        const id = Number(String(full || '').trim().replace('#', ''));
        if (!id) return p.outputChatBox('!{#ffcc66}/' + c[0] + ' [static id] — номер аккаунта (виден в /omembers)');
        manage(p, id, c[1]);
    });
});
mp.events.addCommand('omembers', async function (p) {
    const k = org(p);
    if (!k) return notify(p, 'warn', 'Вы не состоите в банде или мафии');
    const rows = await q('SELECT id, nick, login, job_rank, leader FROM accounts WHERE job = ? ORDER BY leader DESC, job_rank DESC LIMIT 60', [k]);
    p.outputChatBox('!{' + ORGS[k].c + '}=== ' + ORGS[k].n + ' · ' + rows.length + ' чел. · общак ' + money(O(k).bank) + ' ===');
    rows.forEach(function (r) {
        const on = online(r.id);
        p.outputChatBox((on ? '!{#8fd14f}● ' : '!{#777777}○ ') + '!{#ffffff}#' + r.id + ' ' + String(r.nick || r.login).replace(/_/g, ' ') + ' !{#aaaaaa}— ' + (Number(r.leader) === 1 ? O(k).ranks[O(k).ranks.length - 1] : rankName(k, Number(r.job_rank) || 1)) + (O(k).deps.indexOf(Number(r.id)) >= 0 ? ' (зам)' : ''));
    });
});
mp.events.addCommand('oleave', async function (p) {
    const k = org(p);
    if (!k) return;
    if (isLeader(p)) return notify(p, 'warn', 'Лидер не может уйти сам — обратитесь к администрации');
    await setOrg(p, null, 0, false);
    olog(k, nick(p) + ' ушёл сам');
    notify(p, 'ok', 'Вы покинули ' + ORGS[k].n);
});
mp.events.addCommand('orank', function (p, full) {
    const k = org(p);
    if (!k || !isLeader(p)) return notify(p, 'warn', 'Только лидер');
    const a = String(full || '').trim().split(/\s+/), i = Number(a[0]), n = clean(a.slice(1).join(' ')).slice(0, 28);
    const o = O(k);
    if (!(i >= 1 && i <= o.ranks.length) || !n) return p.outputChatBox('!{#ffcc66}/orank [номер 1-' + o.ranks.length + '] [название] · сейчас: ' + o.ranks.map(function (r, j) { return (j + 1) + '.' + r; }).join(' '));
    o.ranks[i - 1] = n; mark();
    notify(p, 'ok', 'Ранг ' + i + ' теперь «' + n + '»');
});
/* общак */
mp.events.addCommand('obank', function (p, full) {
    const k = org(p);
    if (!k) return;
    const a = String(full || '').trim().split(/\s+/), sum = Math.floor(Number(a[1]));
    const o = O(k);
    if (a[0] === 'put' && sum > 0) {
        if (!pay(p, sum)) return notify(p, 'error', 'Не хватает денег');
        o.bank += sum; mark(); olog(k, nick(p) + ' положил в общак ' + money(sum));
        return notify(p, 'ok', 'В общак: +' + money(sum));
    }
    if (a[0] === 'take' && sum > 0) {
        if (!isLeader(p)) return notify(p, 'warn', 'Брать из общака может только лидер');
        if (o.bank < sum) return notify(p, 'error', 'В общаке только ' + money(o.bank));
        o.bank -= sum; M().add(p, sum); mark(); olog(k, nick(p) + ' взял из общака ' + money(sum));
        return notify(p, 'ok', 'Из общака: ' + money(sum));
    }
    p.outputChatBox('!{#ffcc66}Общак: ' + money(o.bank) + ' · /obank put [сумма] · /obank take [сумма] (лидер)');
});
/* рации */
function toOrg(k, line) { mp.players.forEach(function (x) { if (x.account && org(x) === k) x.outputChatBox(line); }); }
mp.events.addCommand('f', function (p, full) {
    const k = org(p);
    if (!k) return notify(p, 'warn', 'Вы не в банде / мафии');
    const t = clean(full);
    if (!t) return p.outputChatBox('!{#ffcc66}/f [текст] — рация организации · /fb — нон-РП');
    toOrg(k, '!{' + ORGS[k].c + '}[' + ORGS[k].n + '] ' + (isLeader(p) ? O(k).ranks[O(k).ranks.length - 1] : rankName(k, rank(p))) + ' ' + nick(p) + ': !{#ffffff}' + t);
});
mp.events.addCommand('fb', function (p, full) {
    const k = org(p); const t = clean(full);
    if (!k || !t) return;
    toOrg(k, '!{' + ORGS[k].c + '}[' + ORGS[k].n + '] !{#9a9aa8}(( ' + nick(p) + ' [' + p.id + ']: ' + t + ' ))');
});

/* ======================= ТЕРРИТОРИИ ======================= */
const GRID = { x0: -300, y0: -2200, size: 100, cols: 18, rows: 9 };
const LET = 'ABCDEFGHIJKLMNOPQRS';
const ZONES_DEF = [];
for (let r = 0; r < GRID.rows; r++) for (let c = 0; c < GRID.cols; c++) {
    const x = GRID.x0 + c * GRID.size + GRID.size / 2, y = GRID.y0 + (GRID.rows - 1 - r) * GRID.size + GRID.size / 2;
    ZONES_DEF.push(['Квадрат ' + LET[r] + (c + 1), x, y]);
}
const ZONE_R = GRID.size / 2;
const BASE_SIZE = 60;
const CAP_SEC = 300;
const CAP_COOLDOWN = 3600000;
const ZONE_INCOME = 60;
const CAP_HOURS = [14, 23];
function inSq(pos, x, y, half) { return Math.abs(pos.x - x) <= half && Math.abs(pos.y - y) <= half; }
function home(k) { const o = O(k); const h = o.home || ORGS[k].home; return { x: h[0], y: h[1], z: h[2], h: h[3] || 0 }; }
function baseOf(i) {
    const z = ZONES_DEF[i];
    return Object.keys(ORGS).find(function (k) { return ORGS[k].t === 'gang' && inSq(home(k), z[1], z[2], ZONE_R); }) || null;
}
function zoneList() {
    if (S.gridV !== 2) { S.zones = {}; S.gridV = 2; }
    return ZONES_DEF.map(function (z, i) {
        const base = baseOf(i);
        let s = S.zones[i];
        if (!s) {
            let own = null;
            Object.keys(ORGS).forEach(function (k) { const h = home(k); if (ORGS[k].t === 'gang' && Math.abs(h.x - z[1]) < GRID.size * 1.6 && Math.abs(h.y - z[2]) < GRID.size * 1.6 && !own) own = k; });
            s = S.zones[i] = { o: own, cd: 0 };
            mark();
        }
        if (base) s.o = base;
        return { i: i, n: z[0], x: z[1], y: z[2], o: s.o, cd: s.cd || 0, base: base };
    });
}
function zoneAt(pos) { return zoneList().find(function (z) { return inSq(pos, z.x, z.y, ZONE_R); }) || null; }
function sendZones(p) {
    const w = S.wars.map(function (x) { return { z: x.z, a: x.a, d: x.d, end: x.end }; });
    const bases = Object.keys(ORGS).map(function (k) { const h = home(k), g = garage(k); return [k, ORGS[k].n, h.x, h.y, ORGS[k].bc, ORGS[k].c, g.x, g.y, g.z]; });
    p.call('crime:zones', [JSON.stringify({ s: GRID.size, bs: BASE_SIZE, z: zoneList().map(function (z) { return [z.i, z.n, z.x, z.y, z.o ? ORGS[z.o].bc : 0, z.o ? ORGS[z.o].n : 'ничья', z.base ? 1 : 0]; }), w: w, b: bases, me: org(p) })]);
}
function zonesAll() { mp.players.forEach(sendZones); }
function capHour() { const h = new Date(Date.now() + 3 * 3600000).getUTCHours(); return h >= CAP_HOURS[0] && h < CAP_HOURS[1]; }
mp.events.addCommand('capture', function (p) {
    const k = org(p);
    if (!k || ORGS[k].t !== 'gang') return notify(p, 'warn', 'Захватывать территории могут только банды');
    if (rank(p) < 4 && !mgr(p)) return notify(p, 'warn', 'Начать захват может «' + rankName(k, 4) + '» и выше');
    if (!capHour() && admLvl(p) < 6) return notify(p, 'warn', 'Захваты разрешены с ' + CAP_HOURS[0] + ':00 до ' + CAP_HOURS[1] + ':00 по МСК');
    const z = zoneAt(p.position);
    if (!z) return notify(p, 'warn', 'Вы не на территории района');
    if (z.o === k) return notify(p, 'warn', 'Это уже ваш квадрат');
    if (z.base) return notify(p, 'warn', 'Это база ' + ORGS[z.base].n + ' — её захватить нельзя');
    if (S.wars.some(function (w) { return w.z === z.i || w.a === k; })) return notify(p, 'warn', 'Здесь уже идёт война или ваша банда воюет в другом районе');
    if (Date.now() < z.cd) return notify(p, 'warn', 'Район недавно захватывали. Ещё ' + Math.ceil((z.cd - Date.now()) / 60000) + ' мин');
    const mine = mp.players.toArray().filter(function (x) { return org(x) === k && inSq(x.position, z.x, z.y, ZONE_R); }).length;
    if (mine < 3 && admLvl(p) < 6) return notify(p, 'warn', 'Для захвата нужно минимум 3 бойца на территории (сейчас ' + mine + ')');
    const w = { z: z.i, a: k, d: z.o, start: Date.now(), end: Date.now() + CAP_SEC * 1000, kills: {} };
    w.kills[k] = 0; if (z.o) w.kills[z.o] = 0;
    S.wars.push(w); mark();
    mp.players.forEach(function (x) {
        if (!x.account) return;
        const ok = org(x);
        if (ok === k || ok === z.o) x.outputChatBox('!{#ff5555}[ВОЙНА] !{#ffffff}' + ORGS[k].n + ' начали захват района ' + z.n + (z.o ? ' у ' + ORGS[z.o].n : '') + '! 5 минут. Метка на карте');
        if (ok === k || ok === z.o) x.call('phone:gps', [z.x, z.y, 'Война: ' + z.n]);
    });
    zonesAll();
});
mp.events.add('playerDeath', function (p, reason, killer) {
    if (S.addict[sid(p)]) { S.addict[sid(p)].high = 0; }
    if (!killer || !killer.account || killer === p) return;
    const kk = org(killer), pk = org(p);
    S.wars.forEach(function (w) {
        const z = ZONES_DEF[w.z];
        if (!inSq(p.position, z[1], z[2], ZONE_R + 30)) return;
        if ((kk === w.a || kk === w.d) && (pk === w.a || pk === w.d) && kk !== pk) { w.kills[kk] = (w.kills[kk] || 0) + 1; mark(); }
    });
});
setInterval(function () {
    const now = Date.now();
    S.wars = S.wars.filter(function (w) {
        const z = ZONES_DEF[w.z];
        const inA = mp.players.toArray().filter(function (x) { return org(x) === w.a && inSq(x.position, z[1], z[2], ZONE_R); }).length;
        const inD = w.d ? mp.players.toArray().filter(function (x) { return org(x) === w.d && inSq(x.position, z[1], z[2], ZONE_R); }).length : 0;
        mp.players.forEach(function (x) { const o = org(x); if (o === w.a || o === w.d) x.call('crime:war', [JSON.stringify({ n: z[0], a: ORGS[w.a].n, d: w.d ? ORGS[w.d].n : 'никто', ka: w.kills[w.a] || 0, kd: w.d ? w.kills[w.d] || 0 : 0, ia: inA, id: inD, left: Math.max(0, Math.ceil((w.end - now) / 1000)) })]); });
        if (now < w.end) return true;
        const sa = (w.kills[w.a] || 0) * 2 + inA, sd = w.d ? (w.kills[w.d] || 0) * 2 + inD : 0;
        const win = sa > sd ? w.a : (w.d || w.a);
        S.zones[w.z] = { o: win, cd: now + CAP_COOLDOWN };
        mp.players.forEach(function (x) {
            const o = org(x);
            if (o === w.a || o === w.d) { x.outputChatBox('!{#ffd24d}[ВОЙНА] !{#ffffff}Район ' + z[0] + ' остаётся за ' + ORGS[win].n + ' (' + sa + ' : ' + sd + ')'); x.call('crime:war', ['']); }
        });
        olog(win, 'Район ' + z[0] + (win === w.a ? ' захвачен' : ' удержан'));
        setTimeout(zonesAll, 200);
        return false;
    });
    mark();
}, 3000);
/* доход с районов раз в час */
setInterval(function () {
    const cnt = {};
    zoneList().forEach(function (z) { if (z.o) cnt[z.o] = (cnt[z.o] || 0) + 1; });
    Object.keys(cnt).forEach(function (k) { const sum = cnt[k] * ZONE_INCOME; O(k).bank += sum; olog(k, 'Доход с районов (' + cnt[k] + '): +' + money(sum)); toOrg(k, '!{' + ORGS[k].c + '}[' + ORGS[k].n + '] !{#ffffff}Доход с ' + cnt[k] + ' квадратов: +' + money(sum) + ' в общак'); });
    mark();
}, 3600000);
mp.events.addCommand('zones', function (p) {
    const cnt = {};
    zoneList().forEach(function (z) { if (z.o) cnt[z.o] = (cnt[z.o] || 0) + 1; });
    p.outputChatBox('!{#ffd24d}=== Территории банд ===');
    Object.keys(ORGS).filter(function (k) { return ORGS[k].t === 'gang'; }).forEach(function (k) { p.outputChatBox('!{' + ORGS[k].c + '}' + ORGS[k].n + ' !{#ffffff}— квадратов: ' + (cnt[k] || 0)); });
    const z = zoneAt(p.position);
    if (z) p.outputChatBox('!{#cccccc}Вы в: ' + z.n + ', владелец: ' + (z.o ? ORGS[z.o].n : 'никто') + (z.base ? ' (база)' : ''));
    sendZones(p);
});

/* ======================= БАЗЫ, СПАВН И ГАРАЖ ======================= */
function garage(k) { const o = O(k); if (o.garage) return { x: o.garage[0], y: o.garage[1], z: o.garage[2] }; const h = home(k); return { x: h.x + 4, y: h.y + 4, z: h.z }; }
function carSpots(k) {
    const o = O(k);
    if (o.spots && o.spots.length) return o.spots;
    const g = garage(k), h = home(k), rad = (h.h + 90) * Math.PI / 180, out = [];
    for (let i = 0; i < 4; i++) out.push([g.x + Math.cos(rad) * (6 + i * 4), g.y + Math.sin(rad) * (6 + i * 4), g.z, h.h]);
    return out;
}
const orgCars = {};
function orgHome(p) {
    const k = org(p);
    if (!k) return null;
    const h = home(k);
    return { x: h.x, y: h.y, z: h.z, h: h.h, n: ORGS[k].n, d: ORGS[k].t === 'gang' ? 'База банды' : 'Резиденция мафии', dim: 0 };
}
function garageOpen(p) {
    const k = org(p), r = rank(p), mine = orgCars[sid(p)];
    p.call('crime:garage', [JSON.stringify({ org: ORGS[k].n, c: ORGS[k].c, out: mine && mp.vehicles.exists(mine) ? mine.getVariable('orgModel') : null,
        list: ORGS[k].cars.map(function (c) { return { m: c[0], r: c[1], rn: rankName(k, c[1]), ok: r >= c[1] }; }) })]);
}
mp.events.add('srv:crime:garage', function (p) {
    const k = org(p);
    if (!k) return;
    const g = garage(k);
    if (dist2(p.position, g.x, g.y) > 4) return;
    garageOpen(p);
});
mp.events.add('srv:crime:car', function (p, m) {
    const k = org(p);
    if (!k) return;
    const g = garage(k), s = sid(p);
    if (dist2(p.position, g.x, g.y) > 4) return;
    if (m === '__back') {
        const v = orgCars[s];
        if (v && mp.vehicles.exists(v)) { if (v.position.subtract(p.position).length() > 40) return notify(p, 'warn', 'Пригоните машину к гаражу'); v.destroy(); }
        delete orgCars[s];
        notify(p, 'ok', 'Машина возвращена в гараж');
        return garageOpen(p);
    }
    const c = ORGS[k].cars.find(function (z) { return z[0] === m; });
    if (!c) return;
    if (rank(p) < c[1]) return notify(p, 'warn', 'Доступно с ранга «' + rankName(k, c[1]) + '»');
    if (orgCars[s] && mp.vehicles.exists(orgCars[s])) return notify(p, 'warn', 'Сначала верните прошлую машину');
    const sp = carSpots(k).find(function (z) { return !mp.vehicles.toArray().some(function (v) { return v.dimension === 0 && Math.hypot(v.position.x - z[0], v.position.y - z[1]) < 3; }); });
    if (!sp) return notify(p, 'warn', 'Все места на парковке заняты');
    const v = mp.vehicles.new(mp.joaat(m), new mp.Vector3(sp[0], sp[1], sp[2] + 0.3), { heading: sp[3] || 0, numberPlate: k.slice(0, 4).toUpperCase() + String(s).padStart(4, '0'), dimension: 0 });
    const rgb = ORGS[k].rgb;
    try { v.setColorRGB(rgb[0], rgb[1], rgb[2], rgb[0], rgb[1], rgb[2]); } catch (e) {}
    v.setVariable('org', k); v.setVariable('orgModel', m); v.setVariable('orgOwner', s);
    v.adminSpawned = false;
    orgCars[s] = v;
    p.call('house:menuClose');
    p.call('crime:close');
    p.call('phone:gps', [sp[0], sp[1], 'Машина ' + ORGS[k].n]);
    notify(p, 'ok', 'Машина ждёт на парковке базы');
});
mp.events.add('playerEnterVehicle', function (p, v, seat) {
    const k = v.getVariable('org');
    if (!k || (seat !== 0 && seat !== -1)) return;
    if (org(p) !== k && admLvl(p) < 1) { try { p.removeFromVehicle(); } catch (e) {} notify(p, 'error', 'Это машина ' + ORGS[k].n); }
});
mp.events.add('playerQuit', function (p) {
    const v = orgCars[sid(p)];
    if (v && mp.vehicles.exists(v)) setTimeout(function () { if (mp.vehicles.exists(v) && !(v.getOccupants && v.getOccupants().length)) v.destroy(); }, 60000);
});
mp.events.addCommand('orgpoint', function (p, full) {
    if (admLvl(p) < 7) return;
    const a = String(full || '').trim().split(/\s+/), k = a[0], t = a[1];
    if (!ORGS[k] || ['home', 'garage', 'car', 'clearcars', 'stash', 'green'].indexOf(t) < 0) return p.outputChatBox('!{#ffcc66}/orgpoint [' + Object.keys(ORGS).join('/') + '] [home|garage|car|clearcars|stash|green] — встаньте на место');
    const o = O(k), pos = [p.position.x, p.position.y, p.position.z, p.heading || 0];
    if (t === 'home') o.home = pos;
    else if (t === 'garage') o.garage = pos;
    else if (t === 'stash') o.stash = pos;
    else if (t === 'green') o.green = pos;
    else if (t === 'car') { if (p.vehicle) pos[3] = p.vehicle.heading; (o.spots = o.spots || []).push(pos); }
    else o.spots = [];
    mark(); zonesAll(); mp.players.forEach(function (x) { if (org(x) === k) pointsSend(x); });
    p.outputChatBox('!{#8fd14f}' + ORGS[k].n + ': ' + t + ' сохранено' + (t === 'car' ? ' (мест: ' + o.spots.length + ')' : ''));
});

/* ======================= ОБЩАК-СКЛАД ======================= */
const STASH_KEYS = ['ukrop_seed', 'ukrop', 'ukrop_pack', 'i_pistol', 'i_smg', 'i_rifle', 'i_armour', 'ammo_pistol', 'ammo_smg', 'ammo_rifle', 'medkit', 'bandage', 'armour', 'lockpick'];
function stashPos(k) { const o = O(k); if (o.stash) return { x: o.stash[0], y: o.stash[1], z: o.stash[2] }; const h = home(k); return { x: h.x - 4, y: h.y - 3, z: h.z }; }
function stashOf(k) { const o = O(k); if (!o.items) o.items = {}; return o.items; }
function stashOpen(p) {
    const k = org(p), st = stashOf(k), inv = U().invScan(p), o = O(k);
    p.call('crime:stash', [JSON.stringify({ org: ORGS[k].n, c: ORGS[k].c, bank: o.bank, lead: isLeader(p), canTake: rank(p) >= (o.stashRank || 3) || mgr(p), need: rankName(k, o.stashRank || 3),
        st: STASH_KEYS.filter(function (x) { return st[x] > 0; }).map(function (x) { return { k: x, n: U().ITEMS[x].n, i: U().ITEMS[x].i, c: st[x] }; }),
        inv: STASH_KEYS.filter(function (x) { return inv[x] > 0; }).map(function (x) { return { k: x, n: U().ITEMS[x].n, i: U().ITEMS[x].i, c: inv[x] }; }),
        log: o.log.slice(0, 12) })]);
}
function nearStash(p) { const k = org(p); if (!k) return false; const s = stashPos(k); return dist2(p.position, s.x, s.y) < 4 && Math.abs(p.position.z - s.z) < 4; }
mp.events.add('srv:crime:stash', function (p) { if (nearStash(p)) stashOpen(p); });
mp.events.add('srv:crime:stashOp', function (p, op, key, n) {
    if (!nearStash(p)) return;
    const k = org(p), st = stashOf(k), o = O(k);
    n = Math.max(1, Math.floor(Number(n) || 1));
    if (op === 'put' && STASH_KEYS.indexOf(key) >= 0) {
        const got = U().takeItems(p, key, n);
        if (!got) return notify(p, 'warn', 'Нет в инвентаре');
        st[key] = (st[key] || 0) + got; mark();
        olog(k, nick(p) + ' положил в общак: ' + U().ITEMS[key].n + ' x' + got);
    } else if (op === 'take' && STASH_KEYS.indexOf(key) >= 0) {
        if (!(rank(p) >= (o.stashRank || 3) || mgr(p))) return notify(p, 'warn', 'Брать из общака можно с ранга «' + rankName(k, o.stashRank || 3) + '»');
        const c = Math.min(n, st[key] || 0);
        if (!c) return;
        const left = U().addItem(p, key, c);
        const took = c - (left || 0);
        if (!took) return notify(p, 'error', 'Инвентарь заполнен');
        st[key] -= took; if (st[key] <= 0) delete st[key]; mark(); U().sendInv(p);
        olog(k, nick(p) + ' взял из общака: ' + U().ITEMS[key].n + ' x' + took);
    } else if (op === 'cashIn') {
        if (!pay(p, n)) return notify(p, 'error', 'Не хватает денег');
        o.bank += n; mark(); olog(k, nick(p) + ' положил в общак ' + money(n));
    } else if (op === 'cashOut') {
        if (!isLeader(p)) return notify(p, 'warn', 'Деньги из общака берёт только лидер');
        if (o.bank < n) return notify(p, 'error', 'В общаке только ' + money(o.bank));
        o.bank -= n; M().add(p, n); mark(); olog(k, nick(p) + ' взял из общака ' + money(n));
    } else if (op === 'rank') {
        if (!isLeader(p)) return;
        o.stashRank = Math.max(1, Math.min(o.ranks.length, n)); mark();
        notify(p, 'ok', 'Брать из общака можно с ранга «' + rankName(k, o.stashRank) + '»');
    } else return;
    stashOpen(p);
});

/* ======================= ТЕПЛИЦЫ МАФИЙ ======================= */
const POTS = 8;
const GROW_MIN = 40;
const WATER_MIN = 15;
const POT_YIELD = [4, 7];
const SEED_PRICE = 120;
function greenPos(k) { const o = O(k); if (o.green) return { x: o.green[0], y: o.green[1], z: o.green[2], h: o.green[3] || 0 }; const h = home(k); return { x: h.x + 8, y: h.y - 8, z: h.z, h: h.h }; }
function potsOf(k) {
    const o = O(k);
    if (!o.pots || o.pots.length !== POTS) o.pots = new Array(POTS).fill(null);
    return o.pots;
}
function potState(x) {
    if (!x) return { s: 'empty' };
    const now = Date.now();
    const dry = now - x.w > WATER_MIN * 60000;
    let grow = x.g + (dry ? (x.w + WATER_MIN * 60000 - x.lu) : (now - x.lu));
    if (grow < x.g) grow = x.g;
    const pct = Math.min(100, Math.floor(grow / (GROW_MIN * 60000) * 100));
    return { s: pct >= 100 ? 'ripe' : dry ? 'dry' : 'grow', pct: pct, wl: Math.max(0, Math.ceil((x.w + WATER_MIN * 60000 - now) / 60000)) };
}
function potTick(x) {
    if (!x) return;
    const now = Date.now(), wEnd = x.w + WATER_MIN * 60000;
    const until = Math.min(now, wEnd);
    if (until > x.lu) x.g += until - x.lu;
    x.lu = now;
}
function nearGreen(p) { const k = org(p); if (!k || ORGS[k].t !== 'mafia') return false; const g = greenPos(k); return dist2(p.position, g.x, g.y) < 6 && Math.abs(p.position.z - g.z) < 4; }
function greenOpen(p) {
    const k = org(p), pots = potsOf(k);
    pots.forEach(potTick); mark();
    p.call('crime:green', [JSON.stringify({ org: ORGS[k].n, c: ORGS[k].c, seeds: (U().invScan(p).ukrop_seed || 0), price: SEED_PRICE, grow: GROW_MIN, water: WATER_MIN,
        pots: pots.map(function (x, i) { const st = potState(x); return { i: i, s: st.s, pct: st.pct || 0, wl: st.wl || 0, by: x ? x.by : '' }; }) })]);
}
mp.events.add('srv:crime:green', function (p) { if (nearGreen(p)) greenOpen(p); });
mp.events.add('srv:crime:pot', function (p, op, i) {
    if (!nearGreen(p)) return;
    const k = org(p), pots = potsOf(k);
    i = Math.floor(Number(i));
    if (op === 'seeds') {
        const n = Math.max(1, Math.min(50, i || 1)), cost = n * SEED_PRICE;
        if (!pay(p, cost)) return notify(p, 'error', 'Не хватает: ' + money(cost));
        U().addItem(p, 'ukrop_seed', n); U().sendInv(p);
        olog(k, nick(p) + ' купил семена x' + n);
        return greenOpen(p);
    }
    if (!(i >= 0 && i < POTS)) return;
    const x = pots[i];
    potTick(x);
    if (op === 'plant') {
        if (x) return;
        if (!U().takeItems(p, 'ukrop_seed', 1)) return notify(p, 'warn', 'Нужны семена укропа');
        pots[i] = { g: 0, w: Date.now(), lu: Date.now(), by: nick(p) };
        notify(p, 'ok', 'Посажено. Поливайте каждые ' + WATER_MIN + ' мин');
    } else if (op === 'water') {
        if (!x) return;
        x.w = Date.now(); x.lu = Date.now();
        notify(p, 'ok', 'Полито');
    } else if (op === 'harvest') {
        if (!x || potState(x).s !== 'ripe') return;
        const n = POT_YIELD[0] + Math.floor(Math.random() * (POT_YIELD[1] - POT_YIELD[0] + 1));
        const left = U().addItem(p, 'ukrop', n);
        if (left >= n) return notify(p, 'error', 'Инвентарь заполнен');
        pots[i] = null; U().sendInv(p);
        olog(k, nick(p) + ' собрал урожай: укроп x' + (n - (left || 0)));
        notify(p, 'ok', 'Урожай: укроп x' + (n - (left || 0)));
    } else return;
    mark(); greenOpen(p);
});

/* ======================= СКУПЩИК (нейтральная территория) ======================= */
const BUYER_DEF = { x: 1240.0, y: -3175.0, z: 7.1, h: 270 };
const NEUTRAL_R = 70;
const BUY_PRICE = { ukrop: 85, ukrop_pack: 550 };
function buyer() { return S.buyer || BUYER_DEF; }
if (!S.demand) S.demand = 1;
setInterval(function () { S.demand = Math.min(1.2, S.demand + 0.05); mark(); }, 600000);
let buyerPed = null;
function spawnBuyer() {
    try { if (buyerPed && mp.peds.exists(buyerPed)) buyerPed.destroy(); } catch (e) {}
    const b = buyer();
    try { buyerPed = mp.peds.new(mp.joaat('s_m_y_dealer_01'), new mp.Vector3(b.x, b.y, b.z), { dynamic: false, frozen: true, invincible: true, heading: b.h || 0, dimension: 0 }); } catch (e) { buyerPed = null; }
}
setTimeout(spawnBuyer, 3500);
function inNeutral(pos) { const b = buyer(); return dist2(pos, b.x, b.y) < NEUTRAL_R; }
function nearBuyer(p) { const b = buyer(); return dist2(p.position, b.x, b.y) < 4; }
function buyerOpen(p) {
    const inv = U().invScan(p);
    p.call('crime:buyer', [JSON.stringify({ demand: Math.round(S.demand * 100),
        list: Object.keys(BUY_PRICE).map(function (k) { return { k: k, n: U().ITEMS[k].n, i: U().ITEMS[k].i, have: inv[k] || 0, p: Math.floor(BUY_PRICE[k] * S.demand) }; }) })]);
}
mp.events.add('srv:crime:buyer', function (p) {
    if (!nearBuyer(p)) return;
    if (!org(p)) return notify(p, 'warn', 'Скупщик: «С незнакомыми дел не веду»');
    buyerOpen(p);
});
mp.events.add('srv:crime:sell', function (p, key, n) {
    const k = org(p);
    if (!k || !nearBuyer(p) || !BUY_PRICE[key]) return;
    n = Math.max(1, Math.floor(Number(n) || 1));
    const got = U().takeItems(p, key, n);
    if (!got) return notify(p, 'warn', 'Нечего продавать');
    const unit = Math.floor(BUY_PRICE[key] * S.demand);
    const sum = unit * got;
    const cut = ORGS[k].t === 'mafia' ? Math.floor(sum * 0.1) : 0;
    M().add(p, sum - cut);
    if (cut) O(k).bank += cut;
    const units = got * (key === 'ukrop_pack' ? 10 : 1);
    S.demand = Math.max(0.5, S.demand - units * 0.002);
    mark(); olog(k, nick(p) + ' продал скупщику ' + U().ITEMS[key].n + ' x' + got + ' за ' + money(sum));
    notify(p, 'ok', 'Продано x' + got + ': +' + money(sum - cut) + (cut ? ' (10% — в общак: ' + money(cut) + ')' : ''));
    buyerOpen(p);
});
mp.events.add('playerDeath', function (p, reason, killer) {
    if (!killer || !killer.account || killer === p || !inNeutral(p.position)) return;
    if (!org(killer)) return;
    const W = global.WantedSystem;
    if (W && W.add) W.add(killer, 2, 'Убийство на нейтральной территории', 'Система');
    notify(killer, 'error', 'Нейтральная территория! Скупщик запомнил вас: +2★');
});
setInterval(function () {
    mp.players.forEach(function (p) {
        if (!p.account) return;
        const n = inNeutral(p.position);
        if (n !== !!p.inNeutral) { p.inNeutral = n; notify(p, n ? 'ok' : 'warn', n ? 'Нейтральная территория скупщика — оружие убрано, разборки запрещены' : 'Вы покинули нейтральную территорию'); p.call('crime:neutral', [n ? 1 : 0]); }
    });
}, 2000);

function pointsSend(p) {
    const k = org(p), b = buyer();
    const d = { buyer: [b.x, b.y, b.z], nr: NEUTRAL_R };
    if (k) { const s = stashPos(k); d.stash = [s.x, s.y, s.z]; d.c = ORGS[k].c; if (ORGS[k].t === 'mafia') { const g = greenPos(k); d.green = [g.x, g.y, g.z]; } }
    p.call('crime:points', [JSON.stringify(d)]);
}
setInterval(function () { mp.players.forEach(function (p) { if (p.account && p.ptOrg !== org(p)) { p.ptOrg = org(p); pointsSend(p); } }); }, 3000);

/* ======================= УКРОП ======================= */
const DEALER_DEF = { x: -1570.0, y: 4470.0, z: 20.0, h: 90 };
const PRICE = { ukrop_pack: { mafia: 600, gang: 900 } };
const STOCK_MAX = 400;
function dealer() { return S.dealer || DEALER_DEF; }
if (S.stock === undefined) S.stock = 120;
setInterval(function () { S.stock = Math.min(STOCK_MAX, S.stock + 20); mark(); }, 1800000);
let dealerPed = null;
function spawnDealer() {
    try { if (dealerPed && mp.peds.exists(dealerPed)) dealerPed.destroy(); } catch (e) {}
    const d = dealer();
    try { dealerPed = mp.peds.new(mp.joaat('g_m_m_armboss_01'), new mp.Vector3(d.x, d.y, d.z), { dynamic: false, frozen: true, invincible: true, heading: d.h || 0, dimension: 0 }); } catch (e) { dealerPed = null; }
}
setTimeout(spawnDealer, 3000);
function dealerSend(p) { const d = dealer(); p.call('crime:dealer', [d.x, d.y, d.z, org(p) ? 1 : 0]); }
mp.events.add('srv:crime:dealer', function (p) {
    const d = dealer(), k = org(p);
    if (dist2(p.position, d.x, d.y) > 4) return;
    if (!k) return notify(p, 'warn', 'Человек смотрит на вас с подозрением: «Я тебя не знаю. Проваливай»');
    const t = ORGS[k].t;
    p.call('crime:shop', [JSON.stringify({ org: ORGS[k].n, type: t, stock: S.stock, price: PRICE.ukrop_pack[t], ill: [
        { k: 'i_pistol', n: 'Пистолет (без номера)', p: 9000, need: 'mafia' }, { k: 'i_smg', n: 'Micro SMG (без номера)', p: 18000, need: 'mafia' },
        { k: 'i_armour', n: 'Бронежилет', p: 2200, need: '' }, { k: 'ammo_pistol', n: 'Патроны 9 мм x30', p: 450, need: '', pack: 30 }, { k: 'ammo_smg', n: 'Патроны SMG x30', p: 520, need: '', pack: 30 }
    ] })]);
});
mp.events.add('srv:crime:buy', function (p, key, qty) {
    const d = dealer(), k = org(p);
    if (!k || dist2(p.position, d.x, d.y) > 4) return;
    const t = ORGS[k].t;
    qty = Math.max(1, Math.min(20, Math.floor(Number(qty) || 1)));
    if (key === 'ukrop_pack') {
        if (S.stock < qty) return notify(p, 'error', 'У поставщика осталось только ' + S.stock + ' пакетов');
        const cost = PRICE.ukrop_pack[t] * qty;
        if (!pay(p, cost)) return notify(p, 'error', 'Не хватает: ' + money(cost));
        S.stock -= qty;
        U().addItem(p, 'ukrop_pack', qty); U().sendInv(p);
        if (t === 'gang') {
            const share = Math.floor(cost * 0.3);
            const mf = Object.keys(ORGS).filter(function (x) { return ORGS[x].t === 'mafia'; });
            mf.forEach(function (x) { O(x).bank += Math.floor(share / mf.length); });
            mf.forEach(function (x) { olog(x, 'Банда ' + ORGS[k].n + ' купила укроп x' + qty + ' — доля общаку'); });
        }
        mark(); olog(k, nick(p) + ' купил укроп x' + qty + ' за ' + money(cost));
        return notify(p, 'ok', 'Куплено: пакет укропа x' + qty + ' за ' + money(cost) + '. Вскрыть — использовать в инвентаре');
    }
    const ILL = { i_pistol: [9000, 'mafia', 1], i_smg: [18000, 'mafia', 1], i_armour: [2200, '', 1], ammo_pistol: [450, '', 30], ammo_smg: [520, '', 30] };
    const it = ILL[key];
    if (!it) return;
    if (it[1] && t !== it[1]) return notify(p, 'warn', 'Это только для мафии');
    const cost = it[0] * qty;
    if (!pay(p, cost)) return notify(p, 'error', 'Не хватает: ' + money(cost));
    U().addItem(p, key, it[2] * qty); U().sendInv(p);
    olog(k, nick(p) + ' купил ' + key + ' x' + qty);
    notify(p, 'ok', 'Сделка совершена: −' + money(cost));
});
mp.events.addCommand('buyerpos', function (p) {
    if (admLvl(p) < 7) return;
    S.buyer = { x: p.position.x, y: p.position.y, z: p.position.z, h: p.heading || 0 }; mark();
    spawnBuyer(); mp.players.forEach(pointsSend);
    p.outputChatBox('!{#8fd14f}Скупщик и нейтральная территория перенесены сюда');
});
mp.events.addCommand('dealerpos', function (p) {
    if (admLvl(p) < 7) return;
    S.dealer = { x: p.position.x, y: p.position.y, z: p.position.z, h: p.heading || 0 }; mark();
    spawnDealer(); mp.players.forEach(dealerSend);
    p.outputChatBox('!{#8fd14f}Поставщик укропа перенесён сюда');
});

/* ---- зависимость ---- */
function A(p) { const id = sid(p); if (!S.addict[id]) S.addict[id] = { lv: 0, last: 0, high: 0, wd: 0 }; return S.addict[id]; }
function addictSync(p) { const a = A(p); p.call('crime:addict', [Math.round(a.lv), a.high > Date.now() ? 1 : 0, a.wd ? 1 : 0]); }
function useDrug(p) {
    const a = A(p);
    if (Date.now() - a.last < 20000) { notify(p, 'warn', 'Слишком часто — организм не выдержит'); return false; }
    const was = a.wd;
    a.last = Date.now();
    a.lv = Math.min(100, a.lv + 8 + Math.random() * 4);
    a.high = Date.now() + 90000;
    a.wd = 0;
    p.health = Math.min(100, p.health + 35);
    notify(p, was ? 'ok' : 'warn', was ? 'Ломка отпустила… пока что' : 'Вы употребили укроп: +35 HP. Зависимость: ' + Math.round(a.lv) + '%');
    mp.players.forEachInRange(p.position, 10, function (x) { if (x.dimension === p.dimension) x.outputChatBox('!{#c78bff}' + nick(p) + ' что-то быстро сворачивает и затягивается'); });
    mark(); addictSync(p);
    return true;
}
setInterval(function () {
    const now = Date.now();
    mp.players.forEach(function (p) {
        const id = sid(p); if (!id || !S.addict[id]) return;
        const a = S.addict[id];
        if (a.lv <= 0) return;
        const since = (now - a.last) / 60000;
        a.lv = Math.max(0, a.lv - 0.25);
        const need = a.lv >= 70 ? 10 : a.lv >= 40 ? 20 : a.lv >= 15 ? 35 : 0;
        if (need && since > need && a.high < now) {
            if (!a.wd) { a.wd = 1; notify(p, 'error', 'Начинается ломка… Нужен укроп или врач'); }
            const dmg = a.lv >= 70 ? 6 : a.lv >= 40 ? 4 : 2;
            if (p.health > 15) p.health = Math.max(15, p.health - dmg);
        } else if (a.wd && (!need || since <= need)) a.wd = 0;
        addictSync(p);
    });
    mark();
}, 30000);
mp.events.addCommand('addict', function (p) {
    const a = A(p);
    p.outputChatBox('!{#c78bff}Зависимость: ' + Math.round(a.lv) + '%' + (a.wd ? ' · ЛОМКА' : '') + ' · лечение: медик /cure [id] или время (спадает само)');
});
mp.events.addCommand('cure', function (p, full) {
    if (!(p.account && p.account.job === 'medic') && admLvl(p) < 4) return notify(p, 'warn', 'Только для медиков');
    const t = mp.players.at(Number(String(full || '').trim()));
    if (!t || !t.account || t.position.subtract(p.position).length() > 4) return p.outputChatBox('!{#ffcc66}/cure [id] — снять ломку и понизить зависимость (игрок рядом)');
    const a = A(t);
    a.lv = Math.max(0, a.lv - 35); a.wd = 0; a.last = Date.now(); mark(); addictSync(t);
    notify(t, 'ok', 'Врач ' + nick(p) + ' провёл детокс. Зависимость: ' + Math.round(a.lv) + '%');
    notify(p, 'ok', 'Детокс проведён: ' + nick(t));
});
mp.events.add('playerReady', function (p) { setTimeout(function () { if (!mp.players.exists(p)) return; dealerSend(p); sendZones(p); pointsSend(p); if (S.addict[sid(p)]) addictSync(p); }, 5000); });
setTimeout(function () { mp.players.forEach(function (p) { dealerSend(p); sendZones(p); }); }, 4000);

/* ======================= ОБЫСК И ИЗЪЯТИЕ ======================= */
const CONTRA = ['ukrop_seed', 'ukrop', 'ukrop_pack', 'i_pistol', 'i_smg', 'i_rifle', 'i_armour', 'pistol', 'smg', 'rifle', 'ammo_pistol', 'ammo_smg', 'ammo_rifle', 'armour', 'lockpick'];
function hasGunLic(t) { return !!(U() && U().hasDoc && U().hasDoc(t, 'gun')); }
function contraOf(t) {
    const all = U().invScan(t), lic = hasGunLic(t), out = [];
    Object.keys(all).forEach(function (k) {
        if (CONTRA.indexOf(k) < 0) return;
        const it = U().ITEMS[k];
        const legal = !it.ill && lic;
        out.push({ k: k, n: it.n, c: all[k], legal: legal, ill: !!it.ill });
    });
    return out;
}
function search(p, t) {
    if (!isCop(p)) return notify(p, 'warn', 'Обыск — только LSPD, шериф, FIB и армия');
    if (!t || !t.account || t === p || t.position.subtract(p.position).length() > 3) return notify(p, 'warn', 'Подойдите вплотную');
    if (!t.getVariable('cuffed') && !(t.account && t.account.downed) && !t.searchOk) {
        t.searchAsk = { by: sid(p), byId: p.id, at: Date.now() };
        t.call('social:offer', ['Офицер ' + nick(p) + ' требует пройти досмотр. Согласиться?', 20000]);
        return notify(p, 'warn', 'Гражданин не задержан — запрошено согласие. Или наденьте наручники');
    }
    t.searchOk = false;
    const list = contraOf(t);
    mp.players.forEachInRange(p.position, 10, function (x) { if (x.dimension === p.dimension) x.outputChatBox('!{#c78bff}' + nick(p) + ' проводит обыск ' + nick(t)); });
    p.call('crime:search', [JSON.stringify({ id: t.id, n: nick(t), lic: hasGunLic(t), list: list })]);
}
mp.events.add('srv:int:answer', function (t, yes) {
    const a = t.searchAsk;
    if (!a || Date.now() - a.at > 20000) return;
    t.searchAsk = null;
    const p = mp.players.at(a.byId);
    if (!p || sid(p) !== a.by) return;
    if (!yes) { notify(p, 'warn', nick(t) + ' отказался от досмотра — это повод для задержания'); return; }
    t.searchOk = true;
    search(p, t);
});
mp.events.addCommand('search', function (p, full) { search(p, mp.players.at(Number(String(full || '').trim()))); });
mp.events.add('srv:crime:searchReq', function (p, tid) { search(p, mp.players.at(Number(tid))); });
mp.events.add('srv:crime:seize', function (p, tid, json) {
    if (!isCop(p)) return;
    const t = mp.players.at(Number(tid));
    if (!t || !t.account || t.position.subtract(p.position).length() > 4) return notify(p, 'warn', 'Гражданин далеко');
    let keys = []; try { keys = JSON.parse(json) || []; } catch (e) {}
    const list = contraOf(t).filter(function (x) { return keys.indexOf(x.k) >= 0; });
    if (!list.length) return;
    const n = U().govStrip(t, list.map(function (x) { return x.k; }));
    U().sendInv(t);
    const txt = list.map(function (x) { return x.n + ' x' + x.c; }).join(', ');
    const drugs = list.filter(function (x) { return x.k.indexOf('ukrop') === 0; }).reduce(function (s, x) { return s + x.c * (x.k === 'ukrop_pack' ? 10 : 1); }, 0);
    notify(t, 'error', 'Изъято: ' + txt);
    notify(p, 'ok', 'Изъято ' + n + ' ед.: ' + txt);
    mp.players.forEachInRange(p.position, 12, function (x) { if (x.dimension === p.dimension) x.outputChatBox('!{#c78bff}' + nick(p) + ' изымает у ' + nick(t) + ': ' + txt); });
    const G = global.GovFaction;
    if (G && G.flog && p.account) G.flog(p.account.job, nick(p) + ' изъял у ' + nick(t) + ': ' + txt);
    const W = global.WantedSystem;
    if (W && list.some(function (x) { return !x.legal; })) {
        const stars = (drugs >= 10 ? 2 : drugs > 0 ? 1 : 0) + (list.some(function (x) { return x.ill && x.k.indexOf('i_') === 0 && x.k !== 'i_armour'; }) ? 2 : 0);
        if (stars > 0 && W.add) { W.add(t, Math.min(3, stars), 'Хранение запрещённого', nick(p)); notify(p, 'ok', nick(t) + ' получил ' + Math.min(3, stars) + '★ — можно арестовать'); }
    }
});

/* ======================= АДМИН ======================= */
mp.events.addCommand('setorg', async function (p, full) {
    if (admLvl(p) < 5) return;
    const a = String(full || '').trim().split(/\s+/);
    const t = mp.players.at(Number(a[0])), k = a[1], lead = a[2] === 'leader';
    if (!t || !t.account || !(ORGS[k] || k === 'none')) return p.outputChatBox('!{#ffcc66}/setorg [id] [' + Object.keys(ORGS).join('/') + '/none] [leader]');
    if (k === 'none') { await setOrg(t, null, 0, false); return p.outputChatBox('!{#8fd14f}' + nick(t) + ' исключён'); }
    if (lead) {
        const old = (await q('SELECT id FROM accounts WHERE job = ? AND leader = 1 AND id <> ? LIMIT 1', [k, sid(t)]))[0];
        if (old) return p.outputChatBox('!{#ff6b6b}У ' + ORGS[k].n + ' уже есть лидер #' + old.id + '. Снимите: /setorg [id] none');
    }
    await setOrg(t, k, lead ? O(k).ranks.length : 1, lead);
    olog(k, 'Администрация: ' + nick(t) + (lead ? ' — лидер' : ' принят'));
    notify(t, 'ok', (lead ? 'Вы назначены лидером ' : 'Вы приняты в ') + ORGS[k].n);
    p.outputChatBox('!{#8fd14f}' + nick(t) + ' → ' + ORGS[k].n + (lead ? ' (лидер)' : ''));
});
mp.events.addCommand('zoneset', function (p, full) {
    if (admLvl(p) < 6) return;
    const k = String(full || '').trim();
    const z = zoneAt(p.position);
    if (!z || !(ORGS[k] || k === 'none')) return p.outputChatBox('!{#ffcc66}/zoneset [банда|none] — встаньте в квадрате');
    S.zones[z.i] = { o: k === 'none' ? null : k, cd: 0 }; mark(); zonesAll();
    p.outputChatBox('!{#8fd14f}' + z.n + ' → ' + (k === 'none' ? 'никто' : ORGS[k].n));
});

global.CrimeSystem = { inNeutral: inNeutral, home: orgHome, ORGS: ORGS, org: org, useDrug: useDrug, isOrg: function (k) { return !!ORGS[k]; }, O: O, rankName: rankName };
console.log('[crime] банды: ' + Object.keys(ORGS).filter(function (k) { return ORGS[k].t === 'gang'; }).length + ', мафии: ' + Object.keys(ORGS).filter(function (k) { return ORGS[k].t === 'mafia'; }).length + ', районов: ' + ZONES_DEF.length);
