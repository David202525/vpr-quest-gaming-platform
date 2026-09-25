const M = ['a_m_m_hillbilly_01', 'a_m_m_tramp_01', 'a_m_y_methhead_01', 'a_m_m_farmer_01'];
const ADICT = 'melee@unarmed@streamed_core';
const ANIM = 'ground_attack_on_spot';
let on = false, ob = false, wv = 1, zones = [], blips = [], pLeft = 0, pAt = 0;
let zs = [], kills = 0, fx = '', fxAt = 0, grp = 0, tk = 0, dbg = false;

function T(f, a, b, c, d, e, g, h, i, j, k, l) {
  try { return f(a, b, c, d, e, g, h, i, j, k, l); } catch (x) { if (dbg) mp.gui.chat.push('!{#e05555}' + x); return null; }
}
function dist2(ax, ay, bx, by) { return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by)); }
function isSafe(x, y, pad) { return zones.some(function (s) { return dist2(x, y, s.x, s.y) < s.r + pad; }); }
function spd() { return ob ? (wv > 5 ? 1.45 : 1.25) : 1.0; }

function mapZones() {
  const u = mp.game.ui;
  blips.forEach(function (b) { T(u.removeBlip, b); });
  blips = zones.map(function (s) {
    const b = T(u.addBlipForRadius, s.x, s.y, s.z, s.r);
    if (b) { T(u.setBlipColour, b, 2); T(u.setBlipAlpha, b, 90); }
    return b;
  }).filter(Boolean);
}

function prep(h, hp) {
  const p = mp.game.ped, en = mp.game.entity;
  T(en.setEntityAsMissionEntity, h, true, true);
  T(en.setEntityHealth, h, hp);
  T(en.freezeEntityPosition, h, false);
  T(p.setPedMaxHealth, h, hp);
  T(p.setPedRelationshipGroupHash, h, grp);
  T(p.setPedAsEnemy, h, true);
  T(p.setBlockingOfNonTemporaryEvents, h, true);
  T(p.setPedFleeAttributes, h, 0, false);
  T(p.setPedCombatAttributes, h, 46, true);
  T(p.setPedCombatAttributes, h, 5, true);
  T(p.setPedSeeingRange, h, 400.0);
  T(p.setPedHearingRange, h, 400.0);
  T(p.setPedAlertness, h, 3);
  T(p.setPedCanRagdoll, h, false);
  T(p.setPedCanEvasiveDive, h, false);
  T(p.setPedPathCanUseClimbovers, h, true);
  T(p.setPedPathCanDropFromHeight, h, true);
  T(p.setPedMoveRateOverride, h, spd());
  T(p.setPedStealthMovement, h, false, '');
}

function runTo(z, force) {
  if (z.mode === 'run' && !force) return;
  z.mode = 'run';
  T(mp.game.task.goToEntity, z.h, mp.players.local.handle, -1, 0.8, 3.0, 1073741824.0, 0);
}

function swing(z) {
  z.mode = 'hit';
  const me = mp.players.local.position;
  T(mp.game.task.clearPedTasks, z.h);
  T(mp.game.task.turnPedToFaceCoord, z.h, me.x, me.y, me.z, 600);
  T(mp.game.task.playAnim, z.h, ADICT, ANIM, 8.0, -8.0, 900, 0, 0.0, false, false, false);
  mp.events.callRemote('srv:zombieHit', ob ? 6 + Math.floor(wv / 2) : 4);
  T(mp.game.cam.shakeGameplayCam, 'SMALL_EXPLOSION_SHAKE', 0.25);
}

function kill(h) { T(mp.game.ped.deletePed, h); T(mp.game.entity.deleteEntity, h); }
function wipe() { zs.forEach(function (z) { kill(z.h); }); zs = []; }

function born() {
  const hash = mp.game.joaat(M[Math.floor(Math.random() * M.length)]);
  if (!T(mp.game.streaming.hasModelLoaded, hash)) { T(mp.game.streaming.requestModel, hash); return; }
  const me = mp.players.local.position, a = Math.random() * 6.283;
  const r = ob ? 40 + Math.random() * 80 : 70 + Math.random() * 90;
  const x = me.x + Math.cos(a) * r, y = me.y + Math.sin(a) * r;
  if (isSafe(x, y, 25)) return;
  const raw = T(mp.game.gameplay.getGroundZFor3dCoord, x, y, me.z + 80, 0.0, false, false);
  const gz = raw && typeof raw === 'object' ? raw.groundZ : raw;
  const z = (typeof gz === 'number' && gz > 1 ? gz : me.z) + 1;
  const h = T(mp.game.ped.createPed, 26, hash, x, y, z, Math.random() * 360, false, true);
  if (!h) return;
  prep(h, ob ? 120 + wv * 25 : 90);
  const item = { h: h, hit: 0, gone: false, at: 0, px: x, py: y, mode: '', bad: 0, re: 0 };
  zs.push(item);
  runTo(item, true);
}

function loop() {
  const me = mp.players.local.position;
  if (isSafe(me.x, me.y, 0)) { if (zs.length) wipe(); return; }
  const cap = ob ? Math.min(28, 10 + wv * 2) : 4, every = ob ? 25 : 300, pack = ob ? 3 : 1;
  const now = Date.now(), en = mp.game.entity, keep = [];

  zs.forEach(function (z) {
    if (!T(en.doesEntityExist, z.h)) return;
    const c = T(en.getEntityCoords, z.h, true);
    if (!c) return;

    if (T(en.isEntityDead, z.h)) {
      if (!z.gone) {
        z.gone = true;
        mp.events.callRemote('srv:zombieKill');
        setTimeout(function () { kill(z.h); }, 8000);
      }
      keep.push(z);
      return;
    }

    const d = dist2(c.x, c.y, me.x, me.y);
    if (d > 400 || isSafe(c.x, c.y, 0)) { kill(z.h); return; }

    if (d < 3.4) {
      if (now - z.hit > 1300) { z.hit = now; swing(z); }
      else if (z.mode === 'hit' && now - z.hit > 950) runTo(z, true);
    } else if (z.mode !== 'run' || now - z.re > 4000) {
      z.re = now;
      runTo(z, true);
    }

    if (now - z.at > 2500) {
      const moved = dist2(c.x, c.y, z.px, z.py);
      z.px = c.x; z.py = c.y; z.at = now;
      if (moved < 0.8 && d > 3.4) {
        z.bad++;
        T(mp.game.task.clearPedTasksImmediately, z.h);
        runTo(z, true);
        if (z.bad > 3) { kill(z.h); return; }
      } else z.bad = 0;
    }
    keep.push(z);
  });

  zs = keep;
  if (zs.length < cap && tk % every === 0) for (let i = 0; i < pack && zs.length < cap; i++) born();
}

function hud(txt, y, sc, al) {
  mp.game.graphics.drawText(txt, [0.5, y], { font: 4, color: [255, 255, 255, al], scale: [sc, sc], outline: true, centre: true });
}

mp.events.add('render', function () {
  if (!on) return;
  tk++;
  T(loop);
  const me = mp.players.local.position;
  const ms = Math.max(0, pLeft - (Date.now() - pAt));
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

  if (fx && Date.now() - fxAt < 2200) hud(fx, 0.78, 0.52, 230);
});

mp.events.add('srv:zombieState', function (st, out, w, json, left) {
  const was = ob;
  on = !!st; ob = !!out; wv = Number(w) || 1;
  pLeft = Number(left) || 0; pAt = Date.now();
  let arr = [];
  try { arr = JSON.parse(json); } catch (e) { arr = []; }
  zones = arr.map(function (s) { return { x: s.x, y: s.y, z: s.z || 30, r: s.r || 120 }; });
  mapZones();
  if (!on) { wipe(); return; }
  if (!grp) {
    grp = mp.game.joaat('ZOMBIES');
    const pl = mp.game.joaat('PLAYER');
    T(mp.game.ped.addRelationshipGroup, 'ZOMBIES', grp);
    T(mp.game.ped.setRelationshipBetweenGroups, 5, grp, pl);
    T(mp.game.ped.setRelationshipBetweenGroups, 5, pl, grp);
    T(mp.game.ped.setRelationshipBetweenGroups, 0, grp, grp);
  }
  T(mp.game.streaming.requestAnimDict, ADICT);
  M.forEach(function (n) { T(mp.game.streaming.requestModel, mp.game.joaat(n)); });
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
  const run = zs.filter(function (z) { return z.mode === 'run'; }).length;
  const hit = zs.filter(function (z) { return z.mode === 'hit'; }).length;
  mp.gui.chat.push('!{#8fd14f}Отладка ' + (dbg ? 'вкл' : 'выкл') + ' | ' + (ob ? 'прорыв' : 'затишье') + ' | всего ' + zs.length + ' | бегут ' + run + ' | бьют ' + hit);
  mp.gui.chat.push('!{#8fd14f}Тут: ' + p.x.toFixed(0) + ' ' + p.y.toFixed(0) + ' ' + p.z.toFixed(0));
});
