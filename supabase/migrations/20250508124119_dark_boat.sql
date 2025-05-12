/*
  # Add Pharmacy and Billing Tables

  1. New Tables
    - `pharmacy`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `patient_id` (uuid, references patients)
      - `hospital_id` (uuid, references hospitals)
      - `prescription_id` (uuid, nullable)
      - `medications` (jsonb array)
      - `status` (text)
      - `dispensed_by` (uuid, references profiles)
      - `dispensed_at` (timestamp)
      - `payment_status` (text)
      - `is_emergency` (boolean)

    - `billing`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `patient_id` (uuid, references patients)
      - `hospital_id` (uuid, references hospitals)
      - `consultation_id` (uuid, nullable)
      - `services` (jsonb array)
      - `total_amount` (numeric)
      - `paid_amount` (numeric)
      - `payment_status` (text)
      - `insurance_info` (jsonb)
      - `payment_date` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for hospital staff access
*/

-- Create pharmacy table
CREATE TABLE IF NOT EXISTS pharmacy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES patients,
  hospital_id uuid NOT NULL REFERENCES hospitals,
  prescription_id uuid,
  medications jsonb[] NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  dispensed_by uuid REFERENCES profiles,
  dispensed_at timestamptz,
  payment_status text NOT NULL DEFAULT 'pending',
  is_emergency boolean DEFAULT false,
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'ready', 'dispensed', 'cancelled')),
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'paid', 'insured', 'waived'))
);

-- Create billing table
CREATE TABLE IF NOT EXISTS billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES patients,
  hospital_id uuid NOT NULL REFERENCES hospitals,
  consultation_id uuid,
  services jsonb[] NOT NULL,
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  paid_amount numeric NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  payment_status text NOT NULL DEFAULT 'pending',
  insurance_info jsonb,
  payment_date timestamptz,
  
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'partial', 'paid', 'insured', 'waived')),
  CONSTRAINT valid_payment CHECK (paid_amount <= total_amount)
);

-- Enable Row Level Security
ALTER TABLE pharmacy ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;

-- Create policies for pharmacy
CREATE POLICY "Hospital staff can access pharmacy orders"
  ON pharmacy
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = pharmacy.hospital_id
    )
  );

-- Create policies for billing
CREATE POLICY "Hospital staff can access billing"
  ON billing
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = billing.hospital_id
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS pharmacy_patient_id_idx ON pharmacy (patient_id);
CREATE INDEX IF NOT EXISTS pharmacy_hospital_id_idx ON pharmacy (hospital_id);
CREATE INDEX IF NOT EXISTS pharmacy_status_idx ON pharmacy (status);
CREATE INDEX IF NOT EXISTS pharmacy_payment_status_idx ON pharmacy (payment_status);

CREATE INDEX IF NOT EXISTS billing_patient_id_idx ON billing (patient_id);
CREATE INDEX IF NOT EXISTS billing_hospital_id_idx ON billing (hospital_id);
CREATE INDEX IF NOT EXISTS billing_payment_status_idx ON billing (payment_status);