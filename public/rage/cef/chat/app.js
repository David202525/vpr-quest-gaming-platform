var MAX = 300;
var list = document.getElementById('list');
var chat = document.getElementById('chat');
var inp = document.getElementById('inp');
var toastEl = document.getElementById('toast');
var active = false;
var shown = true;
var allowed = true;
var history = [];
var hPos = -1;
var draft = '';
var stick = true;

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function normalize(text) {
    return String(text)
        .replace(/<span[^>]*color\s*:\s*#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})[^>]*>/gi, '!{#$1}')
        .replace(/<\/span>/gi, '!{#ffffff}')
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
}
function colorize(text) {
    var out = '';
    var open = false;
    var re = /!\{\s*#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\s*\}/g;
    var last = 0, m;
    text = String(text);
    while ((m = re.exec(text))) {
        out += esc(text.slice(last, m.index));
        if (open) out += '</span>';
        out += '<span style="color:#' + m[1] + '">';
        open = true;
        last = re.lastIndex;
    }
    out += esc(text.slice(last));
    if (open) out += '</span>';
    return out;
}
function plain(text) { return String(text).replace(/!\{[^}]*\}/g, ''); }

function atBottom() { return list.scrollHeight - list.scrollTop - list.clientHeight < 8; }
function toBottom() { list.scrollTop = list.scrollHeight; }

function push(text) {
    text = normalize(text);
    var keep = !active || atBottom();
    var d = document.createElement('div');
    d.className = 'msg';
    d.innerHTML = colorize(text);
    d.dataset.raw = plain(text);
    list.appendChild(d);
    while (list.children.length > MAX) list.removeChild(list.firstChild);
    if (keep) toBottom();
}

function copy(text) {
    var t = document.createElement('textarea');
    t.value = text;
    t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t);
    t.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(t);
    toastEl.classList.add('show');
    setTimeout(function () { toastEl.classList.remove('show'); }, 900);
    if (active) inp.focus();
}

list.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    var m = e.target.closest ? e.target.closest('.msg') : null;
    if (!m) return;
    var sel = window.getSelection ? String(window.getSelection()) : '';
    copy(sel || m.dataset.raw);
    m.classList.add('flash');
    setTimeout(function () { m.classList.remove('flash'); }, 400);
});

document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.keyCode === 67)) {
        var sel = window.getSelection ? String(window.getSelection()) : '';
        if (sel && document.activeElement !== inp) { e.preventDefault(); copy(sel); }
    }
});

function invoke(name, a) { if (window.mp && mp.invoke) mp.invoke(name, a); }

function setActive(on) {
    on = !!on && shown && allowed;
    if (on === active) return;
    active = on;
    chat.classList.toggle('active', active);
    invoke('focus', active);
    invoke('setTypingInChatState', active);
    if (active) {
        hPos = -1; draft = '';
        if (window.mp && mp.trigger) mp.trigger('cef:chat:opened');
        setTimeout(function () { inp.focus(); }, 10);
    } else {
        inp.value = '';
        inp.blur();
        toBottom();
        if (window.mp && mp.trigger) mp.trigger('cef:chat:closed');
    }
}

function send() {
    var v = inp.value.trim();
    if (v) {
        if (history[0] !== v) history.unshift(v);
        if (history.length > 50) history.pop();
        if (v.charAt(0) === '/') { if (v.length > 1) invoke('command', v.slice(1)); }
        else invoke('chatMessage', v);
    }
    setActive(false);
}

window.addEventListener('keydown', function (e) {
    if (!active) return;
    if (e.keyCode === 13) { e.preventDefault(); send(); }
    else if (e.keyCode === 27) { e.preventDefault(); setActive(false); }
    else if (e.keyCode === 38) {
        e.preventDefault();
        if (!history.length) return;
        if (hPos === -1) draft = inp.value;
        hPos = Math.min(history.length - 1, hPos + 1);
        inp.value = history[hPos];
    } else if (e.keyCode === 40) {
        e.preventDefault();
        if (hPos <= -1) return;
        hPos--;
        inp.value = hPos === -1 ? draft : history[hPos];
    } else if (e.keyCode === 33) { e.preventDefault(); list.scrollTop -= list.clientHeight - 30; }
    else if (e.keyCode === 34) { e.preventDefault(); list.scrollTop += list.clientHeight - 30; }
});

list.addEventListener('mousedown', function () { if (!active) return; });
list.addEventListener('mouseup', function () {
    if (!active) return;
    var sel = window.getSelection ? String(window.getSelection()) : '';
    if (!sel) inp.focus();
});

window.chatAPI = {
    push: push,
    clear: function () { list.innerHTML = ''; },
    activate: function (on) { allowed = !!on; if (!allowed) setActive(false); },
    open: function (slash) {
        if (!shown || !allowed) { if (window.mp && mp.trigger) mp.trigger('cef:chat:closed'); return; }
        setActive(true);
        if (slash) setTimeout(function () { inp.value = '/'; inp.setSelectionRange(1, 1); }, 15);
    },
    show: function (on) {
        shown = !!on;
        chat.classList.toggle('hidden', !shown);
        if (!shown) setActive(false);
    }
};

if (window.mp && mp.events && mp.events.add) {
    mp.events.add('chat:push', window.chatAPI.push);
    mp.events.add('chat:clear', window.chatAPI.clear);
    mp.events.add('chat:activate', function (on) { if (on) window.chatAPI.open(false); });
    mp.events.add('chat:show', window.chatAPI.show);
}
