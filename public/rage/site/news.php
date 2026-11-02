<?php
require __DIR__ . '/lib.php';
$p = news_get($_GET['id'] ?? '');
if (!$p) { header('Location: index.php#news'); exit; }
amrp_head(($p['title'] ?: 'Новость') . ' — AMRP');
?>
<section class="cab wrap">
  <a href="index.php#news" class="back">← Все новости</a>
  <article class="card post-full">
    <?php if ($p['img']) { ?><img src="<?= h($p['img']) ?>" alt=""><?php } ?>
    <div class="post-fb">
      <div class="post-meta"><?php if ($p['tag']) { ?><span class="post-tag s"><?= h($p['tag']) ?></span><?php } ?><span><?= ru_date($p['date']) ?></span>
        <?php if ($p['views']) { ?><span>👁 <?= number_format($p['views'], 0, '', ' ') ?></span><?php } ?><?php if ($p['likes']) { ?><span>♥ <?= (int)$p['likes'] ?></span><?php } ?></div>
      <h1><?= h($p['title']) ?></h1>
      <div class="post-txt"><?= news_text($p['text']) ?></div>
      <?php if ($p['url']) { ?><a class="btn btn-vk" href="<?= h($p['url']) ?>" target="_blank" rel="noopener">Обсудить во ВКонтакте</a><?php } ?>
    </div>
  </article>
</section>
<?php amrp_foot();
