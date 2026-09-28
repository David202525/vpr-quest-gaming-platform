let spots = [];
let near = null;
let invList = [];
let invW = 0;
let invOpen = false;
let sel = 0;
let props = {};

const PROP = 'prop_box_ammo04a';

function makeProp(s) {
  if (props[s.i]) return;
  try {
    const o = mp.objects.new(mp.game.joaat(PROP), new mp.Vector3(s.x, s.y, s.z - 0.9), { rotation: new mp.Vector3(0, 0, 0), dimension: 0 });
    props[s.i] = o;
  } catch (e) {}
}

function killProps() {
  for (const k in props) { try { props[k].destroy(); } catch (e) {} }
  props = {};
}

mp.events.add('srv:lootSpots', function (json) {
  let arr = [];
  try { arr = JSON.parse(json); } catch (e) { arr = []; }
  spots = arr;
  killProps();
});

mp.events.add('srv:invData', function (json, w) {
  try { invList = JSON.parse(json); } catch (e) { invList = []; }
  invW = Number(w) || 0;
  if (sel >= invList.length) sel = Math.max(0, invList.length - 1);
});

mp.events.add('render', function () {
  const me = mp.players.local.position;
  near = null;
  let bd = 999;

  for (let i = 0; i < spots.length; i++) {
    const s = spots[i];
    const dx = me.x - s.x;
    const dy = me.y - s.y;
    const dz = me.z - s.z;
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d > 80) continue;

    makeProp(s);

    if (d < 40) {
      mp.game.graphics.drawText('~y~' + s.n, [s.x, s.y, s.z + 0.8], { font: 4, color: [255, 220, 120, 220], scale: [0.32, 0.32], outline: true });
    }
    if (d < 2.5 && d < bd) { bd = d; near = s; }
  }

  if (near && !invOpen) {
    mp.game.graphics.drawText('~w~[ ~y~E~w~ ]  ' + near.n, [0.5, 0.78], { font: 4, color: [255, 255, 255, 230], scale: [0.45, 0.45], outline: true, centre: true });
  }

  if (invOpen) {
    mp.game.graphics.drawRect(0.5, 0.5, 0.34, 0.58, 10, 10, 14, 205);
    mp.game.graphics.drawText('~y~INVENTORY~w~   ' + invW + ' / 40 kg', [0.5, 0.235], { font: 4, color: [255, 255, 255, 240], scale: [0.5, 0.5], outline: true, centre: true });

    if (!invList.length) {
      mp.game.graphics.drawText('~c~empty', [0.5, 0.47], { font: 4, color: [180, 180, 180, 200], scale: [0.42, 0.42], centre: true });
    }

    for (let i = 0; i < invList.length; i++) {
      const it = invList[i];
      const y = 0.285 + i * 0.026;
      if (y > 0.755) break;
      const mark = i === sel ? '~y~> ' : '~w~  ';
      mp.game.graphics.drawText(mark + it.n + ' ~c~x' + it.c, [0.37, y], { font: 4, color: [255, 255, 255, 235], scale: [0.4, 0.4], outline: true });
    }

    mp.game.graphics.drawText('~c~W / S ~w~- ~c~select    ~w~ENTER ~c~- use    ~w~I ~c~- close', [0.5, 0.765], { font: 4, color: [190, 190, 190, 210], scale: [0.33, 0.33], centre: true });
    mp.game.controls.disableControlAction(0, 1, true);
    mp.game.controls.disableControlAction(0, 2, true);
    mp.game.controls.disableControlAction(0, 24, true);
    mp.game.controls.disableControlAction(0, 25, true);
  }
});

mp.keys.bind(0x45, false, function () {
  if (invOpen) return;
  if (!near) return;
  const id = near.i;
  mp.events.callRemote('srv:lootTake', id);
  spots = spots.filter(function (s) { return s.i !== id; });
  if (props[id]) {
    try { props[id].destroy(); } catch (e) {}
    delete props[id];
  }
  near = null;
});

mp.keys.bind(0x49, false, function () {
  invOpen = !invOpen;
  if (invOpen) mp.events.callRemote('srv:invOpen');
});

mp.keys.bind(0x57, false, function () {
  if (invOpen && sel > 0) sel = sel - 1;
});

mp.keys.bind(0x53, false, function () {
  if (invOpen && sel < invList.length - 1) sel = sel + 1;
});

mp.keys.bind(0x0D, false, function () {
  if (!invOpen) return;
  if (!invList[sel]) return;
  mp.events.callRemote('srv:invUse', invList[sel].k);
});
