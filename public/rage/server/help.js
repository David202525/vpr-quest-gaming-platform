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
            ['/medics', 'список врачей в сети'],
            ['/intro', 'пересмотреть историю своего персонажа'],
            ['/hotel [дней]', 'снять номер в гостинице — сможете появляться там при входе'],
            ['/fines', 'мои штрафы · /fines pay [номер|all] — оплатить со счёта'],
            ['/accept', 'принять приглашение в гос. организацию']
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
            ['H или /gate', 'открыть ворота военной базы (с ранга, который выдал лидер)'],
            ['E у штабеля', 'взять ящик поставки; E у кузова Barracks — погрузить (до 12 ящиков)'],
            ['/supply', 'за рулём загруженного Barracks у склада LSPD/шерифа/FIB — сдать ящики, $400 за ящик'],
            ['F6', 'планшет: состав, отряды, ранги, права доступа, поставки'],
            ['/armysupply', 'админ: now — досрочно, interval [ч], count [шт], here — место ящиков, del — удалить точку поставок'],
            ['/armypark', 'админ: car — место для машин, air — для авиации (где стоите), del — ближайшее, clear car|air'],
            ['/armygate', 'админ: edit — редактор ближайших ворот, add [тип] — новые в редакторе, del — ближайшие, del [№], clear — все, list'],
            ['', 'зарплата каждый час, зависит от звания']
        ]
    },
    {
        title: 'Полиция',
        can: function (p) { const a = p.account; return !!(a && ['lspd', 'sheriff', 'fib'].indexOf(a.job) >= 0); },
        rows: [
            ['/su [id] [1-5] [причина]', 'объявить в розыск'],
            ['/clear [id]', 'снять розыск'],
            ['/cuff [id] · /uncuff [id]', 'надеть / снять наручники'],
            ['/arrest [id]', 'посадить: LSPD — только у КПЗ в отделе, шериф/FIB — у участка. 1★ = 10 мин тюрьмы'],
            ['U · J · K', 'наручники · вести за собой · посадить/вытащить из машины (меняются в M → Настройки)'],
            ['F6 / /tablet', 'служебный планшет: состав, розыск, пробив по базе, штрафы, отслеживание'],
            ['E у меток', 'красная — склад оружия, синяя — раздевалка, жёлтая — гараж']
        ]
    }
];

const ADMIN = [
    [1, 'Хелпер (1+)', [
        ['F4', 'админ-панель'],
        ['/a [текст]', 'админ-чат'],
        ['/admins', 'админы онлайн'],
        ['/pm [id] [текст]', 'ответ игроку'],
        ['/goto [id]', 'телепорт к игроку'],
        ['/mute [id] [мин] [причина]', 'мут'],
        ['/unmute [id]', 'снять мут']
    ]],
    [2, 'Модератор (2+)', [
        ['/tp [id] /bring [id]', 'телепорты'],
        ['/aheal [id]', 'вылечить'],
        ['/kick [id] [причина]', 'кик'],
        ['/warn [id] [причина]', 'варн, 3 варна = бан 3 дня'],
        ['/unwarn [логин]', 'снять варны'],
        ['/freeze [id]', 'заморозить / разморозить'],
        ['/slap [id]', 'подбросить'],
        ['/fly', 'полёт (F5 — выйти)'],
        ['/gm /invis', 'бессмертие и невидимость'],
        ['/revive [id]', 'поднять раненого']
    ]],
    [2, 'Строительство (2+)', [
        ['/proplist', 'типы объектов'],
        ['/prop [тип] [поворот]', 'поставить объект'],
        ['/blockpost /milpost', 'блокпосты'],
        ['/milbase [20-90]', 'база с домами'],
        ['/milhouse', 'жилой блок'],
        ['/propundo /propdel /propclear', 'удаление'],
        ['/apoc', 'атмосфера апокалипсиса']
    ]],
    [3, 'Ст. модератор (3+)', [
        ['/ban [id] [30m/12h/7d] [причина]', 'бан до 7 дней'],
        ['/unban [логин]', 'разбан'],
        ['/banlist', 'активные баны'],
        ['/veh [модель] [цв1] [цв2]', 'создать машину'],
        ['/dv', 'удалить машину'],
        ['/fix', 'починить машину'],
        ['/tpc [x] [y] [z]', 'телепорт по координатам']
    ]],
    [4, 'Администратор (4+)', [
        ['/ban ... до 30d', 'бан до 30 дней'],
        ['/offban [логин] [срок] [причина]', 'бан офлайн'],
        ['/vehdlc [модель]', 'создать DLC-машину'],
        ['/adddlc [модель] [название]', 'добавить DLC в панель'],
        ['/dlclist', 'список DLC'],
        ['/dvall', 'удалить все админ-машины'],
        ['/weather /time', 'погода и время'],
        ['/ann [текст]', 'объявление всем'],
        ['/basecreate /basegive /basedel /basewipe', 'базы'],
        ['/baseprice /basename /baselist /basetp', 'управление базами']
    ]],
    [5, 'Ст. администратор (5+)', [
        ['/ban [id] 0 [причина]', 'вечный бан'],
        ['/givemoney [id] [сумма]', 'выдать деньги'],
        ['/givecar [id] [модель]', 'машина в собственность'],
        ['/sethp [id] [0-100]', 'изменить здоровье']
    ]],
    [6, 'Гл. администратор (6+)', [
        ['/setadmin [id] [0-7]', 'назначить ниже своего уровня']
    ]],
    [7, 'Основатель (7)', [
        ['/setadmin [id] [0-7]', 'назначает любой уровень, действует на всех']
    ]]
];

const RANKS = ['Игрок', 'Хелпер', 'Модератор', 'Ст. модератор', 'Администратор', 'Ст. администратор', 'Гл. администратор', 'Основатель'];

function rankName(n) {
    n = Number(n) || 0;
    return RANKS[n] || ('Уровень ' + n);
}

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
    p.outputChatBox('!{#ff8080}=== Админ-команды: ' + rankName(my) + ' (уровень ' + my + ') ===');
    list.forEach(function (s, i) {
        p.outputChatBox('!{#7fd4ff}/ahelp ' + (i + 1) + ' !{#ffffff}- ' + s[1]);
    });
    p.outputChatBox('!{#cccccc}Тебе доступны все команды уровня ' + my + ' и ниже');
    if (!list.length) p.outputChatBox('!{#cccccc}Для твоего уровня команд пока нет');
});

console.log('[help] /help и /ahelp загружены');
