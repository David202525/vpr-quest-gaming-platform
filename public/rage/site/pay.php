<?php
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) { http_response_code(404); exit; }
require_once __DIR__ . '/donate_config.php';
define('ORDERS_FILE', __DIR__ . '/data/orders.json');

function pay_api() { return ALFA_TEST ? 'https://alfa.rbsuat.com/payment/rest/' : 'https://payment.alfabank.ru/payment/rest/'; }
function pay_req($method, $params) {
    $params = array_merge(['userName' => ALFA_USER, 'password' => ALFA_PASS], $params);
    $body = http_build_query($params);
    if (function_exists('curl_init')) {
        $c = curl_init(pay_api() . $method);
        curl_setopt_array($c, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $body, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20, CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded']]);
        $r = curl_exec($c); curl_close($c);
    } else {
        $r = @file_get_contents(pay_api() . $method, false, stream_context_create(['http' => ['method' => 'POST', 'header' => "Content-Type: application/x-www-form-urlencoded\r\n", 'content' => $body, 'timeout' => 20]]));
    }
    $j = $r ? json_decode($r, true) : null;
    return is_array($j) ? $j : ['errorCode' => '-1', 'errorMessage' => 'банк не ответил'];
}
function pay_coins($rub) {
    $c = (int)floor($rub * DONATE_RATE);
    $b = 0; foreach (DONATE_BONUS as $from => $pct) if ($rub >= $from) $b = $pct;
    return $c + (int)floor($c * $b / 100);
}
function orders_tx($fn) {
    $dir = dirname(ORDERS_FILE); if (!is_dir($dir)) mkdir($dir, 0755, true);
    $f = fopen(ORDERS_FILE . '.lock', 'c'); flock($f, LOCK_EX);
    $o = is_file(ORDERS_FILE) ? json_decode(file_get_contents(ORDERS_FILE), true) : [];
    if (!is_array($o)) $o = [];
    $res = $fn($o);
    file_put_contents(ORDERS_FILE . '.tmp', json_encode($o, JSON_UNESCAPED_UNICODE)); rename(ORDERS_FILE . '.tmp', ORDERS_FILE);
    flock($f, LOCK_UN); fclose($f);
    return $res;
}
function orders_all() { $o = is_file(ORDERS_FILE) ? json_decode(file_get_contents(ORDERS_FILE), true) : []; return is_array($o) ? $o : []; }
function pay_base() {
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
    $dir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
    $dir = preg_replace('~/api$~', '', $dir);
    return ($https ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . $dir . '/';
}
function pay_create($player, $rub) {
    $num = 'AM' . date('ymdHis') . mt_rand(100, 999);
    $coins = pay_coins($rub);
    $base = pay_base();
    $r = pay_req('register.do', [
        'orderNumber' => $num, 'amount' => $rub * 100, 'currency' => 643, 'language' => 'ru',
        'returnUrl' => $base . 'donate.php?order=' . $num, 'failUrl' => $base . 'donate.php?order=' . $num,
        'dynamicCallbackUrl' => $base . 'api/alfa_callback.php',
        'description' => 'AMRP: ' . $coins . ' RC для ' . $player['login'],
    ]);
    if (empty($r['orderId']) || empty($r['formUrl'])) return ['err' => 'Банк отклонил создание платежа: ' . ($r['errorMessage'] ?? 'неизвестная ошибка')];
    orders_tx(function (&$o) use ($num, $r, $player, $rub, $coins) {
        $o[$num] = ['n' => $num, 'bank' => $r['orderId'], 'id' => (int)$player['id'], 'login' => $player['login'], 'nick' => $player['nick'], 'rub' => $rub, 'coins' => $coins, 'st' => 'new', 't' => time()];
    });
    return ['url' => $r['formUrl']];
}
function pay_check($num) {
    $all = orders_all();
    if (empty($all[$num])) return null;
    $ord = $all[$num];
    if ($ord['st'] !== 'new') return $ord;
    $r = pay_req('getOrderStatusExtended.do', ['orderId' => $ord['bank']]);
    if (!isset($r['orderStatus'])) return $ord;
    $s = (int)$r['orderStatus'];
    $amount = (int)($r['amount'] ?? 0);
    $st = $s === 2 && $amount === $ord['rub'] * 100 ? 'paid' : (in_array($s, [3, 4, 6], true) ? 'fail' : ($ord['t'] < time() - 86400 ? 'fail' : 'new'));
    if ($st === 'new') return $ord;
    return orders_tx(function (&$o) use ($num, $st) {
        if ($o[$num]['st'] === 'new') { $o[$num]['st'] = $st; $o[$num]['pt'] = time(); }
        return $o[$num];
    });
}
