function $(id) { return document.getElementById(id); }
function trig() { if (window.mp && mp.trigger) mp.trigger.apply(mp, arguments); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function money(n) { return '$' + String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
var T = null, ans = [], idx = 0, P = null;

window.theory = function (j) {
    T = typeof j === 'string' ? JSON.parse(j) : j; ans = []; idx = 0; P = null; drawQ();
};
function drawQ() {
    var q = T.qs[idx];
    $('box').innerHTML = '<div class="hd"><i>📘</i><div><b>Теория · категория ' + esc(T.cat) + '</b><small>Вопрос ' + (idx + 1) + ' из ' + T.qs.length + ' · нужно ' + T.need + ' верных</small></div></div>' +
        '<div class="bar"><u style="width:' + (idx / T.qs.length * 100) + '%"></u></div>' +
        '<div class="q">' + esc(q.q) + '</div>' +
        q.a.map(function (a, i) { return '<button class="a" data-i="' + i + '"><em>' + 'ABCD'[i] + '</em>' + esc(a) + '</button>'; }).join('');
    document.querySelectorAll('.a').forEach(function (b) {
        b.onclick = function () {
            ans.push(Number(b.dataset.i)); idx++;
            if (idx >= T.qs.length) { var r = JSON.stringify(ans); T = null; $('box').innerHTML = '<div class="hd"><i>⏳</i><div><b>Проверяем ответы…</b></div></div>'; trig('cef:lic:theory', r); }
            else drawQ();
        };
    });
}

window.police = function (j) {
    P = typeof j === 'string' ? JSON.parse(j) : j; T = null;
    var v = P.viol;
    var opts = v ? [
        ['warn', '🗣️', 'Предупреждение', 'Устно, без последствий', ''],
        ['fine', '🧾', 'Штраф', money(P.fine), ''],
        ['fine2', '💸', 'Двойной штраф', money(P.fine * 2) + ' — повторное нарушение', 'red'],
        ['impound', '🚛', 'Эвакуация + штраф', 'Машину на штрафстоянку, ' + money(P.fine), 'red'],
        ['wanted', '⭐', 'Розыск', '+1 звезда — задержание и арест', 'red']
    ] : [];
    $('box').innerHTML = '<div class="hd"><i>📋</i><div><b>Проверка документов</b><small>' + esc(P.n) + ' · ID ' + P.id + '</small></div></div>' +
        '<div class="info ' + (v ? 'bad' : 'good') + '">' + esc(P.info) + '<br>' + (v ? (v === 'nolic' ? '⚠ Управление без водительского удостоверения' : '⚠ Нет нужной категории для этого транспорта') + (P.wasDriving ? '' : '<br><small style="opacity:.7">Нет подтверждения, что гражданин недавно был за рулём</small>') : '✓ Нарушений не выявлено') + '</div>' +
        (v ? '<div class="grid">' + opts.map(function (o) { return '<button class="btn ' + o[4] + '" data-k="' + o[0] + '"><b>' + o[1] + ' ' + o[2] + '</b><small>' + esc(o[3]) + '</small></button>'; }).join('') + '</div>' : '') +
        '<button class="close" id="cl">Закрыть</button>';
    document.querySelectorAll('[data-k]').forEach(function (b) { b.onclick = function () { trig('cef:lic:punish', P.id, b.dataset.k); }; });
    $('cl').onclick = function () { trig('cef:lic:punish', P.id, ''); };
};
document.addEventListener('keydown', function (e) {
    if (e.keyCode !== 27) return;
    if (P) trig('cef:lic:punish', P.id, '');
    else if (T) { var r = JSON.stringify(ans); T = null; trig('cef:lic:theory', r); }
});
