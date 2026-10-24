const FEATURES = [
    'Ширина носа', 'Высота носа', 'Длина кончика носа', 'Глубина переносицы', 'Высота кончика носа',
    'Изгиб носа', 'Высота бровей', 'Глубина бровей', 'Высота скул', 'Ширина скул',
    'Щёки', 'Разрез глаз', 'Толщина губ', 'Ширина челюсти', 'Длина челюсти',
    'Высота подбородка', 'Длина подбородка', 'Ширина подбородка', 'Ямка на подбородке', 'Толщина шеи'
];

const DADS = ['Бенджамин', 'Дэниел', 'Джошуа', 'Ноа', 'Эндрю', 'Хуан', 'Алекс', 'Исаак', 'Эван', 'Итан', 'Винсент', 'Анджел', 'Диего', 'Адриан', 'Габриэль', 'Майкл', 'Сантьяго', 'Кевин', 'Луис', 'Сэмюэл', 'Энтони', 'Клод', 'Нико', 'Джон'];
const MOMS = ['Ханна', 'Обри', 'Жасмин', 'Жизель', 'Амелия', 'Изабелла', 'Зоуи', 'Ава', 'Камила', 'Вайолет', 'Софи', 'Эвелин', 'Николь', 'Эшли', 'Грейс', 'Брианна', 'Натали', 'Оливия', 'Элизабет', 'Шарлотта', 'Эмма', 'Мисти'];
const DAD_IDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 42, 43, 44];
const MOM_IDS = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 45];
const SECTIONS = ['heritage', 'face', 'hair', 'info'];

const state = {
    gender: 0,
    dad: 0, mom: 0, similarity: 50, skin: 50, eyeColor: 0,
    features: new Array(20).fill(0),
    hairStyle: 0, hairColor: 0, hairHighlight: 0,
    brows: 0, browsColor: 0, beard: 0, beardColor: 0,
    blemish: 0, age: 0, makeup: 0, blush: 0, lipstick: 0, lipstickColor: 0
};

function send(field, value) {
    if (window.mp && mp.trigger) mp.trigger('cef:creator:update', field, JSON.stringify(value));
}

function call(name, a, b) {
    if (window.mp && mp.trigger) mp.trigger(name, a, b);
}

function ov(id, index, opacity, color) {
    return { id: id, index: index === 0 ? 255 : index - 1, opacity: index === 0 ? 0 : opacity, color: color || 0 };
}

function build() {
    const fem = state.gender === 1;
    return {
        gender: state.gender,
        parents: {
            father: DAD_IDS[state.dad],
            mother: MOM_IDS[state.mom],
            similarity: state.similarity / 100,
            skinSimilarity: state.skin / 100
        },
        features: state.features.map(function (v) { return v / 100; }),
        overlays: [
            ov(0, state.blemish, 1),
            ov(1, fem ? 0 : state.beard, 1, state.beardColor),
            { id: 2, index: state.brows, opacity: 1, color: state.browsColor },
            ov(3, state.age, 1),
            ov(4, state.makeup, 1),
            ov(5, state.blush, 0.8),
            ov(8, state.lipstick, 0.9, state.lipstickColor)
        ],
        hair: { style: state.hairStyle, color: state.hairColor, highlight: state.hairHighlight },
        eyeColor: state.eyeColor
    };
}

let timer = null;
function push() {
    clearTimeout(timer);
    timer = setTimeout(function () { send('all', build()); }, 40);
}

function paint(input) {
    const p = ((input.value - input.min) / (input.max - input.min)) * 100;
    input.style.setProperty('--p', p + '%');
}

function slider(parent, o) {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML =
        '<div class="row-top"><label>' + o.label + '</label><span class="val"></span></div>' +
        '<div class="ctrl"><button class="step">−</button>' +
        '<input type="range" min="' + o.min + '" max="' + o.max + '" step="' + (o.step || 1) + '">' +
        '<button class="step">+</button></div>';
    const input = row.querySelector('input');
    const val = row.querySelector('.val');
    const steps = row.querySelectorAll('.step');

    function render() {
        val.textContent = o.fmt ? o.fmt(Number(input.value)) : input.value;
        paint(input);
    }
    function set(v) {
        v = Math.max(o.min, Math.min(o.max, v));
        input.value = v;
        o.set(Number(v));
        render();
        push();
    }
    input.value = o.get();
    input.addEventListener('input', function () { set(Number(input.value)); });
    steps[0].addEventListener('click', function () { set(Number(input.value) - (o.step || 1)); });
    steps[1].addEventListener('click', function () { set(Number(input.value) + (o.step || 1)); });
    render();
    row._sync = function () { input.value = o.get(); render(); };
    parent.appendChild(row);
    return row;
}

const BAD_HAIR = { 0: [23], 1: [24] };
function hairList(fem) { const out = [], bad = BAD_HAIR[fem ? 1 : 0]; for (let i = 0; i <= (fem ? 38 : 36); i++) if (bad.indexOf(i) < 0) out.push(i); return out; }
function bind(key) {
    return { get: function () { return state[key]; }, set: function (v) { state[key] = v; } };
}

const pct = function (v) { return v + '%'; };
const offNum = function (v) { return v === 0 ? 'Нет' : String(v); };
let rows = [];

function render() {
    rows = [];
    const fem = state.gender === 1;
    const lists = ['heritageList', 'eyeList', 'featureList', 'overlayList', 'hairList', 'browList'];
    lists.forEach(function (id) { document.getElementById(id).innerHTML = ''; });

    const add = function (id, o) { rows.push(slider(document.getElementById(id), o)); };

    add('heritageList', Object.assign({ label: 'Отец', min: 0, max: DADS.length - 1, fmt: function (v) { return DADS[v]; } }, bind('dad')));
    add('heritageList', Object.assign({ label: 'Мать', min: 0, max: MOMS.length - 1, fmt: function (v) { return MOMS[v]; } }, bind('mom')));
    add('heritageList', Object.assign({ label: 'Сходство с матерью', min: 0, max: 100, fmt: pct }, bind('similarity')));
    add('heritageList', Object.assign({ label: 'Тон кожи', min: 0, max: 100, fmt: pct }, bind('skin')));
    add('eyeList', Object.assign({ label: 'Цвет глаз', min: 0, max: 31 }, bind('eyeColor')));

    FEATURES.forEach(function (name, i) {
        add('featureList', {
            label: name, min: -100, max: 100, step: 5,
            get: function () { return state.features[i]; },
            set: function (v) { state.features[i] = v; }
        });
    });

    add('overlayList', Object.assign({ label: 'Кожа', min: 0, max: 24, fmt: offNum }, bind('blemish')));
    add('overlayList', Object.assign({ label: 'Возраст', min: 0, max: 15, fmt: offNum }, bind('age')));
    add('overlayList', Object.assign({ label: 'Макияж', min: 0, max: 16, fmt: offNum }, bind('makeup')));
    add('overlayList', Object.assign({ label: 'Румяна', min: 0, max: 7, fmt: offNum }, bind('blush')));
    add('overlayList', Object.assign({ label: 'Помада', min: 0, max: 10, fmt: offNum }, bind('lipstick')));
    add('overlayList', Object.assign({ label: 'Цвет помады', min: 0, max: 63 }, bind('lipstickColor')));

    const HL = hairList(fem);
    if (HL.indexOf(state.hairStyle) < 0) state.hairStyle = HL[0];
    add('hairList', { label: 'Причёска', min: 0, max: HL.length - 1, fmt: function (v) { return String(v + 1); },
        get: function () { return Math.max(0, HL.indexOf(state.hairStyle)); }, set: function (v) { state.hairStyle = HL[v]; } });
    add('hairList', Object.assign({ label: 'Цвет волос', min: 0, max: 63 }, bind('hairColor')));
    add('hairList', Object.assign({ label: 'Мелирование', min: 0, max: 63 }, bind('hairHighlight')));

    add('browList', Object.assign({ label: 'Брови', min: 0, max: 33 }, bind('brows')));
    add('browList', Object.assign({ label: 'Цвет бровей', min: 0, max: 63 }, bind('browsColor')));
    if (!fem) {
        add('browList', Object.assign({ label: 'Борода', min: 0, max: 29, fmt: offNum }, bind('beard')));
        add('browList', Object.assign({ label: 'Цвет бороды', min: 0, max: 63 }, bind('beardColor')));
    }
}

function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

function randomize() {
    const fem = state.gender === 1;
    state.dad = rnd(0, DADS.length - 1);
    state.mom = rnd(0, MOMS.length - 1);
    state.similarity = rnd(20, 80);
    state.skin = rnd(0, 100);
    state.eyeColor = rnd(0, 7);
    state.features = state.features.map(function () { return rnd(-6, 6) * 5; });
    const HL = hairList(fem);
    state.hairStyle = HL[rnd(0, HL.length - 1)];
    state.hairColor = rnd(0, 20);
    state.hairHighlight = state.hairColor;
    state.brows = rnd(0, 33);
    state.browsColor = state.hairColor;
    state.beard = fem ? 0 : rnd(0, 29);
    state.beardColor = state.hairColor;
    rows.forEach(function (r) { r._sync(); });
    push();
}

let step = 0;
function go(i) {
    step = Math.max(0, Math.min(SECTIONS.length - 1, i));
    const name = SECTIONS[step];
    document.querySelectorAll('.nav-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.section === name); });
    document.querySelectorAll('.section').forEach(function (s) { s.classList.toggle('active', s.dataset.section === name); });
    document.getElementById('prevBtn').disabled = step === 0;
    document.getElementById('nextBtn').textContent = step === SECTIONS.length - 1 ? 'Создать персонажа' : 'Далее';
    const zone = name === 'face' || name === 'hair' ? 'face' : 'body';
    setCam(zone);
}

function setCam(zone) {
    document.querySelectorAll('.cam').forEach(function (b) { b.classList.toggle('active', b.dataset.zone === zone); });
    call('cef:creator:camZone', zone);
}

function finish() {
    const fn = document.getElementById('firstname').value.trim();
    const ln = document.getElementById('lastname').value.trim();
    const re = /^[A-Za-zА-Яа-яЁё]{2,16}$/;
    if (!re.test(fn) || !re.test(ln)) {
        window.creatorError('Имя и фамилия: только буквы, от 2 до 16 символов');
        return;
    }
    window.creatorError('');
    call('cef:creator:finish', fn, ln);
}

window.creatorError = function (msg) {
    document.getElementById('creatorError').textContent = msg || '';
};

document.querySelectorAll('.g-btn').forEach(function (b) {
    b.addEventListener('click', function () {
        const g = Number(b.dataset.gender);
        if (g === state.gender) return;
        state.gender = g;
        document.querySelectorAll('.g-btn').forEach(function (x) { x.classList.toggle('active', x === b); });
        if (g === 1) state.beard = 0;
        state.hairStyle = 0;
        render();
        push();
    });
});

document.querySelectorAll('.cam').forEach(function (b) {
    b.addEventListener('click', function () { setCam(b.dataset.zone); });
});

document.querySelectorAll('.rot').forEach(function (b) {
    b.addEventListener('click', function () { call('cef:creator:rotate', Number(b.dataset.dir)); });
});

document.querySelectorAll('.nav-btn').forEach(function (b) {
    b.addEventListener('click', function () { go(SECTIONS.indexOf(b.dataset.section)); });
});

document.getElementById('randomBtn').addEventListener('click', randomize);
document.getElementById('prevBtn').addEventListener('click', function () { go(step - 1); });
document.getElementById('nextBtn').addEventListener('click', function () {
    if (step === SECTIONS.length - 1) finish(); else go(step + 1);
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'q' || e.key === 'Q' || e.key === 'й' || e.key === 'Й') {
        if (document.activeElement.tagName !== 'INPUT' || document.activeElement.type === 'range') call('cef:creator:rotate', -1);
    }
    if (e.key === 'e' || e.key === 'E' || e.key === 'у' || e.key === 'У') {
        if (document.activeElement.tagName !== 'INPUT' || document.activeElement.type === 'range') call('cef:creator:rotate', 1);
    }
});

render();
go(0);
push();
