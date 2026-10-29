var MF = null, MFtab = 'biz', MFsel = '', MFflt = 'all', MFq = '';
function mfT(s) { return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
function mfOrg(k) { var o = MF.orgs[k]; return o ? '<b style="color:' + o.c + '">' + esc(o.n) + '</b>' : '<b style="color:#8a8f98">без крыши</b>'; }
function mfDate(t) { var d = new Date(t); return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
function mfAct(o) { trig('cef:mafia:act', JSON.stringify(o)); }

window.mafia = function (j) {
    MF = typeof j === 'string' ? JSON.parse(j) : j;
    if (MFsel && !MF.list.some(function (b) { return b.k === MFsel; })) MFsel = '';
    mfRender();
};
window.mafiaMsg = function (t, ok) { var m = $('mfMsg'); if (m) { m.textContent = t; m.className = 'mf-msg ' + (ok ? 'ok' : 'err'); } };

function mfRender() {
    var d = MF, b = base('mafia', d.meC);
    var mine = d.list.filter(function (x) { return x.m === d.me; }).length;
    var foes = Object.keys(d.orgs).filter(function (k) { return k !== d.me; });
    var head = '<div class="top"><i>♛</i><div><b>' + esc(d.meN) + ' · Дела семьи</b><small>Крыша над бизнесами штата · стрелы с ' + d.hours[0] + ':00 до ' + d.hours[1] + ':00 МСК</small></div><div class="x" id="cl">✕</div></div>';
    var stats = '<div class="mf-stats">' +
        '<div><small>Под крышей</small><b>' + mine + ' <em>бизн.</em></b></div>' +
        '<div><small>Доход в час</small><b class="g">' + money(d.income) + '</b></div>' +
        '<div><small>Общак семьи</small><b>' + money(d.bank) + '</b></div>' +
        '<div><small>Следующая стрела</small><b class="' + (d.atkLeft ? 'r' : 'g') + '">' + (d.atkLeft ? 'через ' + d.atkLeft + ' мин' : 'доступна') + '</b></div>' +
        '<div class="mf-rivals">' + foes.map(function (k) { var o = d.orgs[k], n = d.list.filter(function (x) { return x.m === k; }).length; return '<span><s style="background:' + o.c + '"></s>' + esc(o.n) + ' <b>' + n + '</b><i>' + o.on + ' в сети</i></span>'; }).join('') + '</div>' +
        '</div>';
    var tabs = '<div class="cp-tabs">' + [['biz', '🏢 Бизнесы штата'], ['war', '⚔ Стрелы' + (d.wars.length ? ' (' + d.wars.length + ')' : '')], ['hist', '📜 История']].map(function (t) { return '<div class="cp-tab' + (MFtab === t[0] ? ' on' : '') + '" data-mt="' + t[0] + '">' + t[1] + '</div>'; }).join('') + '</div>';
    b.innerHTML = head + stats + tabs + (MFtab === 'biz' ? mfBiz() : MFtab === 'war' ? mfWars() : mfHist());
    bind('[data-mt]', function (el) { MFtab = el.dataset.mt; mfRender(); });
    $('cl').onclick = function () { trig('cef:crime:close'); };
    if (MFtab === 'biz') mfBindBiz();
}

function mfBiz() {
    var d = MF, q = MFq.toLowerCase();
    var flt = [['all', 'Все'], ['mine', 'Наши'], ['free', 'Без крыши'], ['enemy', 'Чужие']];
    var list = d.list.filter(function (b) {
        if (MFflt === 'mine' && b.m !== d.me) return false;
        if (MFflt === 'free' && b.m) return false;
        if (MFflt === 'enemy' && (!b.m || b.m === d.me)) return false;
        return !q || b.n.toLowerCase().indexOf(q) >= 0 || b.kn.toLowerCase().indexOf(q) >= 0;
    }).sort(function (a, b) { return (b.w ? 1 : 0) - (a.w ? 1 : 0) || a.d - b.d; });
    var rows = list.map(function (b) {
        var o = b.m ? d.orgs[b.m] : null;
        var st = b.w ? '<span class="mf-tag war">' + (b.w.live ? 'ИДЁТ ВОЙНА ' : 'СТРЕЛА ') + mfT(b.w.left) + '</span>' : b.cd ? '<span class="mf-tag cd">откат ' + b.cd + ' мин</span>' : b.m === d.me ? '<span class="mf-tag mine">наша крыша</span>' : '';
        return '<div class="mf-row' + (b.k === MFsel ? ' sel' : '') + '" data-b="' + esc(b.k) + '" style="--oc:' + (o ? o.c : 'rgba(255,255,255,.15)') + '">' +
            '<span class="mf-ic">' + b.i + '</span><span class="mf-n"><b>' + esc(b.n) + '</b><small>' + esc(b.kn) + (b.own ? ' · владелец ' + esc(b.own) : ' · без владельца') + '</small></span>' +
            '<span class="mf-own">' + (o ? '<s style="background:' + o.c + '"></s>' + esc(o.n) : '<i>свободен</i>') + '</span>' +
            '<span class="mf-inc">' + money(b.inc) + '<small>/час</small></span><span class="mf-d">' + (b.d > 1000 ? (b.d / 1000).toFixed(1) + ' км' : b.d + ' м') + '</span>' + st + '</div>';
    }).join('');
    return '<div class="mf-wrap"><div class="mf-left"><div class="mf-bar"><input id="mfQ" placeholder="Поиск бизнеса" value="' + esc(MFq) + '"><div class="cp-sw">' + flt.map(function (f) { return '<span data-mf="' + f[0] + '" class="' + (MFflt === f[0] ? 'on' : '') + '">' + f[1] + '</span>'; }).join('') + '</div></div>' +
        '<div class="mf-list">' + (rows || '<div class="cp-empty" style="padding:50px 0">Ничего не найдено</div>') + '</div></div><div class="side" id="mfSide"></div></div>';
}
function mfBindBiz() {
    bind('[data-mf]', function (el) { MFflt = el.dataset.mf; mfRender(); });
    bind('[data-b]', function (el) { MFsel = el.dataset.b; mfRender(); });
    var q = $('mfQ');
    q.oninput = function () { MFq = q.value; var pos = q.selectionStart; mfRender(); var n = $('mfQ'); n.focus(); n.setSelectionRange(pos, pos); };
    mfSide();
}
function mfSide() {
    var d = MF, s = $('mfSide');
    var b = d.list.find(function (x) { return x.k === MFsel; });
    if (!b) { s.innerHTML = '<div class="cp-empty">🎯<br>Выберите бизнес в списке.<br><small>Крыша приносит долю в общак каждый час. Забрать чужую крышу можно только через стрелу.</small></div><div class="mf-msg" id="mfMsg"></div>'; return; }
    var o = b.m ? d.orgs[b.m] : null;
    var h = '<div class="mf-hd"><span>' + b.i + '</span><div><h3>' + esc(b.n) + '</h3><small>' + esc(b.kn) + '</small></div></div>' +
        '<div class="cp-kv"><span>Крыша</span>' + (o ? '<b style="color:' + o.c + '">' + esc(o.n) + '</b>' : '<b style="color:#8a8f98">нет</b>') + '</div>' +
        '<div class="cp-kv"><span>Доля в общак</span><b>' + money(b.inc) + ' / час</b></div>' +
        '<div class="cp-kv"><span>Владелец бизнеса</span><b>' + (b.own ? esc(b.own) : 'государство') + '</b></div>' +
        '<div class="cp-kv"><span>До точки</span><b>' + (b.d > 1000 ? (b.d / 1000).toFixed(1) + ' км' : b.d + ' м') + '</b></div>';
    var block = '';
    if (b.w) block = (b.w.live ? 'Идёт война: ' : 'Стрела забита: ') + (d.orgs[b.w.a] ? d.orgs[b.w.a].n : '') + ' против ' + (b.w.d && d.orgs[b.w.d] ? d.orgs[b.w.d].n : 'свободного бизнеса') + ' · ' + mfT(b.w.left);
    else if (b.m === d.me) block = 'Бизнес под вашей крышей. Если на него забьют стрелу — будьте на месте вовремя';
    else if (b.cd) block = 'Бизнес недавно переходил из рук в руки. Стрела будет доступна через ' + b.cd + ' мин';
    if (block) h += '<div class="cp-note">' + esc(block) + '</div>';
    else {
        var why = !d.can ? 'Забить стрелу может капореджиме и выше' : !d.hourOk ? 'Стрелы разрешены с ' + d.hours[0] + ':00 до ' + d.hours[1] + ':00 МСК' : d.atkLeft ? 'Следующая стрела через ' + d.atkLeft + ' мин' : (o && o.busy) ? o.n + ' уже заняты другой войной' : '';
        h += '<div class="mf-rules"><b>Как проходит стрела</b><span>1. Сбор: ' + (b.m ? d.prep : 5) + ' мин, обе семьи получают метку</span><span>2. Война: ' + (b.m ? d.live : 5) + ' мин в радиусе ' + d.r + ' м от бизнеса</span><span>3. Очки: +1 каждые 9 с за перевес людей в зоне, +2 за убийство врага</span><span>4. Победитель забирает крышу, затем откат 3 часа</span></div>';
        h += '<button id="mfGo"' + (why ? ' disabled' : '') + '>' + (b.m ? '⚔ ЗАБИТЬ СТРЕЛУ' : '🤝 ВЗЯТЬ ПОД КРЫШУ') + '</button>' + (why ? '<div class="cp-note">' + esc(why) + '</div>' : '');
    }
    h += '<button class="mf-gps" id="mfGps">📍 Метка на карте</button><div class="mf-msg" id="mfMsg"></div>';
    s.innerHTML = h;
    var g = $('mfGo'); if (g) g.onclick = function () { g.disabled = true; mfAct({ op: 'declare', k: b.k }); };
    $('mfGps').onclick = function () { mfAct({ op: 'gps', k: b.k }); };
}
function mfWars() {
    var d = MF;
    if (!d.wars.length) return '<div class="mf-pad"><div class="cp-empty" style="padding:70px 0">🕊<br>Сейчас в штате спокойно — стрел нет</div></div>';
    return '<div class="mf-pad mf-wars">' + d.wars.map(function (w) {
        var A = d.orgs[w.a], D = w.d ? d.orgs[w.d] : null, tot = Math.max(1, w.sa + w.sd);
        return '<div class="mf-war' + (w.live ? ' live' : '') + '"><div class="mf-wt"><b>' + esc(w.n) + '</b><span class="mf-tag ' + (w.live ? 'war' : 'cd') + '">' + (w.live ? 'ВОЙНА · ' : 'СБОР · ') + mfT(w.left) + '</span></div>' +
            '<div class="mf-vs"><div style="color:' + A.c + '">' + esc(A.n) + '<b>' + w.sa + '</b><small>убийств ' + w.ka + '</small></div><i>VS</i><div style="color:' + (D ? D.c : '#8a8f98') + '">' + (D ? esc(D.n) : 'без крыши') + '<b>' + w.sd + '</b><small>убийств ' + w.kd + '</small></div></div>' +
            '<div class="mf-prog"><u style="width:' + (w.sa / tot * 100) + '%;background:' + A.c + '"></u><u style="width:' + (w.sd / tot * 100) + '%;background:' + (D ? D.c : '#555') + '"></u></div>' +
            '<small class="mf-by">Стрелу забил ' + esc(w.by) + '</small></div>';
    }).join('') + '</div>';
}
function mfHist() {
    var d = MF;
    var rows = d.hist.map(function (h) {
        var mineIn = h.a === d.me || h.d === d.me, win = h.w === d.me;
        return '<div class="cp-h"><span class="cp-hd">' + mfDate(h.t) + '</span><span class="cp-hz" style="font-size:12px">' + esc(h.n) + '</span><span class="cp-hv">' + mfOrg(h.a) + ' <i>против</i> ' + mfOrg(h.d) + '</span><span class="cp-hk">' + h.ka + ' : ' + h.kd + '<small>очки ' + h.sa + ' : ' + h.sd + '</small></span><span class="cp-hw">' + mfOrg(h.w) + '</span>' +
            (mineIn ? '<span class="cp-res ' + (win ? 'win' : 'lose') + '">' + (win ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ') + '</span>' : '<span class="cp-res">—</span>') + '</div>';
    }).join('');
    return '<div class="cp-hist" style="min-height:420px"><div class="cp-h cp-hh"><span>Дата</span><span>Бизнес</span><span>Стороны</span><span>Убийства</span><span>Крыша</span><span></span></div>' + (rows || '<div class="cp-empty" style="padding:40px 0">Войн за бизнес ещё не было</div>') + '</div>';
}
setInterval(function () {
    if (!MF || $('box').className.indexOf('mafia') < 0) return;
    var ch = false;
    MF.list.forEach(function (b) { if (b.w && b.w.left > 0) { b.w.left--; ch = true; } });
    MF.wars.forEach(function (w) { if (w.left > 0) { w.left--; ch = true; } });
    if (!ch) return;
    if (MFtab === 'war') mfRender();
    else if (MFtab === 'biz' && document.activeElement !== $('mfQ')) { document.querySelectorAll('.mf-row .mf-tag.war').forEach(function (el) { var b = MF.list.find(function (x) { return x.k === el.closest('[data-b]').dataset.b; }); if (b && b.w) el.textContent = (b.w.live ? 'ИДЁТ ВОЙНА ' : 'СТРЕЛА ') + mfT(b.w.left); }); }
}, 1000);
setInterval(function () { if (MF && $('box').className.indexOf('mafia') >= 0) mfAct({ op: 'refresh' }); }, 15000);
