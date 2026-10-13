var D = null;
var selected = null;
var COLORS = ['#ffffff', '#7fd4ff', '#8fd14f', '#4fd1a5', '#ffcc66', '#ff9f43', '#ff6b6b', '#c13dff'];
var RANK_INFO = [
    ['Обычный игрок'],
    ['Админ-чат /a', 'Мут, ответ /pm', 'Телепорт /goto', 'Панель F4'],
    ['Кик, варн, заморозка', 'Телепорт и /bring', 'Лечение, /revive', 'Полёт, GM, невидимость'],
    ['Бан до 7 дней', 'Разбан', 'Обычные машины /veh', 'Ремонт и удаление машин'],
    ['Бан до 30 дней, офлайн-бан', 'DLC-машины /vehdlc', 'Погода, время', 'Объявления'],
    ['Вечный бан', 'Выдача денег', 'Машина в собственность', 'Изменение HP'],
    ['Назначение админов', 'ниже своего уровня', 'Всё из уровней 1-5'],
    ['Полный доступ', 'Назначает любой уровень', 'Действует на всех']
];
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
    renderPlayers();
    renderBans();
    renderLogs();
    renderDlc();
    renderRanks();
    renderServer();
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
    var ok = canDo(action);
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
        '<div class="act-group"><div class="g">Экономика</div><div class="act-btns" style="grid-template-columns:1fr 1fr">' +
        btn('Выдать деньги', 'givemoney') + btn('Выдать машину', 'givecar') + '</div></div>';
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
    } else {
        act({ action: a, id: p.id });
    }
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
    $('rankList').innerHTML = D.ranks.map(function (r, i) {
        if (i === 0) return '';
        return '<div class="rank' + (i === D.me.level ? ' me' : '') + '" style="--c:' + COLORS[i] + '"><div class="n">Уровень ' + i + (i === D.me.level ? ' · это ты' : '') + '</div><b>' + esc(r) + '</b><ul>' +
            RANK_INFO[i].map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>';
    }).join('');
    $('saLvl').innerHTML = D.ranks.map(function (r, i) {
        var ok = D.me.level === 7 || i < D.me.level;
        return '<option value="' + i + '"' + (ok ? '' : ' disabled') + '>' + i + ' — ' + esc(r) + '</option>';
    }).join('');
}

function renderServer() {
    $('weatherList').innerHTML = WEATHER.map(function (w) {
        return '<button class="chip' + (D.weather === w[0] ? ' active' : '') + '" data-weather="' + w[0] + '">' + w[1] + '</button>';
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
    if (t.dataset.quick === 'refresh') return trig('cef:adm:refresh');
    if (t.dataset.preset) { $('vModel').value = t.dataset.preset; return; }
    if (t.dataset.dspawn) return spawnVeh(t.dataset.dspawn, true);
    if (t.dataset.ddel) return act({ action: 'deldlc', model: t.dataset.ddel });
    if (t.dataset.unban) {
        var lg = t.dataset.unban;
        return modal('Разбан', lg, '<p class="hint">Игрок снова сможет зайти на сервер.</p>', 'Разбанить', function () { act({ action: 'unban', login: lg }); });
    }
    if (t.dataset.weather) return act({ action: 'weather', weather: t.dataset.weather });
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
