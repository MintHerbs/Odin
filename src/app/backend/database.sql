CREATE TABLE votes (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    genre TEXT NOT NULL,
    is_ai BOOLEAN NOT NULL,
    
    -- Human (Sega) IDs are integers, AI IDs are strings
    sega_id INT4,
    ai_id TEXT,
    
    vote_value INT2 NOT NULL CHECK (vote_value >= 1 AND vote_value <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
    
    -- If you ever want to add the constraint back, 
    -- you must put a comma after created_at first.
);

-- Add indexes for faster querying
CREATE INDEX idx_votes_session_id ON votes(session_id);
CREATE INDEX idx_votes_genre ON votes(genre);

-- Session trackers table for one-vote-per-user enforcement
CREATE TABLE session_trackers (
    id BIGSERIAL PRIMARY KEY,
    ip_address TEXT NOT NULL UNIQUE,
    session_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster IP lookups
CREATE INDEX idx_session_trackers_ip ON session_trackers(ip_address);
CREATE INDEX idx_session_trackers_session ON session_trackers(session_id);

-- Note: The 'session' table should have an 'opinion' column (TEXT) to store user opinions
-- Example: ALTER TABLE session ADD COLUMN opinion TEXT;