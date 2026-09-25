const M = ['a_m_m_hillbilly_01', 'a_m_m_tramp_01', 'a_m_y_methhead_01', 'a_m_m_farmer_01'];
const WD = 'move_m@generic';
const AD = 'melee@unarmed@streamed_core';
const N_SETPOS = '0x06843DA7060A026B';
const N_HEAD = '0x8E2530AA8ADA980E';
const N_ANIM = '0xEA47FE3719165B94';
const N_ISANIM = '0x1F0B79228E461EC9';
const N_CLEAR = '0xAAA34F8A7CB32098';
const N_HP = '0xEEF059FAD016D209';
const N_SETHP = '0x6B76DC1F3AE6E6A3';
const N_BLOCK = '0x9F8AA94D6D97DBF4';
const N_FREEZE = '0x428CA6DBD1094446';
const N_RAGD = '0xB128377056A54E2A';
const N_GROUND = '0xC906A7DAB05C8D2B';
const N_REQANIM = '0xD3BD40951412FEF6';
const N_HASANIM = '0xD031A9162D01088C';

let zs = [], ob = false, wv = 1, zones = [], blips = [];
let pLeft = 0, pAt = 0, kills = 0, spawnAt = 0, err = '', moves = 0, tickAt = 0, cleaned = false;

function iv(hash, a, b, c, d, e, f, g, h, i, j, k) {
  try { return mp.game.invoke(hash, a, b, c, d, e, f, g, h, i, j, k); } catch (x) { err = String(x).slice(0, 30); return null; }
}
function len(ax, ay, bx, by) { return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by)); }
function isSafe(x, y, pad) {
  for (let i = 0; i < zones.length; i++) {
    if (len(x, y, zones[i].x, zones[i].y) < zones[i].r + pad) return true;
  }
  return false;
}
function groundAt(x, y, z) {
  try {
    const r = mp.game.gameplay.getGroundZFor3dCoord(x, y, z + 3.0, 0.0, false, false);
    const g = r && typeof r === 'object' ? r.groundZ : r;
    if (typeof g === 'number' && g > 1) return g;
  } catch (e) {}
  return null;
}

function wipeAll() {
  for (let i = 0; i < zs.length; i++) { try { zs[i].p.destroy(); } catch (e) {} }
  zs = [];
  try { mp.peds.forEach(function (p) { try { p.destroy(); } catch (e) {} }); } catch (e) {}
}

function playWalk(z) {
  iv(N_ANIM, z.h, WD, 'walk', 8.0, -8.0, -1, 1, 0.0, false, false, false);
  z.animAt = Date.now();
  z.mode = 'walk';
}

function born() {
  const hash = mp.game.joaat(M[Math.floor(Math.random() * M.length)]);
  try { mp.game.streaming.requestModel(hash); } catch (e) {}
  iv(N_REQANIM, WD);
  iv(N_REQANIM, AD);
  const me = mp.players.local.position;
  const ang = Math.random() * 6.283;
  const r = ob ? 25 + Math.random() * 30 : 30 + Math.random() * 30;
  const x = me.x + Math.cos(ang) * r;
  const y = me.y + Math.sin(ang) * r;
  if (isSafe(x, y, 20)) return;
  const g = groundAt(x, y, me.z);
  const z0 = g === null ? me.z : g;

  let ped = null;
  try { ped = mp.peds.new(hash, new mp.Vector3(x, y, z0), 0, 0); } catch (e) { err = 'new ' + String(e).slice(0, 20); return; }
  if (!ped || !ped.handle) return;

  const h = ped.handle;
  const hp = ob ? 120 + wv * 20 : 100;
  iv(N_SETHP, h, hp);
  iv(N_BLOCK, h, true);
  iv(N_FREEZE, h, false);
  iv(N_RAGD, h, false);
  iv(N_CLEAR, h);
  const z = { p: ped, h: h, x: x, y: y, z: z0, hit: 0, dead: false, animAt: 0, mode: '' };
  playWalk(z);
  zs.push(z);
}

function brain() {
  const me = mp.players.local.position;
  const now = Date.now();
  const dt = Math.min(0.5, (now - tickAt) / 1000) || 0.15;
  tickAt = now;
  const inZone = isSafe(me.x, me.y, 0);
  const keep = [];
  const speed = ob ? 3.0 : 2.0;

  for (let i = 0; i < zs.length; i++) {
    const z = zs[i];

    const hp = iv(N_HP, z.h);
    if (typeof hp === 'number' && hp < 5) {
      if (!z.dead) { z.dead = true; mp.events.callRemote('srv:zombieKill'); }
      try { z.p.destroy(); } catch (e) {}
      continue;
    }

    const dx = me.x - z.x, dy = me.y - z.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d > 250 || inZone || isSafe(z.x, z.y, 0)) {
      try { z.p.destroy(); } catch (e) {}
      continue;
    }

    let hd = Math.atan2(dy, dx) * 180 / Math.PI - 90;
    if (hd < 0) hd = hd + 360;
    iv(N_HEAD, z.h, hd);

    if (d < 2.0) {
      if (now - z.hit > 1300) {
        z.hit = now;
        z.mode = 'hit';
        mp.events.callRemote('srv:zombieHit', ob ? 6 + Math.floor(wv / 2) : 4);
        iv(N_ANIM, z.h, AD, 'ground_attack_on_spot', 8.0, -8.0, 1000, 0, 0.0, false, false, false);
        try { mp.game.cam.shakeGameplayCam('SMALL_EXPLOSION_SHAKE', 0.3); } catch (e) {}
      }
      keep.push(z);
      continue;
    }

    if (z.mode !== 'walk' || now - z.animAt > 900) playWalk(z);

    const mv = Math.min(speed * dt, d - 1.6);
    z.x = z.x + dx / d * mv;
    z.y = z.y + dy / d * mv;
    const g = groundAt(z.x, z.y, z.z);
    if (g !== null) z.z = g;
    moves = moves + 1;

    iv(N_SETPOS, z.h, z.x, z.y, z.z, false, false, false, false);
    try { z.p.position = new mp.Vector3(z.x, z.y, z.z); } catch (e) {}
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
  if (!cleaned) { cleaned = true; wipeAll(); }
  try { brain(); } catch (x) { err = 'brain ' + String(x).slice(0, 25); }
}, 100);

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
  mp.gui.chat.push('Зомби ' + zs.length + ' | шагов ' + moves + ' | ' + (err || 'ок'));
  wipeAll();
  mp.gui.chat.push('Карта очищена');
});
