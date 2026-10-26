const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'ems_points.json');
const DEF = {
    entry: { x: -449.5, y: -340.8, z: 34.5, h: 80 },
    locker: { x: -447.2, y: -337.6, z: 34.5, h: 80 },
    garage: { x: -457.0, y: -353.0, z: 34.3, h: 80 },
    er: [{ x: -449.5, y: -340.8, z: 34.5 }],
    beds: []
};

const P = JSON.parse(JSON.stringify(DEF));
try {
    const s = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    Object.keys(DEF).forEach(function (k) { if (s[k] !== undefined) P[k] = s[k]; });
} catch (e) {}

const subs = [];
function save() {
    try { fs.writeFileSync(FILE, JSON.stringify(P, null, 2)); } catch (e) { console.log('[ems] points save: ' + e.message); }
    subs.forEach(function (f) { try { f(); } catch (e) { console.log('[ems] points hook: ' + e.message); } });
}

module.exports = { P: P, DEF: DEF, save: save, onChange: function (f) { subs.push(f); } };
