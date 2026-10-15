(function () {
    var TK = localStorage.getItem('gov_tk') || '';
    function api(o) {
        o.token = TK;
        return fetch('/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(o) })
            .then(function (r) { return r.json().then(function (j) { j._s = r.status; return j; }); });
    }
    function run(list) {
        (list || []).forEach(function (e) {
            var a = e[1] || [];
            if (e[0] === 'gov:tablet' && window.tabData) window.tabData(a[0]);
            if (e[0] === 'gov:tabSearch' && window.tabSearch) window.tabSearch(a[0]);
            if (e[0] === 'gov:tabPlate' && window.tabPlate) window.tabPlate(a[0]);
            if (e[0] === 'gov:tabToast' && window.tabToast) window.tabToast(a[0], Number(a[1]));
        });
    }
    function handle(j) {
        if (j._s === 401) { localStorage.removeItem('gov_tk'); TK = ''; loginShow(j.err); return; }
        if (j.err && window.tabToast) window.tabToast(j.err, 0);
        run(j.ev);
    }
    window.mp = {
        trigger: function (name, a) {
            if (name === 'cef:tab:act') api({ op: 'act', json: a }).then(handle);
            if (name === 'cef:tab:refresh') api({ op: 'refresh' }).then(handle);
            if (name === 'cef:tab:close') { api({ op: 'logout' }); localStorage.removeItem('gov_tk'); TK = ''; loginShow(); }
        }
    };
    function loginShow(msg) {
        var w = document.getElementById('wlog');
        if (!w) {
            w = document.createElement('div');
            w.id = 'wlog';
            w.innerHTML = '<div class="wl-box"><div class="logo-mark" style="margin:0 auto 14px;width:56px;height:56px;font-size:20px">GOV</div><h2 style="text-align:center">Служебный планшет</h2>' +
                '<div class="sub" style="text-align:center">Вход для сотрудников гос. структур штата Сан-Андреас. Используйте логин и пароль от игрового аккаунта</div>' +
                '<input class="in" id="wlL" placeholder="Логин" autocomplete="username"><input class="in" id="wlP" type="password" placeholder="Пароль" autocomplete="current-password">' +
                '<div id="wlE" class="wl-err"></div><button class="btn" id="wlB" style="width:100%">Войти</button></div>';
            document.body.appendChild(w);
            var go = function () {
                var b = document.getElementById('wlB');
                b.disabled = true;
                api({ op: 'login', login: document.getElementById('wlL').value, pass: document.getElementById('wlP').value }).then(function (j) {
                    b.disabled = false;
                    if (!j.token) { document.getElementById('wlE').textContent = j.err || 'Ошибка входа'; return; }
                    TK = j.token; localStorage.setItem('gov_tk', TK);
                    w.style.display = 'none';
                    run(j.ev);
                }).catch(function () { b.disabled = false; document.getElementById('wlE').textContent = 'Сервер недоступен'; });
            };
            document.getElementById('wlB').onclick = go;
            document.getElementById('wlP').onkeydown = function (e) { if (e.key === 'Enter') go(); };
        }
        w.style.display = 'flex';
        document.getElementById('wlE').textContent = msg || '';
    }
    document.addEventListener('DOMContentLoaded', function () {
        var st = document.createElement('style');
        st.textContent = 'body{background:#070a10}.tab{border-radius:18px}#wlog{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:#070a10;z-index:100}' +
            '.wl-box{width:380px;max-width:92vw;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:28px}.wl-box .in{width:100%;margin-bottom:10px}.wl-err{color:var(--red);font-size:12px;min-height:16px;margin-bottom:8px}' +
            '@media(max-width:820px){.tab{flex-direction:column;height:100vh;max-height:none;width:100vw;max-width:none;border:0;border-radius:0}.side{width:100%;flex-direction:row;flex-wrap:wrap;gap:6px;padding:10px}.me,.logo-s{display:none}nav{flex-direction:row;flex-wrap:wrap}nav .sep{display:none}.stats,.grid2{grid-template-columns:1fr 1fr}}';
        document.head.appendChild(st);
        if (TK) api({ op: 'refresh' }).then(handle).catch(function () { loginShow('Сервер недоступен'); });
        else loginShow();
        setInterval(function () { if (TK && !document.getElementById('modal').classList.contains('show')) api({ op: 'refresh' }).then(handle); }, 30000);
    });
})();
