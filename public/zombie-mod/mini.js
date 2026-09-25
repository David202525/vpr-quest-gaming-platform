const M = ['a_m_m_hillbilly_01', 'a_m_m_tramp_01', 'a_m_y_methhead_01'];
const WD = 'move_m@generic';
const AD = 'melee@unarmed@streamed_core';
let zs = [], on = false, last = 0, tk = 0;

function T(f, a, b, c, d, e, g, h, i, j, k, l) {
  try { return f(a, b, c, d, e, g, h, i, j, k, l); } catch (x) { return null; }
}

function born() {
  const hash = mp.game.joaat(M[Math.floor(Math.random() * M.length)]);
  T(mp.game.streaming.requestModel, hash);
  if (!T(mp.game.streaming.hasModelLoaded, hash)) return;
  const me = mp.players.local.position;
  const a = Math.random() * 6.283;
  const x = me.x + Math.cos(a) * 40;
  const y = me.y + Math.sin(a) * 40;
  const h = T(mp.game.ped.createPed, 26, hash, x, y, me.z, 0, false, false);
  if (!h) return;
  T(mp.game.entity.setEntityAsMissionEntity, h, true, true);
  T(mp.game.entity.setEntityHealth, h, 100);
  T(mp.game.ped.setPedCanRagdoll, h, false);
  T(mp.game.ped.setBlockingOfNonTemporaryEvents, h, true);
  T(mp.game.task.clearPedTasksImmediately, h);
  zs.push({ h: h, hit: 0, anim: '', dead: false });
}

function step(z, me, dt) {
  const c = T(mp.game.entity.getEntityCoords, z.h, true);
  if (!c) return -1;
  const dx = me.x - c.x;
  const dy = me.y - c.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  let hd = Math.atan2(dy, dx) * 180 / Math.PI - 90;
  if (hd < 0) hd = hd + 360;
  T(mp.game.entity.setEntityHeading, z.h, hd);
  const near = d < 2.0;
  const want = near ? 'ground_attack_on_spot' : 'walk';
  if (z.anim !== want) {
    z.anim = want;
    T(mp.game.task.playAnim, z.h, near ? AD : WD, want, 8.0, -8.0, -1, 1, 0.0, false, false, false);
  }
  if (near) return d;
  const mv = Math.min(2.5 * dt, d - 1.6);
  const nx = c.x + dx / d * mv;
  const ny = c.y + dy / d * mv;
  T(mp.game.entity.setEntityCoordsNoOffset, z.h, nx, ny, c.z, false, false, false);
  return d;
}

mp.events.add('render', function () {
  if (!on) return;
  const now = Date.now();
  const dt = Math.min(0.1, (now - last) / 1000) || 0.016;
  last = now;
  tk = tk + 1;
  const me = mp.players.local.position;
  const keep = [];
  zs.forEach(function (z) {
    if (!T(mp.game.entity.doesEntityExist, z.h)) return;
    if (T(mp.game.entity.isEntityDead, z.h)) {
      if (!z.dead) {
        z.dead = true;
        mp.events.callRemote('srv:zombieKill');
      }
      keep.push(z);
      return;
    }
    const d = step(z, me, dt);
    if (d < 0) return;
    if (d < 2.3 && now - z.hit > 1200) {
      z.hit = now;
      mp.events.callRemote('srv:zombieHit', 5);
    }
    keep.push(z);
  });
  zs = keep;
  if (zs.length < 5 && tk % 120 === 0) born();
});

mp.keys.bind(0x76, true, function () {
  on = true;
  born();
  mp.gui.chat.push('Зомби: ' + zs.length);
});
