var NAME = 'Незнакомец', FEM = false;
var CH = [
    { img: '1.jpg', ch: 'Глава I', t: 'Серый город', date: 'Где-то далеко отсюда', lines: [
        'Ты вырос в городе, где небо всегда было цвета мокрого асфальта.',
        'Утро начиналось с гудка завода, а заканчивалось одинаковыми окнами панельных домов.',
        '{Сам|Сама} того не замечая, ты {перестал|перестала} мечтать. Просто жил{|а} — от зарплаты до зарплаты.'
    ] },
    { img: '2.jpg', ch: 'Глава II', t: 'Письмо', date: 'Осень, три месяца назад', lines: [
        'Всё изменилось в тот вечер, когда пришло письмо от старого друга — Майка.',
        '«Здесь солнце светит триста дней в году. Здесь каждый может стать кем захочет. Приезжай — я встречу».',
        'В конверте лежала открытка с пальмами и номер телефона. Ты долго смотрел{|а} на неё… и купил{|а} билет в один конец.'
    ] },
    { img: '3.jpg', ch: 'Глава III', t: 'Город мечты', date: 'Высота 10 000 метров', lines: [
        'Под крылом самолёта разворачивался Лос-Сантос — бескрайний, золотой, живой.',
        'Небоскрёбы Даунтауна, пальмы Вайнвуда, океан, сияющий как расплавленное стекло.',
        'Говорят, здесь можно начать с нуля и подняться до самой вершины. Или потерять всё за одну ночь.'
    ] },
    { img: '4.jpg', ch: 'Глава IV', t: 'Красивая жизнь', date: 'Мечты, которые не дают уснуть', lines: [
        'Ты представлял{|а} себе всё это: ночные клубы Дель Перро, рёв спорткаров на бульварах, вилла на холмах.',
        'Здесь правят те, кто не боится рисковать. Бизнесмены, полицейские, врачи, байкеры, люди без имени…',
        'И каждый из них когда-то тоже стоял в аэропорту с одним рюкзаком за плечами.'
    ] },
    { img: '5.jpg', ch: 'Глава V', t: 'Начало', date: 'Аэропорт Лос-Сантоса, сегодня', lines: [
        'Самолёт приземлился. Майк не отвечает на звонки — телефон вне зоны доступа.',
        'В кармане немного наличных, в голове — ни одного плана. Только этот город и ты.',
        'Что ж, {NAME}. Пора узнать, чего ты стоишь.'
    ] }
];
var ci = -1, li = 0, typing = null, autoT = null, flip = false, finished = false, started = false;
function $(i) { return document.getElementById(i); }
function g(s) { return s.replace(/\{([^|}]*)\|([^}]*)\}/g, function (m, a, b) { return FEM ? b : a; }).replace('{NAME}', NAME); }
function trig(n) { if (window.mp && mp.trigger) mp.trigger(n); }
function dots() { $('dots').innerHTML = CH.map(function (c, i) { return '<i class="' + (i < ci ? 'done' : i === ci ? 'cur' : '') + '"></i>'; }).join(''); }
function showChapter(i) {
    ci = i; li = 0;
    var el = flip ? $('sA') : $('sB'), old = flip ? $('sB') : $('sA');
    flip = !flip;
    el.style.backgroundImage = 'url(' + CH[i].img + ')';
    el.className = 'slide' + (i % 2 ? ' alt' : '');
    void el.offsetWidth;
    el.classList.add('show'); old.classList.remove('show');
    $('chapter').classList.remove('show'); $('date').classList.remove('show');
    setTimeout(function () {
        $('chapter').innerHTML = CH[i].ch + '<b>' + CH[i].t + '</b>';
        $('date').textContent = CH[i].date;
        $('chapter').classList.add('show'); $('date').classList.add('show');
        dots();
        typeLine();
    }, 700);
}
function typeLine() {
    clearInterval(typing); clearTimeout(autoT);
    var s = g(CH[ci].lines[li]), n = 0, el = $('line');
    typing = setInterval(function () {
        n++;
        el.innerHTML = s.slice(0, n).replace(/</g, '&lt;') + '<span class="c"></span>';
        if (n >= s.length) { clearInterval(typing); typing = null; autoT = setTimeout(next, 2200 + s.length * 25); }
    }, 32);
}
function next() {
    if (finished) return;
    if (typing) { clearInterval(typing); typing = null; $('line').innerHTML = g(CH[ci].lines[li]).replace(/</g, '&lt;') + '<span class="c"></span>'; clearTimeout(autoT); autoT = setTimeout(next, 3000); return; }
    clearTimeout(autoT);
    li++;
    if (li < CH[ci].lines.length) return typeLine();
    if (ci + 1 < CH.length) return showChapter(ci + 1);
    final();
}
function final() {
    finished = true;
    clearTimeout(autoT);
    $('text').style.opacity = 0; $('chapter').classList.remove('show'); $('hint').style.opacity = 0;
    ci = CH.length; dots();
    $('who').textContent = NAME.replace(/_/g, ' ');
    $('title').classList.add('show');
    setTimeout(end, 5500);
}
function end() {
    $('stage').classList.remove('on');
    setTimeout(function () { trig('cef:intro:done'); }, 1200);
}
window.introStart = function (name, fem) {
    if (started) return; started = true;
    NAME = String(name || NAME); FEM = !!fem;
    $('stage').classList.add('on');
    setTimeout(function () { showChapter(0); }, 600);
};
document.addEventListener('keydown', function (e) {
    if (!started) return;
    if (e.key === 'Escape') { if (!finished) { finished = true; clearTimeout(autoT); clearInterval(typing); end(); } return; }
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!finished) next(); }
});
document.addEventListener('click', function () { if (started && !finished) next(); });
