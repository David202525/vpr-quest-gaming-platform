const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'quest_data.json');
const DB = (function () { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch (e) { return {}; } })();
if (!DB.players) DB.players = {};
if (!DB.npc) DB.npc = {};
let dirty = false;
setInterval(function () { if (!dirty) return; dirty = false; fs.writeFile(FILE, JSON.stringify(DB), function () {}); }, 5000);

const TITLE = 'Новая жизнь';
const NPC = {
    vova: { n: 'Дядя Вова', model: 'a_m_m_hillbilly_01', p: [-1039.2, -2730.6, 13.76, 240], idle: 'Город большой, а люди всё те же. Заходи, если что.' },
    mark: { n: 'Марк, начальник склада', model: 's_m_m_postal_01', p: [-421.6, -2786.9, 6.0, 135], idle: 'Работы много, болтать некогда. Хочешь подзаработать — бери фургон.' },
    tony: { n: 'Тони', model: 'g_m_y_famca_01', p: [104.2, -1938.4, 20.8, 45], idle: 'Это Grove Street, брат. Тут свои правила.' },
    anna: { n: 'Анна, фермер', model: 'a_f_y_hippie_01', p: [2026.1, 4977.4, 41.1, 300], idle: 'Земля любит тех, кто не ленится.' },
    lexa: { n: 'Лёха Ключ', model: 'g_m_y_mexgoon_02', p: [483.9, -1311.6, 29.2, 120], idle: 'Мастерская закрыта. Для тебя — тоже.' },
    santiago: { n: 'Сантьяго', model: 's_m_y_dockwork_01', p: [1179.3, -3113.4, 6.0, 90], idle: 'Я тебя не знаю. И знать не хочу.' }
};
const CH2 = 9;
const PLACES = {
    gov: [-545.2, -204.0, 38.2, 'Мэрия Лос-Сантоса'],
    lic: [226.0, -808.5, 30.6, 'Лицензионный центр'],
    courier: [-424.9, -2789.4, 6.0, 'Склад Post OP'],
    farm: [2029.8, 4980.6, 42.1, 'Ферма']
};

function U() { return global.UiSystem; }
function MS() { return global.MoneySystem; }
function notify(p, type, text) { if (typeof global.hudNotify === 'function') global.hudNotify(p, type, text); else p.outputChatBox(text); }
function sid(p) { const a = p.account || p.admAcc; return a && a.id ? 'a' + a.id : null; }
function st(p) {
    const k = sid(p);
    if (!k) return null;
    if (!DB.players[k]) DB.players[k] = { s: 0, cnt: 0, f: {}, done: false };
    const s = DB.players[k];
    if (s.done && s.f && s.f.greedy && !s.ch2) { s.done = false; s.s = CH2; s.ch2 = 1; s.cnt = 0; dirty = true; }
    return s;
}
function npcPos(id) { return DB.npc[id] || NPC[id].p; }
function dist(a, b) { const dx = a.x - b[0], dy = a.y - b[1], dz = a.z - b[2]; return Math.sqrt(dx * dx + dy * dy + dz * dz); }
function hasDoc(p, t) { return !!(U() && U().hasDoc && U().hasDoc(p, t)); }
function count(p, k) { return U() && U().countItem ? U().countItem(p, k) : 0; }

function setup() {
    if (U() && U().ITEMS && !U().ITEMS.q_parcel) U().ITEMS.q_parcel = { n: 'Посылка дяди Вовы', i: '📦', w: 1, s: 1 };
    if (U() && U().ITEMS && !U().ITEMS.q_bag) U().ITEMS.q_bag = { n: 'Сумка Лёхи (не открывать)', i: '👜', w: 2, s: 1 };
}

function reward(p, r) {
    const out = [];
    if (r.money && MS()) { MS().add(p, r.money); out.push('$' + r.money); }
    if (r.exp && U() && U().addExp) { U().addExp(p, r.exp); out.push(r.exp + ' опыта'); }
    (r.items || []).forEach(function (x) {
        if (U() && U().addItem) { U().addItem(p, x[0], x[1]); out.push((U().ITEMS[x[0]] ? U().ITEMS[x[0]].n : x[0]) + (x[1] > 1 ? ' x' + x[1] : '')); }
    });
    if (out.length) notify(p, 'ok', 'Награда: ' + out.join(', '));
    if (U() && U().sendInv) U().sendInv(p);
}

const STEPS = [
    {
        task: 'Поговорите с дядей Вовой у выхода из аэропорта', npc: 'vova',
        dlg: [
            { t: 'О, новенький! Только с самолёта? Я Вова, тридцать лет в этом городе. Лос-Сантос жуёт приезжих и выплёвывает — если у тебя нет плана.', o: [['А у вас есть план для меня?', 1], ['Я сам разберусь.', 'close']] },
            { t: 'Есть. Первым делом — документы. Без паспорта ты тут никто: ни работы, ни прав, ни жилья. Вот, держи двести баксов на госпошлину. Мэрия в центре, я отметил её на карте.', o: [['Спасибо, уже бегу!', 'done']] }
        ],
        reward: { money: 200 }
    },
    {
        task: 'Оформите паспорт в мэрии Лос-Сантоса', npc: 'vova', goal: 'gov',
        check: function (p) { return hasDoc(p, 'passport'); },
        wait: 'Ну что, паспорт получил? Мэрия в центре, я ставил метку. Подойди к сотруднице на ресепшене и нажми E.',
        dlg: [
            { t: 'Ну-ка покажи... Настоящий гражданин! Теперь можно и делами заняться. Только вот что: в этом городе каждый сам себе врач. Без аптечки в кармане я из дома не выхожу.', o: [['К чему вы клоните?', 1]] },
            { t: 'Сгоняй в любой магазин 24/7 — зелёная корзинка на карте — и купи аптечку. Принесёшь мне — верну деньги с процентами. Заодно посмотрю, можно ли тебе доверять.', o: [['Договорились.', 'done']] }
        ],
        reward: { money: 300, exp: 20 }
    },
    {
        task: 'Купите аптечку в магазине 24/7 и принесите дяде Вове', npc: 'vova',
        check: function (p) { return count(p, 'medkit') >= 1; },
        wait: 'Аптечку не вижу. Магазины 24/7 отмечены зелёной корзинкой — их по городу полно.',
        dlg: [
            { t: 'Вот это я понимаю — не украл, не потерял, принёс. Держи деньги, как обещал. А теперь слушай: мой старый друг Марк заведует складом Post OP в порту. Ему вечно не хватает толковых курьеров.', o: [['Отдать аптечку и поехать к Марку', 'done']] }
        ],
        finish: function (p) { if (U().takeItems) U().takeItems(p, 'medkit', 1); },
        reward: { money: 1200, exp: 20 }
    },
    {
        task: 'Найдите Марка на складе Post OP в порту', npc: 'mark', goal: 'npc',
        dlg: [
            { t: 'От Вовы? Он про тебя звонил. Значит так: берёшь фургон, грузишь посылки и развозишь по адресам. Сделаешь три доставки без косяков — возьму на заметку.', o: [['Где взять работу?', 1], ['Понял, приступаю.', 'done']] },
            { t: 'Рядом со мной точка найма курьеров — подойди к ней, нажми E и устройся. Посылки на складе, фургон тут же. Адреса появятся на карте.', o: [['Приступаю.', 'done']] }
        ],
    },
    {
        task: 'Выполните доставки курьером', npc: 'mark', need: 3, goal: 'courier',
        check: function (p, s) { return s.cnt >= 3; },
        wait: function (p, s) { return 'Пока ' + s.cnt + ' из 3 доставок. Работа сама себя не сделает — точка найма рядом со мной.'; },
        dlg: [
            { t: 'Клиенты довольны, жалоб ноль. Вот премия сверху. Кстати, Вова просил передать — заскочи к нему, у него для тебя что-то серьёзное. Но без прав за рулём он тебя дальше не пустит.', o: [['Спасибо, Марк!', 'done']] }
        ],
        reward: { money: 800, exp: 30 }
    },
    {
        task: 'Получите водительские права категории B в лицензионном центре', npc: 'vova', goal: 'lic',
        check: function (p) { return hasDoc(p, 'drive'); },
        wait: 'Права, малой, права! Лицензионный центр в центре города — сдай теорию и практику. Без них к моему делу не подпущу.',
        dlg: [
            { t: 'Права есть? Отлично. Теперь — дело. Вот посылка. Отвезёшь её Тони на Grove Street. Не открывай, не задавай вопросов, просто отдай.', o: [['А что внутри?', 1], ['Сделаю.', 'done']] },
            { t: 'Меньше знаешь — крепче спишь. Скажем так: старый долг. Тони поймёт.', o: [['Ладно, еду.', 'done']] }
        ],
        finish: function (p) { if (U().addItem) U().addItem(p, 'q_parcel', 1); },
        reward: { money: 1000, exp: 30 }
    },
    {
        task: 'Отвезите посылку Тони на Grove Street', npc: 'tony', goal: 'npc',
        check: function (p) { return count(p, 'q_parcel') >= 1; },
        wait: 'А где посылка? Без неё не возвращайся. Если потерял — Вова тебе голову оторвёт.',
        dlg: [
            { t: 'От Вовы? Давно я ждал этот должок... Слушай, тут больше, чем нужно. Давай так: полторы штуки забирай себе, а Вове скажешь, что всё передал как есть. Никто не узнает.', o: [['Забрать $1500 себе', 'greedy'], ['Нет. Всё должно дойти как есть.', 'honest']] }
        ],
        branch: {
            greedy: { t: 'Умный парень. Держи. И вот что — моя сестра Анна на ферме в Грейпсиде зашивается с урожаем. Помоги ей, она не обидит.', money: 1500 },
            honest: { t: 'Хм... Честный. Редкость в этом городе. Уважаю. Моя сестра Анна на ферме в Грейпсиде зашивается с урожаем — помоги ей, а я замолвлю за тебя словечко перед Вовой.' }
        },
        finish: function (p) { if (U().takeItems) U().takeItems(p, 'q_parcel', 1); },
        reward: { exp: 30 }
    },
    {
        task: 'Помогите Анне на ферме: сдайте урожай', npc: 'anna', need: 2, goal: 'npc',
        check: function (p, s) { return s.cnt >= 2; },
        wait: function (p, s) { return 'Тони прислал? Вот и славно. Устройся на ферму — точка найма рядом — собери урожай и сдай. Сдано: ' + s.cnt + ' из 2.'; },
        dlg: [
            { t: 'Ты настоящий трудяга! Вот, держи рюкзак моего покойного мужа — тебе нужнее. И передай Вове, что его посылку здесь все помнят.', o: [['Спасибо, Анна!', 'done']] }
        ],
        reward: { money: 1000, exp: 30, items: [['backpack', 1]] }
    },
    {
        task: 'Вернитесь к дяде Вове у аэропорта', npc: 'vova', goal: 'npc',
        dlg: [
            { t: function (p, s) {
                return s.f.greedy
                    ? 'Тони мне всё рассказал. Полторы штуки, да? ...Знаешь, я не злюсь. Город такой — каждый ищет свою выгоду. Но запомни: доверие стоит дороже любых денег.'
                    : 'Тони звонил. Сказал, ты не взял ни цента, хотя мог. Ты не представляешь, как редко я такое слышу. Добро пожаловать в Лос-Сантос по-настоящему.';
            }, o: [['Что дальше?', 1]] },
            { t: 'Дальше — сам. Паспорт, права, работа, знакомые — у тебя есть всё, чтобы подняться. Держи на первое время. И заходи иногда, старику бывает скучно.', o: [['Спасибо за всё, Вова!', 'done']] }
        ],
        reward: { money: 3000, exp: 60, items: [['medkit', 2]] },
        extra: function (p, s) { if (!s.f.greedy) reward(p, { money: 2000, items: [['armour', 1]] }); }
    },
    {
        task: 'Тони хочет поговорить. Езжайте на Grove Street', npc: 'tony', goal: 'npc',
        dlg: [
            { t: 'А вот и наш человек. Ты взял деньги и не моргнул — значит, с тобой можно работать. Вова хороший мужик, но живёт по старым правилам. А в этом городе деньги делают по новым.', o: [['Что за работа?', 1], ['Я не из таких.', 'close']] },
            { t: 'Для начала проверка. Купи отмычку в любом 24/7 и покажи мне. Потом познакомлю с нужным человеком.', o: [['Сделаю.', 'done']] }
        ],
        reward: { exp: 20 }
    },
    {
        task: 'Купите отмычку в магазине 24/7 и покажите Тони', npc: 'tony',
        check: function (p) { return count(p, 'lockpick') >= 1; },
        wait: 'Отмычку, брат. В любом 24/7 продаётся. Без неё не возвращайся.',
        dlg: [
            { t: 'Хороший инструмент. Теперь слушай: в мастерской Хейс на юге города сидит Лёха Ключ. Ему нужна тачка. Любая чужая, не полицейская и не рабочая. Сядешь за руль с отмычкой в кармане — и гони к нему.', o: [['А если поймают?', 1], ['Понял.', 'done']] },
            { t: 'Тогда ты меня не знаешь. Но не ссы — копы в этом районе медленные.', o: [['Еду.', 'done']] }
        ],
        reward: { exp: 20 }
    },
    {
        task: 'Угоните чужую машину и пригоните её Лёхе в мастерскую', npc: 'lexa', goal: 'npc', steal: 1,
        check: function (p, s) { return !!s.f.car; },
        wait: 'Где тачка? Мне нужна машина, а не разговоры. Чужая, с отмычкой, сюда в бокс.',
        dlg: [
            { t: 'Неплохо для первого раза. Только тебя срисовали — сирены слышно отсюда. Пересиди минуты три где-нибудь подальше от копов, потом поговорим о деньгах.', o: [['Понял, залягу на дно.', 'done']] }
        ],
        reward: { exp: 30 }
    },
    {
        task: 'Заляжьте на дно и не попадитесь полиции', npc: 'lexa', timer: 1,
        begin: function (p, s) { s.until = s.f.retry ? 0 : Date.now() + 180000; },
        check: function (p, s) { return Date.now() >= (s.until || 0); },
        wait: function (p, s) { return 'Рано ещё. Ты что, хочешь привести копов прямо ко мне? Подожди ' + left(s) + '.'; },
        dlg: [
            { t: function (p, s) {
                return s.f.retry
                    ? 'Опоздал, значит. Сантьяго ждать не любит. Ладно — последний шанс. Вот новая сумка, и в этот раз уложись в пять минут.'
                    : 'Чисто. Держи за тачку. И раз уж ты такой шустрый — отвези эту сумку Сантьяго в порт. У тебя пять минут, он ждать не будет. И внутрь не заглядывай.';
            }, o: [['Взять сумку', 'done']] }
        ],
        finish: function (p) { if (U().addItem) U().addItem(p, 'q_bag', 1); },
        extra: function (p, s) { if (!s.f.paid) { s.f.paid = 1; reward(p, { money: 2500, exp: 20 }); } }
    },
    {
        task: 'Доставьте сумку Сантьяго в порт', npc: 'santiago', goal: 'npc', timer: 1,
        begin: function (p, s) { s.until = Date.now() + 300000; },
        check: function (p, s) { return count(p, 'q_bag') >= 1 && Date.now() <= (s.until || 0); },
        wait: 'Где сумка? Без неё нам не о чем говорить.',
        dlg: [
            { t: 'Минута в минуту. Лёха не ошибся в тебе. Передай Тони — товар на месте, следующая партия через неделю.', o: [['Отдать сумку', 'done']] }
        ],
        finish: function (p) { if (U().takeItems) U().takeItems(p, 'q_bag', 1); },
        reward: { money: 3000, exp: 30 }
    },
    {
        task: 'Вернитесь к Тони на Grove Street', npc: 'tony', goal: 'npc',
        dlg: [
            { t: 'Сантьяго звонил. Говорит, ты быстрый и не задаёшь лишних вопросов. Ценю. Знаешь, Вова думал, что тебя испортил город. А город просто показал, кто ты есть.', o: [['И кто же я?', 1]] },
            { t: 'Свой человек. Держи ствол без номера и долю. Захочешь большего — ищи семью: мафии и банды берут таких, как ты. А мой номер у тебя есть.', o: [['До связи, Тони.', 'done']] }
        ],
        reward: { money: 5000, exp: 60, items: [['i_pistol', 1], ['ammo_pistol', 60]] }
    }
];
function left(s) { const ms = Math.max(0, (s.until || 0) - Date.now()); const m = Math.floor(ms / 60000), sec = Math.floor(ms / 1000) % 60; return m + ':' + (sec < 10 ? '0' : '') + sec; }

function stepTitle(s) { return s.s >= CH2 ? 'Грязные деньги · ' + (s.s - CH2 + 1) + '/' + (STEPS.length - CH2) : TITLE + ' · ' + (s.s + 1) + '/' + CH2; }
function goalOf(step) {
    if (!step) return null;
    if (step.goal === 'npc') { const q = npcPos(step.npc); return [q[0], q[1], q[2], NPC[step.npc].n]; }
    if (step.goal && PLACES[step.goal]) return PLACES[step.goal];
    return null;
}

function sync(p, wp) {
    const s = st(p);
    if (!s) return;
    const step = s.done ? null : STEPS[s.s];
    const jobActive = global.JobSystem && global.JobSystem.current && global.JobSystem.current(p);
    if (step && !jobActive && typeof global.hudQuest === 'function') {
        const tasks = [step.task + (step.need ? ' (' + Math.min(s.cnt, step.need) + '/' + step.need + ')' : '') + (step.timer && s.until > Date.now() ? ' · ' + left(s) : '')];
        if (step.goal && step.goal !== 'npc' && step.check && step.check(p, s)) tasks.push({ text: 'Вернитесь: ' + NPC[step.npc].n, done: false });
        global.hudQuest(p, stepTitle(s), tasks);
    } else if (!step && !jobActive && s.hudShown) {
        global.hudQuest(p, '', []);
    }
    s.hudShown = !!step;
    let target = null;
    if (step) {
        const g = goalOf(step);
        const ready = !step.check || step.check(p, s);
        if (ready || !g) { const q = npcPos(step.npc); target = { x: q[0], y: q[1], z: q[2], n: NPC[step.npc].n, npc: step.npc }; }
        else target = { x: g[0], y: g[1], z: g[2], n: g[3], npc: null };
    }
    p.call('quest:state', [JSON.stringify({ t: target, wp: !!wp, npc: step ? step.npc : null })]);
}

function begin(p, s) {
    s.cnt = 0;
    const step = STEPS[s.s];
    if (step && step.begin) step.begin(p, s);
    dirty = true;
    sync(p, true);
}

function advance(p, s) {
    const step = STEPS[s.s];
    if (step.finish) step.finish(p, s);
    if (step.reward) reward(p, step.reward);
    if (step.extra) step.extra(p, s);
    s.s++;
    if (s.s === CH2 && s.f.greedy) {
        s.ch2 = 1;
        notify(p, 'ok', 'Глава «' + TITLE + '» завершена! Новая глава: «Грязные деньги»');
    } else if (s.s === CH2 || s.s >= STEPS.length) {
        s.done = true;
        dirty = true;
        const nm = s.s > CH2 ? 'Грязные деньги' : TITLE;
        notify(p, 'ok', 'Сюжетная линия «' + nm + '» завершена!');
        mp.players.broadcast('!{#ffd34f}[Сюжет] !{#ffffff}' + p.name + ' завершил линию «' + nm + '»');
        sync(p, false);
        return;
    }
    begin(p, s);
    notify(p, 'ok', 'Новая задача: ' + STEPS[s.s].task);
}

function show(p, npc, text, opts) {
    p.qDlg = { npc: npc, opts: opts };
    p.call('quest:dialog', [JSON.stringify({ n: NPC[npc].n, t: text, o: opts.map(function (o) { return o[0]; }) })]);
}
function closeDlg(p) { p.qDlg = null; p.call('quest:dialog', ['null']); }

function page(p, s, i) {
    const step = STEPS[s.s];
    const pg = step.dlg[i];
    const text = typeof pg.t === 'function' ? pg.t(p, s) : pg.t;
    show(p, step.npc, text, pg.o.map(function (o) { return [o[0], o[1]]; }));
}

mp.events.add('srv:quest:talk', function (p, id) {
    if (!NPC[id] || !mp.players.exists(p)) return;
    if (dist(p.position, npcPos(id)) > 3.5) return;
    const s = st(p);
    if (!s) return notify(p, 'error', 'Сначала войдите в аккаунт');
    const step = s.done ? null : STEPS[s.s];
    if (!step || step.npc !== id) return show(p, id, NPC[id].idle, [['До встречи.', 'close']]);
    if (step.check && !step.check(p, s)) {
        const w = typeof step.wait === 'function' ? step.wait(p, s) : step.wait;
        return show(p, id, w, [['Понял.', 'close']]);
    }
    page(p, s, 0);
});

mp.events.add('srv:quest:answer', function (p, idx) {
    const d = p.qDlg;
    if (!d) return;
    const o = d.opts[Number(idx)];
    if (!o) return;
    const s = st(p);
    const step = s && !s.done ? STEPS[s.s] : null;
    const a = o[1];
    if (a === 'close' || !step || step.npc !== d.npc || dist(p.position, npcPos(d.npc)) > 4) return closeDlg(p);
    if (typeof a === 'number') return page(p, s, a);
    if (step.check && !step.check(p, s)) return closeDlg(p);
    if (step.branch && step.branch[a]) {
        const b = step.branch[a];
        s.f[a] = 1;
        if (b.money && MS()) MS().add(p, b.money);
        const npc = d.npc;
        advance(p, s);
        return show(p, npc, b.t, [['Хорошо.', 'close']]);
    }
    if (a === 'done') { closeDlg(p); advance(p, s); }
});

function onJob(p, jobId) {
    const s = st(p);
    if (!s || s.done) return;
    const step = STEPS[s.s];
    if (!step || !step.need) return;
    const want = s.s === 4 ? 'courier' : s.s === 7 ? 'farm' : null;
    if (jobId !== want) return;
    s.cnt++;
    dirty = true;
    if (s.cnt === step.need) notify(p, 'ok', 'Задача выполнена! Вернитесь: ' + NPC[step.npc].n);
    sync(p, s.cnt === step.need);
}

function okCar(v) {
    if (!v || !mp.vehicles.exists(v)) return false;
    const g = function (k) { try { return v.getVariable(k); } catch (e) { return null; } };
    if (g('ownerId') || g('gov') || g('faction')) return false;
    if (g('jobVeh') !== null && g('jobVeh') !== undefined) return false;
    if (g('rent') !== null && g('rent') !== undefined) return false;
    return v.jobOwner === undefined && !v.dbId;
}
function W() { return global.WantedSystem; }
function tick(p) {
    const s = st(p);
    if (!s || s.done) return;
    const step = STEPS[s.s];
    if (!step) return;
    if (step.steal && !s.f.car) {
        const v = p.vehicle;
        const driver = v && (p.seat === 0 || p.seat === -1);
        if (driver && okCar(v) && p.qCar !== v) {
            if (p.qWarn === v) return;
            if (count(p, 'lockpick') < 1) { p.qWarn = v; return notify(p, 'warn', 'Без отмычки эту машину не завести для Лёхи'); }
            if (U().takeItems) U().takeItems(p, 'lockpick', 1);
            p.qCar = v;
            if (W() && W().add) W().add(p, 1, 'Угон автомобиля', 'Система');
            s.f.star = 1;
            dirty = true;
            notify(p, 'warn', 'Машина угнана! Отмычка сломалась. Вас заметили: +1★. Гоните к Лёхе');
            return;
        }
        if (v && p.qCar === v && dist(v.position, npcPos('lexa')) < 14) {
            s.f.car = 1;
            dirty = true;
            try { p.removeFromVehicle(); } catch (e) {}
            setTimeout(function () { try { if (mp.vehicles.exists(v) && !v.getOccupants().length) v.destroy(); } catch (e) {} }, 4000);
            notify(p, 'ok', 'Лёха загнал машину в бокс. Поговорите с ним');
            sync(p, false);
        }
        return;
    }
    if (step.timer && s.s === CH2 + 3 && s.until && Date.now() >= s.until && !s.f.cool) {
        s.f.cool = 1;
        dirty = true;
        if (s.f.star && W() && W().get && W().get(p) > 0) W().add(p, -1, 'Потеряли след', 'Система');
        notify(p, 'ok', 'Вас потеряли. Возвращайтесь к Лёхе');
        sync(p, true);
        return;
    }
    if (step.timer && s.s === CH2 + 4 && s.until && Date.now() > s.until) {
        if (U().takeItems) U().takeItems(p, 'q_bag', 99);
        s.s = CH2 + 3;
        s.f.retry = 1;
        s.until = 0;
        dirty = true;
        notify(p, 'error', 'Вы не успели! Сантьяго ушёл, сумку забрали люди Лёхи. Возвращайтесь к Лёхе');
        sync(p, true);
        return;
    }
    if (step.timer && s.until > Date.now() && (!p.qSyncAt || Date.now() - p.qSyncAt > 5000)) { p.qSyncAt = Date.now(); sync(p, false); }
}
setInterval(function () { mp.players.forEach(function (p) { if (sid(p)) try { tick(p); } catch (e) { console.log('[quest] tick: ' + e.message); } }); }, 2000);

let peds = {};
function spawnPeds() {
    Object.keys(peds).forEach(function (k) { try { if (peds[k] && mp.peds.exists(peds[k])) peds[k].destroy(); } catch (e) {} });
    peds = {};
    Object.keys(NPC).forEach(function (id) {
        const q = npcPos(id);
        try { peds[id] = mp.peds.new(mp.joaat(NPC[id].model), new mp.Vector3(q[0], q[1], q[2]), { dynamic: false, frozen: true, invincible: true, heading: q[3] || 0, dimension: 0 }); } catch (e) { console.log('[quest] ped ' + id + ': ' + e.message); }
    });
}
function npcList() { return Object.keys(NPC).map(function (id) { const q = npcPos(id); return { id: id, n: NPC[id].n, p: q }; }); }
function sendNpcs(p) { p.call('quest:npcs', [JSON.stringify(npcList())]); }

setTimeout(function () { setup(); spawnPeds(); mp.players.forEach(function (p) { sendNpcs(p); sync(p, false); }); }, 3000);
mp.events.add('playerReady', function (p) { setTimeout(function () { if (!mp.players.exists(p)) return; sendNpcs(p); sync(p, false); }, 7000); });
setInterval(function () { mp.players.forEach(function (p) { if (sid(p)) sync(p, false); }); }, 10000);
mp.events.add('playerQuit', function (p) { p.qDlg = null; p.qCar = null; });

function adminLvl(p) { return global.AdminSystem && global.AdminSystem.lvl ? global.AdminSystem.lvl(p) : 0; }
mp.events.addCommand('quest', function (p) {
    const s = st(p);
    if (!s) return;
    if (s.done) return notify(p, 'ok', 'Линия «' + TITLE + '» уже пройдена');
    notify(p, 'ok', stepTitle(s) + ': ' + STEPS[s.s].task);
    sync(p, true);
});
mp.events.addCommand('questnpc', function (p, full) {
    if (adminLvl(p) < 6) return;
    const id = String(full || '').trim();
    if (!NPC[id]) return p.outputChatBox('!{#ffd34f}/questnpc [' + Object.keys(NPC).join('/') + '] — поставить NPC на вашу позицию');
    DB.npc[id] = [p.position.x, p.position.y, p.position.z, p.heading];
    dirty = true;
    spawnPeds();
    mp.players.forEach(sendNpcs);
    p.outputChatBox('!{#8fd14f}NPC ' + NPC[id].n + ' перемещён');
});
mp.events.addCommand('questset', function (p, full) {
    if (adminLvl(p) < 6) return;
    const a = String(full || '').trim().split(/\s+/);
    const t = mp.players.at(Number(a[0]));
    const n = Number(a[1]);
    if (!t || isNaN(n) || n < 0 || n > STEPS.length) return p.outputChatBox('!{#ffd34f}/questset [id] [этап 0-' + STEPS.length + ']');
    const s = st(t);
    if (!s) return;
    s.s = Math.min(n, STEPS.length - 1); s.done = n >= STEPS.length; s.cnt = 0; s.f = n >= CH2 ? { greedy: 1 } : {}; s.ch2 = n >= CH2 ? 1 : 0; s.until = 0;
    const sb = STEPS[s.s]; if (!s.done && sb && sb.begin) sb.begin(t, s);
    dirty = true;
    sync(t, true);
    p.outputChatBox('!{#8fd14f}Этап квеста ' + t.name + ': ' + n);
});

global.QuestSystem = { onJob: onJob, sync: sync };
console.log('[quest] сюжетная линия загружена, этапов: ' + STEPS.length);

/* ---------- метки в редакторе /points ---------- */
const PR = global.PointReg || require('./points.js');
PR.provider(function () {
    return Object.keys(NPC).map(function (id) {
        return { id: 'npc.' + id, g: 'Квестовые NPC', n: NPC[id].n, get: function () { return npcPos(id); },
            set: function (v) { DB.npc[id] = [v.x, v.y, v.z, v.h]; dirty = true; spawnPeds(); mp.players.forEach(sendNpcs); },
            reset: function () { delete DB.npc[id]; dirty = true; spawnPeds(); mp.players.forEach(sendNpcs); } };
    });
});
