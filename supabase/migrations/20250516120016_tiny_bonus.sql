/*
  # Remove Multi-Tenancy

  1. Schema Changes
    - Remove hospital_id foreign key constraints
    - Remove hospital_id columns from all tables
    - Drop hospital-related tables
    - Update RLS policies to remove hospital-based restrictions

  2. Data Migration
    - No data migration needed as we're simplifying the schema
    - All existing data will be preserved but hospital associations will be removed

  3. Security
    - Update RLS policies to work without hospital-based restrictions
    - Simplify role-based access control
*/

-- First, disable RLS temporarily to make schema changes easier
ALTER TABLE IF EXISTS patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS consultations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS triage DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pharmacy DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lab_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS radiology_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vital_signs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS billing DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS allergies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS medical_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS care_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS referrals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inpatients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical_protocols DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS report_executions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS report_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS report_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS billing_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS support_tickets DISABLE ROW LEVEL SECURITY;

-- Drop foreign key constraints related to hospital_id
DO $$
BEGIN
  -- Drop foreign keys from patients
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'patients_hospital_id_fkey') THEN
    ALTER TABLE patients DROP CONSTRAINT patients_hospital_id_fkey;
  END IF;

  -- Drop foreign keys from departments
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'departments_hospital_id_fkey') THEN
    ALTER TABLE departments DROP CONSTRAINT departments_hospital_id_fkey;
  END IF;

  -- Drop foreign keys from profiles
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_hospital_id_fkey') THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_hospital_id_fkey;
  END IF;

  -- Drop foreign keys from appointments
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_hospital_id_fkey') THEN
    ALTER TABLE appointments DROP CONSTRAINT appointments_hospital_id_fkey;
  END IF;

  -- Drop foreign keys from consultations
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consultations_hospital_id_fkey') THEN
    ALTER TABLE consultations DROP CONSTRAINT consultations_hospital_id_fkey;
  END IF;

  -- Drop foreign keys from triage
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'triage_hospital_id_fkey') THEN
    ALTER TABLE triage DROP CONSTRAINT triage_hospital_id_fkey;
  END IF;

  -- Drop foreign keys from pharmacy
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pharmacy_hospital_id_fkey') THEN
    ALTER TABLE pharmacy DROP CONSTRAINT pharmacy_hospital_id_fkey;
  END IF;

  -- Drop foreign keys from lab_results
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lab_results_hospital_id_fkey') THEN
    ALTER TABLE lab_results DROP CONSTRAINT lab_results_hospital_id_fkey;
  END IF;

  -- Drop foreign keys from radiology_results
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'radiology_results_hospital_id_fkey') THEN
    ALTER TABLE radiology_results DROP CONSTRAINT radiology_results_hospital_id_fkey;
  END IF;

  -- Drop foreign keys from vital_signs
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vital_signs_hospital_id_fkey') THEN
    ALTER TABLE vital_signs DROP CONSTRAINT vital_signs_hospital_id_fkey;
  END IF;

  -- Drop foreign keys from billing
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'billing_hospital_id_fkey') THEN
    ALTER TABLE billing DROP CONSTRAINT billing_hospital_id_fkey;
  END IF;

  -- Drop foreign keys from documents
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_hospital_id_fkey') THEN
    ALTER TABLE documents DROP CONSTRAINT documents_hospital_id_fkey;
  END IF;

  -- Drop foreign keys from allergies
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'allergies_hospital_id_fkey') THEN
    ALTER TABLE allergies DROP CONSTRAINT allergies_hospital_id_fkey;
  END IF;

  -- Drop foreign keys from medical_history
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'medical_history_hospital_id_fkey') THEN
    ALTER TABLE medical_history DROP CONSTRAINT medical_history_hospital_id_fkey;
  END IF;

  -- Drop foreign keys from care_plans
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'care_plans_hospital_id_fkey') THEN
    ALTER TABLE care_plans DROP CONSTRAINT care_plans_hospital_id_fkey;
  END IF;

  -- Drop foreign keys from referrals
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'referrals_hospital_id_fkey') THEN
    ALTER TABLE referrals DROP CONSTRAINT referrals_hospital_id_fkey;
  END IF;

  -- Drop foreign keys from inpatients
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inpatients_hospital_id_fkey') THEN
    ALTER TABLE inpatients DROP CONSTRAINT inpatients_hospital_id_fkey;
  END IF;

  -- Drop foreign keys from clinical_settings
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clinical_settings_hospital_id_fkey') THEN
    ALTER TABLE clinical_settings DROP CONSTRAINT clinical_settings_hospital_id_fkey;
  END IF;

  -- Drop foreign keys from clinical_protocols
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clinical_protocols_hospital_id_fkey') THEN
    ALTER TABLE clinical_protocols DROP CONSTRAINT clinical_protocols_hospital_id_fkey;
  END IF;

  -- Drop foreign keys from reports
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reports_hospital_id_fkey') THEN
    ALTER TABLE reports DROP CONSTRAINT reports_hospital_id_fkey;
  END IF;

  -- Drop foreign keys from report_executions
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'report_executions_hospital_id_fkey') THEN
    ALTER TABLE report_executions DROP CONSTRAINT report_executions_hospital_id_fkey;
  END IF;

  -- Drop foreign keys from report_schedules
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'report_schedules_hospital_id_fkey') THEN
    ALTER TABLE report_schedules DROP CONSTRAINT report_schedules_hospital_id_fkey;
  END IF;

  -- Drop foreign keys from report_subscriptions
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'report_subscriptions_hospital_id_fkey') THEN
    ALTER TABLE report_subscriptions DROP CONSTRAINT report_subscriptions_hospital_id_fkey;
  END IF;

  -- Drop foreign keys from billing_settings
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'billing_settings_hospital_id_fkey') THEN
    ALTER TABLE billing_settings DROP CONSTRAINT billing_settings_hospital_id_fkey;
  END IF;

  -- Drop foreign keys from support_tickets
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'support_tickets_hospital_id_fkey') THEN
    ALTER TABLE support_tickets DROP CONSTRAINT support_tickets_hospital_id_fkey;
  END IF;
END $$;

-- Drop hospital_id columns from all tables
DO $$
BEGIN
  -- Drop hospital_id from patients
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'hospital_id') THEN
    ALTER TABLE patients DROP COLUMN hospital_id;
  END IF;

  -- Drop hospital_id from departments
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'departments' AND column_name = 'hospital_id') THEN
    ALTER TABLE departments DROP COLUMN hospital_id;
  END IF;

  -- Drop hospital_id from profiles
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'hospital_id') THEN
    ALTER TABLE profiles DROP COLUMN hospital_id;
  END IF;

  -- Drop hospital_id from appointments
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'hospital_id') THEN
    ALTER TABLE appointments DROP COLUMN hospital_id;
  END IF;

  -- Drop hospital_id from consultations
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultations' AND column_name = 'hospital_id') THEN
    ALTER TABLE consultations DROP COLUMN hospital_id;
  END IF;

  -- Drop hospital_id from triage
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'triage' AND column_name = 'hospital_id') THEN
    ALTER TABLE triage DROP COLUMN hospital_id;
  END IF;

  -- Drop hospital_id from pharmacy
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy' AND column_name = 'hospital_id') THEN
    ALTER TABLE pharmacy DROP COLUMN hospital_id;
  END IF;

  -- Drop hospital_id from lab_results
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lab_results' AND column_name = 'hospital_id') THEN
    ALTER TABLE lab_results DROP COLUMN hospital_id;
  END IF;

  -- Drop hospital_id from radiology_results
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radiology_results' AND column_name = 'hospital_id') THEN
    ALTER TABLE radiology_results DROP COLUMN hospital_id;
  END IF;

  -- Drop hospital_id from vital_signs
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vital_signs' AND column_name = 'hospital_id') THEN
    ALTER TABLE vital_signs DROP COLUMN hospital_id;
  END IF;

  -- Drop hospital_id from billing
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'billing' AND column_name = 'hospital_id') THEN
    ALTER TABLE billing DROP COLUMN hospital_id;
  END IF;

  -- Drop hospital_id from documents
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'hospital_id') THEN
    ALTER TABLE documents DROP COLUMN hospital_id;
  END IF;

  -- Drop hospital_id from allergies
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'allergies' AND column_name = 'hospital_id') THEN
    ALTER TABLE allergies DROP COLUMN hospital_id;
  END IF;

  -- Drop hospital_id from medical_history
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_history' AND column_name = 'hospital_id') THEN
    ALTER TABLE medical_history DROP COLUMN hospital_id;
  END IF;

  -- Drop hospital_id from care_plans
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'care_plans' AND column_name = 'hospital_id') THEN
    ALTER TABLE care_plans DROP COLUMN hospital_id;
  END IF;

  -- Drop hospital_id from referrals
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'hospital_id') THEN
    ALTER TABLE referrals DROP COLUMN hospital_id;
  END IF;

  -- Drop hospital_id from inpatients
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inpatients' AND column_name = 'hospital_id') THEN
    ALTER TABLE inpatients DROP COLUMN hospital_id;
  END IF;

  -- Drop hospital_id from clinical_settings
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinical_settings' AND column_name = 'hospital_id') THEN
    ALTER TABLE clinical_settings DROP COLUMN hospital_id;
  END IF;

  -- Drop hospital_id from clinical_protocols
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinical_protocols' AND column_name = 'hospital_id') THEN
    ALTER TABLE clinical_protocols DROP COLUMN hospital_id;
  END IF;

  -- Drop hospital_id from reports
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'hospital_id') THEN
    ALTER TABLE reports DROP COLUMN hospital_id;
  END IF;

  -- Drop hospital_id from report_executions
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_executions' AND column_name = 'hospital_id') THEN
    ALTER TABLE report_executions DROP COLUMN hospital_id;
  END IF;

  -- Drop hospital_id from report_schedules
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_schedules' AND column_name = 'hospital_id') THEN
    ALTER TABLE report_schedules DROP COLUMN hospital_id;
  END IF;

  -- Drop hospital_id from report_subscriptions
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_subscriptions' AND column_name = 'hospital_id') THEN
    ALTER TABLE report_subscriptions DROP COLUMN hospital_id;
  END IF;

  -- Drop hospital_id from support_tickets
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'hospital_id') THEN
    ALTER TABLE support_tickets DROP COLUMN hospital_id;
  END IF;
END $$;

-- Drop hospital-related tables
DROP TABLE IF EXISTS hospital_modules CASCADE;
DROP TABLE IF EXISTS hospital_users CASCADE;
DROP TABLE IF EXISTS licenses CASCADE;
DROP TABLE IF EXISTS license_history CASCADE;
DROP TABLE IF EXISTS pricing_plans CASCADE;
DROP TABLE IF EXISTS billing_settings CASCADE;
DROP TABLE IF EXISTS hospitals CASCADE;

-- Update RLS policies to work without hospital-based restrictions
-- Patients table
CREATE POLICY "Authenticated users can access patients" 
  ON patients FOR ALL 
  TO authenticated 
  USING (true);

-- Departments table
CREATE POLICY "Authenticated users can access departments" 
  ON departments FOR ALL 
  TO authenticated 
  USING (true);

-- Profiles table
CREATE POLICY "Users can read profiles" 
  ON profiles FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  TO authenticated 
  USING (id = auth.uid()) 
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can manage all profiles" 
  ON profiles FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Appointments table
CREATE POLICY "Authenticated users can access appointments" 
  ON appointments FOR ALL 
  TO authenticated 
  USING (true);

-- Consultations table
CREATE POLICY "Authenticated users can access consultations" 
  ON consultations FOR ALL 
  TO authenticated 
  USING (true);

-- Triage table
CREATE POLICY "Authenticated users can access triage" 
  ON triage FOR ALL 
  TO authenticated 
  USING (true);

-- Pharmacy table
CREATE POLICY "Authenticated users can access pharmacy" 
  ON pharmacy FOR ALL 
  TO authenticated 
  USING (true);

-- Lab results table
CREATE POLICY "Authenticated users can access lab results" 
  ON lab_results FOR ALL 
  TO authenticated 
  USING (true);

-- Radiology results table
CREATE POLICY "Authenticated users can access radiology results" 
  ON radiology_results FOR ALL 
  TO authenticated 
  USING (true);

-- Vital signs table
CREATE POLICY "Authenticated users can access vital signs" 
  ON vital_signs FOR ALL 
  TO authenticated 
  USING (true);

-- Billing table
CREATE POLICY "Authenticated users can access billing" 
  ON billing FOR ALL 
  TO authenticated 
  USING (true);

-- Documents table
CREATE POLICY "Authenticated users can access documents" 
  ON documents FOR ALL 
  TO authenticated 
  USING (true);

-- Allergies table
CREATE POLICY "Authenticated users can access allergies" 
  ON allergies FOR ALL 
  TO authenticated 
  USING (true);

-- Medical history table
CREATE POLICY "Authenticated users can access medical history" 
  ON medical_history FOR ALL 
  TO authenticated 
  USING (true);

-- Care plans table
CREATE POLICY "Authenticated users can access care plans" 
  ON care_plans FOR ALL 
  TO authenticated 
  USING (true);

-- Referrals table
CREATE POLICY "Authenticated users can access referrals" 
  ON referrals FOR ALL 
  TO authenticated 
  USING (true);

-- Inpatients table
CREATE POLICY "Authenticated users can access inpatients" 
  ON inpatients FOR ALL 
  TO authenticated 
  USING (true);

-- Clinical settings table
CREATE POLICY "Authenticated users can access clinical settings" 
  ON clinical_settings FOR ALL 
  TO authenticated 
  USING (true);

-- Clinical protocols table
CREATE POLICY "Authenticated users can access clinical protocols" 
  ON clinical_protocols FOR ALL 
  TO authenticated 
  USING (true);

-- Reports table
CREATE POLICY "Authenticated users can access reports" 
  ON reports FOR ALL 
  TO authenticated 
  USING (true);

-- Report executions table
CREATE POLICY "Authenticated users can access report executions" 
  ON report_executions FOR ALL 
  TO authenticated 
  USING (true);

-- Report schedules table
CREATE POLICY "Authenticated users can access report schedules" 
  ON report_schedules FOR ALL 
  TO authenticated 
  USING (true);

-- Report subscriptions table
CREATE POLICY "Authenticated users can access report subscriptions" 
  ON report_subscriptions FOR ALL 
  TO authenticated 
  USING (true);

-- Support tickets table
CREATE POLICY "Authenticated users can access support tickets" 
  ON support_tickets FOR ALL 
  TO authenticated 
  USING (true);

-- Re-enable RLS
ALTER TABLE IF EXISTS patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS triage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pharmacy ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS radiology_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS care_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inpatients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS report_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS report_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS support_tickets ENABLE ROW LEVEL SECURITY;

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if a user is a doctor
CREATE OR REPLACE FUNCTION is_doctor()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'doctor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if a user is a nurse
CREATE OR REPLACE FUNCTION is_nurse()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'nurse'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if a user is a receptionist
CREATE OR REPLACE FUNCTION is_receptionist()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'receptionist'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;