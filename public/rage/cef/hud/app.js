function $(id) { return document.getElementById(id); }

var WEATHER = {
    EXTRASUNNY: ['☀️', 4], CLEAR: ['🌤️', 2], NEUTRAL: ['🌤️', 1], SMOG: ['🌫️', 1], FOGGY: ['🌫️', -2],
    OVERCAST: ['☁️', -2], CLOUDS: ['⛅', 0], CLEARING: ['🌦️', -3], RAIN: ['🌧️', -5],
    THUNDER: ['⛈️', -6], SNOW: ['🌨️', -18], BLIZZARD: ['❄️', -22], SNOWLIGHT: ['🌨️', -14],
    XMAS: ['❄️', -12], HALLOWEEN: ['🌫️', -4]
};

function fmtMoney(n) {
    return String(Math.floor(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '$';
}

function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
}

window.hudUpdate = function (d) {
    if (d.id !== undefined) $('pid').textContent = d.id;
    if (d.online !== undefined) $('online').textContent = d.online;
    if (d.dt) $('dt').textContent = d.dt;
    if (d.money !== undefined) $('money').textContent = fmtMoney(d.money);
    if (d.zone !== undefined) $('zone').textContent = d.zone || '—';
    if (d.street !== undefined) $('street').textContent = d.street || '—';
    if (d.ammo !== undefined) {
        if (d.ammo === null) $('weapon').classList.add('hide');
        else { $('weapon').classList.remove('hide'); $('ammo').textContent = d.ammo; }
    }
    if (d.weather) {
        var w = WEATHER[String(d.weather).toUpperCase()] || WEATHER.CLEAR;
        var hour = d.hour !== undefined ? d.hour : 12;
        var base = hour >= 6 && hour < 20 ? 17 : 11;
        var t = base + w[1];
        if (hour >= 20 || hour < 6) {
            if (w[0] === '☀️' || w[0] === '🌤️') w = ['🌙', w[1]];
        }
        $('wico').textContent = w[0];
        $('temp').textContent = (t > 0 ? '+' : '') + t + ' C°';
    }
};

window.hudQuest = function (title, tasks) {
    if (!title) { $('quest').classList.add('hide'); return; }
    $('quest').classList.remove('hide');
    $('qtitle').textContent = title;
    $('qtasks').innerHTML = (tasks || []).map(function (t) {
        var text = typeof t === 'string' ? t : t.text;
        var done = typeof t === 'object' && t.done;
        return '<div class="task' + (done ? ' done' : '') + '"><span class="t-ico">!</span><span>' + esc(text) + '</span></div>';
    }).join('');
};

window.hudNotify = function (type, text, ms) {
    ms = ms || 5000;
    var cls = type === 'error' ? 'error' : type === 'warn' ? 'warn' : 'ok';
    var icon = cls === 'error' ? '!' : cls === 'warn' ? 'i' : '✓';
    var el = document.createElement('div');
    el.className = 'note ' + cls;
    el.innerHTML = '<span class="n-ico">' + icon + '</span><span>' + esc(text) + '</span><span class="n-bar"></span>';
    el.querySelector('.n-bar').style.animation = 'barRun ' + ms + 'ms linear forwards';
    var box = $('notes');
    box.appendChild(el);
    while (box.children.length > 4) box.removeChild(box.firstChild);
    setTimeout(function () {
        el.classList.add('out');
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
    }, ms);
};

window.hudVisible = function (on) {
    document.body.classList.toggle('hidden', !on);
};

window.hudQuest('', []);

var SP = { max: 240, a0: 135, a1: 405 };
function spPt(a, r) { var t = (a - 90) * Math.PI / 180; return [100 + r * Math.cos(t), 100 + r * Math.sin(t)]; }
function spArcD(a0, a1, r) {
    var p0 = spPt(a0, r), p1 = spPt(a1, r);
    return 'M' + p0[0].toFixed(2) + ' ' + p0[1].toFixed(2) + ' A' + r + ' ' + r + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' 1 ' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2);
}
var SPA = { s0: 225, s1: 420, f0: 432, f1: 492, h0: 500, h1: 560 };
function spSet(id, a0, a1, r, pct) {
    pct = Math.max(0, Math.min(1, pct));
    $(id).setAttribute('d', pct <= 0.001 ? '' : spArcD(a0, a0 + (a1 - a0) * pct, r));
}
(function () {
    $('spTrack').setAttribute('d', spArcD(SPA.s0, SPA.s1, 86));
    $('fuTrack').setAttribute('d', spArcD(SPA.f0, SPA.f1, 86));
    $('hpTrack').setAttribute('d', spArcD(SPA.h0, SPA.h1, 86));
    var t = '';
    for (var v = 0; v <= SP.max; v += 40) {
        var a = SPA.s0 + (SPA.s1 - SPA.s0) * v / SP.max;
        var p = spPt(a, 72);
        t += '<text x="' + p[0].toFixed(1) + '" y="' + (p[1] + 2.5).toFixed(1) + '">' + v + '</text>';
    }
    $('spTicks').innerHTML = t;
})();

window.hudSpeedo = function (d) {
    var el = $('speedo');
    if (!d) { el.classList.remove('on'); return; }
    el.classList.add('on');
    var s = Math.max(0, Math.round(d.speed));
    var str = String(s);
    $('spVal').textContent = str;
    $('spGhost').textContent = str.length < 3 ? '000'.slice(str.length) : '';
    spSet('spArc', SPA.s0, SPA.s1, 86, s / SP.max);
    spSet('fuArc', SPA.f0, SPA.f1, 86, d.fuel / 100);
    spSet('hpArc', SPA.h0, SPA.h1, 86, d.hp / 100);
    $('fuVal').textContent = Math.round(d.fuel);
    $('hpVal').textContent = Math.round(d.hp);
    $('fuVal').parentNode.classList.toggle('low', d.fuel < 15);
    $('hpVal').parentNode.classList.toggle('low', d.hp < 30);
    var g = '';
    var gear = d.gear;
    for (var i = 1; i <= 5; i++) g += i === gear ? '<b>' + i + '</b>' : String(i);
    $('spGears').innerHTML = (gear === 0 && s > 1 ? '<b>R</b>' : 'R') + ' ' + g;
    $('iLock').classList.toggle('on', !!d.lock);
    $('iLight').classList.toggle('on', !!d.light);
    $('iEngine').classList.toggle('on', !!d.engine);
    $('iEngine').classList.toggle('warn', d.hp < 30);
    $('iBelt').classList.toggle('on', !!d.belt);
};
