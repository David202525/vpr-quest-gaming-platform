<?php
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) { http_response_code(404); exit; }
define('ALFA_USER', '');
define('ALFA_PASS', '');
define('ALFA_TEST', true);
define('DONATE_RATE', 1);
define('DONATE_MIN', 10);
define('DONATE_MAX', 100000);
define('DONATE_PACKS', [100, 300, 500, 1000, 2500, 5000]);
define('DONATE_BONUS', [1000 => 10, 2500 => 15, 5000 => 20]);
