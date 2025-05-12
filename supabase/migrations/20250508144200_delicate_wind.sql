/*
  # Create users table and fix schema relationships

  1. New Tables
    - `users` table to store authentication data
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `email` (text, unique)
      - `last_sign_in_at` (timestamp)

  2. Security
    - Enable RLS on `users` table
    - Add policy for users to read their own data
*/

-- Create the users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  email text UNIQUE NOT NULL,
  last_sign_in_at timestamptz
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Ensure the profiles foreign key constraint exists and is valid
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id) REFERENCES users(id);
  END IF;
END $$;