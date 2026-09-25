const M = ['a_m_m_hillbilly_01', 'a_m_m_tramp_01', 'a_m_y_methhead_01', 'a_m_m_farmer_01'];
let zs = [], ob = false, wv = 1, zones = [], blips = [];
let pLeft = 0, pAt = 0, kills = 0, spawnAt = 0, err = '', ok = 0;

function P(o, name, a, b, c, d, e, g, h, i, j, k) {
  if (!o || typeof o[name] !== 'function') return null;
  try { return o[name](a, b, c, d, e, g, h, i, j, k); } catch (x) { err = name + ': ' + String(x).slice(0, 35); return null; }
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
  P(mp.game.streaming, 'requestModel', hash);
  const me = mp.players.local.position;
  const ang = Math.random() * 6.283;
  const r = ob ? 25 + Math.random() * 35 : 35 + Math.random() * 35;
  const x = me.x + Math.cos(ang) * r;
  const y = me.y + Math.sin(ang) * r;
  if (isSafe(x, y, 20)) return;

  let ped = null;
  try { ped = mp.peds.new(hash, new mp.Vector3(x, y, me.z), 0, 0); } catch (e) { err = 'new: ' + String(e).slice(0, 30); return; }
  if (!ped) return;

  const hp = ob ? 120 + wv * 20 : 100;
  P(ped, 'setHealth', hp);
  P(ped, 'setMaxHealth', hp);
  P(ped, 'freezePosition', false);
  P(ped, 'setCanRagdoll', false);
  P(ped, 'setFleeAttributes', 0, false);
  P(ped, 'setCombatAbility', 100);
  P(ped, 'setCombatAttributes', 46, true);
  P(ped, 'setCombatAttributes', 5, true);
  P(ped, 'setMoveRateOverride', ob ? 1.4 : 1.1);
  P(ped, 'setBlockingOfNonTemporaryEvents', true);
  P(ped, 'clearTasksImmediately');
  zs.push({ p: ped, hit: 0, task: 0, dead: false, px: x, py: y, stuck: 0 });
}

function chase(z, me) {
  if (P(z.p, 'taskGoToCoordAnyMeans', me.x, me.y, me.z, 3.0, 0, false, 786603, 0) !== null) return;
  if (P(z.p, 'taskGoToEntity', mp.players.local.handle, -1, 1.0, 2.0, 1073741824.0, 0) !== null) return;
  P(z.p, 'taskCombatPed', mp.players.local.handle, 0, 16);
}

function brain() {
  const me = mp.players.local.position;
  const now = Date.now();
  const inZone = isSafe(me.x, me.y, 0);
  const keep = [];

  for (let i = 0; i < zs.length; i++) {
    const z = zs[i];
    let c = null;
    try { c = z.p.position; } catch (e) { continue; }
    if (!c) { keep.push(z); continue; }

    let hp = 100;
    try { hp = z.p.getHealth(); } catch (e) { hp = 100; }
    if (hp <= 0) {
      if (!z.dead) { z.dead = true; mp.events.callRemote('srv:zombieKill'); }
      continue;
    }

    const d = len(c.x, c.y, me.x, me.y);
    if (d > 250 || inZone || isSafe(c.x, c.y, 0)) {
      try { z.p.destroy(); } catch (e) {}
      continue;
    }

    if (d < 2.3) {
      if (now - z.hit > 1300) {
        z.hit = now;
        mp.events.callRemote('srv:zombieHit', ob ? 6 + Math.floor(wv / 2) : 4);
        P(z.p, 'taskPlayAnim', 'melee@unarmed@streamed_core', 'ground_attack_on_spot', 8.0, -8.0, 900, 0, 0.0, false, false, false);
        P(mp.game.cam, 'shakeGameplayCam', 'SMALL_EXPLOSION_SHAKE', 0.3);
      }
      keep.push(z);
      continue;
    }

    const moved = len(c.x, c.y, z.px, z.py);
    z.px = c.x; z.py = c.y;
    if (moved < 0.15) z.stuck = z.stuck + 1; else { z.stuck = 0; ok = ok + 1; }

    const dx = me.x - c.x, dy = me.y - c.y;

    if (z.stuck > 4) {
      let hd = Math.atan2(dy, dx) * 180 / Math.PI - 90;
      if (hd < 0) hd = hd + 360;
      try { z.p.heading = hd; } catch (e) {}
      try { z.p.position = new mp.Vector3(c.x + dx / d * 1.1, c.y + dy / d * 1.1, c.z); } catch (e) {}
      P(z.p, 'taskPlayAnim', 'move_m@generic', 'walk', 8.0, -8.0, -1, 1, 0.0, false, false, false);
    } else if (now - z.task > 1200) {
      z.task = now;
      chase(z, me);
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
  try { brain(); } catch (x) { err = 'brain: ' + String(x).slice(0, 40); }
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
    if (err) mp.game.graphics.drawText('~r~' + err, [0.5, 0.075], { font: 4, color: [255, 170, 170, 220], scale: [0.32, 0.32], outline: true, centre: true });
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
  for (let i = 0; i < blips.length; i++) P(mp.game.ui, 'removeBlip', blips[i]);
  blips = [];
  for (let i = 0; i < zones.length; i++) {
    const s = zones[i];
    const b = P(mp.game.ui, 'addBlipForRadius', s.x, s.y, s.z, s.r);
    if (!b) continue;
    P(mp.game.ui, 'setBlipColour', b, 2);
    P(mp.game.ui, 'setBlipAlpha', b, 80);
    blips.push(b);
  }
});

mp.events.add('srv:zombieKillFx', function (cash, total) {
  kills = Number(total) || kills + 1;
});

mp.events.add('srv:zombieDebug', function () {
  mp.gui.chat.push('Зомби ' + zs.length + ' | сдвигов ' + ok + ' | ' + (err || 'ошибок нет'));
});
