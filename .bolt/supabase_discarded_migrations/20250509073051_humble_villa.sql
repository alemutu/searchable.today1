/*
  # Add prescriptions column to consultations table

  1. Changes
    - Add `prescriptions` JSONB[] column to `consultations` table to store prescription data
      - Array of prescription objects containing medication details
      - Nullable since not all consultations require prescriptions
    
  2. Notes
    - Using JSONB[] to store multiple prescriptions per consultation
    - Each prescription object will contain medication, dosage, frequency, duration, and instructions
*/

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
END $$;