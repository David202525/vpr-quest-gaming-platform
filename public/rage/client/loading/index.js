var loadBrowser = null, loadKill = null;
global.loadingOpen = true;
try {
    loadBrowser = mp.browsers.new('package://cef/loading/index.html');
    mp.gui.chat.show(false);
    mp.game.ui.displayRadar(false);
} catch (e) { loadBrowser = null; }
function loadingHide() {
    if (!loadBrowser || loadKill) return;
    try { loadBrowser.execute('window.loadingDone && window.loadingDone();'); } catch (e) {}
    loadKill = setTimeout(function () {
        try { loadBrowser.destroy(); } catch (e) {}
        loadBrowser = null;
        global.loadingOpen = false;
    }, 1400);
}
mp.events.add('auth:show', function () { setTimeout(loadingHide, 600); });
mp.events.add('playerSpawn', function () { setTimeout(loadingHide, 1500); });
setTimeout(loadingHide, 45000);
