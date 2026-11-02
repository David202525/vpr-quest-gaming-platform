const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CFG_FILE = path.join(__dirname, 'website_config.json');
const PASS_FILE = path.join(__dirname, 'website_pass.json');
const CFG = Object.assign({ url: '', ip: '', key: '', every: 120 }, (function () { try { return JSON.parse(fs.readFileSync(CFG_FILE, 'utf8')) || {}; } catch (e) { return {}; } })());
if (!fs.existsSync(CFG_FILE)) { try { fs.writeFileSync(CFG_FILE, JSON.stringify(CFG, null, 2)); } catch (e) {} }
const PASS = (function () { try { return JSON.parse(fs.readFileSync(PASS_FILE, 'utf8')) || {}; } catch (e) { return {}; } })();
let passDirty = false;

async function q(sql, args) { const r = await global.db.query(sql, args || []); return Array.isArray(r) && Array.isArray(r[0]) ? r[0] : r; }

function webHash(pass) {
    const salt = crypto.randomBytes(16).toString('hex');
    return 'pbkdf2$' + salt + '$' + crypto.pbkdf2Sync(String(pass), salt, 20000, 32, 'sha256').toString('hex');
}
function remember(p, pass) {
    setTimeout(function () {
        if (!mp.players.exists(p) || !p.account || !p.account.id) return;
        const id = String(p.account.id);
        const old = PASS[id];
        if (old) {
            const s = old.split('$');
            if (s.length === 3 && crypto.pbkdf2Sync(String(pass), s[1], 20000, 32, 'sha256').toString('hex') === s[2]) return;
        }
        PASS[id] = webHash(pass); passDirty = true;
    }, 3000);
}
mp.events.add('auth:login', function (p, login, pass) { if (pass && !p.account) remember(p, pass); });
mp.events.add('auth:register', function (p, login, pass) { if (pass && !p.account) remember(p, pass); });
setInterval(function () { if (passDirty) { passDirty = false; try { fs.writeFileSync(PASS_FILE, JSON.stringify(PASS)); } catch (e) {} } }, 5000);

const FAC = { lspd: 'Полиция (LSPD)', ems: 'Медицинская служба', medic: 'Больница (EMS)', fib: 'FIB', army: 'Армия', gov: 'Правительство', news: 'Weazel News', lic: 'Автошкола', taxi: 'Такси',
    ballas: 'Ballas', families: 'The Families', vagos: 'Los Santos Vagos', marabunta: 'Marabunta Grande', bloods: 'Bloods', lcn: 'La Cosa Nostra', russian: 'Русская мафия', yakuza: 'Yakuza' };

function onlineIds() { const o = {}; mp.players.forEach(function (p) { if (p.account && p.account.id) o[p.account.id] = p; }); return o; }

async function collect() {
    const rows = await q('SELECT id, login, username, nick, gender, money, bank, admin, banned, ban_reason, job, job_rank, leader, deaths, playtime, created_at, last_login FROM accounts');
    const cars = await q('SELECT id, owner_id, model, plate, fuel FROM vehicles').catch(function () { return []; });
    const byOwner = {};
    cars.forEach(function (c) { (byOwner[c.owner_id] = byOwner[c.owner_id] || []).push({ model: c.model, plate: c.plate, fuel: c.fuel }); });
    const on = onlineIds();
    const players = rows.filter(function (r) { return r.id && (r.login || r.username); }).map(function (r) {
        const id = Number(r.id), p = on[id];
        const u = global.UiSystem && global.UiSystem.webData ? global.UiSystem.webData(id) : null;
        const fam = global.FamilySystem && global.FamilySystem.of ? global.FamilySystem.of(id) : null;
        const fm = fam ? fam.members.find(function (m) { return m.id === id; }) : null;
        const houses = global.HouseSystem && global.HouseSystem.allOwned ? global.HouseSystem.allOwned(id) : [];
        const w = global.WantedSystem && global.WantedSystem.info ? global.WantedSystem.info(id) : null;
        let money = Number(r.money) || 0, bank = Number(r.bank) || 0;
        if (p && global.MoneySystem) { money = global.MoneySystem.get(p); bank = global.MoneySystem.bank(p); }
        return {
            id: id, login: String(r.login || r.username).toLowerCase(), nick: r.nick || '', gender: Number(r.gender) ? 'Женский' : 'Мужской',
            money: money, bank: bank, admin: Number(r.admin) || 0, banned: Number(r.banned) ? (r.ban_reason || 'нарушение') : '',
            job: r.job ? (FAC[r.job] || r.job) : '', rank: Number(r.job_rank) || 0, leader: !!Number(r.leader), deaths: Number(r.deaths) || 0,
            playtime: Number(r.playtime) || 0, created: r.created_at ? new Date(r.created_at).toISOString() : '', last: r.last_login ? new Date(r.last_login).toISOString() : '',
            online: !!p, cars: byOwner[id] || [], houses: houses.map(function (h) { return h.n; }),
            family: fam ? { n: fam.n, tag: fam.tag || '', rank: fm && fam.ranks ? fam.ranks[Math.max(1, Math.min(fam.ranks.length, fm.r)) - 1] : '' } : null,
            wanted: w ? { s: w.s, r: w.r } : null,
            lvl: u ? u.lvl : 1, exp: u ? u.exp : 0, need: u ? u.need : 75, phone: u ? u.phone : '', coins: u ? u.coins : 0,
            skills: u ? u.skills : {}, vip: u ? u.vip : null, docs: u ? u.docs : [],
            pass: PASS[String(id)] || ''
        };
    });
    let tokens = [];
    try { if (global.AdminCore && global.AdminCore.webTokens) tokens = await global.AdminCore.webTokens(); } catch (e) {}
    return { t: Date.now(), online: Object.keys(on).length, total: players.length, players: players, tokens: tokens };
}

function post(body, cb) {
    let u; try { u = new URL(CFG.url); } catch (e) { return cb('в website_config.json неверный url'); }
    const mod = require(u.protocol === 'https:' ? 'https' : 'http');
    const data = Buffer.from(JSON.stringify(body));
    const req = mod.request({ hostname: CFG.ip || u.hostname, servername: u.hostname, port: u.port || (u.protocol === 'https:' ? 443 : 80), path: u.pathname + u.search, method: 'POST', timeout: 20000,
        headers: { 'Host': u.host, 'Content-Type': 'application/json', 'Content-Length': data.length, 'X-Amrp-Key': CFG.key, 'User-Agent': 'AMRP-Server' } }, function (res) {
        let s = ''; res.on('data', function (c) { s += c; }); res.on('end', function () { cb(res.statusCode === 200 && /"ok"\s*:\s*true/.test(s) ? null : 'ответ сайта ' + res.statusCode + ': ' + s.slice(0, 120)); });
    });
    req.on('timeout', function () { req.destroy(new Error('сайт не ответил за 20 сек')); });
    req.on('error', function (e) { cb(e.message); });
    req.end(data);
}

let busy = false, lastErr = '';
function sync(force, done) {
    if (!CFG.url || !CFG.key) { if (done) done('не настроено: впишите url и key в ' + CFG_FILE); return; }
    if (busy) { if (done) done('синхронизация уже идёт'); return; }
    busy = true;
    collect().then(function (body) {
        post(body, function (err) {
            busy = false;
            if (err) { if (err !== lastErr) console.log('[site] ошибка отправки: ' + err); lastErr = err; }
            else { if (lastErr || force) console.log('[site] данные на сайт отправлены: игроков ' + body.total + ', онлайн ' + body.online); lastErr = ''; }
            if (done) done(err, body);
        });
    }).catch(function (e) { busy = false; console.log('[site] ' + e.message); if (done) done(e.message); });
}
setTimeout(function () { sync(true); }, 30000);
setInterval(function () { sync(false); }, Math.max(30, Number(CFG.every) || 120) * 1000);
mp.events.add('playerQuit', function () { setTimeout(function () { sync(false); }, 5000); });

mp.events.addCommand('site', function (p) {
    const lvl = global.AdminSystem && global.AdminSystem.realLvl ? global.AdminSystem.realLvl(p) : 0;
    if (lvl < 6) return p.outputChatBox('!{#7fd3ff}Личный кабинет на сайте: войдите тем же логином и паролем, что и в игре');
    p.outputChatBox('!{#ffcc66}[site] Отправляю данные на сайт…');
    sync(true, function (err, b) { if (mp.players.exists(p)) p.outputChatBox(err ? '!{#e05555}[site] ' + err : '!{#8fd14f}[site] Готово: игроков ' + b.total + ', онлайн ' + b.online); });
});

function siteBase() { try { const u = new URL(CFG.url); return u.origin + u.pathname.replace(/(api\/)?[^/]*$/, ''); } catch (e) { return ''; } }
function call(method, file, body, cb) {
    let u; try { u = new URL(siteBase() + file); } catch (e) { return cb('нет url'); }
    const mod = require(u.protocol === 'https:' ? 'https' : 'http');
    const data = body ? Buffer.from(JSON.stringify(body)) : null;
    const h = { 'Host': u.host, 'X-Amrp-Key': CFG.key, 'User-Agent': 'AMRP-Server' };
    if (data) { h['Content-Type'] = 'application/json'; h['Content-Length'] = data.length; }
    const req = mod.request({ hostname: CFG.ip || u.hostname, servername: u.hostname, port: u.port || (u.protocol === 'https:' ? 443 : 80), path: u.pathname + u.search, method: method, timeout: 20000, headers: h }, function (res) {
        let s = ''; res.on('data', function (c) { s += c; }); res.on('end', function () { let j = null; try { j = JSON.parse(s); } catch (e) {} cb(res.statusCode === 200 && j && j.ok ? null : 'ответ ' + res.statusCode + ': ' + s.slice(0, 120), j); });
    });
    req.on('timeout', function () { req.destroy(new Error('сайт не ответил')); });
    req.on('error', function (e) { cb(e.message); });
    req.end(data || undefined);
}
const DONE_FILE = path.join(__dirname, 'website_donates.json');
const DONE = (function () { try { return JSON.parse(fs.readFileSync(DONE_FILE, 'utf8')) || {}; } catch (e) { return {}; } })();
let donBusy = false, donErr = '';
let PACKS = null, payOn = false;
function donates() {
    if (!CFG.url || !CFG.key || donBusy) return;
    donBusy = true;
    call('GET', 'orders.php', null, function (err, j) {
        if (err) { donBusy = false; if (err !== donErr) console.log('[donate] ' + err); donErr = err; return; }
        donErr = '';
        if (Array.isArray(j.packs) && j.packs.length) { PACKS = j.packs; payOn = !!j.enabled; }
        const ok = [];
        (j.orders || []).forEach(function (o) {
            if (DONE[o.n]) { ok.push(o.n); return; }
            const r = global.UiSystem && global.UiSystem.addCoins ? global.UiSystem.addCoins('Сайт-донат', '#' + o.id, o.coins) : 'нет UiSystem';
            if (typeof r === 'string') { console.log('[donate] не удалось зачислить ' + o.n + ': ' + r); return; }
            DONE[o.n] = { id: o.id, coins: o.coins, rub: o.rub, t: Date.now() }; ok.push(o.n);
            console.log('[donate] #' + o.id + ' +' + o.coins + ' RC (' + o.rub + ' ₽, заказ ' + o.n + ')');
            mp.players.forEach(function (p) { if (p.account && Number(p.account.id) === Number(o.id)) p.outputChatBox('!{#8fd14f}[Донат] Спасибо за поддержку! Начислено ' + o.coins + ' RC'); });
        });
        if (ok.length) try { fs.writeFileSync(DONE_FILE, JSON.stringify(DONE)); } catch (e) {}
        if (!ok.length) { donBusy = false; return; }
        call('POST', 'orders.php', { done: ok }, function () { donBusy = false; });
    });
}
setTimeout(donates, 15000);
setInterval(donates, 30000);
mp.events.addCommand('donatesite', function (p) {
    const b = siteBase();
    p.outputChatBox('!{#ffcc66}Пополнить RC коины: ' + (b ? b + 'donate.php' : 'сайт ещё не настроен'));
});

global.WebSite = { sync: sync, donates: donates, url: siteBase, packs: function () { return PACKS; }, payOn: function () { return payOn; } };
console.log('[site] модуль сайта загружен' + (CFG.url ? ' → ' + CFG.url : ' (впишите адрес сайта в website_config.json)'));
