/*
  # Create care plans and referrals tables

  1. New Tables
    - `care_plans` - Patient care plans
    - `referrals` - Patient referrals
    
  2. Security
    - Enable RLS on all tables
    - Add policies for hospital staff access
*/

-- Create care_plans table
CREATE TABLE IF NOT EXISTS care_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date,
  status text NOT NULL DEFAULT 'active',
  goals jsonb[] NOT NULL DEFAULT ARRAY[]::jsonb[],
  created_by uuid REFERENCES profiles(id),
  
  CONSTRAINT valid_status CHECK (status IN ('draft', 'active', 'completed', 'discontinued')),
  CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  referring_doctor_id uuid REFERENCES profiles(id),
  specialist_id uuid REFERENCES profiles(id),
  referral_date date NOT NULL DEFAULT CURRENT_DATE,
  reason text NOT NULL,
  urgency text NOT NULL DEFAULT 'routine',
  status text NOT NULL DEFAULT 'pending',
  notes text,
  appointment_date date,
  
  CONSTRAINT valid_urgency CHECK (urgency IN ('routine', 'urgent', 'emergency')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled', 'no_show'))
);

-- Enable Row Level Security
ALTER TABLE care_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Create policies for care_plans
CREATE POLICY "Hospital staff can access care plans"
  ON care_plans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = care_plans.hospital_id
    )
  );

-- Create policies for referrals
CREATE POLICY "Hospital staff can access referrals"
  ON referrals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = referrals.hospital_id
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS care_plans_patient_id_idx ON care_plans (patient_id);
CREATE INDEX IF NOT EXISTS care_plans_hospital_id_idx ON care_plans (hospital_id);
CREATE INDEX IF NOT EXISTS care_plans_status_idx ON care_plans (status);

CREATE INDEX IF NOT EXISTS referrals_patient_id_idx ON referrals (patient_id);
CREATE INDEX IF NOT EXISTS referrals_hospital_id_idx ON referrals (hospital_id);
CREATE INDEX IF NOT EXISTS referrals_referring_doctor_id_idx ON referrals (referring_doctor_id);
CREATE INDEX IF NOT EXISTS referrals_specialist_id_idx ON referrals (specialist_id);
CREATE INDEX IF NOT EXISTS referrals_status_idx ON referrals (status);
CREATE INDEX IF NOT EXISTS referrals_urgency_idx ON referrals (urgency);