function $(id) { return document.getElementById(id); }
function trig() { if (window.mp && mp.trigger) mp.trigger.apply(mp, arguments); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function money(n) { return '$' + String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
var MODE = '', SR = null;
window.shop = function (j) {
    var d = typeof j === 'string' ? JSON.parse(j) : j; MODE = 'shop';
    $('box').className = 'box';
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
    $('box').className = 'box cop';
    $('box').innerHTML = '<div class="hd"><i>🔍</i><div><b>Обыск: ' + esc(SR.n) + '</b><small>ID ' + SR.id + ' · лицензия на оружие: ' + (SR.lic ? 'есть' : 'нет') + '</small></div></div>' +
        (SR.list.length ? SR.list.map(function (x) {
            return '<label class="row"><input class="chk" type="checkbox" data-k="' + x.k + '"' + (x.legal ? '' : ' checked') + '><div class="n"><b>' + esc(x.n) + ' ×' + x.c + '</b><small>' + (x.legal ? 'Разрешено (есть лицензия)' : x.ill ? 'Запрещено к обороту' : 'Без лицензии') + '</small></div>' + (x.legal ? '<span class="tag ok">законно</span>' : '<span class="tag">нелегально</span>') + '</label>';
        }).join('') : '<div class="empty">Ничего запрещённого не найдено</div>') +
        '<div class="foot"><small>Отмеченное будет изъято. За нелегальное оружие и укроп автоматически выдаётся розыск</small><div style="display:flex;gap:8px"><button class="ghost" id="cl">Закрыть</button>' + (SR.list.length ? '<button id="go">Изъять</button>' : '') + '</div></div>';
    $('cl').onclick = function () { trig('cef:crime:close'); };
    var g = $('go'); if (g) g.onclick = function () { var ks = Array.prototype.map.call(document.querySelectorAll('[data-k]:checked'), function (c) { return c.dataset.k; }); if (!ks.length) return; trig('cef:crime:seize', SR.id, JSON.stringify(ks)); };
};
document.addEventListener('keydown', function (e) { if (e.keyCode === 27) trig('cef:crime:close'); });
