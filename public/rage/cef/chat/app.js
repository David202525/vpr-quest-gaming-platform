var MAX = 300;
var list = document.getElementById('list');
var chat = document.getElementById('chat');
var inp = document.getElementById('inp');
var toastEl = document.getElementById('toast');
var active = false;
var shown = true;
var allowed = true;
var locked = true;
var hist = [];
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
    return out.replace(/!\{badge:([1-9])\}/g, '<img class="badge" src="../hud/badges/$1.png">');
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
    d.dataset.at = Date.now();
    list.appendChild(d);
    while (list.children.length > MAX) list.removeChild(list.firstChild);
    fadeTick();
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
function trig(name, a) { if (window.mp && mp.trigger) mp.trigger(name, a); }

function setActive(on) {
    on = !!on && shown && allowed && !locked;
    if (on === active) return;
    active = on;
    chat.classList.toggle('active', active);
    setTimeout(fadeTick, 0);
    invoke('focus', active);
    invoke('setTypingInChatState', active);
    trig('cef:chat:state', active);
    if (active) {
        hPos = -1; draft = '';
        setTimeout(function () { inp.focus(); }, 10);
    } else {
        inp.value = '';
        inp.blur();
        toBottom();
    }
}

function send() {
    var v = inp.value.trim();
    setActive(false);
    if (!v) return;
    try {
        if (hist[0] !== v) hist.unshift(v);
        if (hist.length > 50) hist.pop();
    } catch (e) {}
    if (v.charAt(0) === '/') { if (v.length > 1) invoke('command', v.slice(1)); }
    else invoke('chatMessage', v);
}

document.addEventListener('keyup', function (e) {
    if (active || !shown || !allowed || locked) return;
    if (e.keyCode === 84) { e.preventDefault(); setActive(true); }
    else if (e.keyCode === 191) {
        e.preventDefault();
        setActive(true);
        setTimeout(function () { if (active) { inp.value = '/'; inp.setSelectionRange(1, 1); } }, 15);
    }
});

document.addEventListener('keydown', function (e) {
    if (!active) return;
    if (e.keyCode === 13 || e.key === 'Enter') { e.preventDefault(); send(); }
    else if (e.keyCode === 27) { e.preventDefault(); setActive(false); }
    else if (e.keyCode === 38) {
        e.preventDefault();
        if (!hist.length) return;
        if (hPos === -1) draft = inp.value;
        hPos = Math.min(hist.length - 1, hPos + 1);
        inp.value = hist[hPos];
    } else if (e.keyCode === 40) {
        e.preventDefault();
        if (hPos <= -1) return;
        hPos--;
        inp.value = hPos === -1 ? draft : hist[hPos];
    } else if (e.keyCode === 33) { e.preventDefault(); list.scrollTop -= list.clientHeight - 30; }
    else if (e.keyCode === 34) { e.preventDefault(); list.scrollTop += list.clientHeight - 30; }
});

list.addEventListener('mouseup', function () {
    if (!active) return;
    var sel = window.getSelection ? String(window.getSelection()) : '';
    if (!sel) inp.focus();
});

var chatAPI = {
    push: push,
    clear: function () { list.innerHTML = ''; },
    close: function () { setActive(false); },
    lock: function (on) {
        locked = !!on;
        if (locked) setActive(false);
        chat.classList.toggle('hidden', !shown || locked);
    },
    activate: function (on) {
        allowed = !!on;
        if (!allowed) setActive(false);
    },
    show: function (on) {
        shown = !!on;
        chat.classList.toggle('hidden', !shown || locked);
        if (!shown) setActive(false);
    }
};
window.chatAPI = chatAPI;
chat.classList.add('hidden');

if (window.mp && mp.events) {
    mp.events.add('chat:push', chatAPI.push);
    mp.events.add('chat:clear', chatAPI.clear);
    mp.events.add('chat:activate', chatAPI.activate);
    mp.events.add('chat:show', chatAPI.show);
    mp.events.add('chat:lock', chatAPI.lock);
}

var FADE_MS = 15000;
function fadeTick() {
    var now = Date.now();
    for (var i = 0; i < list.children.length; i++) {
        var m = list.children[i];
        m.classList.toggle('old', !active && now - Number(m.dataset.at || 0) > FADE_MS);
    }
}
setInterval(fadeTick, 1000);
