mp.gui.chat.show(false);
var chatBrowser = mp.browsers.new('package://cef/chat/index.html');
chatBrowser.markAsChat();
global.chatOpen = false;

mp.events.add('cef:chat:state', function (on) {
    global.chatOpen = !!on;
    if (global.chatOpen) mp.gui.cursor.show(true, true);
    else if (typeof cursorSync === 'function') cursorSync();
    else mp.gui.cursor.show(false, false);
});

global.chatForceClose = function () { global.chatOpen = false; try { chatBrowser.execute('window.chatAPI && window.chatAPI.close && window.chatAPI.close();'); } catch (e) {} };

global.chatReady = false;
var chatLockState = null;
mp.events.add('auth:hide', function () { setTimeout(function () { global.chatReady = true; }, 500); });
var chatSawAuth = false;
setTimeout(function () { if (!chatSawAuth && !global.authOpen) global.chatReady = true; }, 30000);
setInterval(function () {
    if (global.authOpen) chatSawAuth = true;
    var lock = !global.chatReady || !!global.authOpen || !!global.creatorOpen || !!global.introOpen;
    if (lock === chatLockState) return;
    chatLockState = lock;
    try { chatBrowser.execute('window.chatAPI && window.chatAPI.lock(' + lock + ');'); } catch (e) {}
    if (lock && global.chatOpen) { global.chatOpen = false; try { mp.gui.chat.activate(false); } catch (e) {} }
}, 150);
