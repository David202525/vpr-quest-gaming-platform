let downed = false;
let endAt = 0;
let reason = '';

function safeCall(fn) {
    try {
        return fn();
    } catch (e) {
        return null;
    }
}

mp.events.add('srv:death', function (r, ms) {
    downed = true;
    reason = r || 'Ранение';
    endAt = Date.now() + (Number(ms) || 120000);

    const h = mp.players.local.handle;
    safeCall(function () {
        mp.game.ped.setPedToRagdoll(h, 60000, 60000, 0, true, true, false);
    });
    safeCall(function () {
        mp.game.graphics.setTimecycleModifier('REDMIST_blend');
    });
    mp.gui.chat.show(false);
});

mp.events.add('srv:deathEnd', function () {
    downed = false;
    safeCall(function () {
        mp.game.graphics.clearTimecycleModifier();
    });
    safeCall(function () {
        mp.game.ped.clearPedTasksImmediately(mp.players.local.handle);
    });
    mp.gui.chat.show(true);
});

const BLOCK = [1, 2, 21, 22, 23, 24, 25, 30, 31, 32, 33, 34, 35, 37, 44, 56, 140, 141, 142, 257, 263];

mp.events.add('render', function () {
    if (!downed) return;

    const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    const m = Math.floor(left / 60);
    const s = left % 60;

    mp.game.graphics.drawRect(0.5, 0.5, 1.0, 1.0, 20, 0, 0, 90);

    mp.game.graphics.drawText('~r~ВЫ ТЯЖЕЛО РАНЕНЫ', [0.5, 0.36], {
        font: 4,
        color: [255, 255, 255, 240],
        scale: [0.9, 0.9],
        outline: true,
        centre: true
    });

    mp.game.graphics.drawText(reason, [0.5, 0.45], {
        font: 4,
        color: [230, 200, 200, 210],
        scale: [0.5, 0.5],
        outline: true,
        centre: true
    });

    mp.game.graphics.drawText('Истечёте кровью через ' + m + ':' + (s < 10 ? '0' + s : s), [0.5, 0.52], {
        font: 4,
        color: [255, 120, 120, 230],
        scale: [0.6, 0.6],
        outline: true,
        centre: true
    });

    mp.game.graphics.drawText('Ждите медика или /respawn — в больницу за 500$', [0.5, 0.62], {
        font: 4,
        color: [255, 255, 255, 200],
        scale: [0.45, 0.45],
        outline: true,
        centre: true
    });

    BLOCK.forEach(function (c) {
        safeCall(function () {
            mp.game.controls.disableControlAction(0, c, true);
        });
    });
});
