

-- 3. Session Votes Table
CREATE TABLE session_votes (
    session_id TEXT PRIMARY KEY,
    
    -- Politics
    politics_ai_id TEXT,
    politics_ai_vote INT4,
    politics_sega_id INT4,
    politics_sega_vote INT4,
    
    -- Engager
    engager_ai_id TEXT,
    engager_ai_vote INT4,
    engager_sega_id INT4,
    engager_sega_vote INT4,
    
    -- Romance
    romance_ai_id TEXT,
    romance_ai_vote INT4,
    romance_sega_id INT4,
    romance_sega_vote INT4,
    
    -- Celebration
    celebration_ai_id TEXT,
    celebration_ai_vote INT4,
    celebration_sega_id INT4,
    celebration_sega_vote INT4,
    
    -- Tipik
    tipik_ai_id TEXT,
    tipik_ai_vote INT4,
    tipik_sega_id INT4,
    tipik_sega_vote INT4,
    
    -- Seggae
    seggae_ai_id TEXT,
    seggae_ai_vote INT4,
    seggae_sega_id INT4,
    seggae_sega_vote INT4,

    created_at TIMESTAMPTZ DEFAULT NOW()
);
