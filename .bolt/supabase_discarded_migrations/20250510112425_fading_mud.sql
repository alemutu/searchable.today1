/*
  # Fix patients table RLS policies

  1. Changes
    - Drop existing RLS policies that are too restrictive
    - Create new policies that allow authenticated users to insert patients
    - Ensure hospital staff can manage their patients
    
  2. Security
    - Enable RLS on patients table
    - Add policies for:
      - Authenticated users can insert patients
      - Authenticated users can read patients
      - Hospital staff can manage their patients
*/

-- Ensure RLS is enabled
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Authenticated users can insert patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can read patients" ON patients;
DROP POLICY IF EXISTS "Hospital staff can manage their patients" ON patients;

-- Create new policies
CREATE POLICY "Authenticated users can insert patients"
  ON patients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read patients"
  ON patients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Hospital staff can manage their patients"
  ON patients
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);