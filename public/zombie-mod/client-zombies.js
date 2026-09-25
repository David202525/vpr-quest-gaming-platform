const M = ['a_m_m_hillbilly_01', 'a_m_m_tramp_01', 'a_m_y_methhead_01', 'a_m_m_farmer_01'];
let zs = [], ob = false, wv = 1, zones = [], blips = [];
let pLeft = 0, pAt = 0, kills = 0, spawnAt = 0, miss = {}, err = '', ok = 0;

function C(ns, name, a, b, c, d, e, g, h, i, j, k) {
  const o = mp.game[ns];
  if (!o || typeof o[name] !== 'function') { miss[ns + '.' + name] = 1; return null; }
  try { return o[name](a, b, c, d, e, g, h, i, j, k); } catch (x) { err = name + ': ' + String(x).slice(0, 40); return null; }
}
function len(ax, ay, bx, by) { return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by)); }
function isSafe(x, y, pad) {
  for (let i = 0; i < zones.length; i++) {
    if (len(x, y, zones[i].x, zones[i].y) < zones[i].r + pad) return true;
  }
  return false;
}
function missList() {
  const a = [];
  for (const k in miss) a.push(k);
  return a;
}

function born() {
  const hash = mp.game.joaat(M[Math.floor(Math.random() * M.length)]);
  C('streaming', 'requestModel', hash);
  const me = mp.players.local.position;
  const ang = Math.random() * 6.283;
  const r = ob ? 25 + Math.random() * 35 : 35 + Math.random() * 35;
  const x = me.x + Math.cos(ang) * r;
  const y = me.y + Math.sin(ang) * r;
  if (isSafe(x, y, 20)) return;
  const h = C('ped', 'createPed', 26, hash, x, y, me.z, 0, false, false);
  if (!h) return;
  const hp = ob ? 120 + wv * 20 : 100;
  C('entity', 'setEntityAsMissionEntity', h, true, true);
  C('entity', 'setEntityHealth', h, hp);
  C('entity', 'freezeEntityPosition', h, false);
  C('ped', 'setPedMaxHealth', h, hp);
  C('ped', 'setPedCanRagdoll', h, false);
  C('ped', 'setPedFleeAttributes', h, 0, false);
  C('ped', 'setPedCombatAbility', h, 100);
  C('ped', 'setPedMoveRateOverride', h, ob ? 1.4 : 1.1);
  C('task', 'clearPedTasksImmediately', h);
  zs.push({ h: h, hit: 0, task: 0, dead: false, px: x, py: y, stuck: 0 });
}

function brain() {
  const me = mp.players.local.position;
  const now = Date.now();
  const inZone = isSafe(me.x, me.y, 0);
  const keep = [];

  for (let i = 0; i < zs.length; i++) {
    const z = zs[i];
    const c = C('entity', 'getEntityCoords', z.h, true);
    if (!c) { keep.push(z); continue; }

    const hp = C('entity', 'getEntityHealth', z.h);
    if (hp !== null && hp <= 0) {
      if (!z.dead) { z.dead = true; mp.events.callRemote('srv:zombieKill'); }
      continue;
    }

    const d = len(c.x, c.y, me.x, me.y);
    if (d > 250 || inZone || isSafe(c.x, c.y, 0)) { C('ped', 'deletePed', z.h); continue; }

    if (d < 2.3) {
      if (now - z.hit > 1300) {
        z.hit = now;
        mp.events.callRemote('srv:zombieHit', ob ? 6 + Math.floor(wv / 2) : 4);
        C('task', 'playAnim', z.h, 'melee@unarmed@streamed_core', 'ground_attack_on_spot', 8.0, -8.0, 900, 0, 0.0, false, false, false);
        C('cam', 'shakeGameplayCam', 'SMALL_EXPLOSION_SHAKE', 0.3);
      }
      keep.push(z);
      continue;
    }

    const moved = len(c.x, c.y, z.px, z.py);
    z.px = c.x; z.py = c.y;
    if (moved < 0.15) z.stuck = z.stuck + 1; else { z.stuck = 0; ok = ok + 1; }

    const dx = me.x - c.x, dy = me.y - c.y;

    if (z.stuck > 3) {
      C('entity', 'setEntityCoordsNoOffset', z.h, c.x + dx / d * 1.2, c.y + dy / d * 1.2, c.z, false, false, false);
      let hd = Math.atan2(dy, dx) * 180 / Math.PI - 90;
      if (hd < 0) hd = hd + 360;
      C('entity', 'setEntityHeading', z.h, hd);
      C('task', 'playAnim', z.h, 'move_m@generic', 'walk', 8.0, -8.0, -1, 1, 0.0, false, false, false);
    } else if (now - z.task > 1200) {
      z.task = now;
      C('task', 'clearPedTasks', z.h);
      C('task', 'goToCoordAnyMeans', z.h, me.x, me.y, me.z, 3.0, 0, false, 786603, 0);
      C('ped', 'setPedKeepTask', z.h, true);
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

    const bad = missList();
    if (bad.length) {
      mp.game.graphics.drawText('~r~НЕТ: ' + bad.join(', '), [0.5, 0.075], { font: 4, color: [255, 160, 160, 230], scale: [0.32, 0.32], outline: true, centre: true });
    }
    if (err) {
      mp.game.graphics.drawText('~r~' + err, [0.5, 0.105], { font: 4, color: [255, 200, 120, 220], scale: [0.32, 0.32], outline: true, centre: true });
    }
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
  for (let i = 0; i < blips.length; i++) C('ui', 'removeBlip', blips[i]);
  blips = [];
  for (let i = 0; i < zones.length; i++) {
    const s = zones[i];
    const b = C('ui', 'addBlipForRadius', s.x, s.y, s.z, s.r);
    if (!b) continue;
    C('ui', 'setBlipColour', b, 2);
    C('ui', 'setBlipAlpha', b, 80);
    blips.push(b);
  }
});

mp.events.add('srv:zombieKillFx', function (cash, total) {
  kills = Number(total) || kills + 1;
});

mp.events.add('srv:zombieDebug', function () {
  mp.gui.chat.push('Зомби ' + zs.length + ' | сдвигов ' + ok);
  mp.gui.chat.push('Нет функций: ' + (missList().join(', ') || 'все есть'));
});
