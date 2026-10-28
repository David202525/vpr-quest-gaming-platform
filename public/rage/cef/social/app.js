var ITEMS = [];
var hover = -1;
var R_IN = 100, R_OUT = 196, GAP = 2.2;
var svg = document.getElementById('svg');
var labels = document.getElementById('labels');
var core = document.getElementById('core');
var wrap = document.getElementById('wrap');
var sum = document.getElementById('sum');
var offerTimer = null;

function $(id) { return document.getElementById(id); }
function trig(name) { if (window.mp && mp.trigger) mp.trigger.apply(null, arguments); }

function pt(r, a) { return [Math.cos(a) * r, Math.sin(a) * r]; }
function arc(a0, a1) {
    var p1 = pt(R_OUT, a0), p2 = pt(R_OUT, a1), p3 = pt(R_IN, a1), p4 = pt(R_IN, a0);
    var big = a1 - a0 > Math.PI ? 1 : 0;
    return 'M' + p1 + 'A' + R_OUT + ',' + R_OUT + ' 0 ' + big + ' 1 ' + p2 + 'L' + p3 + 'A' + R_IN + ',' + R_IN + ' 0 ' + big + ' 0 ' + p4 + 'Z';
}

function render() {
    var n = ITEMS.length;
    var step = Math.PI * 2 / n;
    var start = -Math.PI / 2 - step / 2;
    var gap = GAP * Math.PI / 180;
    var html = '<defs><linearGradient id="grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b3dff"/><stop offset="1" stop-color="#c13dff"/></linearGradient></defs>';
    var lab = '';
    ITEMS.forEach(function (it, i) {
        var a0 = start + i * step + gap / 2, a1 = start + (i + 1) * step - gap / 2;
        html += '<path class="seg' + (it.off ? ' off' : '') + '" data-i="' + i + '" d="' + arc(a0, a1) + '"/>';
        var m = pt((R_IN + R_OUT) / 2, (a0 + a1) / 2);
        var x = 50 + m[0] / 400 * 100, y = 50 + m[1] / 400 * 100;
        lab += '<div class="lab' + (it.off ? ' off' : '') + '" data-l="' + i + '" style="left:' + x + '%;top:' + (y + 7) + '%"><span class="num">' + (i + 1) + '</span><div class="ic">' + it.ic + '</div><div class="tx">' + it.t + '</div></div>';
    });
    labels.classList.toggle('many', n > 8);
    svg.innerHTML = html;
    labels.innerHTML = lab;
    svg.querySelectorAll('.seg').forEach(function (s) {
        var i = Number(s.dataset.i);
        s.onmouseenter = function () { setHover(i); };
        s.onmouseleave = function () { setHover(-1); };
        s.onclick = function () { pick(i); };
    });
}

function setHover(i) {
    hover = i;
    svg.querySelectorAll('.seg').forEach(function (s) { s.classList.toggle('hover', Number(s.dataset.i) === i && !ITEMS[i].off); });
    labels.querySelectorAll('.lab').forEach(function (s) { s.classList.toggle('hover', Number(s.dataset.l) === i && !ITEMS[i].off); });
    if (core.classList.contains('paying')) return;
    $('title').textContent = i >= 0 ? ITEMS[i].t : 'Взаимодействие';
    $('sub').textContent = i >= 0 ? (ITEMS[i].d || '') : 'G — закрыть';
}

function pick(i) {
    var it = ITEMS[i];
    if (!it || it.off) return;
    if (it.id === 'pay') {
        core.classList.add('paying');
        $('title').textContent = 'Передать деньги';
        sum.value = '';
        setTimeout(function () { sum.focus(); }, 20);
        return;
    }
    trig('cef:int:pick', it.id, '');
}

function payOk() {
    var v = Math.floor(Number(String(sum.value).replace(/\D/g, '')) || 0);
    if (v < 1) { sum.focus(); return; }
    trig('cef:int:pick', 'pay', String(v));
}
$('payOk').onclick = payOk;
$('payNo').onclick = function () { core.classList.remove('paying'); setHover(hover); };
sum.addEventListener('input', function () { sum.value = sum.value.replace(/\D/g, '').slice(0, 6); });

document.addEventListener('keydown', function (e) {
    if (!wrap.classList.contains('show')) return;
    if (core.classList.contains('paying')) {
        if (e.keyCode === 13) { e.preventDefault(); payOk(); }
        if (e.keyCode === 27) { e.preventDefault(); core.classList.remove('paying'); setHover(hover); }
        return;
    }
    var n = e.keyCode - 48;
    if (n >= 1 && n <= ITEMS.length) pick(n - 1);
    if (e.keyCode === 27) trig('cef:int:close');
});
document.addEventListener('contextmenu', function (e) { e.preventDefault(); trig('cef:int:close'); });

window.intOpen = function (d) {
    ITEMS = d.items || [];
    $('who').textContent = d.who || '';
    core.classList.remove('paying');
    render();
    setHover(-1);
    wrap.classList.add('show');
};
window.intClose = function () {
    wrap.classList.remove('show');
    core.classList.remove('paying');
    sum.blur();
};

window.offerShow = function (text, ms) {
    $('offerTxt').textContent = text;
    var o = $('offer');
    o.classList.add('show');
    var bar = $('offerBar');
    bar.style.transition = 'none';
    bar.style.width = '100%';
    setTimeout(function () { bar.style.transition = 'width ' + (ms / 1000) + 's linear'; bar.style.width = '0%'; }, 30);
    clearTimeout(offerTimer);
    offerTimer = setTimeout(window.offerHide, ms);
};
window.offerHide = function () { $('offer').classList.remove('show'); clearTimeout(offerTimer); };
