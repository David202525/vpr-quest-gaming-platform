mp.events.add('srv:siren:set', function (p, m) {
    const v = p.vehicle;
    m = Number(m);
    if (!v || !mp.vehicles.exists(v) || p.seat !== 0 && p.seat !== -1 || [0, 1, 2].indexOf(m) < 0) return;
    v.setVariable('siren', m);
});
console.log('[siren] режимы мигалок загружены');
