-- Create a normalized table for AI-generated lyrics (No unique constraint)
CREATE TABLE session_ai_lyrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL, 
    genre TEXT NOT NULL,      
    ai_id TEXT NOT NULL,     
    lyrics TEXT NOT NULL,     
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index on session_id for faster lookups when the survey loads
CREATE INDEX idx_session_lyrics_session_id ON session_ai_lyrics(session_id);