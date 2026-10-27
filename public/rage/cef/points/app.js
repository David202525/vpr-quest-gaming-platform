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
