/*
  # Add patient ID format fields to hospitals table
  
  1. Changes
    - Add patient_id_format field (text) to store the format type
    - Add patient_id_prefix field (text) to store the prefix for IDs
    - Add patient_id_digits field (integer) to store the number of digits
    - Add patient_id_auto_increment field (boolean) to enable/disable auto-increment
    - Add patient_id_last_number field (integer) to track the last used number
    
  2. Notes
    - patient_id_format options: prefix_number, prefix_year_number, hospital_prefix_number, custom
    - Default format is 'prefix_number'
    - Default prefix is 'PT'
    - Default digits is 6
    - Auto-increment is enabled by default
*/

-- Add patient ID format fields to hospitals table
ALTER TABLE hospitals
ADD COLUMN IF NOT EXISTS patient_id_format text DEFAULT 'prefix_number',
ADD COLUMN IF NOT EXISTS patient_id_prefix text DEFAULT 'PT',
ADD COLUMN IF NOT EXISTS patient_id_digits integer DEFAULT 6,
ADD COLUMN IF NOT EXISTS patient_id_auto_increment boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS patient_id_last_number integer DEFAULT 0;