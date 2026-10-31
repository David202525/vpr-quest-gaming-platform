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
            E.push({ dir: false, name: nameAt(nameOff), size: size, off: offRaw & 0x7FFFFF, usize: ent.readUInt32LE(o + 8), res: res, sf: ent.readUInt32LE(o + 8), gf: ent.readUInt32LE(o + 12) });
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
            if (out.chk && !(e.name.toLowerCase().endsWith('.rpf') && !e.res)) out.chk.push({ f: (prefix ? prefix + '/' : '') + full, pos: base + e.off * 512, size: e.size, usize: e.usize, res: e.res, sf: e.sf, gf: e.gf });
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

function rscSize(v) {
    const s = ((v >> 27) & 1) + (((v >> 26) & 1) << 1) + (((v >> 25) & 1) << 2) + (((v >> 24) & 1) << 3) + (((v >> 17) & 0x7F) << 4) + (((v >> 11) & 0x3F) << 5) + (((v >> 7) & 0xF) << 6) + (((v >> 5) & 3) << 7) + (((v >> 4) & 1) << 8);
    return (0x200 << (v & 0xF)) * s;
}
function checkEntry(fd, fileSize, c) {
    if (c.res) {
        const h = rd(fd, c.pos, 16);
        let size = c.size;
        if (size === 0xFFFFFF) size = h[7] | (h[14] << 8) | (h[5] << 16) | (h[2] << 24);
        if (!size) return '';
        if (c.pos + size > fileSize) return 'обрезан (файл кончается раньше, чем должен)';
        if (h.readUInt32LE(0) !== 0x37435352) return 'испорчен заголовок ресурса';
        const need = rscSize(c.sf >>> 0) + rscSize(c.gf >>> 0);
        let out;
        try { out = zlib.inflateRawSync(rd(fd, c.pos + 16, size - 16)); } catch (e) { return 'сжатые данные повреждены (' + e.message + ')'; }
        if (need && out.length !== need) return 'размер после распаковки ' + out.length + ' вместо ' + need;
        return '';
    }
    if (!c.size) return c.pos + c.usize > fileSize ? 'обрезан' : '';
    if (c.pos + c.size > fileSize) return 'обрезан (файл кончается раньше, чем должен)';
    try { zlib.inflateRawSync(rd(fd, c.pos, c.size)); } catch (e) { return 'сжатые данные повреждены (' + e.message + ')'; }
    return '';
}
let deepBusy = false;
function deepCheck(to, done) {
    if (deepBusy) return to('проверка уже идёт, подождите');
    deepBusy = true;
    const root = findRoot();
    const names = fs.existsSync(root) ? fs.readdirSync(root).filter(function (n) { return fs.existsSync(path.join(root, n, 'dlc.rpf')); }) : [];
    const bad = [];
    let i = 0;
    to('глубокая проверка ' + names.length + ' паков началась…');
    function next() {
        if (i >= names.length) {
            deepBusy = false;
            if (!bad.length) to('✔ повреждённых файлов не найдено во всех ' + names.length + ' паках');
            else to('✖ повреждённые паки: ' + bad.join(', ') + ' — удалите или пересоберите их, затем игроки должны удалить RAGEMP/client_resources');
            if (done) done(bad);
            return;
        }
        const n = names[i++];
        const f = path.join(root, n, 'dlc.rpf');
        const out = { files: [], ymaps: [], models: [], ytyps: [], errors: [], encrypted: [], xml: {}, chk: [] };
        let fd, errs = [];
        try {
            fd = fs.openSync(f, 'r');
            const fileSize = fs.fstatSync(fd).size;
            readRpf(fd, 0, '', out, 0);
            out.chk.forEach(function (c) { let e; try { e = checkEntry(fd, fileSize, c); } catch (x) { e = 'не читается (' + x.message + ')'; } if (e) errs.push(c.f + ': ' + e); });
        } catch (e) { errs.push('архив не читается: ' + e.message); }
        if (fd) fs.closeSync(fd);
        if (out.encrypted.length) to(n + ': зашифрован, проверить нельзя — если ошибка ZLIB не уходит, уберите этот пак на пробу');
        if (errs.length) {
            bad.push(n);
            to('✖ ' + n + ': битых файлов ' + errs.length);
            errs.slice(0, 5).forEach(function (e) { to('     ' + e); });
        } else if (!out.encrypted.length) to('✔ ' + n + ' (' + out.chk.length + ' файлов)');
        setImmediate(next);
    }
    setImmediate(next);
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

function extCount(files) {
    const c = {};
    files.forEach(function (x) { const e = x.slice(x.lastIndexOf('.') + 1); if (e && e.length < 6) c[e] = (c[e] || 0) + 1; });
    return c;
}
function summary() {
    const lines = [];
    const groups = {};
    R.list.forEach(function (d) {
        const m = d.name.match(/^(.+?)_?part_?(\d+)$/i);
        if (!m) return;
        const g = groups[m[1]] = groups[m[1]] || { parts: [], ymt: false, cl: 0 };
        g.parts.push(Number(m[2])); if (d.ymt) g.ymt = true; g.cl += (d.cl || []).reduce(function (a, c) { return a + c.n; }, 0);
    });
    Object.keys(groups).forEach(function (k) {
        const g = groups[k]; g.parts.sort(function (a, b) { return a - b; });
        lines.push('!{#ffcc66}Пак ' + k + ': загружено частей ' + g.parts.length + ' (' + g.parts.join(', ') + '), вещей в них ' + g.cl);
        if (!g.ymt) lines.push('!{#e05555}   ✖ нет главной части со списком вещей (файл mp_*_freemode_01_*.ymt). Без неё одежда не появится. Обычно это ' + k + '_part0000 или первая часть — загрузите её');
        if (g.parts.length && g.parts[0] > 0) lines.push('!{#e05555}   ✖ не хватает частей с 0 по ' + (g.parts[0] - 1) + ' — грузите пак целиком, а не выборочно');
    });
    const empty = R.list.filter(function (d) { return !d.models.length && !d.ymaps.length && !(d.cl || []).length && !d.ytyps && !d.enc; });
    if (empty.length) {
        lines.push('!{#7fd3ff}Без моделей, карт и одежды (' + empty.length + '):');
        empty.forEach(function (d) {
            const e = d.ext || {}; const what = Object.keys(e).filter(function (x) { return x !== 'xml'; }).map(function (x) { return x + ' ' + e[x]; }).join(', ');
            const meta = e.meta || e.ymt || e.ytd;
            lines.push('   ' + d.name + ' — ' + (what || 'пусто') + (meta ? ' · похоже на дополнение (текстуры/настройки), удалять только если не нужно' : ' · можно удалить'));
        });
    }
    lines.push('!{#7fd3ff}Всего DLC: ' + R.list.length + '. Чем их больше, тем дольше загрузка у игроков; если часть модов не грузится — уберите лишние.');
    return lines;
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
                    const bn = rel.slice(rel.lastIndexOf('/') + 1);
                    const alt = /\.ityp$/.test(bn) ? bn.replace(/\.ityp$/, '.ytyp') : bn;
                    const has = out.files.some(function (x) {
                        if (x === rel || x.indexOf(rel + '/') === 0 || x.indexOf(rel + '.') === 0) return true;
                        const xb = x.slice(x.lastIndexOf('/') + 1);
                        return xb === bn || xb === alt || xb.indexOf(bn + '.') === 0 || xb.indexOf(bn + '151') === 0;
                    }) || /\.rpf\//.test(rel) && out.files.some(function (x) { return x.indexOf(rel.slice(0, rel.indexOf('.rpf/') + 4)) >= 0; });
                    if (!has) out.errors.push('content.xml ссылается на «' + rel + '», но такого файла в архиве нет');
                }
            }
        }
        const cl = clothesOf(out.files);
        if (cl.length) {
            const sexes = {}; cl.forEach(function (c) { sexes[c.sex] = 1; });
            Object.keys(sexes).forEach(function (sx) {
                const ped = 'mp_' + sx + '_freemode_01';
                const ymt = out.files.some(function (x) { return x.indexOf(ped) >= 0 && /\.ymt$/.test(x); });
                if (!ymt) out.errors.push((sx === 'f' ? 'женская' : 'мужская') + ' одежда: нет файла ' + ped + '_*.ymt — игра не узнает о вещах. Он лежит в другой части пака, загрузите её тоже');
            });
            if (ct && !/SHOP_PED_APPAREL_META_FILE/i.test(ct)) out.errors.push('одежда: в content.xml нет SHOP_PED_APPAREL_META_FILE — вещи не зарегистрируются');
            const meta = out.files.some(function (x) { return /freemode_01[^/]*\.meta$/.test(x); });
            if (ct && /SHOP_PED_APPAREL_META_FILE/i.test(ct) && !meta) out.errors.push('одежда: нет файла *_freemode_01_*.meta (описание вещей для магазина)');
        }
        list.push({
            name: n, ok: !out.errors.length, errors: out.errors, warns: warns, cl: cl, enc: out.encrypted.length, ymt: out.files.some(function (x) { return /freemode_01[^/]*\.ymt$/.test(x); }), ext: extCount(out.files),
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
        const clt = (d.cl || []).map(function (c) { return (c.sex === 'f' ? '♀' : '♂') + c.part + ' ' + c.n; }).join(', ');
        lines.push(d.name + ': ' + (d.ok ? 'OK' : 'ОШИБКА') + (clt ? ' — одежда: ' + clt : ' — моделей ' + d.models.length + ', ymap ' + d.ymaps.length + (d.ytyps ? ', ytyp ' + d.ytyps : '')));
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
    if (String(full || '').trim() === 'check') {
        return deepCheck(function (l) { console.log('[dlc] ' + l); if (mp.players.exists(p)) p.outputChatBox('!{#ffcc66}[DLC] ' + l); });
    }
    if (String(full || '').trim() === 'rescan') {
        R = scan();
        mp.players.forEach(function (x) { x.call('dlc:load', [payload(), isDev(x)]); });
    }
    report(function (l) { p.outputChatBox('!{#7fd3ff}[DLC] ' + l); });
    summary().forEach(function (l) { p.outputChatBox(l); });
    p.call('dlc:load', [payload(), true]);
});

setTimeout(function () { deepCheck(function (l) { console.log('[dlc] ' + l); }); }, 8000);

global.DlcSystem = { deepCheck: deepCheck, scan: scan, rescan: function () { R = scan(); return R; }, get: function () { return R; } };
module.exports = global.DlcSystem;