const MODEL = 'a_m_m_hillbilly_01';
let zs = [], last = 0, info = 'F7 - спавн, F6 - очистка';

function T(f, a, b, c, d, e, g, h, i, j, k, l) {
  try { return f(a, b, c, d, e, g, h, i, j, k, l); } catch (x) { return null; }
}

function clean() {
  zs.forEach(function (z) { T(mp.game.ped.deletePed, z.h); T(mp.game.entity.deleteEntity, z.h); });
  zs = [];
  try { mp.peds.forEach(function (p) { try { p.destroy(); } catch (e) {} }); } catch (e) {}
  info = 'Очищено';
}

function born() {
  const hash = mp.game.joaat(MODEL);
  T(mp.game.streaming.requestModel, hash);
  const me = mp.players.local.position;
  const h = T(mp.game.ped.createPed, 26, hash, me.x + 10, me.y + 10, me.z, 0, false, false);
  if (!h) { info = 'createPed = 0'; return; }
  T(mp.game.entity.setEntityAsMissionEntity, h, true, true);
  T(mp.game.entity.setEntityHealth, h, 200);
  T(mp.game.entity.freezeEntityPosition, h, false);
  T(mp.game.ped.setPedCanRagdoll, h, false);
  T(mp.game.ped.setBlockingOfNonTemporaryEvents, h, true);
  T(mp.game.task.clearPedTasksImmediately, h);
  zs.push({ h: h, ox: 0, oy: 0, way: 0, hit: 0, born: Date.now() });
  info = 'Создан ' + h + ', всего ' + zs.length;
}

mp.events.add('render', function () {
  const now = Date.now();
  const dt = Math.min(0.1, (now - last) / 1000) || 0.016;
  last = now;

  mp.game.graphics.drawText(info, [0.5, 0.05], { font: 4, color: [255, 255, 255, 230], scale: [0.45, 0.45], outline: true, centre: true });

  if (!zs.length) return;
  const me = mp.players.local.position;

  zs.forEach(function (z, idx) {
    const c = T(mp.game.entity.getEntityCoords, z.h, true);
    if (!c) { if (idx === 0) info = 'getEntityCoords не работает'; return; }

    const dx = me.x - c.x, dy = me.y - c.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    let hd = Math.atan2(dy, dx) * 180 / Math.PI - 90;
    if (hd < 0) hd = hd + 360;
    T(mp.game.entity.setEntityHeading, z.h, hd);

    if (d < 2.0) {
      T(mp.game.task.playAnim, z.h, 'melee@unarmed@streamed_core', 'ground_attack_on_spot', 8.0, -8.0, 800, 0, 0.0, false, false, false);
      if (now - z.hit > 1200) { z.hit = now; mp.events.callRemote('srv:zombieHit', 5); }
      if (idx === 0) info = 'БЬЁТ | дист ' + d.toFixed(1);
      return;
    }

    const moved = Math.sqrt((c.x - z.ox) * (c.x - z.ox) + (c.y - z.oy) * (c.y - z.oy));
    if (moved < 0.03 && now - z.born > 1000) z.way = z.way + 1; else z.way = 0;
    z.ox = c.x; z.oy = c.y;

    const mv = Math.min(3.0 * dt, d - 1.6);
    const nx = c.x + dx / d * mv, ny = c.y + dy / d * mv;
    let way = 1;

    if (z.way < 40) {
      T(mp.game.entity.setEntityCoordsNoOffset, z.h, nx, ny, c.z, false, false, false);
    } else if (z.way < 80) {
      way = 2;
      T(mp.game.entity.setEntityCoords, z.h, nx, ny, c.z, false, false, false, false);
    } else {
      way = 3;
      T(mp.game.task.goToCoordAnyMeans, z.h, me.x, me.y, me.z, 3.0, 0, false, 786603, 0);
      T(mp.game.ped.setPedKeepTask, z.h, true);
    }

    if (idx === 0) info = 'дист ' + d.toFixed(1) + ' | способ ' + way + ' | стоит ' + z.way + ' | всего ' + zs.length;
  });
});

mp.keys.bind(0x76, true, function () { born(); });
mp.keys.bind(0x75, true, function () { clean(); });
