const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'intro_data.json');
const seen = (function () { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch (e) { return {}; } })();
let dirty = false;
setInterval(function () { if (dirty) { dirty = false; try { fs.writeFileSync(FILE, JSON.stringify(seen)); } catch (e) {} } }, 10000);

function accId(p) { const a = p.account; return a && a.id ? Number(a.id) : 0; }

function play(p, first) {
    if (!mp.players.exists(p) || !p.account) return;
    p.introFirst = !!first;
    p.call('intro:play', [String(p.account.nick || p.name).replace(/ /g, '_'), Number(p.account.gender) ? 1 : 0]);
}

mp.events.add('srv:intro:done', function (p) {
    const id = accId(p);
    const first = p.introFirst;
    p.introFirst = false;
    if (!id) return;
    if (first && !seen[id]) {
        seen[id] = Date.now();
        dirty = true;
        mp.events.call('story:start', p);
        if (typeof global.hudNotify === 'function') global.hudNotify(p, 'ok', 'Добро пожаловать на AMRP! Телефон — F3, меню — M, помощь — /help. Пересмотреть историю — /intro');
    }
});

mp.events.addCommand('intro', function (p) {
    if (!p.account || !p.account.nick) return;
    play(p, false);
});

global.IntroSystem = {
    play: play,
    seen: function (p) { return !!seen[accId(p)]; },
    onNewCharacter: function (p) { setTimeout(function () { play(p, true); }, 2500); }
};
console.log('[intro] пролог загружен');
