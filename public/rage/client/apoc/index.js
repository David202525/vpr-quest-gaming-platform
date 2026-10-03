var APOC = { on: false, fx: [] };
var HANDLES = [];

function apocClear() {
    HANDLES.forEach(function (h) {
        try { mp.game.graphics.removeParticleFx(h, false); } catch (e) {}
    });
    HANDLES = [];
}

function apocAsset(cb) {
    mp.game.streaming.requestNamedPtfxAsset('core');
    var n = 0;
    var t = setInterval(function () {
        n++;
        if (mp.game.streaming.hasNamedPtfxAssetLoaded('core') || n > 50) {
            clearInterval(t);
            cb();
        }
    }, 100);
}

function apocBuild() {
    apocClear();
    apocAsset(function () {
        APOC.fx.forEach(function (f) {
            var name = 'ent_amb_smoke_foundry';
            var sc = 2.0;
            if (f.k === 'fire') {
                name = 'ent_ray_heli_aprtmnt_l_fire';
                sc = 0.5 * f.s;
            }
            try {
                mp.game.graphics.useParticleFxAssetNextCall('core');
                var h = mp.game.graphics.startParticleFxLoopedAtCoord(name, f.x, f.y, f.z, 0, 0, 0, sc, false, false, false, false);
                HANDLES.push(h);
            } catch (e) {}
        });
    });
}

function apocWorld() {
    try { mp.game.graphics.setBlackout(APOC.on); } catch (e) {}
    try {
        if (APOC.on) mp.game.graphics.setTimecycleModifier('NG_filmic02');
        else mp.game.graphics.clearTimecycleModifier();
    } catch (e) {}
}

mp.events.add('apoc:state', function (raw) {
    try { APOC = JSON.parse(raw); } catch (e) { return; }
    apocWorld();
    apocBuild();
});

mp.events.callRemote('apoc:sync');
