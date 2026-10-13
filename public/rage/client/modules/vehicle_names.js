const NAMES = {
    rhino: 'Танк Rhino',
    barracks: 'Армейский грузовик',
    barracks3: 'Армейский тягач',
    crusader: 'Армейский джип',
    insurgent2: 'Бронемашина',
    apc: 'БТР'
};

function setLabel(key, text) {
    try {
        if (mp.game.gxt && typeof mp.game.gxt.set === 'function') {
            mp.game.gxt.set(key, text);
            return;
        }
    } catch (e) {}
    try {
        if (mp.game.ui && typeof mp.game.ui.addTextEntry === 'function') {
            mp.game.ui.addTextEntry(key, text);
        }
    } catch (e) {}
}

Object.keys(NAMES).forEach(function (model) {
    setLabel(model, NAMES[model]);
    setLabel(model.toUpperCase(), NAMES[model]);
});

exports.setLabel = setLabel;
