function $(id) { return document.getElementById(id); }
function trig() { if (window.mp && mp.trigger) mp.trigger.apply(mp, arguments); }
function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function money(n) { return '$' + String(Math.floor(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function pad(n) { return n < 10 ? '0' + n : '' + n; }

var DATA = { inv: null, phone: null, menu: null };
var current = null;

window.uiOpen = function (name, opt) {
    ['inv', 'phone', 'menu'].forEach(function (s) { $(s).classList.toggle('show', s === name); });
    current = name;
    hideCtx();
    if (name === 'phone') phoneHome();
    if (name === 'menu') renderMenu();
};
window.uiClose = function () {
    ['inv', 'phone', 'menu'].forEach(function (s) { $(s).classList.remove('show'); });
    current = null;
    hideCtx();
    closeModal();
};
window.uiData = function (kind, d) {
    DATA[kind] = d;
    if (kind === 'inv') renderInv();
    if (kind === 'phone') phoneRefresh();
    if (kind === 'menu' && current === 'menu') renderMenu();
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

    $('stats').innerHTML = d.stats.map(ringStat).join('');

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
var lastSeen = Number(localStorage.getItem('sms_seen') || 0);

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
        localStorage.setItem('sms_seen', lastSeen);
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
        body.innerHTML = '<textarea class="f-in" id="notesT" style="height:440px;resize:none;line-height:1.5" placeholder="Ваши заметки...">' + esc(localStorage.getItem('ph_notes') || '') + '</textarea>';
        $('notesT').oninput = function () { localStorage.setItem('ph_notes', this.value); };
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
var settings = JSON.parse(localStorage.getItem('ui_settings') || '{"hud":true,"chat":true,"sound":true,"hints":true}');

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
    var d = DATA.menu;
    var b = $('mBody');
    if (!d) { b.innerHTML = '<div class="empty-t">Загрузка...</div>'; return; }
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
        tile('orange-t', 'docs.jpg', '<div class="t-cap">Ваши документы</div><div class="t-sub">Паспорт, банковская карта</div>') +
        '</div>' +
        '<div class="r2">' + cars + '</div>' +
        '<div class="r3">' +
        tile('blue-t', 'biz.jpg', '<div class="t-cap">Ваши финансы</div><div class="t-big">' + money(d.money + d.bank) + '</div><div class="t-kv"><span>Наличные</span><b>' + money(d.money) + '</b><span>На счёте</span><b>' + money(d.bank) + '</b><span>Часов в игре</span><b>' + d.hours + '</b></div>') +
        tile('yellow-t', 'lic.jpg', '<div class="t-cap" style="font-weight:600">Ваши лицензии</div><div class="t-sub">Список всех ваших лицензий</div>') +
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
            localStorage.setItem('ui_settings', JSON.stringify(settings));
            trig('cef:ui:set', k, settings[k]);
            renderMenu();
        };
    });
    var r = b.querySelector('[data-report]');
    if (r) r.onclick = openReport;
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
