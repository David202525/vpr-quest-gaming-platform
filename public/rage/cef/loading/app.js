var TIPS = [
    'Телефон — F3, главное меню — M, помощь — /help',
    'Без жилья нельзя владеть машиной — купи дом в агентстве недвижимости',
    'Работу можно найти в телефоне: Карты → Работы',
    'Дальнобойщик возит продукты и топливо — чем выше уровень, тем дороже груз',
    'Права можно получить в лицензионном центре',
    'На аукционе можно купить дом, машину или бизнес у других игроков',
    'Уважай других игроков и соблюдай правила RP',
    'Паспорт оформляется в мэрии — без него не купить жильё'
];
var STEPS = ['Подключение к серверу', 'Загрузка ресурсов', 'Загрузка города', 'Подготовка персонажа', 'Почти готово'];
var pct = 0, ti = Math.floor(Math.random() * TIPS.length), done = false;
var fill = document.getElementById('fill'), pe = document.getElementById('pct'), st = document.getElementById('st'), tip = document.getElementById('tip');
function showTip() {
    tip.style.opacity = 0;
    setTimeout(function () { tip.textContent = TIPS[ti % TIPS.length]; ti++; tip.style.opacity = 1; }, 400);
}
function draw() {
    fill.style.width = pct + '%';
    pe.textContent = Math.floor(pct) + '%';
    st.textContent = STEPS[Math.min(STEPS.length - 1, Math.floor(pct / 20))];
}
showTip();
setInterval(showTip, 5000);
setInterval(function () {
    if (done) return;
    var cap = 92;
    if (pct < cap) pct += Math.max(0.3, (cap - pct) * 0.04);
    draw();
}, 200);
window.loadingDone = function () {
    done = true;
    pct = 100;
    draw();
    st.textContent = 'Добро пожаловать на AMRP';
    setTimeout(function () { document.body.classList.add('out'); }, 500);
};
