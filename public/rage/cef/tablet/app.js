function $(id) { return document.getElementById(id); }
function trig() { if (window.mp && mp.trigger) mp.trigger.apply(mp, arguments); }
function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function money(n) { return '$' + String(Math.floor(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function dt(t) { var d = new Date(t); return d.toLocaleDateString('ru-RU') + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
function ago(t) { if (!t) return '—'; var s = Math.floor((Date.now() - t) / 1000); if (s < 3600) return Math.max(1, Math.floor(s / 60)) + ' мин назад'; if (s < 86400) return Math.floor(s / 3600) + ' ч назад'; return Math.floor(s / 86400) + ' дн назад'; }
function stars(n) { var h = ''; for (var i = 1; i <= 5; i++) h += i <= n ? '★' : '<i>★</i>'; return '<span class="stars">' + h + '</span>'; }
function act(o) { trig('cef:tab:act', JSON.stringify(o)); }

var D = null, page = 'home', found = null, plate = null, memFilter = '';
var COL = { lspd: '#2f6fff', sheriff: '#b8892b', fib: '#555c6b', army: '#4f6b2f', gov: '#b8892b', news: '#d9541e' };

window.tabData = function (json) {
    D = typeof json === 'string' ? JSON.parse(json) : json;
    document.documentElement.style.setProperty('--acc', COL[D.f] || '#2f6fff');
    $('fMark').textContent = (D.fn || 'P').slice(0, 4);
    $('fName').textContent = D.fn;
    $('meName').textContent = D.me.n;
    $('meRank').textContent = D.me.rn + (D.me.lead ? ' · Лидер' : D.me.dep ? ' · Заместитель' : '');
    $('meAv').textContent = D.me.n[0] || '?';
    if (D.web) { $('close').textContent = 'Выйти'; document.querySelector('.logo-s').textContent = 'Веб-планшет'; }
    render();
};
window.tabSearch = function (json) { found = typeof json === 'string' ? JSON.parse(json) : json; page = 'db'; render(); };
window.tabPlate = function (json) { plate = typeof json === 'string' ? JSON.parse(json) : json; page = 'db'; render(); };

window.tabToast = function (t, ok) { toast((ok ? '✓ ' : '✕ ') + t); };
function toast(t) { var e = $('toast'); e.textContent = t; e.classList.add('show'); clearTimeout(e._t); e._t = setTimeout(function () { e.classList.remove('show'); }, 2200); }
function modal(title, body, ok, fn) {
    $('mT').textContent = title; $('mB').innerHTML = body; $('mOk').textContent = ok || 'OK';
    $('modal').classList.add('show');
    var f = $('mB').querySelector('input,textarea,select'); if (f) setTimeout(function () { f.focus(); }, 30);
    $('mOk').onclick = function () { if (fn() !== false) $('modal').classList.remove('show'); };
}
$('mNo').onclick = function () { $('modal').classList.remove('show'); };
$('close').onclick = function () { trig('cef:tab:close'); };
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if ($('modal').classList.contains('show')) $('modal').classList.remove('show'); else trig('cef:tab:close'); } });

function nav() {
    var items = [['home', '🏠', 'Главная'], ['members', '👥', 'Состав'], ['squads', '🛡️', 'Отряды']];
    var C = D.can || {};
    if (C.search || C.wantedList || C.plate) {
        items.push(['sep', '', 'База данных']);
        if (C.wantedList) items.push(['wanted', '⭐', 'Розыск']);
        if (C.search || C.plate) items.push(['db', '🔎', 'Пробить по базе']);
        if (C.search) items.push(['fines', '🧾', 'Штрафы']);
    }
    items.push(['sep', '', 'Управление']);
    if (D.me.lead) items.push(['ranks', '🎖️', 'Ранги'], ['perms', '🔐', 'Права доступа']);
    items.push(['stock', '🗄️', 'Склад'], ['log', '📜', 'Журнал']);
    $('nav').innerHTML = items.map(function (x) { return x[0] === 'sep' ? '<div class="sep">' + x[2] + '</div>' : '<button data-p="' + x[0] + '" class="' + (page === x[0] ? 'on' : '') + '"><i>' + x[1] + '</i>' + x[2] + '</button>'; }).join('');
    $('nav').querySelectorAll('[data-p]').forEach(function (b) { b.onclick = function () { page = b.dataset.p; render(); }; });
}

function render() {
    if (!D) return;
    nav();
    var m = $('main'), h = '';
    var on = D.members.filter(function (x) { return x.on; });
    if (page === 'home') {
        h = '<div class="site-hero"><h1>' + esc(D.fn) + '</h1><p>Добро пожаловать, ' + esc(D.me.rn) + ' ' + esc(D.me.n) + '. Служебная сеть штата Сан-Андреас.</p></div>' +
            '<div class="stats"><div class="st"><small>Сотрудников</small><b>' + D.members.length + '</b></div><div class="st"><small>В сети</small><b>' + on.length + '</b></div><div class="st"><small>На смене</small><b>' + on.filter(function (x) { return x.duty; }).length + '</b></div>' +
            (D.police ? '<div class="st"><small>В розыске</small><b>' + (D.wanted || []).length + '</b></div>' : '<div class="st"><small>Отрядов</small><b>' + D.squads.length + '</b></div>') + '</div>' +
            '<div class="grid2"><div class="card"><h3>👥 Сейчас в сети</h3>' + (on.length ? on.map(function (x) { return '<div class="kv"><b><span class="dot on"></span>' + esc(x.n) + (x.duty ? '<span class="tag duty">на смене</span>' : '') + '</b><span>' + esc(x.rn) + '</span></div>'; }).join('') : '<div class="empty">Никого</div>') + '</div>' +
            '<div class="card"><h3>📜 Последние события</h3>' + (D.log.slice(0, 8).map(function (l) { return '<div class="log"><span>' + ago(l.t) + '</span>' + esc(l.x) + '</div>'; }).join('') || '<div class="empty">Пусто</div>') + '</div></div>';
    } else if (page === 'members') {
        var list = D.members.filter(function (x) { return !memFilter || x.n.toLowerCase().indexOf(memFilter.toLowerCase()) >= 0; });
        h = '<h2>Общий состав</h2><div class="sub">Всего ' + D.members.length + ' · управлять могут лидер и заместители</div>' +
            '<div class="row"><input class="in" id="mf" placeholder="Поиск по имени" value="' + esc(memFilter) + '" style="flex:1">' + (D.me.manage ? '<button class="btn" id="inv">+ Пригласить</button>' : '') + '</div>' +
            '<table><tr><th>Сотрудник</th><th>Ранг</th><th>Отряд</th><th>Был в сети</th><th></th></tr>' + list.map(function (x) {
                var self = x.id === D.me.id;
                var ctl = D.me.manage && !self && !x.lead ? '<div class="acts"><button class="btn green sm" data-a="rankup" data-id="' + x.id + '">▲</button><button class="btn ghost sm" data-a="rankdown" data-id="' + x.id + '">▼</button>' +
                    (D.me.lead ? '<button class="btn ghost sm" data-a="dep" data-id="' + x.id + '">' + (x.dep ? 'Снять зама' : 'Зам') + '</button>' : '') + '<button class="btn red sm" data-a="fire" data-id="' + x.id + '" data-n="' + esc(x.n) + '">Уволить</button></div>' : '';
                return '<tr><td><span class="dot' + (x.on ? ' on' : '') + '"></span>' + esc(x.n) + (x.lead ? '<span class="tag l">Лидер</span>' : x.dep ? '<span class="tag d">Зам</span>' : '') + (x.duty ? '<span class="tag duty">смена</span>' : '') + '</td><td>' + x.r + ' · ' + esc(x.rn) + '</td><td>' + esc(x.sq || '—') + '</td><td>' + (x.on ? 'в сети' : ago(x.last)) + '</td><td>' + ctl + '</td></tr>';
            }).join('') + '</table>';
    } else if (page === 'squads') {
        h = '<h2>Отряды</h2><div class="sub">Подразделения внутри организации</div>' + (D.me.manage ? '<div class="row"><input class="in" id="sqN" placeholder="Название отряда (например, SWAT)" style="flex:1"><button class="btn" id="sqAdd">Создать отряд</button></div>' : '') +
            (D.squads.length ? D.squads.map(function (s) {
                var mem = s.m.map(function (id) { var x = D.members.find(function (z) { return z.id === id; }); return x ? '<span>' + (s.lead === id ? '<b>★</b>' : '') + esc(x.n) + (D.me.manage ? '<button data-sl="' + s.i + '" data-id="' + id + '" title="Командир">★</button><button data-sk="' + s.i + '" data-id="' + id + '">✕</button>' : '') + '</span>' : ''; }).join('');
                return '<div class="card"><h3>🛡️ ' + esc(s.n) + ' <span class="tag">' + s.m.length + ' чел.</span></h3><div class="sq-m">' + (mem || '<small style="color:var(--mut)">Пока никого</small>') + '</div>' +
                    (D.me.manage ? '<div class="row" style="margin-top:12px;margin-bottom:0"><select class="in" id="sqSel' + s.i + '" style="flex:1"><option value="">Добавить сотрудника…</option>' + D.members.filter(function (x) { return s.m.indexOf(x.id) < 0; }).map(function (x) { return '<option value="' + x.id + '">' + esc(x.n) + ' · ' + esc(x.rn) + '</option>'; }).join('') + '</select><button class="btn ghost" data-sj="' + s.i + '">Добавить</button><button class="btn ghost" data-sr="' + s.i + '">Переименовать</button><button class="btn red" data-sd="' + s.i + '">Удалить</button></div>' : '') + '</div>';
            }).join('') : '<div class="empty">Отрядов пока нет</div>');
    } else if (page === 'ranks') {
        h = '<h2>Ранги</h2><div class="sub">Названия рангов вашей организации. Последний — ранг лидера</div><div class="card">' + D.ranks.map(function (r, i) {
            return '<div class="rk"><em>' + (i + 1) + '</em><input class="in" data-ri="' + i + '" value="' + esc(r) + '" maxlength="32"><button class="btn ghost sm" data-rs="' + i + '">Сохранить</button>' + (i > 0 && i < D.ranks.length - 1 ? '<button class="btn red sm" data-rd="' + i + '">✕</button>' : '') + '</div>';
        }).join('') + '<div class="row" style="margin-top:12px;margin-bottom:0"><input class="in" id="rN" placeholder="Новый ранг (встанет перед лидером)" style="flex:1"><button class="btn" id="rAdd">Добавить ранг</button></div></div>';
    } else if (page === 'perms') {
        h = '<h2>Права доступа</h2><div class="sub">С какого ранга сотрудникам доступны функции базы данных. Лидер и заместители имеют полный доступ</div><div class="card">' +
            D.perms.map(function (x) {
                return '<div class="rk"><span style="flex:1;font-size:13px">' + esc(x.n) + (x.pol ? ' <span class="tag">только полиция</span>' : '') + '</span><select class="in" data-pk="' + x.k + '" style="width:260px">' +
                    D.ranks.map(function (r, i) { return '<option value="' + (i + 1) + '"' + (x.r === i + 1 ? ' selected' : '') + '>с ' + (i + 1) + ' · ' + esc(r) + '</option>'; }).join('') + '</select></div>';
            }).join('') + '</div>';
    } else if (page === 'wanted') {
        var W = D.wanted || [];
        h = '<h2>База разыскиваемых</h2><div class="sub">Отслеживание показывает лишь примерную зону ~300 м — найдите подозреваемого сами</div>' +
            (W.length ? '<table><tr><th>Подозреваемый</th><th>Розыск</th><th>Причина</th><th>Штрафы</th><th>Объявил</th><th></th></tr>' + W.map(function (w) {
                return '<tr><td><span class="dot' + (w.on ? ' on' : '') + '"></span>' + esc(w.n) + ' <small style="color:var(--mut)">#' + w.s + '</small></td><td>' + stars(w.stars) + '</td><td>' + esc(w.r) + '</td><td>' + (w.fines ? w.fines + ' неоплач.' : '—') + '</td><td>' + esc(w.by) + '<br><small style="color:var(--mut)">' + ago(w.d) + '</small></td>' +
                    '<td><div class="acts">' + (D.can.track ? '<button class="btn sm" data-tr="' + w.s + '"' + (w.on ? '' : ' disabled') + '>📡 Отследить</button>' : '') + (D.can.search ? '<button class="btn ghost sm" data-dos="' + w.s + '">Досье</button>' : '') + (D.can.wanted ? '<button class="btn green sm" data-wc="' + w.s + '">Снять</button>' : '') + '</div></td></tr>';
            }).join('') + '</table>' : '<div class="empty">Сейчас никто не в розыске</div>');
    } else if (page === 'db') {
        h = '<h2>Пробить по базе</h2><div class="sub">' + (D.can.dossier ? 'Поиск по имени, номеру телефона (123-456) или ID (#15). Отдельно — по номеру машины' : 'Ограниченный доступ: личность, документы, розыск, штрафы и нарушения') + '</div>' +
            (D.can.search ? '<div class="row"><input class="in" id="q" placeholder="Имя Фамилия / 123-456 / #ID" style="flex:1"><button class="btn" id="qGo">Найти человека</button></div>' : '') +
            (D.can.plate ? '<div class="row"><input class="in" id="pq" placeholder="Номерной знак" style="flex:1" maxlength="8"><button class="btn ghost" id="pGo">Пробить номер</button></div>' : '');
        if (plate) h += '<div class="card"><h3>🚗 ' + esc(plate.plate) + '</h3><div class="kv"><span>Модель</span><b>' + esc(plate.model) + '</b></div><div class="kv"><span>Владелец</span><b>' + esc(plate.owner) + '</b></div>' + (plate.s ? '<button class="btn ghost" style="margin-top:10px" data-dos="' + plate.s + '">Открыть досье владельца</button>' : '') + '</div>';
        if (found) h += found.map(dossier).join('');
    } else if (page === 'fines') {
        var Fz = D.fines || [];
        h = '<h2>Неоплаченные штрафы</h2><div class="sub">Выписать штраф — через досье гражданина (Пробить по базе). Граждане оплачивают командой /fines</div>' +
            (Fz.length ? '<table><tr><th>№</th><th>Гражданин</th><th>Сумма</th><th>Причина</th><th>Выписал</th><th>Дата</th></tr>' + Fz.map(function (f) { return '<tr><td>' + f.id + '</td><td><a data-dos="' + f.s + '" style="cursor:pointer;color:#8fb2ff">#' + f.s + '</a></td><td>' + money(f.sum) + '</td><td>' + esc(f.r) + '</td><td>' + esc(f.by) + '</td><td>' + dt(f.at) + '</td></tr>'; }).join('') + '</table>' : '<div class="empty">Неоплаченных штрафов нет</div>');
    } else if (page === 'stock') {
        h = '<h2>Склад</h2><div class="sub">Пополняется поставками армии</div><div class="stats">' + D.stock.map(function (s) { return '<div class="st"><small>' + esc(s.n) + '</small><b style="color:' + (s.c ? '#fff' : 'var(--red)') + '">' + s.c + '</b></div>'; }).join('') + '</div>';
    } else if (page === 'log') {
        h = '<h2>Журнал организации</h2><div class="sub">Последние действия руководства и поставки</div><div class="card">' + (D.log.map(function (l) { return '<div class="log"><span>' + dt(l.t) + '</span>' + esc(l.x) + '</div>'; }).join('') || '<div class="empty">Пусто</div>') + '</div>';
    }
    m.innerHTML = h;
    bind(m);
}

function dossier(x) {
    var DOC = { passport: 'Паспорт', drive: 'Вод. удостоверение', military: 'Военный билет', med: 'Мед. книжка', psych: 'Справка психиатра', gun: 'Лицензия на оружие', faction: 'Служебное удостоверение' };
    var unpaid = x.fines.filter(function (f) { return !f.paid; });
    var C = D.can || {};
    var lim = '<span style="color:var(--mut)">🔒 нет доступа</span>';
    return '<div class="card"><h3>🪪 ' + esc(x.n) + ' <span class="tag">#' + x.s + '</span><span class="dot' + (x.on ? ' on' : '') + '" style="margin-left:6px"></span>' + (x.wanted ? stars(x.wanted.stars) : '<span class="tag duty">не в розыске</span>') + '</h3>' +
        '<div class="grid2"><div>' +
        '<div class="kv"><span>Пол</span><b>' + x.g + '</b></div><div class="kv"><span>Работа</span><b>' + esc(x.job) + '</b></div><div class="kv"><span>Телефон</span><b>' + (x.full ? esc(x.phone || '—') : lim) + '</b></div>' +
        '<div class="kv"><span>Жильё</span><b>' + (x.full ? esc(x.house || 'нет') : lim) + '</b></div><div class="kv"><span>Транспорт</span><b>' + (x.full ? (x.veh.length ? esc(x.veh.join(', ')) : 'нет') : lim) + '</b></div>' +
        '<div class="kv"><span>Документы</span><b>' + (x.docs.length ? x.docs.map(function (d) { return esc(DOC[d.t] || d.t); }).join(', ') : 'нет') + '</b></div>' +
        (x.wanted ? '<div class="kv"><span>Причина розыска</span><b>' + esc(x.wanted.r) + '</b></div>' : '') +
        '<div class="kv"><span>Штрафы</span><b>' + (unpaid.length ? unpaid.length + ' на ' + money(unpaid.reduce(function (s, f) { return s + f.sum; }, 0)) : 'нет') + '</b></div>' +
        '</div><div><b style="font-size:12px;color:var(--mut)">История</b>' + (x.notes.length ? x.notes.map(function (n) { return '<div class="log"><span>' + dt(n.t) + '</span>' + esc(n.x) + ' <small style="color:var(--mut)">— ' + esc(n.by) + '</small></div>'; }).join('') : '<div class="empty" style="padding:16px 0">Записей нет</div>') + '</div></div>' +
        '<div class="row" style="margin:12px 0 0">' + (C.wanted ? '<button class="btn red" data-ws="' + x.s + '" data-n="' + esc(x.n) + '">⭐ Розыск</button>' : '') + (C.fine ? '<button class="btn ghost" data-fi="' + x.s + '" data-n="' + esc(x.n) + '">🧾 Штраф</button>' : '') + (C.note ? '<button class="btn ghost" data-no="' + x.s + '">📝 Запись</button>' : '') + (C.track ? '<button class="btn" data-tr="' + x.s + '"' + (x.on ? '' : ' disabled') + '>📡 Отследить</button>' : '') + (x.wanted && C.wanted ? '<button class="btn green" data-wc="' + x.s + '">Снять розыск</button>' : '') + '</div></div>';
}

function bind(m) {
    var on = function (sel, fn) { m.querySelectorAll(sel).forEach(function (b) { b.onclick = function (e) { fn(b, e); }; }); };
    var mf = $('mf'); if (mf) mf.oninput = function () { memFilter = mf.value; var p = mf.selectionStart; render(); var n = $('mf'); n.focus(); n.setSelectionRange(p, p); };
    var inv = $('inv'); if (inv) inv.onclick = function () {
        modal('Пригласить в организацию', '<label>ID игрока (должен стоять рядом)</label><input class="in" id="iId" type="number"><p style="font-size:12px;color:var(--mut);margin-top:10px">Новый сотрудник будет принят на 1 ранг — «' + esc(D.ranks[0]) + '». Повысить можно в разделе «Состав».</p>', 'Пригласить', function () {
            if (!$('iId').value) { toast('Укажите ID'); return false; }
            act({ a: 'invite', id: Number($('iId').value) });
        });
    };
    on('[data-a]', function (b) {
        if (b.dataset.a === 'fire') return modal('Уволить ' + b.dataset.n + '?', '<label>Причина</label><input class="in" id="fR" placeholder="Например: прогулы">', 'Уволить', function () { act({ a: 'fire', id: Number(b.dataset.id), reason: $('fR').value.trim() }); });
        act({ a: b.dataset.a, id: Number(b.dataset.id) });
    });
    var sa = $('sqAdd'); if (sa) sa.onclick = function () { var n = $('sqN').value.trim(); if (n) act({ a: 'sqadd', n: n }); };
    on('[data-sj]', function (b) { var v = $('sqSel' + b.dataset.sj).value; if (v) act({ a: 'sqjoin', i: Number(b.dataset.sj), id: Number(v) }); });
    on('[data-sd]', function (b) { act({ a: 'sqdel', i: Number(b.dataset.sd) }); });
    on('[data-sr]', function (b) { modal('Переименовать отряд', '<input class="in" id="srN" maxlength="32">', 'Сохранить', function () { act({ a: 'sqren', i: Number(b.dataset.sr), n: $('srN').value }); }); });
    on('[data-sk]', function (b) { act({ a: 'sqkick', i: Number(b.dataset.sk), id: Number(b.dataset.id) }); });
    on('[data-sl]', function (b) { act({ a: 'sqlead', i: Number(b.dataset.sl), id: Number(b.dataset.id) }); });
    on('[data-rs]', function (b) { act({ a: 'rname', i: Number(b.dataset.rs), n: m.querySelector('[data-ri="' + b.dataset.rs + '"]').value }); });
    on('[data-rd]', function (b) { act({ a: 'rdel', i: Number(b.dataset.rd) }); });
    m.querySelectorAll('[data-pk]').forEach(function (s) { s.onchange = function () { act({ a: 'perm', k: s.dataset.pk, r: Number(s.value) }); }; });
    var ra = $('rAdd'); if (ra) ra.onclick = function () { var n = $('rN').value.trim(); if (n) act({ a: 'radd', n: n }); };
    on('[data-tr]', function (b) { act({ a: 'track', s: Number(b.dataset.tr) }); toast('Запрос сигнала…'); });
    on('[data-wc]', function (b) { act({ a: 'wanted', s: Number(b.dataset.wc), stars: 0 }); setTimeout(function () { if (page === 'db' && found) act({ a: 'search', q: '#' + b.dataset.wc }); }, 300); });
    on('[data-dos]', function (b) { plate = null; act({ a: 'search', q: '#' + b.dataset.dos }); });
    on('[data-ws]', function (b) {
        modal('Объявить в розыск: ' + b.dataset.n, '<label>Уровень</label><div class="chips" id="wsC">' + [1, 2, 3, 4, 5].map(function (i) { return '<button class="chip' + (i === 1 ? ' on' : '') + '" data-v="' + i + '">' + i + '★</button>'; }).join('') + '</div><label>Причина (1★ = 10 мин тюрьмы)</label><input class="in" id="wsR" maxlength="80" placeholder="Например: вооружённое ограбление">', 'Объявить', function () {
            var r = $('wsR').value.trim(); if (!r) { toast('Укажите причину'); return false; }
            act({ a: 'wanted', s: Number(b.dataset.ws), stars: Number($('wsC').querySelector('.on').dataset.v), r: r });
            setTimeout(function () { act({ a: 'search', q: '#' + b.dataset.ws }); }, 300);
        });
        $('wsC').querySelectorAll('.chip').forEach(function (c) { c.onclick = function () { $('wsC').querySelectorAll('.chip').forEach(function (z) { z.classList.toggle('on', z === c); }); }; });
    });
    on('[data-fi]', function (b) {
        modal('Штраф: ' + b.dataset.n, '<label>Сумма ($50–100 000)</label><input class="in" id="fS" type="number" value="500"><label>Причина</label><input class="in" id="fR2" maxlength="80" placeholder="Например: превышение скорости">', 'Выписать', function () {
            var r = $('fR2').value.trim(); if (!r) { toast('Укажите причину'); return false; }
            act({ a: 'fine', s: Number(b.dataset.fi), sum: Number($('fS').value), r: r });
            setTimeout(function () { act({ a: 'search', q: '#' + b.dataset.fi }); }, 300);
        });
    });
    on('[data-no]', function (b) {
        modal('Запись в досье', '<textarea class="in" id="nT" rows="4" maxlength="200" placeholder="Например: задержан у банка, изъят нож"></textarea>', 'Добавить', function () {
            var t = $('nT').value.trim(); if (!t) return false;
            act({ a: 'note', s: Number(b.dataset.no), t: t });
            setTimeout(function () { act({ a: 'search', q: '#' + b.dataset.no }); }, 300);
        });
    });
    var qg = $('qGo'); if (qg) { qg.onclick = function () { plate = null; act({ a: 'search', q: $('q').value }); }; $('q').onkeydown = function (e) { if (e.key === 'Enter') qg.onclick(); }; }
    var pg = $('pGo'); if (pg) { pg.onclick = function () { found = null; act({ a: 'plate', q: $('pq').value }); }; $('pq').onkeydown = function (e) { if (e.key === 'Enter') pg.onclick(); }; }
}
