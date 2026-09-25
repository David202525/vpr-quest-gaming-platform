const M = ['a_m_m_hillbilly_01', 'a_m_m_tramp_01', 'a_m_y_methhead_01', 'a_m_m_farmer_01'];
const WD = 'move_m@generic';
const WA = 'walk';
const AD = 'melee@unarmed@streamed_core';
const AA = 'ground_attack_on_spot';

let on = false, ob = false, wv = 1, zones = [], blips = [];
let pLeft = 0, pAt = 0, zs = [], kills = 0, fx = '', fxAt = 0;
let grp = 0, tk = 0, dbg = false, last = 0, booted = false;

function T(f, a, b, c, d, e, g, h, i, j, k, l) {
  try { return f(a, b, c, d, e, g, h, i, j, k, l); } catch (x) { if (dbg) mp.gui.chat.push('!{#e05555}' + x); return null; }
}
function len(ax, ay, bx, by) { return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by)); }
function isSafe(x, y, pad) { return zones.some(function (s) { return len(x, y, s.x, s.y) < s.r + pad; }); }
function spd() { return ob ? (wv > 5 ? 3.0 : 2.5) : 1.6; }

function ground(x, y, z) {
  const r = T(mp.game.gameplay.getGroundZFor3dCoord, x, y, z, 0.0, false, false);
  const g = r && typeof r === 'object' ? r.groundZ : r;
  return typeof g === 'number' && g > 1 ? g : null;
}

function mapZones() {
  const u = mp.game.ui;
  blips.forEach(function (b) { T(u.removeBlip, b); });
  blips = [];
  zones.forEach(function (s) {
    const b = T(u.addBlipForRadius, s.x, s.y, s.z, s.r);
    if (!b) return;
    T(u.setBlipColour, b, 2);
    T(u.setBlipAlpha, b, 90);
    blips.push(b);
  });
}

function nuke() {
  zs.forEach(function (z) { T(mp.game.ped.deletePed, z.h); T(mp.game.entity.deleteEntity, z.h); });
  zs = [];
  try { mp.peds.forEach(function (p) { try { p.destroy(); } catch (e) {} }); } catch (e) {}
}

function boot() {
  if (booted) return;
  booted = true;
  grp = mp.game.joaat('ZOMBIES');
  const pl = mp.game.joaat('PLAYER');
  T(mp.game.ped.addRelationshipGroup, 'ZOMBIES', grp);
  T(mp.game.ped.setRelationshipBetweenGroups, 5, grp, pl);
  T(mp.game.ped.setRelationshipBetweenGroups, 5, pl, grp);
  T(mp.game.ped.setRelationshipBetweenGroups, 0, grp, grp);
  T(mp.game.streaming.requestAnimDict, WD);
  T(mp.game.streaming.requestAnimDict, AD);
  M.forEach(function (n) { T(mp.game.streaming.requestModel, mp.game.joaat(n)); });
  nuke();
}

function born() {
  boot();
  const hash = mp.game.joaat(M[Math.floor(Math.random() * M.length)]);
  if (!T(mp.game.streaming.hasModelLoaded, hash)) { T(mp.game.streaming.requestModel, hash); return; }
  const me = mp.players.local.position;
  const a = Math.random() * 6.283;
  const r = ob ? 30 + Math.random() * 50 : 45 + Math.random() * 50;
  const x = me.x + Math.cos(a) * r, y = me.y + Math.sin(a) * r;
  if (isSafe(x, y, 25)) return;
  const gz = ground(x, y, me.z + 60);
  const z = (gz === null ? me.z : gz) + 1;
  const h = T(mp.game.ped.createPed, 26, hash, x, y, z, Math.random() * 360, false, false);
  if (!h) return;
  const hp = ob ? 120 + wv * 25 : 90;
  const p = mp.game.ped, en = mp.game.entity;
  T(en.setEntityAsMissionEntity, h, true, true);
  T(en.setEntityHealth, h, hp);
  T(en.setEntityInvincible, h, false);
  T(en.setEntityCollision, h, true, true);
  T(p.setPedMaxHealth, h, hp);
  T(p.setPedRelationshipGroupHash, h, grp);
  T(p.setPedAsEnemy, h, true);
  T(p.setBlockingOfNonTemporaryEvents, h, true);
  T(p.setPedCanRagdoll, h, false);
  T(p.setPedSuffersCriticalHits, h, true);
  T(mp.game.task.clearPedTasksImmediately, h);
  zs.push({ h: h, hit: 0, gone: false, anim: '' });
}

function move(z, me, dt) {
  const en = mp.game.entity;
  const c = T(en.getEntityCoords, z.h, true);
  if (!c) return -1;
  const dx = me.x - c.x, dy = me.y - c.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  let hd = Math.atan2(dy, dx) * 180 / Math.PI - 90;
  if (hd < 0) hd += 360;
  T(en.setEntityHeading, z.h, hd);

  const want = d < 2.0 ? AA : WA;
  if (z.anim !== want) {
    z.anim = want;
    T(mp.game.task.clearPedTasksImmediately, z.h);
    T(mp.game.task.playAnim, z.h, want === AA ? AD : WD, want, 8.0, -8.0, -1, 1, 0.0, false, false, false);
  }
  if (d < 2.0) return d;

  const mv = Math.min(spd() * dt, d - 1.6);
  const nx = c.x + dx / d * mv, ny = c.y + dy / d * mv;
  const gz = ground(nx, ny, c.z + 2);
  const nz = (gz === null ? c.z : gz + 1.0);
  T(en.setEntityCoordsNoOffset, z.h, nx, ny, nz, false, false, false);
  T(en.setEntityCoords, z.h, nx, ny, nz, false, false, false, false);
  return d;
}

function loop(dt) {
  const me = mp.players.local.position;
  if (isSafe(me.x, me.y, 0)) { if (zs.length) nuke(); return; }
  const cap = ob ? Math.min(18, 8 + wv * 2) : 4;
  const every = ob ? 25 : 240;
  const now = Date.now(), en = mp.game.entity, keep = [];

  zs.forEach(function (z) {
    if (!T(en.doesEntityExist, z.h)) return;
    if (T(en.isEntityDead, z.h)) {
      if (!z.gone) {
        z.gone = true;
        mp.events.callRemote('srv:zombieKill');
        setTimeout(function () { T(mp.game.ped.deletePed, z.h); }, 6000);
      }
      keep.push(z);
      return;
    }
    const d = move(z, me, dt);
    if (d < 0) return;
    if (d > 300) { T(mp.game.ped.deletePed, z.h); T(en.deleteEntity, z.h); return; }
    if (d < 2.3 && now - z.hit > 1200) {
      z.hit = now;
      mp.events.callRemote('srv:zombieHit', ob ? 6 + Math.floor(wv / 2) : 4);
      T(mp.game.cam.shakeGameplayCam, 'SMALL_EXPLOSION_SHAKE', 0.3);
    }
    keep.push(z);
  });

  zs = keep;
  if (zs.length < cap && tk % every === 0) born();
}

function hud(t, y, sc, al) {
  mp.game.graphics.drawText(t, [0.5, y], { font: 4, color: [255, 255, 255, al], scale: [sc, sc], outline: true, centre: true });
}

mp.events.add('render', function () {
  if (!on) return;
  tk++;
  const now = Date.now();
  const dt = Math.min(0.1, (now - last) / 1000) || 0.016;
  last = now;
  T(loop, dt);

  const me = mp.players.local.position;
  const ms = Math.max(0, pLeft - (now - pAt));
  const sec = Math.floor(ms % 60000 / 1000);
  const clock = Math.floor(ms / 60000) + ':' + (sec < 10 ? '0' + sec : sec);

  if (isSafe(me.x, me.y, 0)) hud('~g~БЕЗОПАСНАЯ ЗОНА~w~   ' + (ob ? 'прорыв' : 'затишье') + ' ' + clock, 0.035, 0.42, 215);
  else if (ob) hud('~r~ПРОРЫВ~w~   волна ' + wv + '   рядом: ' + zs.length + '   до конца ' + clock, 0.035, 0.44, 220);
  else hud('~y~затишье~w~   до прорыва ' + clock + '   убито: ' + kills, 0.035, 0.4, 180);

  zones.forEach(function (s) {
    if (len(s.x, s.y, me.x, me.y) > s.r + 60) return;
    const w = s.r * 2;
    try { mp.game.graphics.drawMarker(1, s.x, s.y, s.z - 1, 0, 0, 0, 0, 0, 0, w, w, 2.0, 80, 220, 90, 40, false, false, 2, false, null, null, false); } catch (e) {}
  });

  if (fx && now - fxAt < 2200) hud(fx, 0.78, 0.52, 230);
});

mp.events.add('srv:zombieState', function (st, out, w, json, left) {
  const was = ob;
  on = !!st; ob = !!out; wv = Number(w) || 1;
  pLeft = Number(left) || 0; pAt = Date.now();
  let arr = [];
  try { arr = JSON.parse(json); } catch (e) { arr = []; }
  zones = arr.map(function (s) { return { x: s.x, y: s.y, z: s.z || 30, r: s.r || 120 }; });
  mapZones();
  if (!on) { nuke(); return; }
  boot();
  if (was !== ob) nuke();
});

mp.events.add('srv:zombieKillFx', function (cash, total) {
  kills = Number(total) || kills + 1;
  fx = '+' + cash + '$';
  fxAt = Date.now();
});

mp.events.add('srv:zombieDebug', function () {
  dbg = !dbg;
  mp.gui.chat.push('!{#8fd14f}Отладка ' + (dbg ? 'вкл' : 'выкл') + ' | ' + (ob ? 'прорыв' : 'затишье') + ' | всего ' + zs.length);
});

mp.keys.bind(0x76, true, function () {
  on = true;
  born();
  mp.gui.chat.push('!{#8fd14f}Зомби на карте: ' + zs.length);
});

mp.keys.bind(0x75, true, function () {
  boot();
  nuke();
  mp.gui.chat.push('!{#8fd14f}Карта очищена');
});
