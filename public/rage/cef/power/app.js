function $(id) { return document.getElementById(id); }
function trig() { if (window.mp && mp.trigger) mp.trigger.apply(mp, arguments); }
var D = null, R = [], moves = 0, timer = null, left = 0, done = false, cells = [], fails = 0;
var DIRS = [[0, -1, 1, 4], [1, 0, 2, 8], [0, 1, 4, 1], [-1, 0, 8, 2]];
function rot(m) { return ((m << 1) | (m >> 3)) & 15; }
function rotN(m, n) { n = ((n % 4) + 4) % 4; for (var i = 0; i < n; i++) m = rot(m); return m; }
function cur(i) { return rotN(D.t[i], R[i]); }
function isLock(i) { return D.locked.indexOf(i) >= 0; }

function svg(m) {
    var s = '<svg viewBox="0 0 64 64">';
    if (m & 1) s += '<line class="w" x1="32" y1="32" x2="32" y2="-2"/>';
    if (m & 2) s += '<line class="w" x1="32" y1="32" x2="66" y2="32"/>';
    if (m & 4) s += '<line class="w" x1="32" y1="32" x2="32" y2="66"/>';
    if (m & 8) s += '<line class="w" x1="32" y1="32" x2="-2" y2="32"/>';
    var n = [1, 2, 4, 8].filter(function (b) { return m & b; }).length;
    if (n !== 2 || m === 3 || m === 6 || m === 12 || m === 9) s += '<circle class="hub" cx="32" cy="32" r="' + (n >= 3 ? 9 : 6) + '"/>';
    return s + '</svg>';
}

window.powerOpen = function (j) {
    D = typeof j === 'string' ? JSON.parse(j) : j;
    R = D.t.map(function () { return 0; }); moves = 0; done = false; fails = 0;
    $('site').textContent = 'Щиток · ' + D.site;
    $('cause').textContent = 'Причина: ' + D.cause + ' · разряд ' + D.lvl;
    $('hint').textContent = 'Подсказка (' + D.hints + ')'; $('hint').disabled = D.hints <= 0;
    var b = $('board');
    b.style.gridTemplateColumns = 'repeat(' + D.W + ', 64px)';
    b.innerHTML = '';
    cells = [];
    for (var i = 0; i < D.W * D.H; i++) {
        var c = document.createElement('div');
        var empty = !D.t[i];
        c.className = 'c' + (empty ? (D.blocked.indexOf(i) >= 0 ? ' blocked' : ' empty') : '') + (isLock(i) ? ' lock' : '') + (i === D.src ? ' src' : '') + (D.houses.indexOf(i) >= 0 ? ' house' : '');
        c.dataset.i = i;
        if (!empty) {
            c.innerHTML = '<div class="rt">' + svg(D.t[i]) + '</div>' + (i === D.src ? '<div class="ico"><span>⚡</span></div>' : D.houses.indexOf(i) >= 0 ? '<div class="ico"><span>🏠</span></div>' : '');
            c.onmousedown = onClick;
        }
        b.appendChild(c); cells.push(c);
    }
    left = D.time; tick(); clearInterval(timer); timer = setInterval(tick, 1000);
    update();
};
function onClick(e) {
    if (done) return;
    var i = Number(this.dataset.i);
    if (isLock(i)) { this.parentNode.parentNode.classList.add('shake'); var pn = $('panel'); pn.classList.remove('shake'); void pn.offsetWidth; pn.classList.add('shake'); return; }
    var dir = e.button === 2 ? -1 : 1;
    R[i] = (R[i] + dir + 4) % 4; moves++;
    var rt = this.querySelector('.rt');
    rt.innerHTML = svg(cur(i));
    update();
}
document.addEventListener('contextmenu', function (e) { e.preventDefault(); });

function update() {
    var N = D.W * D.H, on = {}, st = [D.src]; on[D.src] = 1;
    while (st.length) {
        var c = st.pop(), m = cur(c);
        for (var k = 0; k < 4; k++) {
            var d = DIRS[k]; if (!(m & d[2])) continue;
            var x = c % D.W + d[0], y = Math.floor(c / D.W) + d[1];
            if (x < 0 || y < 0 || x >= D.W || y >= D.H) continue;
            var n = y * D.W + x;
            if (D.t[n] && (cur(n) & d[3]) && !on[n]) { on[n] = 1; st.push(n); }
        }
    }
    document.querySelectorAll('.spark').forEach(function (s) { s.remove(); });
    var lit = 0, loose = 0;
    for (var i = 0; i < N; i++) {
        if (!D.t[i]) continue;
        cells[i].classList.toggle('on', !!on[i]);
        if (on[i] && D.houses.indexOf(i) >= 0) lit++;
        if (!on[i]) continue;
        var m = cur(i);
        for (var k = 0; k < 4; k++) {
            var d = DIRS[k]; if (!(m & d[2])) continue;
            var x = i % D.W + d[0], y = Math.floor(i / D.W) + d[1];
            var ok = x >= 0 && y >= 0 && x < D.W && y < D.H && D.t[y * D.W + x] && (cur(y * D.W + x) & d[3]);
            if (!ok) { loose++; var sp = document.createElement('i'); sp.className = 'spark'; sp.style.left = (27 + d[0] * 27) + 'px'; sp.style.top = (27 + d[1] * 27) + 'px'; cells[i].appendChild(sp); }
        }
    }
    $('lit').textContent = lit + '/' + D.houses.length;
    $('moves').textContent = moves;
    D._ok = lit === D.houses.length && loose === 0 && Object.keys(on).length === D.t.filter(Boolean).length;
}
function tick() {
    if (done) return;
    var t = $('time');
    t.textContent = Math.floor(left / 60) + ':' + ('0' + left % 60).slice(-2);
    t.classList.toggle('warn', left <= 20);
    if (left <= 0) { fail(); return; }
    left--;
}
function fail() {
    done = true; clearInterval(timer);
    $('flash').className = 'flash bad';
    setTimeout(function () { trig('cef:power:fail'); }, 700);
}
$('go').onclick = function () {
    if (done) return;
    if (!D._ok) {
        fails++;
        var f = $('flash'); f.className = 'flash'; void f.offsetWidth; f.className = 'flash bad';
        var pn = $('panel'); pn.classList.remove('shake'); void pn.offsetWidth; pn.classList.add('shake');
        if (fails >= 3) return fail();
        left = Math.max(0, left - 15);
        return;
    }
    done = true; clearInterval(timer);
    $('flash').className = 'flash ok';
    setTimeout(function () { trig('cef:power:done', JSON.stringify(R), moves); }, 900);
};
$('hint').onclick = function () { if (!done && D.hints > 0) trig('cef:power:hint', JSON.stringify(R)); };
window.powerHint = function (i, r, leftH) {
    R[i] = (r % 4 + 4) % 4;
    cells[i].querySelector('.rt').innerHTML = svg(cur(i));
    cells[i].classList.remove('hint'); void cells[i].offsetWidth; cells[i].classList.add('hint');
    D.hints = leftH; $('hint').textContent = 'Подсказка (' + leftH + ')'; $('hint').disabled = leftH <= 0;
    update();
};
$('exit').onclick = function () { done = true; clearInterval(timer); trig('cef:power:cancel'); };
document.addEventListener('keydown', function (e) { if (e.keyCode === 27) $('exit').onclick(); });
