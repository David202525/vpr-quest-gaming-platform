<?php
require_once __DIR__ . '/../config.php';
require __DIR__ . '/../pay.php';
$num = $_GET['orderNumber'] ?? $_POST['orderNumber'] ?? '';
if (preg_match('~^AM\d+$~', $num)) pay_check($num);
http_response_code(200);
echo 'OK';
