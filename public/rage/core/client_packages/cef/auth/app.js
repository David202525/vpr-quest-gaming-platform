var mode = 'login';
var card = document.querySelector('.card');
var go = document.getElementById('go');

function $(id) { return document.getElementById(id); }

document.querySelectorAll('.tab').forEach(function (t) {
    t.onclick = function () {
        mode = t.dataset.tab;
        document.querySelectorAll('.tab').forEach(function (x) { x.classList.toggle('active', x === t); });
        card.classList.toggle('reg', mode === 'register');
        go.textContent = mode === 'register' ? 'Создать аккаунт' : 'Войти';
        window.authError('');
    };
});

function submit() {
    var login = $('login').value.trim();
    var pass = $('pass').value;
    if (!login || !pass) return window.authError('Введите логин и пароль');
    if (mode === 'register' && pass !== $('pass2').value) return window.authError('Пароли не совпадают');
    go.disabled = true;
    window.authError('');
    if (window.mp && mp.trigger) mp.trigger(mode === 'register' ? 'cef:auth:register' : 'cef:auth:login', login, pass);
    setTimeout(function () { go.disabled = false; }, 2500);
}

go.onclick = submit;
document.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });

window.authError = function (t) { $('error').textContent = t || ''; go.disabled = false; };
window.authInit = function (social) {
    if (social) $('social').textContent = 'Social Club: ' + social;
    try { var last = localStorage.getItem('lastLogin'); if (last) $('login').value = last; } catch (e) {}
    ($('login').value ? $('pass') : $('login')).focus();
};
$('login').addEventListener('change', function () { try { localStorage.setItem('lastLogin', $('login').value.trim()); } catch (e) {} });

var spSel = null;
window.authSpawns = function (json) {
    var d = typeof json === 'string' ? JSON.parse(json) : json;
    card.style.display = 'none';
    $('spawn').classList.add('show');
    $('spName').textContent = d.name;
    $('spList').innerHTML = d.list.map(function (o) {
        return '<div class="sp-o" data-id="' + o.id + '"><span class="sp-i">' + o.i + '</span><div><b>' + o.n + '</b><small>' + o.d + '</small></div></div>';
    }).join('');
    var items = $('spList').querySelectorAll('.sp-o');
    items.forEach(function (el) {
        el.onclick = function () { spSel = el.dataset.id; items.forEach(function (x) { x.classList.toggle('on', x === el); }); $('spGo').disabled = false; };
        el.ondblclick = function () { el.onclick(); spawnGo(); };
    });
    if (items[0]) items[0].onclick();
};
function spawnGo() {
    if (!spSel) return;
    $('spGo').disabled = true;
    if (window.mp && mp.trigger) mp.trigger('cef:auth:spawn', spSel);
}
$('spGo').onclick = spawnGo;
document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && $('spawn').classList.contains('show')) { e.stopImmediatePropagation(); spawnGo(); } }, true);
