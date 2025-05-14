/*
  # Add patient ID configuration to hospitals table
  
  1. Changes
    - Add patient_id_format field to hospitals table
    - Add patient_id_prefix field to hospitals table
    - Add patient_id_digits field to hospitals table
    - Add patient_id_auto_increment field to hospitals table
    - Add patient_id_last_number field to hospitals table
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add patient ID configuration fields to hospitals table
ALTER TABLE hospitals
ADD COLUMN IF NOT EXISTS patient_id_format text DEFAULT 'prefix_number',
ADD COLUMN IF NOT EXISTS patient_id_prefix text DEFAULT 'PT',
ADD COLUMN IF NOT EXISTS patient_id_digits integer DEFAULT 6,
ADD COLUMN IF NOT EXISTS patient_id_auto_increment boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS patient_id_last_number integer DEFAULT 0;

-- Add comment to explain the patient_id_format options
COMMENT ON COLUMN hospitals.patient_id_format IS 'Format options: prefix_number, prefix_year_number, hospital_prefix_number, custom';