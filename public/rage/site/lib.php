<?php
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) { http_response_code(404); exit; }
require __DIR__ . '/config.php';
date_default_timezone_set('Europe/Moscow');
define('DATA_FILE', __DIR__ . '/players.json');

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
define('NEWS_FILE', __DIR__ . '/news.json');
function news_all() { $n = is_file(NEWS_FILE) ? json_decode(file_get_contents(NEWS_FILE), true) : []; return is_array($n) ? $n : []; }
function news_save($n) { usort($n, function ($a, $b) { return $b['date'] <=> $a['date']; }); $t = NEWS_FILE . '.tmp'; return file_put_contents($t, json_encode(array_values($n), JSON_UNESCAPED_UNICODE)) !== false && rename($t, NEWS_FILE); }
function news_get($id) { foreach (news_all() as $x) if ($x['id'] === $id) return $x; return null; }
function vk_id($url) { return preg_match('~wall(-?\d+_\d+)~', (string)$url, $m) ? $m[1] : null; }
function http_get($url, $ua) {
    if (function_exists('curl_init')) {
        $c = curl_init($url);
        curl_setopt_array($c, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_TIMEOUT => 12, CURLOPT_USERAGENT => $ua, CURLOPT_HTTPHEADER => ['Accept-Language: ru-RU,ru;q=0.9']]);
        $r = curl_exec($c); curl_close($c); return $r === false ? '' : $r;
    }
    return (string)@file_get_contents($url, false, stream_context_create(['http' => ['timeout' => 12, 'header' => "User-Agent: $ua\r\nAccept-Language: ru-RU\r\n"]]));
}
function vk_title($text) {
    $line = trim(strtok(trim($text), "\n"));
    $line = preg_replace('~\[(?:id|club|public)\d+\|([^\]]+)\]~u', '$1', $line);
    return mb_strlen($line) > 90 ? mb_substr($line, 0, 87) . '…' : $line;
}
function vk_fetch($url) {
    $id = vk_id($url);
    if (!$id) return ['err' => 'Это не ссылка на пост ВК. Нужна ссылка вида vk.com/wall-123456_789'];
    $post = ['vk' => $id, 'url' => 'https://vk.com/wall' . $id, 'title' => '', 'text' => '', 'img' => '', 'date' => time(), 'likes' => 0, 'views' => 0];
    $vt = defined('VK_TOKEN') ? VK_TOKEN : '';
    if ($vt) {
        $j = json_decode(http_get('https://api.vk.com/method/wall.getById?posts=' . $id . '&v=5.131&access_token=' . urlencode($vt), 'AMRP'), true);
        $it = $j['response']['items'][0] ?? ($j['response'][0] ?? null);
        if (!$it) {
            list($own, $pid) = explode('_', $id);
            for ($off = 0; $off < 300 && !$it; $off += 100) {
                $w = json_decode(http_get('https://api.vk.com/method/wall.get?owner_id=' . $own . '&count=100&offset=' . $off . '&v=5.131&access_token=' . urlencode($vt), 'AMRP'), true);
                $items = $w['response']['items'] ?? [];
                foreach ($items as $x) if ((int)$x['id'] === (int)$pid) { $it = $x; break; }
                if (!$items) { if (!empty($w['error']['error_msg'])) $j = $w; break; }
            }
        }
        if ($it) return vk_parse($it, $post);
        if (!empty($j['error']['error_msg'])) $vkErr = (strpos($j['error']['error_msg'], 'group auth') !== false ? 'Ключ сообщества ВК не подходит — нужен сервисный ключ приложения. ' : 'ВК ответил: ' . $j['error']['error_msg'] . '. ');
    }
    $html = http_get('https://vk.com/wall' . $id, 'TelegramBot (like TwitterBot)');
    if ($html && !mb_check_encoding($html, 'UTF-8')) $html = mb_convert_encoding($html, 'UTF-8', 'Windows-1251');
    $meta = [];
    if (preg_match_all('~<meta\s+(?:property|name)="(og:[a-z:]+)"\s+content="([^"]*)"~i', $html, $m, PREG_SET_ORDER)) foreach ($m as $x) if (!isset($meta[$x[1]])) $meta[$x[1]] = html_entity_decode($x[2], ENT_QUOTES, 'UTF-8');
    $desc = $meta['og:description'] ?? '';
    if (!$desc && !($meta['og:image'] ?? '')) { $post['warn'] = ($vkErr ?? '') . 'Не удалось прочитать пост автоматически — заполните текст и картинку вручную.'; return $post; }
    if (!empty($vkErr)) $post['warn'] = $vkErr . 'Текст подтянут кратко — проверьте его перед публикацией.';
    $post['text'] = $desc;
    $post['title'] = vk_title($desc) ?: ($meta['og:title'] ?? '');
    $post['img'] = $meta['og:image'] ?? '';
    return $post;
}
function vk_parse($it, $post = null) {
    if (!$post) { $id = $it['owner_id'] . '_' . $it['id']; $post = ['vk' => $id, 'url' => 'https://vk.com/wall' . $id]; }
    $txt = $it['text'] ?? '';
    if (!$txt && !empty($it['copy_history'][0]['text'])) $txt = $it['copy_history'][0]['text'];
    $img = '';
    $atts = array_merge($it['attachments'] ?? [], $it['copy_history'][0]['attachments'] ?? []);
    foreach ($atts as $a) {
        if ($a['type'] === 'photo') { $sz = $a['photo']['sizes'] ?? []; usort($sz, function ($x, $y) { return $y['width'] <=> $x['width']; }); if ($sz) { $img = $sz[0]['url']; break; } }
        if ($a['type'] === 'video' && !empty($a['video']['image'])) { $v = $a['video']['image']; usort($v, function ($x, $y) { return $y['width'] <=> $x['width']; }); $img = $v[0]['url']; break; }
        if ($a['type'] === 'link' && !empty($a['link']['photo']['sizes'])) { $sz = $a['link']['photo']['sizes']; usort($sz, function ($x, $y) { return $y['width'] <=> $x['width']; }); $img = $sz[0]['url']; break; }
    }
    $post['text'] = preg_replace('~\[(?:id|club|public)\d+\|([^\]]+)\]~u', '$1', $txt);
    $post['title'] = vk_title($txt);
    $post['img'] = $img; $post['date'] = (int)($it['date'] ?? time());
    $post['likes'] = (int)($it['likes']['count'] ?? 0); $post['views'] = (int)($it['views']['count'] ?? 0);
    return $post;
}
function news_cfg() { $c = is_file(__DIR__ . '/news_cfg.json') ? json_decode(file_get_contents(__DIR__ . '/news_cfg.json'), true) : []; return array_merge(['auto' => true, 'last' => 0, 'hidden' => [], 'err' => ''], is_array($c) ? $c : []); }
function news_cfg_save($c) { file_put_contents(__DIR__ . '/news_cfg.json', json_encode($c, JSON_UNESCAPED_UNICODE)); }
function news_img($src, $vk) {
    if (!$src || !preg_match('~^https?://~', $src)) return $src;
    $dir = __DIR__ . '/news'; if (!is_dir($dir)) @mkdir($dir, 0755);
    $bin = http_get($src, 'Mozilla/5.0');
    if (!$bin || strlen($bin) < 1000 || !@getimagesizefromstring($bin)) return $src;
    $f = 'news/' . preg_replace('~[^\d_-]~', '', $vk ?: (string)time()) . '_' . substr(md5($src), 0, 6) . '.jpg';
    return @file_put_contents(__DIR__ . '/' . $f, $bin) ? $f : $src;
}
function vk_group() { return preg_match('~vk\.(?:com|ru)/([A-Za-z0-9_.]+)~', AMRP_VK, $m) ? $m[1] : ''; }
function vk_autosync($force = false) {
    $vt = defined('VK_TOKEN') ? VK_TOKEN : '';
    $c = news_cfg();
    if (!$vt || !vk_group() || (!$c['auto'] && !$force) || (!$force && time() - $c['last'] < 600)) return null;
    $lock = @fopen(__DIR__ . '/news.lock', 'c'); if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) return null;
    $c['last'] = time(); news_cfg_save($c);
    $g = vk_group();
    $q = preg_match('~^(?:club|public)(\d+)$~', $g, $m) ? 'owner_id=-' . $m[1] : 'domain=' . urlencode($g);
    $w = json_decode(http_get('https://api.vk.com/method/wall.get?' . $q . '&count=15&filter=owner&v=5.131&access_token=' . urlencode($vt), 'AMRP'), true);
    if (!isset($w['response']['items'])) { $c['err'] = $w['error']['error_msg'] ?? 'ВК не ответил'; news_cfg_save($c); flock($lock, LOCK_UN); return $c['err']; }
    $n = news_all(); $have = []; foreach ($n as $x) if (!empty($x['vk'])) $have[$x['vk']] = 1;
    $add = 0;
    foreach (array_reverse($w['response']['items']) as $it) {
        $id = $it['owner_id'] . '_' . $it['id'];
        if (isset($have[$id]) || in_array($id, $c['hidden'], true)) continue;
        if (!empty($it['marked_as_ads'])) continue;
        $p = vk_parse($it);
        if (trim($p['text']) === '' && !$p['img']) continue;
        $p['img'] = news_img($p['img'], $id);
        $n[] = $p + ['id' => bin2hex(random_bytes(5)), 'tag' => '', 'pin' => false, 'by' => 'авто из ВК'];
        $add++;
    }
    if ($add) news_save($n);
    $c['err'] = ''; news_cfg_save($c);
    flock($lock, LOCK_UN);
    return $add;
}
function news_text($t) {
    $t = h($t);
    $t = preg_replace('~(https?://[^\s<]+)~u', '<a href="$1" target="_blank" rel="noopener">$1</a>', $t);
    $t = preg_replace('~(^|\s)#([\p{L}\d_]+)~u', '$1<span class="hash">#$2</span>', $t);
    return nl2br($t);
}
function ru_date($ts) { $m = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']; return date('j', $ts) . ' ' . $m[date('n', $ts) - 1] . ' ' . date('Y', $ts); }
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
<link rel="icon" href="logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700;800;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css?v=4">
</head><body>
<header class="nav"><div class="wrap nav-in">
  <a href="index.php" class="brand"><img src="logo.png" alt="AMRP"><span>AMRP</span></a>
  <nav>
    <a href="index.php#about">О сервере</a><a href="index.php#start">Как начать</a><a href="index.php#news">Новости</a><a href="index.php#top">Топ</a><a href="donate.php">Донат</a>
    <a class="btn btn-sm" href="cabinet.php">Личный кабинет</a>
  </nav>
  <div class="online"><i class="<?= $fresh ? 'on' : '' ?>"></i><?= $fresh ? (int)$d['online'] . ' онлайн' : 'сервер офлайн' ?></div>
</div></header>
<?php }
function amrp_foot() { ?>
<footer class="foot"><div class="wrap foot-in">
  <div class="brand"><img src="logo.png" alt=""><span>AMRP</span></div>
  <div class="links">
    <?php if (AMRP_DISCORD) { ?><a href="<?= h(AMRP_DISCORD) ?>" target="_blank">Discord</a><?php } ?>
    <?php if (AMRP_VK) { ?><a href="<?= h(AMRP_VK) ?>" target="_blank">ВКонтакте</a><?php } ?>
    <?php if (AMRP_TG) { ?><a href="<?= h(AMRP_TG) ?>" target="_blank">Telegram</a><?php } ?>
  </div>
  <div class="copy">© <?= date('Y') ?> AMRP. Проект не связан с Rockstar Games.</div>
</div></footer>
</body></html>
<?php }
