var WIMG = { pistol: 'pistol', i_pistol: 'pistol', g_pistol: 'combatpistol', smg: 'microsmg', i_smg: 'microsmg', rifle: 'assaultrifle_mk2', i_rifle: 'assaultrifle', i_shotgun: 'sawnoffshotgun', g_carbine: 'carbinerifle', knife: 'knife', bat: 'bat', g_stungun: 'stungun' };
var IIMG = {radio: 1, radio_t: 1, ammo_pistol: 1, ammo_rifle: 1, ammo_shotgun: 1, ammo_smg: 1, armour: 1, backpack: 1, bandage: 1, bandana: 1, bat: 1, boots: 1, c_barrel: 1, c_blueprint: 1, c_kevlar: 1, c_powder: 1, c_scrap: 1, c_shell: 1, c_spring: 1, canister: 1, cap: 1, card: 1, cash: 1, chain: 1, cuffs: 1, docs: 1, g_armour: 1, glasses: 1, gloves: 1, hat: 1, hoodie: 1, jeans: 1, knife: 1, lockpick: 1, mask: 1, medkit: 1, phone: 1, pills: 1, repair: 1, shirt: 1, shorts: 1, sneakers: 1, tshirt: 1, ukrop: 1, ukrop_pack: 1, ukrop_seed: 1, watch: 1};
IIMG.i_armour = 'armour';
function icoHtml(it) { if (!it) return ''; if (WIMG[it.k]) return '<img class="wimg" src="img/w/' + WIMG[it.k] + '.webp">'; if (IIMG[it.k]) return '<img class="iimg" src="img/i/' + (IIMG[it.k] === 1 ? it.k : IIMG[it.k]) + '.webp">'; return it.i || ''; }
function $(id) { return document.getElementById(id); }
function trig() { if (window.mp && mp.trigger) mp.trigger.apply(mp, arguments); }
function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function money(n) { return '$' + String(Math.floor(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function pad(n) { return n < 10 ? '0' + n : '' + n; }

var EMPTY_STATS = [
    { n: 'Здоровье', v: 100, max: 100, c: '#ff4d6d', i: '❤' }, { n: 'Броня', v: 0, max: 100, c: '#4fb6ff', i: '🛡' },
    { n: 'Уровень', v: 1, pct: 0, c: '#8fd14f', i: '★' }, { n: 'Стрельба', v: 0, pct: 0, c: '#ffd23f', i: '◎' },
    { n: 'Вождение', v: 0, pct: 0, c: '#a6e3a1', i: '⛐' }, { n: 'Выносл.', v: 0, pct: 0, c: '#5ee6c8', i: '⚡' }
];
function emptyInv() {
    return {
        name: '—', inv: new Array(30).fill(null), cap: 50, weight: 0, equip: {}, weapon: null, ammo: [], stats: EMPTY_STATS,
        side: { type: 'ground', title: 'Предметы рядом', sub: 'Пусто', list: new Array(15).fill(null), cap: 0, weight: 0 }
    };
}
function emptyMenu() {
    return {
        name: 'Игрок', id: 0, number: '—', gender: '—', created: '—', faction: 'Нет', family: 'Нет',
        lvl: 1, exp: 0, need: 75, hours: 0, money: 0, bank: 0, vehicles: [],
        skills: [{ n: 'Стрельба', lvl: 0, pct: 0 }, { n: 'Вождение', lvl: 0, pct: 0 }, { n: 'Выносливость', lvl: 0, pct: 0 }, { n: 'Выживание', lvl: 0, pct: 0 }],
        ach: [], bp: { lvl: 0, exp: 0, need: 30, rewards: [] }, shop: [], offline: true
    };
}
var MEM = {};
var LS = {
    get: function (k) { try { var v = window.LS.get(k); return v === null ? (MEM[k] !== undefined ? MEM[k] : null) : v; } catch (e) { return MEM[k] !== undefined ? MEM[k] : null; } },
    set: function (k, v) { MEM[k] = String(v); try { window.LS.set(k, String(v)); } catch (e) {} }
};
function showErr(where, e) {
    var box = document.querySelector('.srv-warn.err') || document.createElement('div');
    box.className = 'srv-warn err';
    box.innerHTML = '<b>Ошибка интерфейса (' + where + ')</b>' + esc(e && e.message ? e.message : e) + (e && e.stack ? '<br><small style="opacity:.6">' + esc(String(e.stack).split('\n').slice(0, 3).join(' | ')) + '</small>' : '');
    document.body.appendChild(box);
}
window.onerror = function (m, src, line) { showErr('строка ' + line, m); };
var DATA = { inv: null, phone: null, menu: null, docs: null };
var docSel = 0;
var current = null;
var waitTimer = null;

function srvWarn(kind) {
    clearTimeout(waitTimer);
    waitTimer = setTimeout(function () {
        if (DATA[kind] && !DATA[kind].offline) return;
        var w = document.createElement('div');
        w.className = 'srv-warn';
        w.innerHTML = '<b>Сервер не прислал данные</b>Модуль <i>ui.js</i> не подключён на сервере. Добавь в <i>packages/core/index.js</i> строку <i>require(\'./modules/ui.js\');</i> и перезапусти сервер.';
        var old = document.querySelector('.srv-warn');
        if (old) old.remove();
        document.body.appendChild(w);
        setTimeout(function () { if (w.parentNode) w.remove(); }, 9000);
    }, 2500);
}

window.uiOpen = function (name, opt) {
    ['inv', 'phone', 'menu', 'docs', 'fuel', 'atm', 'card', 'biz', 'shop'].forEach(function (s) { $(s).classList.toggle('show', s === name); });
    current = name;
    hideCtx();
    if (name === 'atm') { ATM.d = null; ATM.view = 'boot'; ATM.input = ''; renderAtm(); }
    if (name === 'docs') { docSel = 0; if (!(opt && opt.shown)) DATA.docs = DATA.docs && DATA.docs.own ? DATA.docs : null; renderDocs(); }
    if (name === 'inv') { if (!DATA.inv) { DATA.inv = emptyInv(); DATA.inv.offline = true; } renderInv(); srvWarn('inv'); }
    if (name === 'phone') { phoneHome(); srvWarn('phone'); }
    if (name === 'menu') { if (!DATA.menu) DATA.menu = emptyMenu(); renderMenu(); srvWarn('menu'); }
};
window.uiClose = function () {
    ['inv', 'phone', 'menu', 'docs', 'fuel', 'atm', 'card', 'biz', 'shop'].forEach(function (s) { $(s).classList.remove('show'); });
    current = null;
    hideCtx();
    closeModal();
};
function fill(d, def) {
    if (!d || typeof d !== 'object') return def;
    Object.keys(def).forEach(function (k) { if (d[k] === undefined || d[k] === null) d[k] = def[k]; });
    return d;
}
window.uiData = function (kind, d) {
    if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = null; } }
    if (kind === 'menu') { d = fill(d, emptyMenu()); d.offline = false; d.name = String(d.name); d.bp = fill(d.bp, { lvl: 0, exp: 0, need: 30, rewards: [] }); }
    if (kind === 'inv') { d = fill(d, emptyInv()); d.offline = false; d.side = fill(d.side, emptyInv().side); }
    if (kind === 'phone') { d = fill(d, { number: '—', name: '—', money: 0, bank: 0, contacts: [], sms: [], online: [], gps: [], pbal: 0 }); if (d.call) setTimeout(function () { window.phoneCall(d.call); }, 0); }
    DATA[kind] = d;
    var ww = document.querySelector('.srv-warn');
    if (ww) ww.remove();
    if (kind === 'inv') renderInv();
    if (kind === 'phone') phoneRefresh();
    if (kind === 'menu' && current === 'menu') renderMenu();
    if (kind === 'fuel') { fuelInit(d); }
    if (kind === 'atm') { atmData(d); }
    if (kind === 'card') { renderCard(d); }
    if (kind === 'biz') { bizData(d); }
    if (kind === 'shop') { shopData(d); }
    if (kind === 'docs') { if (typeof d.focus === 'number') docSel = d.focus; renderDocs(); }
};
function closeAll() { window.uiClose(); trig('cef:ui:close'); }

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        if ($('ctx').classList.contains('show')) return hideCtx();
        if (document.querySelector('.modal')) return closeModal();
        if (current === 'phone' && $('pg-app').classList.contains('active')) return phoneHome();
        closeAll();
    }
});
document.addEventListener('focusin', function (e) { if (/INPUT|TEXTAREA/.test(e.target.tagName)) trig('cef:ui:typing', true); });
document.addEventListener('focusout', function (e) { if (/INPUT|TEXTAREA/.test(e.target.tagName)) trig('cef:ui:typing', false); });

/* ================= INVENTORY ================= */
var SLOT_POS = {
    glasses: [70, 0, '🕶️', 'Очки'], hat: [180, 0, '🧢', 'Головной убор'],
    chain: [22, 72, '📿', 'Цепочка'], mask: [228, 72, '🎭', 'Маска'],
    watch: [0, 152, '⌚', 'Часы'], top: [250, 152, '🧥', 'Верх'],
    gloves: [0, 232, '🧤', 'Перчатки'], armour: [250, 232, '🦺', 'Бронежилет'],
    phone: [22, 312, '📱', 'Телефон'], legs: [228, 312, '👖', 'Низ'],
    bag: [70, 392, '🎒', 'Рюкзак'], shoes: [180, 392, '👟', 'Обувь']
};
var CLOTH = ['hat', 'glasses', 'mask', 'chain', 'top', 'legs', 'shoes', 'gloves', 'watch', 'bag'];

function cellClass(it) {
    if (!it) return ' empty';
    if (it.wp) return ' wp';
    if (it.use === 'heal') return ' med';
    if (it.slot && CLOTH.indexOf(it.slot) >= 0) return ' cloth';
    return '';
}

function cellHtml(it, b, i) {
    var inner = '';
    if (it) {
        inner = icoHtml(it) + (it.c > 1 ? '<span class="cnt">' + it.c + '</span>' : '');
        if (DATA.inv && DATA.inv.weapon && it.wp && DATA.inv.weapon.k === it.k && b === 'inv') inner += '<span class="in-hand">В РУКАХ</span>';
    }
    return '<div class="cell' + cellClass(it) + '" data-b="' + b + '" data-i="' + i + '">' + inner + '</div>';
}

function ringStat(s) {
    var pct = s.pct !== undefined ? s.pct : Math.round(s.v / (s.max || 100) * 100);
    pct = Math.max(0, Math.min(100, pct));
    var C = 2 * Math.PI * 17;
    return '<div class="st"><div class="st-ring"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="3"/>' +
        '<circle cx="20" cy="20" r="17" fill="none" stroke="' + s.c + '" stroke-width="3" stroke-linecap="round" stroke-dasharray="' + C + '" stroke-dashoffset="' + (C * (1 - pct / 100)) + '"/></svg>' +
        '<div class="v"><i style="color:' + s.c + '">' + s.i + '</i>' + s.v + '</div></div><div class="st-n" style="color:' + s.c + '">' + s.n + '</div></div>';
}

function renderInv() {
    try { return _renderInv(); } catch (e) { showErr('renderInv', e); }
}
function _renderInv() {
    var d = DATA.inv;
    if (!d) return;
    $('invNick').textContent = d.name;
    $('invGrid').innerHTML = d.inv.map(function (it, i) { return cellHtml(it, 'inv', i); }).join('');
    $('invCap').textContent = d.weight.toFixed(1) + '/' + d.cap + 'kg';
    $('invBar').style.width = Math.min(100, d.weight / d.cap * 100) + '%';

    var s = d.side;
    $('sideIco').textContent = s.type === 'trunk' ? '🚗' : '📦';
    $('sideTitle').textContent = s.title;
    $('sideSub').textContent = s.sub;
    $('sideGrid').innerHTML = s.list.map(function (it, i) { return cellHtml(it, s.type === 'trunk' ? 'trunk' : 'ground', s.type === 'trunk' ? i : (it ? it.id : 'new')); }).join('');
    $('sideCapBox').style.display = s.cap ? '' : 'none';
    if (s.cap) {
        $('sideCap').textContent = s.weight.toFixed(1) + '/' + s.cap + 'kg';
        $('sideBar').style.width = Math.min(100, s.weight / s.cap * 100) + '%';
    }

    if (d.weapon) {
        $('wpName').textContent = d.weapon.n + (d.weapon.ammo ? ' | ' + d.weapon.ammo : '');
        $('wpBox').innerHTML = '<span>' + icoHtml(d.weapon) + '</span><span class="wp-name">Нажмите, чтобы убрать</span>';
    } else {
        $('wpName').textContent = 'Оружие не в руках';
        $('wpBox').innerHTML = '<span class="wp-empty">Дважды кликните по оружию в инвентаре</span>';
    }
    var am = d.ammo.slice();
    while (am.length < 5) am.push(null);
    $('ammoGrid').innerHTML = am.map(function (it) { return cellHtml(it, 'inv', it ? it.idx : -1); }).join('');

    $('stats').innerHTML = (d.stats && d.stats.length ? d.stats : EMPTY_STATS).map(ringStat).join('');

    $('equip').innerHTML = Object.keys(SLOT_POS).map(function (k) {
        var p = SLOT_POS[k];
        var it = d.equip[k];
        var cls = it ? ' full' : ' empty';
        if (it && (k === 'watch' || k === 'phone' || k === 'gloves')) cls += ' v';
        if (it && k === 'armour') cls += ' r';
        return '<div class="slot' + cls + '" style="left:' + p[0] + 'px;top:' + p[1] + 'px" data-b="equip" data-i="' + k + '" data-tip="' + p[3] + '">' +
            (it ? icoHtml(it) : '<span class="ghost">' + p[2] + '</span>') + '</div>';
    }).join('');
}

function itemAt(b, i) {
    var d = DATA.inv;
    if (!d) return null;
    if (b === 'inv') return d.inv[Number(i)] || null;
    if (b === 'equip') return d.equip[i] || null;
    if (b === 'trunk') return d.side.list[Number(i)] || null;
    if (b === 'ground') return d.side.list.find(function (x) { return x && String(x.id) === String(i); }) || null;
    return null;
}

function act(o) { trig('cef:inv:act', JSON.stringify(o)); }

var drag = null;
var ctxRef = null;

function targetOf(e) {
    var el = document.elementFromPoint(e.clientX, e.clientY);
    return el ? el.closest('[data-b]') : null;
}

$('inv').addEventListener('mousedown', function (e) {
    if (e.button !== 0) return;
    var el = e.target.closest('[data-b]');
    if (!el || e.target.closest('.ctx')) return;
    var it = itemAt(el.dataset.b, el.dataset.i);
    if (!it || el.dataset.i === '-1') return;
    drag = { el: el, from: { b: el.dataset.b, i: el.dataset.i }, x: e.clientX, y: e.clientY, on: false, it: it };
});

document.addEventListener('mousemove', function (e) {
    var tip = $('tip');
    if (drag) {
        if (!drag.on && Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 5) {
            drag.on = true;
            hideCtx();
            drag.el.classList.add('picked');
            $('drag').innerHTML = icoHtml(drag.it);
            $('drag').style.display = 'block';
        }
        if (drag.on) {
            $('drag').style.left = e.clientX + 'px';
            $('drag').style.top = e.clientY + 'px';
            document.querySelectorAll('.over').forEach(function (x) { x.classList.remove('over'); });
            var t = targetOf(e);
            if (t && t !== drag.el) t.classList.add('over');
            tip.style.display = 'none';
            return;
        }
    }
    if (current !== 'inv') return;
    var el = e.target.closest('[data-b]');
    if (!el || $('ctx').classList.contains('show')) { tip.style.display = 'none'; return; }
    var it = itemAt(el.dataset.b, el.dataset.i);
    if (!it && !el.dataset.tip) { tip.style.display = 'none'; return; }
    tip.innerHTML = it ? '<b>' + esc(it.n) + '</b><span>' + (it.w * it.c).toFixed(2) + ' кг' + (it.c > 1 ? ' · ' + it.c + ' шт.' : '') + (it.ar !== undefined && it.ar !== null ? ' · прочность ' + it.ar + '%' : '') + '</span>' : '<span>' + esc(el.dataset.tip) + '</span>';
    tip.style.display = 'block';
    tip.style.left = (e.clientX + 16) + 'px';
    tip.style.top = (e.clientY + 14) + 'px';
});

document.addEventListener('mouseup', function (e) {
    if (!drag) return;
    var d = drag;
    drag = null;
    $('drag').style.display = 'none';
    d.el.classList.remove('picked');
    document.querySelectorAll('.over').forEach(function (x) { x.classList.remove('over'); });
    if (!d.on) {
        if (e.target.closest('[data-b]') === d.el) showCtx(d.from, d.it, e.clientX, e.clientY);
        return;
    }
    var t = targetOf(e);
    if (!t) {
        if (!e.target.closest('.panel') && !e.target.closest('.slot') && d.from.b !== 'ground') act({ a: 'drop', from: d.from });
        return;
    }
    if (t === d.el) return;
    act({ a: 'move', from: d.from, to: { b: t.dataset.b, i: t.dataset.i }, count: e.shiftKey ? Math.ceil(d.it.c / 2) : 0 });
});

$('inv').addEventListener('dblclick', function (e) {
    var el = e.target.closest('[data-b]');
    if (!el) return;
    var it = itemAt(el.dataset.b, el.dataset.i);
    if (!it) return;
    hideCtx();
    act({ a: 'use', from: { b: el.dataset.b, i: el.dataset.i } });
});

$('inv').addEventListener('contextmenu', function (e) {
    e.preventDefault();
    var el = e.target.closest('[data-b]');
    if (!el) return;
    var it = itemAt(el.dataset.b, el.dataset.i);
    if (it) showCtx({ b: el.dataset.b, i: el.dataset.i }, it, e.clientX, e.clientY);
});

$('wpBox').addEventListener('click', function () {
    var d = DATA.inv;
    if (!d || !d.weapon) return;
    var idx = d.inv.findIndex(function (x) { return x && x.k === d.weapon.k; });
    if (idx >= 0) act({ a: 'use', from: { b: 'inv', i: idx } });
});

function showCtx(ref, it, x, y) {
    ctxRef = ref;
    $('ctxImg').innerHTML = icoHtml(it);
    $('ctxName').textContent = it.n + (it.c > 1 ? ' (' + it.c + ')' : '');
    var useTxt = 'Использовать';
    if (ref.b === 'equip') useTxt = 'Снять';
    else if (ref.b !== 'inv') useTxt = 'Взять';
    else if (it.slot) useTxt = 'Надеть';
    else if (it.wp) useTxt = DATA.inv.weapon && DATA.inv.weapon.k === it.k ? 'Убрать из рук' : 'Взять в руки';
    $('ctxUse').textContent = useTxt;
    $('ctxSplit').style.display = it.c > 1 && ref.b !== 'equip' ? '' : 'none';
    var c = $('ctx');
    c.classList.add('show');
    $('tip').style.display = 'none';
    var w = 170, h = c.offsetHeight;
    c.style.left = Math.min(window.innerWidth - w - 10, x + 8) + 'px';
    c.style.top = Math.min(window.innerHeight - h - 10, y - 20) + 'px';
}
function hideCtx() { $('ctx').classList.remove('show'); ctxRef = null; }

$('ctx').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || !ctxRef) return;
    var a = b.dataset.act;
    var ref = ctxRef;
    hideCtx();
    if (a === 'split') {
        var d = DATA.inv;
        var list = ref.b === 'inv' ? d.inv : d.side.list;
        var free = list.findIndex(function (x) { return !x; });
        var it = itemAt(ref.b, ref.i);
        if (free < 0 || !it) return;
        act({ a: 'move', from: ref, to: { b: ref.b, i: ref.b === 'ground' ? 'new' : free }, count: Math.floor(it.c / 2) });
        return;
    }
    act({ a: a, from: ref });
});

document.addEventListener('mousedown', function (e) {
    if ($('ctx').classList.contains('show') && !e.target.closest('.ctx')) hideCtx();
});

/* ================= PHONE ================= */
var APPS = [
    { id: 'dial', n: 'Телефон', i: '📞', bg: 'linear-gradient(135deg,#34c759,#0a8f3a)' },
    { id: 'contacts', n: 'Контакты', i: '👤', bg: 'linear-gradient(135deg,#8e8e93,#5a5a60)' },
    { id: 'sms', n: 'Сообщения', i: '💬', bg: 'linear-gradient(135deg,#34c759,#1f9e43)' },
    { id: 'bank', n: 'Банк', i: '💳', bg: 'linear-gradient(135deg,#e3194f,#8f1fd1)' },
    { id: 'gps', n: 'Карты', i: '🗺️', bg: 'linear-gradient(135deg,#5ac8fa,#007aff)' },
    { id: 'players', n: 'Люди', i: '🌐', bg: 'linear-gradient(135deg,#ff9f0a,#ff6b00)' },
    { id: 'taxi', n: 'Такси', i: '🚕', bg: 'linear-gradient(135deg,#ffd60a,#f5a300)' },
    { id: 'calc', n: 'Калькулятор', i: '🧮', bg: 'linear-gradient(135deg,#3a3a3c,#1c1c1e)' },
    { id: 'notes', n: 'Заметки', i: '📝', bg: 'linear-gradient(135deg,#ffd60a,#ff9f0a)' },
    { id: 'camera', n: 'Камера', i: '📷', bg: 'linear-gradient(135deg,#636366,#2c2c2e)' },
    { id: 'menu', n: 'Меню', i: '🎮', bg: 'linear-gradient(135deg,#d93bc8,#7b2bb5)' },
    { id: 'settings', n: 'О телефоне', i: '⚙️', bg: 'linear-gradient(135deg,#aeaeb2,#636366)' }
];
var DOCK = ['dial', 'contacts', 'sms', 'bank'];
var phApp = null;
var gpsTab = 'places';
var phChat = null;
var dialNum = '';
var dialTab = 'keys';
var missSeen = Number(LS.get('miss_seen') || 0);
function missed() { var p = DATA.phone; return p && p.calls ? p.calls.filter(function (c) { return c.dir === 'miss' && c.at > missSeen; }).length : 0; }
var callT = null;
var lastSeen = Number(LS.get('sms_seen') || 0);

function unread() {
    var p = DATA.phone;
    if (!p) return 0;
    return p.sms.filter(function (m) { return !m.me && m.at > lastSeen; }).length;
}

function appHtml(a) {
    var dot = a.id === 'sms' && unread() ? '<span class="dot">' + unread() + '</span>' : a.id === 'dial' && missed() ? '<span class="dot">' + missed() + '</span>' : '';
    return '<div class="app" data-app="' + a.id + '"><div class="app-ic" style="background:' + a.bg + '">' + a.i + dot + '</div><span>' + a.n + '</span></div>';
}

function phoneHome() {
    try { return _phoneHome(); } catch (e) { showErr('phoneHome', e); }
}
function _phoneHome() {
    phApp = null; phChat = null;
    $('pg-home').classList.add('active');
    $('pg-app').classList.remove('active');
    $('apps').innerHTML = APPS.filter(function (a) { return DOCK.indexOf(a.id) < 0; }).map(appHtml).join('');
    $('dock').innerHTML = DOCK.map(function (id) { return appHtml(APPS.find(function (a) { return a.id === id; })); }).join('');
}

function tick() {
    var d = new Date();
    var t = pad(d.getHours()) + ':' + pad(d.getMinutes());
    $('phTime').textContent = t;
    $('phClock').textContent = t;
    $('phDate').textContent = d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
}
tick();
setInterval(tick, 10000);

$('phone').addEventListener('click', function (e) {
    var a = e.target.closest('[data-app]');
    if (a) return openApp(a.dataset.app);
});
$('phBack').onclick = function () {
    if (phApp === 'sms' && phChat) { phChat = null; return renderApp(); }
    phoneHome();
};
$('phHome').onclick = phoneHome;

function openApp(id) {
    if (id === 'taxi') DATA.taxi = null;
    if (id === 'camera') { trig('cef:phone:camera'); return; }
    if (id === 'menu') { trig('cef:ui:open', 'menu'); return; }
    phApp = id; phChat = null;
    $('pg-home').classList.remove('active');
    $('pg-app').classList.add('active');
    renderApp();
}

function phoneRefresh() {
    if (current !== 'phone') return;
    if (phApp) renderApp(); else phoneHome();
}

function nameOf(num) {
    var p = DATA.phone;
    var c = p && p.contacts.find(function (x) { return x.number === num; });
    return c ? c.name : num;
}

function timeOf(at) { var d = new Date(at); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }

function renderApp() {
    try { return _renderApp(); } catch (e) { showErr('renderApp', e); }
}
function _renderApp() {
    var p = DATA.phone;
    var a = APPS.find(function (x) { return x.id === phApp; });
    var body = $('appBody');
    var actEl = $('appAct');
    actEl.textContent = '';
    actEl.onclick = null;
    $('appTitle').textContent = a ? a.n : '';
    if (!p) { body.innerHTML = '<div class="empty-t">Загрузка...</div>'; return; }
    var old = document.querySelector('.send');
    if (old) old.remove();

    if (phApp === 'contacts') {
        actEl.textContent = '+';
        actEl.onclick = function () { contactForm(); };
        body.innerHTML = '<div class="li" style="cursor:default"><div class="av">Я</div><div class="li-b"><b>Мой номер</b><span>' + esc(p.number) + '</span></div></div>' +
            (p.contacts.length ? p.contacts.map(function (c) {
                return '<div class="li" data-c="' + esc(c.number) + '"><div class="av">' + esc(c.name[0].toUpperCase()) + '</div><div class="li-b"><b>' + esc(c.name) + '</b><span>' + esc(c.number) + '</span></div><span class="li-r">💬</span></div>';
            }).join('') : '<div class="empty-t">Контактов пока нет.<br>Нажмите «+», чтобы добавить.</div>');
        body.querySelectorAll('[data-c]').forEach(function (el) {
            el.onclick = function () { contactCard(el.dataset.c); };
        });
    } else if (phApp === 'sms') {
        if (phChat) return renderChat();
        lastSeen = Date.now();
        LS.set('sms_seen', lastSeen);
        actEl.textContent = '✎';
        actEl.onclick = function () { newChat(); };
        var conv = {};
        p.sms.forEach(function (m) { conv[m.w] = m; });
        var list = Object.keys(conv).map(function (k) { return conv[k]; }).sort(function (x, y) { return y.at - x.at; });
        body.innerHTML = list.length ? list.map(function (m) {
            var n = nameOf(m.w);
            return '<div class="li" data-w="' + esc(m.w) + '"><div class="av">' + esc(n[0]) + '</div><div class="li-b"><b>' + esc(n) + '</b><span>' + (m.me ? 'Вы: ' : '') + esc(m.t) + '</span></div><span class="li-r">' + timeOf(m.at) + '</span></div>';
        }).join('') : '<div class="empty-t">Сообщений нет.<br>Нажмите ✎, чтобы написать.</div>';
        body.querySelectorAll('[data-w]').forEach(function (el) { el.onclick = function () { phChat = el.dataset.w; renderApp(); }; });
    } else if (phApp === 'bank') {
        body.innerHTML = '<div class="card"><small>Баланс счёта</small><div class="sum">' + money(p.bank) + '</div><div class="num">' + esc(p.number.replace('-', ' ')) + ' •••• ' + esc(p.name.toUpperCase()) + '</div></div>' +
            '<div class="kv"><span>Наличные</span><b>' + money(p.money) + '</b></div>' +
            '<div style="height:14px"></div>' +
            '<input class="f-in" id="bSum" type="number" placeholder="Сумма">' +
            '<div class="row2"><button class="btn" data-op="dep">Положить</button><button class="btn ghost" data-op="wd">Снять</button></div>' +
            '<input class="f-in" id="bTo" placeholder="Номер получателя (123-456)" style="margin-top:8px">' +
            '<button class="btn" data-op="send">Перевести</button>';
        body.querySelectorAll('[data-op]').forEach(function (b) {
            b.onclick = function () { trig('cef:phone:bank', b.dataset.op, Number($('bSum').value), $('bTo').value); };
        });
    } else if (phApp === 'gps') {
        var GT = [['places', '📍 Места'], ['homes', '🏠 Жильё'], ['biz', '💼 Бизнесы'], ['jobs', '🛠 Работы']];
        var tabs = '<div class="gps-tabs">' + GT.map(function (t) { return '<button class="gps-tab' + (gpsTab === t[0] ? ' on' : '') + '" data-gt="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
        if (gpsTab === 'homes') {
            phoneHomesTab(body, tabs);
        } else if (gpsTab === 'biz') {
            var BZ = DATA.biz;
            if (!BZ) { body.innerHTML = tabs + '<div class="empty-t">Загрузка...</div>'; trig('cef:phone:biz'); }
            else body.innerHTML = tabs + BZ.map(function (c) {
                return '<div class="gps-sub">' + esc(c.n) + '</div>' + (c.items.length ? c.items.map(function (b) {
                    return '<div class="gps-i" data-bz="' + c.k + '" data-id="' + b.id + '"><span>📍</span><span style="flex:1">' + esc(b.n) + '<small style="display:block;color:#888;font-size:11px">' + (b.own ? 'Владелец: ' + esc(b.own) : 'Государственный') + '</small></span><span style="color:#888;font-size:11px">' + (b.d > 1000 ? (b.d / 1000).toFixed(1) + ' км' : b.d + ' м') + '</span></div>';
                }).join('') : '<div class="empty-t">Нет</div>');
            }).join('');
        } else if (gpsTab === 'jobs') {
            var J = DATA.jobs;
            if (!J) { body.innerHTML = tabs + '<div class="empty-t">Загрузка...</div>'; trig('cef:job:phone'); }
            else {
                body.innerHTML = tabs + '<div class="empty-t" style="text-align:left;margin:6px 0">Ваш уровень: <b>' + (J.lvl || 1) + '</b>. Новичкам 1–3 ур. — стройка, грузчик и ферма, дальше открываются новые работы.</div>' + (J.working ? '<div class="job-now">Сейчас: <b>' + esc(J.working.n) + '</b><button class="btn ghost" data-jq="1" style="margin:8px 0 0">Закончить смену</button></div>' : '') +
                    J.list.map(function (j) {
                        return '<div class="job-c' + (j.off || j.lock ? ' off' : '') + '"><div class="job-h"><span class="job-i">' + j.i + '</span><div><b>' + esc(j.n) + '</b><small>' + esc(j.pay) + '</small></div><span class="job-lv' + (j.lock ? ' lk' : '') + '">' + (j.lock ? '🔒 ' : '') + j.need + '+ ур.</span></div>' +
                            '<p>' + esc(j.d) + '</p>' +
                            (j.done ? '<div class="job-st">Выполнено: ' + j.done + ' · заработано ' + money(j.earned) + '</div>' : '') +
                            (j.off ? '<div class="job-st" style="color:#ff6b6b">Временно закрыто администрацией</div>' : '<button class="btn" data-jg="' + j.id + '">📍 Проложить маршрут</button>') + '</div>';
                    }).join('') + '<div class="empty-t" style="margin-top:6px">Всего заработано на работах: ' + money(J.total) + '</div>';
            }
        } else {
            if (!DATA.houses) trig('cef:house:phone');
            var groups = {};
            p.gps.forEach(function (g, i) { var c = g.c || 'Места'; (groups[c] = groups[c] || []).push([g, i]); });
            body.innerHTML = tabs + '<div class="empty-t" style="margin:6px 0 4px;text-align:left">Выберите место — метка появится на карте.</div>' +
                '<div class="gps-sub">Услуги</div><div class="gps-i" data-rl="1"><span>🔑</span><span>Агентство недвижимости · аукционы</span></div>' +
                Object.keys(groups).map(function (c) {
                    var org = c === 'Госучреждения' && DATA.houses && DATA.houses.fac ? DATA.houses.fac.map(function (f) { return '<div class="gps-i" data-hg="fac" data-id="' + f.i + '"><span>🏛️</span><span>' + esc(f.n) + '</span></div>'; }).join('') : '';
                    return '<div class="gps-sub">' + esc(c) + '</div>' + org + groups[c].map(function (x) { return '<div class="gps-i" data-g="' + x[1] + '"><span>📍</span><span>' + esc(x[0].n) + '</span></div>'; }).join('');
                }).join('');
        }
        body.querySelectorAll('[data-g]').forEach(function (el) { el.onclick = function () { trig('cef:phone:gps', Number(el.dataset.g)); }; });
        body.querySelectorAll('[data-rl]').forEach(function (el) { el.onclick = function () { trig('cef:realty:gps'); }; });
        body.querySelectorAll('[data-bz]').forEach(function (el) { el.onclick = function () { trig('cef:phone:bizgps', el.dataset.bz, Number(el.dataset.id)); }; });
        body.querySelectorAll('[data-gt]').forEach(function (el) { el.onclick = function () { gpsTab = el.dataset.gt; if (gpsTab === 'jobs') { DATA.jobs = null; } if (gpsTab === 'homes') { DATA.houses = null; } if (gpsTab === 'biz') { DATA.biz = null; } renderApp(); }; });
        body.querySelectorAll('[data-hg]').forEach(function (el) { el.onclick = function () { trig('cef:house:gps', el.dataset.hg, Number(el.dataset.id)); }; });
        body.querySelectorAll('[data-jg]').forEach(function (el) { el.onclick = function () { trig('cef:job:gps', el.dataset.jg); }; });
        body.querySelectorAll('[data-jq]').forEach(function (el) { el.onclick = function () { trig('cef:job:quit'); setTimeout(function () { DATA.jobs = null; renderApp(); }, 400); }; });
    } else if (phApp === 'taxi') {
        taxiRender(body);
    } else if (phApp === 'players') {
        body.innerHTML = p.online.map(function (x) {
            return '<div class="li" data-n="' + esc(x.number) + '" data-nm="' + esc(x.name) + '"><div class="av">' + esc(x.name[0]) + '</div><div class="li-b"><b>' + esc(x.name) + '</b><span>ID ' + x.id + ' · ' + esc(x.number) + '</span></div><span class="li-r">💬</span></div>';
        }).join('') || '<div class="empty-t">Никого нет</div>';
        body.querySelectorAll('[data-n]').forEach(function (el) {
            el.onclick = function () { if (el.dataset.n === p.number) return; phApp = 'sms'; phChat = el.dataset.n; $('appTitle').textContent = 'Сообщения'; renderApp(); };
        });
    } else if (phApp === 'dial') {
        actEl.textContent = dialTab === 'keys' ? '🕘' : '⌨';
        actEl.onclick = function () { dialTab = dialTab === 'keys' ? 'recent' : 'keys'; renderApp(); };
        if (dialTab === 'recent') {
            var cl = (p.calls || []).slice().reverse();
            var DIR = { out: ['↗', 'Исходящий', '#8e8e93'], in: ['↙', 'Входящий', '#34c759'], miss: ['↙', 'Пропущенный', '#ff453a'] };
            body.innerHTML = '<div class="row2" style="margin-bottom:10px"><button class="btn ghost" data-dt="keys">Клавиатура</button><button class="btn" data-dt="recent">Недавние</button></div>' +
                (cl.length ? cl.map(function (c) {
                    var dd = DIR[c.dir] || DIR.out, nm = nameOf(c.n);
                    return '<div class="li" data-cn="' + esc(c.n) + '"><div class="av">' + esc(nm[0]) + '</div><div class="li-b"><b style="color:' + (c.dir === 'miss' ? '#ff453a' : '#fff') + '">' + esc(nm) + '</b><span><i style="font-style:normal;color:' + dd[2] + '">' + dd[0] + '</i> ' + dd[1] + (c.dur ? ' · ' + Math.floor(c.dur / 60) + ':' + pad(c.dur % 60) : '') + '</span></div><span class="li-r">' + timeOf(c.at) + ' 📞</span></div>';
                }).join('') : '<div class="empty-t">Звонков пока не было</div>');
            body.querySelectorAll('[data-cn]').forEach(function (el) { el.onclick = function () { trig('cef:call:start', el.dataset.cn); }; });
            body.querySelectorAll('[data-dt]').forEach(function (el) { el.onclick = function () { dialTab = el.dataset.dt; renderApp(); }; });
            return;
        }
        var dk = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
        body.innerHTML = '<div class="dl-n" id="dlN">' + esc(dialNum || '') + '</div><div class="dl-bal">Баланс: $' + (p.pbal || 0) + ' · звонок $' + (p.tariff ? p.tariff.callMin : 5) + '/мин</div><div class="dl-k">' +
            dk.map(function (k) { return k ? '<button data-dk="' + k + '">' + k + '</button>' : '<span></span>'; }).join('') + '</div><button class="dl-go" id="dlGo">📞</button>';
        body.querySelectorAll('[data-dk]').forEach(function (b) {
            b.onclick = function () {
                var raw = (dialNum || '').replace('-', '');
                if (b.dataset.dk === '⌫') raw = raw.slice(0, -1); else if (raw.length < 6) raw += b.dataset.dk;
                dialNum = raw.length > 3 ? raw.slice(0, 3) + '-' + raw.slice(3) : raw;
                $('dlN').textContent = dialNum;
            };
        });
        body.querySelector('.dl-n').insertAdjacentHTML('beforebegin', '<div class="row2" style="margin-bottom:4px"><button class="btn" data-dt="keys">Клавиатура</button><button class="btn ghost" data-dt="recent">Недавние' + (missed() ? ' (' + missed() + ')' : '') + '</button></div>');
        body.querySelectorAll('[data-dt]').forEach(function (el) { el.onclick = function () { dialTab = el.dataset.dt; if (dialTab === 'recent') { missSeen = Date.now(); LS.set('miss_seen', missSeen); } renderApp(); }; });
        $('dlGo').onclick = function () { if (/^\d{3}-\d{3}$/.test(dialNum)) trig('cef:call:start', dialNum); };
    } else if (phApp === 'calc') {
        calcRender();
    } else if (phApp === 'notes') {
        body.innerHTML = '<textarea class="f-in" id="notesT" style="height:440px;resize:none;line-height:1.5" placeholder="Ваши заметки...">' + esc(LS.get('ph_notes') || '') + '</textarea>';
        $('notesT').oninput = function () { LS.set('ph_notes', this.value); };
    } else if (phApp === 'settings') {
        body.innerHTML = '<div style="text-align:center;margin:16px 0 6px"><img src="logo.png" style="width:90px;height:90px;object-fit:contain"></div><div style="text-align:center;font-weight:700;font-size:16px;margin-bottom:20px">AMRP Phone</div>' +
            '<div class="kv"><span>Владелец</span><b>' + esc(p.name) + '</b></div><div class="kv"><span>Номер</span><b>' + esc(p.number) + '</b></div>' +
            '<div class="kv"><span>Контактов</span><b>' + p.contacts.length + '</b></div><div class="kv"><span>Сообщений</span><b>' + p.sms.length + '</b></div>' +
            '<div class="kv"><span>Баланс телефона</span><b>$' + (p.pbal || 0) + '</b></div>' +
            '<input class="f-in" id="pbSum" type="number" placeholder="Сумма с банковского счёта" style="margin-top:12px"><button class="btn" id="pbGo">Пополнить баланс</button>' +
            '<div class="empty-t" style="margin-top:6px">SMS $' + (p.tariff ? p.tariff.sms : 2) + ' · звонок $' + (p.tariff ? p.tariff.callMin : 5) + '/мин. Новый номер — M → Донат → Связь</div>';
        $('pbGo').onclick = function () { trig('cef:sim:cash', Number($('pbSum').value)); };
    }
}

function renderChat() {
    var p = DATA.phone;
    var body = $('appBody');
    $('appTitle').textContent = nameOf(phChat);
    var msgs = p.sms.filter(function (m) { return m.w === phChat; });
    body.innerHTML = '<div class="chat">' + (msgs.length ? msgs.map(function (m) {
        return '<div class="msg ' + (m.me ? 'out' : 'in') + '">' + esc(m.t) + '<i>' + timeOf(m.at) + '</i></div>';
    }).join('') : '<div class="empty-t">Напишите первое сообщение</div>') + '</div>';
    var s = document.createElement('div');
    s.className = 'send';
    s.innerHTML = '<input id="smsT" placeholder="Сообщение" maxlength="300"><button id="smsB">➤</button>';
    $('pg-app').appendChild(s);
    var go = function () {
        var t = $('smsT').value.trim();
        if (!t) return;
        trig('cef:phone:sms', phChat, t);
        $('smsT').value = '';
    };
    $('smsB').onclick = go;
    $('smsT').onkeydown = function (e) { if (e.key === 'Enter') go(); };
    body.scrollTop = body.scrollHeight;
    $('smsT').focus();
}

function newChat() {
    var body = $('appBody');
    body.innerHTML = '<input class="f-in" id="ncN" placeholder="Номер (123-456)"><button class="btn" id="ncGo">Открыть чат</button>' +
        (DATA.phone.contacts.length ? '<div class="empty-t" style="margin:14px 0 4px;text-align:left">Или выберите контакт:</div>' : '') +
        DATA.phone.contacts.map(function (c) { return '<div class="li" data-n="' + esc(c.number) + '"><div class="av">' + esc(c.name[0]) + '</div><div class="li-b"><b>' + esc(c.name) + '</b><span>' + esc(c.number) + '</span></div></div>'; }).join('');
    $('ncGo').onclick = function () { var n = $('ncN').value.trim(); if (/^\d{3}-\d{3}$/.test(n)) { phChat = n; renderApp(); } };
    body.querySelectorAll('[data-n]').forEach(function (el) { el.onclick = function () { phChat = el.dataset.n; renderApp(); }; });
}

function contactForm(c) {
    var body = $('appBody');
    $('appTitle').textContent = c ? 'Изменить' : 'Новый контакт';
    body.innerHTML = '<div style="text-align:center;margin:14px 0 18px"><div class="av" style="width:80px;height:80px;font-size:30px;margin:0 auto">' + (c ? esc(c.name[0]) : '+') + '</div></div>' +
        '<input class="f-in" id="cfN" placeholder="Имя" maxlength="32" value="' + (c ? esc(c.name) : '') + '">' +
        '<input class="f-in" id="cfP" placeholder="Номер 123-456" maxlength="7" value="' + (c ? esc(c.number) : '') + '">' +
        '<button class="btn" id="cfS">Сохранить</button>';
    $('cfS').onclick = function () {
        if (c && c.number !== $('cfP').value.trim()) trig('cef:phone:contact', JSON.stringify({ number: c.number, del: 1 }));
        trig('cef:phone:contact', JSON.stringify({ name: $('cfN').value, number: $('cfP').value }));
    };
    $('cfN').focus();
}

function contactCard(num) {
    var c = DATA.phone.contacts.find(function (x) { return x.number === num; });
    if (!c) return;
    var body = $('appBody');
    $('appTitle').textContent = c.name;
    body.innerHTML = '<div style="text-align:center;margin:20px 0"><div class="av" style="width:90px;height:90px;font-size:36px;margin:0 auto 12px">' + esc(c.name[0]) + '</div><b style="font-size:20px">' + esc(c.name) + '</b><div style="color:#888;margin-top:4px">' + esc(c.number) + '</div></div>' +
        '<div class="row2"><button class="btn" id="ccC">📞 Позвонить</button><button class="btn" id="ccM">💬 Написать</button></div><button class="btn ghost" id="ccE">Изменить</button><button class="btn ghost" id="ccD" style="color:#ff5a7a">Удалить контакт</button>';
    $('ccM').onclick = function () { phApp = 'sms'; phChat = c.number; renderApp(); };
    $('ccC').onclick = function () { trig('cef:call:start', c.number); };
    $('ccE').onclick = function () { contactForm(c); };
    $('ccD').onclick = function () { trig('cef:phone:contact', JSON.stringify({ number: c.number, del: 1 })); };
}

var calc = { v: '0', prev: null, op: null, fresh: false };
function calcRender() {
    var keys = [['AC', 'fn'], ['±', 'fn'], ['%', 'fn'], ['÷', 'op'], ['7'], ['8'], ['9'], ['×', 'op'], ['4'], ['5'], ['6'], ['−', 'op'], ['1'], ['2'], ['3'], ['+', 'op'], ['0', 'wide'], [','], ['=', 'op']];
    $('appBody').innerHTML = '<div class="calc-d" id="cd">' + calc.v.replace('.', ',') + '</div><div class="calc">' +
        keys.map(function (k) { return '<button class="' + (k[1] || '') + '" data-k="' + k[0] + '">' + k[0] + '</button>'; }).join('') + '</div>';
    $('appBody').querySelectorAll('[data-k]').forEach(function (b) { b.onclick = function () { calcKey(b.dataset.k); }; });
}
function calcDo(a, b, op) {
    if (op === '+') return a + b;
    if (op === '−') return a - b;
    if (op === '×') return a * b;
    if (op === '÷') return b === 0 ? 0 : a / b;
    return b;
}
function calcKey(k) {
    var n = parseFloat(calc.v);
    if (/\d/.test(k)) { calc.v = calc.fresh || calc.v === '0' ? k : (calc.v + k).slice(0, 12); calc.fresh = false; }
    else if (k === ',') { if (calc.fresh) { calc.v = '0'; calc.fresh = false; } if (calc.v.indexOf('.') < 0) calc.v += '.'; }
    else if (k === 'AC') calc = { v: '0', prev: null, op: null, fresh: false };
    else if (k === '±') calc.v = String(-n);
    else if (k === '%') calc.v = String(n / 100);
    else if (k === '=') { if (calc.op) { calc.v = String(+calcDo(calc.prev, n, calc.op).toFixed(8)); calc.op = null; calc.fresh = true; } }
    else { if (calc.op && !calc.fresh) calc.v = String(+calcDo(calc.prev, n, calc.op).toFixed(8)); calc.prev = parseFloat(calc.v); calc.op = k; calc.fresh = true; }
    calcRender();
}

/* ================= MENU ================= */
var tab = 'char';
var shopCat = 'Все';
var settings = { hud: true, chat: true, sound: true, hints: true };
try { var _st = JSON.parse(LS.get('ui_settings') || 'null'); if (_st) settings = _st; } catch (e) {}

$('tabs').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    tab = b.dataset.tab;
    document.querySelectorAll('#tabs button').forEach(function (x) { x.classList.toggle('active', x === b); });
    renderMenu();
});
$('mClose').onclick = closeAll;

function ringSvg(size, r, w, pct, color, track) {
    var C = 2 * Math.PI * r;
    return '<svg viewBox="0 0 ' + size + ' ' + size + '"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + (track || 'rgba(255,255,255,.08)') + '" stroke-width="' + w + '"/>' +
        '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="' + w + '" stroke-linecap="round" stroke-dasharray="' + C + '" stroke-dashoffset="' + (C * (1 - Math.max(0, Math.min(100, pct)) / 100)) + '"/></svg>';
}

function tile(cls, img, inner, extra) {
    return '<div class="tile ' + (cls || '') + '"' + (extra || '') + '>' + (img ? '<div class="bg" style="background-image:url(img/' + img + ')"></div>' : '') + '<div class="in">' + inner + '</div></div>';
}

function renderMenu() {
    try { return _renderMenu(); } catch (e) { showErr('renderMenu', e); }
}
function _renderMenu() {
    var d = DATA.menu || emptyMenu();
    var b = $('mBody');
    if (['char', 'ach', 'shop', 'bp', 'set'].indexOf(tab) < 0) tab = 'char';
    if (tab === 'char') b.innerHTML = menuChar(d);
    if (tab === 'ach') b.innerHTML = menuAch(d);
    if (tab === 'shop') b.innerHTML = menuShop(d);
    if (tab === 'bp') b.innerHTML = menuBp(d);
    if (tab === 'set') b.innerHTML = menuSet();
    bindMenu();
}

function menuChar(d) {
    var parts = d.name.replace(/_/g, ' ').split(' ');
    var cars = d.vehicles.length ? '<div class="cars-row">' + d.vehicles.map(function (v) {
        return '<div class="tile car"><div class="bg" style="background-image:url(img/car.jpg)"></div><div class="in"><div class="t-cap t-dim">Автомобиль</div><div class="t-big">' + esc(v.name || v.model) + '</div></div><span class="plate">' + esc(v.plate) + '</span></div>';
    }).join('') + '</div>' : tile('car', 'car.jpg', '<div class="t-cap t-dim">Автомобиль</div><div class="t-big">Нет личного транспорта</div><div class="t-sub">Купите машину в автосалоне</div>');
    var h = d.home;
    var home = tile('orange-t', h && h.flat ? 'flat.jpg' : 'house.jpg', '<div class="t-cap">' + (h ? (h.flat ? 'Ваша квартира' : 'Ваш дом') : 'Недвижимость') + '</div><div class="t-big">' + (h ? esc(h.n) : 'Нет жилья') + '</div>' +
        '<div class="t-kv"><span>ID персонажа</span><b>' + d.id + '</b><span>Телефон</span><b>' + esc(d.number || '—') + '</b>' + (h ? '<span>Двери</span><b>' + (h.locked ? 'закрыты' : 'открыты') + '</b>' : '') + '</div>');
    var S = d.salary;
    var sal = S ? tile('green-t', 'biz.jpg', '<div class="t-cap">Зарплата · ' + esc(S.fn) + '</div><div class="t-big">' + money(S.net) + '</div><div class="t-kv"><span>Должность</span><b>' + esc(S.rn) + '</b><span>Налог</span><b>-' + money(S.tax) + '</b><span>Выплата через</span><b>' + Math.max(0, Math.ceil((S.next - Date.now()) / 60000)) + ' мин</b></div>')
        : tile('green-t', 'biz.jpg', '<div class="t-cap">Зарплата</div><div class="t-big">Нет</div><div class="t-sub">Вступите в гос. фракцию, чтобы получать оклад из казны штата</div>');
    return '<div class="ch"><div class="ch-left">' +
        tile('hello', 'hand.jpg', '<small>Приветствуем,</small><h2>' + esc(parts[0]) + '<br>' + esc(parts.slice(1).join(' ')) + '</h2>') +
        '<div class="tile field"><small>Никнейм</small><b>' + esc(d.name.replace(/_/g, ' ')) + '</b></div>' +
        '<div class="tile field"><small>Пол</small><b>' + esc(d.gender) + '</b></div>' +
        '<div class="tile field"><small>Дата регистрации</small><b>' + esc(d.created) + ' (' + d.hours + ' ч. в игре)</b></div>' +
        '<div class="tile field"><small>Фракция</small><b>' + esc(S ? S.fn : d.faction) + '</b></div>' +
        '<div class="tile field"><small>Семья</small><b>' + esc(d.family) + '</b></div>' +
        '<div class="tile lvl"><b>Ваш уровень ( ' + d.exp + '/' + d.need + ' EXP )</b><div class="big-ring">' + ringSvg(150, 64, 9, d.exp / d.need * 100, 'url(#g1)', 'rgba(255,255,255,.07)').replace('<svg viewBox="0 0 150 150">', '<svg viewBox="0 0 150 150"><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5ce1"/><stop offset="1" stop-color="#c13dff"/></linearGradient></defs>') + '<span>' + d.lvl + '</span></div></div>' +
        '</div><div class="ch-right">' +
        '<div class="cr3">' + home + sal +
        tile('orange-t clickable', 'docs.jpg', '<div class="t-cap">Ваши документы</div><div class="t-sub">Паспорт, удостоверения, справки</div>', ' data-docs="1"') + '</div>' +
        '<div class="cr2">' + cars +
        tile('yellow-t clickable', 'lic.jpg', '<div class="t-cap">Ваши лицензии</div><div class="t-sub">Права, разрешение на оружие</div>', ' data-docs="1"') + '</div>' +
        '<div class="cr2">' +
        tile('blue-t', 'biz.jpg', '<div class="t-cap">Ваши финансы</div><div class="t-big">' + money(d.money + d.bank) + '</div><div class="t-kv"><span>Наличные</span><b>' + money(d.money) + '</b><span>На счёте</span><b>' + money(d.bank) + '</b><span>Часов в игре</span><b>' + d.hours + '</b></div>') +
        tile('red-t report clickable', 'report.jpg', '<div class="t-cap">Репорт</div><div class="t-sub">Задайте вопрос или пожалуйтесь на игрока — администрация ответит в кратчайшие сроки</div>', ' data-report="1"') + '</div>' +
        '<div class="tile skills"><b>Ваши скиллы</b><div class="sk-row">' +
        d.skills.map(function (s) {
            return '<div class="sk"><div class="sk-ring">' + ringSvg(66, 28, 4, s.lvl >= 5 ? 100 : s.pct, '#ffc93c', 'rgba(255,255,255,.06)') + '<span>' + (s.lvl >= 5 ? 100 : s.pct) + '%</span></div><b>' + esc(s.n) + '</b><small>' + s.lvl + ' ур. из 5</small></div>';
        }).join('') +
        '</div></div>' +
        '</div></div>';
}

function menuAch(d) {
    var done = d.ach.filter(function (a) { return a.done; }).length;
    return '<div class="ach-top"><b>Выполнено ' + done + ' из ' + d.ach.length + '</b><div class="bar"><i style="width:' + (done / d.ach.length * 100) + '%"></i></div></div><div class="ach-grid">' +
        d.ach.map(function (a) { return '<div class="ach' + (a.done ? ' done' : '') + '"><div class="ai">' + a.i + '</div><div><b>' + esc(a.n) + '</b><small>' + esc(a.d) + (a.done ? ' ✓' : '') + '</small></div></div>'; }).join('') + '</div>';
}

var shopSec = 'vip', exN = 10;
function menuShop(d) {
    var coins = d.coins || 0;
    var secs = [['vip', '👑', 'VIP-статус'], ['coins', '💎', 'Коины'], ['sim', '📶', 'Связь'], ['lic', '📄', 'Лицензии'], ['items', '🛒', 'Предметы']];
    var head = '<div class="dn-hero" style="background-image:linear-gradient(90deg,rgba(20,8,30,.96) 30%,rgba(20,8,30,.35)),url(img/banner.jpg)">' +
        '<div class="dn-h-l"><span class="dn-tag">ДОНАТ-МАГАЗИН</span><h2>Поддержи AMRP — получи бонусы</h2><p>VIP ускоряет прокачку и Battle Pass, коины меняются на игровую валюту</p></div>' +
        '<div class="dn-bal"><div class="dn-coin"><img src="img/bp_coins.jpg"><div><small>Баланс</small><b>' + coins.toLocaleString('ru-RU') + ' RC</b></div></div>' +
        '<div class="dn-cash"><small>Наличные</small><b>' + money(d.money) + '</b></div>' +
        (d.vip ? '<div class="dn-vipnow" style="--c:' + d.vip.color + '">' + esc(d.vip.n) + ' · ещё ' + d.vip.left + ' дн.</div>' : '') + '</div></div>' +
        '<div class="dn-secs">' + secs.map(function (x) { return '<button data-sec="' + x[0] + '" class="' + (shopSec === x[0] ? 'active' : '') + '"><i>' + x[1] + '</i>' + x[2] + '</button>'; }).join('') + '</div>';
    var body = '';
    if (shopSec === 'vip') {
        body = '<div class="vip-grid">' + d.vips.map(function (v, i) {
            var mine = d.vip && d.vip.t === v.k;
            return '<div class="vip' + (i === 1 ? ' hot' : '') + '" style="--c:' + v.color + '">' + (i === 1 ? '<span class="vip-rib">ХИТ</span>' : '') +
                '<div class="vip-img"><img src="img/bp_' + v.img + '.jpg"></div><h3>' + esc(v.n) + '</h3><small>' + v.days + ' дней</small>' +
                '<ul>' + v.perks.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' +
                '<button data-vip="' + v.k + '"' + (coins < v.price ? ' class="poor"' : '') + '>' + (mine ? 'Продлить · ' : '') + v.price + ' RC</button></div>';
        }).join('') + '</div>';
    } else if (shopSec === 'lic') {
        body = '<div class="sim-t">Документы и лицензии</div><div class="sim-grid four">' + (d.lics || []).map(function (l) {
            return '<div class="sim-c"><div class="sim-chip" style="background:linear-gradient(135deg,#3a7bd5,#1c3f7a)">' + l.img + '</div><b>' + esc(l.n) + '</b><small>' + esc(l.d) + '</small>' +
                (l.own ? '<button disabled style="opacity:.5;background:#2a2a33">✓ Уже есть</button>' : '<button data-lic="' + l.k + '"' + (coins < l.price ? ' class="poor"' : '') + '>' + l.price + ' RC</button>') + '</div>';
        }).join('') + '</div><p class="pk-note">Документ сразу появляется в папке документов (инвентарь → «Папка документов»). Его можно показать полиции. Если лицензию отобрала администрация, купить её до конца срока нельзя.</p>';
    } else if (shopSec === 'sim') {
        body = '<div class="sim-top"><div class="sim-now"><small>Ваш номер</small><b>' + esc(d.number || '—') + '</b></div><div class="sim-now"><small>Баланс телефона</small><b>$' + (d.pbal || 0).toLocaleString('ru-RU') + '</b></div></div>' +
            '<div class="sim-t">SIM-карты</div><div class="sim-grid">' + (d.sims || []).map(function (s) {
                return '<div class="sim-c"><div class="sim-chip">📶</div><b>' + esc(s.n) + '</b><small>' + esc(s.d) + '</small>' +
                    (s.k === 'custom' ? '<input class="sim-in" id="simIn" placeholder="123-456" maxlength="7"><div class="sim-ok" id="simOk"></div>' : '') +
                    '<button data-sim="' + s.k + '"' + (coins < s.price ? ' class="poor"' : '') + '>' + s.price + ' RC</button></div>';
            }).join('') + '</div><p class="pk-note">При покупке новой SIM старый номер отключается. Контакты и сообщения сохраняются.</p>' +
            '<div class="sim-t">Пополнить баланс телефона</div><div class="sim-grid four">' + (d.topup || []).map(function (t, i) {
                return '<div class="sim-c"><b>$' + t[1].toLocaleString('ru-RU') + '</b><small>на счёт телефона</small><button data-top="' + i + '"' + (coins < t[0] ? ' class="poor"' : '') + '>' + t[0] + ' RC</button></div>';
            }).join('') + '</div><p class="pk-note">Тариф: SMS — $2, звонок — $5 за минуту (платит звонящий). Пополнить с банковского счёта можно в телефоне → О телефоне.</p>';
    } else if (shopSec === 'coins') {
        body = '<div class="ex-box"><div class="ex-l"><b>Обмен коинов</b><small>1 RC = ' + money(d.rate) + '</small></div>' +
            '<div class="ex-ctl"><button data-exm="1">−</button><input id="exIn" type="number" min="1" value="' + exN + '"><button data-exp="1">+</button></div>' +
            '<div class="ex-r">= <b>' + money(exN * d.rate) + '</b></div><button class="ex-go" data-ex="1"' + (coins < exN ? ' disabled' : '') + '>Обменять</button></div>' +
            '<div class="pk-grid">' + d.packs.map(function (p, i) {
                return '<div class="pk"><div class="pk-img"><img src="img/bp_coins.jpg">' + (p.bonus ? '<span>+' + p.bonus + ' бонус</span>' : '') + '</div><b>' + (p.c + p.bonus).toLocaleString('ru-RU') + ' RC</b><small>' + p.c + ' + ' + p.bonus + '</small><button data-pack="' + i + '">' + p.rub + ' ₽</button></div>';
            }).join('') + '</div><p class="pk-note">Пополнение пока через администрацию: напишите /report — коины начислят вручную.</p>';
    } else {
        var cats = ['Все', 'Разное', 'Одежда', 'Оружие'];
        var list = d.shop.filter(function (x) { return shopCat === 'Все' || x.cat === shopCat; });
        body = '<div class="cats" style="margin-bottom:14px">' + cats.map(function (c) { return '<button data-cat="' + c + '" class="' + (c === shopCat ? 'active' : '') + '">' + c + '</button>'; }).join('') + '</div><div class="shop-grid">' +
            list.map(function (x) { return '<div class="si"><div class="ii">' + icoHtml(x) + '</div><b>' + esc(x.n) + '</b><button data-buy="' + x.k + '">' + money(x.price) + '</button></div>'; }).join('') + '</div>';
    }
    return '<div class="dn">' + head + body + '</div>';
}

window.simCheck = function (n, ok) {
    var el = document.getElementById('simOk'), inp = document.getElementById('simIn');
    if (!el || !inp || inp.value !== n) return;
    el.textContent = ok ? '✓ Номер свободен' : '✗ Номер занят или неверный';
    el.className = 'sim-ok ' + (ok ? 'y' : 'n');
};

function menuBp(d) {
    var bp = d.bp, pct = bp.lvl >= 30 ? 100 : bp.exp / bp.need * 100;
    var ready = bp.rewards.filter(function (r) { return r.open && !r.claimed; }).length;
    return '<div class="bp2-hero" style="background-image:linear-gradient(90deg,rgba(12,22,14,.95) 25%,rgba(12,22,14,.3)),url(img/banner.jpg)">' +
        '<div class="bp2-lvl"><small>УРОВЕНЬ</small><b>' + bp.lvl + '</b><small>из 30</small></div>' +
        '<div class="bp2-info"><span class="dn-tag g">СЕЗОН 1</span><h2>Battle Pass</h2><p>Каждые ' + bp.need + ' минут игры — новый уровень. VIP ускоряет прогресс.</p>' +
        '<div class="bp2-bar"><i style="width:' + pct + '%"></i></div><small>' + (bp.lvl >= 30 ? 'Сезон пройден!' : bp.exp + ' / ' + bp.need + ' мин до ' + (bp.lvl + 1) + ' уровня') + '</small></div>' +
        (ready ? '<div class="bp2-ready">🎁 Доступно наград: <b>' + ready + '</b></div>' : '') + '</div>' +
        '<div class="bp2-track">' + bp.rewards.map(function (r) {
            var st = r.claimed ? 'got' : r.open ? 'open' : 'lock';
            var btn = r.claimed ? '<span class="st">✓ Получено</span>' : r.open ? '<button data-claim="' + r.lvl + '">Забрать</button>' : '<span class="st">🔒 Ур. ' + r.lvl + '</span>';
            return '<div class="bp2 ' + st + (r.big ? ' big' : '') + '"><span class="bp2-n">' + r.lvl + '</span><div class="bp2-img"><img src="img/bp_' + r.img + '.jpg"></div><b>' + esc(r.text) + '</b>' + btn + '</div>';
        }).join('') + '</div>';
}

var KB_DEF = { cuff: 85, escort: 74, car: 75 };
var KB_BUSY = { 77: 'M', 73: 'I', 192: 'Ё', 69: 'E', 84: 'T', 71: 'G', 66: 'B', 76: 'L', 90: 'Z', 89: 'Y', 78: 'N', 87: 'W', 65: 'A', 83: 'S', 68: 'D', 70: 'F', 27: 'Esc', 13: 'Enter', 32: 'Пробел', 8: 'Backspace', 113: 'F2', 114: 'F3', 115: 'F4', 116: 'F5', 118: 'F7', 120: 'F9' };
var kbWait = null;
function copKeysGet() { try { return Object.assign({}, KB_DEF, JSON.parse(LS.get('cop_keys') || '{}')); } catch (e) { return Object.assign({}, KB_DEF); } }
function keyName(c) {
    if (c >= 65 && c <= 90) return String.fromCharCode(c);
    if (c >= 48 && c <= 57) return String.fromCharCode(c);
    if (c >= 96 && c <= 105) return 'Num ' + (c - 96);
    if (c >= 112 && c <= 123) return 'F' + (c - 111);
    return { 16: 'Shift', 17: 'Ctrl', 18: 'Alt', 9: 'Tab', 20: 'Caps', 45: 'Insert', 46: 'Delete', 36: 'Home', 35: 'End', 33: 'PgUp', 34: 'PgDn', 186: ';', 222: "'", 188: ',', 190: '.', 191: '/', 219: '[', 221: ']', 220: '\\', 189: '-', 187: '=' }[c] || ('#' + c);
}
function copKeysSend() { trig('cef:ui:keys', JSON.stringify(copKeysGet())); }
setTimeout(copKeysSend, 1600);
document.addEventListener('keydown', function (e) {
    if (!kbWait) return;
    e.preventDefault(); e.stopImmediatePropagation();
    var c = e.keyCode, k = kbWait;
    kbWait = null;
    if (c === 27) return renderMenu();
    if (KB_BUSY[c]) { trig('cef:ui:kbbusy', KB_BUSY[c]); return renderMenu(); }
    var cur = copKeysGet();
    Object.keys(cur).forEach(function (x) { if (x !== k && cur[x] === c) cur[x] = cur[k]; });
    cur[k] = c;
    LS.set('cop_keys', JSON.stringify(cur));
    copKeysSend();
    renderMenu();
}, true);

function menuSet() {
    var opts = [
        ['hud', 'Интерфейс на экране', 'Деньги, локация, время (то же, что F7)'],
        ['chat', 'Показывать чат', 'Скрыть или показать окно чата'],
        ['hints', 'Подсказки клавиш', 'Нижняя полоса с клавишами'],
        ['sound', 'Звук SMS', 'Звуковой сигнал при новом сообщении']
    ];
    var keys = [['M', 'Меню сервера'], ['I', 'Инвентарь'], ['Ё', 'Предметы рядом / багажник'], ['F3', 'Телефон'], ['G', 'Взаимодействие'], ['F2', 'Анимации'], ['F9', 'Курсор'], ['B', 'Показать пальцем'], ['F7', 'Скрыть интерфейс'], ['T', 'Чат'], ['ESC', 'Закрыть окно'], ['Shift', 'Перетащить половину']];
    var ck = copKeysGet();
    var cops = [['cuff', 'Надеть / снять наручники'], ['escort', 'Вести за собой / отпустить'], ['car', 'Посадить в машину / вытащить']];
    return '<div class="set-grid">' + opts.map(function (o) {
        return '<div class="opt"><div><b>' + o[1] + '</b><small>' + o[2] + '</small></div><div class="sw' + (settings[o[0]] ? ' on' : '') + '" data-set="' + o[0] + '"></div></div>';
    }).join('') + '</div><div class="kb-h">Клавиши сотрудника полиции <small>Нажмите на клавишу, затем нужную кнопку на клавиатуре. Esc — отмена</small></div><div class="set-grid">' +
        cops.map(function (c) { return '<div class="opt"><div><b>' + c[1] + '</b><small>Действие с ближайшим человеком</small></div><button class="kb' + (kbWait === c[0] ? ' wait' : '') + '" data-kb="' + c[0] + '">' + (kbWait === c[0] ? '...' : keyName(ck[c[0]])) + '</button></div>'; }).join('') +
        '</div><button class="kb-reset" data-kbreset="1">Сбросить по умолчанию (U · J · K)</button><div class="keys">' + keys.map(function (k) { return '<div><kbd>' + k[0] + '</kbd>' + k[1] + '</div>'; }).join('') + '</div>';
}

function bindMenu() {
    var b = $('mBody');
    b.querySelectorAll('[data-cat]').forEach(function (x) { x.onclick = function () { shopCat = x.dataset.cat; renderMenu(); }; });
    b.querySelectorAll('[data-buy]').forEach(function (x) { x.onclick = function () { trig('cef:menu:buy', x.dataset.buy); }; });
    b.querySelectorAll('[data-sec]').forEach(function (x) { x.onclick = function () { shopSec = x.dataset.sec; renderMenu(); }; });
    b.querySelectorAll('[data-vip]').forEach(function (x) { x.onclick = function () { trig('cef:menu:vip', x.dataset.vip); }; });
    b.querySelectorAll('[data-pack]').forEach(function (x) { x.onclick = function () { trig('cef:menu:pack', Number(x.dataset.pack)); }; });
    b.querySelectorAll('[data-exm]').forEach(function (x) { x.onclick = function () { exN = Math.max(1, exN - 10); renderMenu(); }; });
    b.querySelectorAll('[data-exp]').forEach(function (x) { x.onclick = function () { exN += 10; renderMenu(); }; });
    var ei = b.querySelector('#exIn');
    if (ei) ei.onchange = function () { exN = Math.max(1, Math.floor(Number(ei.value) || 1)); renderMenu(); };
    b.querySelectorAll('[data-ex]').forEach(function (x) { x.onclick = function () { trig('cef:menu:exchange', exN); }; });
    b.querySelectorAll('[data-claim]').forEach(function (x) { x.onclick = function () { trig('cef:menu:claim', Number(x.dataset.claim)); }; });
    b.querySelectorAll('[data-lic]').forEach(function (x) { x.onclick = function () { trig('cef:menu:lic', x.dataset.lic); }; });
    b.querySelectorAll('[data-sim]').forEach(function (x) { x.onclick = function () { var inp = b.querySelector('#simIn'); trig('cef:sim:buy', x.dataset.sim, x.dataset.sim === 'custom' && inp ? inp.value.trim() : ''); }; });
    b.querySelectorAll('[data-top]').forEach(function (x) { x.onclick = function () { trig('cef:sim:topup', Number(x.dataset.top)); }; });
    var si = b.querySelector('#simIn');
    if (si) si.oninput = function () { var v = si.value.replace(/[^0-9]/g, '').slice(0, 6); if (v.length > 3) v = v.slice(0, 3) + '-' + v.slice(3); si.value = v; $('simOk').textContent = ''; if (v.length === 7) trig('cef:sim:check', v); };
    b.querySelectorAll('[data-kb]').forEach(function (x) { x.onclick = function () { kbWait = x.dataset.kb; renderMenu(); }; });
    b.querySelectorAll('[data-kbreset]').forEach(function (x) { x.onclick = function () { LS.set('cop_keys', '{}'); kbWait = null; copKeysSend(); renderMenu(); }; });
    b.querySelectorAll('[data-set]').forEach(function (x) {
        x.onclick = function () {
            var k = x.dataset.set;
            settings[k] = !settings[k];
            LS.set('ui_settings', JSON.stringify(settings));
            trig('cef:ui:set', k, settings[k]);
            renderMenu();
        };
    });
    var r = b.querySelector('[data-report]');
    if (r) r.onclick = openReport;
    b.querySelectorAll('[data-docs]').forEach(function (x) { x.onclick = function () { trig('cef:ui:open', 'docs'); }; });
}

function openReport() {
    var m = document.createElement('div');
    m.className = 'modal';
    m.innerHTML = '<div class="modal-box"><h3>Репорт администрации</h3><p>Опишите вопрос или нарушение. Если жалоба на игрока — укажите его ID.</p><textarea id="rpT" maxlength="300" placeholder="Текст обращения..."></textarea><div class="row2"><button id="rpC">Отмена</button><button class="go" id="rpS">Отправить</button></div></div>';
    $('menu').appendChild(m);
    $('rpT').focus();
    $('rpC').onclick = closeModal;
    $('rpS').onclick = function () {
        var t = $('rpT').value.trim();
        if (!t) return;
        trig('cef:menu:report', t);
        closeModal();
    };
}
function closeModal() { var m = document.querySelector('.modal'); if (m) m.remove(); }

window.uiSettings = function () { return settings; };
setTimeout(function () { Object.keys(settings).forEach(function (k) { trig('cef:ui:set', k, settings[k]); }); }, 1500);

/* ================= DOCUMENTS ================= */
var DOC_ICON = { passport: '🛂', drive: '🚗', military: '🎖️', med: '🩺', psych: '🧠', gun: '🔫', faction: '🪪' };
var DOC_CLS = { passport: 'd-pass', drive: 'd-drive', military: 'd-mil', med: 'd-med', psych: 'd-psy', gun: 'd-gun', faction: 'd-fac' };
var PHOTO_M = '<svg viewBox="0 0 60 72"><rect width="60" height="72" fill="#cfd6df"/><circle cx="30" cy="27" r="13" fill="#8a96a6"/><path d="M6 72c0-15 11-24 24-24s24 9 24 24z" fill="#8a96a6"/></svg>';
var PHOTO_F = '<svg viewBox="0 0 60 72"><rect width="60" height="72" fill="#e3d6df"/><path d="M14 34c0-14 7-22 16-22s16 8 16 22v10H14z" fill="#7d6a78"/><circle cx="30" cy="28" r="11" fill="#a690a0"/><path d="M6 72c0-15 11-24 24-24s24 9 24 24z" fill="#a690a0"/></svg>';

function kv(k, v, cls) { return '<div class="dk ' + (cls || '') + '"><small>' + k + '</small><b>' + esc(v) + '</b></div>'; }
function stamp(t) { return '<div class="stamp">' + esc(t) + '</div>'; }
function sign(n) { return '<div class="sign"><span>' + esc(n) + '</span><small>подпись владельца</small></div>'; }

function docCard(d, x) {
    var full = d.first + ' ' + d.last;
    var photo = '<div class="photo">' + (d.gender === 'Ж' ? PHOTO_F : PHOTO_M) + '</div>';
    var head = function (t, s) { return '<div class="dc-head"><div class="seal">SA</div><div><b>' + t + '</b><small>' + (s || 'STATE OF SAN ANDREAS') + '</small></div></div>'; };
    if (x.t === 'passport') {
        return '<div class="dcard d-pass"><div class="pp-cover"><div class="seal big">SA</div><b>ПАСПОРТ</b><small>ГРАЖДАНИНА ШТАТА САН-АНДРЕАС</small><small>PASSPORT</small></div>' +
            '<div class="pp-page">' + head('ПАСПОРТ ГРАЖДАНИНА', 'Серия ' + x.series + ' № ' + x.num) +
            '<div class="dc-main">' + photo + '<div class="dc-grid">' + kv('Фамилия', d.last || '—') + kv('Имя', d.first) + kv('Пол', d.gender) + kv('Дата рождения', d.birth) + kv('Место рождения', d.place, 'w2') + kv('Дата выдачи', x.issued) + kv('Действителен до', x.until) + '</div></div>' +
            '<div class="dc-foot">' + kv('Кем выдан', x.by, 'w2') + sign(full) + '</div>' +
            '<div class="mrz">P&lt;SAN' + esc((d.last || 'X').toUpperCase().replace(/[^A-Z]/g, 'X')) + '&lt;&lt;' + esc(d.first.toUpperCase().replace(/[^A-Z]/g, 'X')) + '&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;<br>' + x.series + x.num + '&lt;8SAN' + d.birth.replace(/\./g, '') + '&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</div>' + stamp('МЭРИЯ ЛС') + '</div></div>';
    }
    if (x.t === 'drive') {
        var all = ['A', 'B', 'C', 'D', 'E'];
        return '<div class="dcard d-drive plastic">' + head('ВОДИТЕЛЬСКОЕ УДОСТОВЕРЕНИЕ', 'DRIVER LICENSE · SAN ANDREAS') +
            '<div class="dc-main">' + photo + '<div class="dc-grid">' + kv('1. Фамилия', d.last || '—') + kv('2. Имя', d.first) + kv('3. Дата рождения', d.birth) + kv('5. Номер', x.num.slice(0, 2) + ' ' + x.num.slice(2)) + kv('4a. Выдано', x.issued) + kv('4b. Действует до', x.until) + '</div></div>' +
            '<div class="cats">' + all.map(function (c) { return '<span class="' + (x.cats.indexOf(c) >= 0 ? 'on' : '') + '">' + c + '</span>'; }).join('') + '</div>' +
            '<div class="dc-foot">' + kv('Выдал', x.by, 'w2') + sign(full) + '</div><div class="holo"></div></div>';
    }
    if (x.t === 'military') {
        return '<div class="dcard d-mil">' + head('ВОЕННЫЙ БИЛЕТ', 'Серия АС № ' + x.num) +
            '<div class="dc-main">' + photo + '<div class="dc-grid">' + kv('Фамилия', d.last || '—') + kv('Имя', d.first) + kv('Дата рождения', d.birth) + kv('Воинское звание', x.rank) + kv('Воинская часть', x.unit) + kv('Категория годности', x.fit) + '</div></div>' +
            '<div class="dc-foot">' + kv('Дата выдачи', x.issued) + kv('Военкомат', x.by) + sign(full) + '</div>' + stamp('ВОЕНКОМАТ') + '</div>';
    }
    if (x.t === 'med') {
        return '<div class="dcard d-med">' + head('МЕДИЦИНСКАЯ КНИЖКА', 'Pillbox Hill Medical Center · № ' + x.num) +
            '<div class="dc-main">' + photo + '<div class="dc-grid">' + kv('Фамилия', d.last || '—') + kv('Имя', d.first) + kv('Дата рождения', d.birth) + kv('Группа крови', x.blood) + kv('Заключение', x.status, 'ok') + kv('Действительна до', x.until) + '</div></div>' +
            '<div class="dc-foot">' + kv('Дата осмотра', x.issued) + kv('Врач', x.by) + sign(full) + '</div>' + stamp('ГОДЕН') + '</div>';
    }
    if (x.t === 'psych') {
        return '<div class="dcard d-psy paper">' + head('СПРАВКА', 'Психоневрологический диспансер ЛС · № ' + x.num) +
            '<div class="psy-text">Выдана гражданину(ке) <b>' + esc(full) + '</b>, ' + esc(d.birth) + ' г.р., в том, что он(а) <b>' + esc(x.status.toLowerCase()) + '</b>. Противопоказаний к владению оружием и управлению транспортом не выявлено.</div>' +
            '<div class="dc-grid three">' + kv('Дата выдачи', x.issued) + kv('Действительна до', x.until) + kv('Врач-психиатр', x.by) + '</div>' + stamp('ПНД ЛС') + '</div>';
    }
    if (x.t === 'gun') {
        return '<div class="dcard d-gun plastic">' + head('РАЗРЕШЕНИЕ НА ОРУЖИЕ', 'FIREARMS LICENSE · LSPD · № ' + x.num) +
            '<div class="dc-main">' + photo + '<div class="dc-grid">' + kv('Фамилия', d.last || '—') + kv('Имя', d.first) + kv('Дата рождения', d.birth) + kv('Категории', x.cls, 'w2') + kv('Выдано', x.issued) + kv('Действует до', x.until) + '</div></div>' +
            '<div class="dc-foot">' + kv('Выдал', x.by, 'w2') + sign(full) + '</div><div class="holo"></div></div>';
    }
    if (x.t === 'faction') {
        var f = x.fac || { n: x.by, s: '?', c: '#555' };
        return '<div class="dcard d-fac" style="--fc:' + f.c + '"><div class="fac-band"><div class="badge">' + esc(f.s) + '</div><div><b>СЛУЖЕБНОЕ УДОСТОВЕРЕНИЕ</b><small>' + esc(f.n) + '</small></div><div class="fac-no">№ ' + x.badge + '</div></div>' +
            '<div class="dc-main">' + photo + '<div class="dc-grid">' + kv('Фамилия', d.last || '—') + kv('Имя', d.first) + kv('Должность', x.pos) + kv('Жетон', x.badge) + kv('Дата выдачи', x.issued) + kv('Выдал', 'Администрация') + '</div></div>' +
            '<div class="fac-note">Предъявитель является действующим сотрудником ' + esc(f.n) + '. Просьба оказывать содействие.</div>' + stamp(f.s) + '</div>';
    }
    return '<div class="dcard">' + esc(x.title) + '</div>';
}

function renderDocs() {
    try { return _renderDocs(); } catch (e) { showErr('docs', e); }
}
function _renderDocs() {
    var d = DATA.docs;
    $('dTitle').textContent = d && !d.own ? 'ВАМ ПОКАЗЫВАЮТ ДОКУМЕНТЫ' : 'ДОКУМЕНТЫ';
    $('dSub').textContent = d && !d.own ? 'Владелец: ' + d.first + ' ' + d.last : 'Ваши документы, лицензии и удостоверения';
    if (!d) { $('dList').innerHTML = ''; $('dCard').innerHTML = '<div class="empty-t">Загрузка...</div>'; $('dActs').innerHTML = ''; return; }
    var list = d.docs || [];
    if (!d.own && typeof d.focus === 'number' && list[d.focus]) { list = [list[d.focus]]; docSel = 0; }
    if (!list.length) {
        $('dList').innerHTML = '';
        $('dCard').innerHTML = '<div class="d-empty"><div>📂</div><b>У вас пока нет документов</b><small>Паспорт выдают в мэрии, права — в автошколе, медкнижку — в больнице.</small></div>';
        $('dActs').innerHTML = '';
        return;
    }
    if (docSel >= list.length) docSel = 0;
    $('dList').innerHTML = list.map(function (x, i) {
        var sub = x.t === 'faction' && x.fac ? x.fac.s : x.until ? 'до ' + x.until : x.issued;
        return '<div class="d-it ' + (i === docSel ? 'active' : '') + '" data-di="' + i + '"><span class="d-ico">' + (DOC_ICON[x.t] || '📄') + '</span><div><b>' + esc(x.title) + '</b><small>' + esc(sub) + '</small></div></div>';
    }).join('');
    $('dList').querySelectorAll('[data-di]').forEach(function (el) { el.onclick = function () { docSel = Number(el.dataset.di); renderDocs(); }; });
    $('dCard').innerHTML = docCard(d, list[docSel]);
    $('dActs').innerHTML = d.own ? '<button class="d-btn" id="dShow">Показать игроку рядом</button>' : '';
    if ($('dShow')) $('dShow').onclick = function () { trig('cef:docs:show', docSel); };
}
$('dClose').onclick = closeAll;

/* ================= DEATH ================= */
window.deathShow = function (d) {
    var el = $('death');
    el.classList.add('show');
    $('dtReason').textContent = d.reason || 'Ранение';
    var s = Math.ceil((d.left || 0) / 1000);
    var ready = s <= 0;
    $('dtTime').textContent = ready ? '✓' : Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    $('dtLbl').textContent = ready ? 'можно в больницу' : 'до выбора';
    var c = 2 * Math.PI * 52;
    $('dtRing').style.strokeDasharray = c;
    $('dtRing').style.strokeDashoffset = c * (1 - Math.min(1, s / 120));
    $('dtHosp').classList.toggle('off', !ready);
    $('dtCall').classList.toggle('done', !!d.called);
    $('dtCall').querySelector('span:last-child').textContent = d.called ? 'Врач вызван' : 'Ждать врача';
    var st;
    if (d.called) st = d.medics > 0 ? 'Вызов принят диспетчером. Медиков на смене: <b>' + d.medics + '</b>. Ожидайте помощи.' : 'Вызов отправлен, но медиков на смене сейчас <b>нет</b>.' + (ready ? ' Можно отправиться в больницу.' : '');
    else st = ready ? 'Время вышло. Отправляйтесь в больницу или продолжайте ждать врача.' : 'Нажмите <b>E</b>, чтобы вызвать медиков. Через 2 минуты станет доступна больница.';
    if (d.coming) st = '🚑 Врач <b>' + esc(d.coming.n) + '</b> едет к вам · ' + d.coming.d + ' м. Не уходите в больницу — он доставит вас сам.';
    if (d.busy) st = '🚑 <b>' + esc(d.busy) + '</b>';
    $('dtHosp').classList.toggle('off', !ready || !!d.busy);
    $('dtStatus').innerHTML = st;
};
window.deathHide = function () { $('death').classList.remove('show'); };
$('dtCall').onclick = function () { trig('cef:death:call'); };
$('dtHosp').onclick = function () { if (!this.classList.contains('off')) trig('cef:death:hospital'); };

/* ================= FUEL ================= */
var FU = { d: null, t: 'ai92', l: 0, pay: 'cash' };
function fuelInit(d) {
    FU.d = d; FU.t = d.cur || 'ai92';
    var free = Math.max(0, d.max - d.fuel);
    if (d.station && d.station.stock !== null) free = Math.min(free, d.station.stock);
    var S = d.station || {};
    $('fuName').textContent = S.name || 'АЗС';
    $('fuSub').textContent = S.owner ? 'Владелец: ' + S.owner : 'Государственная заправка';
    if (S.stock !== null && S.stock !== undefined) {
        var pc = Math.round(S.stock / S.maxStock * 100);
        $('fuStock').innerHTML = '<span>Запас на станции</span><div class="fs-bar"><i style="width:' + pc + '%"></i></div><b>' + S.stock + ' л</b>' + (S.deficit ? '<em>ДЕФИЦИТ' + (S.owner ? '' : ' · цена ×1.5') + '</em>' : '');
        $('fuStock').className = 'fu-stock show' + (S.deficit ? ' low' : '');
    } else $('fuStock').className = 'fu-stock';
    FU.l = free;
    $('fuRange').max = free;
    renderFuel();
}
function renderFuel() {
    var d = FU.d;
    if (!d) return;
    var free = Math.max(0, d.max - d.fuel);
    if (d.station && d.station.stock !== null && d.station.stock !== undefined) free = Math.min(free, d.station.stock);
    FU.l = Math.max(0, Math.min(free, FU.l));
    var t = d.types.find(function (x) { return x.k === FU.t; }) || d.types[0];
    var sum = Math.ceil(FU.l * t.price);
    $('fuNow').textContent = d.fuel; $('fuFree').textContent = free;
    $('fuCur').style.width = (d.fuel / d.max * 100) + '%';
    $('fuAdd').style.width = (FU.l / d.max * 100) + '%';
    $('fuAdd').style.background = t.c;
    $('fuL').textContent = FU.l;
    $('fuRange').value = FU.l;
    $('fuCash').textContent = money(d.money);
    $('fuCard').textContent = money(d.bank);
    $('fuSum').textContent = money(sum);
    var have = FU.pay === 'card' ? d.bank : d.money;
    $('fuGo').classList.toggle('off', FU.l <= 0 || have < sum);
    $('fuTypes').innerHTML = d.types.map(function (x) {
        return '<div class="fu-t ' + (x.k === FU.t ? 'active' : '') + '" data-ft="' + x.k + '" style="--fc:' + x.c + '"><b>' + esc(x.n) + '</b><small>$' + x.price + ' / л</small></div>';
    }).join('');
    $('fuTypes').querySelectorAll('[data-ft]').forEach(function (el) { el.onclick = function () { FU.t = el.dataset.ft; renderFuel(); }; });
    document.querySelectorAll('.fu-pm').forEach(function (b) { b.classList.toggle('active', b.dataset.pay === FU.pay); });
}
$('fuRange').oninput = function () { FU.l = Number(this.value); renderFuel(); };
document.querySelectorAll('.fu-quick button').forEach(function (b) {
    b.onclick = function () { FU.l = b.dataset.q === 'full' ? 999 : Number(b.dataset.q); renderFuel(); };
});
document.querySelectorAll('.fu-pm').forEach(function (b) { b.onclick = function () { FU.pay = b.dataset.pay; renderFuel(); }; });
$('fuGo').onclick = function () { if (!this.classList.contains('off')) trig('cef:fuel:buy', FU.t, FU.l, FU.pay); };
$('fuClose').onclick = closeAll;

/* ================= BANK CARD VISUAL ================= */
function cardHtml(c, big) {
    return '<div class="bc ' + (big ? 'big' : '') + '"><div class="bc-shine"></div><div class="bc-top"><b>FLEECA</b><span>PLATINUM</span></div>' +
        '<div class="bc-chip"><i></i><i></i><i></i></div><div class="bc-nfc">)))</div>' +
        '<div class="bc-num">' + esc(c.number) + '</div>' +
        '<div class="bc-bot"><div><small>CARD HOLDER</small><b>' + esc(c.holder) + '</b></div><div><small>VALID</small><b>12/30</b></div><div class="bc-ps"><i></i><i></i></div></div></div>';
}
function txRow(x) {
    var pos = x.a >= 0;
    var ico = { dep: '⬇', wd: '⬆', in: '↙', out: '↗', card: '💳', biz: '🏧' }[x.t] || '•';
    return '<div class="tx"><span class="tx-i ' + (pos ? 'p' : 'n') + '">' + ico + '</span><div><b>' + esc(x.text || '') + '</b><small>' + esc(x.d) + '</small></div><em class="' + (pos ? 'p' : 'n') + '">' + (pos ? '+' : '−') + money(Math.abs(x.a)) + '</em></div>';
}
function renderCard(d) {
    $('bcard').innerHTML = cardHtml(d.card, true);
    $('cvInfo').innerHTML = '<div class="cv-bal"><small>Баланс карты</small><b>' + money(d.bank) + '</b><span>Наличные: ' + money(d.money) + '</span></div>' +
        '<div class="cv-pin ' + (d.card.hasPin ? 'ok' : '') + '">' + (d.card.hasPin ? '🔒 PIN-код установлен' : '⚠ PIN-код не задан — задайте в любом банкомате') + '</div>' +
        '<div class="cv-h"><b>Последние операции</b>' + (d.history && d.history.length ? d.history.map(txRow).join('') : '<small class="cv-empty">Операций пока нет</small>') + '</div>';
}
$('cardClose').onclick = closeAll;

/* ================= ATM ================= */
var ATM = { d: null, view: 'boot', input: '', op: null, to: '', msg: null, pinOld: '' };
function atmData(d) {
    var first = !ATM.d;
    ATM.d = d;
    ATM.msg = d.err ? { e: 1, t: d.err } : d.ok ? { e: 0, t: d.ok } : null;
    if (d.cash) { var c = $('atmCash'); c.classList.remove('go'); void c.offsetWidth; c.classList.add('go'); }
    if (d.auth) {
        if (ATM.view === 'pin' || ATM.view === 'boot' || ATM.view === 'insert' || ATM.view === 'newpin') ATM.view = 'menu';
        if (d.ok && (ATM.view === 'amount' || ATM.view === 'send')) ATM.view = 'done';
        if (d.ok && ATM.view === 'pinchange2') ATM.view = 'menu';
    } else if (d.noAcc) ATM.view = 'noacc';
    else if (d.needCard) ATM.view = 'nocard';
    else if (d.card && d.card.blocked) ATM.view = 'blocked';
    else if (first || ATM.view === 'nocard' || ATM.view === 'boot') ATM.view = d.card && !d.card.hasPin ? 'newpin' : 'insert';
    if (d.err && ATM.view === 'pin') ATM.input = '';
    $('atmName').textContent = d.atm.name + (d.atm.ownerName ? ' · владелец ' + d.atm.ownerName : '');
    renderAtm();
}
function atmBtn(id, label, cls) { return '<button class="ab ' + (cls || '') + '" data-a="' + id + '">' + label + '</button>'; }
function atmMsg() { return ATM.msg ? '<div class="am ' + (ATM.msg.e ? 'e' : 'o') + '">' + esc(ATM.msg.t) + '</div>' : ''; }
function dots(n) { var s = ''; for (var i = 0; i < 4; i++) s += '<i class="' + (i < n ? 'on' : '') + '"></i>'; return '<div class="pin-dots">' + s + '</div>'; }
function renderAtm() {
    var d = ATM.d, v = ATM.view, h = '', pad = false;
    $('atmCardIn').classList.toggle('in', !!(d && d.card && ['insert', 'nocard', 'noacc', 'boot'].indexOf(v) < 0));
    if (!d || v === 'boot') h = '<div class="as-c"><div class="spin"></div><p>Соединение с банком...</p></div>';
    else if (v === 'noacc') h = '<div class="as-c"><div class="as-ico">⚠</div><h3>Сервис недоступен</h3><p>Аккаунт не найден. Перезайдите на сервер.</p></div>';
    else if (v === 'nocard') h = '<div class="as-c"><div class="as-ico">💳</div><h3>Нет банковской карты</h3><p>Выпустите именную карту Fleeca Platinum прямо сейчас.</p>' + atmMsg() + '<div class="as-row">' + atmBtn('getcard', 'Выпустить карту · $' + d.cardFee, 'pri') + '</div></div>';
    else if (v === 'blocked') h = '<div class="as-c"><div class="as-ico">⛔</div><h3>Карта заблокирована</h3><p>Слишком много неверных попыток. Повторите через ' + d.card.blocked + ' мин.</p></div>';
    else if (v === 'insert') h = '<div class="as-c"><div class="as-card">' + cardHtml(d.card) + '</div><h3>Добро пожаловать</h3><p>Вставьте карту, чтобы продолжить</p><div class="as-row">' + atmBtn('insert', 'Вставить карту', 'pri') + '</div>' + (d.atm.forSale ? '<p class="as-sale">Этот банкомат продаётся за ' + money(d.atm.price) + ' — ' + '<a data-a="bizinfo">подробнее</a></p>' : '') + '</div>';
    else if (v === 'pin' || v === 'newpin' || v === 'pinchange1' || v === 'pinchange2') {
        pad = true;
        var t = { pin: 'Введите PIN-код', newpin: 'Придумайте PIN-код', pinchange1: 'Введите текущий PIN', pinchange2: 'Введите новый PIN' }[v];
        h = '<div class="as-c"><h3>' + t + '</h3><p>' + (v === 'newpin' ? 'Запомните его — он понадобится при каждой операции' : '4 цифры') + '</p>' + dots(ATM.input.length) + atmMsg() + '</div>';
    } else if (v === 'menu') {
        h = '<div class="as-menu"><div class="as-bal"><small>Доступно на карте</small><b>' + money(d.bank) + '</b><span>Наличные при себе: ' + money(d.money) + '</span></div>' + atmMsg() +
            '<div class="as-grid">' + atmBtn('wd', '<i>⬆</i>Снять наличные') + atmBtn('dep', '<i>⬇</i>Внести наличные') + atmBtn('send', '<i>↗</i>Перевод') + atmBtn('hist', '<i>🧾</i>История') + atmBtn('pinc', '<i>🔑</i>Сменить PIN') + atmBtn(d.atm.own || d.atm.forSale ? 'biz' : 'info', d.atm.own ? '<i>🏧</i>Мой бизнес' : d.atm.forSale ? '<i>🏷</i>Купить банкомат' : '<i>ℹ</i>О банкомате') + '</div>' +
            (d.atm.fee && !d.atm.own && !d.atm.forSale ? '<p class="as-fee">Комиссия владельца за снятие: ' + d.atm.fee + '%</p>' : '') + '</div>';
    } else if (v === 'amount') {
        pad = true;
        var quick = ATM.op === 'wd' ? [100, 500, 1000, 5000] : [100, 500, 1000, 'all'];
        h = '<div class="as-c"><h3>' + (ATM.op === 'wd' ? 'Снятие наличных' : 'Внесение наличных') + '</h3><div class="as-amount">$' + (ATM.input || '0') + '</div>' +
            '<div class="as-row q">' + quick.map(function (x) { return atmBtn('q:' + x, x === 'all' ? 'Всё' : '$' + x); }).join('') + '</div>' + atmMsg() +
            '<div class="as-row">' + atmBtn('back', 'Назад') + atmBtn('confirm', 'Подтвердить', 'pri') + '</div></div>';
    } else if (v === 'send') {
        h = '<div class="as-c"><h3>Перевод</h3><p>По номеру карты (16 цифр) или телефона (123-456)</p><input class="as-in" id="atTo" placeholder="Номер карты или телефона" value="' + esc(ATM.to) + '" maxlength="19"><input class="as-in" id="atSum" placeholder="Сумма, $" value="' + esc(ATM.input) + '" maxlength="9">' + atmMsg() +
            '<div class="as-row">' + atmBtn('back', 'Назад') + atmBtn('sendgo', 'Перевести', 'pri') + '</div></div>';
    } else if (v === 'done') {
        h = '<div class="as-c"><div class="as-ico ok">✓</div><h3>Операция выполнена</h3>' + atmMsg() + '<p>Баланс: <b>' + money(d.bank) + '</b></p><div class="as-row">' + atmBtn('back', 'В меню') + atmBtn('exit', 'Завершить', 'pri') + '</div></div>';
    } else if (v === 'hist') {
        h = '<div class="as-menu"><h3>История операций</h3><div class="as-hist">' + (d.history && d.history.length ? d.history.map(txRow).join('') : '<p>Операций пока нет</p>') + '</div><div class="as-row">' + atmBtn('back', 'Назад') + '</div></div>';
    } else if (v === 'biz' || v === 'bizinfo' || v === 'info') {
        var A = d.atm;
        if (A.own) h = '<div class="as-menu"><h3>🏧 ' + esc(A.name) + '</h3><div class="biz-g"><div><small>Касса</small><b>' + money(A.balance) + '</b></div><div><small>Заработано всего</small><b>' + money(A.earned) + '</b></div><div><small>Комиссия</small><b>' + A.fee + '%</b></div></div>' + atmMsg() +
            '<div class="as-row">' + atmBtn('fee-', '− 0.5%') + atmBtn('fee+', '+ 0.5%') + atmBtn('collect', 'Забрать доход', 'pri') + '</div><div class="as-row">' + atmBtn('back', 'Назад') + atmBtn('sell', 'Продать гос-ву (60%)', 'dan') + '</div></div>';
        else if (A.forSale) h = '<div class="as-menu"><h3>🏷 Банкомат продаётся</h3><p class="as-p">Владелец получает комиссию с каждого снятия наличных (0–5%, настраивается). Деньги копятся в кассе, их можно забрать на карту.</p><div class="biz-g"><div><small>Цена</small><b>' + money(A.price) + '</b></div><div><small>Ваша карта</small><b>' + money(d.bank) + '</b></div></div>' + atmMsg() +
            '<div class="as-row">' + atmBtn('back', 'Назад') + (d.auth ? atmBtn('buy', 'Купить', 'pri') : '') + '</div>' + (d.auth ? '' : '<p class="as-p">Вставьте карту и введите PIN, чтобы купить.</p>') + '</div>';
        else h = '<div class="as-menu"><h3>ℹ ' + esc(A.name) + '</h3><p class="as-p">Владелец: <b>' + esc(A.ownerName || '—') + '</b><br>Комиссия за снятие: <b>' + A.fee + '%</b></p><div class="as-row">' + atmBtn('back', 'Назад') + '</div></div>';
    }
    $('atmScr').innerHTML = h;
    $('atmPad').innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map(function (k) {
        return '<button class="pk ' + (k === 'C' ? 'c' : k === 'OK' ? 'ok' : '') + '" data-k="' + k + '"' + (pad ? '' : ' disabled') + '>' + k + '</button>';
    }).join('');
    $('atmPad').querySelectorAll('[data-k]').forEach(function (b) { b.onclick = function () { atmKey(b.dataset.k); }; });
    $('atmScr').querySelectorAll('[data-a]').forEach(function (b) { b.onclick = function () { atmAct(b.dataset.a); }; });
    var to = $('atTo'), sm = $('atSum');
    if (to) { to.oninput = function () { ATM.to = to.value; }; sm.oninput = function () { ATM.input = sm.value.replace(/\D/g, ''); sm.value = ATM.input; }; }
}
function atmKey(k) {
    var v = ATM.view, pinMode = ['pin', 'newpin', 'pinchange1', 'pinchange2'].indexOf(v) >= 0;
    if (k === 'C') { ATM.input = ATM.input.slice(0, -1); return renderAtm(); }
    if (k === 'OK') {
        if (pinMode) {
            if (ATM.input.length !== 4) return;
            if (v === 'pinchange1') { ATM.pinOld = ATM.input; ATM.input = ''; ATM.view = 'pinchange2'; ATM.msg = null; return renderAtm(); }
            if (v === 'pinchange2') { trig('cef:atm:pinchange', ATM.pinOld, ATM.input); ATM.input = ''; return; }
            trig('cef:atm:pin', ATM.input); ATM.input = ''; return renderAtm();
        }
        if (v === 'amount') return atmAct('confirm');
        return;
    }
    if (pinMode && ATM.input.length >= 4) return;
    if (v === 'amount' && ATM.input.length >= 8) return;
    if (!ATM.input && k === '0' && v === 'amount') return;
    ATM.input += k;
    renderAtm();
}
function atmAct(a) {
    var d = ATM.d;
    ATM.msg = null;
    if (a === 'getcard') return trig('cef:atm:getcard');
    if (a === 'insert') { ATM.view = 'pin'; ATM.input = ''; return renderAtm(); }
    if (a === 'wd' || a === 'dep') { ATM.op = a; ATM.view = 'amount'; ATM.input = ''; return renderAtm(); }
    if (a === 'send') { ATM.view = 'send'; ATM.input = ''; ATM.to = ''; return renderAtm(); }
    if (a === 'biz' || a === 'bizinfo') return trig('cef:biz:open', 'atm', d.atm.id);
    if (a === 'hist' || a === 'info') { ATM.view = a; return renderAtm(); }
    if (a === 'pinc') { ATM.view = 'pinchange1'; ATM.input = ''; return renderAtm(); }
    if (a === 'back') { ATM.view = d.auth ? 'menu' : 'insert'; ATM.input = ''; return renderAtm(); }
    if (a === 'exit') return closeAll();
    if (a.indexOf('q:') === 0) { var q = a.slice(2); ATM.input = String(q === 'all' ? Math.floor(d.money) : q); return renderAtm(); }
    if (a === 'confirm') { if (Number(ATM.input) > 0) trig('cef:atm:op', ATM.op, Number(ATM.input), ''); return; }
    if (a === 'sendgo') { if (Number(ATM.input) > 0 && ATM.to) trig('cef:atm:op', 'send', Number(ATM.input), ATM.to); return; }
    if (a === 'buy' || a === 'collect' || a === 'sell') return trig('cef:atm:biz', a, '');
    if (a === 'fee-' || a === 'fee+') return trig('cef:atm:biz', 'fee', d.atm.fee + (a === 'fee+' ? 0.5 : -0.5));
}
document.addEventListener('keydown', function (e) {
    if (current !== 'atm' || /INPUT/.test(document.activeElement && document.activeElement.tagName)) return;
    if (/^\d$/.test(e.key)) atmKey(e.key);
    else if (e.key === 'Backspace') atmKey('C');
    else if (e.key === 'Enter') atmKey('OK');
});
$('atmClose').onclick = closeAll;

/* ================= BUSINESS MENU ================= */
var BZ = { d: null, tab: 'main', msg: null, order: 500 };
function bizData(d) {
    if (!BZ.d || BZ.d.kind !== d.kind || BZ.d.id !== d.id) BZ.tab = 'main';
    BZ.d = d;
    BZ.msg = d.err ? { e: 1, t: d.err } : d.ok ? { e: 0, t: d.ok } : null;
    renderBiz();
}
function bzTabs(d) {
    var t = [['main', '📊', 'Обзор']];
    if (d.own) {
        if (d.stock) t.push(['stock', d.kind === 'fuel' ? '🛢' : '📦', 'Склад']);
        if (d.assort) t.push(['assort', '🏷', 'Ассортимент']);
        t.push(['set', '⚙', 'Настройки'], ['log', '🧾', 'Журнал']);
    }
    return '<nav class="bz-tabs">' + t.map(function (x) { return '<button class="' + (BZ.tab === x[0] ? 'active' : '') + '" data-bt="' + x[0] + '"><i>' + x[1] + '</i>' + x[2] + '</button>'; }).join('') + '</nav>';
}
function renderBiz() {
    var d = BZ.d;
    if (!d) return;
    var head = '<header class="bz-head"><div class="bz-ico">' + d.i + '</div><div><small>' + esc(d.n) + ' · #' + d.id + '</small><h2>' + esc(d.name) + '</h2>' +
        '<span class="bz-tag ' + (d.own ? 'own' : d.forSale ? 'sale' : '') + '">' + (d.own ? 'Ваш бизнес' : d.forSale ? 'Продаётся' : 'Владелец: ' + esc(d.ownerName)) + '</span></div>' +
        '<div class="m-close" id="bzClose">Закрыть <span>ESC</span></div></header>';
    var msg = BZ.msg ? '<div class="bz-msg ' + (BZ.msg.e ? 'e' : 'o') + '">' + esc(BZ.msg.t) + '</div>' : '';
    var body = '';
    if (BZ.tab === 'main') {
        var tiles = [];
        if (d.own) tiles.push({ l: 'Касса', v: money(d.balance), big: 1 }, { l: 'Заработано всего', v: money(d.earned) });
        d.stats.forEach(function (s) { tiles.push(s); });
        body = '<div class="bz-tiles">' + tiles.map(function (x) { return '<div class="bz-tile ' + (x.big ? 'big' : '') + (x.warn ? ' warn' : '') + '"><small>' + esc(x.l) + '</small><b>' + esc(x.v) + '</b></div>'; }).join('') + '</div>';
        if (d.own) body += '<div class="bz-acts"><button class="bz-btn pri" data-ba="collect">💰 Забрать выручку на карту</button></div>';
        else if (d.forSale) body += '<div class="bz-buy"><div><small>Цена бизнеса</small><b>' + money(d.price) + '</b><span>На вашей карте: ' + money(d.myBank) + '</span></div>' +
            '<p>' + (d.kind === 'fuel' ? 'Вы получаете всю выручку с продажи топлива, сами ставите цены и заказываете поставки. Если топливо закончится — АЗС перестанет продавать.' : d.kind === 'atm' ? 'Вы получаете комиссию с каждого снятия наличных другими игроками. Размер комиссии ставите сами.' : 'Вся выручка магазина — ваша. Вы ставите наценку, выбираете ассортимент и заказываете поставки товара. Пустой склад — нет продаж.') + '</p>' +
            '<button class="bz-btn pri" data-ba="buy"' + (d.myBank < d.price ? ' disabled' : '') + '>Купить за ' + money(d.price) + '</button></div>';
        else body += '<p class="bz-p">Этот бизнес принадлежит игроку <b>' + esc(d.ownerName) + '</b>.</p>';
    } else if (BZ.tab === 'stock' && d.stock) {
        var S = d.stock, pc = Math.round(S.cur / S.max * 100);
        var mn = S.unit === 'л' ? 100 : 10, ov = Math.max(mn, Math.min(BZ.order, Math.max(mn, S.max - S.cur)));
        body = '<div class="bz-tank"><div class="bz-tank-v"><i style="height:' + pc + '%" class="' + (S.deficit ? 'low' : '') + '"></i><span>' + pc + '%</span></div>' +
            '<div><small>' + (S.title || 'Запас') + '</small><b>' + S.cur + ' / ' + S.max + ' ' + (S.unit || 'л') + '</b>' + (S.deficit ? '<em>Дефицит! Закажите поставку</em>' : '') +
            '<div class="bz-order"><label>Заказать у поставщика · $' + S.wholesale + ' за ' + (S.unit === 'л' ? 'литр' : 'единицу') + '</label><div class="bz-row"><input type="range" min="' + mn + '" max="' + Math.max(mn, S.max - S.cur) + '" step="' + mn + '" value="' + ov + '" id="bzOrd"><b id="bzOrdV">' + ov + ' ' + S.unit + '</b></div>' +
            '<button class="bz-btn pri" data-ba="order">Оформить заказ · <span id="bzOrdC">' + money(ov * S.wholesale) + '</span></button><small class="bz-note">Списывается из кассы, если не хватает — с карты. Скоро поставки будут возить дальнобойщики.</small></div></div></div>' +
            '<h4 class="bz-h4">Заказы</h4><div class="bz-list">' + (S.orders.length ? S.orders.map(function (o) {
                var st = { pending: ['Ожидает', 'w'], taken: ['В пути', 'b'], done: ['Доставлен', 'o'], cancel: ['Отменён', 'e'] }[o.s] || [o.s, ''];
                return '<div class="bz-li"><span>' + (S.unit === 'л' ? '🛢 ' : '📦 ') + o.l + ' ' + S.unit + '</span><small>' + esc(o.d) + '</small><em class="' + st[1] + '">' + st[0] + '</em></div>';
            }).join('') : '<p class="bz-p">Заказов пока не было</p>') + '</div>';
    } else if (BZ.tab === 'assort' && d.assort) {
        body = '<p class="bz-p" style="margin-bottom:12px">Выключите товар, чтобы убрать его с витрины. Цены задаются наценкой в «Настройках».</p><div class="bz-assort">' + d.assort.map(function (x) {
            return '<div class="bz-as ' + (x.on ? '' : 'off') + '"><span class="i">' + icoHtml(x) + '</span><div><b>' + esc(x.n) + '</b><small>' + money(x.price) + '</small></div><button class="bz-sw ' + (x.on ? 'on' : '') + '" data-tg="' + x.k + '"><i></i></button></div>';
        }).join('') + '</div>';
    } else if (BZ.tab === 'set') {
        body = d.settings.map(function (s) {
            return '<div class="bz-set"><div class="bz-set-top"><label>' + esc(s.l) + '</label><b id="bzv_' + s.k + '">' + s.v + s.unit + '</b></div>' +
                '<input type="range" min="' + s.min + '" max="' + s.max + '" step="' + s.step + '" value="' + s.v + '" data-set="' + s.k + '" data-unit="' + s.unit + '">' +
                (s.hint ? '<small>' + esc(s.hint) + '</small>' : '') + '<button class="bz-btn" data-save="' + s.k + '">Сохранить</button></div>';
        }).join('') +
            '<div class="bz-set"><label>Название бизнеса</label><div class="bz-row"><input class="bz-in" id="bzName" value="' + esc(d.name) + '" maxlength="32"><button class="bz-btn" data-ba="rename">Переименовать</button></div></div>' +
            '<div class="bz-set danger"><label>Продать государству</label>' +
            '<div class="bz-sell"><div><small>Гос. стоимость</small><b>' + money(d.sell.price) + '</b></div><div class="neg"><small>Налог в казну ' + d.sell.rate + '%</small><b>−' + money(d.sell.tax) + '</b></div><div><small>Касса</small><b>+' + money(d.balance) + '</b></div><div class="tot"><small>Вы получите</small><b>' + money(d.sell.get) + '</b></div></div>' +
            '<small>Деньги придут на банковскую карту. Действие необратимо.</small><button class="bz-btn dan" data-ba="sell">Продать бизнес</button></div>';
    } else if (BZ.tab === 'log') {
        body = '<div class="bz-list">' + (d.log && d.log.length ? d.log.map(function (x) {
            return '<div class="bz-li"><span>' + esc(x.text) + '</span><small>' + esc(x.d) + '</small>' + (x.a ? '<em class="' + (x.a > 0 ? 'o' : 'e') + '">' + (x.a > 0 ? '+' : '−') + money(Math.abs(x.a)) + '</em>' : '<em></em>') + '</div>';
        }).join('') : '<p class="bz-p">Записей пока нет</p>') + '</div>';
    }
    $('bzBox').innerHTML = head + '<div class="bz-wrap">' + bzTabs(d) + '<div class="bz-body">' + msg + body + '</div></div>';
    $('bzClose').onclick = closeAll;
    $('bzBox').querySelectorAll('[data-bt]').forEach(function (b) { b.onclick = function () { BZ.tab = b.dataset.bt; BZ.msg = null; renderBiz(); }; });
    $('bzBox').querySelectorAll('[data-set]').forEach(function (r) { r.oninput = function () { $('bzv_' + r.dataset.set).textContent = r.value + r.dataset.unit; }; });
    $('bzBox').querySelectorAll('[data-save]').forEach(function (b) { b.onclick = function () { var r = $('bzBox').querySelector('[data-set="' + b.dataset.save + '"]'); trig('cef:biz:act', 'set', b.dataset.save + ':' + r.value); }; });
    $('bzBox').querySelectorAll('[data-tg]').forEach(function (b) { b.onclick = function () { trig('cef:biz:act', 'toggle', b.dataset.tg); }; });
    var ord = $('bzOrd');
    if (ord) ord.oninput = function () { BZ.order = Number(ord.value); $('bzOrdV').textContent = ord.value + ' ' + d.stock.unit; $('bzOrdC').textContent = money(ord.value * d.stock.wholesale); };
    $('bzBox').querySelectorAll('[data-ba]').forEach(function (b) {
        b.onclick = function () {
            var a = b.dataset.ba;
            if (a === 'sell' && !b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Точно продать? Нажмите ещё раз'; return; }
            if (a === 'order') return trig('cef:biz:act', 'order', $('bzOrd').value);
            if (a === 'rename') return trig('cef:biz:act', 'rename', $('bzName').value);
            trig('cef:biz:act', a, '');
        };
    });
}

/* ================= SHOP WINDOW ================= */
var SH = { d: null, pay: 'cash', qty: {} };
function shopData(d) { SH.d = d; renderShop(); }
function renderShop() {
    var d = SH.d;
    if (!d) return;
    var gun = d.kind === 'gun';
    var pc = Math.round(d.stock / d.max * 100);
    var msg = d.err ? '<div class="bz-msg e">' + esc(d.err) + '</div>' : d.ok ? '<div class="bz-msg o">' + esc(d.ok) + '</div>' : '';
    var h = '<header class="sh-head ' + (gun ? 'gun' : '') + '"><div class="sh-logo">' + (gun ? '🔫' : '🛒') + '</div><div><small>' + esc(d.title) + '</small><h2>' + esc(d.name) + '</h2>' +
        '<span class="sh-own">' + (d.own ? 'Ваш магазин' : d.owner ? 'Владелец: ' + esc(d.owner) : 'Государственный') + '</span></div>' +
        '<div class="sh-stock ' + (d.deficit ? 'low' : '') + '"><small>Товар на складе</small><div class="fs-bar"><i style="width:' + pc + '%"></i></div><b>' + d.stock + ' шт.' + (d.deficit ? ' · дефицит' : '') + '</b></div>' +
        '<div class="m-close" id="shClose">Закрыть <span>ESC</span></div></header>';
    if (gun) h += '<div class="sh-lic ' + (d.lic ? 'ok' : '') + '">' + (d.lic ? '✓ Лицензия на оружие проверена' : '⚠ Нет лицензии на оружие — огнестрел недоступен. Холодное оружие, патроны и броня — без лицензии') + '</div>';
    h += msg + '<div class="sh-grid">' + d.items.map(function (x) {
        var block = x.off || (x.lic && !d.lic) || d.stock <= 0;
        var q = SH.qty[x.k] || 1, single = /^(pistol|smg|knife|bat|armour|phone|gloves)$/.test(x.k);
        return '<div class="sh-it ' + (block ? 'dis' : '') + '"><div class="sh-ico">' + icoHtml(x) + '</div><b>' + esc(x.n) + (x.pack > 1 ? ' <em>x' + x.pack + '</em>' : '') + '</b>' +
            '<span class="sh-pr">' + money(x.price) + '</span>' + (x.lic ? '<span class="sh-tag">Лицензия</span>' : '') +
            (x.off ? '<span class="sh-na">Нет в продаже</span>' : '<div class="sh-buy">' + (single ? '' : '<div class="sh-q"><button data-qm="' + x.k + '">−</button><span>' + q + '</span><button data-qp="' + x.k + '">+</button></div>') +
                '<button class="sh-b" data-buy="' + x.k + '"' + (block ? ' disabled' : '') + '>Купить' + (q > 1 && !single ? ' · ' + money(x.price * q) : '') + '</button></div>') + '</div>';
    }).join('') + '</div>' +
        '<footer class="sh-foot"><div class="fu-pay sh-pay"><button class="fu-pm ' + (SH.pay === 'cash' ? 'active' : '') + '" data-spay="cash"><span>💵 Наличные</span><b>' + money(d.money) + '</b></button>' +
        '<button class="fu-pm ' + (SH.pay === 'card' ? 'active' : '') + '" data-spay="card"><span>💳 Карта</span><b>' + money(d.bank) + '</b></button></div>' +
        ((d.own || d.forSale) ? '<button class="bz-btn ' + (d.forSale ? 'pri' : '') + '" id="shBiz">' + (d.own ? '⚙ Управление бизнесом' : '🏷 Купить этот бизнес') + '</button>' : '') + '</footer>';
    $('shBox').innerHTML = h;
    $('shClose').onclick = closeAll;
    if ($('shBiz')) $('shBiz').onclick = function () { trig('cef:biz:open', d.kind, d.id); };
    $('shBox').querySelectorAll('[data-spay]').forEach(function (b) { b.onclick = function () { SH.pay = b.dataset.spay; renderShop(); }; });
    $('shBox').querySelectorAll('[data-qp]').forEach(function (b) { b.onclick = function () { SH.qty[b.dataset.qp] = Math.min(10, (SH.qty[b.dataset.qp] || 1) + 1); renderShop(); }; });
    $('shBox').querySelectorAll('[data-qm]').forEach(function (b) { b.onclick = function () { SH.qty[b.dataset.qm] = Math.max(1, (SH.qty[b.dataset.qm] || 1) - 1); renderShop(); }; });
    $('shBox').querySelectorAll('[data-buy]').forEach(function (b) { b.onclick = function () { trig('cef:shop:buy', b.dataset.buy, SH.qty[b.dataset.buy] || 1, SH.pay); }; });
}

window.phoneJobs = function (json) {
    try { DATA.jobs = typeof json === 'string' ? JSON.parse(json) : json; } catch (e) { return; }
    if (phApp === 'gps' && gpsTab === 'jobs') renderApp();
};
window.jobMenu = function (json) {
    var box = document.getElementById('jobMenu');
    if (!json) { if (box) box.remove(); return; }
    var d = typeof json === 'string' ? JSON.parse(json) : json;
    if (!box) { box = document.createElement('div'); box.id = 'jobMenu'; document.body.appendChild(box); }
    var start = '';
    if (d.off) start = '<div class="job-st" style="color:#ff6b6b">Работа временно закрыта администрацией</div>';
    else if (d.working === d.id) start = '<button class="btn ghost" data-jm="quit">Закончить смену</button>';
    else if (d.working) start = '<div class="job-st">Сначала закончите текущую смену</div>';
    else if (d.opts) start = '<div class="jm-sel">' + d.opts.map(function (r) { return '<button class="jm-opt' + (r.locked ? ' lk' : '') + '" ' + (r.locked ? 'disabled' : 'data-jm="start" data-r="' + r.id + '"') + '><b>' + esc(r.n) + '</b><small>' + (r.locked ? '🔒 Откроется на ' + r.need + ' уровне' : esc(r.sub)) + '</small></button>'; }).join('') + '</div>';
    else start = '<button class="btn" data-jm="start">Начать работу</button>';
    box.innerHTML = '<div class="jm-box"><div class="job-h"><span class="job-i">' + d.i + '</span><div><b>' + esc(d.n) + '</b><small>' + esc(d.pay) + '</small></div></div>' +
        '<p>' + esc(d.d) + '</p>' + (d.need && d.myLvl < d.need ? '<div class="job-st" style="color:#ff6b6b">🔒 Доступно с ' + d.need + ' уровня персонажа (у вас ' + d.myLvl + ')</div>' : '') + (d.lv ? '<div class="jm-lv"><div class="jm-lvh"><b>Мастерство: ' + d.lv.lvl + ' / ' + d.lv.max + '</b><span>оплата ×' + d.lv.mult.toFixed(2) + '</span></div><div class="jm-bar"><i style="width:' + (d.lv.next === null ? 100 : Math.round((d.lv.xp - d.lv.cur) / (d.lv.next - d.lv.cur) * 100)) + '%"></i></div><small>' + (d.lv.next === null ? 'Максимальный уровень' : 'До следующего уровня: ' + (d.lv.next - d.lv.xp) + (d.id === 'bus' ? ' ост.' : ' шт. урожая')) + '</small></div>' : '') + (d.done ? '<div class="job-st">Вы выполнили: ' + d.done + ' · заработали ' + money(d.earned) + '</div>' : '') +
        start + '<button class="btn ghost" data-jm="close">Закрыть</button></div>';
    box.querySelectorAll('[data-jm]').forEach(function (b) {
        b.onclick = function () {
            if (b.dataset.jm === 'start') trig('cef:job:start', d.id, b.dataset.r || '');
            else if (b.dataset.jm === 'quit') trig('cef:job:quit');
            else trig('cef:job:close');
        };
    });
};
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.getElementById('jobMenu')) trig('cef:job:close'); });

window.jobSort = function (n) {
    var box = document.getElementById('jobSort');
    if (box) box.remove();
    n = Number(n) || 0;
    if (!n) return;
    var C = [['A', '#ff6b6b'], ['B', '#ffb357'], ['C', '#ffe066'], ['D', '#8fd14f'], ['E', '#5aa9ff'], ['F', '#c13dff']];
    var Q = [];
    for (var i = 0; i < n; i++) Q.push(C[Math.floor(Math.random() * C.length)][0] + '-' + (1 + Math.floor(Math.random() * 3)));
    var cells = [];
    for (var k = 1; k <= 3; k++) C.forEach(function (c) { cells.push([c[0] + '-' + k, c[1]]); });
    var idx = 0, total = 4000 + n * 1700, t0 = Date.now(), done = false;
    box = document.createElement('div'); box.id = 'jobSort'; document.body.appendChild(box);
    function finish(ok) {
        if (done) return; done = true;
        box.querySelector('.js-box').classList.add(ok ? 'win' : 'lose');
        box.querySelector('.js-h small').textContent = ok ? 'Готово! Несите ящик к фургону' : 'Ошибка сортировки';
        setTimeout(function () { box.remove(); trig('cef:job:sort', ok ? 1 : 0); }, 650);
    }
    function draw() {
        box.innerHTML = '<div class="js-box"><div class="js-h"><b>📦 Сортировка посылок</b><small>Разложите посылки по ячейкам стеллажа</small></div>' +
            '<div class="js-q">' + Q.map(function (q, i) { var c = cells.find(function (x) { return x[0] === q; }); return '<span class="js-p' + (i < idx ? ' ok' : i === idx ? ' cur' : '') + '" style="--c:' + c[1] + '">' + q + '</span>'; }).join('') + '</div>' +
            '<div class="js-t"><i id="jsT"></i></div>' +
            '<div class="js-g">' + cells.map(function (c) { return '<button class="js-c" data-c="' + c[0] + '" style="--c:' + c[1] + '">' + c[0] + '</button>'; }).join('') + '</div></div>';
        box.querySelectorAll('[data-c]').forEach(function (b) {
            b.onclick = function () {
                if (done) return;
                if (b.dataset.c !== Q[idx]) { b.classList.add('bad'); return finish(false); }
                idx++;
                if (idx >= Q.length) { draw(); return finish(true); }
                draw();
            };
        });
    }
    draw();
    (function tick() {
        if (done || !document.body.contains(box)) return;
        var k = 1 - (Date.now() - t0) / total;
        var el = document.getElementById('jsT');
        if (el) { el.style.width = Math.max(0, k * 100) + '%'; el.style.background = k > 0.35 ? '#8fd14f' : '#ff6b6b'; }
        if (k <= 0) return finish(false);
        requestAnimationFrame(tick);
    })();
};

window.houseMenu = function (json) {
    var box = document.getElementById('houseMenu');
    if (!json) { if (box) box.remove(); return; }
    var w = typeof json === 'string' ? JSON.parse(json) : json, d = w.d;
    if (!box) { box = document.createElement('div'); box.id = 'houseMenu'; document.body.appendChild(box); }
    var html = '';
    if (w.t === 'hotel') {
        html = '<div class="hm-h"><span class="hm-i">🛏️</span><div><b>' + esc(d.n) + '</b><small>' + money(d.price) + ' / сутки · оплата наличными</small></div></div>' +
            '<p class="hm-p">Снимите номер — в нём можно отдохнуть, а при входе в игру появляться прямо в номере.</p>' +
            '<div class="hm-days">' + [1, 3, 7, d.max].map(function (n) { return '<button class="hm-o" data-rent="' + n + '"><b>' + n + ' ' + (n === 1 ? 'сутки' : 'суток') + '</b><small>' + money(n * d.price) + '</small></button>'; }).join('') + '</div>' +
            '<div class="hm-cash">Наличные: <b>' + money(d.money) + '</b></div>';
    } else {
        html = '<div class="hm-h"><span class="hm-i">' + (d.list.length > 1 ? '🏢' : '🏠') + '</span><div><b>' + esc(d.title) + '</b><small>Наличные ' + money(d.money) + ' · Банк ' + money(d.bank) + '</small></div></div>' +
            '<div class="hm-list">' + d.list.map(function (h) {
                var st = h.mine ? '<span class="hm-st me">Ваш</span>' : h.owner ? '<span class="hm-st busy">Владелец: ' + esc(h.owner) + '</span>' : '<span class="hm-st free">Продаётся</span>';
                var btns = '';
                if (h.mine) btns = '<button class="btn" data-ha="enter" data-id="' + h.id + '">Войти</button><button class="btn ghost" data-ha="lock" data-id="' + h.id + '">' + (h.locked ? '🔒 Заперто' : '🔓 Открыто') + '</button><button class="btn ghost hm-sell" data-ha="sell" data-id="' + h.id + '">Продать за ' + money(h.price * 0.6) + '</button>';
                else if (h.owner) btns = (h.locked ? '<button class="btn ghost" data-ha="knock" data-id="' + h.id + '">Постучать</button>' : '<button class="btn" data-ha="enter" data-id="' + h.id + '">Войти в гости</button>');
                else btns = '<button class="btn ghost" disabled>' + (h.auction ? 'Выставлено на аукцион — в агентстве недвижимости' : 'Покупка — в агентстве недвижимости') + '</button>';
                return '<div class="hm-c"><div class="hm-ct"><b>' + esc(h.n) + '</b>' + st + '</div><small>Интерьер: ' + esc(h.int) + ' · Цена ' + money(h.price) + '</small><div class="hm-b">' + btns + '</div></div>';
            }).join('') + '</div>';
    }
    box.innerHTML = '<div class="hm-box">' + html + '<button class="btn ghost" data-hc="1">Закрыть</button></div>';
    box.querySelectorAll('[data-ha]').forEach(function (b) {
        b.onclick = function () {
            if (b.dataset.ha === 'sell' && !b.dataset.ok) { b.dataset.ok = 1; b.textContent = 'Точно продать? Нажмите ещё раз'; return; }
            trig('cef:house:act', b.dataset.ha, Number(b.dataset.id));
        };
    });
    box.querySelectorAll('[data-rent]').forEach(function (b) { b.onclick = function () { trig('cef:hotel:rent', Number(b.dataset.rent)); }; });
    box.querySelector('[data-hc]').onclick = function () { trig('cef:house:close'); };
};
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.getElementById('houseMenu')) trig('cef:house:close'); });

window.phoneHouses = function (json) {
    DATA.houses = typeof json === 'string' ? JSON.parse(json) : json;
    if (current === 'phone' && phApp === 'gps' && (gpsTab === 'homes' || gpsTab === 'places')) renderApp();
};
function phoneHomesTab(body, tabs) {
    var H = DATA.houses;
    if (!H) { body.innerHTML = tabs + '<div class="empty-t">Загрузка...</div>'; trig('cef:house:phone'); return; }
    var my = H.my ? '<div class="job-c"><div class="job-h"><span class="job-i">🏠</span><div><b>' + esc(H.my.n) + '</b><small>Ваше жильё · ' + esc(H.my.int) + '</small></div></div><button class="btn" data-hg="house" data-id="' + H.my.id + '">📍 Маршрут домой</button></div>'
        : '<div class="empty-t" style="text-align:left;margin:4px 0 10px">У вас пока нет жилья. Купить дом или квартиру можно в агентстве недвижимости.</div>';
    var ht = '<div class="job-c"><div class="job-h"><span class="job-i">🛏️</span><div><b>' + esc(H.hotel.n) + '</b><small>' + (H.hotel.left ? 'Номер оплачен ещё ' + H.hotel.left + ' дн.' : money(H.hotel.price) + ' / сутки') + '</small></div></div><button class="btn" data-hg="hotel" data-id="0">📍 Маршрут в гостиницу</button></div>';
    var fac = '<div class="gps-sub">Фракции</div>' + H.fac.map(function (f) { return '<div class="gps-i" data-hg="fac" data-id="' + f.i + '"><span>🏛️</span><span>' + esc(f.n) + '</span></div>'; }).join('');
    var free = '<div class="gps-sub">Купить жильё</div><div class="gps-i" data-rl="1"><span>🔑</span><span>Агентство недвижимости — продажа и аукционы</span></div>';
    body.innerHTML = tabs + my + ht + free;
}

window.phoneCall = function (json) {
    var c = typeof json === 'string' ? (json === 'null' ? null : JSON.parse(json)) : json;
    var el = document.getElementById('phCall');
    clearInterval(callT); callT = null;
    if (!c) { if (el) el.remove(); return; }
    var fr = document.querySelector('#phone .ph-frame');
    if (!fr) return;
    if (!el) { el = document.createElement('div'); el.id = 'phCall'; fr.appendChild(el); }
    var st = c.st === 'ring' ? (c.out ? 'Вызов…' : 'Входящий звонок') : '00:00';
    el.className = 'ph-call ' + c.st;
    el.innerHTML = '<div class="pc-av">' + esc(String(c.name)[0] || '?') + '</div><b class="pc-n">' + esc(c.name) + '</b><div class="pc-num">' + esc(c.num) + '</div><div class="pc-st" id="pcSt">' + st + '</div>' +
        (c.st === 'talk' ? '<div class="pc-hint">🎙 Говорите — собеседник вас слышит</div>' : c.out ? '' : '<div class="pc-hint">Y — ответить · N — сбросить</div>') + '<div class="pc-btns">' + (c.st === 'ring' && !c.out ? '<button class="pc-ok" data-pc="ok">📞</button>' : '') + '<button class="pc-no" data-pc="no">📞</button></div>';
    el.querySelectorAll('[data-pc]').forEach(function (b) { b.onclick = function () { trig(b.dataset.pc === 'ok' ? 'cef:call:answer' : 'cef:call:end'); }; });
    var t0 = Date.now() - (c.el || 0);
    if (c.st === 'talk') callT = setInterval(function () {
        var s = Math.floor((Date.now() - t0) / 1000), e = document.getElementById('pcSt');
        if (e) e.textContent = pad(Math.floor(s / 60)) + ':' + pad(s % 60);
    }, 1000);
};

window.govMenu = function (json) {
    var box = document.getElementById('govMenu');
    if (!json) { if (box) box.remove(); return; }
    var d = typeof json === 'string' ? JSON.parse(json) : json, h = '';
    if (!box) { box = document.createElement('div'); box.id = 'govMenu'; box.className = 'hm-wrap'; document.body.appendChild(box); }
    if (d.t === 'armory') {
        h = '<div class="hm-h"><span class="hm-i">🗄️</span><div><b>Склад оружия · ' + esc(d.f) + '</b><small>Поставки выполняет армия. Остатки видны справа</small></div></div><div class="gv-list">' +
            d.items.map(function (x) {
                var lock = d.rank < x.r;
                return '<div class="gv-it' + (lock ? ' lock' : '') + '"><span class="gv-i">' + icoHtml(x) + '</span><div class="gv-b"><b>' + esc(x.n) + '</b><small>' + (lock ? 'С ' + x.r + ' ранга' : x.has ? 'У вас: ' + x.has : 'Доступно') + '</small></div><span class="gv-left' + (x.left ? '' : ' z') + '">' + x.left + ' шт</span><button class="btn" data-gt="' + x.k + '"' + (lock || !x.left ? ' disabled' : '') + '>Взять</button></div>';
            }).join('') + '</div><button class="btn ghost" data-gr="1">Сдать всё снаряжение</button>';
    } else if (d.t === 'locker') {
        h = '<div class="hm-h"><span class="hm-i">👮</span><div><b>Раздевалка · ' + esc(d.f) + '</b><small>' + (d.on ? 'Вы на смене' : 'Вы не на смене') + '</small></div></div><div class="hm-days">' +
            d.list.map(function (u) { return '<button class="hm-o" data-gu="' + u.i + '"' + (u.lock ? ' disabled style="opacity:.45"' : '') + '><b>' + esc(u.n) + '</b><small>' + (u.lock ? 'С ранга «' + esc(u.lock) + '»' : 'Надеть и заступить на смену') + '</small></button>'; }).join('') + '</div>' +
            (d.on ? '<button class="btn ghost" data-gu="-1">Гражданская одежда (закончить смену)</button>' : '');
    } else if (d.t === 'garage') {
        h = '<div class="hm-h"><span class="hm-i">🚓</span><div><b>Автопарк · ' + esc(d.f) + '</b><small>' + (d.out ? 'Сейчас у вас: ' + esc(d.out) : 'Выберите служебный транспорт') + '</small></div></div><div class="gv-list">' +
            d.list.map(function (c) {
                var lock = d.rank < c.r;
                return '<div class="gv-it' + (lock ? ' lock' : '') + '"><span class="gv-i">🚔</span><div class="gv-b"><b>' + esc(c.m) + '</b><small>' + (lock ? 'С ранга «' + esc(c.rn) + '»' : 'Доступно') + '</small></div><button class="btn" data-gc="' + esc(c.m) + '"' + (lock || d.out ? ' disabled' : '') + '>Взять</button></div>';
            }).join('') + '</div>' + (d.out ? '<button class="btn ghost" data-gc="__back">Сдать машину (пригоните к гаражу)</button>' : '');
    }
    box.innerHTML = '<div class="hm-box">' + h + '<button class="btn ghost" data-gx="1">Закрыть</button></div>';
    box.querySelectorAll('[data-gt]').forEach(function (b) { b.onclick = function () { trig('cef:gov:take', b.dataset.gt); }; });
    box.querySelectorAll('[data-gr]').forEach(function (b) { b.onclick = function () { trig('cef:gov:return'); }; });
    box.querySelectorAll('[data-gu]').forEach(function (b) { b.onclick = function () { trig('cef:gov:uniform', Number(b.dataset.gu)); }; });
    box.querySelectorAll('[data-gc]').forEach(function (b) { b.onclick = function () { trig('cef:gov:car', b.dataset.gc); }; });
    box.querySelector('[data-gx]').onclick = function () { trig('cef:gov:close'); };
};

window.phoneBiz = function (json) {
    DATA.biz = typeof json === 'string' ? JSON.parse(json) : json;
    if (current === 'phone' && phApp === 'gps' && gpsTab === 'biz') renderApp();
};

/* ================= АГЕНТСТВО НЕДВИЖИМОСТИ ================= */
var RL = { tab: 'buy', f: 'all', d: null };
function rlLeft(ms) { var m = Math.ceil(ms / 60000); return m >= 60 ? Math.floor(m / 60) + ' ч ' + (m % 60) + ' мин' : m + ' мин'; }
window.realtyMenu = function (json) {
    var box = document.getElementById('realtyMenu');
    if (!json) { if (box) box.remove(); RL.d = null; return; }
    RL.d = typeof json === 'string' ? JSON.parse(json) : json;
    RL.d.at = Date.now();
    if (!box) { box = document.createElement('div'); box.id = 'realtyMenu'; document.body.appendChild(box); }
    rlRender();
};
function rlRender() {
    var box = document.getElementById('realtyMenu'), d = RL.d;
    if (!box || !d) return;
    var T = [['buy', '🏠 Купить жильё'], ['auc', '🔨 Аукционы'], ['sell', '📤 Выставить']];
    var html = '<div class="rl-h"><span class="hm-i">🔑</span><div><b>Агентство недвижимости</b><small>Наличные ' + money(d.money) + ' · Банк ' + money(d.bank) + '</small></div><button class="rl-x" data-rx="1">✕</button></div>' +
        '<div class="gps-tabs">' + T.map(function (t) { return '<button class="gps-tab' + (RL.tab === t[0] ? ' on' : '') + '" data-rt="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' +
        (d.err ? '<div class="rl-msg err">' + esc(d.err) + '</div>' : '') + (d.ok ? '<div class="rl-msg ok">' + esc(d.ok) + '</div>' : '');
    if (RL.tab === 'buy') {
        var F = [['all', 'Все'], ['house', 'Дома'], ['flat', 'Квартиры']];
        var list = d.free.filter(function (h) { return RL.f === 'all' || (RL.f === 'flat') === h.flat; });
        html += '<div class="rl-f">' + F.map(function (f) { return '<button class="' + (RL.f === f[0] ? 'on' : '') + '" data-rf="' + f[0] + '">' + f[1] + '</button>'; }).join('') + '</div>' +
            (d.hasHome ? '<div class="rl-msg">У вас уже есть жильё — купить второе нельзя. Продайте текущее или выставьте его на аукцион.</div>' : '') +
            '<div class="rl-list">' + (list.length ? list.map(function (h) {
                return '<div class="rl-c"><div class="rl-ct"><b>' + (h.flat ? '🏢 ' : '🏠 ') + esc(h.n) + '</b><span class="rl-p">' + money(h.price) + '</span></div><small>' + esc(h.int) + ' · ' + (h.d > 1000 ? (h.d / 1000).toFixed(1) + ' км' : h.d + ' м') + ' от вас</small>' +
                    '<div class="rl-b"><button class="btn ghost" data-rg="' + h.id + '">📍 Показать</button><button class="btn" data-rb="' + h.id + '"' + (d.hasHome ? ' disabled' : '') + '>Купить</button></div></div>';
            }).join('') : '<div class="empty-t">Свободных объектов нет</div>') + '</div>';
    } else if (RL.tab === 'auc') {
        var el = Date.now() - d.at;
        html += '<div class="rl-msg">Ставка списывается с банковского счёта и замораживается. Если вас перебьют — деньги сразу вернутся. Шаг ставки от ' + d.step + '%. Ставка в последние 2 минуты продлевает торги.</div>' +
            '<div class="rl-list">' + (d.lots.length ? d.lots.map(function (l) {
                var act = l.mine ? (l.bid ? '<div class="job-st">Ваш лот · ставок: ' + l.bids + '</div>' : '<button class="btn ghost" data-rc="' + l.id + '">Снять с торгов</button>')
                    : l.lead ? '<div class="job-st" style="color:#8fd14f">Ваша ставка лидирует</div>'
                    : '<div class="rl-bid"><input type="number" id="rlb' + l.id + '" value="' + l.min + '" min="' + l.min + '"><button class="btn" data-rbid="' + l.id + '">Ставка</button></div>';
                return '<div class="rl-c"><div class="rl-ct"><b>' + l.i + ' ' + esc(l.n) + '</b><span class="rl-k">' + esc(l.kn) + '</span></div><small>' + esc(l.sub || '') + ' · продавец ' + esc(l.seller) + '</small>' +
                    '<div class="rl-info"><span>' + (l.bid ? 'Ставка: <b>' + money(l.bid) + '</b> · ' + esc(l.bidder) : 'Старт: <b>' + money(l.start) + '</b>') + '</span><span>⏳ ' + rlLeft(Math.max(0, l.left - el)) + '</span></div>' + act + '</div>';
            }).join('') : '<div class="empty-t">Сейчас нет активных аукционов</div>') + '</div>' +
            (d.hist.length ? '<div class="gps-sub">Мои сделки</div>' + d.hist.map(function (h) { return '<div class="rl-hist">' + esc(h.n) + ' — ' + money(h.sum) + '</div>'; }).join('') : '');
    } else {
        html += '<div class="rl-msg">Выставьте своё имущество на аукцион. Агентство берёт ' + d.fee + '% с итоговой цены. Пока идут торги, объект нельзя продать государству.</div>' +
            '<div class="rl-list">' + (d.mine.length ? d.mine.map(function (a, i) {
                return '<div class="rl-c"><div class="rl-ct"><b>' + ({ house: '🏠', flat: '🏢', car: '🚗', biz: '💼' }[a.kind]) + ' ' + esc(a.n) + '</b></div><small>' + esc(a.sub) + '</small>' +
                    (a.lock ? '<div class="job-st">Уже на аукционе</div>' :
                    '<div class="rl-sell"><input type="number" id="rls' + i + '" placeholder="Стартовая цена, $" min="1000"><select id="rlh' + i + '">' + d.hours.map(function (h) { return '<option value="' + h + '">' + h + ' ч</option>'; }).join('') + '</select><button class="btn" data-rs="' + i + '">Выставить</button></div>') + '</div>';
            }).join('') : '<div class="empty-t">У вас нет имущества для продажи</div>') + '</div>';
    }
    box.innerHTML = '<div class="rl-box">' + html + '</div>';
    box.querySelectorAll('[data-rx]').forEach(function (b) { b.onclick = function () { trig('cef:realty:close'); }; });
    box.querySelectorAll('[data-rt]').forEach(function (b) { b.onclick = function () { RL.tab = b.dataset.rt; d.err = d.ok = null; rlRender(); }; });
    box.querySelectorAll('[data-rf]').forEach(function (b) { b.onclick = function () { RL.f = b.dataset.rf; rlRender(); }; });
    box.querySelectorAll('[data-rg]').forEach(function (b) { b.onclick = function () { trig('cef:realty:act', 'gps', b.dataset.rg); }; });
    box.querySelectorAll('[data-rb]').forEach(function (b) { b.onclick = function () { if (!b.dataset.ok) { b.dataset.ok = 1; b.textContent = 'Подтвердить'; return; } trig('cef:realty:act', 'buy', b.dataset.rb); }; });
    box.querySelectorAll('[data-rc]').forEach(function (b) { b.onclick = function () { trig('cef:realty:act', 'cancel', b.dataset.rc); }; });
    box.querySelectorAll('[data-rbid]').forEach(function (b) { b.onclick = function () { var v = Number(document.getElementById('rlb' + b.dataset.rbid).value); trig('cef:realty:act', 'bid', b.dataset.rbid, String(v)); }; });
    box.querySelectorAll('[data-rs]').forEach(function (b) {
        b.onclick = function () {
            var i = Number(b.dataset.rs), a = d.mine[i];
            var st = Number(document.getElementById('rls' + i).value), hr = Number(document.getElementById('rlh' + i).value);
            if (!(st >= 1000)) { d.err = 'Укажите стартовую цену от $1.000'; d.ok = null; return rlRender(); }
            trig('cef:realty:act', 'list', a.kind, a.ref, String(st), hr);
        };
    });
}
setInterval(function () { if (RL.d && RL.tab === 'auc') { var a = document.activeElement; if (!a || a.tagName !== 'INPUT') rlRender(); } }, 15000);
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.getElementById('realtyMenu')) trig('cef:realty:close'); });

/* ================= ПАНЕЛЬ МЕДИА-ПАРТНЁРА ================= */
var MD = null;
function mdT(t) { var d = new Date(t); return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
window.mediaMenu = function (json) {
    var box = document.getElementById('mediaMenu');
    if (!json) { if (box) box.remove(); MD = null; return; }
    MD = typeof json === 'string' ? JSON.parse(json) : json;
    if (!box) { box = document.createElement('div'); box.id = 'mediaMenu'; document.body.appendChild(box); }
    var d = MD;
    var sw = function (k, on) { return '<button class="md-sw' + (on ? ' on' : '') + '" data-ma="' + k + '"><i></i></button>'; };
    var H = [6, 9, 12, 15, 18, 20, 22, 0];
    box.innerHTML = '<div class="md-box">' +
        '<div class="md-h"><img src="logo.png"><div><b>Панель медиа-партнёра</b><small>' + esc(d.name) + ' · с ' + mdT(d.since) + '</small></div><button class="md-x" data-mx="1">✕</button></div>' +
        (d.err ? '<div class="md-msg err">' + esc(d.err) + '</div>' : '') + (d.ok ? '<div class="md-msg ok">' + esc(d.ok) + '</div>' : '') +
        '<div class="md-grid">' +
        '<div class="md-c"><h4>💰 Медиа-зарплата</h4><div class="md-big">' + d.salary + ' RC <small style="font-size:12px;color:#b7a9c6">/ неделя</small></div>' +
            '<div class="md-kv"><span>Следующая выплата</span><b>' + (d.paused ? 'на паузе' : d.salary ? mdT(d.nextPay) : '—') + '</b></div><div class="md-kv"><span>Всего получено</span><b>' + d.paid + ' RC</b></div></div>' +
        '<div class="md-c"><h4>🎟 Промокод</h4>' + (d.code ? '<div class="md-big">' + esc(d.code) + '</div><div class="md-kv"><span>Активаций</span><b>' + d.uses + '</b></div><div class="md-kv"><span>Заработано на коде</span><b>' + d.refPaid + ' RC</b></div>' : '<p>Создайте свой код — новички вводят /promo КОД и получают бонус' + (d.cfg.bonusMoney ? ' $' + d.cfg.bonusMoney : '') + (d.cfg.bonusCoins ? ' + ' + d.cfg.bonusCoins + ' RC' : '') + ', а вы — ' + d.cfg.refCoins + ' RC за каждого.</p>') +
            (d.uses ? '' : '<div class="md-in" style="margin-top:8px"><input id="mdCode" maxlength="16" placeholder="Например, AMRP_IVAN"><button class="md-btn" data-ma="code">' + (d.code ? 'Сменить' : 'Создать') + '</button></div>') + '</div>' +
        '<div class="md-c"><h4>🎥 Съёмка</h4><button class="md-btn" data-ma="cam" style="width:100%;margin-bottom:8px">Кинокамера (без интерфейса)</button>' +
            (d.fly ? '<button class="md-btn' + (d.flying ? ' g' : '') + '" data-ma="fly" style="width:100%;margin-bottom:8px">' + (d.flying ? 'Завершить полёт' : 'Полёт /fly') + '</button>' : '<div class="md-msg err" style="margin-bottom:8px">Полёт забран: ' + esc(d.flyReason) + '</div>') + '<div class="md-tg"><span>Режим стримера<br><small style="color:#b7a9c6;font-size:11px">скрыть ник, номер и деньги</small></span>' + sw('streamer', d.streamer) + '</div>' +
            '<div class="md-tg"><span>Метка MEDIA над головой</span>' + sw('badge', d.badge) + '</div></div>' +
        '<div class="md-c"><h4>🌤 Погода и время <small style="color:#b7a9c6;font-weight:400">— видите только вы</small></h4>' +
            '<div class="md-chips" style="margin-bottom:8px">' + d.weathers.map(function (w) { return '<button data-mw="' + w + '">' + w + '</button>'; }).join('') + '<button data-mw="reset">↺ сервер</button></div>' +
            '<div class="md-chips">' + H.map(function (h) { return '<button data-mt="' + h + '">' + h + ':00</button>'; }).join('') + '<button data-mt="-1">↺ сервер</button></div></div>' +
        '<div class="md-c w"><h4>🚗 Машина для контента <small style="color:#b7a9c6;font-weight:400">— на 30 минут</small></h4>' +
            (d.car ? '<div class="md-kv" style="margin-bottom:8px"><span>Сейчас: <b>' + esc(d.car.m) + '</b></span><b>осталось ' + Math.ceil(d.car.left / 60000) + ' мин</b></div>' : '') +
            '<div class="md-chips">' + d.cars.map(function (c) { return '<button data-mc="' + c + '">' + c + '</button>'; }).join('') + '</div>' + (d.car ? '<button class="md-btn g" data-ma="carDel" style="margin-top:8px">Убрать машину</button>' : '') + '</div>' +
        (d.hist.length ? '<div class="md-c w"><h4>📜 История выплат</h4>' + d.hist.map(function (h) { return '<div class="md-hist"><span>' + mdT(h.t) + ' · ' + esc(h.w) + '</span><b>+' + h.n + ' RC</b></div>'; }).join('') + '</div>' : '') +
        '</div></div>';
    box.querySelector('[data-mx]').onclick = function () { trig('cef:media:close'); };
    box.querySelectorAll('[data-ma]').forEach(function (b) {
        b.onclick = function () {
            var a = b.dataset.ma, v = '';
            if (a === 'code') v = document.getElementById('mdCode').value;
            trig('cef:media:act', a, v);
        };
    });
    box.querySelectorAll('[data-mc]').forEach(function (b) { b.onclick = function () { trig('cef:media:act', 'car', b.dataset.mc); }; });
    box.querySelectorAll('[data-mw]').forEach(function (b) { b.onclick = function () { trig('cef:media:act', 'weather', b.dataset.mw); }; });
    box.querySelectorAll('[data-mt]').forEach(function (b) { b.onclick = function () { trig('cef:media:act', 'time', b.dataset.mt); }; });
};
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.getElementById('mediaMenu')) trig('cef:media:close'); });


window.questDialog = function (json) {
    var box = document.getElementById('questDlg');
    if (!json) { if (box) box.remove(); return; }
    var d = typeof json === 'string' ? JSON.parse(json) : json;
    if (!box) { box = document.createElement('div'); box.id = 'questDlg'; document.body.appendChild(box); }
    box.innerHTML = '<div class="qd-box"><div class="qd-n">' + esc(d.n) + '<button class="qd-x" data-qx="1">✕</button></div>' +
        '<div class="qd-t">' + esc(d.t) + '</div><div class="qd-o">' +
        d.o.map(function (o, i) { return '<button data-qo="' + i + '"><span>' + (i + 1) + '</span>' + esc(o) + '</button>'; }).join('') + '</div></div>';
};
document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#questDlg button');
    if (!b) return;
    if (b.dataset.qx) return trig('cef:quest:close');
    if (b.dataset.qo !== undefined) trig('cef:quest:answer', Number(b.dataset.qo));
});
document.addEventListener('keydown', function (e) {
    if (!document.getElementById('questDlg')) return;
    var n = Number(e.key);
    var b = document.querySelector('#questDlg button[data-qo="' + (n - 1) + '"]');
    if (n >= 1 && b) trig('cef:quest:answer', n - 1);
});


window.radioPanel = function (json) {
    var box = document.getElementById('radioPanel');
    if (!json) { if (box) box.remove(); return; }
    var d = typeof json === 'string' ? JSON.parse(json) : json;
    if (!box) { box = document.createElement('div'); box.id = 'radioPanel'; document.body.appendChild(box); }
    var st = d.mode === 'off' ? 'OFF' : d.mode === 'none' ? 'NO ACCESS' : d.mode === 'listen' ? 'RX ONLY' : 'ONLINE';
    var chips = (d.fac || d.tro) ? d.pubs.filter(function (x) { return x.ok; }).map(function (x) { return '<button class="wt-ch" data-rq="' + x.fq + '">' + esc(x.n) + '<i>' + x.fq + '</i></button>'; }).join('') : '';
    box.innerHTML = '<div class="wt">' +
        '<div class="wt-ant"></div><div class="wt-knob k1"></div><div class="wt-knob k2"></div>' +
        '<div class="wt-body">' +
            '<div class="wt-top"><span class="wt-led ' + d.mode + '"></span><span class="wt-brand">AMRP · TX-900</span><button class="wt-x" data-rx="1">✕</button></div>' +
            '<div class="wt-grill"></div>' +
            '<div class="wt-lcd"><div class="wt-lr"><span>CH</span><span class="wt-mode ' + d.mode + '">' + st + '</span></div>' +
                '<div class="wt-fq">' + (d.fq || '---.-') + '<small>MHz</small></div>' +
                '<div class="wt-name">' + esc(d.ch || 'Рация выключена') + '</div></div>' +
            (d.err ? '<div class="wt-msg err">' + esc(d.err) + '</div>' : '') + (d.ok ? '<div class="wt-msg ok">' + esc(d.ok) + '</div>' : '') +
            '<div class="wt-pad"><input id="rpFq" maxlength="5" placeholder="___._"><button class="wt-key g" data-ra="tune">SET</button></div>' +
            (d.fac ? '<button class="wt-key wide" data-ra="inner">ВНУТР. КАНАЛ ' + esc(d.fac) + ' · ' + d.inner + '</button>' : '') +
            (d.boss ? '<div class="wt-pad"><input id="rpInner" maxlength="5" placeholder="новая внутр."><button class="wt-key y" data-ra="setInner">SET</button></div>' : '') +
            (chips ? '<div class="wt-sec">' + (d.boss ? 'Связь лидеров' : 'Дежурные каналы') + '</div><div class="wt-chs">' + chips + '</div>' : '') +
            (d.tro ? '<div class="wt-hint">Трофейная рация — только приём</div>' : '') +
            '<div class="wt-ptt"><span>PTT</span> удерживайте <b>X</b></div>' +
            (d.mode !== 'off' ? '<button class="wt-key wide r" data-ra="off">POWER OFF</button>' : '') +
        '</div></div>';
};
document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#radioPanel button');
    if (!b) return;
    if (b.dataset.rx) return trig('cef:radio:close');
    if (b.dataset.rq) return trig('cef:radio:act', 'tune', b.dataset.rq);
    var a = b.dataset.ra;
    if (a === 'tune') return trig('cef:radio:act', 'tune', document.getElementById('rpFq').value);
    if (a === 'setInner') return trig('cef:radio:act', 'setInner', document.getElementById('rpInner').value);
    if (a) trig('cef:radio:act', a, '');
});

/* ================= ТАКСИ ================= */
var TX_NOTE = '';
window.taxiApp = function (json) {
    DATA.taxi = typeof json === 'string' ? JSON.parse(json) : json;
    if (current === 'phone' && phApp === 'taxi') renderApp();
};
function taxiRender(body) {
    var T = DATA.taxi;
    if (!T) { body.innerHTML = '<div class="empty-t">Загрузка...</div>'; trig('cef:taxi:app'); return; }
    var t = T.tariff, o = T.order, h = '';
    h += '<div class="tx-hero"><b>🚕 Downtown Cab Co.</b><small>Посадка ' + money(t.start) + ' · ' + money(t.km) + '/км · ' + money(t.min) + '/мин · на линии: ' + T.online + '</small></div>';
    if (o) {
        var stN = { wait: 'Ищем водителя…', go: o.me === 'cl' ? 'Водитель едет к вам' : 'Едьте к клиенту (метка на карте)', ride: 'Поездка идёт — работает таксометр' }[o.st];
        h += '<div class="job-c"><div class="gps-sub" style="margin-top:0">Заказ №' + o.id + '</div><b style="font-size:15px">' + stN + '</b>' +
            (o.me === 'cl' && o.drv ? '<div class="tx-row">Водитель: <b>' + esc(o.drv) + '</b>' + (o.car ? ' · ' + esc(o.car) : '') + (o.drvPhone ? ' · 📞 ' + esc(o.drvPhone) : '') + '</div>' : '') +
            (o.me === 'dr' ? '<div class="tx-row">Клиент: <b>' + esc(o.cl) + '</b>' + (o.clPhone ? ' · 📞 ' + esc(o.clPhone) : '') + (o.note ? '<br>«' + esc(o.note) + '»' : '') + '</div>' : '') +
            (o.free ? '<div class="tx-free">🎁 Поездка бесплатна для новичка — оплачивает мэрия</div>' : '') +
            (o.me === 'dr' && o.st === 'go' ? '<button class="btn" data-tx="start">▶ Включить таксометр (клиент в машине)</button>' : '') +
            (o.me === 'dr' && o.st === 'ride' ? '<button class="btn" data-tx="finish">🏁 Завершить поездку и получить оплату</button>' : '') +
            (o.st !== 'ride' ? '<button class="btn ghost" data-tx="cancel">Отменить заказ</button>' : '') + '</div>';
    } else if (T.driver) {
        h += '<div class="job-now">Вы на линии' + (T.driver.own ? ' · личное авто' : ' · арендованное такси') + '<button class="btn ghost" data-tx="off" style="margin:8px 0 0">Уйти с линии</button></div>';
        h += '<div class="gps-sub">Заказы (' + T.queue.length + ')</div>' + (T.queue.length ? T.queue.map(function (q) {
            return '<div class="job-c"><div class="job-h"><span class="job-i">🙋</span><div><b>' + esc(q.cl) + '</b><small>' + (q.dist > 1000 ? (q.dist / 1000).toFixed(1) + ' км' : q.dist + ' м') + ' · ' + q.ago + ' с назад' + (q.free ? ' · 🎁 платит мэрия' : '') + '</small></div></div>' + (q.note ? '<p>«' + esc(q.note) + '»</p>' : '') + '<button class="btn" data-acc="' + q.id + '">Принять заказ</button></div>';
        }).join('') : '<div class="empty-t">Пока заказов нет — ждите, придёт уведомление</div>');
    } else {
        h += '<div class="gps-sub">Вызвать такси</div>' + (T.free ? '<div class="tx-free">🎁 Вам ' + T.lvl + ' ур. — до ' + t.freeLvl + ' уровня поездки бесплатны, оплачивает мэрия</div>' : '') +
            '<input class="tx-in" id="txNote" maxlength="60" placeholder="Куда едем? (необязательно)" value="' + esc(TX_NOTE) + '"><button class="btn" data-tx="call">🚕 Вызвать такси</button>';
        h += '<div class="gps-sub">Работать водителем</div>';
        if (!T.canDrive) h += '<div class="empty-t" style="text-align:left">Работа в такси откроется с ' + t.drvLvl + ' уровня (у вас ' + T.lvl + ').</div>';
        else if (!T.hasB) h += '<div class="empty-t" style="text-align:left">Нужны права категории B.</div>';
        else h += '<div class="job-c"><p style="margin-top:0">Сядьте за руль своей машины и выйдите на линию — или арендуйте жёлтое такси в таксопарке.</p>' +
            '<button class="btn" data-tx="on">🟢 Выйти на линию</button>' +
            (T.driver && T.driver.rent ? '' : '<button class="btn ghost" data-tx="rent">🔑 Арендовать такси · ' + money(t.rent) + ' / ' + t.rentMin + ' мин</button>') + '</div>';
        if (T.stats.rides) h += '<div class="job-st">Ваши поездки: ' + T.stats.rides + ' · заработано ' + money(T.stats.earned) + ' · рейтинг ' + T.stats.rate + '★</div>';
    }
    body.innerHTML = h;
    var n = $('txNote'); if (n) n.oninput = function () { TX_NOTE = n.value; };
    body.querySelectorAll('[data-tx]').forEach(function (b) {
        b.onclick = function () {
            var a = b.dataset.tx;
            if (a === 'call') trig('cef:taxi:call', TX_NOTE);
            else if (a === 'on') trig('cef:taxi:duty', 1);
            else if (a === 'off') trig('cef:taxi:duty', 0);
            else trig('cef:taxi:' + a);
        };
    });
    body.querySelectorAll('[data-acc]').forEach(function (b) { b.onclick = function () { trig('cef:taxi:accept', Number(b.dataset.acc)); }; });
}
window.taxiMeter = function (json) {
    var el = document.getElementById('taxiMeter');
    var m = json ? (typeof json === 'string' ? JSON.parse(json) : json) : null;
    if (!m) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement('div'); el.id = 'taxiMeter'; document.body.appendChild(el); }
    el.innerHTML = '<div class="tm-h">🚕 ТАКСОМЕТР<span>' + (m.who === 'dr' ? 'Клиент: ' + esc(m.cl) : 'Водитель: ' + esc(m.drv)) + '</span></div>' +
        '<div class="tm-sum">' + money(m.sum) + '</div>' +
        '<div class="tm-row"><span>' + m.km + ' км</span><span>' + pad(m.min) + ':' + pad(m.sec) + '</span></div>' +
        (m.free ? '<div class="tm-free">🎁 Оплачивает мэрия</div>' : '<div class="tm-t">Посадка ' + money(m.tar.start) + ' · ' + money(m.tar.perKm) + '/км · ' + money(m.tar.perMin) + '/мин</div>');
};
window.taxiRate = function (json) {
    var d = typeof json === 'string' ? JSON.parse(json) : json;
    var el = document.createElement('div'); el.id = 'taxiRateBox';
    el.innerHTML = '<b>Оцените водителя ' + esc(d.drv) + '</b><div>' + [1, 2, 3, 4, 5].map(function (i) { return '<button data-r="' + i + '">★</button>'; }).join('') + '</div>';
    document.body.appendChild(el);
    el.querySelectorAll('[data-r]').forEach(function (b) { b.onclick = function () { trig('cef:taxi:rateDrv', d.id, Number(b.dataset.r)); el.remove(); }; });
    setTimeout(function () { if (el.parentNode) el.remove(); }, 20000);
};
