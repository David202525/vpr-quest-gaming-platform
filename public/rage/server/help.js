function lvl(p) {
    const d = global.DeathSystem;
    if (d && typeof d.adminLvl === 'function') return d.adminLvl(p);
    return p && p.account ? Number(p.account.admin) || 0 : 0;
}

function job(p) {
    return p && p.account ? p.account.job || '' : '';
}

function jobRank(p) {
    return p && p.account ? Number(p.account.job_rank) || 0 : 0;
}

function BS() {
    return global.BaseSystem || null;
}

function isOwner(p) {
    const b = BS();
    return !!(b && b.ownedBy(p));
}

function isFamily(p) {
    const b = BS();
    return !!(b && (b.ownedBy(p) || b.memberOf(p)));
}

function isMedic(p) {
    return job(p) === 'medic';
}

function isArmy(p) {
    return job(p) === 'army';
}

const SECTIONS = [
    {
        title: 'Основное',
        can: function () { return true; },
        rows: [
            ['/911 [причина]', 'вызвать медиков'],
            ['/respawn', 'очнуться в больнице, если ранен (после ожидания)'],
            ['/medics', 'список врачей в сети']
        ]
    },
    {
        title: 'Моя семья',
        can: isFamily,
        rows: [
            ['/baseinfo', 'информация о базе'],
            ['/basegps', 'метка на базу'],
            ['/basemembers', 'список семьи'],
            ['/gate', 'открыть ворота базы'],
            ['/baseleave', 'выйти из семьи']
        ]
    },
    {
        title: 'Лидер семьи',
        can: isOwner,
        rows: [
            ['/baseinvite [id]', 'принять в семью'],
            ['/basekick [id]', 'выгнать из семьи'],
            ['/baselock', 'пускать гостей / закрыть базу'],
            ['/basegate [gate|bar|fence]', 'поставить ворота'],
            ['/basegatedel', 'убрать последние ворота']
        ]
    },
    {
        title: 'Медики (EMS)',
        can: isMedic,
        rows: [
            ['E', 'действие рядом: смена, койка, гараж'],
            ['/duty', 'начать / закончить смену'],
            ['/calls', 'список вызовов'],
            ['/accept [номер]', 'принять вызов'],
            ['/heal [id]', 'вылечить игрока'],
            ['/revive [id]', 'поднять раненого'],
            ['/m [текст]', 'рация медиков']
        ]
    },
    {
        title: 'Руководство EMS',
        can: function (p) { return isMedic(p) && jobRank(p) >= 4; },
        rows: [
            ['/invite [id]', 'принять во фракцию'],
            ['/uninvite [id]', 'уволить из фракции']
        ]
    },
    {
        title: 'Главврач',
        can: function (p) { return isMedic(p) && jobRank(p) >= 5; },
        rows: [
            ['/setrank [id] [1-5]', 'изменить ранг сотрудника']
        ]
    },
    {
        title: 'Армия (САФ)',
        can: isArmy,
        rows: [
            ['/gate', 'открыть ворота военной базы'],
            ['', 'зарплата каждый час, зависит от звания']
        ]
    }
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

function show(p, title, rows) {
    p.outputChatBox('!{#ffd24d}--- ' + title + ' ---');
    rows.forEach(function (r) {
        if (!r[0]) p.outputChatBox('!{#cccccc}' + r[1]);
        else p.outputChatBox('!{#7fd4ff}' + r[0] + ' !{#cccccc}- ' + r[1]);
    });
}

mp.events.addCommand('help', function (p, arg) {
    const list = SECTIONS.filter(function (s) { return s.can(p); });
    const n = parseInt(arg, 10);
    if (!isNaN(n) && list[n - 1]) return show(p, list[n - 1].title, list[n - 1].rows);
    if (list.length === 1) {
        show(p, list[0].title, list[0].rows);
    } else {
        p.outputChatBox('!{#ffd24d}=== Помощь по серверу ===');
        list.forEach(function (s, i) {
            p.outputChatBox('!{#7fd4ff}/help ' + (i + 1) + ' !{#ffffff}- ' + s.title);
        });
    }
    if (lvl(p) >= 1) p.outputChatBox('!{#ff8080}/ahelp !{#ffffff}- команды администратора');
});

mp.events.addCommand('ahelp', function (p, arg) {
    const my = lvl(p);
    if (my < 1) return;
    const list = ADMIN.filter(function (s) { return my >= s[0]; });
    const n = parseInt(arg, 10);
    if (!isNaN(n) && list[n - 1]) return show(p, list[n - 1][1], list[n - 1][2]);
    p.outputChatBox('!{#ff8080}=== Админ-команды (твой уровень: ' + my + ') ===');
    list.forEach(function (s, i) {
        p.outputChatBox('!{#7fd4ff}/ahelp ' + (i + 1) + ' !{#ffffff}- ' + s[1]);
    });
    if (!list.length) p.outputChatBox('!{#cccccc}Для твоего уровня команд пока нет');
});

console.log('[help] /help и /ahelp загружены');
