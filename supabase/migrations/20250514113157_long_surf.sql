/*
  # Fix profiles table and policies

  1. Changes
    - Create profiles table if it doesn't exist
    - Enable RLS on profiles table
    - Create policies for profile access
    - Create trigger for updating updated_at column
    - Fix super admin role policies
*/

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'lab_technician', 'visitor')),
  hospital_id uuid REFERENCES public.hospitals(id),
  email text NOT NULL,
  avatar_url text,
  department_id uuid REFERENCES public.departments(id),
  specialization text,
  contact_number text
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Hospital admins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;

-- Create policies
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Fix the policy to avoid infinite recursion
CREATE POLICY "Hospital admins can manage profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (
    (auth.uid() = id) OR 
    (
      role = 'admin' AND 
      hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Fix the policy to avoid infinite recursion
CREATE POLICY "Super admins can manage all profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (
    (auth.uid() = id) OR 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ensure the searchable.today@gmail.com user has super_admin role
DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Get the user ID for the email
  SELECT id INTO user_id FROM auth.users WHERE email = 'searchable.today@gmail.com';
  
  -- If the user exists, update or insert the profile
  IF user_id IS NOT NULL THEN
    -- Check if profile exists
    IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id) THEN
      -- Update existing profile
      UPDATE profiles 
      SET role = 'super_admin'
      WHERE id = user_id;
    ELSE
      -- Insert new profile
      INSERT INTO profiles (
        id, 
        first_name, 
        last_name, 
        role, 
        email
      ) VALUES (
        user_id, 
        'Super', 
        'Admin', 
        'super_admin', 
        'searchable.today@gmail.com'
      );
    END IF;
  END IF;
END;
$$;