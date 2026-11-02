<?php
require __DIR__ . '/lib.php';
$d = amrp_data();
$pl = array_values(array_filter($d['players'], function ($p) { return empty($p['banned']) && (int)$p['admin'] === 0 && $p['nick']; }));
$rich = $pl; usort($rich, function ($a, $b) { return ($b['money'] + $b['bank']) <=> ($a['money'] + $a['bank']); });
$lvl = $pl; usort($lvl, function ($a, $b) { return [$b['lvl'], $b['exp']] <=> [$a['lvl'], $a['exp']]; });
$time = $pl; usort($time, function ($a, $b) { return $b['playtime'] <=> $a['playtime']; });
vk_autosync(); $news = news_all(); usort($news, function ($a, $b) { return [!empty($b['pin']), $b['date']] <=> [!empty($a['pin']), $a['date']]; }); $news = array_slice($news, 0, 6);
amrp_head('AMRP — GTA 5 RolePlay сервер');
?>
<section class="hero" style="background-image:url(hero.jpg)">
  <div class="hero-fade"></div>
  <div class="wrap hero-in">
    <span class="tag">Открытый бета-тест</span>
    <h1>Живи своей историей<br>в <b>Лос-Сантосе</b></h1>
    <p>AMRP — ролевой сервер GTA 5 на RAGE MP. Работа, бизнес, фракции, семьи, дома и машины — всё зависит от тебя.</p>
    <div class="hero-btn">
      <a class="btn" href="#start">Начать играть</a>
      <button class="btn btn-ghost" onclick="navigator.clipboard.writeText('<?= h(AMRP_IP) ?>');this.textContent='IP скопирован'">IP: <?= h(AMRP_IP) ?></button>
    </div>
    <div class="stats">
      <div><b><?= (int)$d['online'] ?></b><span>игроков онлайн</span></div>
      <div><b><?= (int)$d['total'] ?></b><span>жителей штата</span></div>
      <div><b>24/7</b><span>работает сервер</span></div>
    </div>
  </div>
</section>

<section id="about" class="sec wrap">
  <h2>Что ждёт в <b>AMRP</b></h2>
  <div class="car" id="feat">
   <button class="car-btn prev" type="button" aria-label="Назад"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg></button>
   <div class="car-track">
    <div class="card f"><div class="ph"><img src="f_jobs.jpg" alt="" loading="lazy"></div><h3>Работы</h3><p>Ферма, курьер, автобус, дальнобой, инкассатор, такси — заработай первые деньги честно.</p></div>
    <div class="card f"><div class="ph"><img src="f_fract.jpg" alt="" loading="lazy"></div><h3>Фракции</h3><p>Полиция, FIB, больница, армия, правительство и Weazel News. Карьера с рангами.</p></div>
    <div class="card f"><div class="ph"><img src="f_crime.jpg" alt="" loading="lazy"></div><h3>Криминал</h3><p>Банды и мафии, захват территорий, ограбления и розыск — для тех, кто любит риск.</p></div>
    <div class="card f"><div class="ph"><img src="f_home.jpg" alt="" loading="lazy"></div><h3>Имущество</h3><p>Дома, квартиры, бизнесы, автосалоны и свой гараж. Создай семью с особняком.</p></div>
  </div>
   <button class="car-btn next" type="button" aria-label="Вперёд"><svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg></button>
  </div>
  <div class="car-bar"><span></span></div>
</section>
<script>
(function(){var c=document.getElementById('feat');if(!c)return;var t=c.querySelector('.car-track'),pv=c.querySelector('.prev'),nx=c.querySelector('.next'),bar=document.querySelector('#about .car-bar'),th=bar.querySelector('span');
function step(){var f=t.querySelector('.f');return f?f.offsetWidth+18:300}
function upd(){var m=t.scrollWidth-t.clientWidth,r=m>0?t.scrollLeft/m:0,w=t.scrollWidth?t.clientWidth/t.scrollWidth:1;th.style.width=(w*100)+'%';th.style.left=(r*(1-w)*100)+'%';pv.disabled=t.scrollLeft<4;nx.disabled=t.scrollLeft>m-4;bar.style.display=m>4?'':'none';c.classList.toggle('noscroll',m<=4)}
pv.onclick=function(){t.scrollBy({left:-step(),behavior:'smooth'})};nx.onclick=function(){t.scrollBy({left:step(),behavior:'smooth'})};
t.addEventListener('scroll',upd,{passive:true});window.addEventListener('resize',upd);upd();
bar.addEventListener('click',function(e){var r=bar.getBoundingClientRect();t.scrollTo({left:(e.clientX-r.left)/r.width*(t.scrollWidth-t.clientWidth),behavior:'smooth'})});
var dn=false,sx=0,sl=0;th.addEventListener('pointerdown',function(e){dn=true;sx=e.clientX;sl=t.scrollLeft;th.setPointerCapture(e.pointerId);e.stopPropagation()});
th.addEventListener('pointermove',function(e){if(!dn)return;t.scrollLeft=sl+(e.clientX-sx)*t.scrollWidth/bar.offsetWidth});th.addEventListener('pointerup',function(){dn=false});th.addEventListener('click',function(e){e.stopPropagation()});
})();
</script>

<section class="sec wrap split">
  <img src="beta.jpg" alt="Бета-тест AMRP">
  <div>
    <h2>Бета-тест <b>уже идёт</b></h2>
    <p class="muted">Заходи сейчас, помогай находить ошибки и получай бонусы участника бета-теста. Весь прогресс персонажа виден в личном кабинете на сайте.</p>
    <a class="btn" href="cabinet.php">Открыть личный кабинет</a>
  </div>
</section>

<section id="start" class="sec wrap">
  <h2>Как начать <b>играть</b></h2>
  <div class="steps">
    <div class="card"><span>1</span><h3>Установи GTA 5</h3><p>Нужна лицензионная GTA V (Steam, Epic Games или Rockstar).</p></div>
    <div class="card"><span>2</span><h3>Скачай RAGE MP</h3><p>Клиент мультиплеера с официального сайта <a href="https://rage.mp" target="_blank">rage.mp</a>.</p></div>
    <div class="card"><span>3</span><h3>Подключись</h3><p>В RAGE MP нажми «Direct Connect» и введи IP: <b><?= h(AMRP_IP) ?></b></p></div>
    <div class="card"><span>4</span><h3>Создай персонажа</h3><p>Зарегистрируйся, настрой внешность — и добро пожаловать в штат.</p></div>
  </div>
</section>

<?php if ($news) { ?>
<section id="news" class="sec wrap">
  <h2>Последние <b>новости</b></h2>
  <div class="news">
    <?php foreach ($news as $i => $p) { ?>
    <a class="post<?= $i === 0 ? ' big' : '' ?>" href="news.php?id=<?= h($p['id']) ?>">
      <div class="post-img<?= $p['img'] ? '' : ' noimg' ?>"><?php if ($p['img']) { ?><img src="<?= h($p['img']) ?>" alt="" loading="lazy" onerror="this.parentNode.classList.add('noimg')"><?php } ?>
        <?php if ($p['tag'] || !empty($p['pin'])) { ?><span class="post-tag"><?= !empty($p['pin']) ? '📌 ' : '' ?><?= h($p['tag'] ?: 'Закреплено') ?></span><?php } ?></div>
      <div class="post-b"><div class="post-d"><?= ru_date($p['date']) ?><?= $p['vk'] ? '<i class="vk">VK</i>' : '' ?></div>
        <h3><?= h($p['title']) ?></h3><p><?= h(mb_substr(preg_replace('~\s+~u', ' ', $p['text']), 0, $i === 0 ? 260 : 130)) ?>…</p><span class="post-more">Читать далее →</span></div>
    </a>
    <?php } ?>
  </div>
  <?php if (AMRP_VK) { ?><div class="center mt"><a class="btn btn-ghost" href="<?= h(AMRP_VK) ?>" target="_blank">Все новости во ВКонтакте</a></div><?php } ?>
</section>
<?php } ?>

<section id="top" class="sec wrap">
  <h2>Лучшие <b>игроки</b></h2>
  <?php if (!$pl) { ?><p class="muted center">Рейтинг появится, когда сервер передаст данные на сайт.</p><?php } else { ?>
  <div class="grid3">
    <?php foreach ([['💰 Богатейшие', $rich, function ($p) { return money($p['money'] + $p['bank']); }], ['★ По уровню', $lvl, function ($p) { return $p['lvl'] . ' ур.'; }], ['⏱ Больше всех в игре', $time, function ($p) { return hours($p['playtime']); }]] as $t) { ?>
    <div class="card top"><h3><?= $t[0] ?></h3><ol>
      <?php foreach (array_slice($t[1], 0, 10) as $i => $p) { ?><li><i><?= $i + 1 ?></i><span><?= h($p['nick']) ?></span><b><?= h($t[2]($p)) ?></b></li><?php } ?>
    </ol></div>
    <?php } ?>
  </div>
  <?php } ?>
</section>
<?php amrp_foot();
