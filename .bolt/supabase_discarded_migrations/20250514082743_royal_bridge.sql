/*
  # Ward Management System
  
  1. New Tables
    - `wards`
      - `id` (uuid, primary key)
      - `name` (text)
      - `hospital_id` (uuid, foreign key)
      - `department_id` (uuid, foreign key)
      - `capacity` (integer)
      - `current_occupancy` (integer)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `beds`
      - `id` (uuid, primary key)
      - `ward_id` (uuid, foreign key)
      - `bed_number` (text)
      - `status` (text)
      - `patient_id` (uuid, foreign key, nullable)
      - `notes` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for hospital staff access
  
  3. Constraints
    - Unique bed numbers within a ward
    - Ward capacity validation
    - Valid status values
*/

-- Create wards table
CREATE TABLE IF NOT EXISTS wards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  department_id uuid REFERENCES departments(id),
  capacity integer NOT NULL CHECK (capacity > 0),
  current_occupancy integer NOT NULL DEFAULT 0 CHECK (current_occupancy >= 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT ward_capacity_check CHECK (current_occupancy <= capacity),
  CONSTRAINT ward_hospital_name_unique UNIQUE (hospital_id, name)
);

-- Create beds table
CREATE TABLE IF NOT EXISTS beds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id uuid NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
  bed_number text NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'reserved')),
  patient_id uuid REFERENCES patients(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT bed_ward_number_unique UNIQUE (ward_id, bed_number),
  CONSTRAINT bed_patient_unique UNIQUE (patient_id) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes
CREATE INDEX IF NOT EXISTS wards_hospital_id_idx ON wards(hospital_id);
CREATE INDEX IF NOT EXISTS wards_department_id_idx ON wards(department_id);
CREATE INDEX IF NOT EXISTS wards_status_idx ON wards(status);
CREATE INDEX IF NOT EXISTS beds_ward_id_idx ON beds(ward_id);
CREATE INDEX IF NOT EXISTS beds_status_idx ON beds(status);
CREATE INDEX IF NOT EXISTS beds_patient_id_idx ON beds(patient_id);

-- Enable RLS
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Hospital staff can access wards" ON wards
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = wards.hospital_id
    )
  );

CREATE POLICY "Hospital staff can access beds" ON beds
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

-- Create function to update ward occupancy
CREATE OR REPLACE FUNCTION update_ward_occupancy()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'occupied' THEN
      UPDATE wards SET current_occupancy = current_occupancy + 1 WHERE id = NEW.ward_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'occupied' AND NEW.status = 'occupied' THEN
      UPDATE wards SET current_occupancy = current_occupancy + 1 WHERE id = NEW.ward_id;
    ELSIF OLD.status = 'occupied' AND NEW.status != 'occupied' THEN
      UPDATE wards SET current_occupancy = current_occupancy - 1 WHERE id = NEW.ward_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'occupied' THEN
      UPDATE wards SET current_occupancy = current_occupancy - 1 WHERE id = OLD.ward_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for bed status changes
CREATE TRIGGER bed_status_change
AFTER INSERT OR UPDATE OF status OR DELETE ON beds
FOR EACH ROW EXECUTE FUNCTION update_ward_occupancy();

-- Create function to check ward capacity before bed assignment
CREATE OR REPLACE FUNCTION check_ward_capacity()
RETURNS TRIGGER AS $$
DECLARE
  ward_capacity integer;
  ward_occupancy integer;
BEGIN
  IF NEW.status = 'occupied' THEN
    SELECT capacity, current_occupancy INTO ward_capacity, ward_occupancy
    FROM wards WHERE id = NEW.ward_id;
    
    IF ward_occupancy >= ward_capacity THEN
      RAISE EXCEPTION 'Ward is at full capacity';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check capacity before bed assignment
CREATE TRIGGER check_bed_assignment
BEFORE INSERT OR UPDATE OF status ON beds
FOR EACH ROW
WHEN (NEW.status = 'occupied')
EXECUTE FUNCTION check_ward_capacity();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_wards_timestamp
BEFORE UPDATE ON wards
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_beds_timestamp
BEFORE UPDATE ON beds
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Add relationship to inpatients table
ALTER TABLE inpatients 
ADD COLUMN IF NOT EXISTS bed_id uuid REFERENCES beds(id),
ADD CONSTRAINT inpatient_bed_unique UNIQUE (bed_id) DEFERRABLE INITIALLY DEFERRED;

-- Create index for the new relationship
CREATE INDEX IF NOT EXISTS inpatients_bed_id_idx ON inpatients(bed_id);

-- Update inpatients RLS policy to include bed access
DROP POLICY IF EXISTS "Hospital staff can access inpatient records" ON inpatients;
CREATE POLICY "Hospital staff can access inpatient records" ON inpatients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = inpatients.hospital_id
    )
  );