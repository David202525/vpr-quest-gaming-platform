const M = ['a_m_m_hillbilly_01', 'a_m_m_tramp_01', 'a_m_y_methhead_01', 'a_m_m_farmer_01'];
let zs = [], ob = false, wv = 1, zones = [], blips = [];
let pLeft = 0, pAt = 0, kills = 0, tk = 0, spawnAt = 0;

function T(f, a, b, c, d, e, g, h, i, j, k, l) {
  try { return f(a, b, c, d, e, g, h, i, j, k, l); } catch (x) { return null; }
}
function len(ax, ay, bx, by) { return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by)); }
function isSafe(x, y, pad) { return zones.some(function (s) { return len(x, y, s.x, s.y) < s.r + pad; }); }

function mapZones() {
  blips.forEach(function (b) { T(mp.game.ui.removeBlip, b); });
  blips = [];
  zones.forEach(function (s) {
    const b = T(mp.game.ui.addBlipForRadius, s.x, s.y, s.z, s.r);
    if (!b) return;
    T(mp.game.ui.setBlipColour, b, 2);
    T(mp.game.ui.setBlipAlpha, b, 80);
    blips.push(b);
  });
}

function born() {
  const hash = mp.game.joaat(M[Math.floor(Math.random() * M.length)]);
  T(mp.game.streaming.requestModel, hash);
  const me = mp.players.local.position;
  const a = Math.random() * 6.283;
  const r = ob ? 25 + Math.random() * 40 : 40 + Math.random() * 40;
  const x = me.x + Math.cos(a) * r;
  const y = me.y + Math.sin(a) * r;
  if (isSafe(x, y, 20)) return;
  const h = T(mp.game.ped.createPed, 26, hash, x, y, me.z, 0, false, false);
  if (!h) return;
  const hp = ob ? 120 + wv * 20 : 100;
  T(mp.game.entity.setEntityAsMissionEntity, h, true, true);
  T(mp.game.entity.setEntityHealth, h, hp);
  T(mp.game.ped.setPedMaxHealth, h, hp);
  T(mp.game.ped.setPedCanRagdoll, h, false);
  T(mp.game.ped.setBlockingOfNonTemporaryEvents, h, true);
  T(mp.game.ped.setPedFleeAttributes, h, 0, false);
  T(mp.game.ped.setPedCombatAttributes, h, 46, true);
  T(mp.game.ped.setPedCombatAttributes, h, 5, true);
  T(mp.game.ped.setPedCombatAbility, h, 100);
  T(mp.game.ped.setPedMoveRateOverride, h, ob ? 1.4 : 1.1);
  T(mp.game.task.clearPedTasksImmediately, h);
  T(mp.game.task.goToCoordAnyMeans, h, me.x, me.y, me.z, 4.0, 0, false, 786603, 0);
  T(mp.game.ped.setPedKeepTask, h, true);
  zs.push({ h: h, hit: 0, task: 0, dead: false });
}

mp.events.add('render', function () {
  const now = Date.now();
  tk = tk + 1;
  const me = mp.players.local.position;
  const inZone = isSafe(me.x, me.y, 0);
  const keep = [];

  zs.forEach(function (z) {
    const c = T(mp.game.entity.getEntityCoords, z.h, true);
    if (!c) { keep.push(z); return; }

    const hp = T(mp.game.entity.getEntityHealth, z.h);
    if (hp !== null && hp <= 0) {
      if (!z.dead) { z.dead = true; mp.events.callRemote('srv:zombieKill'); }
      return;
    }

    const d = len(c.x, c.y, me.x, me.y);
    if (d > 250 || inZone || isSafe(c.x, c.y, 0)) { T(mp.game.ped.deletePed, z.h); return; }

    if (d < 2.2) {
      if (now - z.hit > 1300) {
        z.hit = now;
        mp.events.callRemote('srv:zombieHit', ob ? 6 + Math.floor(wv / 2) : 4);
        T(mp.game.task.playAnim, z.h, 'melee@unarmed@streamed_core', 'ground_attack_on_spot', 8.0, -8.0, 900, 0, 0.0, false, false, false);
        T(mp.game.cam.shakeGameplayCam, 'SMALL_EXPLOSION_SHAKE', 0.3);
      }
    } else if (now - z.task > 1500) {
      z.task = now;
      T(mp.game.task.goToCoordAnyMeans, z.h, me.x, me.y, me.z, 4.0, 0, false, 786603, 0);
      T(mp.game.ped.setPedKeepTask, z.h, true);
    }
    keep.push(z);
  });

  zs = keep;

  const cap = ob ? Math.min(25, 10 + wv * 2) : 5;
  const gap = ob ? 700 : 4000;
  if (!inZone && zs.length < cap && now - spawnAt > gap) {
    spawnAt = now;
    born();
    if (ob) born();
  }

  const ms = Math.max(0, pLeft - (now - pAt));
  const sec = Math.floor(ms % 60000 / 1000);
  const clock = Math.floor(ms / 60000) + ':' + (sec < 10 ? '0' + sec : sec);
  let txt = '~y~затишье~w~   до прорыва ' + clock + '   убито: ' + kills;
  if (inZone) txt = '~g~БЕЗОПАСНАЯ ЗОНА~w~   ' + clock;
  else if (ob) txt = '~r~ПРОРЫВ~w~   волна ' + wv + '   рядом: ' + zs.length + '   до конца ' + clock;
  mp.game.graphics.drawText(txt, [0.5, 0.035], { font: 4, color: [255, 255, 255, 210], scale: [0.44, 0.44], outline: true, centre: true });

  zones.forEach(function (s) {
    if (len(s.x, s.y, me.x, me.y) > s.r + 60) return;
    const w = s.r * 2;
    T(mp.game.graphics.drawMarker, 1, s.x, s.y, s.z - 1, 0, 0, 0, 0, 0, 0, w, w, 2.0, 80, 220, 90, 40, false, false, 2, false, null, null, false);
  });
});

mp.events.add('srv:zombieState', function (st, out, w, json, left) {
  ob = !!out;
  wv = Number(w) || 1;
  pLeft = Number(left) || 0;
  pAt = Date.now();
  let arr = [];
  try { arr = JSON.parse(json); } catch (e) { arr = []; }
  zones = arr.map(function (s) { return { x: s.x, y: s.y, z: s.z || 30, r: s.r || 120 }; });
  mapZones();
});

mp.events.add('srv:zombieKillFx', function (cash, total) {
  kills = Number(total) || kills + 1;
});

mp.events.add('srv:zombieDebug', function () {
  mp.gui.chat.push('Зомби рядом: ' + zs.length + ' | ' + (ob ? 'прорыв' : 'затишье'));
});
