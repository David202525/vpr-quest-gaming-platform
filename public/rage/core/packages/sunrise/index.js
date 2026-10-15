['./help.js', './medic.js', './apoc.js', './bases.js'].forEach(function (f) {
    try { require(f); } catch (e) { console.log('[sunrise] ' + f + ': ' + e.message); }
});
