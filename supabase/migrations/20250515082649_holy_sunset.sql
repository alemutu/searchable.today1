/*
  # Create billing settings table

  1. New Tables
    - `billing_settings` - Hospital billing configuration
    
  2. Security
    - Enable RLS on the table
    - Add policies for hospital staff access
    - Add policies for admin management
*/

-- Create billing_settings table
CREATE TABLE IF NOT EXISTS billing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) UNIQUE,
  payment_methods jsonb[] NOT NULL DEFAULT ARRAY[
    '{"type": "cash", "enabled": true, "config": {}}'::jsonb,
    '{"type": "credit_card", "enabled": true, "config": {}}'::jsonb,
    '{"type": "debit_card", "enabled": true, "config": {}}'::jsonb,
    '{"type": "insurance", "enabled": true, "config": {}}'::jsonb,
    '{"type": "mobile_payment", "enabled": true, "config": {}}'::jsonb
  ],
  tax_rates jsonb[] NOT NULL DEFAULT ARRAY[
    '{"name": "Standard VAT", "rate": 20, "type": "vat"}'::jsonb,
    '{"name": "Reduced Rate", "rate": 5, "type": "vat"}'::jsonb
  ],
  invoice_settings jsonb NOT NULL DEFAULT '{
    "prefix": "INV",
    "footer_text": "Thank you for your business",
    "terms_conditions": "Standard terms and conditions apply",
    "due_days": 30
  }'::jsonb,
  default_currency text NOT NULL DEFAULT 'USD',
  auto_payment_reminders boolean NOT NULL DEFAULT true,
  reminder_days integer[] NOT NULL DEFAULT ARRAY[7, 3, 1]
);

-- Enable Row Level Security
ALTER TABLE billing_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for billing_settings
CREATE POLICY "Hospital staff can view billing settings"
  ON billing_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = billing_settings.hospital_id
    )
  );

CREATE POLICY "Hospital admins can manage billing settings"
  ON billing_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.hospital_id = billing_settings.hospital_id
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_billing_settings_updated_at
  BEFORE UPDATE ON billing_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default billing settings for each hospital
INSERT INTO billing_settings (
  hospital_id
)
SELECT 
  id as hospital_id
FROM hospitals
ON CONFLICT (hospital_id) DO NOTHING;