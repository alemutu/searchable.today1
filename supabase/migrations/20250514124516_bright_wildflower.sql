/*
  # Create Super Admin Tables

  1. New Tables
    - `system_modules`
      - `id` (uuid, primary key)
      - `name` (text)
      - `key` (text, unique)
      - `description` (text)
      - `is_active` (boolean)
      - `config` (jsonb)
      - `version` (text)
      - `created_at` (timestamptz)

    - `pricing_plans`
      - `id` (uuid, primary key)
      - `name` (text)
      - `key` (text, unique)
      - `description` (text)
      - `price` (numeric)
      - `billing_cycle` (text)
      - `features` (jsonb[])
      - `is_active` (boolean)
      - `max_users` (integer)
      - `max_storage_gb` (integer)
      - `created_at` (timestamptz)

    - `licenses`
      - `id` (uuid, primary key)
      - `hospital_id` (uuid, references hospitals)
      - `plan_id` (uuid, references pricing_plans)
      - `start_date` (date)
      - `end_date` (date)
      - `status` (text)
      - `max_users` (integer)
      - `current_users` (integer)
      - `features` (jsonb)
      - `billing_info` (jsonb)
      - `created_at` (timestamptz)

    - `support_tickets`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `priority` (text)
      - `status` (text)
      - `category` (text)
      - `hospital_id` (uuid, references hospitals)
      - `created_by` (uuid, references profiles)
      - `assigned_to` (uuid, references profiles)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for super admins and hospital admins
*/

-- Create system_modules table
CREATE TABLE IF NOT EXISTS system_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key text UNIQUE NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  config jsonb DEFAULT '{}',
  version text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE system_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage system modules"
  ON system_modules
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  ));

-- Create pricing_plans table
CREATE TABLE IF NOT EXISTS pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key text UNIQUE NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('month', 'year')),
  features jsonb[] DEFAULT ARRAY[]::jsonb[],
  is_active boolean DEFAULT true,
  max_users integer NOT NULL CHECK (max_users > 0),
  max_storage_gb integer NOT NULL CHECK (max_storage_gb > 0),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage pricing plans"
  ON pricing_plans
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  ));

CREATE POLICY "Anyone can read active pricing plans"
  ON pricing_plans
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create licenses table
CREATE TABLE IF NOT EXISTS licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  plan_id uuid NOT NULL REFERENCES pricing_plans(id),
  start_date date NOT NULL,
  end_date date CHECK (end_date > start_date),
  status text NOT NULL CHECK (status IN ('active', 'expired', 'suspended', 'cancelled')),
  max_users integer NOT NULL CHECK (max_users > 0),
  current_users integer NOT NULL DEFAULT 0 CHECK (current_users >= 0),
  features jsonb DEFAULT '{}',
  billing_info jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage licenses"
  ON licenses
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  ));

CREATE POLICY "Hospital admins can read their license"
  ON licenses
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.hospital_id = licenses.hospital_id
  ));

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  category text NOT NULL,
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  created_by uuid NOT NULL REFERENCES profiles(id),
  assigned_to uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage support tickets"
  ON support_tickets
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  ));

CREATE POLICY "Hospital staff can read their tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.hospital_id = support_tickets.hospital_id
  ));

CREATE POLICY "Hospital staff can create tickets"
  ON support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.hospital_id = support_tickets.hospital_id
  ));

-- Fix profiles policy recursion
DROP POLICY IF EXISTS "Hospital admins can manage profiles in their hospital" ON profiles;
CREATE POLICY "Hospital admins can manage profiles in their hospital"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role = 'admin'
      AND hospital_id = profiles.hospital_id
    )
  );