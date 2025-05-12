/*
  # Create billing settings table
  
  1. New Tables
    - `billing_settings`: Store billing configuration for each hospital
      - Payment methods
      - Tax rates
      - Invoice settings
      - Currency settings
      - Payment reminder settings
  
  2. Security
    - Enable RLS
    - Add policy for hospital staff access
*/

CREATE TABLE IF NOT EXISTS billing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE,
  payment_methods jsonb[] NOT NULL DEFAULT ARRAY[]::jsonb[],
  tax_rates jsonb[] NOT NULL DEFAULT ARRAY[]::jsonb[],
  invoice_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  default_currency text NOT NULL DEFAULT 'USD',
  auto_payment_reminders boolean DEFAULT true,
  reminder_days integer[] DEFAULT ARRAY[7, 3, 1],
  
  UNIQUE(hospital_id)
);

-- Enable RLS
ALTER TABLE billing_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for hospital staff access
CREATE POLICY "Hospital staff can access billing settings"
  ON billing_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = billing_settings.hospital_id
    )
  );

-- Add indexes
CREATE INDEX IF NOT EXISTS billing_settings_hospital_id_idx ON billing_settings (hospital_id);