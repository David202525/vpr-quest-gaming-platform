<?php
require __DIR__ . '/lib.php';
session_start();
$err = ''; $ok = '';
$tokens = amrp_data()['tokens'] ?? [];
function adm_csrf() { if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(16)); return $_SESSION['csrf']; }
function adm_img($src, $vk) {
    if (!$src || !preg_match('~^https?://~', $src)) return $src;
    $dir = __DIR__ . '/news'; if (!is_dir($dir)) @mkdir($dir, 0755);
    $bin = http_get($src, 'Mozilla/5.0');
    if (!$bin || strlen($bin) < 1000 || !@getimagesizefromstring($bin)) return $src;
    $f = 'news/' . preg_replace('~[^\d_-]~', '', $vk ?: (string)time()) . '_' . substr(md5($src), 0, 6) . '.jpg';
    return @file_put_contents(__DIR__ . '/' . $f, $bin) ? $f : $src;
}
if (isset($_GET['out'])) { unset($_SESSION['adm']); header('Location: admin.php'); exit; }
if (($_POST['a'] ?? '') === 'login') {
    $_SESSION['atries'] = ($_SESSION['atries'] ?? 0) + 1;
    if ($_SESSION['atries'] > 8 && time() - ($_SESSION['atT'] ?? 0) < 600) $err = 'Слишком много попыток. Подождите 10 минут.';
    else {
        if ($_SESSION['atries'] > 8) $_SESSION['atries'] = 1;
        $_SESSION['atT'] = time();
        $h = hash('sha256', trim($_POST['key'] ?? ''));
        $u = null; foreach ($tokens as $t) if (hash_equals($t['h'], $h)) $u = $t;
        if (!$u) $err = $tokens ? 'Неверный ключ или нет прав (нужен уровень 7+)' : 'Сервер ещё не передал ключи на сайт. Получите ключ в игре и подождите 2 минуты.';
        else { session_regenerate_id(true); $_SESSION['adm'] = ['h' => $u['h'], 'login' => $u['login'], 'lvl' => $u['lvl']]; $_SESSION['atries'] = 0; header('Location: admin.php'); exit; }
    }
}
$adm = $_SESSION['adm'] ?? null;
if ($adm) { $still = false; foreach ($tokens as $t) if ($t['h'] === $adm['h']) $still = true; if (!$still && $tokens) { unset($_SESSION['adm']); $adm = null; $err = 'Ключ больше не действует — получите новый в игре.'; } }

$draft = null;
if ($adm && $_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['a'] ?? '') !== 'login') {
    if (!hash_equals(adm_csrf(), $_POST['csrf'] ?? '')) $err = 'Сессия устарела, повторите действие';
    else {
        $a = $_POST['a'] ?? '';
        if ($a === 'fetch') {
            $draft = vk_fetch($_POST['url'] ?? '');
            if (!empty($draft['err'])) { $err = $draft['err']; $draft = null; }
            elseif (!empty($draft['warn'])) $err = trim($draft['warn']);
        } elseif ($a === 'save') {
            $n = news_all();
            $id = $_POST['id'] ?: bin2hex(random_bytes(5));
            $old = null; foreach ($n as $i => $x) if ($x['id'] === $id) { $old = $x; unset($n[$i]); }
            $title = trim($_POST['title'] ?? ''); $text = trim($_POST['text'] ?? '');
            if ($title === '' && $text === '') $err = 'Нужен хотя бы заголовок или текст';
            else {
                $img = trim($_POST['img'] ?? '');
                if ($img !== ($old['img'] ?? '')) $img = adm_img($img, $_POST['vk'] ?? '');
                $ts = strtotime($_POST['date'] ?? '') ?: time();
                $n[] = ['id' => $id, 'vk' => $_POST['vk'] ?? '', 'url' => trim($_POST['url'] ?? ''), 'title' => $title, 'text' => $text, 'img' => $img,
                    'tag' => trim($_POST['tag'] ?? ''), 'pin' => !empty($_POST['pin']), 'date' => $ts, 'likes' => (int)($_POST['likes'] ?? 0), 'views' => (int)($_POST['views'] ?? 0), 'by' => $adm['login']];
                if (news_save($n)) { header('Location: admin.php?ok=' . ($old ? 'upd' : 'add')); exit; }
                $err = 'Нет прав на запись в папку сайта';
            }
        } elseif ($a === 'del') {
            $n = array_filter(news_all(), function ($x) { return $x['id'] !== ($_POST['id'] ?? ''); });
            news_save($n); header('Location: admin.php?ok=del'); exit;
        } elseif ($a === 'pin') {
            $n = news_all(); foreach ($n as &$x) if ($x['id'] === ($_POST['id'] ?? '')) $x['pin'] = empty($x['pin']); unset($x);
            news_save($n); header('Location: admin.php'); exit;
        }
    }
}
if (isset($_GET['edit']) && $adm) $draft = news_get($_GET['edit']);
$ok = ['add' => 'Новость опубликована', 'upd' => 'Новость обновлена', 'del' => 'Новость удалена'][$_GET['ok'] ?? ''] ?? '';
amrp_head('Админка — AMRP');

if (!$adm) { ?>
<section class="auth" style="background-image:url(hero.jpg)"><div class="hero-fade"></div>
  <form method="post" class="card login">
    <img src="logo.png" alt="">
    <h2>Админка сайта</h2>
    <p class="muted">Тот же ключ, что и для логов: в игре F4 → Руководство → «Получить ключ доступа». Доступ с 7 уровня.</p>
    <?php if ($err) { ?><div class="err"><?= h($err) ?></div><?php } ?>
    <input type="hidden" name="a" value="login">
    <input name="key" type="password" placeholder="Ключ доступа" required autocomplete="off">
    <button class="btn">Войти</button>
  </form>
</section>
<?php amrp_foot(); exit; }
$list = news_all(); $cs = adm_csrf();
?>
<section class="cab wrap adm">
  <div class="adm-head">
    <div><h1>Новости</h1><p class="muted">Вы вошли как <b class="gold"><?= h($adm['login']) ?></b> · уровень <?= (int)$adm['lvl'] ?></p></div>
    <div class="adm-act"><a class="btn btn-ghost btn-sm" href="index.php#news" target="_blank">Открыть на сайте</a><a class="btn btn-ghost btn-sm" href="?out">Выйти</a></div>
  </div>
  <?php if ($ok) { ?><div class="okm"><?= h($ok) ?></div><?php } ?>
  <?php if ($err) { ?><div class="err"><?= h($err) ?></div><?php } ?>

  <form method="post" class="card adm-fetch">
    <input type="hidden" name="a" value="fetch"><input type="hidden" name="csrf" value="<?= $cs ?>">
    <h3>Добавить пост из ВКонтакте</h3>
    <div class="row"><input name="url" placeholder="Вставьте ссылку на пост: https://vk.com/wall-123456_789" required value="<?= h($_POST['url'] ?? '') ?>"><button class="btn">Загрузить</button></div>
    <a href="?edit=new" class="muted small-l">или написать новость вручную</a>
  </form>

  <?php if ($draft || ($_GET['edit'] ?? '') === 'new') { $d = $draft ?: []; ?>
  <form method="post" class="card adm-edit">
    <input type="hidden" name="a" value="save"><input type="hidden" name="csrf" value="<?= $cs ?>">
    <input type="hidden" name="id" value="<?= h($d['id'] ?? '') ?>"><input type="hidden" name="vk" value="<?= h($d['vk'] ?? '') ?>">
    <input type="hidden" name="likes" value="<?= (int)($d['likes'] ?? 0) ?>"><input type="hidden" name="views" value="<?= (int)($d['views'] ?? 0) ?>">
    <h3><?= !empty($d['id']) ? 'Редактирование' : 'Проверьте и опубликуйте' ?></h3>
    <div class="adm-grid">
      <div class="adm-fields">
        <label>Заголовок<input name="title" id="fT" value="<?= h($d['title'] ?? '') ?>" maxlength="120"></label>
        <label>Текст<textarea name="text" id="fX" rows="9"><?= h($d['text'] ?? '') ?></textarea></label>
        <label>Ссылка на картинку<input name="img" id="fI" value="<?= h($d['img'] ?? '') ?>" placeholder="https://…"></label>
        <div class="row3">
          <label>Метка<input name="tag" id="fG" value="<?= h($d['tag'] ?? '') ?>" placeholder="Обновление, Ивент…" maxlength="24"></label>
          <label>Дата<input type="datetime-local" name="date" value="<?= date('Y-m-d\TH:i', $d['date'] ?? time()) ?>"></label>
        </div>
        <label>Ссылка на оригинал<input name="url" value="<?= h($d['url'] ?? '') ?>" placeholder="https://vk.com/…"></label>
        <label class="chk"><input type="checkbox" name="pin" value="1" <?= !empty($d['pin']) ? 'checked' : '' ?>> Закрепить вверху</label>
        <div class="row"><button class="btn">Опубликовать</button><a class="btn btn-ghost" href="admin.php">Отмена</a></div>
      </div>
      <div><div class="muted small-l" style="margin-bottom:8px">Так пост будет выглядеть на сайте:</div>
        <article class="post" id="pv"><div class="post-img"><img id="pI" src="<?= h($d['img'] ?? '') ?>" alt="" onerror="this.parentNode.classList.add('noimg')"><span class="post-tag" id="pG"><?= h($d['tag'] ?? '') ?></span></div>
          <div class="post-b"><div class="post-d"><?= ru_date($d['date'] ?? time()) ?></div><h3 id="pT"><?= h($d['title'] ?? '') ?></h3><p id="pX"><?= h(mb_substr($d['text'] ?? '', 0, 180)) ?></p></div></article>
      </div>
    </div>
  </form>
  <script>(function(){function b(i,o,f){var e=document.getElementById(i);e.addEventListener('input',function(){f(document.getElementById(o),e.value)})}
  b('fT','pT',function(o,v){o.textContent=v});b('fX','pX',function(o,v){o.textContent=v.slice(0,180)});b('fG','pG',function(o,v){o.textContent=v;o.style.display=v?'':'none'});
  b('fI','pI',function(o,v){o.parentNode.classList.remove('noimg');o.src=v});var g=document.getElementById('pG');if(!g.textContent)g.style.display='none'})();</script>
  <?php } ?>

  <h3 class="adm-lh">Опубликовано: <?= count($list) ?></h3>
  <?php if (!$list) { ?><p class="muted">Пока ни одной новости. Вставьте ссылку на пост ВК выше.</p><?php } ?>
  <div class="adm-list">
    <?php foreach ($list as $x) { ?>
    <div class="card adm-row">
      <div class="adm-th" style="background-image:url('<?= h($x['img']) ?>')"></div>
      <div class="adm-info"><b><?= !empty($x['pin']) ? '📌 ' : '' ?><?= h($x['title'] ?: mb_substr($x['text'], 0, 60)) ?></b><span class="muted"><?= ru_date($x['date']) ?><?= $x['tag'] ? ' · ' . h($x['tag']) : '' ?> · добавил <?= h($x['by'] ?? '—') ?></span></div>
      <div class="adm-btns">
        <form method="post"><input type="hidden" name="csrf" value="<?= $cs ?>"><input type="hidden" name="a" value="pin"><input type="hidden" name="id" value="<?= h($x['id']) ?>"><button class="ib" title="<?= !empty($x['pin']) ? 'Открепить' : 'Закрепить' ?>">📌</button></form>
        <a class="ib" href="?edit=<?= h($x['id']) ?>" title="Изменить">✎</a>
        <form method="post" onsubmit="return confirm('Удалить новость?')"><input type="hidden" name="csrf" value="<?= $cs ?>"><input type="hidden" name="a" value="del"><input type="hidden" name="id" value="<?= h($x['id']) ?>"><button class="ib r" title="Удалить">✕</button></form>
      </div>
    </div>
    <?php } ?>
  </div>
</section>
<?php amrp_foot();
