/*
  # Add Comprehensive Medical Records

  1. New Tables
    - `immunizations` - Track patient vaccination records
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references patients)
      - `hospital_id` (uuid, references hospitals)
      - `vaccine_name` (text)
      - `vaccine_type` (text)
      - `dose_number` (integer)
      - `administration_date` (date)
      - `administered_by` (uuid, references profiles)
      - `lot_number` (text)
      - `expiration_date` (date)
      - `manufacturer` (text)
      - `site` (text) - Body site where vaccine was administered
      - `route` (text) - Administration route
      - `notes` (text)
      - `next_dose_due` (date)
      - `is_completed` (boolean)
    
    - `allergies` - Track patient allergies
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references patients)
      - `hospital_id` (uuid, references hospitals)
      - `allergen` (text)
      - `allergen_type` (text)
      - `reaction` (text)
      - `severity` (text)
      - `onset_date` (date)
      - `diagnosed_by` (uuid, references profiles)
      - `status` (text)
      - `notes` (text)
    
    - `vital_signs` - Track patient vital signs history
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references patients)
      - `hospital_id` (uuid, references hospitals)
      - `recorded_at` (timestamp)
      - `recorded_by` (uuid, references profiles)
      - `temperature` (numeric)
      - `heart_rate` (integer)
      - `respiratory_rate` (integer)
      - `blood_pressure_systolic` (integer)
      - `blood_pressure_diastolic` (integer)
      - `oxygen_saturation` (integer)
      - `weight` (numeric)
      - `height` (numeric)
      - `bmi` (numeric)
      - `pain_level` (integer)
      - `notes` (text)
    
    - `medical_history` - Track patient medical history
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references patients)
      - `hospital_id` (uuid, references hospitals)
      - `condition` (text)
      - `condition_type` (text)
      - `diagnosis_date` (date)
      - `diagnosed_by` (uuid, references profiles)
      - `status` (text)
      - `treatment` (text)
      - `notes` (text)
    
    - `documents` - Store medical documents
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references patients)
      - `hospital_id` (uuid, references hospitals)
      - `document_type` (text)
      - `title` (text)
      - `file_url` (text)
      - `uploaded_at` (timestamp)
      - `uploaded_by` (uuid, references profiles)
      - `description` (text)
      - `tags` (text[])
    
    - `care_plans` - Track patient care plans
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references patients)
      - `hospital_id` (uuid, references hospitals)
      - `created_at` (timestamp)
      - `created_by` (uuid, references profiles)
      - `title` (text)
      - `description` (text)
      - `goals` (jsonb[])
      - `interventions` (jsonb[])
      - `start_date` (date)
      - `end_date` (date)
      - `status` (text)
      - `progress_notes` (jsonb[])
    
    - `referrals` - Track patient referrals
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references patients)
      - `hospital_id` (uuid, references hospitals)
      - `referring_doctor_id` (uuid, references profiles)
      - `specialist_id` (uuid, references profiles)
      - `referral_date` (date)
      - `reason` (text)
      - `urgency` (text)
      - `status` (text)
      - `appointment_date` (date)
      - `notes` (text)
      - `feedback` (text)

  2. Updates to Existing Tables
    - Add `pharmacy_status` and `pharmacy_id` to consultations table
    - Add `department_id` to consultations table

  3. Security
    - Enable RLS on all tables
    - Add policies for hospital staff access
*/

-- Add columns to consultations table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultations' 
    AND column_name = 'pharmacy_status'
  ) THEN
    ALTER TABLE consultations 
    ADD COLUMN pharmacy_status TEXT DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultations' 
    AND column_name = 'pharmacy_id'
  ) THEN
    ALTER TABLE consultations 
    ADD COLUMN pharmacy_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultations' 
    AND column_name = 'department_id'
  ) THEN
    ALTER TABLE consultations 
    ADD COLUMN department_id UUID REFERENCES departments(id);
  END IF;
END $$;

-- Create immunizations table
CREATE TABLE IF NOT EXISTS immunizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  vaccine_name text NOT NULL,
  vaccine_type text NOT NULL,
  dose_number integer NOT NULL,
  administration_date date NOT NULL,
  administered_by uuid REFERENCES profiles(id),
  lot_number text,
  expiration_date date,
  manufacturer text,
  site text,
  route text,
  notes text,
  next_dose_due date,
  is_completed boolean DEFAULT false,
  
  CONSTRAINT valid_vaccine_type CHECK (vaccine_type IN (
    'live_attenuated', 'inactivated', 'subunit', 'toxoid', 'viral_vector', 'mrna', 'other'
  )),
  CONSTRAINT valid_route CHECK (route IN (
    'intramuscular', 'subcutaneous', 'intradermal', 'oral', 'nasal', 'other'
  )),
  CONSTRAINT valid_site CHECK (site IN (
    'left_arm', 'right_arm', 'left_thigh', 'right_thigh', 'buttock', 'oral', 'nasal', 'other'
  ))
);

-- Create allergies table
CREATE TABLE IF NOT EXISTS allergies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  allergen text NOT NULL,
  allergen_type text NOT NULL,
  reaction text NOT NULL,
  severity text NOT NULL,
  onset_date date,
  diagnosed_by uuid REFERENCES profiles(id),
  status text NOT NULL DEFAULT 'active',
  notes text,
  
  CONSTRAINT valid_allergen_type CHECK (allergen_type IN (
    'medication', 'food', 'environmental', 'insect', 'other'
  )),
  CONSTRAINT valid_severity CHECK (severity IN (
    'mild', 'moderate', 'severe', 'life_threatening'
  )),
  CONSTRAINT valid_status CHECK (status IN (
    'active', 'inactive', 'resolved'
  ))
);

-- Create vital_signs table
CREATE TABLE IF NOT EXISTS vital_signs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  recorded_by uuid REFERENCES profiles(id),
  temperature numeric,
  heart_rate integer,
  respiratory_rate integer,
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  oxygen_saturation integer,
  weight numeric,
  height numeric,
  bmi numeric,
  pain_level integer,
  notes text,
  
  CONSTRAINT valid_temperature CHECK (temperature BETWEEN 30 AND 45),
  CONSTRAINT valid_heart_rate CHECK (heart_rate BETWEEN 30 AND 250),
  CONSTRAINT valid_respiratory_rate CHECK (respiratory_rate BETWEEN 5 AND 60),
  CONSTRAINT valid_blood_pressure_systolic CHECK (blood_pressure_systolic BETWEEN 50 AND 250),
  CONSTRAINT valid_blood_pressure_diastolic CHECK (blood_pressure_diastolic BETWEEN 30 AND 150),
  CONSTRAINT valid_oxygen_saturation CHECK (oxygen_saturation BETWEEN 50 AND 100),
  CONSTRAINT valid_pain_level CHECK (pain_level BETWEEN 0 AND 10)
);

-- Create medical_history table
CREATE TABLE IF NOT EXISTS medical_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  condition text NOT NULL,
  condition_type text NOT NULL,
  diagnosis_date date,
  diagnosed_by uuid REFERENCES profiles(id),
  status text NOT NULL DEFAULT 'active',
  treatment text,
  notes text,
  
  CONSTRAINT valid_condition_type CHECK (condition_type IN (
    'chronic', 'acute', 'surgical', 'injury', 'congenital', 'infectious', 'mental_health', 'other'
  )),
  CONSTRAINT valid_status CHECK (status IN (
    'active', 'resolved', 'in_remission', 'recurrent', 'inactive'
  ))
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  document_type text NOT NULL,
  title text NOT NULL,
  file_url text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  uploaded_by uuid REFERENCES profiles(id),
  description text,
  tags text[],
  
  CONSTRAINT valid_document_type CHECK (document_type IN (
    'lab_result', 'radiology_image', 'referral_letter', 'discharge_summary', 'consent_form', 
    'prescription', 'medical_certificate', 'insurance_document', 'other'
  ))
);

-- Create care_plans table
CREATE TABLE IF NOT EXISTS care_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  created_by uuid REFERENCES profiles(id),
  title text NOT NULL,
  description text,
  goals jsonb[],
  interventions jsonb[],
  start_date date NOT NULL,
  end_date date,
  status text NOT NULL DEFAULT 'active',
  progress_notes jsonb[],
  
  CONSTRAINT valid_status CHECK (status IN (
    'draft', 'active', 'completed', 'discontinued'
  )),
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
  urgency text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  appointment_date date,
  notes text,
  feedback text,
  
  CONSTRAINT valid_urgency CHECK (urgency IN (
    'routine', 'urgent', 'emergency'
  )),
  CONSTRAINT valid_status CHECK (status IN (
    'pending', 'scheduled', 'completed', 'cancelled', 'no_show'
  ))
);

-- Enable RLS on all tables
ALTER TABLE immunizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Create policies for hospital staff access
CREATE POLICY "Hospital staff can access immunizations"
  ON immunizations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = immunizations.hospital_id
    )
  );

CREATE POLICY "Hospital staff can access allergies"
  ON allergies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = allergies.hospital_id
    )
  );

CREATE POLICY "Hospital staff can access vital signs"
  ON vital_signs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = vital_signs.hospital_id
    )
  );

CREATE POLICY "Hospital staff can access medical history"
  ON medical_history
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = medical_history.hospital_id
    )
  );

CREATE POLICY "Hospital staff can access documents"
  ON documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = documents.hospital_id
    )
  );

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
CREATE INDEX IF NOT EXISTS immunizations_patient_id_idx ON immunizations (patient_id);
CREATE INDEX IF NOT EXISTS immunizations_hospital_id_idx ON immunizations (hospital_id);
CREATE INDEX IF NOT EXISTS immunizations_administration_date_idx ON immunizations (administration_date);

CREATE INDEX IF NOT EXISTS allergies_patient_id_idx ON allergies (patient_id);
CREATE INDEX IF NOT EXISTS allergies_hospital_id_idx ON allergies (hospital_id);
CREATE INDEX IF NOT EXISTS allergies_allergen_idx ON allergies (allergen);

CREATE INDEX IF NOT EXISTS vital_signs_patient_id_idx ON vital_signs (patient_id);
CREATE INDEX IF NOT EXISTS vital_signs_hospital_id_idx ON vital_signs (hospital_id);
CREATE INDEX IF NOT EXISTS vital_signs_recorded_at_idx ON vital_signs (recorded_at);

CREATE INDEX IF NOT EXISTS medical_history_patient_id_idx ON medical_history (patient_id);
CREATE INDEX IF NOT EXISTS medical_history_hospital_id_idx ON medical_history (hospital_id);
CREATE INDEX IF NOT EXISTS medical_history_condition_idx ON medical_history (condition);

CREATE INDEX IF NOT EXISTS documents_patient_id_idx ON documents (patient_id);
CREATE INDEX IF NOT EXISTS documents_hospital_id_idx ON documents (hospital_id);
CREATE INDEX IF NOT EXISTS documents_document_type_idx ON documents (document_type);

CREATE INDEX IF NOT EXISTS care_plans_patient_id_idx ON care_plans (patient_id);
CREATE INDEX IF NOT EXISTS care_plans_hospital_id_idx ON care_plans (hospital_id);
CREATE INDEX IF NOT EXISTS care_plans_status_idx ON care_plans (status);

CREATE INDEX IF NOT EXISTS referrals_patient_id_idx ON referrals (patient_id);
CREATE INDEX IF NOT EXISTS referrals_hospital_id_idx ON referrals (hospital_id);
CREATE INDEX IF NOT EXISTS referrals_status_idx ON referrals (status);
CREATE INDEX IF NOT EXISTS referrals_urgency_idx ON referrals (urgency);