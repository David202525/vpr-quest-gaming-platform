var D = null;
var selected = null;
var COLORS = ['#ffffff', '#7fd4ff', '#8fd14f', '#4fd1a5', '#ffcc66', '#ff9f43', '#ff6b6b', '#ff4fa3', '#c13dff', '#00e5ff'];
var RANK_INFO = [
    ['Обычный игрок'],
    ['Репорты, админ-чат', 'Слежка, AFK, свободная камера', 'Тачку к себе, инфо о владельце', 'Админ-зона, лечить себя'],
    ['/getpos, /arespawn', 'Объявление в чат /o', 'Ворота, эвакуатор', 'Скрыть префикс'],
    ['Кик, мут, деморган, КПЗ', 'Ник, ТП, заморозка, слап', 'ТП из флая, поиск по номеру', 'Отбор лицензий, ремонт, dimension'],
    ['Бан до 30 дн., офлайн-бан', 'Высадить, респавн общ. транспорта', 'Джетпак, маппинг', 'МП-панель'],
    ['Бан до 90 дн.', 'Респавн гос. транспорта', 'Автопарк и оружие фракций', 'Лидеры, ОЧС'],
    ['HP и броня по ID', 'Слежка за флаем, взгляд игрока', 'ТП за руль, любая машина, оружие', 'Банлист, маркеры, светофоры'],
    ['Разбан, вечный и глобальный бан', 'Внешняя консоль', 'История ников, банк игрока', 'Скин, зелёные зоны, админка вкл/выкл'],
    ['Логи', 'Назначение админов до ЗГА', 'Закрытие фракций', 'Отключение функций админки'],
    ['Выдача/снятие денег', 'Эксклюзивный маппинг', 'Назначение ГА', 'Отключение работ']
];
var CMDS = [
    [1, '/ans [№] [текст]', 'Ответ на репорт'], [1, '/reports', 'Открытые репорты'], [1, '/a [текст]', 'Админ-чат'], [1, '/spec [id], /specoff', 'Слежка'],
    [1, '/afk [id]', 'Сколько игрок в AFK'], [1, '/getcar [id машины] [1-5]', 'Тачку к себе'], [1, '/carinfo [id машины]', 'Данные владельца авто'],
    [1, '/rnick [m/f]', 'Случайный ник'], [1, '/nickrule [id]', 'Текст про неверный ник'], [1, '/unjailself', 'Выйти из КПЗ'], [1, '/newbies', 'Недавно зарегистрированные'],
    [1, '/near [id]', 'Игроки рядом'], [1, '/az', 'Админ-зона и обратно'], [1, '/respcar [id машины]', 'Респавн машины'], [1, '/hp', 'Вылечить себя'], [1, '/fly, F5, Backspace', 'Свободная камера'],
    [2, '/getpos', 'Координаты в консоль'], [2, '/arespawn [id]', 'Поднять + вылечить + на спавн'], [2, '/o [текст]', 'Объявление в чат'], [2, '/agate', 'Открыть ворота в 15 м'],
    [2, '/tow, /hook', 'Эвакуатор и крюк'], [1, '/hideprefix', 'Префикс и значок вкл/выкл'],
    [3, '/kick, /mute, /warn', 'Наказания'], [3, '/demorgan [id] [мин] [причина], /undemorgan', 'Деморган'], [3, '/unjail [id]', 'Из КПЗ'], [3, '/setname [id] [Имя_Фамилия]', 'Сменить ник'],
    [3, '/goto, /bring, /tpto [id] [id]', 'Телепорты'], [3, '/freeze [id]', 'Заморозка'], [3, '/slap [id] [hp]', 'Слап (видят все админы)'], [3, '/plate [номер]', 'Владелец по номеру'],
    [3, '/takelic [id] [drive/bus/taxi/truck/gun] [мин]', 'Отнять лицензию'], [3, '/fixveh [id машины], /fixp [id]', 'Ремонт'], [3, '/setdim [id] [dim]', 'Измерение'],
    [4, '/ban, /offban', 'Бан до 30 дней'], [4, '/eject [id]', 'Высадить'], [4, '/respawnpub', 'Респавн общ. транспорта'], [4, '/jetpack', 'Джетпак'], [4, '/obj [модель], /objdel', 'Маппинг'], [4, '/veh [модель]', 'Машина'],
    [5, '/respawngov', 'Респавн гос. транспорта'], [5, '/setleader [id|#static] [фракция], /unleader', 'Лидеры'],
    [6, '/sethp, /takehp, /setarmour', 'HP и броня'], [6, '/flylist, /flywatch [id]', 'Контроль свободной камеры'], [6, '/screen [id]', 'Смотреть от лица игрока'], [6, '/tpcar [id машины]', 'ТП за руль'],
    [6, '/givecar [id] [модель]', 'Любая машина'], [6, '/giveweapon [id] [оружие] [патроны]', 'Оружие'], [6, '/adminidle', 'Админы без ответов'], [6, '/banlist [поиск]', 'История банов'],
    [6, '/hpmarker [hp/armour], /hpmarkerdel', 'Маркеры'], [6, '/traffic', 'Светофоры'],
    [7, '/unban [логин]', 'Разбан'], [7, '/permban [id|#static] [причина]', 'Глобальный бан'], [7, '/nickhistory [id|#static]', 'История ников'], [7, '/bank [id|#static]', 'Деньги игрока'],
    [7, '/aoff, /aon', 'Админка вкл/выкл'], [7, '/skin [id] [модель]', 'Скин'], [7, '/greenzone, /gzadd, /gzdel', 'Зелёные зоны'],
    [8, '/logs [поиск]', 'Логи'], [8, '/givedonate [id|#static] [RC]', 'Выдать/забрать донат (минус — забрать)'], [8, '/setadmin [id|логин|static] [0-7]', 'Назначить админа (можно офлайн)'], [8, '/factionoff, /factionon', 'Закрыть фракцию'], [8, '/flock [функция]', 'Отключить функцию'],
    [9, '/gm2, /takemoney [id|#static] [сумма] [bank]', 'Деньги'], [9, '/exobj [модель]', 'Эксклюзивный маппинг'], [9, '/setga, /unga', 'ГА'], [9, '/joboff [работа]', 'Отключить работу']
];
var MP_WEAPONS = [['weapon_pistol', 'Пистолет'], ['weapon_smg', 'SMG'], ['weapon_carbinerifle', 'Карабин'], ['weapon_pumpshotgun', 'Дробовик'], ['weapon_sniperrifle', 'Снайперка'], ['weapon_knife', 'Нож'], ['weapon_bat', 'Бита'], ['weapon_rpg', 'RPG']];
var MP_CARS = ['sultan', 'kuruma', 'elegy2', 'bati', 'sanchez', 'blazer', 'dune', 'bmx', 'faggio', 'bus'];
var FSEL = null;
var PRESETS = ['sultan', 'kuruma', 'adder', 'zentorno', 't20', 'elegy2', 'bati', 'sanchez', 'buzzard2', 'mesa3', 'dubsta2', 'police'];
var WEATHER = [['EXTRASUNNY', 'Солнце'], ['CLEAR', 'Ясно'], ['CLOUDS', 'Облачно'], ['OVERCAST', 'Пасмурно'], ['RAIN', 'Дождь'], ['THUNDER', 'Гроза'], ['FOGGY', 'Туман'], ['SMOG', 'Смог'], ['SNOW', 'Снег'], ['XMAS', 'Сугробы'], ['HALLOWEEN', 'Хэллоуин']];
var BAN_TIMES = [[60, '1 час'], [360, '6 часов'], [1440, '1 день'], [4320, '3 дня'], [10080, '7 дней'], [43200, '30 дней'], [0, 'Навсегда']];
var MUTE_TIMES = [5, 10, 30, 60, 120];

function $(id) { return document.getElementById(id); }
function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function trig() { if (window.mp && mp.trigger) mp.trigger.apply(mp, arguments); }
function act(o) { trig('cef:adm:act', JSON.stringify(o)); }
function canDo(a) { return D && D.me.level >= (D.perm[a] || 99); }
function fmtTime(t) { var d = new Date(t); return d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }); }
function dur(min) {
    if (!min) return 'навсегда';
    if (min < 60) return min + ' мин';
    if (min < 1440) return Math.round(min / 60) + ' ч';
    return Math.round(min / 1440) + ' дн';
}

window.admToast = function (text, ok) {
    var t = document.createElement('div');
    t.className = 'toast' + (ok ? '' : ' bad');
    t.textContent = text;
    $('toasts').appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
};

window.admData = function (json) {
    D = typeof json === 'string' ? JSON.parse(json) : json;
    $('meName').textContent = D.me.name;
    $('meRank').textContent = D.me.rank + ' · ур. ' + D.me.level;
    $('meRank').style.color = D.me.color;
    $('meAva').textContent = (D.me.name || '?').charAt(0).toUpperCase();
    $('meAva').style.borderColor = D.me.color;
    [renderRanks, renderPlayers, renderBans, renderLogs, renderDlc, renderServer, renderBiz, renderExt, renderMedia, renderPromos, renderDealers].forEach(function (f) {
        try { f(); } catch (e) { if (window.console) console.log('[admin] ' + (f.name || '') + ': ' + e.message); }
    });
};

function renderPlayers() {
    var f = $('pSearch').value.trim().toLowerCase();
    var list = D.players.filter(function (p) { return !f || String(p.id) === f || p.name.toLowerCase().indexOf(f) >= 0; });
    $('pCount').textContent = D.players.length;
    $('pList').innerHTML = list.map(function (p) {
        var tags = '';
        if (p.muted) tags += '<span class="tag mu">МУТ</span>';
        if (p.frozen) tags += '<span class="tag fr">ЗАМ</span>';
        if (p.warns) tags += '<span class="tag wa">' + p.warns + '/3</span>';
        return '<div class="pl' + (selected === p.id ? ' sel' : '') + '" data-id="' + p.id + '">' +
            '<div class="pid">' + p.id + '</div>' +
            '<div class="pn"><b>' + esc(p.name) + '</b><span style="color:' + COLORS[p.admin] + '">' + esc(p.rank) + '</span></div>' +
            '<div class="tags">' + tags + '</div>' +
            '<div class="hp"><div style="width:' + Math.max(0, Math.min(100, p.hp)) + '%"></div></div></div>';
    }).join('') || '<div class="empty">Никого не найдено</div>';
    renderDetail();
}

function btn(label, action, cls) {
    var need = EXT_PERM[action] !== undefined ? EXT_PERM[action] : (D.perm[action] || 99);
    var ok = D.me.level >= need;
    return '<button class="btn ' + (cls || '') + '" data-pa="' + action + '"' + (ok ? '' : ' disabled title="Недоступно на твоём уровне"') + '>' + label + '</button>';
}

function renderDetail() {
    var p = D && D.players.find(function (x) { return x.id === selected; });
    if (!p) { $('pDetail').innerHTML = '<div class="empty">Выбери игрока слева</div>'; return; }
    $('pDetail').innerHTML =
        '<div class="d-head"><div class="d-ava">' + esc(p.name.charAt(0).toUpperCase()) + '</div>' +
        '<div><div class="d-name">' + esc(p.name) + ' <span class="badge">ID ' + p.id + '</span></div>' +
        '<div style="color:' + COLORS[p.admin] + ';font-size:12px;font-weight:700">' + esc(p.rank) + '</div></div></div>' +
        '<div class="stats">' +
        '<div class="stat"><span>Здоровье</span><b>' + p.hp + '</b></div>' +
        '<div class="stat"><span>Броня</span><b>' + p.armour + '</b></div>' +
        '<div class="stat"><span>Пинг</span><b>' + p.ping + '</b></div>' +
        '<div class="stat"><span>Деньги</span><b>$' + Number(p.money).toLocaleString('ru-RU') + '</b></div>' +
        '<div class="stat"><span>Варны</span><b>' + p.warns + '/3</b></div>' +
        '<div class="stat"><span>Статус</span><b>' + (p.muted ? 'Мут' : p.frozen ? 'Заморожен' : 'Норм') + '</b></div>' +
        '</div>' +
        '<div class="act-group"><div class="g">Перемещение</div><div class="act-btns">' +
        btn('К нему', 'goto') + btn('К себе', 'bring') + btn('Шлепок', 'slap') + '</div></div>' +
        '<div class="act-group"><div class="g">Помощь</div><div class="act-btns">' +
        btn('Вылечить', 'heal', 'ok') + btn('Поднять', 'revive', 'ok') + btn(p.frozen ? 'Разморозить' : 'Заморозить', p.frozen ? 'unfreeze' : 'freeze') + '</div></div>' +
        '<div class="act-group"><div class="g">Наказания</div><div class="act-btns">' +
        btn(p.muted ? 'Снять мут' : 'Мут', p.muted ? 'unmute' : 'mute') + btn('Варн', 'warn') + btn('Кик', 'kick', 'danger') + '</div>' +
        '<div class="act-btns" style="margin-top:6px;grid-template-columns:1fr">' + btn('Забанить', 'ban', 'danger') + '</div></div>' +
        '<div class="act-group"><div class="g">Контроль</div><div class="act-btns">' +
        btn('Следить', 'spec') + btn('Глазами', 'screen') + btn('Высадить', 'eject') + btn('Ремонт авто', 'fixp') + btn('Измерение', 'dim') + btn('Сменить ник', 'setname') + '</div></div>' +
        '<div class="act-group"><div class="g">Полиция · розыск ' + '<span class="stars">' + [1, 2, 3, 4, 5].map(function (i) { return '<i class="' + (i <= (p.wanted || 0) ? 'on' : '') + '">★</i>'; }).join('') + '</span>' + (p.cuffed ? ' · в наручниках' : '') + '</div><div class="act-btns">' +
        btn('Выдать розыск', 'wantedset', 'danger') + btn('Снять розыск', 'wantedclear', 'ok') + btn(p.cuffed ? 'Раскафнуть' : 'Кафнуть', p.cuffed ? 'uncuff' : 'cuff') +
        (p.jail && p.jail.type === 'prison' && p.jail.officer ? btn('Выпустить из тюрьмы', 'prisonrelease', 'ok') : '') + '</div></div>' +
        '<div class="act-group"><div class="g">Наказания 2</div><div class="act-btns">' +
        (p.jail ? btn(p.jail.type === 'demorgan' ? 'Выпустить из деморгана' : p.jail.type === 'prison' ? 'Освободить (тюрьма)' : 'Выпустить из КПЗ', 'unjailp', 'ok') : btn('Деморган', 'jail', 'danger')) + btn('Отнять лиц.', 'takelic') + btn('Глоб. бан', 'permban', 'danger') + '</div></div>' +
        '<div class="act-group"><div class="g">Руководство</div><div class="act-btns">' +
        btn('HP', 'hpset') + btn('Броня', 'armourset') + btn('Оружие', 'weapon') + btn('Скин', 'skin') + btn('Банк', 'bankinfo') + btn('Ники', 'nickhist') + '</div></div>' +
        '<div class="act-group"><div class="g">Экономика</div><div class="act-btns" style="grid-template-columns:1fr 1fr">' +
        btn('Деньги ±', 'money2') + btn('Выдать машину', 'givecar') + btn('Донат RC ±', 'coins') + '</div></div>';
}

function modal(title, sub, body, okText, onOk) {
    $('mTitle').textContent = title;
    $('mSub').textContent = sub || '';
    $('mBody').innerHTML = body;
    $('mOk').textContent = okText || 'Подтвердить';
    $('modal').classList.add('show');
    $('mOk').onclick = function () { if (onOk() !== false) $('modal').classList.remove('show'); };
    var first = $('mBody').querySelector('input, textarea');
    if (first) setTimeout(function () { first.focus(); }, 50);
}

function chipsHtml(items, name, active) {
    return '<div class="chips" data-chips="' + name + '">' + items.map(function (it) {
        return '<button class="chip' + (it[0] === active ? ' active' : '') + '" data-v="' + it[0] + '">' + it[1] + '</button>';
    }).join('') + '</div>';
}

function chipValue(name) {
    var c = document.querySelector('[data-chips="' + name + '"] .chip.active');
    return c ? Number(c.dataset.v) : null;
}

function playerAction(a) {
    var p = D.players.find(function (x) { return x.id === selected; });
    if (!p) return;
    var who = p.name + ' [' + p.id + ']';
    var reasonField = '<label>Причина</label><input id="mReason" placeholder="Например: DM, NonRP, оскорбления">';

    if (a === 'ban') {
        var times = BAN_TIMES.filter(function (t) {
            if (!D.maxBan) return t[0] !== 0 || canDo('permban');
            return t[0] !== 0 && t[0] <= D.maxBan;
        });
        modal('Бан игрока', who + (D.maxBan ? ' · твой максимум ' + dur(D.maxBan) : ''),
            '<label>Срок</label>' + chipsHtml(times, 'bt', times[0][0]) + reasonField, 'Забанить', function () {
                var r = $('mReason').value.trim();
                if (!r) { window.admToast('Укажи причину', false); return false; }
                act({ action: 'ban', id: p.id, minutes: chipValue('bt'), reason: r });
            });
    } else if (a === 'kick' || a === 'warn') {
        modal(a === 'kick' ? 'Кик игрока' : 'Предупреждение', who + (a === 'warn' ? ' · 3 варна = бан на 3 дня' : ''), reasonField, a === 'kick' ? 'Кикнуть' : 'Выдать', function () {
            act({ action: a, id: p.id, reason: $('mReason').value.trim() || 'нарушение правил' });
        });
    } else if (a === 'mute') {
        modal('Мут в чате', who, '<label>Минут</label>' + chipsHtml(MUTE_TIMES.map(function (m) { return [m, m + ' мин']; }), 'mt', 10) + reasonField, 'Замутить', function () {
            act({ action: 'mute', id: p.id, minutes: chipValue('mt'), reason: $('mReason').value.trim() || 'нарушение' });
        });
    } else if (a === 'givemoney') {
        modal('Выдать деньги', who, '<label>Сумма (можно с минусом)</label><input id="mSum" type="number" placeholder="10000">', 'Выдать', function () {
            act({ action: 'givemoney', id: p.id, sum: Number($('mSum').value) });
        });
    } else if (a === 'givecar') {
        modal('Машина в собственность', who, '<label>Модель</label><input id="mCar" placeholder="sultan или DLC-модель">' +
            '<div class="row2"><div><label>Цвет 1</label><input id="mC1" type="number" value="0"></div><div><label>Цвет 2</label><input id="mC2" type="number" value="0"></div></div>', 'Выдать', function () {
            var m = $('mCar').value.trim().toLowerCase();
            if (!m) return false;
            trig('cef:adm:veh', JSON.stringify({ model: m, c1: Number($('mC1').value), c2: Number($('mC2').value), dlc: true, target: p.id, own: true }));
        });
    } else if (a === 'unjailp') {
        act({ action: 'release', id: p.id });
    } else if (a === 'jail') {
        modal('Деморган', who, '<label>Минут</label>' + chipsHtml([[15, '15'], [30, '30'], [60, '60'], [120, '120'], [300, '300']], 'jt', 30) + reasonField, 'Отправить', function () {
            act({ action: 'jail', id: p.id, minutes: chipValue('jt'), reason: $('mReason').value.trim() || 'нарушение' });
        });
    } else if (a === 'takelic') {
        modal('Отнять лицензию', who, '<label>Что</label>' + chipsHtml([['drive', 'Права'], ['bus', 'Автобус'], ['taxi', 'Такси'], ['truck', 'Грузовик'], ['gun', 'Оружие']].map(function (x, i) { return [i, x[1], x[0]]; }), 'lt', 0) +
            '<label>Минут (0 — пересдать сразу)</label><input id="mMin" type="number" value="0">' + reasonField, 'Отнять', function () {
            var types = ['drive', 'bus', 'taxi', 'truck', 'gun'];
            act({ action: 'takelic', id: p.id, type: types[chipValue('lt')], minutes: Number($('mMin').value) || 0, reason: $('mReason').value.trim() });
        });
    } else if (a === 'permban') {
        modal('Глобальный вечный бан', who + ' · на всех серверах', reasonField, 'Забанить навсегда', function () {
            var r = $('mReason').value.trim(); if (!r) return false;
            act({ action: 'permban', id: p.id, reason: r });
        });
    } else if (a === 'hpset' || a === 'armourset' || a === 'dim' || a === 'skin' || a === 'setname') {
        var lab = { hpset: 'HP (0–100)', armourset: 'Броня (0–100, 0 — забрать)', dim: 'Измерение', skin: 'Модель скина', setname: 'Новый ник Имя_Фамилия' }[a];
        modal(lab, who, '<label>' + lab + '</label><input id="mVal">', 'Применить', function () {
            var v = $('mVal').value.trim(); if (v === '') return false;
            if (a === 'setname') act({ action: 'setname', id: p.id, name: v }); else act({ action: a, id: p.id, value: a === 'skin' ? v : Number(v) });
        });
    } else if (a === 'weapon') {
        modal('Выдать оружие', who, '<label>Оружие</label><input id="mW" placeholder="weapon_pistol"><label>Патроны</label><input id="mA" type="number" value="120">', 'Выдать', function () {
            act({ action: 'weapon', id: p.id, w: $('mW').value.trim(), ammo: Number($('mA').value) });
        });
    } else if (a === 'wantedset') {
        modal('Выдать розыск', who + ' · 1★ = ' + 10 + ' мин тюрьмы', '<label>Звёзды</label>' + chipsHtml([[1, '★'], [2, '★★'], [3, '★★★'], [4, '★★★★'], [5, '★★★★★']], 'ws', p.wanted || 1) + reasonField, 'Выдать', function () {
            var r = $('mReason').value.trim();
            if (!r) { window.admToast('Укажи причину', false); return false; }
            act({ action: 'wantedset', id: p.id, stars: chipValue('ws'), reason: r });
        });
    } else if (a === 'coins') {
        modal('Донат-валюта (RC)', who, '<label>Количество RC (минус — забрать)</label><input id="mSum" type="number" placeholder="500">', 'Применить', function () {
            var n = Number($('mSum').value);
            if (!n) { window.admToast('Укажи количество', false); return false; }
            act({ action: 'coins', id: p.id, sum: n });
        });
    } else if (a === 'money2') {
        modal('Деньги', who, '<label>Сумма (минус — забрать)</label><input id="mSum" type="number"><label class="check"><input type="checkbox" id="mBank"> На банковский счёт</label>', 'Применить', function () {
            act({ action: 'money2', id: p.id, sum: Number($('mSum').value), bank: $('mBank').checked });
        });
    } else {
        act({ action: a, id: p.id });
    }
}
var EXT_PERM = { unjailp: 3, wantedset: 3, wantedclear: 3, cuff: 3, uncuff: 3, prisonrelease: 3, spec: 1, screen: 6, eject: 4, fixp: 3, dim: 3, setname: 3, jail: 3, takelic: 3, permban: 7, hpset: 6, armourset: 6, weapon: 6, skin: 7, bankinfo: 7, nickhist: 7, money2: 9, coins: 8 };

function rowsHtml(list, fn, empty) { return list.length ? list.map(fn).join('') : '<div class="empty">' + (empty || 'Пусто') + '</div>'; }
function ago(ms) { var s = Math.floor(ms / 1000); if (s < 60) return s + ' сек'; if (s < 3600) return Math.floor(s / 60) + ' мин'; return Math.floor(s / 3600) + ' ч ' + Math.floor(s % 3600 / 60) + ' м'; }
function renderExt() {
    var X = D.ext || {}, L = D.me.level;
    document.querySelectorAll('[data-min]').forEach(function (b) { b.style.display = (D.me.real || L) >= Number(b.dataset.min) ? '' : 'none'; });
    var reps = X.reports || [];
    var open = reps.filter(function (r) { return !r.done; });
    $('repCount').textContent = open.length; $('repOpen').textContent = open.length;
    $('repList').innerHTML = rowsHtml(reps, function (r) {
        return '<div class="tr"><b>#' + r.id + ' ' + esc(r.name) + '</b><span>' + esc(r.text) + '</span><span class="mut">' + ago(Date.now() - r.time) + ' назад</span>' +
            (r.done ? '<span class="mut">✓ ' + esc(r.by) + ': ' + esc(r.answer || '') + '</span>' : '<button class="btn primary" data-rep="' + r.id + '">Ответить</button>') + '</div>';
    }, 'Репортов нет');
    $('jailList').innerHTML = rowsHtml(X.jail || [], function (j) {
        return '<div class="tr"><b>' + esc(j.name) + '</b><span>' + ({ demorgan: 'Деморган', prison: 'Тюрьма' }[j.type] || 'КПЗ') + ' · ' + esc(j.reason) + '</span><span class="mut">осталось ' + ago(j.left) + ' · ' + esc(j.by) + '</span><button class="btn ok" data-rel="' + j.s + '">Выпустить</button></div>';
    }, 'Никого');
    if (!FSEL && X.factions) FSEL = Object.keys(X.factions)[0];
    if (X.factions) {
        $('fSel').innerHTML = Object.keys(X.factions).map(function (k) { return '<option value="' + k + '"' + (k === FSEL ? ' selected' : '') + '>' + esc(X.factions[k]) + (X.facOff && X.facOff[k] ? ' (закрыта)' : '') + '</option>'; }).join('');
        var cfgRow = function (kind) { return function (x) { return '<div class="tr"><b title="' + esc(x.m) + '">' + esc(x.m) + '</b><span class="mut">с ' + x.r + ' ранга</span><span>' + (x.on ? '✅ можно брать' : '⛔ нельзя') + '</span><button class="btn" data-cfg="' + kind + '|toggle|' + esc(x.m) + '">Вкл/выкл</button><button class="btn" data-cfg="' + kind + '|rank|' + esc(x.m) + '">Ранг</button><button class="btn danger" data-cfg="' + kind + '|del|' + esc(x.m) + '">✕</button></div>'; }; };
        $('flList').innerHTML = rowsHtml((X.fleet || {})[FSEL] || [], cfgRow('fleet'), 'Машины не настроены');
        $('fwList').innerHTML = rowsHtml((X.fweap || {})[FSEL] || [], cfgRow('fweap'), 'Оружие не настроено');
        $('oList').innerHTML = rowsHtml((X.ochs || []).filter(function (o) { return o.f === FSEL || o.f === 'all'; }), function (o) {
            return '<div class="tr"><b>' + esc(o.n) + ' #' + o.s + '</b><span>' + esc(o.reason) + '</span><span class="mut">' + (o.until ? 'до ' + fmtTime(o.until) : 'навсегда') + ' · ' + esc(o.by) + '</span><button class="btn ok" data-ochsdel="' + o.s + '|' + o.f + '">Убрать</button></div>';
        }, 'ОЧС пуст');
    }
    $('idleList').innerHTML = rowsHtml(X.idle || [], function (x) {
        return '<div class="tr"><b style="color:' + COLORS[x.lvl] + '">' + esc(x.name) + ' [' + x.id + ']</b><span>без ответов ' + ago(x.noAnswer) + '</span><span class="mut">AFK ' + ago(x.afk * 1000) + ' · ответов ' + x.answers + (x.off ? ' · выкл' : '') + '</span></div>';
    }, 'Нет админов');
    $('flyList').innerHTML = rowsHtml(X.fly || [], function (x) {
        return '<div class="tr"><b style="color:' + COLORS[x.lvl] + '">' + esc(x.name) + ' [' + x.id + ']</b><span class="mut">' + ago(Date.now() - x.since) + '</span><button class="btn" data-cmd="flywatch ' + x.id + '">Смотреть</button></div>';
    }, 'Никто не летает');
    var f = ($('bhSearch').value || '').toLowerCase();
    $('bhList').innerHTML = rowsHtml((X.banHist || []).filter(function (b) { return !f || [b.login, b.nick, b.static, b.ip, b.serial].join(' ').toLowerCase().indexOf(f) >= 0; }).slice(0, 120), function (b) {
        return '<div class="tr"><span class="mut">' + fmtTime(b.date) + '</span><b style="color:' + (b.t === 'ban' ? '#ff6b6b' : '#8fd14f') + '">' + (b.t === 'ban' ? 'БАН' : 'РАЗБАН') + ' ' + esc(b.login) + (b.static ? ' #' + b.static : '') + '</b><span>' + esc(b.reason) + (b.t === 'ban' ? ' · ' + dur(b.until ? Math.round((b.until - b.date) / 60000) : 0) : '') + '</span><span class="mut">' + esc(b.admin) + (b.ip ? ' · ' + esc(b.ip) : '') + '</span></div>';
    }, 'История пуста');
    var W = X.world || {};
    $('wTraffic').textContent = W.traffic ? '🚦 Светофоры работают — выключить' : '⚫ Светофоры выключены — включить';
    $('wZones').textContent = W.zonesOn ? '🟢 Зелёные зоны включены — выключить все' : '⚪ Зелёные зоны выключены — включить';
    $('wMarkers').textContent = 'Маркеров: ' + (W.markers || 0) + ' · объектов маппинга: ' + (W.mapping || 0);
    $('wZoneList').innerHTML = rowsHtml(W.zones || [], function (z, i) {
        return '<div class="tr"><b>' + esc(z.n) + '</b><span class="mut">радиус ' + z.r + ' м</span><button class="btn" data-zone="' + i + '">' + (z.on ? 'Выкл' : 'Вкл') + '</button><button class="btn danger" data-zonedel="' + i + '">✕</button></div>';
    }, 'Зон нет');
    $('lockList').innerHTML = Object.keys(D.features || {}).map(function (k) { return '<button class="chip' + (D.locks[k] ? '' : ' active') + '" data-lock="' + k + '">' + (D.locks[k] ? '⛔ ' : '✅ ') + esc(D.features[k]) + '</button>'; }).join('');
    $('facOffList').innerHTML = Object.keys(X.factions || {}).map(function (k) { return '<button class="chip' + (X.facOff[k] ? '' : ' active') + '" data-facoff="' + k + '">' + (X.facOff[k] ? '⛔ ' : '✅ ') + esc(X.factions[k]) + '</button>'; }).join('');
    $('jobOffList').innerHTML = Object.keys(X.jobs || {}).map(function (k) { return '<button class="chip' + (X.jobOff[k] ? '' : ' active') + '" data-joboff="' + k + '">' + (X.jobOff[k] ? '⛔ ' : '✅ ') + esc(X.jobs[k]) + '</button>'; }).join('');
    $('conUrl').textContent = X.consoleUrl ? 'Адрес: ' + X.consoleUrl : 'Доступно с ЗГА (7)';
    renderCmds();
}
function renderCmds() {
    var f = ($('cSearch').value || '').toLowerCase();
    var L = D.me.level;
    $('cList').innerHTML = CMDS.filter(function (c) { return !f || (c[1] + c[2]).toLowerCase().indexOf(f) >= 0; }).map(function (c) {
        return '<div class="tr" style="' + (c[0] > L ? 'opacity:.4' : '') + '"><span class="badge" style="color:' + COLORS[c[0]] + '">' + c[0] + '</span><b>' + esc(c[1]) + '</b><span>' + esc(c[2]) + '</span></div>';
    }).join('');
}
function mpSend(op, value, extra) {
    var o = { action: 'mp', op: op, target: $('mpTarget').value.trim(), radius: Number($('mpRadius').value) || 50, value: value };
    if (!o.target) return window.admToast('Укажи ID или all', false);
    for (var k in (extra || {})) o[k] = extra[k];
    act(o);
}

function renderBans() {
    var f = $('bSearch').value.trim().toLowerCase();
    var list = D.bans.filter(function (b) { return !f || String(b.login).toLowerCase().indexOf(f) >= 0; });
    $('bCount').textContent = D.bans.length;
    $('bList').innerHTML = list.map(function (b) {
        return '<div class="tr"><b>' + esc(b.login) + '</b><span>' + esc(b.reason) + '</span>' +
            '<span class="mut">' + (b.until ? 'до ' + fmtTime(b.until) : 'навсегда') + '</span>' +
            '<span class="mut">' + esc(b.admin) + '</span>' +
            '<button class="btn ok" data-unban="' + esc(b.login) + '"' + (canDo('unban') ? '' : ' disabled') + '>Разбанить</button></div>';
    }).join('') || '<div class="empty">Активных банов нет</div>';
}

function renderLogs() {
    $('lList').innerHTML = D.logs.map(function (l) {
        return '<div class="tr log"><span class="mut">' + new Date(l.time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) + '</span>' +
            '<b>' + esc(l.admin) + '</b><span class="badge">' + esc(l.action) + '</span><span>' + esc(l.target) + '</span><span class="mut">' + esc(l.details) + '</span></div>';
    }).join('') || '<div class="empty">Пока пусто</div>';
}

function renderDlc() {
    var allowed = canDo('vehdlc');
    $('dlcList').innerHTML = D.dlc.map(function (d) {
        return '<div class="dlc-item"><div><b>' + esc(d.name) + '</b><span>' + esc(d.model) + '</span></div>' +
            '<button class="btn primary" style="margin:0;width:auto" data-dspawn="' + esc(d.model) + '"' + (allowed ? '' : ' disabled') + '>Создать</button>' +
            '<button class="btn danger" data-ddel="' + esc(d.model) + '"' + (canDo('adddlc') ? '' : ' disabled') + '>✕</button></div>';
    }).join('') || '<div class="empty" style="padding:20px">Список пуст</div>';
}

function renderRanks() {
    var keep = $('saLvl').value;
    $('saLvl').innerHTML = D.ranks.map(function (r, i) {
        var ok = D.me.level === 9 || (D.me.level === 8 && i <= 7);
        return '<option value="' + i + '">' + i + ' — ' + esc(r) + (ok ? '' : ' (нет прав)') + '</option>';
    }).join('');
    if (keep) $('saLvl').value = keep;
    $('saBtn').disabled = D.me.level < 8;
    $('saBtn').title = D.me.level < 8 ? 'Назначать уровни может ГА (8) и МГА (9). Твой уровень: ' + D.me.level : '';
    $('rankList').innerHTML = D.ranks.map(function (r, i) {
        if (i === 0) return '';
        return '<div class="rank' + (i === D.me.level ? ' me' : '') + '" style="--c:' + (COLORS[i] || '#fff') + '"><div class="n">Уровень ' + i + (i === D.me.level ? ' · это ты' : '') + '</div><b>' + esc(r) + '</b><ul>' +
            (RANK_INFO[i] || []).map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>';
    }).join('');
}

function renderServer() {
    $('weatherList').innerHTML = WEATHER.map(function (w) {
        return '<button class="chip' + (D.weather === w[0] ? ' active' : '') + '" data-weather="' + w[0] + '">' + w[1] + '</button>';
    }).join('');
    var sn = D.snow || {};
    $('snowList').innerHTML = [['ground', '❄ Снег на земле'], ['fall', '🌨 Снегопад']].map(function (x) {
        return '<button class="chip' + (sn[x[0]] ? ' active' : '') + '" data-snow="' + x[0] + '">' + x[1] + (sn[x[0]] ? ' · вкл' : ' · выкл') + '</button>';
    }).join('');
}

function spawnVeh(model, dlc) {
    var target = $('vTarget').value.trim();
    var own = $('vOwn').checked;
    trig('cef:adm:veh', JSON.stringify({ model: model, c1: Number($('vC1').value) || 0, c2: Number($('vC2').value) || 0, dlc: !!dlc || own, target: target, own: own }));
}

document.addEventListener('click', function (e) {
    var t = e.target.closest('button, .pl, .chip');
    if (!t) return;

    if (t.classList.contains('m')) {
        document.querySelectorAll('.m').forEach(function (b) { b.classList.toggle('active', b === t); });
        document.querySelectorAll('.tab').forEach(function (s) { s.classList.toggle('active', s.dataset.tab === t.dataset.tab); });
        return;
    }
    if (t.classList.contains('pl')) { selected = Number(t.dataset.id); renderPlayers(); return; }
    if (t.classList.contains('chip') && t.parentElement.dataset.chips) {
        t.parentElement.querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('active', c === t); });
        return;
    }
    if (t.dataset.pa) return playerAction(t.dataset.pa);
    if (t.dataset.quick === 'fly') return trig('cef:adm:fly');
    if (t.dataset.quick === 'gm') return act({ action: 'cmd', text: 'gm' });
    if (t.dataset.quick === 'az') return act({ action: 'cmd', text: 'az' });
    if (t.dataset.quick === 'aoff') return act({ action: 'aoff' });
    if (t.dataset.cmd) return act({ action: 'cmd', text: t.dataset.cmd });
    if (t.dataset.rep) { var rid = t.dataset.rep; return modal('Ответ на репорт #' + rid, '', '<label>Ответ</label><textarea id="mAns" maxlength="250"></textarea>', 'Отправить', function () { var v = $('mAns').value.trim(); if (!v) return false; act({ action: 'ans', rid: Number(rid), text: v }); }); }
    if (t.dataset.rel) return act({ action: 'release', s: Number(t.dataset.rel) });
    if (t.dataset.mp) {
        var m = t.dataset.mp;
        if (m === 'weapon') return mpSend('weapon', $('mpW').value.trim(), { ammo: Number($('mpAmmo').value) });
        if (m === 'car') return mpSend('car', $('mpCar').value.trim());
        if (m === 'hp') return mpSend('hp', Number($('mpHp').value));
        if (m === 'armour') return mpSend('armour', Number($('mpAr').value));
        if (m === 'skin') return mpSend('skin', $('mpSkin').value.trim());
        if (m === 'dim') return mpSend('dim', Number($('mpDim').value));
        if (m === 'freeze1' || m === 'freeze0') return mpSend('freeze', m === 'freeze1');
        return mpSend(m, '');
    }
    if (t.dataset.mpw) { $('mpW').value = t.dataset.mpw; return; }
    if (t.dataset.mpc) { $('mpCar').value = t.dataset.mpc; return; }
    if (t.dataset.cfg) {
        var cp = t.dataset.cfg.split('|');
        if (cp[1] === 'rank') return modal('С какого ранга', cp[2], '<input id="mR" type="number" value="1">', 'Сохранить', function () { act({ action: cp[0], f: FSEL, op: 'rank', m: cp[2], r: Number($('mR').value) }); });
        return act({ action: cp[0], f: FSEL, op: cp[1], m: cp[2] });
    }
    if (t.dataset.ochsdel) { var op2 = t.dataset.ochsdel.split('|'); return act({ action: 'ochs', op: 'del', s: Number(op2[0]), f: op2[1] }); }
    if (t.dataset.zone !== undefined) return act({ action: 'world', op: 'zone', i: Number(t.dataset.zone) });
    if (t.dataset.zonedel !== undefined) return act({ action: 'world', op: 'zonedel', i: Number(t.dataset.zonedel) });
    if (t.dataset.lock) return act({ action: 'lock', f: t.dataset.lock });
    if (t.dataset.facoff) { var fk = t.dataset.facoff; return modal('Фракция', D.ext.factions[fk], '<p class="hint">' + (D.ext.facOff[fk] ? 'Открыть фракцию снова?' : 'Закрыть фракцию и уволить всех сотрудников?') + '</p>', 'Подтвердить', function () { act({ action: 'factionoff', f: fk }); }); }
    if (t.dataset.joboff) return act({ action: 'joboff', j: t.dataset.joboff });
    if (t.dataset.quick === 'refresh') return trig('cef:adm:refresh');
    if (t.dataset.preset) { $('vModel').value = t.dataset.preset; return; }
    if (t.dataset.dspawn) return spawnVeh(t.dataset.dspawn, true);
    if (t.dataset.ddel) return act({ action: 'deldlc', model: t.dataset.ddel });
    if (t.dataset.unban) {
        var lg = t.dataset.unban;
        return modal('Разбан', lg, '<p class="hint">Игрок снова сможет зайти на сервер.</p>', 'Разбанить', function () { act({ action: 'unban', login: lg }); });
    }
    if (t.dataset.weather) return act({ action: 'weather', weather: t.dataset.weather });
    if (t.dataset.snow) { var on = !(D.snow && D.snow[t.dataset.snow]); D.snow = D.snow || {}; D.snow[t.dataset.snow] = on; renderServer(); return act({ action: 'snow', k: t.dataset.snow, on: on }); }
    if (t.dataset.act) return act({ action: t.dataset.act });
});

$('vPresets').innerHTML = PRESETS.map(function (m) { return '<button class="chip" data-preset="' + m + '">' + m + '</button>'; }).join('');
$('vSpawn').onclick = function () {
    var m = $('vModel').value.trim().toLowerCase();
    if (!m) return window.admToast('Введи модель', false);
    spawnVeh(m, false);
};
$('dAdd').onclick = function () {
    var m = $('dModel').value.trim().toLowerCase();
    if (!m) return window.admToast('Введи модель', false);
    act({ action: 'adddlc', model: m, name: $('dName').value.trim() || m });
    $('dModel').value = '';
    $('dName').value = '';
};
$('unbanBtn').onclick = function () {
    var lg = $('obLogin').value.trim();
    if (!lg) return window.admToast('Введи логин', false);
    act({ action: 'unban', login: lg });
};
$('hour').oninput = function () { $('hourVal').textContent = ('0' + this.value).slice(-2) + ':00'; };
$('setTime').onclick = function () { act({ action: 'time', hour: Number($('hour').value) }); };
$('annBtn').onclick = function () {
    var t = $('annText').value.trim();
    if (!t) return window.admToast('Пустой текст', false);
    act({ action: 'announce', text: t });
    $('annText').value = '';
};
$('saBtn').onclick = function () {
    var id = $('saId').value.trim();
    if (!id) return window.admToast('Укажи ID или логин', false);
    act({ action: 'setadmin', id: id, level: Number($('saLvl').value) });
};
$('pSearch').oninput = function () { if (D) renderPlayers(); };
$('bSearch').oninput = function () { if (D) renderBans(); };
$('mCancel').onclick = function () { $('modal').classList.remove('show'); };

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        if ($('modal').classList.contains('show')) $('modal').classList.remove('show');
        else trig('cef:adm:close');
    }
});

setInterval(function () {
    if (D && document.visibilityState !== 'hidden') trig('cef:adm:refresh');
}, 5000);

var ZK = 'atm';
document.querySelectorAll('[data-zk]').forEach(function (b) {
    b.onclick = function () {
        ZK = b.dataset.zk;
        document.querySelectorAll('[data-zk]').forEach(function (x) { x.classList.toggle('active', x === b); });
        $('zNewT').textContent = { fuel: 'Новая АЗС', atm: 'Новый банкомат', shop: 'Новый магазин 24/7 (встаньте у прилавка)', gun: 'Новый оружейный (встаньте у прилавка)' }[ZK] || '';
        $('zPrice').value = { fuel: 250000, atm: 150000, shop: 120000, gun: 400000 }[ZK] || 0;
        renderBiz();
    };
});
function renderBiz() {
    var isGov = ZK === 'gov';
    $('zGov').style.display = isGov ? '' : 'none';
    $('zNew').style.display = isGov ? 'none' : '';
    if (isGov) {
        $('govBal').textContent = '$' + String((D.gov && D.gov.balance) || 0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        $('govTax').textContent = ((D.gov && D.gov.tax) || 0) + '%';
        $('zCount').textContent = '';
        $('zList').innerHTML = '';
        return;
    }
    var list = (ZK === 'fuel' ? D.stations : ZK === 'atm' ? D.atms : (D.shops || []).filter(function (s) { return s.kind === ZK; })) || [];
    var f = ($('zSearch').value || '').trim().toLowerCase();
    $('zCount').textContent = list.length;
    var can5 = D.me.level >= 5;
    $('zAdd').disabled = !can5;
    $('zList').innerHTML = list.filter(function (a) { return !f || (a.name + ' ' + (a.ownerName || '')).toLowerCase().indexOf(f) >= 0; }).map(function (a) {
        return '<div class="tr biz"><b>#' + a.id + ' ' + esc(a.name) + '</b>' +
            '<span>' + (a.ownerName ? '👤 ' + esc(a.ownerName) : '<span class="mut">гос. (продаётся)</span>') + '</span>' +
            '<span class="mut">цена $' + a.price + ' · ' + (ZK === 'fuel' ? 'запас ' + a.stock + '/' + a.max + ' л · ' + a.markup + '%' : ZK === 'atm' ? a.fee + '%' : 'склад ' + a.stock + '/' + a.max + ' шт. · ' + a.markup + '%') + ' · касса $' + a.balance + ' · всего $' + a.earned + '</span>' +
            '<span class="biz-acts">' +
            '<button class="btn" data-ztp="' + a.id + '">ТП</button>' +
            '<button class="btn" data-zprice="' + a.id + '"' + (can5 ? '' : ' disabled') + '>Цена</button>' +
            '<button class="btn" data-zown="' + a.id + '"' + (can5 ? '' : ' disabled') + '>Владелец</button>' +
            '<button class="btn" data-zfree="' + a.id + '"' + (can5 && a.ownerName ? '' : ' disabled') + '>Изъять</button>' +
            (ZK !== 'atm' ? '<button class="btn" data-zstock="' + a.id + '"' + (can5 ? '' : ' disabled') + '>Запас</button><button class="btn" data-zpos="' + a.id + '"' + (can5 ? '' : ' disabled') + '>Точка сюда</button>' : '') +
            '<button class="btn danger" data-zdel=""' + a.id + '"' + (can5 ? '' : ' disabled') + '>Удалить</button>' +
            '</span></div>';
    }).join('') || '<div class="empty">Банкоматов нет</div>';
}
$('zSearch').oninput = renderBiz;
$('zAdd').onclick = function () { act({ action: 'atm', kind: ZK, op: 'add', name: $('zName').value, price: Number($('zPrice').value) || 150000 }); };
$('zList').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.dataset.ztp) act({ action: 'atm', kind: ZK, op: 'tp', atm: Number(b.dataset.ztp) });
    if (b.dataset.zdel) act({ action: 'atm', kind: ZK, op: 'del', atm: Number(b.dataset.zdel) });
    if (b.dataset.zfree) act({ action: 'atm', kind: ZK, op: 'owner', atm: Number(b.dataset.zfree), pid: -1 });
    if (b.dataset.zstock) zAsk(ZK === 'fuel' ? 'Запас топлива на АЗС, литров' : 'Товара на складе, шт.', function (v) { act({ action: 'atm', kind: ZK, op: 'stock', atm: Number(b.dataset.zstock), value: Number(v) }); });
    if (b.dataset.zpos) act({ action: 'atm', kind: ZK, op: 'bizpos', atm: Number(b.dataset.zpos) });
    if (b.dataset.zprice) zAsk('Новая цена банкомата, $', function (v) { act({ action: 'atm', kind: ZK, op: 'price', atm: Number(b.dataset.zprice), value: Number(v) }); });
    if (b.dataset.zown) zAsk('ID игрока онлайн — новый владелец', function (v) { act({ action: 'atm', kind: ZK, op: 'owner', atm: Number(b.dataset.zown), pid: Number(v) }); });
});

function zAsk(title, cb) {
    var old = document.querySelector('.z-ask');
    if (old) old.remove();
    var m = document.createElement('div');
    m.className = 'z-ask';
    m.innerHTML = '<div class="z-box"><b>' + esc(title) + '</b><input id="zAskIn" inputmode="numeric"><div><button class="btn" id="zAskC">Отмена</button><button class="btn ok" id="zAskO">ОК</button></div></div>';
    document.body.appendChild(m);
    var inp = $('zAskIn');
    inp.focus();
    var go = function () { var v = inp.value.trim(); m.remove(); if (v !== '') cb(v); };
    $('zAskO').onclick = go;
    $('zAskC').onclick = function () { m.remove(); };
    inp.onkeydown = function (e) { if (e.key === 'Enter') go(); if (e.key === 'Escape') { e.stopPropagation(); m.remove(); } };
}

$('govTaxBtn').onclick = function () { var v = $('govTaxIn').value; if (v !== '') act({ action: 'gov', op: 'tax', value: Number(v) }); };
$('govWdBtn').onclick = function () { var v = Number($('govWdIn').value); if (v > 0) act({ action: 'gov', op: 'withdraw', value: v }); };

$('mpWeapons').innerHTML = MP_WEAPONS.map(function (w) { return '<button class="chip" data-mpw="' + w[0] + '">' + w[1] + '</button>'; }).join('');
$('mpCars').innerHTML = MP_CARS.map(function (c) { return '<button class="chip" data-mpc="' + c + '">' + c + '</button>'; }).join('');
$('fSel').onchange = function () { FSEL = this.value; FM = null; renderExt(); facLoad(); };
var FM = null, FM_AT = 0;
function facLoad() { if (FSEL) { FM_AT = Date.now(); act({ action: 'fac', f: FSEL, op: 'load' }); } }
window.admFac = function (json) {
    FM = typeof json === 'string' ? JSON.parse(json) : json;
    if (FM.f !== FSEL) return;
    $('fmCount').textContent = FM.members.length;

    $('fmList').innerHTML = rowsHtml(FM.members, function (m) {
        return '<div class="tr"><b>' + (m.on ? '🟢 ' : '⚫ ') + esc(m.n) + ' <span class="mut">#' + m.id + (m.pid >= 0 ? ' · ID ' + m.pid : '') + '</span></b>' +
            '<span>' + (m.lead ? '<b style="color:#ffcc66">Лидер</b>' : m.dep ? '<b style="color:#8fb2ff">Заместитель</b>' : '') + '</span>' +
            '<span class="mut">' + m.r + ' · ' + esc(FM.ranks[Math.max(0, Math.min(FM.ranks.length, m.r) - 1)] || '') + '</span>' +
            (m.lead ? '<button class="btn danger" data-fml="' + m.id + '" data-n="' + esc(m.n) + '">Снять лидера</button>' : '<button class="btn primary" data-fms="' + m.id + '" data-n="' + esc(m.n) + '">Сделать лидером</button>') + '</div>';
    }, 'В фракции никого нет');
    var P = FM.points;
    $('fmInfo').innerHTML = FM.gov ? ('Склад: ' + FM.stock.map(function (s) { return esc(s.n) + ' — <b>' + s.c + '</b>'; }).join(' · ') + '<br>' +
        (P ? 'Точки: склад ' + (P.armory ? '✅' : '❌') + ' · раздевалка ' + (P.locker ? '✅' : '❌') + ' · гараж ' + (P.garage ? '✅' : '❌') + ' · парковок: ' + P.spawns + ' — меняются командой /govpoint' : 'Точки не заданы — /govpoint')) : 'Для EMS склад и раздевалка работают в модуле медиков';
    $('fmList').querySelectorAll('[data-fms]').forEach(function (b) { b.onclick = function () { modal('Назначить лидером', b.dataset.n, '<p class="hint">Игрок станет лидером фракции с высшим рангом.</p>', 'Назначить', function () { act({ action: 'leader', s: Number(b.dataset.fms), f: FSEL }); setTimeout(facLoad, 700); }); }; });
    $('fmList').querySelectorAll('[data-fml]').forEach(function (b) { b.onclick = function () { modal('Снять лидера', b.dataset.n, '<p class="hint">Игрок будет снят с поста лидера и исключён из фракции.</p>', 'Снять', function () { act({ action: 'leader', s: Number(b.dataset.fml), f: null }); setTimeout(facLoad, 700); }); }; });
};
$('fmLoad').onclick = facLoad;
$('fmAdd').onclick = function () {
    var v = $('fmId').value.trim(); if (!v) return;
    act(v[0] === '#' ? { action: 'leader', s: Number(v.slice(1)), f: FSEL } : { action: 'leader', id: v, f: FSEL });
    $('fmId').value = '';
    setTimeout(facLoad, 700);
};
document.querySelector('[data-tab="factions"].m').addEventListener('click', function () { setTimeout(facLoad, 50); });
if (false) $('fSetLeader').onclick = function () { var v = $('fLeader').value.trim(); if (!v) return; setTimeout(facLoad, 600); act(v[0] === '#' ? { action: 'leader', s: Number(v.slice(1)), f: FSEL } : { action: 'leader', id: v, f: FSEL }); };
if (false) $('fUnLeader').onclick = function () { var v = $('fLeader').value.trim(); if (!v) return; act(v[0] === '#' ? { action: 'leader', s: Number(v.slice(1)), f: null } : { action: 'leader', id: v, f: null }); };
$('oAdd').onclick = function () { act({ action: 'ochs', op: 'add', s: Number($('oStatic').value), minutes: Number($('oMin').value) || 0, f: FSEL, reason: $('oReason').value.trim() }); };
$('flAdd').onclick = function () { act({ action: 'fleet', f: FSEL, op: 'add', m: $('flM').value.trim(), r: Number($('flR').value) }); $('flM').value = ''; };
$('fwAdd').onclick = function () { act({ action: 'fweap', f: FSEL, op: 'add', m: $('fwM').value.trim(), r: Number($('fwR').value) }); $('fwM').value = ''; };
$('wTraffic').onclick = function () { act({ action: 'world', op: 'traffic' }); };
$('wZones').onclick = function () { act({ action: 'world', op: 'zones' }); };
$('conToken').onclick = function () { act({ action: 'token' }); };
$('bhSearch').oninput = function () { if (D) renderExt(); };
$('cSearch').oninput = function () { if (D) renderCmds(); };
$('cRun').onclick = function () { var v = $('cLine').value.trim(); if (!v) return; act({ action: 'cmd', text: v }); $('cLine').value = ''; };

setInterval(function () {
    var b = document.getElementById('qGm');
    if (!b || !D || !D.me) return;
    b.textContent = D.me.gm ? 'GM: вкл' : 'GM: выкл';
    b.classList.toggle('on', !!D.me.gm);
    b.disabled = D.me.level < 3;
}, 300);

function mdDate(t) { if (!t) return '—'; var d = new Date(t); return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
var mdCfgSet = false;
function renderMedia() {
    var M = D.media, box = $('mdList');
    if (!box) return;
    if (!M) { box.innerHTML = '<p class="hint">Доступно с 7 уровня</p>'; return; }
    if (!mdCfgSet || document.activeElement.closest && !document.activeElement.closest('.md-cfg')) {
        $('mcMoney').value = M.cfg.bonusMoney; $('mcCoins').value = M.cfg.bonusCoins; $('mcRef').value = M.cfg.refCoins; $('mcLvl').value = M.cfg.maxLvl; mdCfgSet = true;
    }
    box.innerHTML = M.list.length ? M.list.map(function (m) {
        return '<div class="tr md-tr"><b>' + (m.on ? '🟢 ' : '⚪ ') + esc(m.name) + ' <span class="mut">#' + m.id + '</span></b>' +
            '<span>' + (m.fly ? (m.flying ? '<span style="color:#7fd4ff">✈ сейчас летает</span>' : '<span class="mut">✈ полёт доступен</span>') : '<span style="color:#ff9aac">✈ полёт забран</span><br><span class="mut">' + esc(m.flyReason) + '</span>') + '<br>' + (m.code ? 'Код <b>' + esc(m.code) + '</b> · ' + m.uses + ' акт.' : '<span class="mut">без промокода</span>') + '</span>' +
            '<span>' + (m.paused ? '<span style="color:#ff9aac">выплаты на паузе</span>' : 'след. выплата ' + mdDate(m.nextPay)) + '<br><span class="mut">выплачено ' + m.paid + ' RC</span></span>' +
            '<span class="md-sal"><input class="search" type="number" value="' + m.salary + '" data-mdsal="' + m.id + '"><span class="mut">RC/нед</span></span>' +
            '<span class="md-b">' + (m.flying ? '<button class="btn" data-mdfstop="' + m.id + '" title="Остановить полёт">⏹✈</button>' : '') + '<button class="btn' + (m.fly ? ' danger' : ' ok') + '" data-mdfly="' + m.id + '" title="' + (m.fly ? 'Забрать полёт' : 'Вернуть полёт') + '">' + (m.fly ? '✈✕' : '✈✓') + '</button><button class="btn" data-mdpay="' + m.id + '">Выплатить</button><button class="btn" data-mdpause="' + m.id + '">' + (m.paused ? '▶' : '⏸') + '</button><button class="btn danger" data-mddel="' + m.id + '">✕</button></span></div>';
    }).join('') : '<p class="hint">Медиа-партнёров пока нет</p>';
    box.querySelectorAll('[data-mdsal]').forEach(function (i) { i.onchange = function () { act({ action: 'media', op: 'salary', id: Number(i.dataset.mdsal), value: Number(i.value) }); }; });
    box.querySelectorAll('[data-mdfstop]').forEach(function (b) { b.onclick = function () { act({ action: 'media', op: 'flystop', id: Number(b.dataset.mdfstop) }); }; });
    box.querySelectorAll('[data-mdfly]').forEach(function (b) {
        b.onclick = function () {
            var m = M.list.find(function (x) { return x.id === Number(b.dataset.mdfly); });
            if (m && m.fly) {
                var r = $('mdFlyReason').value.trim();
                if (!r) { $('mdFlyReason').focus(); $('mdFlyReason').style.borderColor = '#e63950'; return; }
                $('mdFlyReason').value = ''; $('mdFlyReason').style.borderColor = '';
                act({ action: 'media', op: 'fly', id: m.id, reason: r });
            } else act({ action: 'media', op: 'fly', id: Number(b.dataset.mdfly) });
        };
    });
    box.querySelectorAll('[data-mdpay]').forEach(function (b) { b.onclick = function () { act({ action: 'media', op: 'paynow', id: Number(b.dataset.mdpay) }); }; });
    box.querySelectorAll('[data-mdpause]').forEach(function (b) { b.onclick = function () { act({ action: 'media', op: 'pause', id: Number(b.dataset.mdpause) }); }; });
    box.querySelectorAll('[data-mddel]').forEach(function (b) { b.onclick = function () { if (!b.dataset.ok) { b.dataset.ok = 1; b.textContent = 'Точно?'; return; } act({ action: 'media', op: 'del', id: Number(b.dataset.mddel) }); }; });
}
$('mdAdd').onclick = function () { var w = $('mdWho').value.trim(); if (!w) return; act({ action: 'media', op: 'add', who: w, salary: Number($('mdSal').value) || 0 }); $('mdWho').value = ''; };
$('mcSave').onclick = function () { act({ action: 'mediacfg', bonusMoney: $('mcMoney').value, bonusCoins: $('mcCoins').value, refCoins: $('mcRef').value, maxLvl: $('mcLvl').value }); };

function renderPromos() {
    var box = $('prList');
    if (!box) return;
    var L = D.promos;
    if (!L) { box.innerHTML = '<p class="hint">Доступно только с 9 уровня</p>'; return; }
    if (box.contains(document.activeElement)) return;
    box.innerHTML = L.length ? L.map(function (c) {
        var left = c.max ? Math.max(0, c.max - c.uses) : '∞';
        var st = !c.on ? '<span style="color:#ff9aac">выключен</span>' : (c.until && Date.now() > c.until) ? '<span style="color:#ff9aac">истёк</span>' : (c.max && c.uses >= c.max) ? '<span style="color:#ffcc66">закончился</span>' : '<span style="color:#7fe0a0">активен</span>';
        return '<div class="tr pr-tr" data-pr="' + esc(c.code) + '">' +
            '<b>' + esc(c.code) + '<br><span class="mut">' + st + ' · ' + esc(c.by) + '</span></b>' +
            '<label>$<input class="search" type="number" min="0" data-f="money" value="' + c.money + '"></label>' +
            '<label>RC<input class="search" type="number" min="0" data-f="coins" value="' + c.coins + '"></label>' +
            '<label>Лимит<input class="search" type="number" min="0" data-f="max" value="' + c.max + '"></label>' +
            '<span>' + c.uses + ' / ' + (c.max || '∞') + '<br><span class="mut">осталось ' + left + (c.until ? ' · до ' + mdDate(c.until) : '') + '</span></span>' +
            '<span class="md-b"><button class="btn ok" data-pa="edit">Сохранить</button><button class="btn" data-pa="toggle">' + (c.on ? '⏸' : '▶') + '</button><button class="btn" data-pa="reset" title="Обнулить активации">↺</button><button class="btn danger" data-pa="del">✕</button></span></div>';
    }).join('') : '<p class="hint">Промокодов пока нет</p>';
    box.querySelectorAll('[data-pa]').forEach(function (b) {
        b.onclick = function () {
            var row = b.closest('[data-pr]'), code = row.dataset.pr, op = b.dataset.pa;
            if ((op === 'del' || op === 'reset') && !b.dataset.ok) { b.dataset.ok = 1; b.textContent = 'Точно?'; return; }
            var o = { action: 'promo', op: op, code: code };
            if (op === 'edit') row.querySelectorAll('[data-f]').forEach(function (i) { o[i.dataset.f] = Number(i.value) || 0; });
            act(o);
        };
    });
}
$('prAdd').onclick = function () {
    var c = $('prCode').value.trim().toUpperCase();
    if (!c) return;
    act({ action: 'promo', op: 'create', code: c, money: Number($('prMoney').value) || 0, coins: Number($('prCoins').value) || 0, max: Number($('prMax').value) || 0, days: Number($('prDays').value) || 0 });
    ['prCode', 'prMoney', 'prCoins', 'prMax', 'prDays'].forEach(function (k) { $(k).value = ''; });
};

var DLSEL = null;
function renderDealers() {
    var body = $('dlBody'), sel = $('dlSel');
    if (!body) return;
    var L = D.dealers;
    if (!L) { body.innerHTML = '<p class="hint">Доступно с 8 уровня (ГА)</p>'; sel.innerHTML = ''; return; }
    if (body.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return;
    if (!L.some(function (s) { return s.id === DLSEL; })) DLSEL = L.length ? L[0].id : null;
    sel.innerHTML = L.map(function (s) { var n = s.cars.reduce(function (a, c) { return a + c.stock; }, 0); return '<option value="' + s.id + '"' + (s.id === DLSEL ? ' selected' : '') + '>' + esc(s.n) + (s.on ? '' : ' (закрыт)') + ' · ' + s.cars.length + ' мод. / ' + n + ' шт.</option>'; }).join('');
    var s = L.find(function (x) { return x.id === DLSEL; });
    if (!s) { body.innerHTML = '<p class="hint">Салонов пока нет — создайте первый</p>'; return; }
    body.innerHTML =
        '<div class="card"><h3>' + esc(s.n) + ' <span class="mut" style="font-weight:400">' + (s.on ? '<span style="color:#7fe0a0">открыт</span>' : '<span style="color:#ff9aac">закрыт</span>') + ' · вход ' + s.pos.join(', ') + ' · выдача ' + s.spawn.join(', ') + '</span></h3>' +
        '<div class="dl-form2"><input class="search" id="dlName" value="' + esc(s.n) + '" maxlength="40"><button class="btn" data-dl="rename">Переименовать</button></div>' +
        '<div class="dl-acts"><button class="btn" data-dl="tp">📍 Телепорт</button><button class="btn" data-dl="here">🚪 Вход сюда</button><button class="btn" data-dl="spawn">🅿 Место выдачи сюда</button><button class="btn" data-dl="toggle">' + (s.on ? '⏸ Закрыть салон' : '▶ Открыть салон') + '</button><button class="btn danger" data-dl="del">✕ Удалить салон</button></div>' +
        '<p class="hint">Место выдачи: встаньте или сядьте в машину там, где должны появляться купленные авто, и нажмите кнопку — сохранится и направление.</p></div>' +
        '<div class="card"><h3>Добавить машину</h3><div class="dl-form">' +
        '<label>Модель<input class="search" id="dlM" placeholder="sultan"></label>' +
        '<label>Название в салоне<input class="search" id="dlN" placeholder="Karin Sultan"></label>' +
        '<label>Цена, $<input class="search" id="dlP" type="number" min="1" placeholder="45000"></label>' +
        '<label>Наличие, шт.<input class="search" id="dlS" type="number" min="0" placeholder="5"></label>' +
        '<button class="btn ok" id="dlAdd">Добавить</button></div>' +
        '<p class="hint">Модель — игровое имя машины, как в /veh. Подходят и DLC-машины.</p></div>' +
        '<div class="card"><h3>Машины в салоне (' + s.cars.length + ')</h3><div class="table">' +
        (s.cars.length ? s.cars.map(function (c, i) {
            return '<div class="tr dl-tr' + (c.stock <= 0 ? ' dl-zero' : '') + '" data-ci="' + i + '"><b>' + esc(c.m) + '<br><span class="mut">' + (c.stock > 0 ? 'в наличии' : '<span style="color:#ff9aac">нет в наличии</span>') + '</span></b>' +
                '<input class="search" data-f="n" value="' + esc(c.n) + '" maxlength="40">' +
                '<input class="search" data-f="price" type="number" min="1" value="' + c.price + '">' +
                '<span class="dl-st"><button class="btn" data-ca="dec">−</button><input class="search" data-f="stock" type="number" min="0" value="' + c.stock + '"><button class="btn" data-ca="inc">+</button><button class="btn" data-ca="inc5" title="Поставка +5">+5</button></span>' +
                '<span class="dl-b"><button class="btn ok" data-ca="save">Сохранить</button><button class="btn" data-ca="up">↑</button><button class="btn" data-ca="down">↓</button><button class="btn danger" data-ca="del">✕</button></span></div>';
        }).join('') : '<div class="empty">Пока пусто — добавьте машины выше</div>') + '</div></div>';
    body.querySelectorAll('[data-dl]').forEach(function (b) {
        b.onclick = function () {
            var op = b.dataset.dl;
            if (op === 'del' && !b.dataset.ok) { b.dataset.ok = 1; b.textContent = 'Точно удалить?'; return; }
            var o = { action: 'dealer', op: op, sid: s.id };
            if (op === 'rename') o.n = $('dlName').value;
            act(o);
        };
    });
    $('dlAdd').onclick = function () {
        var m = $('dlM').value.trim();
        if (!m) return;
        act({ action: 'dealer', op: 'caradd', sid: s.id, m: m, n: $('dlN').value.trim(), price: Number($('dlP').value) || 1, stock: Number($('dlS').value) || 0 });
    };
    body.querySelectorAll('[data-ca]').forEach(function (b) {
        b.onclick = function () {
            var row = b.closest('[data-ci]'), i = Number(row.dataset.ci), op = b.dataset.ca;
            if (op === 'del' && !b.dataset.ok) { b.dataset.ok = 1; b.textContent = 'Точно?'; return; }
            if (op === 'dec' || op === 'inc' || op === 'inc5') return act({ action: 'dealer', op: 'stock', sid: s.id, i: i, v: op === 'dec' ? -1 : op === 'inc' ? 1 : 5 });
            if (op === 'save') return act({ action: 'dealer', op: 'caredit', sid: s.id, i: i, n: row.querySelector('[data-f=n]').value, price: Number(row.querySelector('[data-f=price]').value) || 1, stock: Number(row.querySelector('[data-f=stock]').value) || 0 });
            act({ action: 'dealer', op: op === 'del' ? 'cardel' : op, sid: s.id, i: i });
        };
    });
}
$('dlSel').onchange = function () { DLSEL = Number(this.value); renderDealers(); };
$('dlCreate').onclick = function () { var n = $('dlNewName').value.trim(); if (!n) return; act({ action: 'dealer', op: 'create', n: n }); $('dlNewName').value = ''; };
