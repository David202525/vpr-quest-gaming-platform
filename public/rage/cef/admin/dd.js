(function () {
    var pop = null, cur = null;
    function close() { if (pop) { pop.remove(); pop = null; cur = null; } }
    function open(sel) {
        close();
        cur = sel;
        var r = sel.getBoundingClientRect();
        pop = document.createElement('div');
        pop.className = 'dd-pop';
        var below = window.innerHeight - r.bottom, h = Math.min(260, sel.options.length * 34 + 8);
        var up = below < h + 10 && r.top > below;
        pop.style.cssText = 'position:fixed;z-index:99999;left:' + r.left + 'px;width:' + r.width + 'px;' + (up ? 'bottom:' + (window.innerHeight - r.top + 4) + 'px;' : 'top:' + (r.bottom + 4) + 'px;') +
            'max-height:260px;overflow-y:auto;background:#1b2130;border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:4px;box-shadow:0 12px 30px rgba(0,0,0,.5);font-size:13px;color:#fff';
        Array.prototype.forEach.call(sel.options, function (o, i) {
            var it = document.createElement('div');
            it.textContent = o.textContent;
            var on = i === sel.selectedIndex;
            it.style.cssText = 'padding:8px 10px;border-radius:7px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;' + (on ? 'background:rgba(47,111,255,.35);' : '') + (o.disabled ? 'opacity:.4;' : '');
            it.onmouseenter = function () { if (!on) it.style.background = 'rgba(255,255,255,.07)'; };
            it.onmouseleave = function () { if (!on) it.style.background = ''; };
            it.onmousedown = function (e) {
                e.preventDefault(); e.stopPropagation();
                if (o.disabled) return;
                close();
                if (sel.selectedIndex !== i) {
                    sel.selectedIndex = i;
                    sel.dispatchEvent(new Event('input', { bubbles: true }));
                    sel.dispatchEvent(new Event('change', { bubbles: true }));
                }
            };
            pop.appendChild(it);
        });
        document.body.appendChild(pop);
        var a = pop.children[sel.selectedIndex];
        if (a) pop.scrollTop = a.offsetTop - 60;
    }
    document.addEventListener('mousedown', function (e) {
        var s = e.target.closest ? e.target.closest('select') : null;
        if (s && !s.disabled && !s.multiple) { e.preventDefault(); if (cur === s) close(); else { s.focus(); open(s); } return; }
        if (pop && !pop.contains(e.target)) close();
    }, true);
    document.addEventListener('keydown', function (e) {
        if (e.target && e.target.tagName === 'SELECT' && (e.keyCode === 32 || e.keyCode === 13)) { e.preventDefault(); open(e.target); }
        if (pop && e.keyCode === 27) { e.stopPropagation(); close(); }
    }, true);
    window.addEventListener('wheel', function (e) { if (pop && !pop.contains(e.target)) close(); }, true);
    window.addEventListener('resize', close);
})();
