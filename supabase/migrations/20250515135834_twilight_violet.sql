/*
  # Add last_sign_in_at column to cached table

  1. Changes
    - Add `last_sign_in_at` column to the `cached` table
      - Type: timestamp with time zone
      - Nullable: true (to maintain compatibility with existing records)
      - No default value

  2. Purpose
    - Support tracking of user sign-in timestamps
    - Fix 400 error in login request
*/

ALTER TABLE cached 
ADD COLUMN IF NOT EXISTS last_sign_in_at timestamp with time zone;

-- Create an index to improve query performance when filtering/sorting by last sign in
CREATE INDEX IF NOT EXISTS cached_last_sign_in_at_idx ON cached(last_sign_in_at);