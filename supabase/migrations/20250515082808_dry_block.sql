/*
  # Add additional fields to hospitals table

  1. Changes
    - Add patient_id_format field to hospitals table
    - Add patient_id_prefix field to hospitals table
    - Add patient_id_digits field to hospitals table
    - Add patient_id_auto_increment field to hospitals table
    - Add patient_id_last_number field to hospitals table
    - Add domain_enabled field to hospitals table
    
  2. Security
    - No changes to security policies
*/

-- Add new columns to hospitals table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hospitals' AND column_name = 'patient_id_format'
  ) THEN
    ALTER TABLE hospitals ADD COLUMN patient_id_format text DEFAULT 'prefix_number';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hospitals' AND column_name = 'patient_id_prefix'
  ) THEN
    ALTER TABLE hospitals ADD COLUMN patient_id_prefix text DEFAULT 'PT';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hospitals' AND column_name = 'patient_id_digits'
  ) THEN
    ALTER TABLE hospitals ADD COLUMN patient_id_digits integer DEFAULT 6;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hospitals' AND column_name = 'patient_id_auto_increment'
  ) THEN
    ALTER TABLE hospitals ADD COLUMN patient_id_auto_increment boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hospitals' AND column_name = 'patient_id_last_number'
  ) THEN
    ALTER TABLE hospitals ADD COLUMN patient_id_last_number integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hospitals' AND column_name = 'domain_enabled'
  ) THEN
    ALTER TABLE hospitals ADD COLUMN domain_enabled boolean DEFAULT true;
  END IF;
END $$;