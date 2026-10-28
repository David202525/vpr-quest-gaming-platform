var PLATE_STYLE = 0;

function plFix(v) {
    if (!v || !v.handle) return;
    try {
        if (v.getNumberPlateTextIndex() !== PLATE_STYLE) v.setNumberPlateTextIndex(PLATE_STYLE);
    } catch (e) {}
}

mp.events.add('entityStreamIn', function (e) {
    if (e && e.type === 'vehicle') { plFix(e); setTimeout(function () { plFix(e); }, 500); }
});

setInterval(function () { mp.vehicles.forEachInStreamRange(plFix); }, 2000);
