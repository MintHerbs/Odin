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