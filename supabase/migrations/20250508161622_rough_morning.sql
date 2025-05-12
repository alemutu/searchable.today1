/*
  # Update Patient Registration Schema

  1. Changes
    - Add priority_level field to patients table
    - Add registration_type field to patients table
    - Add payment_method field to patients table
    - Update current_flow_step options
    - Add initial_status field

  2. Security
    - Maintain existing RLS policies
    - Ensure proper constraints for new fields
*/

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS priority_level text CHECK (priority_level IN ('normal', 'urgent', 'critical')) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS registration_type text CHECK (registration_type IN ('new', 'returning')) DEFAULT 'new',
ADD COLUMN IF NOT EXISTS payment_method text CHECK (payment_method IN ('cash', 'insurance', 'credit_card', 'debit_card', 'mobile_payment')) DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS initial_status text CHECK (initial_status IN ('registered', 'activated')) DEFAULT 'registered';

-- Update the check constraint for current_flow_step to include new steps
ALTER TABLE patients
DROP CONSTRAINT IF EXISTS valid_flow_step;

ALTER TABLE patients
ADD CONSTRAINT valid_flow_step CHECK (
  current_flow_step IN (
    'registration',
    'triage',
    'waiting_consultation',
    'consultation',
    'lab_tests',
    'radiology',
    'pharmacy',
    'billing',
    'completed',
    'emergency'
  )
);