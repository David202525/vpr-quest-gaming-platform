mp.nametags.enabled = false;

var names = {};
var FEMALE = mp.game.joaat('mp_f_freemode_01');
var intBrowser = mp.browsers.new('package://cef/social/index.html');
var intTarget = null;
var offerUntil = 0;
global.intOpen = false;

mp.events.add('social:names', function (json) {
    try { names = JSON.parse(json) || {}; } catch (e) { names = {}; }
});

function sidOf(p) { return Number(p.getVariable('sid')) || 0; }
function titleOf(p) {
    var s = sidOf(p);
    if (s && names[s]) return names[s];
    return p.model === FEMALE ? 'Гражданка' : 'Гражданин';
}
function intExec(code) { if (intBrowser) intBrowser.execute(code); }

var micTex = false;
function micDraw(x, y, z, k) {
    if (!micTex) { mp.game.graphics.requestStreamedTextureDict('mpleaderboard', true); micTex = mp.game.graphics.hasStreamedTextureDictLoaded('mpleaderboard'); if (!micTex) return; }
    var sc = mp.game.graphics.world3dToScreen2d(new mp.Vector3(x, y, z));
    if (!sc) return;
    var res = mp.game.graphics.getActiveScreenResolution(0, 0);
    var ar = res && res.x ? res.y / res.x : 0.5625;
    var h = 0.034 * (k / 0.42);
    mp.game.graphics.drawSprite('mpleaderboard', 'leaderboard_audio_3', sc.x, sc.y, h * ar, h, 0, 70, 230, 110, 245, false);
}
mp.events.add('render', function () {
    if (global.authOpen || global.creatorOpen) return;
    var me = mp.players.local;
    var mp0 = me.position;
    mp.players.forEachInStreamRange(function (p) {
        if (p === me || !p.handle || p.dimension !== me.dimension) return;
        var s = sidOf(p);
        if (!s) return;
        if (p.getAlpha && p.getAlpha() < 50) return;
        var pos = p.position;
        var d = mp.game.system.vdist(mp0.x, mp0.y, mp0.z, pos.x, pos.y, pos.z);
        if (d > 20) return;
        if (!me.hasClearLosToEntity(p.handle, 17)) return;
        var head = p.getBoneCoords(12844, 0, 0, 0);
        var z = (head ? head.z : pos.z + 0.7) + 0.38 + d * 0.012;
        var k = Math.max(0.24, 0.42 - d * 0.009);
        var known = !!names[s];
        mp.game.graphics.drawText((known ? names[s] + ' ' : '') + '[' + p.remoteId + ']', [pos.x, pos.y, z], { font: 4, color: known ? [255, 255, 255, 235] : [210, 210, 220, 225], scale: [k, k], outline: true, centre: true });
        mp.game.graphics.drawText('#' + s, [pos.x, pos.y, z - 0.1 - d * 0.004], { font: 4, color: [193, 140, 255, 235], scale: [k * 0.85, k * 0.85], outline: true, centre: true });
        var spk = false;
        try { spk = !!p.isVoiceActive; } catch (e) {}
        if (!spk) spk = !!p.getVariable('talk');
        if (spk) micDraw(pos.x, pos.y, z + 0.13 + d * 0.004, k);
    });
});

function nearest() {
    var me = mp.players.local;
    var best = null, bd = 3;
    mp.players.forEachInStreamRange(function (p) {
        if (p === me || !p.handle || p.dimension !== me.dimension || !sidOf(p)) return;
        var d = mp.game.system.vdist(me.position.x, me.position.y, me.position.z, p.position.x, p.position.y, p.position.z);
        if (d < bd) { bd = d; best = p; }
    });
    return best;
}

global.intCloseG = function () { intClose(); };
function intClose() {
    if (!global.intOpen) return;
    global.intOpen = false;
    intTarget = null;
    intSolo = false;
    intExec('window.intClose && window.intClose();');
    if (typeof cursorSync === 'function') cursorSync(); else mp.gui.cursor.show(false, false);
    mp.gui.chat.activate(true);
}

var SEAT_DOORS = ['door_pside_f', 'door_dside_r', 'door_pside_r'];
function nearestVehicle(max) {
    var me = mp.players.local, best = null, bd = max;
    mp.vehicles.forEachInStreamRange(function (v) {
        if (!v.handle || v.dimension !== me.dimension) return;
        var d = mp.game.system.vdist(me.position.x, me.position.y, me.position.z, v.position.x, v.position.y, v.position.z);
        if (d < bd) { bd = d; best = v; }
    });
    return best ? { v: best, d: bd } : null;
}
function enterAsPassenger() {
    var me = mp.players.local;
    if (me.getVariable('cuffed')) return false;
    var nv = nearestVehicle(5.5);
    if (!nv) {
        var big = nearestVehicle(14);
        if (big) { var mx = 0; try { mx = big.v.getMaxNumberOfPassengers(); } catch (e) {} if (mx >= 5) nv = big; }
    }
    if (!nv) return false;
    var pl = nearest();
    if (pl) {
        var dp = mp.game.system.vdist(me.position.x, me.position.y, me.position.z, pl.position.x, pl.position.y, pl.position.z);
        if (dp < 1.6 && dp < nv.d - 1) return false;
    }
    var v = nv.v, max = 0;
    try { max = v.getMaxNumberOfPassengers(); } catch (e) { max = 1; }
    if (max < 1) { mp.events.call('hud:notify', 'warn', 'В этом транспорте нет мест для пассажира', 2500); return true; }
    var best = -2, bd = 1e9;
    for (var s = 0; s < max; s++) {
        var free = true;
        try { free = v.isSeatFree(s); } catch (e) {}
        if (!free) continue;
        var d = 0;
        try {
            var bi = SEAT_DOORS[s] ? v.getBoneIndexByName(SEAT_DOORS[s]) : -1;
            if (bi >= 0) { var bp = v.getWorldPositionOfBone(bi); d = mp.game.system.vdist(me.position.x, me.position.y, me.position.z, bp.x, bp.y, bp.z); }
            else d = 50 + s;
        } catch (e) { d = 50 + s; }
        if (d < bd) { bd = d; best = s; }
    }
    if (best < -1) { mp.events.call('hud:notify', 'warn', 'Свободных мест нет', 2500); return true; }
    if (max >= 3) {
        var cls = 0; try { cls = v.getClass(); } catch (e) {}
        if (max >= 5 || cls === 15 || cls === 16 || cls === 19 || cls === 20) {
            if (!(bd < 2.5 && best <= 2)) {
                var seat = best;
                try { me.taskWarpIntoVehicle(v.handle, seat); } catch (e) { try { me.setIntoVehicle(v.handle, seat); } catch (e2) { return false; } }
                mp.events.call('hud:notify', 'ok', 'Вы заняли место №' + (seat + 2) + ' из ' + (max + 1), 2000);
                return true;
            }
        }
    }
    try { me.taskEnterVehicle(v.handle, 6000, best, 1.0, 1, 0); } catch (e) { return false; }
    return true;
}

var intSolo = false;
var EMOTE_ITEMS = [
    { id: 'em:handsup', t: 'Руки вверх', ic: '🙌', d: 'Поднять руки' },
    { id: 'em:surrender', t: 'Сдаться', ic: '🏳️', d: 'На колени, руки за голову' },
    { id: 'em:wave', t: 'Помахать', ic: '👋', d: 'Поприветствовать' },
    { id: 'em:salute', t: 'Честь', ic: '🫡', d: 'Отдать честь' },
    { id: 'em:thumbs', t: 'Класс', ic: '👍', d: 'Большой палец вверх' },
    { id: 'em:peace', t: 'Мир', ic: '✌️', d: 'Знак мира' },
    { id: 'em:clap', t: 'Хлопать', ic: '👏', d: 'Аплодисменты' },
    { id: 'em:facepalm', t: 'Фейспалм', ic: '🤦', d: 'Рука-лицо' },
    { id: 'em:shrug', t: 'Пожать плечами', ic: '🤷', d: 'Не знаю' },
    { id: 'em:arms', t: 'Скрестить руки', ic: '🙅', d: 'Стоять со скрещёнными руками' },
    { id: 'em:sit', t: 'Сесть', ic: '🪑', d: 'Сесть на землю' },
    { id: 'em:dance', t: 'Танец', ic: '💃', d: 'Потанцевать' },
    { id: 'em_more', t: 'Ещё', ic: '➕', d: 'Сценки: курить, лечь, отжиматься…' },
    { id: 'em:stop', t: 'Отмена', ic: '✖️', d: 'Прекратить анимацию' }
];
var EMOTE_MORE = [
    { id: 'em:lean', t: 'Опереться', ic: '🧱', d: 'Прислониться к стене' },
    { id: 'em:smoke', t: 'Курить', ic: '🚬', d: 'Закурить сигарету' },
    { id: 'em:phone', t: 'Телефон', ic: '📱', d: 'Залипнуть в телефон' },
    { id: 'em:coffee', t: 'Кофе', ic: '☕', d: 'Пить кофе' },
    { id: 'em:drink', t: 'Пить', ic: '🍺', d: 'Пить из бутылки' },
    { id: 'em:lie', t: 'Лечь', ic: '🛏️', d: 'Лечь на спину' },
    { id: 'em:sleep', t: 'Спать', ic: '💤', d: 'Уснуть' },
    { id: 'em:pushups', t: 'Отжиматься', ic: '💪', d: 'Отжимания' },
    { id: 'em:yoga', t: 'Йога', ic: '🧘', d: 'Позы йоги' },
    { id: 'em:guitar', t: 'Гитара', ic: '🎸', d: 'Играть на гитаре' },
    { id: 'em:photo', t: 'Фото', ic: '📷', d: 'Фотографировать' },
    { id: 'em:dance2', t: 'Клубный танец', ic: '🪩', d: 'Танец как в клубе' },
    { id: 'em_back', t: 'Назад', ic: '↩️', d: 'К основным анимациям' }
];
var GREET_ITEMS = [
    { id: 'shake', t: 'Пожать руку', ic: '🤝', d: 'Познакомиться — увидите ник друг друга' },
    { id: 'pair:hug', t: 'Обнять', ic: '🫂', d: 'Предложить обняться' },
    { id: 'pair:five', t: 'Дать пять', ic: '🖐️', d: 'Хлопнуть ладонями' },
    { id: 'pair:bro', t: 'По-братски', ic: '💪', d: 'Братское приветствие' },
    { id: 'pair:kiss', t: 'Поцеловать', ic: '💋', d: 'Предложить поцелуй' },
    { id: 'back', t: 'Назад', ic: '↩️', d: 'Вернуться в меню' }
];
function intShow(who, items) {
    global.intOpen = true;
    intExec('window.intOpen && window.intOpen(' + JSON.stringify({ who: who, items: items }) + ');');
    mp.gui.chat.activate(false);
    mp.gui.cursor.show(true, true);
}
global.intShowG = function (who, items) { intTarget = null; intSolo = true; intShow(who, items); };
function whoOf(t) { return titleOf(t) + ' · #' + sidOf(t); }
function intOpenEmotes() {
    intSolo = !intTarget;
    intShow('Анимации', EMOTE_ITEMS);
}
function intOpenMenu() {
    var t = nearest();
    if (!t) { intTarget = null; intOpenEmotes(); return; }
    intTarget = t;
    intSolo = false;
    var items = [
        { id: 'greet', t: 'Приветствие', ic: '🤝', d: 'Пожать руку, обнять, дать пять…' },
        { id: 'docs', t: 'Документы', ic: '🪪', d: 'Показать паспорт, права, удостоверение…' },
        { id: 'pay', t: 'Дать денег', ic: '💵', d: 'Передать наличные' }
    ];
    var myFac = mp.players.local.getVariable('fac');
    if (mp.players.local.getVariable('cop') || myFac === 'army') items.push({ id: 'search', t: 'Обыскать', ic: '🔍', d: 'Найти и изъять нелегальное' });
    if (mp.players.local.getVariable('cop')) {
        items.push({ id: 'chklic', t: 'Проверить права', ic: '📋', d: 'Проверить категории и выбрать наказание' });
        items.push({ id: 'revdrive', t: 'Изъять права', ic: '🚗', d: 'Забрать водительское удостоверение' });
        items.push({ id: 'revgun', t: 'Изъять лиц. оружия', ic: '🔫', d: 'Забрать лицензию на оружие' });
    }
    intShow(whoOf(t), items);
}
var DOC_IC = { passport: '🪪', drive: '🚗', military: '🎖️', med: '🩺', psych: '🧠', gun: '🔫', faction: '👮' };
mp.events.add('social:docs', function (rid, json) {
    var t = mp.players.atRemoteId(Number(rid));
    if (!t || !mp.players.exists(t)) return;
    var list = [];
    try { list = JSON.parse(json) || []; } catch (e) {}
    if (!list.length) { mp.events.call('hud:notify', 'warn', 'У вас нет документов', 2500); return; }
    intTarget = t;
    intSolo = false;
    var items = list.slice(0, 11).map(function (d, i) { return { id: 'doc:' + i, t: d.title, ic: DOC_IC[d.t] || '📄', d: 'Показать: ' + d.title }; });
    items.push({ id: 'back', t: 'Назад', ic: '↩️', d: 'Вернуться в меню' });
    intShow(whoOf(t), items);
});
function emoApply(p, v) {
    if (!p || !p.handle) return;
    if (!v) {
        if (p.__emoLoop) { try { if (p.__emoScn) p.clearTasksImmediately(); else p.clearTasks(); } catch (e) {} }
        p.__emoScn = false; p.__emoLoop = false;
        return;
    }
    if (p.getVariable('cuffed')) return;
    var a = String(v).split('|');
    var dict = a[0], name = a[1], flag = Number(a[2]) || 0;
    p.__emoLoop = dict.indexOf('S:') === 0 || (flag & 1) === 1;
    if (dict.indexOf('S:') === 0) {
        try { p.clearTasks(); p.taskStartScenarioInPlace(dict.slice(2), 0, true); p.__emoScn = true; } catch (e) {}
        return;
    }
    p.__emoScn = false;
    mp.game.streaming.requestAnimDict(dict);
    var tries = 0;
    var t = setInterval(function () {
        tries++;
        if (!p.handle) { clearInterval(t); return; }
        if (mp.game.streaming.hasAnimDictLoaded(dict)) {
            clearInterval(t);
            if (p.getVariable('emo') !== v) return;
            try { p.taskPlayAnim(dict, name, 8.0, -8.0, -1, flag, 0, false, false, false); } catch (e) {}
        } else if (tries > 60) clearInterval(t);
    }, 50);
}
mp.events.addDataHandler('emo', function (p, v) { if (p && p.type === 'player') emoApply(p, v); });
mp.events.add('entityStreamIn', function (e) {
    if (e && e.type === 'player') { var v = e.getVariable('emo'); if (v) emoApply(e, v); }
});
var emoteLoop = false;
mp.events.add('social:emoteLoop', function (on) { emoteLoop = !!on; });
mp.events.add('render', function () {
    if (!emoteLoop) return;
    var c = mp.game.controls;
    if (c.isControlJustPressed(0, 32) || c.isControlJustPressed(0, 33) || c.isControlJustPressed(0, 34) || c.isControlJustPressed(0, 35) || c.isControlJustPressed(0, 22) || c.isControlJustPressed(0, 73)) {
        emoteLoop = false;
        mp.events.callRemote('srv:emote', 'stop');
    }
});

mp.keys.bind(0x47, false, function () {
    if (global.authOpen || global.creatorOpen || global.gateEditOpen) return;
    if (global.intOpen) { intClose(); return; }
    var me = mp.players.local;
    if (me.isTypingInTextChat || me.isDead()) return;
    if (me.vehicle) return;
    if (typeof global.uiBusy === 'function' && global.uiBusy()) return;
    if (typeof admOpen !== 'undefined' && admOpen) return;
    if (mp.gui.cursor.visible) return;
    if (enterAsPassenger()) return;
    if (!nearest()) { mp.events.call('hud:notify', 'warn', 'Рядом никого нет', 2500); return; }
    intOpenMenu();
});
mp.keys.bind(0x71, false, function () {
    if (global.authOpen || global.creatorOpen || global.gateEditOpen) return;
    if (global.intOpen) { intClose(); return; }
    var me = mp.players.local;
    if (me.isTypingInTextChat || me.isDead() || global.chatOpen) return;
    if (me.vehicle) { mp.events.call('hud:notify', 'warn', 'Выйдите из транспорта', 2000); return; }
    if (typeof global.uiBusy === 'function' && global.uiBusy()) return;
    if (typeof admOpen !== 'undefined' && admOpen) return;
    if (mp.gui.cursor.visible) return;
    intTarget = null;
    intOpenEmotes();
});
var pointAt = 0;
mp.keys.bind(0x42, false, function () {
    var me = mp.players.local;
    if (me.vehicle || me.isTypingInTextChat || me.isDead() || global.chatOpen || global.intOpen || mp.gui.cursor.visible) return;
    if (Date.now() - pointAt < 1500) return;
    pointAt = Date.now();
    mp.events.callRemote('srv:emote', 'point');
});

mp.events.add('cef:int:close', intClose);
mp.events.add('cef:int:pick', function (id, arg) {
    var t = intTarget;
    id = String(id);
    if (id.indexOf('sto:') === 0) { intClose(); if (id !== 'sto:x') mp.events.callRemote('srv:sto:pick', id.slice(4)); return; }
    if (id.indexOf('imp:') === 0) { intClose(); if (id !== 'imp:x') mp.events.callRemote('srv:imp:take', id.slice(4)); return; }
    if (id === 'em_more') { intShow('Анимации · ещё', EMOTE_MORE); return; }
    if (id === 'em_back') { intShow('Анимации', EMOTE_ITEMS); return; }
    if (id.indexOf('em:') === 0) { intClose(); mp.events.callRemote('srv:emote', id.slice(3)); return; }
    if (id === 'back') { intClose(); if (t && mp.players.exists(t)) intOpenMenu(); return; }
    if (id === 'emotes') { intOpenEmotes(); return; }
    if (id === 'greet') { if (t && mp.players.exists(t)) intShow(whoOf(t), GREET_ITEMS); return; }
    intClose();
    if (!t || !mp.players.exists(t)) return;
    if (id === 'docs') { mp.events.callRemote('srv:int:docs', t.remoteId); return; }
    if (id.indexOf('doc:') === 0) { mp.events.callRemote('srv:int:showdoc', t.remoteId, Number(id.slice(4))); return; }
    if (id.indexOf('pair:') === 0) { mp.events.callRemote('srv:int:pair', t.remoteId, id.slice(5)); return; }
    if (id === 'shake') mp.events.callRemote('srv:int:shake', t.remoteId);
    else if (id === 'passport') mp.events.callRemote('srv:int:passport', t.remoteId);
    else if (id === 'pay') mp.events.callRemote('srv:int:pay', t.remoteId, Number(arg) || 0);
    else if (id === 'wave') mp.events.callRemote('srv:int:wave');
    else if (id === 'search') mp.events.callRemote('srv:crime:searchReq', t.remoteId);
    else if (id === 'chklic') mp.events.callRemote('srv:lic:check', t.remoteId);
    else if (id === 'revdrive') mp.events.callRemote('srv:cop:revoke', t.remoteId, 'drive');
    else if (id === 'revgun') mp.events.callRemote('srv:cop:revoke', t.remoteId, 'gun');
});

mp.events.add('social:offer', function (text, ms) {
    offerUntil = Date.now() + Number(ms || 15000);
    intExec('window.offerShow && window.offerShow(' + JSON.stringify(text) + ',' + Number(ms || 15000) + ');');
});
function answer(yes) {
    if (Date.now() > offerUntil) return;
    if (mp.players.local.isTypingInTextChat || mp.gui.cursor.visible) return;
    offerUntil = 0;
    intExec('window.offerHide && window.offerHide();');
    mp.events.callRemote('srv:int:answer', yes);
}
mp.keys.bind(0x59, false, function () { var c = global.phoneCallState && global.phoneCallState(); if (c && c.st === 'ring' && !c.out && !mp.players.local.isTypingInTextChat) return mp.events.callRemote('srv:call:answer'); answer(true); });
mp.keys.bind(0x4E, false, function () { if (global.nDownAt && Date.now() - global.nDownAt > 350) return; var c = global.phoneCallState && global.phoneCallState(); if (c && !mp.players.local.isTypingInTextChat && (c.st === 'ring' || c.st === 'talk')) return mp.events.callRemote('srv:call:end'); answer(false); });

mp.events.add('render', function () {
    if (!global.intOpen) return;
    if (!intSolo) {
        if (!intTarget || !mp.players.exists(intTarget)) { intClose(); return; }
        var me = mp.players.local, p = intTarget.position;
        if (mp.game.system.vdist(me.position.x, me.position.y, me.position.z, p.x, p.y, p.z) > 4.5) { intClose(); return; }
    }
    if (!mp.gui.cursor.visible) mp.gui.cursor.show(true, true);
    mp.game.controls.disableControlAction(0, 1, true);
    mp.game.controls.disableControlAction(0, 2, true);
    mp.game.controls.disableControlAction(0, 24, true);
    mp.game.controls.disableControlAction(0, 25, true);
    mp.game.controls.disableControlAction(0, 140, true);
    mp.game.controls.disableControlAction(0, 141, true);
    mp.game.controls.disableControlAction(0, 142, true);
    mp.game.controls.disableControlAction(0, 200, true);
});
