const O = { x: -2900.0, y: -3900.0 };
const FZ = 150.0;
function w(lx, ly, h, dz) { return { x: O.x + lx, y: O.y + ly, z: FZ + (dz === undefined ? 1.0 : dz), h: h || 0 }; }

const BEDS_L = [[14.0, 1.6, 180], [17.0, 1.6, 180], [20.0, 1.6, 180], [23.0, 1.6, 180], [14.0, 16.4, 0], [17.0, 16.4, 0], [20.0, 16.4, 0], [23.0, 16.4, 0]];

module.exports = {
    O: O,
    FZ: FZ,
    BEDS: BEDS_L.map(function (b) { return w(b[0], b[1], b[2], 1.45); }),
    LOCKER: w(9.6, 16.4, 0),
    IN: w(5.5, 1.6, 0),
    ER_IN: w(5.5, 7.6, 0)
};
