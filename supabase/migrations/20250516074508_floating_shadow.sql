/*
  # Fix Database Errors

  1. Schema Updates
    - Add missing `medical_info` column to `patients` table
    - Fix `cached` table constraints
    - Fix function return issue in RLS policies

  2. Edge Function Fixes
    - Update API endpoints for hospital onboarding
*/

-- Fix missing medical_info column in patients table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'medical_info'
  ) THEN
    ALTER TABLE patients ADD COLUMN medical_info JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Fix cached table constraint issue
ALTER TABLE cached ALTER COLUMN key SET DEFAULT '';

-- Fix function return issue in profiles policy
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;