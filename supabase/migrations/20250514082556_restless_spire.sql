/*
  # Create Ward Management Table
  
  1. New Tables
    - `wards`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `hospital_id` (uuid, foreign key to hospitals)
      - `department_id` (uuid, foreign key to departments)
      - `capacity` (integer, not null)
      - `current_occupancy` (integer, default 0)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp with time zone, default now())
    - `beds`
      - `id` (uuid, primary key)
      - `ward_id` (uuid, foreign key to wards)
      - `bed_number` (text, not null)
      - `status` (text, not null)
      - `is_occupied` (boolean, default false)
      - `patient_id` (uuid, foreign key to patients, nullable)
      - `created_at` (timestamp with time zone, default now())
  
  2. Security
    - Enable RLS on both tables
    - Add policies for hospital staff to access their hospital's wards and beds
*/

-- Create wards table
CREATE TABLE IF NOT EXISTS wards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  department_id uuid REFERENCES departments(id),
  capacity integer NOT NULL,
  current_occupancy integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create beds table
CREATE TABLE IF NOT EXISTS beds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id uuid NOT NULL REFERENCES wards(id),
  bed_number text NOT NULL,
  status text NOT NULL CHECK (status IN ('available', 'occupied', 'maintenance', 'reserved')),
  is_occupied boolean DEFAULT false,
  patient_id uuid REFERENCES patients(id),
  created_at timestamptz DEFAULT now()
);

-- Add unique constraint to ensure bed numbers are unique within a ward
ALTER TABLE beds ADD CONSTRAINT unique_bed_number_per_ward UNIQUE (ward_id, bed_number);

-- Add constraint to ensure a patient can only be assigned to one bed
ALTER TABLE beds ADD CONSTRAINT one_bed_per_patient UNIQUE (patient_id) DEFERRABLE INITIALLY DEFERRED;

-- Enable Row Level Security
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;

-- Create policies for wards
CREATE POLICY "Hospital staff can access their hospital's wards"
  ON wards
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = wards.hospital_id
    )
  );

-- Create policies for beds
CREATE POLICY "Hospital staff can access their hospital's beds"
  ON beds
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wards
      JOIN profiles ON profiles.hospital_id = wards.hospital_id
      WHERE wards.id = beds.ward_id
      AND profiles.id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS wards_hospital_id_idx ON wards(hospital_id);
CREATE INDEX IF NOT EXISTS wards_department_id_idx ON wards(department_id);
CREATE INDEX IF NOT EXISTS beds_ward_id_idx ON beds(ward_id);
CREATE INDEX IF NOT EXISTS beds_patient_id_idx ON beds(patient_id);
CREATE INDEX IF NOT EXISTS beds_status_idx ON beds(status);

-- Add function to update ward occupancy when a bed status changes
CREATE OR REPLACE FUNCTION update_ward_occupancy()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_occupied = true THEN
      UPDATE wards SET current_occupancy = current_occupancy + 1 WHERE id = NEW.ward_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_occupied = false AND NEW.is_occupied = true THEN
      UPDATE wards SET current_occupancy = current_occupancy + 1 WHERE id = NEW.ward_id;
    ELSIF OLD.is_occupied = true AND NEW.is_occupied = false THEN
      UPDATE wards SET current_occupancy = current_occupancy - 1 WHERE id = NEW.ward_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_occupied = true THEN
      UPDATE wards SET current_occupancy = current_occupancy - 1 WHERE id = OLD.ward_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update ward occupancy
CREATE TRIGGER update_ward_occupancy_trigger
AFTER INSERT OR UPDATE OR DELETE ON beds
FOR EACH ROW EXECUTE FUNCTION update_ward_occupancy();

-- Add function to ensure ward capacity is not exceeded
CREATE OR REPLACE FUNCTION check_ward_capacity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_occupied = true THEN
    IF (SELECT current_occupancy FROM wards WHERE id = NEW.ward_id) >= (SELECT capacity FROM wards WHERE id = NEW.ward_id) THEN
      RAISE EXCEPTION 'Ward capacity exceeded';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check ward capacity
CREATE TRIGGER check_ward_capacity_trigger
BEFORE INSERT OR UPDATE ON beds
FOR EACH ROW EXECUTE FUNCTION check_ward_capacity();