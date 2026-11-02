<?php
require __DIR__ . '/lib.php';
session_start();
$err = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $_SESSION['tries'] = ($_SESSION['tries'] ?? 0) + 1;
    if ($_SESSION['tries'] > 10 && time() - ($_SESSION['tryT'] ?? 0) < 300) $err = 'Слишком много попыток. Подождите 5 минут.';
    else {
        if ($_SESSION['tries'] > 10) $_SESSION['tries'] = 1;
        $_SESSION['tryT'] = time();
        $p = amrp_find($_POST['login'] ?? '');
        if (!$p) $err = 'Аккаунт не найден. Если вы только зарегистрировались — подождите пару минут.';
        elseif (!$p['pass']) $err = 'Зайдите один раз в игру — после этого пароль заработает и на сайте.';
        elseif (!amrp_check($_POST['pass'] ?? '', $p['pass'])) $err = 'Неверный пароль';
        else { session_regenerate_id(true); $_SESSION['uid'] = $p['id']; $_SESSION['tries'] = 0; header('Location: cabinet.php'); exit; }
    }
}
$me = isset($_SESSION['uid']) ? amrp_byId($_SESSION['uid']) : null;
amrp_head($me ? 'Кабинет — ' . ($me['nick'] ?: $me['login']) : 'Вход в личный кабинет — AMRP');

if (!$me) { ?>
<section class="auth" style="background-image:url(hero.jpg)"><div class="hero-fade"></div>
  <form method="post" class="card login">
    <img src="logo.png" alt="">
    <h2>Личный кабинет</h2>
    <p class="muted">Логин и пароль — те же, что при входе в игру</p>
    <?php if ($err) { ?><div class="err"><?= h($err) ?></div><?php } ?>
    <input name="login" placeholder="Логин" required value="<?= h($_POST['login'] ?? '') ?>">
    <input name="pass" type="password" placeholder="Пароль" required>
    <button class="btn">Войти</button>
  </form>
</section>
<?php amrp_foot(); exit; }

$sk = $me['skills'] ?: [];
$skills = [['Стрельба', $sk['shoot'] ?? 0, '#ffd23f'], ['Вождение', $sk['drive'] ?? 0, '#7be08a'], ['Выносливость', $sk['stamina'] ?? 0, '#5ee6c8'], ['Выживание', $sk['survive'] ?? 0, '#ff8a5c']];
$pct = $me['need'] ? min(100, round($me['exp'] / $me['need'] * 100)) : 0;
?>
<section class="cab wrap">
  <div class="card profile">
    <div class="ava"><?= h(mb_strtoupper(mb_substr($me['nick'] ?: $me['login'], 0, 1))) ?></div>
    <div class="pinfo">
      <h1><?= h($me['nick'] ?: 'Персонаж не создан') ?></h1>
      <div class="chips">
        <span class="chip <?= $me['online'] ? 'g' : '' ?>"><?= $me['online'] ? '● В игре' : '○ Не в сети' ?></span>
        <span class="chip">ID <?= (int)$me['id'] ?></span>
        <span class="chip"><?= h($me['gender']) ?></span>
        <?php if ($me['vip']) { ?><span class="chip" style="color:<?= h($me['vip']['color']) ?>;border-color:<?= h($me['vip']['color']) ?>">👑 <?= h($me['vip']['n']) ?> · <?= (int)$me['vip']['left'] ?> дн.</span><?php } ?>
        <?php if ($me['admin']) { ?><span class="chip gold">Администратор <?= (int)$me['admin'] ?> ур.</span><?php } ?>
        <?php if ($me['banned']) { ?><span class="chip r">Заблокирован: <?= h($me['banned']) ?></span><?php } ?>
      </div>
      <div class="lvl"><div><b><?= (int)$me['lvl'] ?> уровень</b><span><?= (int)$me['exp'] ?> / <?= (int)$me['need'] ?> опыта</span></div><div class="bar"><i style="width:<?= $pct ?>%"></i></div></div>
    </div>
    <a href="logout.php" class="btn btn-ghost btn-sm">Выйти</a>
  </div>

  <div class="grid4 money">
    <div class="card m"><span>Наличные</span><b><?= money($me['money']) ?></b></div>
    <div class="card m"><span>Банковский счёт</span><b><?= money($me['bank']) ?></b></div>
    <div class="card m"><span>RC коины</span><b class="gold"><?= number_format((int)$me['coins'], 0, '', '.') ?></b></div>
    <div class="card m"><span>Всего в игре</span><b><?= hours($me['playtime']) ?></b></div>
  </div>

  <div class="grid2">
    <div class="card">
      <h3>Персонаж</h3>
      <dl>
        <dt>Логин</dt><dd><?= h($me['login']) ?></dd>
        <dt>Телефон</dt><dd><?= h($me['phone'] ?: '—') ?></dd>
        <dt>Работа / фракция</dt><dd><?= h($me['job'] ?: 'Безработный') ?><?= $me['job'] && $me['rank'] ? ' · ранг ' . (int)$me['rank'] : '' ?><?= $me['leader'] ? ' · лидер' : '' ?></dd>
        <dt>Семья</dt><dd><?= $me['family'] ? h($me['family']['n']) . ($me['family']['rank'] ? ' · ' . h($me['family']['rank']) : '') : '—' ?></dd>
        <dt>Розыск</dt><dd><?= $me['wanted'] ? '<span class="red">' . str_repeat('★', (int)$me['wanted']['s']) . '</span> ' . h($me['wanted']['r']) : 'Чист перед законом' ?></dd>
        <dt>Смертей</dt><dd><?= (int)$me['deaths'] ?></dd>
        <dt>Регистрация</dt><dd><?= ago($me['created']) ?></dd>
        <dt>Последний вход</dt><dd><?= ago($me['last']) ?></dd>
      </dl>
    </div>
    <div class="card">
      <h3>Навыки</h3>
      <?php foreach ($skills as $s) { $v = (int)$s[1]; ?>
      <div class="skill"><div><span><?= $s[0] ?></span><b><?= floor($v / 100) ?> / 5</b></div><div class="bar"><i style="width:<?= min(100, $v / 5) ?>%;background:<?= $s[2] ?>"></i></div></div>
      <?php } ?>
      <h3 class="mt">Документы</h3>
      <?php if (!$me['docs']) { ?><p class="muted">Документов нет — получите паспорт в мэрии.</p><?php } else { ?>
      <div class="docs"><?php foreach ($me['docs'] as $x) { ?><div class="doc">📄 <span><?= h($x['title']) ?><?= !empty($x['cats']) ? ' (' . h(implode(', ', $x['cats'])) . ')' : '' ?></span><?php if ($x['until']) { ?><small>до <?= h($x['until']) ?></small><?php } ?></div><?php } ?></div>
      <?php } ?>
    </div>
  </div>

  <div class="grid2">
    <div class="card">
      <h3>Транспорт <small><?= count($me['cars']) ?></small></h3>
      <?php if (!$me['cars']) { ?><p class="muted">Своих машин пока нет.</p><?php } else { ?>
      <div class="list"><?php foreach ($me['cars'] as $c) { ?><div class="row">🚗 <b><?= h(ucfirst($c['model'])) ?></b><span class="plate"><?= h($c['plate']) ?></span><small>⛽ <?= (int)$c['fuel'] ?>%</small></div><?php } ?></div>
      <?php } ?>
    </div>
    <div class="card">
      <h3>Недвижимость <small><?= count($me['houses']) ?></small></h3>
      <?php if (!$me['houses']) { ?><p class="muted">Жилья пока нет.</p><?php } else { ?>
      <div class="list"><?php foreach ($me['houses'] as $hs) { ?><div class="row">🏠 <b><?= h($hs) ?></b></div><?php } ?></div>
      <?php } ?>
    </div>
  </div>
  <p class="muted center small">Данные обновляются с сервера каждые 2 минуты · последнее обновление: <?= amrp_data()['t'] ? date('d.m.Y H:i', (int)(amrp_data()['t'] / 1000)) : '—' ?> (МСК)</p>
</section>
<?php amrp_foot();
