const WRECK_MS = 60000;

setInterval(function () {
    const now = Date.now();
    mp.vehicles.forEach(function (v) {
        if (!mp.vehicles.exists(v) || v.dbId || v.getVariable('ownerId')) return;
        if (!v.dead) { v.wreckAt = 0; return; }
        if (!v.wreckAt) { v.wreckAt = now; return; }
        if (now - v.wreckAt > WRECK_MS) v.destroy();
    });
}, 15000);

mp.events.add('playerEnterVehicle', function (p, v, seat) {
    if (seat === 0 || seat === -1) v.lastDriver = p.name;
});
