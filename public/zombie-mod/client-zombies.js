const M = ['a_m_m_hillbilly_01', 'a_m_m_tramp_01', 'a_m_y_methhead_01', 'a_m_m_farmer_01'];
const N_COORDS = '0x3FEF770D40960D5A';
const N_SETPOS = '0x239A3351AC1DA385';
const N_HEAD = '0x8E2530AA8ADA980E';
const N_GOTO = '0x5BC448CB78FA3E88';
const N_ANIM = '0xEA47FE3719165B94';
const N_CLEAR = '0xAAA34F8A7CB32098';
const N_HP = '0xEEF059FAD016D209';
const N_SETHP = '0x6B76DC1F3AE6E6A3';
const N_BLOCK = '0x9F8AA94D6D97DBF4';
const N_RATE = '0x085BF80FA50A39D1';
const N_FREEZE = '0x428CA6DBD1094446';

let zs = [], ob = false, wv = 1, zones = [], blips = [];
let pLeft = 0, pAt = 0, kills = 0, spawnAt = 0, err = '', ok = 0, tried = '';

function iv(hash, a, b, c, d, e, f, g, h, i, j, k) {
  try { return mp.game.invoke(hash, a, b, c, d, e, f, g, h, i, j, k); } catch (x) { err = String(x).slice(0, 40); return null; }
}
function len(ax, ay, bx, by) { return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by)); }
function isSafe(x, y, pad) {
  for (let i = 0; i < zones.length; i++) {
    if (len(x, y, zones[i].x, zones[i].y) < zones[i].r + pad) return true;
  }
  return false;
}

function born() {
  const hash = mp.game.joaat(M[Math.floor(Math.random() * M.length)]);
  try { mp.game.streaming.requestModel(hash); } catch (e) {}
  const me = mp.players.local.position;
  const ang = Math.random() * 6.283;
  const r = ob ? 25 + Math.random() * 35 : 35 + Math.random() * 35;
  const x = me.x + Math.cos(ang) * r;
  const y = me.y + Math.sin(ang) * r;
  if (isSafe(x, y, 20)) return;

  let ped = null;
  try { ped = mp.peds.new(hash, new mp.Vector3(x, y, me.z), 0, 0); } catch (e) { err = 'new ' + String(e).slice(0, 25); return; }
  if (!ped || !ped.handle) return;

  const h = ped.handle;
  const hp = ob ? 120 + wv * 20 : 100;
  iv(N_SETHP, h, hp);
  iv(N_BLOCK, h, true);
  iv(N_FREEZE, h, false);
  iv(N_RATE, h, ob ? 1.4 : 1.1);
  iv(N_CLEAR, h);
  zs.push({ p: ped, h: h, hit: 0, task: 0, dead: false, px: x, py: y, stuck: 0 });
}

function pos(z) {
  const v = iv(N_COORDS, z.h, true);
  if (v && typeof v.x === 'number') return v;
  try { return z.p.position; } catch (e) { return null; }
}

function brain() {
  const me = mp.players.local.position;
  const now = Date.now();
  const inZone = isSafe(me.x, me.y, 0);
  const keep = [];

  for (let i = 0; i < zs.length; i++) {
    const z = zs[i];
    const c = pos(z);
    if (!c) { keep.push(z); continue; }

    const hp = iv(N_HP, z.h);
    if (typeof hp === 'number' && hp <= 0) {
      if (!z.dead) { z.dead = true; mp.events.callRemote('srv:zombieKill'); }
      continue;
    }

    const d = len(c.x, c.y, me.x, me.y);
    if (d > 250 || inZone || isSafe(c.x, c.y, 0)) {
      try { z.p.destroy(); } catch (e) {}
      continue;
    }

    const dx = me.x - c.x, dy = me.y - c.y;
    let hd = Math.atan2(dy, dx) * 180 / Math.PI - 90;
    if (hd < 0) hd = hd + 360;

    if (d < 2.3) {
      if (now - z.hit > 1300) {
        z.hit = now;
        iv(N_HEAD, z.h, hd);
        mp.events.callRemote('srv:zombieHit', ob ? 6 + Math.floor(wv / 2) : 4);
        iv(N_ANIM, z.h, 'melee@unarmed@streamed_core', 'ground_attack_on_spot', 8.0, -8.0, 900, 0, 0.0, false, false, false);
        try { mp.game.cam.shakeGameplayCam('SMALL_EXPLOSION_SHAKE', 0.3); } catch (e) {}
      }
      keep.push(z);
      continue;
    }

    const moved = len(c.x, c.y, z.px, z.py);
    z.px = c.x; z.py = c.y;
    if (moved < 0.12) z.stuck = z.stuck + 1; else { z.stuck = 0; ok = ok + 1; }

    if (z.stuck > 3) {
      tried = 'ручной';
      iv(N_HEAD, z.h, hd);
      const nx = c.x + dx / d * 0.9, ny = c.y + dy / d * 0.9;
      iv(N_SETPOS, z.h, nx, ny, c.z, false, false, false);
      try { z.p.position = new mp.Vector3(nx, ny, c.z); } catch (e) {}
      iv(N_ANIM, z.h, 'move_m@generic', 'walk', 8.0, -8.0, -1, 1, 0.0, false, false, false);
    } else if (now - z.task > 1200) {
      z.task = now;
      tried = 'задача';
      iv(N_GOTO, z.h, me.x, me.y, me.z, 2.0, -1, 0.0, 0.5);
    }
    keep.push(z);
  }

  zs = keep;

  const cap = ob ? Math.min(25, 10 + wv * 2) : 5;
  const gap = ob ? 700 : 4000;
  if (!inZone && zs.length < cap && now - spawnAt > gap) {
    spawnAt = now;
    born();
    if (ob) born();
  }
}

setInterval(function () {
  try { brain(); } catch (x) { err = 'brain ' + String(x).slice(0, 35); }
}, 150);

mp.events.add('render', function () {
  try {
    const me = mp.players.local.position;
    const ms = Math.max(0, pLeft - (Date.now() - pAt));
    const sec = Math.floor(ms % 60000 / 1000);
    const clock = Math.floor(ms / 60000) + ':' + (sec < 10 ? '0' + sec : sec);
    let txt = '~y~затишье~w~   до прорыва ' + clock + '   убито: ' + kills;
    if (isSafe(me.x, me.y, 0)) txt = '~g~БЕЗОПАСНАЯ ЗОНА~w~   ' + clock;
    else if (ob) txt = '~r~ПРОРЫВ~w~   волна ' + wv + '   рядом: ' + zs.length + '   до конца ' + clock;
    mp.game.graphics.drawText(txt, [0.5, 0.035], { font: 4, color: [255, 255, 255, 210], scale: [0.44, 0.44], outline: true, centre: true });
    mp.game.graphics.drawText('зомби ' + zs.length + ' | сдвигов ' + ok + ' | ' + tried + ' | ' + (err || 'ок'), [0.5, 0.075], { font: 4, color: [200, 255, 200, 200], scale: [0.32, 0.32], outline: true, centre: true });
  } catch (x) {}
});

mp.events.add('srv:zombieState', function (st, out, w, json, left) {
  ob = !!out;
  wv = Number(w) || 1;
  pLeft = Number(left) || 0;
  pAt = Date.now();
  let arr = [];
  try { arr = JSON.parse(json); } catch (e) { arr = []; }
  zones = [];
  for (let i = 0; i < arr.length; i++) {
    zones.push({ x: arr[i].x, y: arr[i].y, z: arr[i].z || 30, r: arr[i].r || 120 });
  }
  for (let i = 0; i < blips.length; i++) { try { mp.game.ui.removeBlip(blips[i]); } catch (e) {} }
  blips = [];
  for (let i = 0; i < zones.length; i++) {
    const s = zones[i];
    try {
      const b = mp.game.ui.addBlipForRadius(s.x, s.y, s.z, s.r);
      mp.game.ui.setBlipColour(b, 2);
      mp.game.ui.setBlipAlpha(b, 80);
      blips.push(b);
    } catch (e) {}
  }
});

mp.events.add('srv:zombieKillFx', function (cash, total) {
  kills = Number(total) || kills + 1;
});

mp.events.add('srv:zombieDebug', function () {
  mp.gui.chat.push('Зомби ' + zs.length + ' | сдвигов ' + ok + ' | способ ' + tried);
});
