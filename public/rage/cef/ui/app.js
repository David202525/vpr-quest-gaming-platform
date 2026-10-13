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
    ['inv', 'phone', 'menu', 'docs', 'fuel', 'atm', 'card', 'biz'].forEach(function (s) { $(s).classList.toggle('show', s === name); });
    current = name;
    hideCtx();
    if (name === 'atm') { ATM.d = null; ATM.view = 'boot'; ATM.input = ''; renderAtm(); }
    if (name === 'docs') { docSel = 0; if (!(opt && opt.shown)) DATA.docs = DATA.docs && DATA.docs.own ? DATA.docs : null; renderDocs(); }
    if (name === 'inv') { if (!DATA.inv) { DATA.inv = emptyInv(); DATA.inv.offline = true; } renderInv(); srvWarn('inv'); }
    if (name === 'phone') { phoneHome(); srvWarn('phone'); }
    if (name === 'menu') { if (!DATA.menu) DATA.menu = emptyMenu(); renderMenu(); srvWarn('menu'); }
};
window.uiClose = function () {
    ['inv', 'phone', 'menu', 'docs', 'fuel', 'atm', 'card', 'biz'].forEach(function (s) { $(s).classList.remove('show'); });
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
    if (kind === 'phone') d = fill(d, { number: '—', name: '—', money: 0, bank: 0, contacts: [], sms: [], online: [], gps: [] });
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
        inner = it.i + (it.c > 1 ? '<span class="cnt">' + it.c + '</span>' : '');
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
        $('wpBox').innerHTML = '<span>' + d.weapon.i + '</span><span class="wp-name">Нажмите, чтобы убрать</span>';
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
            (it ? it.i : '<span class="ghost">' + p[2] + '</span>') + '</div>';
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
            $('drag').textContent = drag.it.i;
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
    tip.innerHTML = it ? '<b>' + esc(it.n) + '</b><span>' + (it.w * it.c).toFixed(2) + ' кг' + (it.c > 1 ? ' · ' + it.c + ' шт.' : '') + '</span>' : '<span>' + esc(el.dataset.tip) + '</span>';
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
    $('ctxImg').textContent = it.i;
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
    { id: 'contacts', n: 'Контакты', i: '👤', bg: 'linear-gradient(135deg,#8e8e93,#5a5a60)' },
    { id: 'sms', n: 'Сообщения', i: '💬', bg: 'linear-gradient(135deg,#34c759,#1f9e43)' },
    { id: 'bank', n: 'Банк', i: '💳', bg: 'linear-gradient(135deg,#e3194f,#8f1fd1)' },
    { id: 'gps', n: 'Карты', i: '🗺️', bg: 'linear-gradient(135deg,#5ac8fa,#007aff)' },
    { id: 'players', n: 'Люди', i: '🌐', bg: 'linear-gradient(135deg,#ff9f0a,#ff6b00)' },
    { id: 'calc', n: 'Калькулятор', i: '🧮', bg: 'linear-gradient(135deg,#3a3a3c,#1c1c1e)' },
    { id: 'notes', n: 'Заметки', i: '📝', bg: 'linear-gradient(135deg,#ffd60a,#ff9f0a)' },
    { id: 'camera', n: 'Камера', i: '📷', bg: 'linear-gradient(135deg,#636366,#2c2c2e)' },
    { id: 'menu', n: 'Меню', i: '🎮', bg: 'linear-gradient(135deg,#d93bc8,#7b2bb5)' },
    { id: 'settings', n: 'О телефоне', i: '⚙️', bg: 'linear-gradient(135deg,#aeaeb2,#636366)' }
];
var DOCK = ['contacts', 'sms', 'bank', 'camera'];
var phApp = null;
var phChat = null;
var lastSeen = Number(LS.get('sms_seen') || 0);

function unread() {
    var p = DATA.phone;
    if (!p) return 0;
    return p.sms.filter(function (m) { return !m.me && m.at > lastSeen; }).length;
}

function appHtml(a) {
    var dot = a.id === 'sms' && unread() ? '<span class="dot">' + unread() + '</span>' : '';
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
        body.innerHTML = '<div class="empty-t" style="margin:6px 0 10px;text-align:left">Выберите место — метка появится на карте.</div>' +
            p.gps.map(function (g, i) { return '<div class="gps-i" data-g="' + i + '"><span>📍</span><span>' + esc(g.n) + '</span></div>'; }).join('');
        body.querySelectorAll('[data-g]').forEach(function (el) { el.onclick = function () { trig('cef:phone:gps', Number(el.dataset.g)); }; });
    } else if (phApp === 'players') {
        body.innerHTML = p.online.map(function (x) {
            return '<div class="li" data-n="' + esc(x.number) + '" data-nm="' + esc(x.name) + '"><div class="av">' + esc(x.name[0]) + '</div><div class="li-b"><b>' + esc(x.name) + '</b><span>ID ' + x.id + ' · ' + esc(x.number) + '</span></div><span class="li-r">💬</span></div>';
        }).join('') || '<div class="empty-t">Никого нет</div>';
        body.querySelectorAll('[data-n]').forEach(function (el) {
            el.onclick = function () { if (el.dataset.n === p.number) return; phApp = 'sms'; phChat = el.dataset.n; $('appTitle').textContent = 'Сообщения'; renderApp(); };
        });
    } else if (phApp === 'calc') {
        calcRender();
    } else if (phApp === 'notes') {
        body.innerHTML = '<textarea class="f-in" id="notesT" style="height:440px;resize:none;line-height:1.5" placeholder="Ваши заметки...">' + esc(LS.get('ph_notes') || '') + '</textarea>';
        $('notesT').oninput = function () { LS.set('ph_notes', this.value); };
    } else if (phApp === 'settings') {
        body.innerHTML = '<div style="text-align:center;font-size:60px;margin:20px 0 6px">📱</div><div style="text-align:center;font-weight:700;font-size:16px;margin-bottom:20px">RPhone 15</div>' +
            '<div class="kv"><span>Владелец</span><b>' + esc(p.name) + '</b></div><div class="kv"><span>Номер</span><b>' + esc(p.number) + '</b></div>' +
            '<div class="kv"><span>Контактов</span><b>' + p.contacts.length + '</b></div><div class="kv"><span>Сообщений</span><b>' + p.sms.length + '</b></div>';
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
        '<button class="btn" id="ccM">💬 Написать</button><button class="btn ghost" id="ccE">Изменить</button><button class="btn ghost" id="ccD" style="color:#ff5a7a">Удалить контакт</button>';
    $('ccM').onclick = function () { phApp = 'sms'; phChat = c.number; renderApp(); };
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
    var cars = d.vehicles.length ? d.vehicles.map(function (v) {
        return '<div class="tile car">' + '<div class="bg" style="background-image:url(img/car.jpg)"></div><div class="in"><div class="t-cap" style="color:rgba(255,255,255,.5);font-size:11px">Автомобиль</div><div class="t-big">' + esc(v.name || v.model) + '</div></div><span class="plate">' + esc(v.plate) + '</span></div>';
    }).join('') : tile('car', 'car.jpg', '<div class="t-cap" style="color:rgba(255,255,255,.5);font-size:11px">Автомобиль</div><div class="t-big">Нет личного транспорта</div><div class="t-sub">Купите машину в автосалоне</div>');

    return '<div class="ch"><div class="ch-left">' +
        tile('hello', 'hand.jpg', '<small>Приветствуем,</small><h2>' + esc(parts[0]) + '<br>' + esc(parts.slice(1).join(' ')) + '</h2>') +
        '<div class="tile field"><small>Никнейм</small><b>' + esc(d.name.replace(/_/g, ' ')) + '</b></div>' +
        '<div class="tile field"><small>Пол</small><b>' + esc(d.gender) + '</b></div>' +
        '<div class="tile field"><small>Дата регистрации</small><b>' + esc(d.created) + ' (' + d.hours + ' ч. в игре)</b></div>' +
        '<div class="tile field"><small>Фракция</small><b>' + esc(d.faction) + '</b></div>' +
        '<div class="tile field"><small>Семья</small><b>' + esc(d.family) + '</b></div>' +
        '<div class="tile lvl"><b>Ваш уровень ( ' + d.exp + '/' + d.need + ' EXP )</b><div class="big-ring">' + ringSvg(150, 64, 9, d.exp / d.need * 100, 'url(#g1)', 'rgba(255,255,255,.07)').replace('<svg viewBox="0 0 150 150">', '<svg viewBox="0 0 150 150"><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5ce1"/><stop offset="1" stop-color="#c13dff"/></linearGradient></defs>') + '<span>' + d.lvl + '</span></div></div>' +
        '</div><div class="ch-right">' +
        '<div class="r1">' +
        tile('orange-t', 'house.jpg', '<div class="t-cap">Ваш дом</div><div class="t-big">Нет дома</div><div class="t-kv"><span>ID персонажа</span><b>' + d.id + '</b><span>Номер телефона</span><b>' + esc(d.number) + '</b></div><div class="t-loc">Сан-Андреас</div>') +
        tile('green-t', 'flat.jpg', '<div class="t-cap">Ваша квартира</div><div class="t-sub">У Вас нет квартиры</div>') +
        tile('orange-t clickable', 'docs.jpg', '<div class="t-cap">Ваши документы</div><div class="t-sub">Паспорт, удостоверения, справки</div>', ' data-docs="1"') +
        '</div>' +
        '<div class="r2">' + cars + '</div>' +
        '<div class="r3">' +
        tile('blue-t', 'biz.jpg', '<div class="t-cap">Ваши финансы</div><div class="t-big">' + money(d.money + d.bank) + '</div><div class="t-kv"><span>Наличные</span><b>' + money(d.money) + '</b><span>На счёте</span><b>' + money(d.bank) + '</b><span>Часов в игре</span><b>' + d.hours + '</b></div>') +
        tile('yellow-t clickable', 'lic.jpg', '<div class="t-cap" style="font-weight:600">Ваши лицензии</div><div class="t-sub">Права, разрешение на оружие</div>', ' data-docs="1"') +
        '</div>' +
        '<div class="r4"><div class="tile skills" style="background:linear-gradient(135deg,rgba(30,70,50,.3),rgba(255,255,255,.03))"><b>Ваши скиллы</b><div class="sk-row">' +
        d.skills.map(function (s) {
            return '<div class="sk"><div class="sk-ring">' + ringSvg(66, 28, 4, s.lvl >= 5 ? 100 : s.pct, '#ffc93c', 'rgba(255,255,255,.06)') + '<span>' + (s.lvl >= 5 ? 100 : s.pct) + '%</span></div><b>' + esc(s.n) + '</b><small>' + s.lvl + ' ур. из 5</small></div>';
        }).join('') +
        '</div></div>' +
        tile('red-t report', 'report.jpg', '<div class="t-cap" style="font-weight:600">Репорт</div><div class="t-sub">Вы можете задать любой интересующий Вас вопрос или оставить жалобу на игрока. Администрация поможет Вам в кратчайшие сроки.</div>', ' data-report="1"') +
        '</div></div></div>';
}

function menuAch(d) {
    var done = d.ach.filter(function (a) { return a.done; }).length;
    return '<div class="ach-top"><b>Выполнено ' + done + ' из ' + d.ach.length + '</b><div class="bar"><i style="width:' + (done / d.ach.length * 100) + '%"></i></div></div><div class="ach-grid">' +
        d.ach.map(function (a) { return '<div class="ach' + (a.done ? ' done' : '') + '"><div class="ai">' + a.i + '</div><div><b>' + esc(a.n) + '</b><small>' + esc(a.d) + (a.done ? ' ✓' : '') + '</small></div></div>'; }).join('') + '</div>';
}

function menuShop(d) {
    var cats = ['Все', 'Разное', 'Одежда', 'Оружие'];
    var list = d.shop.filter(function (x) { return shopCat === 'Все' || x.cat === shopCat; });
    return '<div class="shop-top"><div class="cats">' + cats.map(function (c) { return '<button data-cat="' + c + '" class="' + (c === shopCat ? 'active' : '') + '">' + c + '</button>'; }).join('') +
        '</div><div class="wallet">Наличные:<b>' + money(d.money) + '</b></div></div><div class="shop-grid">' +
        list.map(function (x) { return '<div class="si"><div class="ii">' + x.i + '</div><b>' + esc(x.n) + '</b><button data-buy="' + x.k + '">' + money(x.price) + '</button></div>'; }).join('') + '</div>';
}

function menuBp(d) {
    var bp = d.bp;
    return '<div class="bp-top"><div class="bp-lvl">' + bp.lvl + '</div><div class="bp-info"><b>Battle Pass · Сезон 1</b><small>Играйте на сервере: каждые ' + bp.need + ' минут — новый уровень и награда</small>' +
        '<div class="bar"><i style="width:' + (bp.lvl >= 30 ? 100 : bp.exp / bp.need * 100) + '%"></i></div></div></div><div class="bp-grid">' +
        bp.rewards.map(function (r) {
            var btn = r.claimed ? '<span class="lock">Получено ✓</span>' : r.open ? '<button data-claim="' + r.lvl + '">Забрать</button>' : '<span class="lock">🔒 Закрыто</span>';
            return '<div class="bpi' + (r.open && !r.claimed ? ' open' : '') + (r.claimed ? ' got' : '') + '"><span class="n">УРОВЕНЬ ' + r.lvl + '</span><span class="r">' + esc(r.text) + '</span>' + btn + '</div>';
        }).join('') + '</div>';
}

function menuSet() {
    var opts = [
        ['hud', 'Интерфейс на экране', 'Деньги, локация, время (то же, что F7)'],
        ['chat', 'Показывать чат', 'Скрыть или показать окно чата'],
        ['hints', 'Подсказки клавиш', 'Нижняя полоса с клавишами'],
        ['sound', 'Звук SMS', 'Звуковой сигнал при новом сообщении']
    ];
    var keys = [['M', 'Меню сервера'], ['I', 'Инвентарь'], ['Ё', 'Предметы рядом / багажник'], ['F3', 'Телефон'], ['F2', 'Курсор'], ['F7', 'Скрыть интерфейс'], ['T', 'Чат'], ['ESC', 'Закрыть окно'], ['Shift', 'Перетащить половину']];
    return '<div class="set-grid">' + opts.map(function (o) {
        return '<div class="opt"><div><b>' + o[1] + '</b><small>' + o[2] + '</small></div><div class="sw' + (settings[o[0]] ? ' on' : '') + '" data-set="' + o[0] + '"></div></div>';
    }).join('') + '</div><div class="keys">' + keys.map(function (k) { return '<div><kbd>' + k[0] + '</kbd>' + k[1] + '</div>'; }).join('') + '</div>';
}

function bindMenu() {
    var b = $('mBody');
    b.querySelectorAll('[data-cat]').forEach(function (x) { x.onclick = function () { shopCat = x.dataset.cat; renderMenu(); }; });
    b.querySelectorAll('[data-buy]').forEach(function (x) { x.onclick = function () { trig('cef:menu:buy', x.dataset.buy); }; });
    b.querySelectorAll('[data-claim]').forEach(function (x) { x.onclick = function () { trig('cef:menu:claim', Number(x.dataset.claim)); }; });
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
        if (d.kind === 'fuel') t.push(['stock', '🛢', 'Склад']);
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
            '<p>' + (d.kind === 'fuel' ? 'Вы получаете всю выручку с продажи топлива, сами ставите цены и заказываете поставки. Если топливо закончится — АЗС перестанет продавать.' : 'Вы получаете комиссию с каждого снятия наличных другими игроками. Размер комиссии ставите сами.') + '</p>' +
            '<button class="bz-btn pri" data-ba="buy"' + (d.myBank < d.price ? ' disabled' : '') + '>Купить за ' + money(d.price) + '</button></div>';
        else body += '<p class="bz-p">Этот бизнес принадлежит игроку <b>' + esc(d.ownerName) + '</b>.</p>';
    } else if (BZ.tab === 'stock' && d.stock) {
        var S = d.stock, pc = Math.round(S.cur / S.max * 100);
        body = '<div class="bz-tank"><div class="bz-tank-v"><i style="height:' + pc + '%" class="' + (S.deficit ? 'low' : '') + '"></i><span>' + pc + '%</span></div>' +
            '<div><small>Запас топлива</small><b>' + S.cur + ' / ' + S.max + ' л</b>' + (S.deficit ? '<em>Дефицит! Закажите поставку</em>' : '') +
            '<div class="bz-order"><label>Заказать у поставщика · $' + S.wholesale + ' за литр</label><div class="bz-row"><input type="range" min="100" max="' + Math.max(100, S.max - S.cur) + '" step="100" value="' + Math.min(BZ.order, Math.max(100, S.max - S.cur)) + '" id="bzOrd"><b id="bzOrdV">' + Math.min(BZ.order, Math.max(100, S.max - S.cur)) + ' л</b></div>' +
            '<button class="bz-btn pri" data-ba="order">Оформить заказ · <span id="bzOrdC">' + money(Math.min(BZ.order, Math.max(100, S.max - S.cur)) * S.wholesale) + '</span></button><small class="bz-note">Списывается из кассы, если не хватает — с карты. Скоро поставки будут возить дальнобойщики.</small></div></div></div>' +
            '<h4 class="bz-h4">Заказы</h4><div class="bz-list">' + (S.orders.length ? S.orders.map(function (o) {
                var st = { pending: ['Ожидает', 'w'], taken: ['В пути', 'b'], done: ['Доставлен', 'o'], cancel: ['Отменён', 'e'] }[o.s] || [o.s, ''];
                return '<div class="bz-li"><span>🛢 ' + o.l + ' л</span><small>' + esc(o.d) + '</small><em class="' + st[1] + '">' + st[0] + '</em></div>';
            }).join('') : '<p class="bz-p">Заказов пока не было</p>') + '</div>';
    } else if (BZ.tab === 'set') {
        body = d.settings.map(function (s) {
            return '<div class="bz-set"><div class="bz-set-top"><label>' + esc(s.l) + '</label><b id="bzv_' + s.k + '">' + s.v + s.unit + '</b></div>' +
                '<input type="range" min="' + s.min + '" max="' + s.max + '" step="' + s.step + '" value="' + s.v + '" data-set="' + s.k + '" data-unit="' + s.unit + '">' +
                (s.hint ? '<small>' + esc(s.hint) + '</small>' : '') + '<button class="bz-btn" data-save="' + s.k + '">Сохранить</button></div>';
        }).join('') +
            '<div class="bz-set"><label>Название бизнеса</label><div class="bz-row"><input class="bz-in" id="bzName" value="' + esc(d.name) + '" maxlength="32"><button class="bz-btn" data-ba="rename">Переименовать</button></div></div>' +
            '<div class="bz-set danger"><label>Продать государству</label><small>Вы получите ' + money(d.sellBack) + ' + деньги из кассы. Действие необратимо.</small><button class="bz-btn dan" data-ba="sell">Продать бизнес</button></div>';
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
    var ord = $('bzOrd');
    if (ord) ord.oninput = function () { BZ.order = Number(ord.value); $('bzOrdV').textContent = ord.value + ' л'; $('bzOrdC').textContent = money(ord.value * d.stock.wholesale); };
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
