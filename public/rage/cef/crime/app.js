function $(id) { return document.getElementById(id); }
function trig() { if (window.mp && mp.trigger) mp.trigger.apply(mp, arguments); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function money(n) { return '$' + String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
var MODE = '', SR = null;
window.shop = function (j) {
    var d = typeof j === 'string' ? JSON.parse(j) : j; MODE = 'shop';
    $('box').className = 'box'; $('box').style.removeProperty('--g'); $('box').style.removeProperty('--g2');
    var rows = [{ k: 'ukrop_pack', n: '🌿 Пакет укропа (x10)', s: 'Восстанавливает здоровье, вызывает зависимость · на складе: ' + d.stock, p: d.price, lock: d.stock <= 0 }]
        .concat(d.ill.map(function (x) { return { k: x.k, n: x.n, s: x.need === 'mafia' ? 'Только для мафии' : 'Без лицензии — изымается полицией', p: x.p, lock: x.need && x.need !== d.type }; }));
    $('box').innerHTML = '<div class="hd"><i>🌿</i><div><b>Поставщик</b><small>' + esc(d.org) + ' · ' + (d.type === 'mafia' ? 'оптовая цена для мафии' : 'наценка для банд, доля уходит мафии') + '</small></div></div>' +
        rows.map(function (r) { return '<div class="row' + (r.lock ? ' lock' : '') + '"><div class="n"><b>' + esc(r.n) + '</b><small>' + esc(r.s) + '</small></div><b>' + money(r.p) + '</b><input class="qty" type="number" min="1" max="20" value="1" data-q="' + r.k + '"' + (r.lock ? ' disabled' : '') + '><button data-b="' + r.k + '"' + (r.lock ? ' disabled' : '') + '>Купить</button></div>'; }).join('') +
        '<div class="foot"><small>Перепродавайте укроп игрокам и на центральном рынке. Полиция при обыске изымает всё нелегальное</small><button class="ghost" id="cl">Уйти</button></div>';
    document.querySelectorAll('[data-b]').forEach(function (b) { b.onclick = function () { var q = document.querySelector('[data-q="' + b.dataset.b + '"]').value; trig('cef:crime:buy', b.dataset.b, Number(q) || 1); }; });
    $('cl').onclick = function () { trig('cef:crime:close'); };
};
window.search = function (j) {
    SR = typeof j === 'string' ? JSON.parse(j) : j; MODE = 'search';
    $('box').className = 'box cop'; $('box').style.removeProperty('--g'); $('box').style.removeProperty('--g2');
    $('box').innerHTML = '<div class="hd"><i>🔍</i><div><b>Обыск: ' + esc(SR.n) + '</b><small>ID ' + SR.id + ' · лицензия на оружие: ' + (SR.lic ? 'есть' : 'нет') + '</small></div></div>' +
        (SR.list.length ? SR.list.map(function (x) {
            return '<label class="row"><input class="chk" type="checkbox" data-k="' + x.k + '"' + (x.legal ? '' : ' checked') + '><div class="n"><b>' + esc(x.n) + ' ×' + x.c + '</b><small>' + (x.legal ? 'Разрешено (есть лицензия)' : x.ill ? 'Запрещено к обороту' : 'Без лицензии') + '</small></div>' + (x.legal ? '<span class="tag ok">законно</span>' : '<span class="tag">нелегально</span>') + '</label>';
        }).join('') : '<div class="empty">Ничего запрещённого не найдено</div>') +
        '<div class="foot"><small>Отмеченное будет изъято. За нелегальное оружие и укроп автоматически выдаётся розыск</small><div style="display:flex;gap:8px"><button class="ghost" id="cl">Закрыть</button>' + (SR.list.length ? '<button id="go">Изъять</button>' : '') + '</div></div>';
    $('cl').onclick = function () { trig('cef:crime:close'); };
    var g = $('go'); if (g) g.onclick = function () { var ks = Array.prototype.map.call(document.querySelectorAll('[data-k]:checked'), function (c) { return c.dataset.k; }); if (!ks.length) return; trig('cef:crime:seize', SR.id, JSON.stringify(ks)); };
};
window.garage = function (j) {
    var d = typeof j === 'string' ? JSON.parse(j) : j;
    var b = base('bench', d.c);
    b.innerHTML = '<div class="top"><i><svg viewBox="0 0 24 24" width="26" height="26" fill="#fff"><path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11a2 2 0 0 1 2 2v4h-2a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H3v-4a2 2 0 0 1 2-2zm2.2 0h9.6l-1.1-3.4a.8.8 0 0 0-.8-.6H9.1a.8.8 0 0 0-.8.6z"/></svg></i><div><b>Гараж · ' + esc(d.org) + '</b><small>Машины в цвете организации · одна на человека</small></div><div class="x" id="cl">✕</div></div>' +
        '<div class="cars">' + d.list.map(function (c) {
            var taken = d.out === c.m;
            return '<div class="car' + (c.ok ? '' : ' lock') + (taken ? ' sel' : '') + '"><div class="cpic"><img src="../ui/img/v/' + c.m + '.webp" onerror="this.style.display=\'none\'"></div><b>' + esc(c.m.toUpperCase()) + '</b><small>' + (c.ok ? 'доступна' : 'с ранга «' + esc(c.rn) + '»') + '</small>' +
                '<button data-m="' + c.m + '"' + (c.ok && !d.out ? '' : ' disabled') + '>' + (taken ? 'Выдана' : c.ok ? 'Взять' : 'Закрыто') + '</button></div>';
        }).join('') + '</div>' +
        (d.out ? '<div class="foot" style="padding:0 22px 20px"><small>Сначала верните текущую машину — пригоните её к гаражу</small><button id="bk">Вернуть машину</button></div>' : '');
    bind('[data-m]', function (el) { trig('cef:crime:car', el.dataset.m); });
    var bk = $('bk'); if (bk) bk.onclick = function () { trig('cef:crime:car', '__back'); };
    $('cl').onclick = function () { trig('cef:crime:close'); };
};

function dark(c) { var n = parseInt(c.replace('#', ''), 16); var f = function (v) { return ('0' + Math.floor(v * 0.45).toString(16)).slice(-2); }; return '#' + f((n >> 16) & 255) + f((n >> 8) & 255) + f(n & 255); }
function base(cls, c) { var b = $('box'); b.className = 'box ' + (cls || ''); if (c) { b.style.setProperty('--g', c); b.style.setProperty('--g2', dark(c)); b.style.setProperty('--ga', c + '40'); } else { b.style.removeProperty('--g'); b.style.removeProperty('--g2'); b.style.removeProperty('--ga'); } return b; }
function bind(sel, fn) { document.querySelectorAll(sel).forEach(function (el) { el.onclick = function () { fn(el); }; }); }
function qv(id) { var el = document.querySelector('[data-q="' + id + '"]'); return el ? Number(el.value) || 1 : 1; }
function tm(t) { var d = new Date(t); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
window.stash = function (j) {
    var d = typeof j === 'string' ? JSON.parse(j) : j;
    var b = base('wide', d.c);
    var row = function (x, op, can) { return '<div class="row sm"><span class="ic">' + ICON(x.k, x.i) + '</span><div class="n"><b>' + esc(x.n) + '</b><small>×' + x.c + '</small></div><input class="qty" type="number" min="1" max="' + x.c + '" value="' + x.c + '" data-q="' + op + x.k + '"><button data-' + op + '="' + x.k + '"' + (can ? '' : ' disabled') + '>' + (op === 'put' ? 'Положить' : 'Взять') + '</button></div>'; };
    b.innerHTML = '<div class="hd"><i>🗄️</i><div><b>Общак · ' + esc(d.org) + '</b><small>Брать предметы — с ранга «' + esc(d.need) + '»' + (d.lead ? ' · лидер меняет порог' : '') + '</small></div></div>' +
        '<div class="cash"><div class="sum">' + money(d.bank) + '</div><input id="cs" type="number" min="1" placeholder="Сумма"><button id="ci">Положить</button>' + (d.lead ? '<button class="ghost" id="co">Взять</button>' : '') + '</div>' +
        '<div class="cols"><div class="col"><h4>В общаке</h4><div class="list">' + (d.st.length ? d.st.map(function (x) { return row(x, 'take', d.canTake); }).join('') : '<div class="empty">Пусто</div>') + '</div></div>' +
        '<div class="col"><h4>У вас</h4><div class="list">' + (d.inv.length ? d.inv.map(function (x) { return row(x, 'put', true); }).join('') : '<div class="empty">Нечего положить</div>') + '</div></div></div>' +
        '<div class="logs">' + (d.log || []).map(function (l) { return tm(l.t) + ' — ' + esc(l.x); }).join('<br>') + '</div>' +
        '<div class="foot"><small>' + (d.lead ? 'Порог ранга: <input class="qty" id="rk" type="number" min="1" max="12" value=""> <button class="ghost" id="rkb">OK</button>' : 'Всё движение записывается в журнал') + '</small><button class="ghost" id="cl">Закрыть</button></div>';
    bind('[data-put]', function (el) { trig('cef:crime:stashOp', 'put', el.dataset.put, qv('put' + el.dataset.put)); });
    bind('[data-take]', function (el) { trig('cef:crime:stashOp', 'take', el.dataset.take, qv('take' + el.dataset.take)); });
    $('ci').onclick = function () { var n = Number($('cs').value); if (n > 0) trig('cef:crime:stashOp', 'cashIn', '', n); };
    if ($('co')) $('co').onclick = function () { var n = Number($('cs').value); if (n > 0) trig('cef:crime:stashOp', 'cashOut', '', n); };
    if ($('rkb')) $('rkb').onclick = function () { var n = Number($('rk').value); if (n > 0) trig('cef:crime:stashOp', 'rank', '', n); };
    $('cl').onclick = function () { trig('cef:crime:close'); };
};
window.green = function (j) {
    var d = typeof j === 'string' ? JSON.parse(j) : j;
    var b = base('wide', d.c);
    b.innerHTML = '<div class="hd"><i>🌿</i><div><b>Теплица · ' + esc(d.org) + '</b><small>Созревает ' + d.grow + ' мин · без полива дольше ' + d.water + ' мин рост останавливается</small></div></div>' +
        '<div class="cash"><div class="sum" style="font-size:16px">🌱 Семена у вас: ' + d.seeds + '</div><small style="color:rgba(255,255,255,.5);max-width:300px">Семена не продаются — их изредка находят, работая на ферме</small></div>' +
        '<div class="pots">' + d.pots.map(function (x) {
            if (x.s === 'empty') return '<div class="pot"><div class="e">🪴</div><small>Пусто</small><div style="flex:1"></div><button data-plant="' + x.i + '"' + (d.seeds ? '' : ' disabled') + '>Посадить</button></div>';
            var e = x.s === 'ripe' ? '🌿' : x.pct > 50 ? '🌱' : '🌰';
            return '<div class="pot ' + x.s + '"><div class="e">' + e + '</div><small>' + (x.s === 'ripe' ? 'Созрело!' : x.s === 'dry' ? 'Засохло — полейте' : x.pct + '% · полив ещё ' + x.wl + ' мин') + '</small><div class="bar"><i style="width:' + x.pct + '%"></i></div><small>' + esc(x.by) + '</small>' +
                (x.s === 'ripe' ? '<button data-harvest="' + x.i + '">Собрать</button>' : '<button class="ghost" data-water="' + x.i + '">Полить</button>') + '</div>';
        }).join('') + '</div>' +
        '<div class="foot"><small>Урожай с горшка — 4–7 укропа. Продавайте скупщику или складывайте в общак</small><button class="ghost" id="cl">Закрыть</button></div>';
    bind('[data-plant]', function (el) { trig('cef:crime:pot', 'plant', Number(el.dataset.plant)); });
    bind('[data-water]', function (el) { trig('cef:crime:pot', 'water', Number(el.dataset.water)); });
    bind('[data-harvest]', function (el) { trig('cef:crime:pot', 'harvest', Number(el.dataset.harvest)); });
    $('cl').onclick = function () { trig('cef:crime:close'); };
};
window.buyer = function (j) {
    var d = typeof j === 'string' ? JSON.parse(j) : j;
    var b = base('', '#6fd36a');
    b.innerHTML = '<div class="hd"><i>🤝</i><div><b>Скупщик</b><small>Нейтральная территория · спрос ' + d.demand + '% (падает при больших продажах)</small></div></div>' +
        d.list.map(function (x) { return '<div class="row' + (x.have ? '' : ' lock') + '"><span class="ic">' + ICON(x.k, x.i) + '</span><div class="n"><b>' + esc(x.n) + '</b><small>у вас: ' + x.have + '</small></div><b>' + money(x.p) + '</b><input class="qty" type="number" min="1" max="' + Math.max(1, x.have) + '" value="' + Math.max(1, x.have) + '" data-q="s' + x.k + '"' + (x.have ? '' : ' disabled') + '><button data-sell="' + x.k + '"' + (x.have ? '' : ' disabled') + '>Продать</button></div>'; }).join('') +
        '<div class="foot"><small>Мафия отдаёт 10% выручки в свой общак. Убийство на нейтральной территории — розыск</small><button class="ghost" id="cl">Уйти</button></div>';
    bind('[data-sell]', function (el) { trig('cef:crime:sell', el.dataset.sell, qv('s' + el.dataset.sell)); });
    $('cl').onclick = function () { trig('cef:crime:close'); };
};
var BSEL = 0;
window.bench = function (j) {
    var d = typeof j === 'string' ? JSON.parse(j) : j;
    var b = base('bench', d.c);
    var hv = function (c) { return (d.have[c] || { i: 0 }).i; };
    var ready = function (r) { return !r.lock && Object.keys(r.need).every(function (c) { return hv(c) >= r.need[c]; }); };
    if (!d.r[BSEL]) BSEL = 0;
    var cur = d.r[BSEL];
    var cards = d.r.map(function (r) {
        return '<div class="card' + (r.i === BSEL ? ' sel' : '') + (r.lock ? ' lock' : '') + '" data-pick="' + r.i + '">' + (r.lock ? '<span class="mf">мафия</span>' : ready(r) ? '<span class="ready"></span>' : '') + (r.c > 1 ? '<span class="cnt">×' + r.c + '</span>' : '') +
            '<div class="pic">' + ICON(r.k, r.ic) + '</div><b>' + esc(r.n.replace(/ ×\d+$/, '')) + '</b></div>';
    }).join('');
    var needs = Object.keys(cur.need).map(function (c) {
        var h = d.have[c] || { i: 0, s: 0, n: c, ic: '?' }, have = h.i, need = cur.need[c], ok = have >= need;
        return '<div class="need"><span class="ic">' + ICON(c, h.ic) + '</span><div class="nm">' + esc(h.n) + '<div class="bar" style="color:' + (ok ? '#6fd36a' : '#ff6b7a') + '"><i style="width:' + Math.min(100, have / need * 100) + '%"></i></div><small style="color:rgba(255,255,255,.4);font-size:10.5px">в общаке: ' + h.s + '</small></div><div class="v ' + (ok ? 'ok' : 'no') + '">' + have + ' / ' + need + '</div></div>';
    }).join('');
    b.innerHTML = '<div class="top"><i>🛠️</i><div><b>Верстак · ' + esc(d.org) + '</b><small>Компоненты берутся только из вашего инвентаря</small></div><div class="x" id="cl">✕</div></div>' +
        '<div class="wrap"><div class="grid">' + cards + '</div>' +
        '<div class="side"><div class="hero">' + ICON(cur.k, cur.ic) + '</div><h3>' + esc(cur.n) + '</h3><div class="sub">' + (cur.lock ? 'Рецепт знают только в мафии' : 'Сборка займёт 8 секунд') + '</div>' + needs +
        '<button class="go" id="go"' + (ready(cur) ? '' : ' disabled') + '>' + (cur.lock ? 'Недоступно' : ready(cur) ? 'Собрать' : 'Не хватает компонентов') + '</button>' +
        '<div class="note">Недостающее возьмите в общаке (E у общака). Компоненты добываются из армейских ящиков: вскройте Barracks за пределами базы, отвезите ящики на базу и сдайте в общак.</div></div></div>';
    bind('[data-pick]', function (el) { BSEL = Number(el.dataset.pick); window.bench(d); });
    $('go').onclick = function () { if (ready(cur)) trig('cef:crime:craft', cur.i); };
    $('cl').onclick = function () { trig('cef:crime:close'); };
};
document.addEventListener('keydown', function (e) { if (e.keyCode === 27) trig('cef:crime:close'); });

var CP = null, CPsel = -1, CPdef = '', CPtab = 'map', CPhAll = false;
function cpLeft(s) { return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
window.capt = function (j) {
    CP = typeof j === 'string' ? JSON.parse(j) : j;
    if (CPsel >= 0 && !CP.z[CPsel]) CPsel = -1;
    cpRender();
};
window.captMsg = function (t, ok) {
    var m = $('cpMsg'); if (!m) return;
    m.textContent = t; m.className = 'cp-msg ' + (ok ? 'ok' : 'err');
};
var CPmap = 'dark';
function cpClock() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
function cpRender() {
    var d = CP, b = base('capt tab', d.meC);
    var cnt = {}; d.z.forEach(function (z) { if (z[2]) cnt[z[2]] = (cnt[z[2]] || 0) + 1; });
    var wars = d.z.filter(function (z) { return z[5]; });
    var cells = d.z.map(function (z) {
        var o = z[2] ? d.orgs[z[2]] : null, w = z[5];
        var cls = 'cp-c' + (z[2] === d.me ? ' mine' : '') + (z[3] ? ' base' : '') + (w ? ' war' : '') + (z[6] ? ' nt' : '') + (z[0] === CPsel ? ' sel' : '') + (z[0] === d.myPos ? ' here' : '');
        var st = o ? '--oc:' + o.c : '';
        return '<div class="' + cls + '" data-z="' + z[0] + '" style="' + st + '"><span>' + z[1] + '</span>' + (z[3] ? '<i>★</i>' : w ? '<i>⚔</i>' : '') + (z[0] === d.myPos ? '<em></em>' : '') + '</div>';
    }).join('');
    var gangs = Object.keys(d.orgs).sort(function (x, y) { return (cnt[y] || 0) - (cnt[x] || 0); });
    var total = d.z.filter(function (z) { return !z[6]; }).length || 1;
    var side = '<div class="tb-sec">Банды города</div>' + gangs.map(function (k, i) {
        var o = d.orgs[k], c = cnt[k] || 0;
        return '<div class="tb-g' + (k === d.me ? ' me' : '') + '" style="--oc:' + o.c + '"><span class="tb-gr">' + (i + 1) + '</span><s></s><div><b>' + esc(o.n) + '</b><small>' + c + ' кв. · ' + ((d.onAll || {})[k] || 0) + ' онлайн' + (o.busy ? ' · <em>война</em>' : '') + '</small><div class="tb-gb"><i style="width:' + Math.round(c / total * 100) + '%"></i></div></div></div>';
    }).join('') +
        '<div class="tb-sec">В сети · ' + ((d.on || []).length) + '</div><div class="tb-on">' + (d.on || []).map(function (m) { return '<div><i></i><b>' + esc(m[0]) + '</b><small>' + esc(m[1]) + '</small></div>'; }).join('') + '</div>';
    var my = cnt[d.me] || 0;
    var cards = [
        ['🗺', 'Территорий', my + ' <small>/ ' + total + '</small>'],
        ['💰', 'Доход в час', money(my * (d.inc || 0))],
        ['🏦', 'Общак', money(d.bank || 0)],
        ['⚔', 'Идёт войн', wars.length],
        ['⏰', 'Окно каптов', d.hours[0] + ':00–' + d.hours[1] + ':00'],
        ['⏱', 'Длительность', d.min + ' мин']
    ].map(function (c) { return '<div class="tb-card"><i>' + c[0] + '</i><div><small>' + c[1] + '</small><b>' + c[2] + '</b></div></div>'; }).join('');
    var mapH = '<div class="tb-map" style="background-image:url(img/map_' + CPmap + '.jpg)"><div class="cp-grid" style="grid-template-columns:repeat(' + d.cols + ',1fr);grid-template-rows:repeat(' + d.rows + ',1fr)">' + cells + '</div>' +
        '<div class="tb-mtool"><span data-mp="dark" class="' + (CPmap === 'dark' ? 'on' : '') + '">Схема</span><span data-mp="sat" class="' + (CPmap === 'sat' ? 'on' : '') + '">Спутник</span></div>' +
        '<div class="tb-leg"><span><s class="l-mine"></s>Ваши</span><span><s class="l-base">★</s>База</span><span><s class="l-war">⚔</s>Война</span><span><s class="l-here"></s>Вы здесь</span><span><s class="l-free"></s>Ничьи</span></div></div>';
    var body = CPtab === 'hist' ? cpHist() : CPtab === 'log' ? cpLog() :
        '<div class="tb-main"><div class="tb-center">' + mapH + '<div class="tb-cards">' + cards + '</div></div><div class="side" id="cpSide"></div></div>';
    b.innerHTML = '<div class="tb-frame"><div class="tb-cam"></div><div class="tb-screen">' +
        '<div class="tb-top"><div class="tb-user"><div class="tb-av">' + esc((d.nick || '?').charAt(0)) + '</div><div><b>' + esc(d.nick || '') + '</b><small>' + esc(d.rankN || '') + ' · <span style="color:' + d.meC + '">' + esc(d.meN) + '</span></small></div></div>' +
        '<div class="tb-title"><small>ПЛАНШЕТ БАНДЫ</small><b>КОНТРОЛЬ ТЕРРИТОРИЙ</b></div>' +
        '<div class="tb-right"><div class="tb-tabs">' + [['map', 'Карта'], ['hist', 'Капты'], ['log', 'Общак']].map(function (t) { return '<span data-tb="' + t[0] + '" class="' + (CPtab === t[0] ? 'on' : '') + '">' + t[1] + '</span>'; }).join('') + '</div>' +
        '<div class="tb-clock">' + cpClock() + '</div><div class="x" id="cl">✕</div></div></div>' +
        '<div class="tb-body"><div class="tb-side">' + side + '</div><div class="tb-content">' + body + '</div></div>' +
        '</div></div>';
    bind('[data-tb]', function (el) { CPtab = el.dataset.tb; cpRender(); });
    bind('[data-ha]', function (el) { CPhAll = el.dataset.ha === '1'; cpRender(); });
    bind('[data-mp]', function (el) { CPmap = el.dataset.mp; cpRender(); });
    $('cl').onclick = function () { CPsel = -1; trig('cef:crime:close'); };
    if (CPtab !== 'map') return;
    bind('[data-z]', function (el) { CPsel = Number(el.dataset.z); CPdef = ''; cpRender(); });
    cpSide();
}
function cpLog() {
    var d = CP;
    return '<div class="cp-hist"><div class="cp-hstat"><div><b>' + money(d.bank || 0) + '</b><small>в общаке</small></div><div><b>' + money((d.z.filter(function (z) { return z[2] === d.me; }).length) * (d.inc || 0)) + '</b><small>доход с квадратов в час</small></div></div>' +
        ((d.log || []).length ? d.log.map(function (l) { return '<div class="tb-log"><span>' + cpDate(l.t) + '</span><b>' + esc(l.x) + '</b></div>'; }).join('') : '<div class="cp-empty" style="padding:40px 0">Операций пока не было</div>') + '</div>';
}
function cpSide() {
    var d = CP, s = $('cpSide');
    if (CPsel < 0) { s.innerHTML = '<div class="cp-empty">👆<br>Нажмите на квадрат на карте, чтобы выбрать цель для капта</div><div class="cp-msg" id="cpMsg"></div>'; return; }
    var z = d.z[CPsel], own = z[2] ? d.orgs[z[2]] : null, w = z[5];
    var h = '<h3>Квадрат ' + esc(z[1]) + '</h3><div class="cp-kv"><span>Владелец</span><b style="color:' + (own ? own.c : '#aaa') + '">' + (own ? esc(own.n) : 'ничей') + '</b></div>';
    var block = '';
    if (z[3]) block = 'Это база ' + (own ? own.n : '') + ' — захватить нельзя';
    else if (z[2] === d.me) block = 'Это ваш квадрат';
    else if (w) block = 'Идёт война: ' + d.orgs[w.a].n + ' против ' + (w.d ? d.orgs[w.d].n : 'нейтральных') + ' · осталось ' + cpLeft(w.left);
    else if (z[4]) block = 'Квадрат недавно захватывали. Ещё ' + z[4] + ' мин';
    if (block) { s.innerHTML = h + '<div class="cp-note">' + esc(block) + '</div><div class="cp-msg" id="cpMsg"></div>'; return; }
    h += '<h4>С кем война</h4><div class="cp-foes">';
    if (z[2]) { CPdef = z[2]; var o = d.orgs[z[2]]; h += '<div class="cp-foe on' + (o.busy ? ' busy' : '') + '"><s style="background:' + o.c + '"></s><b>' + esc(o.n) + '</b><small>' + (o.busy ? 'уже воюет' : 'владелец квадрата') + '</small></div>'; }
    else {
        h += '<div class="cp-foe' + (CPdef === '' ? ' on' : '') + '" data-f=""><s style="background:rgba(255,255,255,.3)"></s><b>Без противника</b><small>Занять ничейный квадрат</small></div>';
        Object.keys(d.orgs).forEach(function (k) { if (k === d.me) return; var o = d.orgs[k]; h += '<div class="cp-foe' + (CPdef === k ? ' on' : '') + (o.busy ? ' busy' : '') + '" data-f="' + k + '"><s style="background:' + o.c + '"></s><b>' + esc(o.n) + '</b><small>' + (o.busy ? 'уже воюет' : 'вызвать на войну') + '</small></div>'; });
    }
    h += '</div>';
    var why = !d.can ? 'Начать капт может ранг 4 и выше' : !d.hourOk ? 'Капты разрешены с ' + d.hours[0] + ':00 до ' + d.hours[1] + ':00 МСК' : '';
    if (CPsel !== d.myPos) h += '<div class="cp-note">Для старта нужно стоять на этом квадрате и иметь минимум 3 бойца на нём</div>';
    h += '<button id="cpGo"' + (why ? ' disabled' : '') + '>⚔ КАПТ</button>' + (why ? '<div class="cp-note">' + why + '</div>' : '') + '<div class="cp-msg" id="cpMsg"></div>';
    s.innerHTML = h;
    bind('[data-f]', function (el) { CPdef = el.dataset.f; cpSide(); });
    var g = $('cpGo'); if (g) g.onclick = function () { g.disabled = true; trig('cef:crime:capt', CPsel, CPdef); };
}
setInterval(function () { if (!CP || $('box').className.indexOf('capt') < 0) return; var ck = document.querySelector('.tb-clock'); if (ck) ck.textContent = cpClock(); CP.z.forEach(function (z) { if (z[5] && z[5].left > 0) z[5].left--; }); if (CPsel >= 0 && CP.z[CPsel][5]) cpSide(); }, 1000);

function cpDate(t) { var d = new Date(t); return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
function cpHist() {
    var d = CP, list = CPhAll ? (d.all || []) : (d.hist || []);
    var on = function (k) { var o = d.orgs[k]; return o ? '<b style="color:' + o.c + '">' + esc(o.n) + '</b>' : '<b style="color:#999">нейтралы</b>'; };
    var rows = list.map(function (h) {
        var mineWin = h.w === d.me, mineIn = h.a === d.me || h.d === d.me;
        var res = mineIn ? (mineWin ? '<span class="cp-res win">ПОБЕДА</span>' : '<span class="cp-res lose">ПОРАЖЕНИЕ</span>') : '<span class="cp-res">' + (h.w === h.a ? 'захват' : 'удержан') + '</span>';
        return '<div class="cp-h"><span class="cp-hd">' + cpDate(h.t) + '</span><span class="cp-hz">' + esc(h.z) + '</span><span class="cp-hv">' + on(h.a) + ' <i>против</i> ' + on(h.d) + '</span><span class="cp-hk">' + h.ka + ' : ' + h.kd + '<small>счёт ' + h.sa + ' : ' + h.sd + '</small></span><span class="cp-hw">' + on(h.w) + '</span>' + res + '</div>';
    }).join('');
    var my = (d.hist || []), wins = my.filter(function (h) { return h.w === d.me; }).length;
    return '<div class="cp-hist"><div class="cp-hstat"><div><b>' + my.length + '</b><small>каптов с участием</small></div><div><b style="color:#8fe68a">' + wins + '</b><small>побед</small></div><div><b style="color:#ff8a96">' + (my.length - wins) + '</b><small>поражений</small></div>' +
        '<div class="cp-sw"><span data-ha="0" class="' + (CPhAll ? '' : 'on') + '">Наши</span><span data-ha="1" class="' + (CPhAll ? 'on' : '') + '">Все банды</span></div></div>' +
        '<div class="cp-h cp-hh"><span>Дата</span><span>Квадрат</span><span>Стороны</span><span>Убийства</span><span>Победитель</span><span></span></div>' +
        (rows || '<div class="cp-empty" style="padding:40px 0">Каптов пока не было</div>') + '</div>';
}
