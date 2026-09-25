const M = ['a_m_m_hillbilly_01', 'a_m_m_tramp_01', 'a_m_y_methhead_01', 'a_m_m_farmer_01'];
const WDICT = 'move_m@generic';
const WANIM = 'walk';
const ADICT = 'melee@unarmed@streamed_core';
const AANIM = 'ground_attack_on_spot';
let on = false, ob = false, wv = 1, zones = [], blips = [], pLeft = 0, pAt = 0;
let zs = [], kills = 0, fx = '', fxAt = 0, grp = 0, tk = 0, dbg = false, last = 0;

function T(f, a, b, c, d, e, g, h, i, j, k, l) {
  try { return f(a, b, c, d, e, g, h, i, j, k, l); } catch (x) { if (dbg) mp.gui.chat.push('!{#e05555}' + x); return null; }
}
function dist2(ax, ay, bx, by) { return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by)); }
function isSafe(x, y, pad) { return zones.some(function (s) { return dist2(x, y, s.x, s.y) < s.r + pad; }); }
function spd() { return ob ? (wv > 5 ? 3.2 : 2.7) : 1.7; }

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

function ground(x, y, z) {
  const raw = T(mp.game.gameplay.getGroundZFor3dCoord, x, y, z, 0.0, false, false);
  const g = raw && typeof raw === 'object' ? raw.groundZ : raw;
  return typeof g === 'number' && g > 1 ? g : null;
}

function prep(h, hp) {
  const p = mp.game.ped, en = mp.game.entity;
  T(en.setEntityHealth, h, hp);
  T(en.setEntityInvincible, h, false);
  T(p.setPedMaxHealth, h, hp);
  T(p.setPedRelationshipGroupHash, h, grp);
  T(p.setPedAsEnemy, h, true);
  T(p.setBlockingOfNonTemporaryEvents, h, true);
  T(p.setPedFleeAttributes, h, 0, false);
  T(p.setPedCanRagdoll, h, false);
  T(p.setPedCanEvasiveDive, h, false);
  T(p.setPedSuffersCriticalHits, h, true);
  T(p.setPedDiesWhenInjured, h, false);
  T(mp.game.task.clearPedTasksImmediately, h);
}

function anim(z, dict, name) {
  if (z.anim === name) return;
  z.anim = name;
  T(mp.game.task.playAnim, z.ped.handle, dict, name, 8.0, -8.0, -1, 1, 0.0, false, false, false);
}

function drop(z) {
  try { if (z.ped && z.ped.destroy) z.ped.destroy(); } catch (e) {}
}

function wipe() { zs.forEach(drop); zs = []; }

function born() {
  const hash = mp.game.joaat(M[Math.floor(Math.random() * M.length)]);
  if (!T(mp.game.streaming.hasModelLoaded, hash)) { T(mp.game.streaming.requestModel, hash); return; }
  const me = mp.players.local.position, a = Math.random() * 6.283;
  const r = ob ? 35 + Math.random() * 55 : 50 + Math.random() * 55;
  const x = me.x + Math.cos(a) * r, y = me.y + Math.sin(a) * r;
  if (isSafe(x, y, 25)) return;
  const gz = ground(x, y, me.z + 80);
  const z = (gz === null ? me.z : gz) + 1;
  let ped = null;
  try { ped = mp.peds.new(hash, new mp.Vector3(x, y, z), Math.random() * 360, 0); } catch (e) { return; }
  if (!ped) return;
  const item = { ped: ped, hp: ob ? 120 + wv * 25 : 90, hit: 0, gone: false, anim: '', set: false };
  zs.push(item);
}

function loop(dt) {
  const me = mp.players.local.position;
  if (isSafe(me.x, me.y, 0)) { if (zs.length) wipe(); return; }
  const cap = ob ? Math.min(20, 8 + wv * 2) : 4;
  const every = ob ? 20 : 240;
  const now = Date.now(), keep = [];

  zs.forEach(function (z) {
    const h = z.ped ? z.ped.handle : 0;
    if (!h) { keep.push(z); return; }

    if (!z.set) { z.set = true; prep(h, z.hp); }

    const hp = T(mp.game.entity.getEntityHealth, h);
    if (hp !== null && hp <= 0) {
      if (!z.gone) {
        z.gone = true;
        mp.events.callRemote('srv:zombieKill');
        setTimeout(function () { drop(z); }, 6000);
      }
      keep.push(z);
      return;
    }

    const c = z.ped.position;
    const dx = me.x - c.x, dy = me.y - c.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d > 300 || isSafe(c.x, c.y, 0)) { drop(z); return; }

    const hd = Math.atan2(dy, dx) * 180 / Math.PI - 90;
    try { z.ped.heading = hd < 0 ? hd + 360 : hd; } catch (e) {}

    if (d < 1.9) {
      anim(z, ADICT, AANIM);
      if (now - z.hit > 1200) {
        z.hit = now;
        mp.events.callRemote('srv:zombieHit', ob ? 6 + Math.floor(wv / 2) : 4);
        T(mp.game.cam.shakeGameplayCam, 'SMALL_EXPLOSION_SHAKE', 0.3);
      }
    } else {
      anim(z, WDICT, WANIM);
      const mv = Math.min(spd() * dt, d - 1.5);
      const nx = c.x + dx / d * mv, ny = c.y + dy / d * mv;
      const gz = ground(nx, ny, c.z + 2);
      try { z.ped.position = new mp.Vector3(nx, ny, gz === null ? c.z : gz + 1.0); } catch (e) {}
    }
    keep.push(z);
  });

  zs = keep;
  if (zs.length < cap && tk % every === 0) born();
}

function hud(txt, y, sc, al) {
  mp.game.graphics.drawText(txt, [0.5, y], { font: 4, color: [255, 255, 255, al], scale: [sc, sc], outline: true, centre: true });
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
    if (dist2(s.x, s.y, me.x, me.y) > s.r + 60) return;
    const w = s.r * 2;
    try { mp.game.graphics.drawMarker(1, s.x, s.y, s.z - 1, 0, 0, 0, 0, 0, 0, w, w, 2.0, 80, 220, 90, 40, false, false, 2, false, null, null, false); } catch (e) {}
  });

  if (fx && now - fxAt < 2200) hud(fx, 0.78, 0.52, 230);
});

function ensure() {
  if (!grp) {
    grp = mp.game.joaat('ZOMBIES');
    const pl = mp.game.joaat('PLAYER');
    T(mp.game.ped.addRelationshipGroup, 'ZOMBIES', grp);
    T(mp.game.ped.setRelationshipBetweenGroups, 5, grp, pl);
    T(mp.game.ped.setRelationshipBetweenGroups, 5, pl, grp);
    T(mp.game.ped.setRelationshipBetweenGroups, 0, grp, grp);
  }
  T(mp.game.streaming.requestAnimDict, WDICT);
  T(mp.game.streaming.requestAnimDict, ADICT);
  M.forEach(function (n) { T(mp.game.streaming.requestModel, mp.game.joaat(n)); });
}

mp.events.add('srv:zombieState', function (st, out, w, json, left) {
  const was = ob;
  on = !!st; ob = !!out; wv = Number(w) || 1;
  pLeft = Number(left) || 0; pAt = Date.now();
  let arr = [];
  try { arr = JSON.parse(json); } catch (e) { arr = []; }
  zones = arr.map(function (s) { return { x: s.x, y: s.y, z: s.z || 30, r: s.r || 120 }; });
  mapZones();
  if (!on) { wipe(); return; }
  ensure();
  if (was !== ob) wipe();
});

mp.events.add('srv:zombieKillFx', function (cash, total) {
  kills = Number(total) || kills + 1;
  fx = '+' + cash + '$';
  fxAt = Date.now();
});

mp.events.add('srv:zombieDebug', function () {
  dbg = !dbg;
  const p = mp.players.local.position;
  mp.gui.chat.push('!{#8fd14f}Отладка ' + (dbg ? 'вкл' : 'выкл') + ' | ' + (ob ? 'прорыв' : 'затишье') + ' | всего ' + zs.length);
  mp.gui.chat.push('!{#8fd14f}Тут: ' + p.x.toFixed(0) + ' ' + p.y.toFixed(0) + ' ' + p.z.toFixed(0));
});

mp.keys.bind(0x76, true, function () {
  ensure();
  on = true;
  born();
  mp.gui.chat.push('!{#8fd14f}Тест: зомби на карте ' + zs.length);
});

mp.keys.bind(0x75, true, function () {
  const n = zs.length;
  wipe();
  mp.peds.forEach(function (p) { try { p.destroy(); } catch (e) {} });
  mp.gui.chat.push('!{#8fd14f}Карта очищена, убрано ' + n);
});
