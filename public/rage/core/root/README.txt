УСТАНОВКА СЕРВЕРА

1. Скачай RAGE:MP сервер (с сайта rage.mp, раздел Server) и распакуй в Q:\rp
   Оттуда берутся ragemp-server.exe, BugTrap-x64.dll и папка bin — их в архиве нет.
2. Скопируй ВСЁ из этого архива в Q:\rp с заменой.
3. Установи Node.js 20 (nodejs.org) и MariaDB.
4. В MariaDB выполни database.sql (через HeidiSQL: Файл -> Загрузить SQL -> Выполнить).
5. Открой packages\core\config.js и впиши пароль от базы (password).
6. Драйвер базы (node_modules) уже лежит в архиве — npm install не нужен.
7. Верни свои моды в client_packages\game_resources\dlcpacks
8. Запусти ragemp-server.exe

Первый вход: Регистрация -> создание персонажа.
Чтобы стать главным админом, назови персонажа Rainold Star
(или в консоли сервера: setadmin [id] 9).
