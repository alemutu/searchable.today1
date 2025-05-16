/*
  # Remove Multi-Tenancy

  1. Changes
     - Remove hospital_id foreign key constraints
     - Remove hospital_id columns from all tables
     - Drop hospital-related tables
     - Update RLS policies to work without hospital-based restrictions
     - Add helper functions for role-based access control
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
ALTER TABLE IF EXISTS support_tickets DISABLE ROW LEVEL SECURITY;

-- Drop foreign key constraints related to hospital_id (batch 1)
ALTER TABLE IF EXISTS patients DROP CONSTRAINT IF EXISTS patients_hospital_id_fkey;
ALTER TABLE IF EXISTS departments DROP CONSTRAINT IF EXISTS departments_hospital_id_fkey;
ALTER TABLE IF EXISTS profiles DROP CONSTRAINT IF EXISTS profiles_hospital_id_fkey;
ALTER TABLE IF EXISTS appointments DROP CONSTRAINT IF EXISTS appointments_hospital_id_fkey;
ALTER TABLE IF EXISTS consultations DROP CONSTRAINT IF EXISTS consultations_hospital_id_fkey;
ALTER TABLE IF EXISTS triage DROP CONSTRAINT IF EXISTS triage_hospital_id_fkey;
ALTER TABLE IF EXISTS pharmacy DROP CONSTRAINT IF EXISTS pharmacy_hospital_id_fkey;
ALTER TABLE IF EXISTS lab_results DROP CONSTRAINT IF EXISTS lab_results_hospital_id_fkey;

-- Drop foreign key constraints related to hospital_id (batch 2)
ALTER TABLE IF EXISTS radiology_results DROP CONSTRAINT IF EXISTS radiology_results_hospital_id_fkey;
ALTER TABLE IF EXISTS vital_signs DROP CONSTRAINT IF EXISTS vital_signs_hospital_id_fkey;
ALTER TABLE IF EXISTS billing DROP CONSTRAINT IF EXISTS billing_hospital_id_fkey;
ALTER TABLE IF EXISTS documents DROP CONSTRAINT IF EXISTS documents_hospital_id_fkey;
ALTER TABLE IF EXISTS allergies DROP CONSTRAINT IF EXISTS allergies_hospital_id_fkey;
ALTER TABLE IF EXISTS medical_history DROP CONSTRAINT IF EXISTS medical_history_hospital_id_fkey;
ALTER TABLE IF EXISTS care_plans DROP CONSTRAINT IF EXISTS care_plans_hospital_id_fkey;
ALTER TABLE IF EXISTS referrals DROP CONSTRAINT IF EXISTS referrals_hospital_id_fkey;

-- Drop foreign key constraints related to hospital_id (batch 3)
ALTER TABLE IF EXISTS inpatients DROP CONSTRAINT IF EXISTS inpatients_hospital_id_fkey;
ALTER TABLE IF EXISTS clinical_settings DROP CONSTRAINT IF EXISTS clinical_settings_hospital_id_fkey;
ALTER TABLE IF EXISTS clinical_protocols DROP CONSTRAINT IF EXISTS clinical_protocols_hospital_id_fkey;
ALTER TABLE IF EXISTS reports DROP CONSTRAINT IF EXISTS reports_hospital_id_fkey;
ALTER TABLE IF EXISTS report_executions DROP CONSTRAINT IF EXISTS report_executions_hospital_id_fkey;
ALTER TABLE IF EXISTS report_schedules DROP CONSTRAINT IF EXISTS report_schedules_hospital_id_fkey;
ALTER TABLE IF EXISTS report_subscriptions DROP CONSTRAINT IF EXISTS report_subscriptions_hospital_id_fkey;
ALTER TABLE IF EXISTS support_tickets DROP CONSTRAINT IF EXISTS support_tickets_hospital_id_fkey;

-- Drop hospital_id columns from tables (batch 1)
ALTER TABLE IF EXISTS patients DROP COLUMN IF EXISTS hospital_id;
ALTER TABLE IF EXISTS departments DROP COLUMN IF EXISTS hospital_id;
ALTER TABLE IF EXISTS profiles DROP COLUMN IF EXISTS hospital_id;
ALTER TABLE IF EXISTS appointments DROP COLUMN IF EXISTS hospital_id;
ALTER TABLE IF EXISTS consultations DROP COLUMN IF EXISTS hospital_id;
ALTER TABLE IF EXISTS triage DROP COLUMN IF EXISTS hospital_id;
ALTER TABLE IF EXISTS pharmacy DROP COLUMN IF EXISTS hospital_id;
ALTER TABLE IF EXISTS lab_results DROP COLUMN IF EXISTS hospital_id;

-- Drop hospital_id columns from tables (batch 2)
ALTER TABLE IF EXISTS radiology_results DROP COLUMN IF EXISTS hospital_id;
ALTER TABLE IF EXISTS vital_signs DROP COLUMN IF EXISTS hospital_id;
ALTER TABLE IF EXISTS billing DROP COLUMN IF EXISTS hospital_id;
ALTER TABLE IF EXISTS documents DROP COLUMN IF EXISTS hospital_id;
ALTER TABLE IF EXISTS allergies DROP COLUMN IF EXISTS hospital_id;
ALTER TABLE IF EXISTS medical_history DROP COLUMN IF EXISTS hospital_id;
ALTER TABLE IF EXISTS care_plans DROP COLUMN IF EXISTS hospital_id;
ALTER TABLE IF EXISTS referrals DROP COLUMN IF EXISTS hospital_id;

-- Drop hospital_id columns from tables (batch 3)
ALTER TABLE IF EXISTS inpatients DROP COLUMN IF EXISTS hospital_id;
ALTER TABLE IF EXISTS clinical_settings DROP COLUMN IF EXISTS hospital_id;
ALTER TABLE IF EXISTS clinical_protocols DROP COLUMN IF EXISTS hospital_id;
ALTER TABLE IF EXISTS reports DROP COLUMN IF EXISTS hospital_id;
ALTER TABLE IF EXISTS report_executions DROP COLUMN IF EXISTS hospital_id;
ALTER TABLE IF EXISTS report_schedules DROP COLUMN IF EXISTS hospital_id;
ALTER TABLE IF EXISTS report_subscriptions DROP COLUMN IF EXISTS hospital_id;
ALTER TABLE IF EXISTS support_tickets DROP COLUMN IF EXISTS hospital_id;

-- Drop hospital-related tables
DROP TABLE IF EXISTS hospital_modules CASCADE;
DROP TABLE IF EXISTS hospital_users CASCADE;
DROP TABLE IF EXISTS licenses CASCADE;
DROP TABLE IF EXISTS license_history CASCADE;
DROP TABLE IF EXISTS pricing_plans CASCADE;
DROP TABLE IF EXISTS billing_settings CASCADE;
DROP TABLE IF EXISTS hospitals CASCADE;

-- Create helper functions for role-based access control
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_doctor()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'doctor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_nurse()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'nurse'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_receptionist()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'receptionist'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies (batch 1)
DROP POLICY IF EXISTS "Authenticated users can access patients" ON patients;
CREATE POLICY "Authenticated users can access patients" 
  ON patients FOR ALL 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can access departments" ON departments;
CREATE POLICY "Authenticated users can access departments" 
  ON departments FOR ALL 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Users can read profiles" ON profiles;
CREATE POLICY "Users can read profiles" 
  ON profiles FOR SELECT 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  TO authenticated 
  USING (id = auth.uid()) 
  WITH CHECK (id = auth.uid());

-- Update RLS policies (batch 2)
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can manage all profiles" 
  ON profiles FOR ALL 
  TO authenticated 
  USING (is_admin());

DROP POLICY IF EXISTS "Authenticated users can access appointments" ON appointments;
CREATE POLICY "Authenticated users can access appointments" 
  ON appointments FOR ALL 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can access consultations" ON consultations;
CREATE POLICY "Authenticated users can access consultations" 
  ON consultations FOR ALL 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can access triage" ON triage;
CREATE POLICY "Authenticated users can access triage" 
  ON triage FOR ALL 
  TO authenticated 
  USING (true);

-- Update RLS policies (batch 3)
DROP POLICY IF EXISTS "Authenticated users can access pharmacy" ON pharmacy;
CREATE POLICY "Authenticated users can access pharmacy" 
  ON pharmacy FOR ALL 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can access lab results" ON lab_results;
CREATE POLICY "Authenticated users can access lab results" 
  ON lab_results FOR ALL 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can access radiology results" ON radiology_results;
CREATE POLICY "Authenticated users can access radiology results" 
  ON radiology_results FOR ALL 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can access vital signs" ON vital_signs;
CREATE POLICY "Authenticated users can access vital signs" 
  ON vital_signs FOR ALL 
  TO authenticated 
  USING (true);

-- Update RLS policies (batch 4)
DROP POLICY IF EXISTS "Authenticated users can access billing" ON billing;
CREATE POLICY "Authenticated users can access billing" 
  ON billing FOR ALL 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can access documents" ON documents;
CREATE POLICY "Authenticated users can access documents" 
  ON documents FOR ALL 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can access allergies" ON allergies;
CREATE POLICY "Authenticated users can access allergies" 
  ON allergies FOR ALL 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can access medical history" ON medical_history;
CREATE POLICY "Authenticated users can access medical history" 
  ON medical_history FOR ALL 
  TO authenticated 
  USING (true);

-- Update RLS policies (batch 5)
DROP POLICY IF EXISTS "Authenticated users can access care plans" ON care_plans;
CREATE POLICY "Authenticated users can access care plans" 
  ON care_plans FOR ALL 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can access referrals" ON referrals;
CREATE POLICY "Authenticated users can access referrals" 
  ON referrals FOR ALL 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can access inpatients" ON inpatients;
CREATE POLICY "Authenticated users can access inpatients" 
  ON inpatients FOR ALL 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can access clinical settings" ON clinical_settings;
CREATE POLICY "Authenticated users can access clinical settings" 
  ON clinical_settings FOR ALL 
  TO authenticated 
  USING (true);

-- Update RLS policies (batch 6)
DROP POLICY IF EXISTS "Authenticated users can access clinical protocols" ON clinical_protocols;
CREATE POLICY "Authenticated users can access clinical protocols" 
  ON clinical_protocols FOR ALL 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can access reports" ON reports;
CREATE POLICY "Authenticated users can access reports" 
  ON reports FOR ALL 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can access report executions" ON report_executions;
CREATE POLICY "Authenticated users can access report executions" 
  ON report_executions FOR ALL 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can access report schedules" ON report_schedules;
CREATE POLICY "Authenticated users can access report schedules" 
  ON report_schedules FOR ALL 
  TO authenticated 
  USING (true);

-- Update RLS policies (batch 7)
DROP POLICY IF EXISTS "Authenticated users can access report subscriptions" ON report_subscriptions;
CREATE POLICY "Authenticated users can access report subscriptions" 
  ON report_subscriptions FOR ALL 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can access support tickets" ON support_tickets;
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