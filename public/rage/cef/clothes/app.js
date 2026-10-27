function $(id) { return document.getElementById(id); }
function trig() { if (window.mp && mp.trigger) mp.trigger.apply(mp, arguments); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function money(n) { return '$' + String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function toast(t) { var e = $('toast'); e.textContent = t; e.classList.add('on'); clearTimeout(e._t); e._t = setTimeout(function () { e.classList.remove('on'); }, 2200); }

var Q = '', D = null, CAT = '', SEL = null, TX = 0, ED = null, MAXD = 0, MAXT = 0, TAB = 'one';
var ZOOM = { top: 'body', legs: 'legs', shoes: 'feet', hat: 'head', glasses: 'head', mask: 'head', chain: 'head', watch: 'body', bag: 'body' };

function hit(x) { if (!Q) return true; var q = Q.toLowerCase(); return String(x.n).toLowerCase().indexOf(q) >= 0 || String(x.d) === q; }
function slotOf(k) { return D.slots.find(function (s) { return s.k === k; }); }
function tryOn(it, tx) {
    var s = slotOf(it.slot);
    trig('cef:cs:try', JSON.stringify({ c: s.c, p: s.p, d: it.d, tx: tx, t: it.t, u: it.u, ut: it.ut }));
}
function cats() {
    var used = D.mode === 'shop' ? D.slots.filter(function (s) { return D.list.some(function (x) { return x.slot === s.k; }); }) : D.slots;
    if (!CAT || !used.some(function (s) { return s.k === CAT; })) CAT = used.length ? used[0].k : '';
    $('cats').innerHTML = used.map(function (s) { return '<div class="cat' + (s.k === CAT ? ' on' : '') + '" data-c="' + s.k + '">' + s.i + ' ' + esc(s.n) + '</div>'; }).join('');
}
$('cats').addEventListener('click', function (e) {
    var c = e.target.closest('[data-c]'); if (!c) return;
    CAT = c.dataset.c; SEL = null; trig('cef:cs:reset'); trig('cef:cs:zoom', ZOOM[CAT] || 'body');
    if (D.mode === 'edit') { ED = newEd(); askCount(); }
    render();
});

/* ---------- магазин ---------- */
function renderShop() {
    $('ico').textContent = '👕'; $('ttl').textContent = D.n; $('sub').textContent = 'Наличные: ' + money(D.money);
    if (!D.list.length) { $('cats').innerHTML = ''; $('body').innerHTML = '<div class="empty">' + esc(D.empty) + '</div>'; return; }
    cats();
    var list = D.list.filter(function (x) { return Q ? hit(x) : x.slot === CAT; });
    if (!list.length) { $('body').innerHTML = '<div class="empty">Ничего не найдено</div>'; return; }
    var h = '<div class="grid">' + list.map(function (it) {
        return '<div class="card' + (SEL && SEL.id === it.id ? ' on' : '') + '" data-i="' + it.id + '"><b>' + esc(it.n) + '</b><small>' + (it.tx.length > 1 ? 'Цветов: ' + it.tx.length : '1 цвет') + (it.slot === 'bag' ? ' · +' + it.cap + ' кг' : '') + '</small><div class="pr">' + money(it.price) + '</div></div>';
    }).join('') + '</div>';
    if (SEL) {
        h = '<div class="panel"><h4>' + esc(SEL.n) + '</h4>' +
            (SEL.tx.length > 1 ? '<div class="sw">' + SEL.tx.map(function (t, i) { return '<span data-t="' + t + '" class="' + (t === TX ? 'on' : '') + '">' + (i + 1) + '</span>'; }).join('') + '</div>' : '') +
            (SEL.slot === 'bag' ? '<div class="hint">Вместимость: +' + SEL.cap + ' кг к инвентарю</div>' : '') +
            '<div class="btns"><button class="btn main" id="buyw" ' + (D.money < SEL.price ? 'disabled' : '') + '>Купить и надеть · ' + money(SEL.price) + '</button></div>' +
            '<div class="btns" style="margin-top:8px"><button class="btn" id="buyi" ' + (D.money < SEL.price ? 'disabled' : '') + '>В инвентарь</button><button class="btn" id="unsel">Снять примерку</button></div></div>' + h;
    }
    $('body').innerHTML = h;
    if ($('buyw')) $('buyw').onclick = function () { trig('cef:cs:buy', D.shop, SEL.id, TX, 1); };
    if ($('buyi')) $('buyi').onclick = function () { trig('cef:cs:buy', D.shop, SEL.id, TX, 0); };
    if ($('unsel')) $('unsel').onclick = function () { SEL = null; trig('cef:cs:reset'); render(); };
}

/* ---------- редактор ---------- */
function newEd() { return { id: 0, n: '', sex: D.sex, slot: CAT, d: 0, tx: [0], t: 15, u: -1, ut: 0, price: 500, cap: 20 }; }
function askCount() { var s = slotOf(ED.slot); trig('cef:cs:count', JSON.stringify({ k: 'ed', c: s.c, p: s.p, d: ED.d })); }
var PART_N = { jbib: 'Верх', lowr: 'Низ', feet: 'Обувь', hand: 'Рюкзаки и сумки', berd: 'Маски', teef: 'Аксессуары на шею', p_head: 'Головные уборы', p_eyes: 'Очки', p_lwrist: 'Часы', uppr: 'Торс / руки', accs: 'Майки под низ', decl: 'Нашивки', task: 'Бронежилеты', hair: 'Причёски' };
var DLC_PEND = null;
function dlcGroups() {
    var g = {};
    (D.dlc || []).forEach(function (x) {
        if (x.enc || x.bad) return;
        var k = x.sex + ':' + x.part;
        if (!g[k]) g[k] = { sex: x.sex, part: x.part, slot: x.slot, n: 0, packs: [], parts: [] };
        g[k].parts.push({ pack: x.pack, ids: (x.ids || []).slice().sort(function (a, b) { return a - b; }), n: x.n });
        g[k].n += (x.ids && x.ids.length) || x.n;
        if (g[k].packs.indexOf(x.pack) < 0) g[k].packs.push(x.pack);
    });
    return Object.keys(g).map(function (k) { g[k].parts.sort(function (a, b) { return a.pack < b.pack ? -1 : a.pack > b.pack ? 1 : 0; }); return g[k]; });
}
function dlcNames(x) {
    var base = PART_N[x.part] || x.part, out = [];
    x.parts.forEach(function (p) { (p.ids.length ? p.ids : Array.apply(null, Array(p.n)).map(function (_, i) { return i; })).forEach(function (id) { out.push(base + ' · ' + x.part + '_' + ('00' + id).slice(-3)); }); });
    return out;
}
var DLCV = null, DLCV_SEL = -1;
function renderDlc() {
    var enc = (D.dlc || []).filter(function (x) { return x.enc; });
    var gr = dlcGroups();
    if (DLCV) {
        var x = DLCV.g, nm = dlcNames(x), inCat = {};
        D.list.forEach(function (it) { if (it.slot === x.slot && it.sex === D.sex) inCat[it.d] = it; });
        var h = '<div class="panel"><h4>' + (x.sex === 'f' ? '♀ ' : '♂ ') + esc(PART_N[x.part] || x.part) + ' · модели №' + DLCV.from + '–' + DLCV.to + '</h4><div class="hint">Нажимайте номера — вещь сразу появится на персонаже. Нашли нужную — добавьте её в каталог.</div><div class="sw">';
        for (var i = DLCV.from; i <= DLCV.to; i++) h += '<span data-dv="' + i + '" class="' + (i === DLCV_SEL ? 'on' : '') + '" style="' + (inCat[i] ? 'border-color:#6fd36a' : '') + '">' + i + '</span>';
        h += '</div>';
        if (DLCV_SEL >= 0) {
            var guess = nm[DLCV_SEL - (DLCV.total - nm.length)] || '';
            h += inCat[DLCV_SEL] ? '<div class="hint">Уже в каталоге: «' + esc(inCat[DLCV_SEL].n) + '»</div><div class="btns"><button class="btn" data-dvedit="' + inCat[DLCV_SEL].id + '">Изменить название и цену</button></div>'
                : '<div class="f"><label>Название в магазине</label><input id="dvn" value="' + esc(guess || (PART_N[x.part] || '') + ' #' + DLCV_SEL) + '"></div><div class="btns"><button class="btn main" id="dvadd">Добавить №' + DLCV_SEL + ' в каталог</button></div>';
        }
        h += '<div class="hint" style="margin-top:8px">Всего моделей в этом слоте у игры: ' + DLCV.total + '. Если здесь только обычные вещи GTA — значит игра не подгрузила ваш DLC.</div>' + (DLCV.from > 0 ? '<div class="btns"><button class="btn" id="dvmore">Показать ещё 30 номеров раньше</button></div>' : '');
        h += '<div class="btns" style="margin-top:8px"><button class="btn" id="dvback">← К списку DLC</button></div></div>';
        return h;
    }
    var h2 = '<div class="panel"><h4>Одежда из загруженных DLC</h4><div class="hint">«Смотреть» — пролистать модели прямо на персонаже и добавить нужные по одной. «Все» — добавить всё разом. Женские вещи видны женскому персонажу, мужские — мужскому.</div></div>';
    if (!gr.length && !enc.length) return h2 + '<div class="empty">Одежда в DLC не найдена.<br>Проверьте, что папки лежат в client_packages/game_resources/dlcpacks, и введите /dlc rescan</div>';
    h2 += gr.map(function (x, i) {
        var mine = x.sex === D.sex, can = mine && x.slot;
        var why = !x.slot ? 'этот тип не продаётся отдельно' : !mine ? 'смените пол персонажа на ' + (x.sex === 'f' ? 'женский' : 'мужской') : '';
        return '<div class="li"><b>' + (x.sex === 'f' ? '♀ ' : '♂ ') + esc(PART_N[x.part] || x.part) + ' · ' + x.n + ' шт.<br><small>' + esc(x.packs.join(', ')) + (why ? ' · ' + why : '') + '</small></b>' +
            (can ? '<button class="btn" style="flex:0 0 auto;padding:7px 10px" data-dlcv="' + i + '">Смотреть</button><button class="btn main" style="flex:0 0 auto;padding:7px 10px" data-dlc="' + i + '">Все</button>' : '') + '</div>';
    }).join('');
    (D.dlc || []).filter(function (x) { return x.bad; }).forEach(function (x) { h2 += '<div class="panel" style="border-color:#e05555"><h4 style="color:#ff7b7b">Пак «' + esc(x.pack) + '» не загрузится в игру</h4>' + x.err.map(function (e) { return '<div class="hint">✖ ' + esc(e) + '</div>'; }).join('') + '</div>'; });
    if (enc.length) h2 += '<div class="hint">Зашифрованные архивы (состав не прочитать): ' + esc(enc.map(function (x) { return x.pack; }).join(', ')) + ' — смотрите их вкладкой «Одна вещь», это последние номера в слоте.</div>';
    return h2;
}
window.csCount = function (j) {
    var d = JSON.parse(j);
    if (d.k === 'dvtx' && DVTX_CB) { var cb = DVTX_CB; DVTX_CB = null; cb(d.t); return; }
    if (d.k === 'dlcv' && DLCV_PEND) {
        var gv = DLCV_PEND; DLCV_PEND = null;
        if (d.n <= 0) return toast('Игра не видит эти вещи — перезайдите после загрузки DLC');
        DLCV = { g: gv, from: Math.max(0, d.n - gv.n), to: d.n - 1, total: d.n }; DLCV_SEL = -1; CAT = gv.slot; render(); trig('cef:cs:zoom', ZOOM[gv.slot] || 'body'); return;
    }
    if (d.k === 'dlc' && DLC_PEND) { var x = DLC_PEND, s = slotOf(x.slot); DLC_PEND = null; if (d.n <= 0) return toast('Игра не видит эти вещи — перезайдите после загрузки DLC'); var f = Math.max(0, d.n - x.n); trig('cef:cs:range', JSON.stringify({ from: f, to: d.n - 1, c: s.c, p: s.p, slot: x.slot, sex: D.sex, name: (PART_N[x.part] || s.n) + ' DLC', nm: dlcNames(x), price: 500, cap: 20, t: 15 })); CAT = x.slot; TAB = 'one'; ED = null; Q = ''; if ($('q')) $('q').value = ''; toast('Добавляю ' + x.n + ' шт…'); return; }
    MAXD = d.n; MAXT = d.t; if (ED && !ED.id && ED.tx.length <= 1) { ED.tx = []; for (var i = 0; i < Math.max(1, Math.min(MAXT, 32)); i++) ED.tx.push(i); } paintEdInfo();
};
var DLCV_PEND = null;
function dvTx(n, cb) { DVTX_CB = cb; var s = slotOf(DLCV.g.slot); trig('cef:cs:count', JSON.stringify({ k: 'dvtx', c: s.c, p: s.p, d: n })); }
var DVTX_CB = null;
function preview() { if (ED) tryOn(ED, ED.tx[0] || 0); }
function paintEdInfo() {
    var e = $('edinfo'); if (!e) return;
    e.textContent = 'Моделей в слоте: ' + MAXD + ' (0–' + Math.max(0, MAXD - 1) + ') · цветов у №' + ED.d + ': ' + MAXT;
    if ($('etx')) $('etx').value = ED.tx.join(',');
}
function field(id, lab, val, type) { return '<div class="f"><label>' + lab + '</label><input id="' + id + '" type="' + (type || 'text') + '" value="' + esc(val) + '"></div>'; }
function renderEdit() {
    $('ico').textContent = '🧵'; $('ttl').textContent = 'Редактор одежды'; $('sub').textContent = 'Пол персонажа: ' + (D.sex === 'f' ? 'женский' : 'мужской') + ' · вещи этого пола';
    cats();
    if (!ED) { ED = newEd(); askCount(); }
    var s = slotOf(ED.slot);
    var h = '<div class="tabs"><div class="cat' + (TAB === 'one' ? ' on' : '') + '" data-tab="one">Одна вещь</div><div class="cat' + (TAB === 'bulk' ? ' on' : '') + '" data-tab="bulk">Пачкой (диапазон)</div><div class="cat' + (TAB === 'dlc' ? ' on' : '') + '" data-tab="dlc">Из DLC</div></div>';
    if (TAB === 'dlc') {
        h += renderDlc();
    } else if (TAB === 'one') {
        h += '<div class="panel"><h4>' + (ED.id ? 'Изменить: ' + esc(ED.n) : 'Новая вещь · ' + esc(s.n)) + '</h4>' +
            '<div class="f"><label>Номер модели (drawable)</label><div class="stp"><button data-s="-10">«</button><button data-s="-1">‹</button><input id="ed" value="' + ED.d + '"><button data-s="1">›</button><button data-s="10">»</button></div></div>' +
            '<div class="hint" id="edinfo"></div>' +
            field('en', 'Название в магазине', ED.n) +
            '<div class="row2">' + field('epr', 'Цена, $', ED.price, 'number') + (ED.slot === 'bag' ? field('ecap', 'Вместимость, кг', ED.cap, 'number') : '') + '</div>' +
            field('etx', 'Цвета (номера текстур через запятую)', ED.tx.join(',')) +
            (ED.slot === 'top' ? '<div class="row2">' + field('et', 'Торс / руки (3)', ED.t, 'number') + field('eu', 'Майка под низ (8), -1 = нет', ED.u, 'number') + '</div><div class="hint">Если руки «проваливаются» или торчат — подберите номер торса. Майка нужна для курток и пиджаков.</div>' : '') +
            '<div class="btns"><button class="btn main" id="esave">' + (ED.id ? 'Сохранить' : 'Добавить в каталог') + '</button>' + (ED.id ? '<button class="btn red" id="edel">Снять с продажи</button><button class="btn" id="enew">Новая</button>' : '') + '</div></div>';
    } else {
        h += '<div class="panel"><h4>Добавить пачкой · ' + esc(s.n) + '</h4><div class="hint">Добавит все существующие модели из диапазона со всеми их цветами. Удобно для DLC-одежды: узнайте номера своих вещей и добавьте их разом, потом переименуйте и поправьте цены.</div>' +
            '<div class="row2">' + field('bf', 'С номера', MAXD > 0 ? Math.max(0, MAXD - 20) : 0, 'number') + field('bt', 'По номер', Math.max(0, MAXD - 1), 'number') + '</div>' +
            '<div class="row2">' + field('bn', 'Название', s.n) + field('bp', 'Цена, $', 500, 'number') + '</div>' +
            (ED.slot === 'bag' ? field('bc', 'Вместимость, кг', 20, 'number') : '') + (ED.slot === 'top' ? field('btt', 'Торс / руки (3)', 15, 'number') : '') +
            '<div class="hint" id="edinfo"></div><div class="btns"><button class="btn main" id="bgo">Добавить диапазон</button></div></div>';
    }
    var mine = D.list.filter(function (x) { return Q ? hit(x) : x.slot === CAT && x.sex === D.sex; });
    h += '<div class="lst"><h4 style="font-size:13px;margin-bottom:6px">' + (Q ? 'Найдено по «' + esc(Q) + '»' : 'В каталоге') + ' (' + mine.length + ')</h4>' + (mine.length ? mine.map(function (x) {
        return '<div class="li" data-e="' + x.id + '"><b>' + (Q ? (x.sex === 'f' ? '♀ ' : '♂ ') : '') + esc(x.n) + (Q ? ' <small>· ' + esc((slotOf(x.slot) || {}).n || '') + '</small>' : '') + '</b><small>№' + x.d + ' · ' + x.tx.length + ' цв. · ' + money(x.price) + '</small></div>';
    }).join('') : '<div class="hint">Пусто — добавьте первую вещь</div>') + '</div>';
    $('body').innerHTML = h;
    paintEdInfo();
    if (TAB === 'one') {
        var rd = function () { ED.n = $('en').value; ED.price = Number($('epr').value) || 0; if ($('ecap')) ED.cap = Number($('ecap').value) || 20; ED.tx = $('etx').value.split(/[,\s]+/).map(Number).filter(function (x) { return !isNaN(x) && x >= 0; }); if (!ED.tx.length) ED.tx = [0]; if ($('et')) { ED.t = Number($('et').value); ED.u = Number($('eu').value); } };
        $('ed').onchange = function () { ED.d = Math.max(0, Number($('ed').value) || 0); if (!ED.id) ED.tx = [0]; askCount(); preview(); };
        ['etx', 'et', 'eu'].forEach(function (k) { if ($(k)) $(k).onchange = function () { rd(); preview(); }; });
        $('esave').onclick = function () { rd(); trig('cef:ce:save', JSON.stringify(ED)); };
        if ($('edel')) $('edel').onclick = function () { trig('cef:ce:del', ED.id); ED = newEd(); askCount(); };
        if ($('enew')) $('enew').onclick = function () { ED = newEd(); askCount(); render(); };
        preview();
    } else if ($('bgo')) {
        $('bgo').onclick = function () {
            var f = Number($('bf').value) || 0, t = Number($('bt').value) || 0;
            if (t < f) return toast('Неверный диапазон');
            trig('cef:cs:range', JSON.stringify({ from: f, to: Math.min(t, f + 299), c: s.c, p: s.p, slot: ED.slot, sex: D.sex, name: $('bn').value || s.n, price: Number($('bp').value) || 500, cap: $('bc') ? Number($('bc').value) : 20, t: $('btt') ? Number($('btt').value) : 15 }));
            toast('Добавляю…');
        };
    }
}
$('body').addEventListener('click', function (e) {
    var c;
    if ((c = e.target.closest('[data-tab]'))) { TAB = c.dataset.tab; DLCV = null; DLCV_SEL = -1; render(); return; }
    if ((c = e.target.closest('[data-dlcv]'))) { var gv = dlcGroups()[Number(c.dataset.dlcv)]; if (!gv) return; DLCV_PEND = gv; var sv = slotOf(gv.slot); trig('cef:cs:count', JSON.stringify({ k: 'dlcv', c: sv.c, p: sv.p })); return; }
    if ((c = e.target.closest('[data-dv]'))) { DLCV_SEL = Number(c.dataset.dv); tryOn({ slot: DLCV.g.slot, d: DLCV_SEL, t: 15, u: -1 }, 0); render(); return; }
    if ((c = e.target.closest('[data-dvedit]'))) { var xe = D.list.find(function (z) { return z.id === Number(c.dataset.dvedit); }); if (xe) { ED = JSON.parse(JSON.stringify(xe)); CAT = xe.slot; TAB = 'one'; DLCV = null; askCount(); render(); } return; }
    if (e.target.id === 'dvmore') { DLCV.from = Math.max(0, DLCV.from - 30); render(); return; }
    if (e.target.id === 'dvback') { DLCV = null; DLCV_SEL = -1; trig('cef:cs:reset'); render(); return; }
    if (e.target.id === 'dvadd') { var num = DLCV_SEL, nmv = $('dvn').value; dvTx(num, function (t) { var tx = []; for (var k = 0; k < Math.max(1, Math.min(t, 32)); k++) tx.push(k); trig('cef:ce:save', JSON.stringify({ id: 0, n: nmv, sex: D.sex, slot: DLCV.g.slot, d: num, tx: tx, t: 15, u: -1, ut: 0, price: 500, cap: 20 })); }); return; }
    if ((c = e.target.closest('[data-dlc]'))) { var g = dlcGroups()[Number(c.dataset.dlc)]; if (!g) return; DLC_PEND = g; var gs = slotOf(g.slot); trig('cef:cs:count', JSON.stringify({ k: 'dlc', c: gs.c, p: gs.p })); return; }
    if ((c = e.target.closest('[data-s]'))) { ED.d = Math.max(0, Math.min(Math.max(0, MAXD - 1), ED.d + Number(c.dataset.s))); $('ed').value = ED.d; if (!ED.id) ED.tx = [0]; askCount(); preview(); return; }
    if ((c = e.target.closest('[data-e]'))) { var x = D.list.find(function (z) { return z.id === Number(c.dataset.e); }); if (x) { CAT = x.slot; ED = JSON.parse(JSON.stringify(x)); TAB = 'one'; askCount(); render(); } return; }
    if ((c = e.target.closest('[data-i]'))) { SEL = D.list.find(function (z) { return z.id === Number(c.dataset.i); }); TX = SEL.tx[0]; tryOn(SEL, TX); render(); return; }
    if ((c = e.target.closest('[data-t]'))) { TX = Number(c.dataset.t); tryOn(SEL, TX); render(); return; }
});

function render() { if (!D) return; if (D.mode === 'shop') renderShop(); else renderEdit(); }
window.csOpen = function (j) { D = typeof j === 'string' ? JSON.parse(j) : j; Q = ''; $('q').value = ''; CAT = ''; SEL = null; ED = null; TAB = 'one'; render(); trig('cef:cs:zoom', 'body'); };
window.csEditList = function (j) { D.list = typeof j === 'string' ? JSON.parse(j) : j; if (ED && !ED.id) ED = newEd(); render(); if (ED) askCount(); };
window.csBought = function (slot, worn, m) { D.money = m; toast(worn ? 'Куплено и надето' : 'Куплено — вещь в инвентаре'); render(); };
$('q').addEventListener('input', function () { Q = $('q').value.trim(); if (D && D.mode === 'edit' && Q && TAB !== 'one') TAB = 'one'; render(); });
$('close').onclick = function () { trig('cef:cs:close'); };
document.querySelectorAll('[data-z]').forEach(function (b) { b.onclick = function () { trig('cef:cs:zoom', b.dataset.z); }; });
document.querySelectorAll('[data-r]').forEach(function (b) { b.onclick = function () { trig('cef:cs:rot', Number(b.dataset.r)); }; });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') trig('cef:cs:close'); });