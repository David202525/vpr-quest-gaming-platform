const MODEL = 'a_m_m_hillbilly_01';
let zs = [];

function T(f, a, b, c, d, e, g, h, i, j, k, l) {
  try { return f(a, b, c, d, e, g, h, i, j, k, l); } catch (x) { return null; }
}

function born() {
  const hash = mp.game.joaat(MODEL);
  T(mp.game.streaming.requestModel, hash);
  const me = mp.players.local.position;
  const a = Math.random() * 6.283;
  const x = me.x + Math.cos(a) * 25;
  const y = me.y + Math.sin(a) * 25;
  const h = T(mp.game.ped.createPed, 26, hash, x, y, me.z, 0, false, false);
  if (!h) return;
  T(mp.game.entity.setEntityAsMissionEntity, h, true, true);
  T(mp.game.entity.setEntityHealth, h, 150);
  T(mp.game.ped.setPedCanRagdoll, h, false);
  T(mp.game.ped.setBlockingOfNonTemporaryEvents, h, true);
  T(mp.game.ped.setPedFleeAttributes, h, 0, false);
  T(mp.game.ped.setPedCombatAttributes, h, 46, true);
  T(mp.game.ped.setPedCombatAttributes, h, 5, true);
  T(mp.game.ped.setPedCombatAbility, h, 100);
  T(mp.game.ped.setPedMoveRateOverride, h, 1.2);
  T(mp.game.task.clearPedTasksImmediately, h);
  T(mp.game.task.goToCoordAnyMeans, h, me.x, me.y, me.z, 4.0, 0, false, 786603, 0);
  T(mp.game.ped.setPedKeepTask, h, true);
  zs.push({ h: h, hit: 0, task: 0, dead: false });
}

mp.events.add('render', function () {
  const now = Date.now();
  const me = mp.players.local.position;
  const keep = [];

  zs.forEach(function (z) {
    const c = T(mp.game.entity.getEntityCoords, z.h, true);
    if (!c) { keep.push(z); return; }

    const hp = T(mp.game.entity.getEntityHealth, z.h);
    if (hp !== null && hp <= 0) {
      if (!z.dead) { z.dead = true; mp.events.callRemote('srv:zombieKill'); }
      return;
    }

    const dx = me.x - c.x, dy = me.y - c.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d < 2.2) {
      if (now - z.hit > 1300) {
        z.hit = now;
        mp.events.callRemote('srv:zombieHit', 5);
        T(mp.game.task.playAnim, z.h, 'melee@unarmed@streamed_core', 'ground_attack_on_spot', 8.0, -8.0, 900, 0, 0.0, false, false, false);
        T(mp.game.cam.shakeGameplayCam, 'SMALL_EXPLOSION_SHAKE', 0.3);
      }
    } else if (now - z.task > 1500) {
      z.task = now;
      T(mp.game.task.goToCoordAnyMeans, z.h, me.x, me.y, me.z, 4.0, 0, false, 786603, 0);
      T(mp.game.ped.setPedKeepTask, z.h, true);
    }

    if (d > 200) { T(mp.game.ped.deletePed, z.h); return; }
    keep.push(z);
  });

  zs = keep;
  if (zs.length < 6 && now % 3000 < 20) born();
});

mp.keys.bind(0x76, true, function () { born(); });
mp.keys.bind(0x75, true, function () {
  zs.forEach(function (z) { T(mp.game.ped.deletePed, z.h); });
  zs = [];
  try { mp.peds.forEach(function (p) { try { p.destroy(); } catch (e) {} }); } catch (e) {}
});
