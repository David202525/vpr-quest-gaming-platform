function $(id) { return document.getElementById(id); }
function trig() { if (window.mp && mp.trigger) mp.trigger.apply(mp, arguments); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function money(n) { return '$' + String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function dt(t) { var d = new Date(t); return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }

var D = null, F = { type: 'family', n: '', tag: '', c: '' };
window.fam = function (j) { D = typeof j === 'string' ? JSON.parse(j) : j; if (!F.c) F.c = D.colors[5]; render(); };
window.famMsg = function (t, ok) { var m = $('msg'); if (!m) return; m.textContent = t; m.className = 'msg ' + (ok ? 'ok' : 'err'); var g = $('go'); if (g) g.disabled = false; };
document.addEventListener('keydown', function (e) { if (e.keyCode === 27) trig('cef:fam:close'); });

function head(t, s) {
    return '<div class="hd"><div class="seal">🏛</div><div><b>' + t + '</b><small>' + s + '</small></div><div class="x" id="cl">✕</div></div>';
}
function render() { if (D.fam) manage(); else form(); $('cl').onclick = function () { trig('cef:fam:close'); }; }

function form() {
    var t = D.types.find(function (x) { return x.k === F.type; }) || D.types[0];
    var fee = t.price + Math.round(t.price * D.tax);
    var have = D.cash + D.bank;
    var types = D.types.map(function (x) {
        return '<div class="ty' + (x.k === F.type ? ' on' : '') + '" data-t="' + x.k + '"><i>' + x.i + '</i><b>' + esc(x.n) + '</b><small>' + esc(x.d) + '</small>' +
            '<div class="ty-f"><span>👥 до ' + x.slots + '</span><span>🎖 ' + x.ranks + ' рангов</span></div><em>' + money(x.price) + '</em></div>';
    }).join('');
    var cols = D.colors.map(function (c) { return '<s data-c="' + c + '" class="' + (c === F.c ? 'on' : '') + '" style="background:' + c + '"></s>'; }).join('');
    var tagV = (F.tag || 'TAG').toUpperCase();
    $('box').innerHTML = head('РЕГИСТРАЦИЯ ОРГАНИЗАЦИИ', 'Мэрия Лос-Сантоса · заполните основную информацию') +
        '<div class="body"><div class="lft">' +
        '<div class="lbl">Тип организации</div><div class="types">' + types + '</div>' +
        '<div class="row2"><label><span>Название организации</span><input id="fn" maxlength="24" placeholder="Например, Corleone" value="' + esc(F.n) + '"></label>' +
        '<label class="sm"><span>Тег</span><input id="ft" maxlength="4" placeholder="TAG" value="' + esc(F.tag) + '"></label></div>' +
        '<div class="lbl">Основной цвет</div><div class="cols">' + cols + '</div>' +
        '</div><div class="rgt">' +
        '<div class="lbl">Предпросмотр</div>' +
        '<div class="pv" style="--c:' + F.c + '"><div class="pv-top"><span class="pv-tag">' + esc(tagV) + '</span><span>' + t.i + ' ' + esc(t.n) + '</span></div>' +
        '<div class="pv-n">' + esc(F.n || 'Название организации') + '</div>' +
        '<div class="pv-chat"><b style="color:' + F.c + '">[' + esc(tagV) + '] ' + esc(t.ranks ? 'Глава' : '') + ' Вы:</b> всем привет!</div>' +
        '<div class="pv-apps"><div><i>👥</i>Состав</div><div><i>⚙️</i>Ранги</div><div><i>💰</i>Общак</div></div></div>' +
        '<div class="bill"><div><span>Регистрация</span><b>' + money(t.price) + '</b></div><div><span>Госпошлина ' + Math.round(D.tax * 100) + '%</span><b>' + money(fee - t.price) + '</b></div>' +
        '<div class="tot"><span>Стоимость создания</span><b>' + money(fee) + '</b></div><div class="have"><span>У вас (нал + банк)</span><b class="' + (have >= fee ? 'g' : 'r') + '">' + money(have) + '</b></div></div>' +
        (D.pass ? '' : '<div class="warn">Нужен паспорт — оформите у паспортного стола в мэрии</div>') +
        '<button id="go"' + (have >= fee && D.pass ? '' : ' disabled') + '>Зарегистрировать</button><div class="msg" id="msg"></div>' +
        '</div></div>';
    document.querySelectorAll('[data-t]').forEach(function (el) { el.onclick = function () { F.type = el.dataset.t; form(); bindClose(); }; });
    document.querySelectorAll('[data-c]').forEach(function (el) { el.onclick = function () { F.c = el.dataset.c; form(); bindClose(); }; });
    $('fn').oninput = function () { F.n = this.value; document.querySelector('.pv-n').textContent = F.n || 'Название организации'; };
    $('ft').oninput = function () { this.value = this.value.toUpperCase().replace(/[^A-ZА-ЯЁ0-9]/g, ''); F.tag = this.value; var v = F.tag || 'TAG'; document.querySelector('.pv-tag').textContent = v; document.querySelector('.pv-chat b').textContent = '[' + v + '] Глава Вы:'; };
    $('go').onclick = function () { this.disabled = true; trig('cef:fam:create', JSON.stringify(F)); };
}
function bindClose() { $('cl').onclick = function () { trig('cef:fam:close'); }; }

function manage() {
    var f = D.fam;
    var list = f.members.map(function (m) {
        var btn = f.mgr && !m.head ? '<div class="mb"><span data-a="up" data-id="' + m.id + '" title="Повысить">▲</span><span data-a="down" data-id="' + m.id + '" title="Понизить">▼</span><span data-a="kick" data-id="' + m.id + '" class="r" title="Исключить">✕</span>' + (f.head ? '<span data-a="head" data-id="' + m.id + '" title="Сделать главой">👑</span>' : '') + '</div>' : '';
        return '<div class="mem"><i class="' + (m.on ? 'on' : '') + '"></i><div><b>' + (m.head ? '👑 ' : '') + esc(m.n) + '</b><small>' + esc(m.rn) + '</small></div>' + btn + '</div>';
    }).join('');
    var log = (f.log || []).map(function (l) { return '<div class="lg"><span>' + dt(l.t) + '</span>' + esc(l.x) + '</div>'; }).join('') || '<div class="lg">Пока пусто</div>';
    $('box').innerHTML = head('[' + esc(f.tag) + '] ' + esc(f.n), f.ti + ' ' + esc(f.type) + ' · глава ' + esc(f.ownerN) + ' · ваш ранг: ' + esc(f.myRank)) +
        '<div class="body" style="--c:' + f.c + '"><div class="lft">' +
        '<div class="stats"><div><small>Участников</small><b>' + f.members.length + ' / ' + f.slots + '</b></div><div><small>Онлайн</small><b>' + f.members.filter(function (m) { return m.on; }).length + '</b></div><div><small>Общак</small><b>' + money(f.bank) + '</b></div></div>' +
        '<div class="lbl">Состав</div><div class="mems">' + list + '</div></div>' +
        '<div class="rgt"><div class="lbl">Команды</div><div class="cmds"><code>/fam текст</code> чат семьи<br><code>/finv id</code> пригласить<br><code>/fbank сумма</code> в общак<br><code>/fmenu</code> это меню</div>' +
        '<div class="lbl">Журнал</div><div class="log">' + log + '</div>' +
        '<button class="ghost" id="lv">' + (f.head && f.members.length <= 1 ? 'Распустить организацию' : 'Выйти из семьи') + '</button><div class="msg" id="msg"></div></div></div>';
    document.querySelectorAll('[data-a]').forEach(function (el) { el.onclick = function () { trig('cef:fam:act', el.dataset.a, Number(el.dataset.id)); }; });
    $('lv').onclick = function () { if (this.dataset.ok) trig('cef:fam:act', 'leave', 0); else { this.dataset.ok = 1; this.textContent = 'Точно? Нажмите ещё раз'; } };
}
