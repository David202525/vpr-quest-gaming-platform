const PRICE = 500;
const EDITOR_PAY = 150;
const AD_COOLDOWN = 3 * 60000;
const NEED = { ad: 1, news: 3, live: 4 };
const COL = '#ff8a4c';

function G() { return global.GovFaction; }
function M() { return global.MoneySystem; }
function notify(p, t, x) { if (typeof global.hudNotify === 'function') global.hudNotify(p, t, x); else p.outputChatBox(x); }
function sid(p) { return p && p.account && p.account.id ? Number(p.account.id) : 0; }
function nick(p) { return String((p.account && p.account.nick) || p.name).replace(/_/g, ' '); }
function clean(t) { return String(t || '').replace(/!\{[^}]*\}/g, '').replace(/[<>]/g, '').trim().slice(0, 160); }
function isNews(p) { return !!(p.account && p.account.job === 'news'); }
function rank(p) { const a = p.account; if (!a) return 0; return Number(a.leader) === 1 ? 99 : Number(a.job_rank) || 0; }
function money(n) { return '$' + String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function muted(p) { const A = global.AdminSystem; return !!(A && A.isMuted && A.isMuted(p)); }
function need(p, k) {
    if (!isNews(p)) { notify(p, 'error', 'Доступно только сотрудникам Weazel News'); return false; }
    if (rank(p) < NEED[k]) { notify(p, 'warn', 'Нужен ' + NEED[k] + ' ранг Weazel News'); return false; }
    return true;
}
function all(line) { mp.players.forEach(function (x) { if (x.account) x.outputChatBox(line); }); }
function staff(line) { mp.players.forEach(function (x) { if (isNews(x)) x.outputChatBox(line); }); }
function find(s) {
    s = String(s || '').trim();
    const n = Number(s);
    if (s && String(n) === s) { const p = mp.players.at(n); return p && mp.players.exists(p) ? p : null; }
    return null;
}
function flog(t) { if (G() && G().flog) try { G().flog('news', t); } catch (e) {} }

/* ===== Объявления от игроков через редакцию ===== */
const ADS = [];
let adN = 0;
const lastAd = {};
mp.events.addCommand('ad', function (p, full) {
    if (!sid(p)) return;
    if (muted(p)) return notify(p, 'error', 'Вы в муте');
    const t = clean(full);
    if (t.length < 5) return p.outputChatBox('!{' + COL + '}/ad [текст] — подать объявление в Weazel News (' + money(PRICE) + '). Пример: /ad Набор в банду Ballas, пишите на номер 555-12');
    if (ADS.some(function (a) { return a.s === sid(p); })) return notify(p, 'warn', 'Ваше объявление уже ждёт проверки редакции');
    if (lastAd[sid(p)] && Date.now() - lastAd[sid(p)] < AD_COOLDOWN) return notify(p, 'warn', 'Следующее объявление через ' + Math.ceil((AD_COOLDOWN - (Date.now() - lastAd[sid(p)])) / 1000) + ' с');
    if (!M() || M().get(p) < PRICE) return notify(p, 'error', 'Нужно ' + money(PRICE) + ' наличными');
    M().add(p, -PRICE);
    lastAd[sid(p)] = Date.now();
    const ad = { n: ++adN, s: sid(p), pid: p.id, name: nick(p), text: t, at: Date.now() };
    ADS.push(ad);
    const on = mp.players.toArray().filter(isNews).length;
    notify(p, 'ok', 'Объявление №' + ad.n + ' отправлено в редакцию (−' + money(PRICE) + ')' + (on ? '' : '. Редакция сейчас не в сети — оно дождётся'));
    staff('!{' + COL + '}[Weazel] Новое объявление №' + ad.n + ' от ' + ad.name + ': !{#ffffff}' + t);
    staff('!{#9a9aa8}/adok ' + ad.n + ' [исправленный текст] — опубликовать · /adno ' + ad.n + ' [причина] — отклонить');
});
mp.events.addCommand('ads', function (p) {
    if (!need(p, 'ad')) return;
    if (!ADS.length) return p.outputChatBox('!{' + COL + '}[Weazel] Очередь объявлений пуста');
    p.outputChatBox('!{' + COL + '}=== Объявления на проверке (' + ADS.length + ') ===');
    ADS.forEach(function (a) { p.outputChatBox('!{#ffffff}№' + a.n + ' ' + a.name + ' (' + Math.round((Date.now() - a.at) / 60000) + ' мин): !{#cccccc}' + a.text); });
});
function takeAd(n) { const i = ADS.findIndex(function (a) { return a.n === Number(n); }); return i < 0 ? null : ADS.splice(i, 1)[0]; }
function author(ad) { return mp.players.toArray().find(function (x) { return sid(x) === ad.s; }) || null; }
mp.events.addCommand('adok', function (p, full) {
    if (!need(p, 'ad')) return;
    const m = String(full || '').trim().match(/^(\d+)\s*(.*)$/);
    if (!m) return notify(p, 'warn', '/adok [№] [текст, если нужно исправить]');
    const ad = takeAd(m[1]);
    if (!ad) return notify(p, 'warn', 'Объявление №' + m[1] + ' не найдено');
    const text = clean(m[2]) || ad.text;
    all('!{' + COL + '}[Объявление] !{#ffffff}' + text);
    all('!{#9a9aa8}   Отправил: ' + ad.name + ' · Редактор: ' + nick(p) + ' · Weazel News');
    if (M()) M().add(p, EDITOR_PAY);
    notify(p, 'ok', 'Опубликовано · вам ' + money(EDITOR_PAY));
    const a = author(ad); if (a) notify(a, 'ok', 'Ваше объявление №' + ad.n + ' опубликовано');
    flog(nick(p) + ' опубликовал объявление №' + ad.n + ' от ' + ad.name);
});
mp.events.addCommand('adno', function (p, full) {
    if (!need(p, 'ad')) return;
    const m = String(full || '').trim().match(/^(\d+)\s*(.*)$/);
    if (!m) return notify(p, 'warn', '/adno [№] [причина]');
    const ad = takeAd(m[1]);
    if (!ad) return notify(p, 'warn', 'Объявление №' + m[1] + ' не найдено');
    const a = author(ad);
    if (a && M()) M().add(a, PRICE);
    if (a) notify(a, 'warn', 'Объявление №' + ad.n + ' отклонено' + (m[2] ? ': ' + clean(m[2]) : '') + '. Деньги возвращены');
    delete lastAd[ad.s];
    notify(p, 'ok', 'Объявление №' + ad.n + ' отклонено');
});
mp.events.add('playerQuit', function (p) {
    const s = sid(p);
    for (let i = ADS.length - 1; i >= 0; i--) if (ADS[i].s === s && M()) { const ad = ADS.splice(i, 1)[0]; if (global.AdminCore && global.AdminCore.q) global.AdminCore.q('UPDATE accounts SET money = money + ? WHERE id = ?', [PRICE, ad.s]); }
});

/* ===== Новости ===== */
const newsAt = {};
mp.events.addCommand('news', function (p, full) {
    if (!need(p, 'news')) return;
    if (muted(p)) return notify(p, 'error', 'Вы в муте');
    const t = clean(full);
    if (!t) return notify(p, 'warn', '/news [текст] — срочная новость штата');
    if (newsAt[sid(p)] && Date.now() - newsAt[sid(p)] < 30000) return notify(p, 'warn', 'Не чаще раза в 30 секунд');
    newsAt[sid(p)] = Date.now();
    all('!{' + COL + '}[Weazel News] !{#ffd36b}' + nick(p) + ': !{#ffffff}' + t);
    flog(nick(p) + ' новость: ' + t.slice(0, 60));
});

/* ===== Прямой эфир ===== */
let LIVE = null;
function onAir(p) { return LIVE && (LIVE.host === p || LIVE.guests.indexOf(p) >= 0); }
mp.events.addCommand('live', function (p, full) {
    if (!need(p, 'live')) return;
    const t = clean(full);
    if (LIVE) {
        if (LIVE.host !== p && rank(p) < 8) return notify(p, 'warn', 'Сейчас идёт эфир ' + nick(LIVE.host) + '. Завершить: /liveend');
        return notify(p, 'warn', 'Эфир уже идёт · /lv [текст] — говорить · /guest [id] — пригласить · /liveend — завершить');
    }
    if (!t) return notify(p, 'warn', '/live [тема эфира] — начать прямой эфир');
    LIVE = { host: p, topic: t, guests: [], at: Date.now() };
    all('!{#ff4f4f}● ПРЯМОЙ ЭФИР !{' + COL + '}Weazel News · ' + t);
    all('!{#9a9aa8}   Ведущий: ' + nick(p));
    notify(p, 'ok', 'Эфир начат · /lv [текст] · /guest [id] · /unguest [id] · /liveend');
    flog(nick(p) + ' начал эфир: ' + t.slice(0, 60));
});
mp.events.addCommand('lv', function (p, full) {
    if (!LIVE) return notify(p, 'warn', 'Сейчас нет прямого эфира');
    if (!onAir(p)) return notify(p, 'warn', 'Вы не в эфире');
    if (muted(p)) return notify(p, 'error', 'Вы в муте');
    const t = clean(full);
    if (!t) return;
    const role = LIVE.host === p ? 'Ведущий' : 'Гость';
    all('!{#ff4f4f}[ПРЯМОЙ ЭФИР] !{' + COL + '}' + role + ' ' + nick(p) + ': !{#ffffff}' + t);
});
mp.events.addCommand('guest', function (p, full) {
    if (!LIVE || LIVE.host !== p) return notify(p, 'warn', 'Приглашать гостей может ведущий эфира');
    const t = find(full);
    if (!t || t === p) return notify(p, 'warn', '/guest [id]');
    if (LIVE.guests.indexOf(t) < 0) LIVE.guests.push(t);
    notify(t, 'ok', 'Вы в прямом эфире Weazel News · говорите: /lv [текст]');
    all('!{#ff4f4f}[ПРЯМОЙ ЭФИР] !{#9a9aa8}В студии гость: ' + nick(t));
});
mp.events.addCommand('unguest', function (p, full) {
    if (!LIVE || LIVE.host !== p) return;
    const t = find(full);
    if (!t) return notify(p, 'warn', '/unguest [id]');
    LIVE.guests = LIVE.guests.filter(function (x) { return x !== t; });
    notify(t, 'warn', 'Вы больше не в эфире');
});
function endLive(by) {
    if (!LIVE) return;
    all('!{#ff4f4f}■ Прямой эфир завершён !{#9a9aa8}· Weazel News · ' + LIVE.topic + (by ? '' : ''));
    LIVE = null;
}
mp.events.addCommand('liveend', function (p) {
    if (!LIVE) return notify(p, 'warn', 'Эфира нет');
    if (LIVE.host !== p && !(isNews(p) && rank(p) >= 8)) return notify(p, 'warn', 'Завершить может ведущий или руководство редакции');
    endLive(p);
});
mp.events.add('playerQuit', function (p) {
    if (!LIVE) return;
    if (LIVE.host === p) endLive();
    else LIVE.guests = LIVE.guests.filter(function (x) { return x !== p; });
});
setInterval(function () { if (LIVE && Date.now() - LIVE.at > 60 * 60000) endLive(); }, 60000);

global.NewsSystem = { ads: function () { return ADS; }, live: function () { return LIVE ? { host: nick(LIVE.host), topic: LIVE.topic } : null; } };
console.log('[news] Weazel News: объявления /ad, новости /news, прямые эфиры /live');
module.exports = global.NewsSystem;
