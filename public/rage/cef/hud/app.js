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
