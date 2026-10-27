const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ENC = { 0: 'NONE', 0x4E45504F: 'OPEN', 0x0FFFFFF9: 'AES', 0x0FEFFFFF: 'NG' };

function findRoot() {
    const c = [
        path.resolve(process.cwd(), 'client_packages/game_resources/dlcpacks'),
        path.resolve(__dirname, '../../../client_packages/game_resources/dlcpacks'),
        path.resolve(__dirname, '../../client_packages/game_resources/dlcpacks')
    ];
    for (const d of c) if (fs.existsSync(d)) return d;
    return c[0];
}

function rd(fd, pos, len) {
    const b = Buffer.alloc(len);
    fs.readSync(fd, b, 0, len, pos);
    return b;
}

function readRpf(fd, base, prefix, out, depth) {
    const h = rd(fd, base, 16);
    if (h.readUInt32LE(0) !== 0x52504637) { out.errors.push((prefix || 'dlc.rpf') + ': не RPF7-архив'); return; }
    const count = h.readUInt32LE(4), nlen = h.readUInt32LE(8), enc = h.readUInt32LE(12);
    if (enc !== 0 && enc !== 0x4E45504F) { out.encrypted.push((prefix || 'dlc.rpf') + ' (' + (ENC[enc] || enc.toString(16)) + ')'); return; }
    const ent = rd(fd, base + 16, count * 16);
    const names = rd(fd, base + 16 + count * 16, nlen);
    const nameAt = function (o) { let e = o; while (e < names.length && names[e] !== 0) e++; return names.slice(o, e).toString('latin1'); };
    const E = [];
    for (let i = 0; i < count; i++) {
        const o = i * 16;
        const ident = ent.readUInt32LE(o + 4);
        if (ident === 0x7FFFFF00) {
            E.push({ dir: true, name: nameAt(ent.readUInt32LE(o)), idx: ent.readUInt32LE(o + 8), cnt: ent.readUInt32LE(o + 12) });
        } else {
            const nameOff = ent.readUInt16LE(o);
            const size = ent.readUIntLE(o + 2, 3);
            const offRaw = ent.readUIntLE(o + 5, 3);
            const res = (ident & 0x80000000) !== 0 && (offRaw & 0x800000) !== 0;
            E.push({ dir: false, name: nameAt(nameOff), size: size, off: offRaw & 0x7FFFFF, usize: ent.readUInt32LE(o + 8), res: res });
        }
    }
    function walk(di, p) {
        const d = E[di];
        for (let i = d.idx; i < d.idx + d.cnt; i++) {
            const e = E[i];
            if (!e) continue;
            const full = (p ? p + '/' : '') + e.name;
            if (e.dir) { walk(i, full); continue; }
            const low = e.name.toLowerCase();
            out.files.push((prefix ? prefix + '/' : '') + full.toLowerCase());
            const ext = low.slice(low.lastIndexOf('.') + 1);
            const bn = low.slice(0, low.lastIndexOf('.'));
            if (ext === 'ymap') out.ymaps.push(bn);
            else if (ext === 'ydr' || ext === 'yft') out.models.push(bn);
            else if (ext === 'ytyp') out.ytyps.push(bn);
            else if (ext === 'rpf' && !e.res && depth < 4) {
                if (e.size) out.errors.push(full + ': вложенный архив сжат — пересоберите в OpenIV');
                else readRpf(fd, base + e.off * 512, (prefix ? prefix + '/' : '') + full.toLowerCase(), out, depth + 1);
            } else if (!prefix && (low === 'setup2.xml' || low === 'content.xml') && !e.res) {
                try {
                    const raw = rd(fd, base + e.off * 512, e.size || e.usize);
                    out.xml[low] = (e.size ? zlib.inflateRawSync(raw) : raw).toString('utf8');
                } catch (er) { out.errors.push(low + ': не читается'); }
            }
        }
    }
    if (E[0] && E[0].dir) walk(0, '');
}

function tag(x, t) { const m = x.match(new RegExp('<' + t + '>\\s*([^<]+?)\\s*</' + t + '>', 'i')); return m ? m[1] : ''; }

function fixLayout(root, log) {
    if (!fs.existsSync(root)) return;
    fs.readdirSync(root).forEach(function (n) {
        const p = path.join(root, n);
        let st; try { st = fs.statSync(p); } catch (e) { return; }
        if (st.isFile() && /\.rpf$/i.test(n)) {
            const dir = path.join(root, n.replace(/\.rpf$/i, '').toLowerCase());
            if (!fs.existsSync(path.join(dir, 'dlc.rpf'))) {
                fs.mkdirSync(dir, { recursive: true });
                fs.renameSync(p, path.join(dir, 'dlc.rpf'));
                log.push('исправлено: ' + n + ' → ' + path.basename(dir) + '/dlc.rpf');
            }
            return;
        }
        if (!st.isDirectory()) return;
        if (fs.existsSync(path.join(p, 'dlc.rpf'))) return;
        const inner = fs.readdirSync(p);
        for (const s of inner) {
            const sp = path.join(p, s);
            if (fs.statSync(sp).isDirectory() && fs.existsSync(path.join(sp, 'dlc.rpf'))) {
                fs.renameSync(path.join(sp, 'dlc.rpf'), path.join(p, 'dlc.rpf'));
                log.push('исправлено: ' + n + '/' + s + '/dlc.rpf → ' + n + '/dlc.rpf');
                return;
            }
        }
        const rpfs = inner.filter(function (s) { return /\.rpf$/i.test(s); });
        if (rpfs.length === 1) {
            fs.renameSync(path.join(p, rpfs[0]), path.join(p, 'dlc.rpf'));
            log.push('исправлено: ' + n + '/' + rpfs[0] + ' → ' + n + '/dlc.rpf');
        }
    });
}

function scan() {
    const root = findRoot();
    const fixes = [];
    try { fixLayout(root, fixes); } catch (e) { fixes.push('не удалось исправить структуру: ' + e.message); }
    const list = [];
    if (!fs.existsSync(root)) return { root: root, fixes: fixes, list: list, missing: true };
    fs.readdirSync(root).forEach(function (n) { try { scanOne(root, n, list); } catch (e) { list.push({ name: n, ok: false, errors: ['сбой проверки: ' + e.message], warns: [], ymaps: [], models: [] }); } });
    return { root: root, fixes: fixes, list: list };
}

const CL_MAP = { jbib: 'top', lowr: 'legs', feet: 'shoes', hand: 'bag', berd: 'mask', teef: 'chain', p_head: 'hat', p_eyes: 'glasses', p_lwrist: 'watch' };
function clothesOf(files) {
    const g = {};
    files.forEach(function (f) {
        const sx = f.match(/mp_([mf])_freemode_01/);
        if (!sx) return;
        const base = f.slice(f.lastIndexOf('/') + 1).split('^').pop();
        const m = base.match(/^((?:p_)?[a-z]+)_(\d{3})(?:_[a-z]+)?\.ydd$/);
        if (!m) return;
        const k = sx[1] + ':' + m[1];
        (g[k] = g[k] || {})[Number(m[2])] = 1;
    });
    return Object.keys(g).map(function (k) {
        const p = k.split(':');
        const ids = Object.keys(g[k]).map(Number).sort(function (a, b) { return a - b; });
        return { sex: p[0], part: p[1], slot: CL_MAP[p[1]] || '', n: ids.length, ids: ids };
    });
}

function scanOne(root, n, list) {
    {
        const f = path.join(root, n, 'dlc.rpf');
        if (!fs.existsSync(f)) {
            if (fs.statSync(path.join(root, n)).isDirectory()) list.push({ name: n, ok: false, errors: ['нет файла dlc.rpf'], warns: [], ymaps: [], models: [] });
            return;
        }
        const out = { files: [], ymaps: [], models: [], ytyps: [], errors: [], encrypted: [], xml: {} };
        let fd;
        try { fd = fs.openSync(f, 'r'); readRpf(fd, 0, '', out, 0); } catch (e) { out.errors.push('ошибка чтения: ' + e.message); }
        if (fd) fs.closeSync(fd);
        const warns = [];
        out.encrypted.forEach(function (x) { warns.push('зашифрован: ' + x + ' — содержимое не проверить, грузим как есть'); });
        const s2 = out.xml['setup2.xml'], ct = out.xml['content.xml'];
        if (!out.encrypted.length) {
            if (!s2) out.errors.push('нет setup2.xml в корне — это не DLC-мод');
            if (!ct) out.errors.push('нет content.xml в корне');
        }
        if (s2) {
            const nh = tag(s2, 'nameHash'), dev = tag(s2, 'deviceName');
            if (nh && nh.toLowerCase() !== n.toLowerCase()) warns.push('nameHash «' + nh + '» не совпадает с папкой «' + n + '»');
            if (ct && dev) {
                const re = new RegExp(dev.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':/([^<\\s]+)', 'gi');
                let m; const seen = {};
                while ((m = re.exec(ct))) {
                    const rel = m[1].replace(/%PLATFORM%/gi, 'x64').toLowerCase().replace(/\/$/, '');
                    if (seen[rel]) continue; seen[rel] = 1;
                    const has = out.files.some(function (x) { return x === rel || x.indexOf(rel + '/') === 0; });
                    if (!has) out.errors.push('content.xml ссылается на «' + rel + '», но такого файла в архиве нет');
                }
            }
        }
        list.push({
            name: n, ok: !out.errors.length, errors: out.errors, warns: warns, cl: clothesOf(out.files), enc: out.encrypted.length,
            ymaps: Array.from(new Set(out.ymaps)), models: Array.from(new Set(out.models)), ytyps: out.ytyps.length, files: out.files.length
        });
    }
}

let R = scan();
function report(to) {
    const lines = [];
    const bad = R.list.filter(function (d) { return !d.ok; }).length;
    lines.push('папка: ' + R.root);
    lines.push('найдено модов: ' + R.list.length + ', исправных: ' + (R.list.length - bad) + ', с ошибками: ' + bad);
    if (R.missing) lines.push('папка dlcpacks не найдена: ' + R.root);
    R.fixes.forEach(function (f) { lines.push(f); });
    R.list.forEach(function (d) {
        lines.push(d.name + ': ' + (d.ok ? 'OK' : 'ОШИБКА') + ' — моделей ' + d.models.length + ', ymap ' + d.ymaps.length + (d.ytyps ? ', ytyp ' + d.ytyps : ''));
        d.errors.forEach(function (e) { lines.push('   ✖ ' + e); });
        d.warns.forEach(function (e) { lines.push('   ! ' + e); });
    });
    if (!R.list.length && !R.missing) lines.push('DLC не найдено');
    lines.forEach(function (l) { to(l); });
}
report(function (l) { console.log('[dlc] ' + l); });

function isDev(p) { return global.AdminSystem && global.AdminSystem.realLvl ? global.AdminSystem.realLvl(p) >= 9 : false; }

function payload() {
    return JSON.stringify(R.list.filter(function (d) { return d.ok; }).map(function (d) {
        return { n: d.name, y: d.ymaps, m: d.models.slice(0, 40) };
    }));
}

mp.events.add('playerReady', function (p) {
    setTimeout(function () { if (mp.players.exists(p)) p.call('dlc:load', [payload(), isDev(p)]); }, 4000);
});

mp.events.add('dlc:result', function (p, json) {
    if (!isDev(p)) return;
    let r; try { r = JSON.parse(json); } catch (e) { return; }
    r.forEach(function (x) {
        const ok = x.found > 0 || !x.total;
        const line = x.n + ': моделей видно ' + x.found + '/' + x.total + ', IPL включено ' + x.ipl;
        console.log('[dlc] клиент ' + p.name + ' — ' + line);
        p.outputChatBox('!{' + (ok ? '#8fd14f' : '#e05555') + '}[DLC] ' + line + (ok ? '' : ' — игра НЕ подгрузила мод'));
    });
});

mp.events.addCommand('dlc', function (p, full) {
    if (!isDev(p)) return;
    if (String(full || '').trim() === 'rescan') {
        R = scan();
        mp.players.forEach(function (x) { x.call('dlc:load', [payload(), isDev(x)]); });
    }
    report(function (l) { p.outputChatBox('!{#7fd3ff}[DLC] ' + l); });
    p.call('dlc:load', [payload(), true]);
});

global.DlcSystem = { scan: scan, get: function () { return R; } };
module.exports = global.DlcSystem;