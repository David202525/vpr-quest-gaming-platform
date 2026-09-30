CREATE TABLE IF NOT EXISTS t_p76227163_vpr_quest_gaming_pla.materials (
    id SERIAL PRIMARY KEY,
    child_id INTEGER NOT NULL,
    code VARCHAR(50) NOT NULL,
    amount INTEGER NOT NULL DEFAULT 0,
    UNIQUE (child_id, code)
);

CREATE TABLE IF NOT EXISTS t_p76227163_vpr_quest_gaming_pla.crafted (
    id SERIAL PRIMARY KEY,
    child_id INTEGER NOT NULL,
    code VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    rarity VARCHAR(20) NOT NULL DEFAULT 'common',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p76227163_vpr_quest_gaming_pla.craft_log (
    id SERIAL PRIMARY KEY,
    child_id INTEGER NOT NULL,
    code VARCHAR(50) NOT NULL,
    success BOOLEAN NOT NULL,
    spent_coins INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materials_child ON t_p76227163_vpr_quest_gaming_pla.materials (child_id);
CREATE INDEX IF NOT EXISTS idx_crafted_child ON t_p76227163_vpr_quest_gaming_pla.crafted (child_id);
CREATE INDEX IF NOT EXISTS idx_craftlog_child ON t_p76227163_vpr_quest_gaming_pla.craft_log (child_id);
