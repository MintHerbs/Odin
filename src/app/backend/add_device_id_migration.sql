-- Migration: Add device_id column to session_trackers table
-- This allows tracking individual devices instead of just IP addresses
-- Multiple people on the same IP can now take the test, but same device cannot

-- Add device_id column (nullable for backward compatibility)
ALTER TABLE session_trackers 
ADD COLUMN IF NOT EXISTS device_id TEXT;

-- Create index on device_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_session_trackers_device_id 
ON session_trackers(device_id);

-- Add unique constraint on device_id to prevent same device from voting twice
-- Note: This will allow NULL values (multiple rows with NULL device_id are allowed)
ALTER TABLE session_trackers 
ADD CONSTRAINT unique_device_id UNIQUE (device_id);

-- Optional: View current structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'session_trackers';
