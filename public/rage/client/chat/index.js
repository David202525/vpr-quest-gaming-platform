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
