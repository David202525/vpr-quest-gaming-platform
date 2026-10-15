const db = require('./database');
global.db = db;

function load(file) {
    try { require(file); return true; } catch (e) { console.log('[CORE] ' + file + ': ' + e.message); return false; }
}

load('./modules/logs.js');
load('./modules/admin.js');
load('./modules/help.js');
load('./modules/hud.js');
load('./modules/ui.js');
load('./modules/intro.js');

const core = ['vehicles', 'auth', 'creator'].filter(function (n) { return load('./modules/' + n + '.js'); });
console.log('[CORE] Modules loaded: ' + core.join(', ') + '.');
