<?php
require __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');
$key = $_SERVER['HTTP_X_AMRP_KEY'] ?? '';
if (!AMRP_KEY || !hash_equals(AMRP_KEY, $key)) { http_response_code(403); echo '{"ok":false,"err":"bad key"}'; exit; }
$raw = file_get_contents('php://input');
$d = json_decode($raw, true);
if (!is_array($d) || !isset($d['players'])) { http_response_code(400); echo '{"ok":false,"err":"bad json"}'; exit; }
$dir = __DIR__;
$tmp = $dir . '/players.tmp';
if (file_put_contents($tmp, $raw) === false || !rename($tmp, $dir . '/players.json')) { http_response_code(500); echo '{"ok":false,"err":"нет прав на запись в папку сайта"}'; exit; }
echo '{"ok":true}';
