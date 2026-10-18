mp.events.add('srv:siren:set', function (p, m) {
    const v = p.vehicle;
    m = Number(m);
    if (!v || !mp.vehicles.exists(v) || p.seat !== 0 && p.seat !== -1 || [0, 1, 2].indexOf(m) < 0) return;
    v.setVariable('siren', m);
});
mp.events.add('srv:siren:horn', function (p, on) {
    const v = p.vehicle;
    if (!v || !mp.vehicles.exists(v) || p.seat !== 0 && p.seat !== -1) return;
    v.setVariable('horn', !!on && on !== 'false' && on !== '0');
});
mp.events.add('playerExitVehicle', function (p, v) { if (v && mp.vehicles.exists(v) && v.getVariable('horn')) v.setVariable('horn', false); });
console.log('[siren] режимы мигалок загружены');
