const PLAYER = [
    ['Основное', [
        ['/911 [причина]', 'вызвать медиков'],
        ['/respawn', 'очнуться в больнице, если ранен (после ожидания)'],
        ['/medics', 'список врачей в сети']
    ]],
    ['Семья и база', [
        ['/baseinfo', 'информация о твоей базе'],
        ['/basegps', 'метка на базу'],
        ['/basemembers', 'список семьи'],
        ['/gate', 'открыть ворота базы'],
        ['/baseleave', 'выйти из семьи']
    ]],
    ['Владелец базы', [
        ['/baseinvite [id]', 'принять в семью'],
        ['/basekick [id]', 'выгнать из семьи'],
        ['/baselock', 'пускать гостей / закрыть базу'],
        ['/basegate [gate|bar|fence]', 'поставить ворота'],
        ['/basegatedel', 'убрать последние ворота']
    ]],
    ['Медики (EMS)', [
        ['E', 'действие рядом: смена, койка, гараж'],
        ['/duty', 'начать / закончить смену'],
        ['/calls', 'список вызовов'],
        ['/accept [номер]', 'принять вызов'],
        ['/heal [id]', 'вылечить игрока'],
        ['/revive [id]', 'поднять раненого'],
        ['/m [текст]', 'рация медиков'],
        ['/invite /uninvite [id]', 'принять / уволить (зав. отд.+)'],
        ['/setrank [id] [ранг]', 'изменить ранг (главврач)']
    ]]
];

const ADMIN = [
    [2, 'Помощь игрокам (2+)', [
        ['/revive [id]', 'поднять игрока'],
        ['/medpos', 'показать координаты'],
        ['/hospdoor [in|out]', 'точки двери больницы']
    ]],
    [2, 'Строительство (2+)', [
        ['/proplist', 'все типы объектов'],
        ['/prop [тип] [поворот]', 'поставить объект'],
        ['/pveh [тип] [поворот]', 'поставить технику'],
        ['/blockpost /milpost /milbase', 'готовые постройки'],
        ['/wreckzone [кол-во]', 'заброшенная улица'],
        ['/overgrow [кол-во]', 'заросли вокруг'],
        ['/fire [1-3] /smoke', 'огонь и дым'],
        ['/propundo [кол-во]', 'отменить последние'],
        ['/propdel', 'удалить ближайший'],
        ['/propclear [радиус]', 'очистить радиус'],
        ['/apoc', 'вкл/выкл атмосферу апокалипсиса']
    ]],
    [4, 'Базы и фракции (4+)', [
        ['/basecreate [family|army] [цена] [радиус] [имя]', 'создать базу'],
        ['/basegive [база] [id]', 'выдать базу игроку'],
        ['/basefree [база]', 'освободить базу'],
        ['/basedel [база]', 'удалить базу'],
        ['/baselist', 'список баз'],
        ['/basetp [база]', 'телепорт на базу'],
        ['/basesetarmy [база]', 'сделать военной / семейной'],
        ['/setarmy [id] [1-7]', 'принять в САФ'],
        ['/unarmy [id]', 'уволить из САФ'],
        ['/makeleader [id]', 'лидер EMS'],
        ['/paydaynow', 'выдать зарплату сейчас']
    ]]
];

function lvl(p) {
    const d = global.DeathSystem;
    if (d && typeof d.adminLvl === 'function') return d.adminLvl(p);
    return p && p.account ? Number(p.account.admin) || 0 : 0;
}

function show(p, title, rows) {
    p.outputChatBox('!{#ffd24d}--- ' + title + ' ---');
    rows.forEach(function (r) {
        p.outputChatBox('!{#7fd4ff}' + r[0] + ' !{#cccccc}- ' + r[1]);
    });
}

function find(list, arg) {
    const n = parseInt(arg, 10);
    if (!isNaN(n) && list[n - 1]) return list[n - 1];
    return null;
}

mp.events.addCommand('help', function (p, arg) {
    const sec = find(PLAYER, arg);
    if (sec) return show(p, sec[0], sec[1]);
    p.outputChatBox('!{#ffd24d}=== Помощь по серверу ===');
    PLAYER.forEach(function (s, i) {
        p.outputChatBox('!{#7fd4ff}/help ' + (i + 1) + ' !{#ffffff}- ' + s[0]);
    });
    if (lvl(p) >= 1) p.outputChatBox('!{#ff8080}/ahelp !{#ffffff}- команды администратора');
});

mp.events.addCommand('ahelp', function (p, arg) {
    const my = lvl(p);
    if (my < 1) return;
    const list = ADMIN.filter(function (s) { return my >= s[0]; });
    const sec = find(list, arg);
    if (sec) return show(p, sec[1], sec[2]);
    p.outputChatBox('!{#ff8080}=== Админ-команды (твой уровень: ' + my + ') ===');
    list.forEach(function (s, i) {
        p.outputChatBox('!{#7fd4ff}/ahelp ' + (i + 1) + ' !{#ffffff}- ' + s[1]);
    });
    if (!list.length) p.outputChatBox('!{#cccccc}Для твоего уровня команд пока нет');
});

console.log('[help] /help и /ahelp загружены');
