<?php
require_once __DIR__ . '/config.php';
require __DIR__ . '/pay.php';
header('Content-Type: application/json; charset=utf-8');
$key = $_SERVER['HTTP_X_AMRP_KEY'] ?? '';
if (!AMRP_KEY || !hash_equals(AMRP_KEY, $key)) { http_response_code(403); echo '{"ok":false,"err":"bad key"}'; exit; }
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $ids = json_decode(file_get_contents('php://input'), true)['done'] ?? [];
    orders_tx(function (&$o) use ($ids) { foreach ((array)$ids as $n) if (isset($o[$n]) && $o[$n]['st'] === 'paid') { $o[$n]['st'] = 'done'; $o[$n]['dt'] = time(); } });
    echo '{"ok":true}'; exit;
}
$checked = 0;
foreach (orders_all() as $n => $x) if ($x['st'] === 'new' && $x['t'] < time() - 60 && $checked < 5) { pay_check($n); $checked++; }
$out = [];
foreach (orders_all() as $x) if ($x['st'] === 'paid') $out[] = ['n' => $x['n'], 'id' => $x['id'], 'coins' => $x['coins'], 'rub' => $x['rub']];
$packs = []; foreach (DONATE_PACKS as $r) { $c = pay_coins($r); $base = (int)floor($r * DONATE_RATE); $packs[] = ['c' => $base, 'bonus' => $c - $base, 'rub' => $r]; }
echo json_encode(['ok' => true, 'orders' => $out, 'packs' => $packs, 'enabled' => ALFA_USER && ALFA_PASS]);
