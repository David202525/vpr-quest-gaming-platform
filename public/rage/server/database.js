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
            console.error('[DB] Проверь: запущена ли MariaDB и создана ли база ' + cfg.db.database + '');
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

    const NEED = {
        accounts: {
            login: "VARCHAR(32) NULL", username: "VARCHAR(32) NULL", password: "VARCHAR(255) NULL", social: "VARCHAR(64) NULL",
            social_club: "VARCHAR(64) NULL", serial: "VARCHAR(128) NULL", nick: "VARCHAR(64) NULL", gender: "TINYINT NOT NULL DEFAULT 0",
            appearance: "TEXT NULL", phone: "VARCHAR(16) NULL", money: "BIGINT NOT NULL DEFAULT 5000", bank: "INT NOT NULL DEFAULT 0",
            admin: "TINYINT NOT NULL DEFAULT 0", banned: "TINYINT NOT NULL DEFAULT 0", ban_reason: "VARCHAR(255) NULL", ban_until: "BIGINT NOT NULL DEFAULT 0",
            job: "VARCHAR(32) NULL", job_rank: "INT NOT NULL DEFAULT 0", leader: "TINYINT NOT NULL DEFAULT 0", deaths: "INT NOT NULL DEFAULT 0",
            pos_x: "FLOAT NOT NULL DEFAULT -1035.7", pos_y: "FLOAT NOT NULL DEFAULT -2731.8", pos_z: "FLOAT NOT NULL DEFAULT 13.7",
            heading: "FLOAT NOT NULL DEFAULT 0", dimension: "INT NOT NULL DEFAULT 0", health: "INT NOT NULL DEFAULT 100",
            skin: "VARCHAR(32) NOT NULL DEFAULT 'mp_m_freemode_01'", playtime: "INT NOT NULL DEFAULT 0", last_login: "TIMESTAMP NULL",
            created_at: "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP"
        },
        vehicles: {
            owner_id: "INT NULL", model: "VARCHAR(32) NULL", plate: "VARCHAR(8) NULL", color1: "INT NOT NULL DEFAULT 0", color2: "INT NOT NULL DEFAULT 0",
            pos_x: "FLOAT NULL", pos_y: "FLOAT NULL", pos_z: "FLOAT NULL", heading: "FLOAT NULL", fuel: "INT NOT NULL DEFAULT 100",
            fuel_type: "VARCHAR(10) NULL", dimension: "INT NOT NULL DEFAULT 0", locked: "TINYINT NOT NULL DEFAULT 1",
            created_at: "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP"
        },
        logs: { account_id: "INT NULL", type: "VARCHAR(32) NOT NULL DEFAULT ''", text: "TEXT NULL", created_at: "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP" }
    };
    for (const t of Object.keys(NEED)) {
        let have = [];
        try {
            const [rows] = await pool.query('SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?', [t]);
            have = rows.map((r) => String(r.c).toLowerCase());
        } catch (e) { console.error('[DB] ' + e.message); continue; }
        const add = Object.keys(NEED[t]).filter((c) => have.indexOf(c) < 0);
        for (const c of add) {
            await pool.query('ALTER TABLE `' + t + '` ADD COLUMN `' + c + '` ' + NEED[t][c])
                .then(() => console.log('[DB] Добавлена колонка ' + t + '.' + c))
                .catch((e) => console.error('[DB] ' + t + '.' + c + ': ' + e.message));
        }
        try {
            const [strict] = await pool.query("SELECT COLUMN_NAME AS c, COLUMN_TYPE AS t FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND IS_NULLABLE = 'NO' AND COLUMN_DEFAULT IS NULL AND EXTRA NOT LIKE '%auto_increment%'", [t]);
            for (const r of strict) {
                if (NEED[t][String(r.c).toLowerCase()] && ['login', 'password', 'type'].indexOf(String(r.c).toLowerCase()) >= 0) continue;
                await pool.query('ALTER TABLE `' + t + '` MODIFY `' + r.c + '` ' + r.t + ' NULL DEFAULT NULL')
                    .then(() => console.log('[DB] Колонка ' + t + '.' + r.c + ' сделана необязательной'))
                    .catch((e) => console.error('[DB] ' + t + '.' + r.c + ': ' + e.message));
            }
        } catch (e) { console.error('[DB] ' + e.message); }
        if (t === 'vehicles' && add.indexOf('owner_id') >= 0) {
            const alt = ['owner', 'account_id', 'acc_id', 'user_id', 'char_id'].find((c) => have.indexOf(c) >= 0);
            if (alt) await pool.query('UPDATE vehicles SET owner_id = `' + alt + '` WHERE owner_id IS NULL').catch(() => {});
        }
    }
    const [idx] = await pool.query("SELECT INDEX_NAME AS n FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'accounts'").catch(() => [[]]);
    const names = (idx || []).map((r) => r.n);
    if (names.indexOf('uq_nick') < 0) await pool.query('ALTER TABLE accounts ADD UNIQUE INDEX uq_nick (nick)').catch((e) => console.error('[DB] uq_nick: ' + e.message));
    if (names.indexOf('idx_owner') < 0) await pool.query('ALTER TABLE vehicles ADD INDEX idx_owner (owner_id)').catch(() => {});

    console.log('[DB] Таблицы готовы');
}

const ready = init();

module.exports = pool;
module.exports.ready = ready;
module.exports.log = async (accountId, type, text) => {
    await pool.query(
        'INSERT INTO logs (account_id, type, text) VALUES (?, ?, ?)',
        [accountId, type, text]
    ).catch(() => {});
};
