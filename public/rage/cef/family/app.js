function $(id) { return document.getElementById(id); }
function trig() { if (window.mp && mp.trigger) mp.trigger.apply(mp, arguments); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function money(n) { return '$' + String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function num(n) { return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function dt(t) { var d = new Date(t); return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
function act(a, o) { trig('cef:fam:act', a, JSON.stringify(o || {})); }
function close() { trig('cef:fam:close'); }

var D = null, F = { type: 'family', n: '', tag: '', c: '' }, TAB = 'home', LOGF = 'all';
window.fam = function (j) { D = typeof j === 'string' ? JSON.parse(j) : j; if (D.mode === 'reg' && !F.c) F.c = D.colors[5]; render(); };
window.famMsg = function (t, ok) {
    var m = $('toast'); if (!m) return;
    m.textContent = t; m.className = 'toast show ' + (ok ? 'ok' : 'err');
    clearTimeout(window._tt); window._tt = setTimeout(function () { m.className = 'toast'; }, 3200);
    var g = $('go'); if (g) g.disabled = false;
};
document.addEventListener('keydown', function (e) { if (e.keyCode === 27 && !/INPUT|SELECT/.test(document.activeElement.tagName)) close(); });

function render() { if (D.mode === 'tab') tablet(); else form(); }

/* ================= РЕГИСТРАЦИЯ ================= */
function form() {
    var t = D.types.find(function (x) { return x.k === F.type; }) || D.types[0];
    var fee = t.price + Math.round(t.price * D.tax), have = D.cash + D.bank;
    var types = D.types.map(function (x) {
        return '<div class="ty' + (x.k === F.type ? ' on' : '') + '" data-t="' + x.k + '"><i>' + x.i + '</i><b>' + esc(x.n) + '</b><small>' + esc(x.d) + '</small>' +
            '<div class="ty-f"><span>👥 до ' + x.slots + '</span><span>🎖 ' + x.ranks + ' рангов</span></div><em>' + money(x.price) + '</em></div>';
    }).join('');
    var cols = D.colors.map(function (c) { return '<s data-c="' + c + '" class="' + (c === F.c ? 'on' : '') + '" style="background:' + c + '"></s>'; }).join('');
    var tagV = (F.tag || 'TAG').toUpperCase();
    document.body.className = 'reg';
    $('box').innerHTML = '<div class="hd"><div class="seal">🏛</div><div><b>РЕГИСТРАЦИЯ ОРГАНИЗАЦИИ</b><small>Мэрия Лос-Сантоса · заполните основную информацию</small></div><div class="x" id="cl">✕</div></div>' +
        '<div class="body"><div class="lft">' +
        '<div class="lbl">Тип организации</div><div class="types">' + types + '</div>' +
        '<div class="row2"><label><span>Название организации</span><input id="fn" maxlength="24" placeholder="Например, Corleone" value="' + esc(F.n) + '"></label>' +
        '<label class="sm"><span>Тег</span><input id="ft" maxlength="4" placeholder="TAG" value="' + esc(F.tag) + '"></label></div>' +
        '<div class="lbl">Основной цвет</div><div class="cols">' + cols + '</div>' +
        '</div><div class="rgt">' +
        '<div class="lbl">Предпросмотр</div>' +
        '<div class="pv" style="--c:' + F.c + '"><div class="pv-top"><span class="pv-tag">' + esc(tagV) + '</span><span>' + t.i + ' ' + esc(t.n) + '</span></div>' +
        '<div class="pv-n">' + esc(F.n || 'Название организации') + '</div>' +
        '<div class="pv-chat"><b style="color:' + F.c + '">[' + esc(tagV) + '] Глава Вы:</b> всем привет!</div>' +
        '<div class="pv-apps"><div><i>👥</i>Состав</div><div><i>🚗</i>Гараж</div><div><i>🏰</i>Особняк</div></div></div>' +
        '<div class="bill"><div><span>Регистрация</span><b>' + money(t.price) + '</b></div><div><span>Госпошлина ' + Math.round(D.tax * 100) + '%</span><b>' + money(fee - t.price) + '</b></div>' +
        '<div class="tot"><span>Стоимость создания</span><b>' + money(fee) + '</b></div><div class="have"><span>У вас (нал + банк)</span><b class="' + (have >= fee ? 'g' : 'r') + '">' + money(have) + '</b></div></div>' +
        (D.pass ? '' : '<div class="warn">Нужен паспорт — оформите у паспортного стола в мэрии</div>') +
        '<button id="go"' + (have >= fee && D.pass ? '' : ' disabled') + '>Зарегистрировать</button>' +
        '</div></div><div class="toast" id="toast"></div>';
    $('cl').onclick = close;
    document.querySelectorAll('[data-t]').forEach(function (el) { el.onclick = function () { F.type = el.dataset.t; form(); }; });
    document.querySelectorAll('[data-c]').forEach(function (el) { el.onclick = function () { F.c = el.dataset.c; form(); }; });
    $('fn').oninput = function () { F.n = this.value; document.querySelector('.pv-n').textContent = F.n || 'Название организации'; };
    $('ft').oninput = function () { this.value = this.value.toUpperCase().replace(/[^A-ZА-ЯЁ0-9]/g, ''); F.tag = this.value; var v = F.tag || 'TAG'; document.querySelector('.pv-tag').textContent = v; document.querySelector('.pv-chat b').textContent = '[' + v + '] Глава Вы:'; };
    $('go').onclick = function () { this.disabled = true; trig('cef:fam:create', JSON.stringify(F)); };
}

/* ================= ПЛАНШЕТ ================= */
var TABS = [['home', '🏠', 'Главная'], ['mem', '👥', 'Состав'], ['ranks', '🎖', 'Ранги и доступы'], ['cars', '🚗', 'Гараж'], ['house', '🏰', 'Особняк'], ['bank', '💰', 'Общак и репутация'], ['log', '📜', 'Журнал']];
function rn(r) { return D.f.ranks[Math.max(1, Math.min(D.f.ranks.length, r)) - 1]; }
function rankSel(id, cur, from, to) {
    var o = ''; for (var i = from; i <= to; i++) o += '<option value="' + i + '"' + (i === cur ? ' selected' : '') + '>' + i + ' · ' + esc(rn(i)) + '</option>';
    return '<select id="' + id + '">' + o + '</select>';
}
function tablet() {
    document.body.className = 'tab';
    var f = D.f, on = D.members.filter(function (m) { return m.on; }).length;
    var nav = TABS.filter(function (t) { return t[0] !== 'log' || D.my.log; }).map(function (t) { return '<div class="nv' + (TAB === t[0] ? ' on' : '') + '" data-tab="' + t[0] + '"><i>' + t[1] + '</i>' + t[2] + '</div>'; }).join('');
    $('box').innerHTML = '<div class="tb" style="--c:' + f.c + '">' +
        '<div class="side"><div class="logo"><span class="tg">' + esc(f.tag) + '</span><b>' + esc(f.n) + '</b><small>' + f.ti + ' ' + esc(f.type) + '</small></div>' + nav +
        '<div class="me">Вы: <b>' + esc(rn(D.myR)) + '</b>' + (D.head ? ' 👑' : '') + '</div></div>' +
        '<div class="main"><div class="top"><div class="chips"><span>👥 ' + D.members.length + '/' + f.slots + '</span><span>🟢 ' + on + ' онлайн</span><span>💰 ' + money(f.bank) + '</span><span class="rp">⭐ ' + num(f.rep) + ' реп.</span></div><div class="x" id="cl">✕</div></div>' +
        '<div class="pg" id="pg"></div></div></div><div class="toast" id="toast"></div>';
    $('cl').onclick = close;
    document.querySelectorAll('[data-tab]').forEach(function (el) { el.onclick = function () { TAB = el.dataset.tab; tablet(); }; });
    ({ home: pHome, mem: pMem, ranks: pRanks, cars: pCars, house: pHouse, bank: pBank, log: pLog }[TAB] || pHome)();
}
function card(t, b, cls) { return '<div class="cd ' + (cls || '') + '"><div class="ct">' + t + '</div>' + b + '</div>'; }
function pHome() {
    var f = D.f, h = D.house;
    var last = (D.log || []).slice(0, 6).map(function (l) { return '<div class="lg"><span>' + dt(l.t) + '</span>' + esc(l.x) + '</div>'; }).join('') || '<div class="mut">Журнал доступен со старших рангов</div>';
    $('pg').innerHTML = '<h2>Добро пожаловать, ' + esc(rn(D.myR)) + '</h2>' +
        '<div class="g3">' +
        card('Репутация', '<div class="big rp">⭐ ' + num(f.rep) + '</div><div class="mut">+' + D.rep.perOnline + ' за каждого онлайн раз в ' + D.rep.everyMin + ' мин · +1 за каждые ' + money(D.rep.perDeposit) + ' в общак</div>') +
        card('Общак', '<div class="big">' + money(f.bank) + '</div><div class="mut">Из общака покупаются машины семьи</div>') +
        card('Особняк', h ? '<div class="big sm">🏰 ' + esc(h.n) + '</div><div class="mut">' + (h.open ? 'Открыт для гостей' : 'Только для семьи') + '</div>' : '<div class="big sm">Нет</div><div class="mut">Покупается за репутацию во вкладке «Особняк»</div>') +
        '</div>' +
        '<div class="g2">' + card('Последние события', last) +
        card('Быстрые действия', '<div class="qa"><button data-go="cars">🚗 Вызвать машину</button><button data-go="bank">💰 Пополнить общак</button>' + (D.my.invite ? '<button data-go="mem">➕ Пригласить</button>' : '') + (h ? '<button id="hg">📍 Метка на особняк</button>' : '') + '</div>' +
            '<div class="mut" style="margin-top:12px">Чат семьи: <code>/fam текст</code> · планшет: <code>O</code></div>') + '</div>';
    document.querySelectorAll('[data-go]').forEach(function (b) { b.onclick = function () { TAB = b.dataset.go; tablet(); }; });
    if ($('hg')) $('hg').onclick = function () { act('hgps'); };
}
function pMem() {
    var L = D.f.ranks.length;
    var inv = D.my.invite ? '<div class="inl"><input id="pid" placeholder="ID игрока рядом" maxlength="4"><button id="inv">Пригласить</button></div>' : '';
    var rows = D.members.map(function (m) {
        var self = m.id === D.me, canR = D.my.rank && !self && !m.head && (D.head || m.r < D.myR), canK = D.my.kick && !self && !m.head && (D.head || m.r < D.myR);
        var maxR = D.head ? L - 1 : D.myR - 1;
        return '<tr><td><i class="dot' + (m.on ? ' on' : '') + '"></i>' + (m.head ? '👑 ' : '') + esc(m.n) + (self ? ' <em>(вы)</em>' : '') + '</td><td>' +
            (canR ? rankSel('r' + m.id, m.r, 1, maxR) : '<span class="rk">' + m.r + ' · ' + esc(rn(m.r)) + '</span>') + '</td><td class="mut">' + (m.j ? dt(m.j).slice(0, 5) : '—') + '</td><td class="ac">' +
            (canR ? '<button class="sm" data-sr="' + m.id + '">OK</button>' : '') + (canK ? '<button class="sm r" data-k="' + m.id + '">Выгнать</button>' : '') +
            (D.head && !self ? '<button class="sm g" data-h="' + m.id + '" title="Передать главенство">👑</button>' : '') + '</td></tr>';
    }).join('');
    $('pg').innerHTML = '<div class="row"><h2>Состав · ' + D.members.length + ' / ' + D.f.slots + '</h2>' + inv + '</div>' +
        '<table><thead><tr><th>Участник</th><th>Ранг</th><th>Вступил</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<button class="ghost" id="lv">' + (D.head && D.members.length <= 1 ? 'Распустить организацию' : 'Покинуть семью') + '</button>';
    if ($('inv')) $('inv').onclick = function () { act('invite', { pid: Number($('pid').value) }); };
    document.querySelectorAll('[data-sr]').forEach(function (b) { b.onclick = function () { act('setrank', { id: Number(b.dataset.sr), r: Number($('r' + b.dataset.sr).value) }); }; });
    document.querySelectorAll('[data-k]').forEach(function (b) { b.onclick = function () { if (b.dataset.ok) act('kick', { id: Number(b.dataset.k) }); else { b.dataset.ok = 1; b.textContent = 'Точно?'; } }; });
    document.querySelectorAll('[data-h]').forEach(function (b) { b.onclick = function () { if (b.dataset.ok) act('head', { id: Number(b.dataset.h) }); else { b.dataset.ok = 1; b.textContent = 'Передать?'; } }; });
    $('lv').onclick = function () { if (this.dataset.ok) act('leave'); else { this.dataset.ok = 1; this.textContent = 'Точно? Нажмите ещё раз'; } };
}
function pRanks() {
    var L = D.f.ranks.length;
    var names = D.f.ranks.map(function (r, i) {
        return '<div class="rn"><span class="no">' + (i + 1) + '</span>' + (D.head ? '<input id="rn' + (i + 1) + '" value="' + esc(r) + '" maxlength="20"><button class="sm" data-rn="' + (i + 1) + '">Сохранить</button>' : '<b>' + esc(r) + '</b>') + '</div>';
    }).join('');
    var perms = Object.keys(D.permNames).map(function (k) {
        var cur = D.f.perms[k];
        return '<div class="pm"><span>' + esc(D.permNames[k]) + '</span>' + (D.head ? rankSel('p_' + k, cur, 1, L) : '<b class="rk">с ' + cur + ' · ' + esc(rn(cur)) + '</b>') + '<i class="' + (D.my[k] ? 'y' : 'n') + '">' + (D.my[k] ? '✓' : '✕') + '</i></div>';
    }).join('');
    $('pg').innerHTML = '<h2>Ранги и доступы</h2><div class="g2">' + card('Названия рангов', names) +
        card('Доступы по рангам', '<div class="mut" style="margin-bottom:8px">Минимальный ранг для действия. Глава может всё.</div>' + perms) + '</div>';
    document.querySelectorAll('[data-rn]').forEach(function (b) { b.onclick = function () { act('rankname', { r: Number(b.dataset.rn), n: $('rn' + b.dataset.rn).value }); }; });
    Object.keys(D.permNames).forEach(function (k) { var s = $('p_' + k); if (s) s.onchange = function () { act('perm', { k: k, r: Number(s.value) }); }; });
}
function pCars() {
    var L = D.f.ranks.length;
    var mine = D.cars.map(function (c) {
        var ok = D.myR >= c.minR || D.head;
        return '<div class="car"><div class="ci">🚗</div><div class="cn"><b>' + esc(c.n) + '</b><small>' + esc(c.plate) + ' · ' + (c.out ? '<em class="o">на улице · ' + esc(c.by) + '</em>' : '<em class="g">в гараже</em>') + '</small></div>' +
            '<div class="cacc">' + (D.my.cars ? 'Доступ ' + rankSel('ca' + c.id, c.minR, 1, L) : '<span class="rk">с ранга ' + esc(rn(c.minR)) + '</span>') + '</div><div class="ac">' +
            (c.out ? '<button class="sm" data-back="' + c.id + '">Вернуть</button>' : (D.my.carcall && ok ? '<button class="sm g" data-call="' + c.id + '">Вызвать</button>' : '<button class="sm" disabled>Нет доступа</button>')) +
            (D.my.cars ? '<button class="sm r" data-sell="' + c.id + '">Продать</button>' : '') + '</div></div>';
    }).join('') || '<div class="mut">В гараже пока нет машин</div>';
    var shop = D.my.cars ? card('Купить в гараж семьи · оплата из общака (' + money(D.f.bank) + ')', '<div class="shop">' + D.shop.map(function (s) {
        return '<div class="si"><small>' + esc(s.c) + '</small><b>' + esc(s.n) + '</b><em>' + money(s.price) + '</em><button class="sm' + (D.f.bank >= s.price ? ' g' : '') + '" data-buy="' + s.m + '"' + (D.f.bank >= s.price ? '' : ' disabled') + '>Купить</button></div>';
    }).join('') + '</div>') : '';
    $('pg').innerHTML = '<h2>Гараж семьи · ' + D.cars.length + ' / ' + D.f.carMax + '</h2>' + card('Транспорт', '<div class="mut" style="margin-bottom:8px">Машина приезжает к особняку (если он есть) или к вам. Сесть за руль могут только участники с нужным рангом.</div>' + mine) + shop;
    document.querySelectorAll('[data-call]').forEach(function (b) { b.onclick = function () { act('carcall', { cid: Number(b.dataset.call) }); }; });
    document.querySelectorAll('[data-back]').forEach(function (b) { b.onclick = function () { act('carback', { cid: Number(b.dataset.back) }); }; });
    document.querySelectorAll('[data-sell]').forEach(function (b) { b.onclick = function () { if (b.dataset.ok) act('carsell', { cid: Number(b.dataset.sell) }); else { b.dataset.ok = 1; b.textContent = 'За 50%?'; } }; });
    document.querySelectorAll('[data-buy]').forEach(function (b) { b.onclick = function () { act('carbuy', { m: b.dataset.buy }); }; });
    D.cars.forEach(function (c) { var s = $('ca' + c.id); if (s) s.onchange = function () { act('caraccess', { cid: c.id, r: Number(s.value) }); }; });
}
function pHouse() {
    var h = D.house, top = '';
    if (h) {
        top = card('Ваш особняк', '<div class="hs"><div class="hi">🏰</div><div><b>' + esc(h.n) + '</b><small>Интерьер «' + esc(h.int) + '» · ' + (h.open ? 'открыт для гостей' : 'только для семьи') + '</small></div><div class="ac">' +
            '<button class="sm g" id="hg">📍 Метка</button>' + (D.my.house ? '<button class="sm" id="hl">' + (h.open ? '🔒 Закрыть' : '🔓 Открыть гостям') + '</button>' : '') + (D.head ? '<button class="sm r" id="hs">Продать</button>' : '') + '</div></div>');
    }
    var list = D.houses.map(function (x) {
        var can = !h && !x.own && D.my.house, enough = D.f.rep >= x.rep;
        return '<div class="hl' + (x.mine ? ' mine' : '') + '"><div class="hi">🏰</div><div class="hn"><b>' + esc(x.n) + '</b><small>Интерьер «' + esc(x.int) + '»' + (x.own ? ' · <em class="o">' + esc(x.own) + '</em>' : ' · <em class="g">свободен</em>') + '</small></div>' +
            '<div class="hp">⭐ ' + num(x.rep) + '</div>' + (can ? '<button class="sm' + (enough ? ' g' : '') + '" data-hb="' + x.id + '"' + (enough ? '' : ' disabled') + '>' + (enough ? 'Купить' : 'Не хватает') + '</button>' : '<span></span>') + '</div>';
    }).join('');
    $('pg').innerHTML = '<h2>Особняк семьи</h2>' + top + card('Особняки города · у семьи ⭐ ' + num(D.f.rep) + ' репутации', '<div class="mut" style="margin-bottom:8px">Особняк покупается только за репутацию семьи. Не хватает — пополните её во вкладке «Общак и репутация».</div>' + list);
    if ($('hg')) $('hg').onclick = function () { act('hgps'); };
    if ($('hl')) $('hl').onclick = function () { act('hlock'); };
    if ($('hs')) $('hs').onclick = function () { if (this.dataset.ok) act('hsell'); else { this.dataset.ok = 1; this.textContent = 'Вернём 50% репутации?'; } };
    document.querySelectorAll('[data-hb]').forEach(function (b) { b.onclick = function () { act('hbuy', { hid: Number(b.dataset.hb) }); }; });
}
function pBank() {
    var packs = [500, 1000, 2500, 5000].map(function (n) { var rc = Math.ceil(n / D.rep.rcRate); return '<div class="pk"><b>⭐ ' + num(n) + '</b><small>' + num(rc) + ' RC</small><button class="sm' + (D.coins >= rc ? ' g' : '') + '" data-rep="' + n + '"' + (D.coins >= rc ? '' : ' disabled') + '>Купить</button></div>'; }).join('');
    $('pg').innerHTML = '<h2>Общак и репутация</h2><div class="g2">' +
        card('Общак · ' + money(D.f.bank), '<div class="mut">У вас наличными: ' + money(D.cash) + '</div><div class="inl"><input id="dep" placeholder="Сумма"><button id="bd">Положить</button></div>' +
            (D.my.bank ? '<div class="inl"><input id="wd" placeholder="Сумма"><button class="ghost" id="bw">Снять</button></div>' : '<div class="mut" style="margin-top:10px">Снимать деньги могут ранги с доступом «Снимать деньги из общака»</div>')) +
        card('Репутация · ⭐ ' + num(D.f.rep), '<div class="mut">Как заработать бесплатно:<br>• +' + D.rep.perOnline + ' за каждого участника онлайн раз в ' + D.rep.everyMin + ' мин<br>• +1 за каждые ' + money(D.rep.perDeposit) + ' взносов в общак</div>' +
            '<div class="lbl2">Купить за донат · у вас ' + num(D.coins) + ' RC</div><div class="packs">' + packs + '</div>') + '</div>';
    $('bd').onclick = function () { act('deposit', { n: Number($('dep').value) }); };
    if ($('bw')) $('bw').onclick = function () { act('withdraw', { n: Number($('wd').value) }); };
    document.querySelectorAll('[data-rep]').forEach(function (b) { b.onclick = function () { if (b.dataset.ok) act('buyrep', { n: Number(b.dataset.rep) }); else { b.dataset.ok = 1; b.textContent = 'Точно?'; } }; });
}
function pLog() {
    var cats = [['all', 'Все'], ['mem', 'Состав'], ['rank', 'Ранги'], ['bank', 'Общак'], ['car', 'Машины'], ['house', 'Особняк'], ['rep', 'Репутация']];
    var f = cats.map(function (c) { return '<span class="ft' + (LOGF === c[0] ? ' on' : '') + '" data-lf="' + c[0] + '">' + c[1] + '</span>'; }).join('');
    var rows = D.log.filter(function (l) { return LOGF === 'all' || l.k === LOGF; }).map(function (l) { return '<div class="lg"><span>' + dt(l.t) + '</span>' + esc(l.x) + '</div>'; }).join('') || '<div class="mut">Записей нет</div>';
    $('pg').innerHTML = '<h2>Журнал действий</h2><div class="fts">' + f + '</div><div class="cd logbox">' + rows + '</div>';
    document.querySelectorAll('[data-lf]').forEach(function (b) { b.onclick = function () { LOGF = b.dataset.lf; pLog(); }; });
}
