<?php
require __DIR__ . '/lib.php';
require __DIR__ . '/pay.php';
session_start();
$me = isset($_SESSION['uid']) ? amrp_byId($_SESSION['uid']) : null;
$err = ''; $ord = null;
if (isset($_GET['order']) && preg_match('~^AM\d+$~', $_GET['order'])) $ord = pay_check($_GET['order']);
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rub = (int)($_POST['rub'] ?? 0);
    $login = trim($_POST['login'] ?? '');
    $p = ctype_digit($login) ? amrp_byId($login) : amrp_find($login);
    if (!ALFA_USER || !ALFA_PASS) $err = 'Оплата ещё не подключена. Загляните позже.';
    elseif (!$p) $err = 'Игрок не найден. Укажите логин аккаунта или ID (static).';
    elseif (!empty($p['banned'])) $err = 'Этот аккаунт заблокирован.';
    elseif ($rub < DONATE_MIN || $rub > DONATE_MAX) $err = 'Сумма — от ' . DONATE_MIN . ' до ' . DONATE_MAX . ' ₽.';
    else {
        $r = pay_create($p, $rub);
        if (isset($r['url'])) { header('Location: ' . $r['url']); exit; }
        $err = $r['err'];
    }
}
amrp_head('Донат — AMRP');
$bonus = DONATE_BONUS; ksort($bonus);
?>
<section class="sec wrap donate">
  <h2>Пополнить <b>RC коины</b></h2>
  <?php if ($ord) { ?>
    <div class="card dstatus <?= $ord['st'] === 'fail' ? 'bad' : ($ord['st'] === 'new' ? 'wait' : 'good') ?>">
      <?php if ($ord['st'] === 'fail') { ?><h3>Оплата не прошла</h3><p class="muted">Деньги не списаны. Попробуйте ещё раз или выберите другой способ в форме банка.</p>
      <?php } elseif ($ord['st'] === 'new') { ?><h3>Ждём подтверждение банка…</h3><p class="muted">Страница обновится сама. Если вы оплатили — коины придут в течение пары минут.</p><script>setTimeout(function(){location.reload()},5000)</script>
      <?php } else { ?><h3>Оплата прошла — спасибо!</h3><p><b class="gold"><?= (int)$ord['coins'] ?> RC</b> для <b><?= h($ord['nick'] ?: $ord['login']) ?></b> <?= $ord['st'] === 'done' ? 'уже зачислены на аккаунт.' : 'будут зачислены в течение 1–2 минут (если вы в игре — придёт уведомление).' ?></p><?php } ?>
      <small class="muted">Заказ <?= h($ord['n']) ?> · <?= (int)$ord['rub'] ?> ₽</small>
    </div>
  <?php } ?>
  <form method="post" class="card dform" id="df">
    <?php if ($err) { ?><div class="err"><?= h($err) ?></div><?php } ?>
    <label>Логин или ID аккаунта</label>
    <input name="login" required placeholder="Например: ivan или 15" value="<?= h($_POST['login'] ?? ($me['login'] ?? '')) ?>">
    <label>Выберите сумму</label>
    <div class="packs">
      <?php foreach (DONATE_PACKS as $r) { $c = pay_coins($r); $b = $c - (int)floor($r * DONATE_RATE); ?>
      <button type="button" class="pack" data-r="<?= $r ?>"><b><?= number_format($c, 0, '', ' ') ?> RC</b><span><?= $r ?> ₽</span><?php if ($b > 0) { ?><i>+<?= number_format($b, 0, '', ' ') ?> бонус</i><?php } ?></button>
      <?php } ?>
    </div>
    <label>Или своя сумма, ₽</label>
    <input name="rub" id="rub" type="number" min="<?= DONATE_MIN ?>" max="<?= DONATE_MAX ?>" required value="<?= (int)($_POST['rub'] ?? DONATE_PACKS[1]) ?>">
    <div class="total">Вы получите: <b class="gold" id="get">0 RC</b></div>
    <button class="btn">Оплатить через СБП / картой</button>
    <p class="muted small">Оплата проходит на защищённой странице Альфа-Банка: СБП, карты МИР, Visa, Mastercard. Коины зачисляются автоматически.<?php if ($bonus) { ?> Бонус: <?php $t = []; foreach ($bonus as $f => $pc) $t[] = 'от ' . $f . ' ₽ — +' . $pc . '%'; echo h(implode(', ', $t)); ?>.<?php } ?></p>
  </form>
</section>
<script>
(function(){var R=<?= json_encode(DONATE_RATE) ?>,B=<?= json_encode($bonus) ?>,i=document.getElementById('rub'),g=document.getElementById('get'),ps=document.querySelectorAll('.pack');
function calc(){var r=parseInt(i.value)||0,c=Math.floor(r*R),b=0;for(var k in B)if(r>=+k)b=B[k];c+=Math.floor(c*b/100);g.textContent=c.toLocaleString('ru-RU')+' RC';ps.forEach(function(p){p.classList.toggle('on',+p.dataset.r===r)})}
ps.forEach(function(p){p.onclick=function(){i.value=p.dataset.r;calc()}});i.oninput=calc;calc();})();
</script>
<?php amrp_foot();
