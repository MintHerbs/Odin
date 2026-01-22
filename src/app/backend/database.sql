-- 1. Main Session Table (The Parent Table)
CREATE TABLE session (
    session_id TEXT PRIMARY KEY, -- Stores the UUID from React
    participant_age int4,
    sega_familiarity int4,
    ai_sentiment int4
);

-- 2. AI Lyrics Table (Updated per your request)
CREATE TABLE survey_ai_lyrics (
    session_id TEXT PRIMARY KEY REFERENCES session(session_id), 
    politics_ai_id TEXT,       -- Changed to TEXT
    politics_ai_sega TEXT,
    engager_ai_id TEXT,        -- Changed to TEXT for consistency
    engager_ai_sega TEXT,
    romance_ai_id TEXT,        -- Changed to TEXT
    romance_ai_sega TEXT,
    celebration_ai_id TEXT,    -- Changed to TEXT
    celebration_ai_sega TEXT,
    tipik_ai_id TEXT,          -- Changed to TEXT
    tipik_ai_sega TEXT
);

-- 3. Session Votes Table
CREATE TABLE session_votes (
    session_id TEXT PRIMARY KEY REFERENCES session(session_id),
    politics_ai_id int4,
    politics_ai_vote int4,
    politics_sega_id int4,
    politics_sega_vote int4,
    engager_ai_id int4,
    engager_ai_vote int4,
    engager_sega_id int4,
    engager_sega_vote int4,
    romance_ai_id int4,
    romance_ai_vote int4,
    romance_sega_id int4,
    romance_sega_vote int4,
    celebration_ai_id int4,
    celebration_ai_vote int4,
    celebration_sega_id int4,
    celebration_sega_vote int4,
    tipik_ai_id int4,
    tipik_ai_vote int4,
    tipik_sega_id int4,
    tipik_sega_vote int4
);

-- 4. Real Sega Chosen Table
CREATE TABLE session_real_sega_chosen (
    session_id TEXT PRIMARY KEY REFERENCES session(session_id),
    sid1 int4,
    sid2 int4,
    sid3 int4,
    sid4 int4,
    sid5 int4
);