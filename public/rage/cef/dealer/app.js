function $(id) { return document.getElementById(id); }
function trig() { if (window.mp && mp.trigger) mp.trigger.apply(mp, arguments); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function money(n) { return '$' + String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
var D = null, sel = 0, flt = '', busy = false;

window.dealerShow = function (j) {
    D = typeof j === 'string' ? JSON.parse(j) : j;
    busy = false;
    if (!D.cars[sel]) sel = 0;
    draw();
};
function draw() {
    if (!D) return;
    var q = flt.toLowerCase();
    var cars = D.cars.filter(function (c) { return !q || c.n.toLowerCase().indexOf(q) >= 0 || c.m.indexOf(q) >= 0; });
    var c = D.cars[sel];
    var focus = document.activeElement && document.activeElement.id === 'q';
    $('box').innerHTML =
        '<div class="hd"><i>🚘</i><div><b>' + esc(D.n) + '</b><small>Наличные ' + money(D.money) + ' · На карте ' + money(D.bank) + '</small></div><button class="x" id="cl">✕</button></div>' +
        '<div class="wrap"><div style="display:flex;flex-direction:column;min-height:0"><input class="search" id="q" placeholder="Поиск по названию" value="' + esc(flt) + '"><div class="list">' +
        (cars.length ? cars.map(function (x) {
            return '<div class="it' + (x.i === sel ? ' sel' : '') + (x.stock <= 0 ? ' out' : '') + '" data-i="' + x.i + '"><b>' + esc(x.n) + '</b><em>' + money(x.price) + '</em><small>' + esc(x.m) + '</small>' +
                '<small class="st ' + (x.stock > 0 ? 'ok' : 'no') + '">' + (x.stock > 0 ? 'В наличии: ' + x.stock + ' шт.' : 'Нет в наличии') + '</small></div>';
        }).join('') : '<div class="empty">' + (D.cars.length ? 'Ничего не найдено' : 'В салоне пока нет машин') + '</div>') +
        '</div></div>' +
        (c ? '<div class="card"><div class="pic">🚗</div><h2>' + esc(c.n) + '</h2><div class="m">Модель: ' + esc(c.m) + '</div>' +
            '<div class="kv"><span>Цена</span><b>' + money(c.price) + '</b><span>В наличии</span><b style="color:' + (c.stock > 0 ? 'var(--ok)' : 'var(--red)') + '">' + (c.stock > 0 ? c.stock + ' шт.' : 'нет') + '</b><span>Номера</span><b>выдаются сразу</b></div>' +
            (D.err ? '<div class="err">' + esc(D.err) + '</div>' : '') +
            (!D.home ? '<div class="warn">Для покупки личного транспорта нужно жильё: дом, квартира или гостиница</div>' : '') +
            '<button class="btn td" id="td"' + (c.stock <= 0 || busy ? ' disabled' : '') + '>🏁 Тест-драйв ' + (D.td || 3) + ' мин<small>бесплатно, раз в 5 минут</small></button>' +
            '<div class="pay"><button class="btn" data-pay="cash"' + (c.stock <= 0 || D.money < c.price || !D.home || busy ? ' disabled' : '') + '>💵 Наличными<small>' + money(D.money) + '</small></button>' +
            '<button class="btn pri" data-pay="card"' + (c.stock <= 0 || D.bank < c.price || !D.home || busy ? ' disabled' : '') + '>💳 Картой<small>' + money(D.bank) + '</small></button></div></div>'
            : '<div class="card"><div class="empty">Выберите машину</div></div>') +
        '</div>';
    $('cl').onclick = function () { trig('cef:dealer:close'); };
    var inp = $('q');
    inp.oninput = function () { flt = inp.value; draw(); };
    if (focus) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
    document.querySelectorAll('[data-i]').forEach(function (el) { el.onclick = function () { sel = Number(el.dataset.i); D.err = ''; draw(); }; });
    var tdb = $('td'); if (tdb) tdb.onclick = function () { if (!tdb.disabled) trig('cef:dealer:test', D.id, sel); };
    document.querySelectorAll('[data-pay]').forEach(function (b) {
        b.onclick = function () {
            if (b.disabled || busy) return;
            busy = true; draw();
            trig('cef:dealer:buy', D.id, sel, b.dataset.pay);
            setTimeout(function () { if (busy) { busy = false; draw(); } }, 4000);
        };
    });
}
document.addEventListener('keydown', function (e) { if (e.keyCode === 27) trig('cef:dealer:close'); });
