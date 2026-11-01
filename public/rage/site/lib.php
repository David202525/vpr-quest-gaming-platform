<?php
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) { http_response_code(404); exit; }
require __DIR__ . '/config.php';
date_default_timezone_set('Europe/Moscow');
define('DATA_FILE', __DIR__ . '/data/players.json');

function amrp_data() {
    static $d = null;
    if ($d !== null) return $d;
    $d = is_file(DATA_FILE) ? json_decode(file_get_contents(DATA_FILE), true) : null;
    if (!is_array($d)) $d = ['t' => 0, 'online' => 0, 'total' => 0, 'players' => []];
    return $d;
}
function amrp_find($login) {
    $login = mb_strtolower(trim($login));
    foreach (amrp_data()['players'] as $p) if ($p['login'] === $login) return $p;
    return null;
}
function amrp_byId($id) {
    foreach (amrp_data()['players'] as $p) if ((int)$p['id'] === (int)$id) return $p;
    return null;
}
function amrp_check($pass, $stored) {
    $s = explode('$', (string)$stored);
    if (count($s) !== 3 || $s[0] !== 'pbkdf2') return false;
    return hash_equals($s[2], hash_pbkdf2('sha256', (string)$pass, $s[1], 20000, 64));
}
function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
function money($n) { return '$' . number_format((float)$n, 0, '', '.'); }
function ago($iso) {
    if (!$iso) return '—';
    $t = strtotime($iso); if (!$t) return '—';
    return date('d.m.Y H:i', $t);
}
function hours($m) { $m = (int)$m; return $m < 60 ? $m . ' мин' : floor($m / 60) . ' ч ' . ($m % 60) . ' мин'; }
function amrp_head($title) {
    $d = amrp_data();
    $fresh = $d['t'] && (time() - $d['t'] / 1000) < 600;
    ?><!DOCTYPE html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= h($title) ?></title>
<meta name="description" content="AMRP — ролевой GTA 5 сервер на RAGE MP. Работы, фракции, семьи, дома и машины.">
<link rel="icon" href="assets/logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700;800;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/style.css?v=1">
</head><body>
<header class="nav"><div class="wrap nav-in">
  <a href="index.php" class="brand"><img src="assets/logo.png" alt="AMRP"><span>AMRP</span></a>
  <nav>
    <a href="index.php#about">О сервере</a><a href="index.php#start">Как начать</a><a href="index.php#top">Топ</a>
    <a class="btn btn-sm" href="cabinet.php">Личный кабинет</a>
  </nav>
  <div class="online"><i class="<?= $fresh ? 'on' : '' ?>"></i><?= $fresh ? (int)$d['online'] . ' онлайн' : 'сервер офлайн' ?></div>
</div></header>
<?php }
function amrp_foot() { ?>
<footer class="foot"><div class="wrap foot-in">
  <div class="brand"><img src="assets/logo.png" alt=""><span>AMRP</span></div>
  <div class="links">
    <?php if (AMRP_DISCORD) { ?><a href="<?= h(AMRP_DISCORD) ?>" target="_blank">Discord</a><?php } ?>
    <?php if (AMRP_VK) { ?><a href="<?= h(AMRP_VK) ?>" target="_blank">ВКонтакте</a><?php } ?>
    <?php if (AMRP_TG) { ?><a href="<?= h(AMRP_TG) ?>" target="_blank">Telegram</a><?php } ?>
  </div>
  <div class="copy">© <?= date('Y') ?> AMRP. Проект не связан с Rockstar Games.</div>
</div></footer>
</body></html>
<?php }
