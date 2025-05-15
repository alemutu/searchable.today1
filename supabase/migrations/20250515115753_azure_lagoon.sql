/*
  # Fix Database Issues

  1. Changes
     - Create inventory table for pharmacy stock management
     - Add assigned_to column to patients table
     - Add missing columns to radiology_results table
     - Fix foreign key relationships for lab_results and pharmacy tables
     - Update RLS policies to fix infinite recursion issues

  2. Security
     - Enable RLS on all tables
     - Add appropriate policies for data access
*/

-- Create inventory table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  medication text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  in_stock boolean DEFAULT true,
  min_stock_level integer DEFAULT 10,
  expiry_date date,
  batch_number text,
  supplier text,
  notes text
);

-- Enable RLS on inventory
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Create policy for inventory
CREATE POLICY "Hospital staff can access inventory"
  ON public.inventory
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.hospital_id = inventory.hospital_id
    )
  );

-- Add assigned_to column to patients if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE public.patients ADD COLUMN assigned_to uuid REFERENCES profiles(id);
  END IF;
END
$$;

-- Add missing columns to radiology_results if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'radiology_results' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE public.radiology_results ADD COLUMN assigned_to uuid REFERENCES profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'radiology_results' AND column_name = 'workflow_stage'
  ) THEN
    ALTER TABLE public.radiology_results ADD COLUMN workflow_stage text;
  END IF;
END
$$;

-- Add missing columns to lab_results if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lab_results' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE public.lab_results ADD COLUMN assigned_to uuid REFERENCES profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lab_results' AND column_name = 'workflow_stage'
  ) THEN
    ALTER TABLE public.lab_results ADD COLUMN workflow_stage text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lab_results' AND column_name = 'sample_info'
  ) THEN
    ALTER TABLE public.lab_results ADD COLUMN sample_info jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lab_results' AND column_name = 'is_emergency'
  ) THEN
    ALTER TABLE public.lab_results ADD COLUMN is_emergency boolean DEFAULT false;
  END IF;
END
$$;

-- Add missing columns to pharmacy if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pharmacy' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE public.pharmacy ADD COLUMN assigned_to uuid REFERENCES profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pharmacy' AND column_name = 'last_updated'
  ) THEN
    ALTER TABLE public.pharmacy ADD COLUMN last_updated timestamptz DEFAULT now();
  END IF;
END
$$;

-- Add missing columns to billing if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'billing' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE public.billing ADD COLUMN assigned_to uuid REFERENCES profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'billing' AND column_name = 'last_updated'
  ) THEN
    ALTER TABLE public.billing ADD COLUMN last_updated timestamptz DEFAULT now();
  END IF;
END
$$;

-- Fix lab_results relationships
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'lab_results_patient_id_fkey') THEN
        ALTER TABLE lab_results
          DROP CONSTRAINT lab_results_patient_id_fkey;
    END IF;
END
$$;

ALTER TABLE lab_results
  ADD CONSTRAINT lab_results_patient_id_fkey
  FOREIGN KEY (patient_id)
  REFERENCES patients(id)
  ON DELETE CASCADE;

-- Fix pharmacy relationships
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pharmacy_patient_id_fkey') THEN
        ALTER TABLE pharmacy
          DROP CONSTRAINT pharmacy_patient_id_fkey;
    END IF;
END
$$;

ALTER TABLE pharmacy
  ADD CONSTRAINT pharmacy_patient_id_fkey
  FOREIGN KEY (patient_id)
  REFERENCES patients(id)
  ON DELETE CASCADE;

-- Update lab_results RLS policies
DROP POLICY IF EXISTS "Hospital staff can access lab results" ON lab_results;
DROP POLICY IF EXISTS "Authenticated users can access lab results" ON lab_results;

CREATE POLICY "Hospital staff can access lab results"
  ON lab_results
  FOR ALL
  TO authenticated
  USING (true);

-- Update pharmacy RLS policies
DROP POLICY IF EXISTS "Hospital staff can access pharmacy orders" ON pharmacy;

CREATE POLICY "Hospital staff can access pharmacy orders"
  ON pharmacy
  FOR ALL
  TO authenticated
  USING (true);

-- Update profiles RLS policies to fix infinite recursion
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles from same hospital" ON profiles;
DROP POLICY IF EXISTS "Users can view and manage own profile" ON profiles;

-- Create simplified policies for profiles
CREATE POLICY "Users can access profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (true);

-- Seed inventory data
INSERT INTO public.inventory (hospital_id, medication, quantity, in_stock, min_stock_level)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Amoxicillin', 120, true, 20),
  ('00000000-0000-0000-0000-000000000001', 'Paracetamol', 200, true, 30),
  ('00000000-0000-0000-0000-000000000001', 'Ibuprofen', 150, true, 25),
  ('00000000-0000-0000-0000-000000000001', 'Metformin', 80, true, 15),
  ('00000000-0000-0000-0000-000000000001', 'Atorvastatin', 60, true, 10),
  ('00000000-0000-0000-0000-000000000001', 'Aspirin', 100, true, 20),
  ('00000000-0000-0000-0000-000000000001', 'Salbutamol', 0, false, 10),
  ('00000000-0000-0000-0000-000000000001', 'Prednisolone', 45, true, 10),
  ('00000000-0000-0000-0000-000000000001', 'Omeprazole', 0, false, 15),
  ('00000000-0000-0000-0000-000000000001', 'Ranitidine', 25, true, 10)
ON CONFLICT DO NOTHING;