/*
  # Add prescriptions column to consultations table

  1. Changes
    - Add prescriptions column to consultations table to store medication information
    - Update existing consultations to have an empty array for prescriptions
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add prescriptions column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultations' 
    AND column_name = 'prescriptions'
  ) THEN
    ALTER TABLE consultations 
    ADD COLUMN prescriptions JSONB[];
  END IF;
  
  -- Add pharmacy_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultations' 
    AND column_name = 'pharmacy_status'
  ) THEN
    ALTER TABLE consultations 
    ADD COLUMN pharmacy_status TEXT DEFAULT 'pending';
  END IF;
  
  -- Add pharmacy_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultations' 
    AND column_name = 'pharmacy_id'
  ) THEN
    ALTER TABLE consultations 
    ADD COLUMN pharmacy_id UUID REFERENCES pharmacy(id);
  END IF;
END $$;