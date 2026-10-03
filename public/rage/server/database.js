const mysql = require('mysql2/promise');
const cfg = require('./config');

const pool = mysql.createPool({
    ...cfg.db,
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 60000,
    charset: 'utf8mb4_unicode_ci',
    timezone: 'Z'
});

let tries = 0;

async function init() {
    tries++;
    try {
        const conn = await pool.getConnection();
        const [[v]] = await conn.query('SELECT VERSION() AS v');
        console.log(`[DB] MariaDB подключена: ${v.v}`);
        conn.release();
    } catch (e) {
        console.error('[DB] Нет связи с базой:', e.code, '(попытка ' + tries + ')');
        if (tries < 10) {
            console.error('[DB] Повтор через 5 секунд...');
            setTimeout(init, 5000);
        } else {
            console.error('[DB] Проверь: запущена ли MariaDB и создана ли база sunrise_rp');
        }
        return;
    }

    await pool.query(`
        CREATE TABLE IF NOT EXISTS accounts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            login VARCHAR(32) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            social VARCHAR(64),
            money INT NOT NULL DEFAULT 5000,
            bank INT NOT NULL DEFAULT 0,
            admin TINYINT NOT NULL DEFAULT 0,
            pos_x FLOAT NOT NULL DEFAULT -1035.7,
            pos_y FLOAT NOT NULL DEFAULT -2731.8,
            pos_z FLOAT NOT NULL DEFAULT 13.7,
            heading FLOAT NOT NULL DEFAULT 0,
            health INT NOT NULL DEFAULT 100,
            skin VARCHAR(32) NOT NULL DEFAULT 'mp_m_freemode_01',
            playtime INT NOT NULL DEFAULT 0,
            last_login TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_login (login)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS vehicles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            owner_id INT NOT NULL,
            model VARCHAR(32) NOT NULL,
            plate VARCHAR(8) NOT NULL,
            color1 INT NOT NULL DEFAULT 0,
            color2 INT NOT NULL DEFAULT 0,
            pos_x FLOAT, pos_y FLOAT, pos_z FLOAT, heading FLOAT,
            fuel INT NOT NULL DEFAULT 100,
            locked TINYINT NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_owner (owner_id),
            CONSTRAINT fk_veh_owner FOREIGN KEY (owner_id)
                REFERENCES accounts(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            account_id INT,
            type VARCHAR(32) NOT NULL,
            text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_type (type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    const cols = [
        "ALTER TABLE accounts ADD COLUMN IF NOT EXISTS job VARCHAR(32) NULL",
        "ALTER TABLE accounts ADD COLUMN IF NOT EXISTS job_rank INT NOT NULL DEFAULT 0",
        "ALTER TABLE accounts ADD COLUMN IF NOT EXISTS deaths INT NOT NULL DEFAULT 0"
    ];
    for (const sql of cols) {
        await pool.query(sql).catch((e) => console.error('[DB] ' + e.message));
    }

    console.log('[DB] Таблицы готовы');
}

init();

module.exports = pool;
module.exports.log = async (accountId, type, text) => {
    await pool.query(
        'INSERT INTO logs (account_id, type, text) VALUES (?, ?, ?)',
        [accountId, type, text]
    ).catch(() => {});
};
