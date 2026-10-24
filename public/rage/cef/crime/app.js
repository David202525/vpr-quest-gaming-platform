function $(id) { return document.getElementById(id); }
function trig() { if (window.mp && mp.trigger) mp.trigger.apply(mp, arguments); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function money(n) { return '$' + String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
var MODE = '', SR = null;
window.shop = function (j) {
    var d = typeof j === 'string' ? JSON.parse(j) : j; MODE = 'shop';
    $('box').className = 'box'; $('box').style.removeProperty('--g'); $('box').style.removeProperty('--g2');
    var rows = [{ k: 'ukrop_pack', n: '🌿 Пакет укропа (x10)', s: 'Восстанавливает здоровье, вызывает зависимость · на складе: ' + d.stock, p: d.price, lock: d.stock <= 0 }]
        .concat(d.ill.map(function (x) { return { k: x.k, n: x.n, s: x.need === 'mafia' ? 'Только для мафии' : 'Без лицензии — изымается полицией', p: x.p, lock: x.need && x.need !== d.type }; }));
    $('box').innerHTML = '<div class="hd"><i>🌿</i><div><b>Поставщик</b><small>' + esc(d.org) + ' · ' + (d.type === 'mafia' ? 'оптовая цена для мафии' : 'наценка для банд, доля уходит мафии') + '</small></div></div>' +
        rows.map(function (r) { return '<div class="row' + (r.lock ? ' lock' : '') + '"><div class="n"><b>' + esc(r.n) + '</b><small>' + esc(r.s) + '</small></div><b>' + money(r.p) + '</b><input class="qty" type="number" min="1" max="20" value="1" data-q="' + r.k + '"' + (r.lock ? ' disabled' : '') + '><button data-b="' + r.k + '"' + (r.lock ? ' disabled' : '') + '>Купить</button></div>'; }).join('') +
        '<div class="foot"><small>Перепродавайте укроп игрокам и на центральном рынке. Полиция при обыске изымает всё нелегальное</small><button class="ghost" id="cl">Уйти</button></div>';
    document.querySelectorAll('[data-b]').forEach(function (b) { b.onclick = function () { var q = document.querySelector('[data-q="' + b.dataset.b + '"]').value; trig('cef:crime:buy', b.dataset.b, Number(q) || 1); }; });
    $('cl').onclick = function () { trig('cef:crime:close'); };
};
window.search = function (j) {
    SR = typeof j === 'string' ? JSON.parse(j) : j; MODE = 'search';
    $('box').className = 'box cop'; $('box').style.removeProperty('--g'); $('box').style.removeProperty('--g2');
    $('box').innerHTML = '<div class="hd"><i>🔍</i><div><b>Обыск: ' + esc(SR.n) + '</b><small>ID ' + SR.id + ' · лицензия на оружие: ' + (SR.lic ? 'есть' : 'нет') + '</small></div></div>' +
        (SR.list.length ? SR.list.map(function (x) {
            return '<label class="row"><input class="chk" type="checkbox" data-k="' + x.k + '"' + (x.legal ? '' : ' checked') + '><div class="n"><b>' + esc(x.n) + ' ×' + x.c + '</b><small>' + (x.legal ? 'Разрешено (есть лицензия)' : x.ill ? 'Запрещено к обороту' : 'Без лицензии') + '</small></div>' + (x.legal ? '<span class="tag ok">законно</span>' : '<span class="tag">нелегально</span>') + '</label>';
        }).join('') : '<div class="empty">Ничего запрещённого не найдено</div>') +
        '<div class="foot"><small>Отмеченное будет изъято. За нелегальное оружие и укроп автоматически выдаётся розыск</small><div style="display:flex;gap:8px"><button class="ghost" id="cl">Закрыть</button>' + (SR.list.length ? '<button id="go">Изъять</button>' : '') + '</div></div>';
    $('cl').onclick = function () { trig('cef:crime:close'); };
    var g = $('go'); if (g) g.onclick = function () { var ks = Array.prototype.map.call(document.querySelectorAll('[data-k]:checked'), function (c) { return c.dataset.k; }); if (!ks.length) return; trig('cef:crime:seize', SR.id, JSON.stringify(ks)); };
};
window.garage = function (j) {
    var d = typeof j === 'string' ? JSON.parse(j) : j; MODE = 'garage';
    $('box').className = 'box';
    $('box').style.setProperty('--g', d.c); $('box').style.setProperty('--g2', d.c);
    $('box').innerHTML = '<div class="hd"><i>🚗</i><div><b>Гараж · ' + esc(d.org) + '</b><small>Машины в цвете организации</small></div></div>' +
        d.list.map(function (c) { return '<div class="row' + (c.ok ? '' : ' lock') + '"><div class="n"><b>' + esc(c.m.toUpperCase()) + '</b><small>с ранга «' + esc(c.rn) + '»</small></div><button data-m="' + c.m + '"' + (c.ok && !d.out ? '' : ' disabled') + '>' + (d.out === c.m ? 'Выдана' : 'Взять') + '</button></div>'; }).join('') +
        '<div class="foot"><small>' + (d.out ? 'Сначала верните текущую машину' : 'Одна машина на человека') + '</small><div style="display:flex;gap:8px">' + (d.out ? '<button id="bk">Вернуть</button>' : '') + '<button class="ghost" id="cl">Закрыть</button></div></div>';
    document.querySelectorAll('[data-m]').forEach(function (b) { b.onclick = function () { trig('cef:crime:car', b.dataset.m); }; });
    var bk = $('bk'); if (bk) bk.onclick = function () { trig('cef:crime:car', '__back'); };
    $('cl').onclick = function () { trig('cef:crime:close'); };
};

function dark(c) { var n = parseInt(c.replace('#', ''), 16); var f = function (v) { return ('0' + Math.floor(v * 0.45).toString(16)).slice(-2); }; return '#' + f((n >> 16) & 255) + f((n >> 8) & 255) + f(n & 255); }
function base(cls, c) { var b = $('box'); b.className = 'box ' + (cls || ''); if (c) { b.style.setProperty('--g', c); b.style.setProperty('--g2', dark(c)); b.style.setProperty('--ga', c + '40'); } else { b.style.removeProperty('--g'); b.style.removeProperty('--g2'); b.style.removeProperty('--ga'); } return b; }
function bind(sel, fn) { document.querySelectorAll(sel).forEach(function (el) { el.onclick = function () { fn(el); }; }); }
function qv(id) { var el = document.querySelector('[data-q="' + id + '"]'); return el ? Number(el.value) || 1 : 1; }
function tm(t) { var d = new Date(t); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
window.stash = function (j) {
    var d = typeof j === 'string' ? JSON.parse(j) : j;
    var b = base('wide', d.c);
    var row = function (x, op, can) { return '<div class="row sm"><span class="ic">' + ICON(x.k, x.i) + '</span><div class="n"><b>' + esc(x.n) + '</b><small>×' + x.c + '</small></div><input class="qty" type="number" min="1" max="' + x.c + '" value="' + x.c + '" data-q="' + op + x.k + '"><button data-' + op + '="' + x.k + '"' + (can ? '' : ' disabled') + '>' + (op === 'put' ? 'Положить' : 'Взять') + '</button></div>'; };
    b.innerHTML = '<div class="hd"><i>🗄️</i><div><b>Общак · ' + esc(d.org) + '</b><small>Брать предметы — с ранга «' + esc(d.need) + '»' + (d.lead ? ' · лидер меняет порог' : '') + '</small></div></div>' +
        '<div class="cash"><div class="sum">' + money(d.bank) + '</div><input id="cs" type="number" min="1" placeholder="Сумма"><button id="ci">Положить</button>' + (d.lead ? '<button class="ghost" id="co">Взять</button>' : '') + '</div>' +
        '<div class="cols"><div class="col"><h4>В общаке</h4><div class="list">' + (d.st.length ? d.st.map(function (x) { return row(x, 'take', d.canTake); }).join('') : '<div class="empty">Пусто</div>') + '</div></div>' +
        '<div class="col"><h4>У вас</h4><div class="list">' + (d.inv.length ? d.inv.map(function (x) { return row(x, 'put', true); }).join('') : '<div class="empty">Нечего положить</div>') + '</div></div></div>' +
        '<div class="logs">' + (d.log || []).map(function (l) { return tm(l.t) + ' — ' + esc(l.x); }).join('<br>') + '</div>' +
        '<div class="foot"><small>' + (d.lead ? 'Порог ранга: <input class="qty" id="rk" type="number" min="1" max="12" value=""> <button class="ghost" id="rkb">OK</button>' : 'Всё движение записывается в журнал') + '</small><button class="ghost" id="cl">Закрыть</button></div>';
    bind('[data-put]', function (el) { trig('cef:crime:stashOp', 'put', el.dataset.put, qv('put' + el.dataset.put)); });
    bind('[data-take]', function (el) { trig('cef:crime:stashOp', 'take', el.dataset.take, qv('take' + el.dataset.take)); });
    $('ci').onclick = function () { var n = Number($('cs').value); if (n > 0) trig('cef:crime:stashOp', 'cashIn', '', n); };
    if ($('co')) $('co').onclick = function () { var n = Number($('cs').value); if (n > 0) trig('cef:crime:stashOp', 'cashOut', '', n); };
    if ($('rkb')) $('rkb').onclick = function () { var n = Number($('rk').value); if (n > 0) trig('cef:crime:stashOp', 'rank', '', n); };
    $('cl').onclick = function () { trig('cef:crime:close'); };
};
window.green = function (j) {
    var d = typeof j === 'string' ? JSON.parse(j) : j;
    var b = base('wide', d.c);
    b.innerHTML = '<div class="hd"><i>🌿</i><div><b>Теплица · ' + esc(d.org) + '</b><small>Созревает ' + d.grow + ' мин · без полива дольше ' + d.water + ' мин рост останавливается</small></div></div>' +
        '<div class="cash"><div class="sum" style="font-size:16px">🌱 Семена у вас: ' + d.seeds + '</div><small style="color:rgba(255,255,255,.5);max-width:300px">Семена не продаются — их изредка находят, работая на ферме</small></div>' +
        '<div class="pots">' + d.pots.map(function (x) {
            if (x.s === 'empty') return '<div class="pot"><div class="e">🪴</div><small>Пусто</small><div style="flex:1"></div><button data-plant="' + x.i + '"' + (d.seeds ? '' : ' disabled') + '>Посадить</button></div>';
            var e = x.s === 'ripe' ? '🌿' : x.pct > 50 ? '🌱' : '🌰';
            return '<div class="pot ' + x.s + '"><div class="e">' + e + '</div><small>' + (x.s === 'ripe' ? 'Созрело!' : x.s === 'dry' ? 'Засохло — полейте' : x.pct + '% · полив ещё ' + x.wl + ' мин') + '</small><div class="bar"><i style="width:' + x.pct + '%"></i></div><small>' + esc(x.by) + '</small>' +
                (x.s === 'ripe' ? '<button data-harvest="' + x.i + '">Собрать</button>' : '<button class="ghost" data-water="' + x.i + '">Полить</button>') + '</div>';
        }).join('') + '</div>' +
        '<div class="foot"><small>Урожай с горшка — 4–7 укропа. Продавайте скупщику или складывайте в общак</small><button class="ghost" id="cl">Закрыть</button></div>';
    bind('[data-plant]', function (el) { trig('cef:crime:pot', 'plant', Number(el.dataset.plant)); });
    bind('[data-water]', function (el) { trig('cef:crime:pot', 'water', Number(el.dataset.water)); });
    bind('[data-harvest]', function (el) { trig('cef:crime:pot', 'harvest', Number(el.dataset.harvest)); });
    $('cl').onclick = function () { trig('cef:crime:close'); };
};
window.buyer = function (j) {
    var d = typeof j === 'string' ? JSON.parse(j) : j;
    var b = base('', '#6fd36a');
    b.innerHTML = '<div class="hd"><i>🤝</i><div><b>Скупщик</b><small>Нейтральная территория · спрос ' + d.demand + '% (падает при больших продажах)</small></div></div>' +
        d.list.map(function (x) { return '<div class="row' + (x.have ? '' : ' lock') + '"><span class="ic">' + ICON(x.k, x.i) + '</span><div class="n"><b>' + esc(x.n) + '</b><small>у вас: ' + x.have + '</small></div><b>' + money(x.p) + '</b><input class="qty" type="number" min="1" max="' + Math.max(1, x.have) + '" value="' + Math.max(1, x.have) + '" data-q="s' + x.k + '"' + (x.have ? '' : ' disabled') + '><button data-sell="' + x.k + '"' + (x.have ? '' : ' disabled') + '>Продать</button></div>'; }).join('') +
        '<div class="foot"><small>Мафия отдаёт 10% выручки в свой общак. Убийство на нейтральной территории — розыск</small><button class="ghost" id="cl">Уйти</button></div>';
    bind('[data-sell]', function (el) { trig('cef:crime:sell', el.dataset.sell, qv('s' + el.dataset.sell)); });
    $('cl').onclick = function () { trig('cef:crime:close'); };
};
var BSEL = 0;
window.bench = function (j) {
    var d = typeof j === 'string' ? JSON.parse(j) : j;
    var b = base('bench', d.c);
    var hv = function (c) { return (d.have[c] || { i: 0 }).i; };
    var ready = function (r) { return !r.lock && Object.keys(r.need).every(function (c) { return hv(c) >= r.need[c]; }); };
    if (!d.r[BSEL]) BSEL = 0;
    var cur = d.r[BSEL];
    var cards = d.r.map(function (r) {
        return '<div class="card' + (r.i === BSEL ? ' sel' : '') + (r.lock ? ' lock' : '') + '" data-pick="' + r.i + '">' + (r.lock ? '<span class="mf">мафия</span>' : ready(r) ? '<span class="ready"></span>' : '') + (r.c > 1 ? '<span class="cnt">×' + r.c + '</span>' : '') +
            '<div class="pic">' + ICON(r.k, r.ic) + '</div><b>' + esc(r.n.replace(/ ×\d+$/, '')) + '</b></div>';
    }).join('');
    var needs = Object.keys(cur.need).map(function (c) {
        var h = d.have[c] || { i: 0, s: 0, n: c, ic: '?' }, have = h.i, need = cur.need[c], ok = have >= need;
        return '<div class="need"><span class="ic">' + ICON(c, h.ic) + '</span><div class="nm">' + esc(h.n) + '<div class="bar" style="color:' + (ok ? '#6fd36a' : '#ff6b7a') + '"><i style="width:' + Math.min(100, have / need * 100) + '%"></i></div><small style="color:rgba(255,255,255,.4);font-size:10.5px">в общаке: ' + h.s + '</small></div><div class="v ' + (ok ? 'ok' : 'no') + '">' + have + ' / ' + need + '</div></div>';
    }).join('');
    b.innerHTML = '<div class="top"><i>🛠️</i><div><b>Верстак · ' + esc(d.org) + '</b><small>Компоненты берутся только из вашего инвентаря</small></div><div class="x" id="cl">✕</div></div>' +
        '<div class="wrap"><div class="grid">' + cards + '</div>' +
        '<div class="side"><div class="hero">' + ICON(cur.k, cur.ic) + '</div><h3>' + esc(cur.n) + '</h3><div class="sub">' + (cur.lock ? 'Рецепт знают только в мафии' : 'Сборка займёт 8 секунд') + '</div>' + needs +
        '<button class="go" id="go"' + (ready(cur) ? '' : ' disabled') + '>' + (cur.lock ? 'Недоступно' : ready(cur) ? 'Собрать' : 'Не хватает компонентов') + '</button>' +
        '<div class="note">Недостающее возьмите в общаке (E у общака). Компоненты добываются из армейских ящиков: вскройте Barracks за пределами базы, отвезите ящики на базу и сдайте в общак.</div></div></div>';
    bind('[data-pick]', function (el) { BSEL = Number(el.dataset.pick); window.bench(d); });
    $('go').onclick = function () { if (ready(cur)) trig('cef:crime:craft', cur.i); };
    $('cl').onclick = function () { trig('cef:crime:close'); };
};
document.addEventListener('keydown', function (e) { if (e.keyCode === 27) trig('cef:crime:close'); });
