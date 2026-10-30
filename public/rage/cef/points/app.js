function $(id) { return document.getElementById(id); }
function trig() { if (window.mp && mp.trigger) mp.trigger.apply(mp, arguments); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
var DATA = [], OPEN = {};
function render() {
    var q = $('q').value.trim().toLowerCase(), near = $('near').checked;
    var groups = {}, order = [];
    DATA.forEach(function (o) {
        if (near && (o.d < 0 || o.d > 100)) return;
        if (q && (o.g + ' ' + o.n).toLowerCase().indexOf(q) < 0) return;
        if (!groups[o.g]) { groups[o.g] = []; order.push(o.g); }
        groups[o.g].push(o);
    });
    $('cnt').textContent = 'Всего меток: ' + DATA.length;
    if (!order.length) { $('list').innerHTML = '<div class="empty">Ничего не найдено</div>'; return; }
    $('list').innerHTML = order.map(function (g) {
        var open = OPEN[g] || q || near;
        return '<div class="grp' + (open ? ' open' : '') + '"><div class="gh" data-g="' + esc(g) + '">' + esc(g) + ' <small>' + groups[g].length + '</small></div><div class="gb">' +
            groups[g].map(function (o) {
                var c = o.x === null ? 'не задана' : o.x + ', ' + o.y + ', ' + o.z + ' · ' + o.h + '°';
                return '<div class="row"><div class="n"><b>' + esc(o.n) + '</b><small>' + c + '</small></div><div class="d">' + (o.d >= 0 ? o.d + ' м' : '') + '</div>' +
                    '<button class="b" data-a="tp" data-i="' + esc(o.i) + '">ТП</button>' +
                    '<button class="b" data-a="here" data-i="' + esc(o.i) + '">Сюда</button>' +
                    '<button class="b main" data-a="edit" data-i="' + esc(o.i) + '">Подогнать</button>' +
                    (o.r ? '<button class="b" data-a="reset" data-i="' + esc(o.i) + '" title="Вернуть стандартную">↺</button>' : '') +
                    (o.del ? '<button class="b red" data-a="del" data-i="' + esc(o.i) + '" title="Удалить">🗑</button>' : '') + '</div>';
            }).join('') + '</div></div>';
    }).join('');
}
$('list').addEventListener('click', function (e) {
    var gh = e.target.closest('.gh');
    if (gh) { var g = gh.dataset.g; OPEN[g] = !OPEN[g]; gh.parentNode.classList.toggle('open'); return; }
    var b = e.target.closest('[data-a]');
    if (!b) return;
    if (b.dataset.a === 'del' && !confirm('Удалить метку?')) return;
    trig('cef:pts:act', b.dataset.a, b.dataset.i);
});
$('q').addEventListener('input', render);
$('near').addEventListener('change', render);
$('close').onclick = function () { trig('cef:pts:close'); };
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') trig('cef:pts:close'); });
window.ptsData = function (j) { DATA = typeof j === 'string' ? JSON.parse(j) : j; DATA.sort(function (a, b) { return a.g === b.g ? 0 : a.g < b.g ? -1 : 1; }); render(); };

var MK = [], MKSEL = null;
window.ptsMk = function (j) { MK = typeof j === 'string' ? JSON.parse(j) : j; $('mkBtn').style.display = MK.length ? '' : 'none'; if ($('mk').classList.contains('on')) mkRender(); };
function mkRender() {
    var c = MK.find(function (x) { return x.id === MKSEL; }) || MK[0];
    if (!c) { $('mk').innerHTML = ''; return; }
    MKSEL = c.id;
    var tabs = MK.map(function (x) { return '<span class="mkt' + (x.id === c.id ? ' on' : '') + '" data-mk="' + esc(x.id) + '">' + esc(x.n) + '</span>'; }).join('');
    var fields = c.f.map(function (f) {
        var inp = f.t === 'select' ? '<select data-k="' + esc(f.k) + '">' + f.o.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(f.v) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>'
            : '<input data-k="' + esc(f.k) + '" type="' + (f.t === 'number' ? 'number' : 'text') + '" value="' + esc(f.v == null ? '' : f.v) + '" placeholder="' + esc(f.ph || '') + '">';
        return '<label><span>' + esc(f.n) + '</span>' + inp + '</label>';
    }).join('');
    $('mk').innerHTML = '<div class="mkh">' + tabs + '</div><div class="mkd">' + esc(c.d) + '</div><div class="mkf">' + fields + '</div><button class="b main" id="mkGo">Создать там, где я стою</button>';
    document.querySelectorAll('[data-mk]').forEach(function (b) { b.onclick = function () { MKSEL = b.dataset.mk; mkRender(); }; });
    $('mkGo').onclick = function () {
        var v = {}; document.querySelectorAll('#mk [data-k]').forEach(function (el) { v[el.dataset.k] = el.value; });
        trig('cef:pts:create', c.id, JSON.stringify(v));
    };
}
$('mkBtn').onclick = function () { var m = $('mk'); m.classList.toggle('on'); if (m.classList.contains('on')) mkRender(); };

/* ---------- свои выпадающие списки (системный select в игре не открывается) ---------- */
(function () {
    var openL = null;
    function shut() { if (openL) { openL.remove(); openL = null; } }
    function build(s) {
        s.dataset.dd = 1;
        s.style.display = 'none';
        var b = document.createElement('div');
        b.className = 'dd-b';
        var lbl = function () { var o = s.options[s.selectedIndex]; b.textContent = o ? o.text : '—'; };
        lbl();
        s.parentNode.insertBefore(b, s.nextSibling);
        b.addEventListener('click', function (e) {
            e.stopPropagation();
            var was = openL && openL._s === s;
            shut();
            if (was) return;
            var r = b.getBoundingClientRect(), L = document.createElement('div');
            L.className = 'dd-l'; L._s = s;
            Array.prototype.forEach.call(s.options, function (o) {
                var it = document.createElement('div');
                it.className = 'dd-i' + (o.value === s.value ? ' on' : '');
                it.textContent = o.text;
                it.addEventListener('click', function (ev) {
                    ev.stopPropagation();
                    shut();
                    if (s.value === o.value) return;
                    s.value = o.value; lbl();
                    if (typeof s.onchange === 'function') s.onchange();
                });
                L.appendChild(it);
            });
            document.body.appendChild(L);
            var h = Math.min(L.scrollHeight, 260), below = window.innerHeight - r.bottom - 8;
            L.style.left = r.left + 'px';
            L.style.minWidth = r.width + 'px';
            L.style.top = (below >= h || below > r.top ? r.bottom + 4 : r.top - h - 4) + 'px';
            openL = L;
        });
    }
    function scan() { document.querySelectorAll('select:not([data-dd])').forEach(build); }
    document.addEventListener('click', shut);
    document.addEventListener('wheel', function (e) { if (openL && !openL.contains(e.target)) shut(); }, true);
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
    scan();
})();
