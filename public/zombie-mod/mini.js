const MODEL = 'a_m_m_hillbilly_01';
let zs = [], on = false, last = 0, info = 'F7 - спавн, F6 - очистка';

function T(f, a, b, c, d, e, g, h, i, j, k, l) {
  try { return f(a, b, c, d, e, g, h, i, j, k, l); } catch (x) { return null; }
}

function clean() {
  zs.forEach(function (z) { T(mp.game.ped.deletePed, z.h); T(mp.game.entity.deleteEntity, z.h); });
  zs = [];
  try { mp.peds.forEach(function (p) { try { p.destroy(); } catch (e) {} }); } catch (e) {}
  T(mp.game.ped.clearAreaOfPeds, 0, 0, 0, 100000, 0);
  info = 'Карта очищена';
}

function born() {
  const hash = mp.game.joaat(MODEL);
  T(mp.game.streaming.requestModel, hash);
  if (!T(mp.game.streaming.hasModelLoaded, hash)) { info = 'Модель грузится, жми ещё'; return; }
  const me = mp.players.local.position;
  const x = me.x + 12, y = me.y + 12;
  const h = T(mp.game.ped.createPed, 26, hash, x, y, me.z, 0, false, false);
  if (!h) { info = 'createPed вернул 0'; return; }
  T(mp.game.entity.setEntityAsMissionEntity, h, true, true);
  T(mp.game.entity.setEntityHealth, h, 200);
  T(mp.game.entity.setEntityInvincible, h, false);
  T(mp.game.ped.setPedCanRagdoll, h, false);
  T(mp.game.ped.setBlockingOfNonTemporaryEvents, h, true);
  T(mp.game.ped.setPedFleeAttributes, h, 0, false);
  T(mp.game.entity.freezeEntityPosition, h, false);
  T(mp.game.task.clearPedTasksImmediately, h);
  zs.push({ h: h, ox: x, oy: y, way: 0, hit: 0 });
  info = 'Создан, всего ' + zs.length;
}

function push(z, me, dt) {
  const c = T(mp.game.entity.getEntityCoords, z.h, true);
  if (!c) return -1;
  const dx = me.x - c.x, dy = me.y - c.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  let hd = Math.atan2(dy, dx) * 180 / Math.PI - 90;
  if (hd < 0) hd = hd + 360;
  T(mp.game.entity.setEntityHeading, z.h, hd);

  if (d < 2.0) {
    T(mp.game.task.playAnim, z.h, 'melee@unarmed@streamed_core', 'ground_attack_on_spot', 8.0, -8.0, 800, 0, 0.0, false, false, false);
    return d;
  }

  const moved = Math.sqrt((c.x - z.ox) * (c.x - z.ox) + (c.y - z.oy) * (c.y - z.oy));
  if (moved < 0.05) z.way = z.way + 1; else z.way = 0;
  z.ox = c.x; z.oy = c.y;

  const mv = Math.min(3.0 * dt, d - 1.6);
  const nx = c.x + dx / d * mv, ny = c.y + dy / d * mv;

  if (z.way < 30) {
    T(mp.game.entity.setEntityCoordsNoOffset, z.h, nx, ny, c.z, false, false, false);
  } else if (z.way < 60) {
    T(mp.game.entity.setEntityCoords, z.h, nx, ny, c.z, false, false, false, false);
  } else {
    T(mp.game.task.goToCoordAnyMeans, z.h, me.x, me.y, me.z, 3.0, 0, false, 786603, 0);
    T(mp.game.ped.setPedKeepTask, z.h, true);
    T(mp.game.entity.applyForceToEntity, z.h, 1, dx / d * 8, dy / d * 8, 0, 0, 0, 0, 0, false, true, true, false, true);
  }
  return d;
}

mp.events.add('render', function () {
  const now = Date.now();
  const dt = Math.min(0.1, (now - last) / 1000) || 0.016;
  last = now;

  mp.game.graphics.drawText(info, [0.5, 0.05], { font: 4, color: [255, 255, 255, 220], scale: [0.45, 0.45], outline: true, centre: true });

  if (!on) return;
  const me = mp.players.local.position;
  const keep = [];
  zs.forEach(function (z) {
    if (!T(mp.game.entity.doesEntityExist, z.h)) return;
    if (T(mp.game.entity.isEntityDead, z.h)) { mp.events.callRemote('srv:zombieKill'); T(mp.game.ped.deletePed, z.h); return; }
    const d = push(z, me, dt);
    if (d < 0) return;
    if (d < 2.3 && now - z.hit > 1200) { z.hit = now; mp.events.callRemote('srv:zombieHit', 5); }
    if (zs.length && z === zs[0]) info = 'дист ' + d.toFixed(1) + ' м | способ ' + (z.way < 30 ? 1 : (z.way < 60 ? 2 : 3)) + ' | зомби ' + zs.length;
    keep.push(z);
  });
  zs = keep;
});

mp.keys.bind(0x76, true, function () { on = true; born(); });
mp.keys.bind(0x75, true, function () { clean(); });
