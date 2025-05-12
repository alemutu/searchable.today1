/*
  # Fix patients table RLS policies

  1. Changes
    - Add new RLS policy to allow authenticated users to insert patients
    - Ensure hospital staff can still manage their patients
    - Keep existing policies for reading patients

  2. Security
    - Maintains existing security for reading and managing patients
    - Adds secure insert capability for authenticated users
    - Ensures hospital_id is required for new patients
*/

-- First, ensure RLS is enabled
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can access patients" ON patients;
DROP POLICY IF EXISTS "Hospital staff can access their patients" ON patients;

-- Create comprehensive policies for the patients table
CREATE POLICY "Hospital staff can manage their patients"
ON patients
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.hospital_id = patients.hospital_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.hospital_id = patients.hospital_id
  )
);

-- Allow authenticated users to insert new patients
CREATE POLICY "Authenticated users can insert patients"
ON patients
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  hospital_id IN (
    SELECT hospital_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Allow authenticated users to read patients from their hospital
CREATE POLICY "Authenticated users can read patients"
ON patients
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  hospital_id IN (
    SELECT hospital_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);