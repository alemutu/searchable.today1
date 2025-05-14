/*
  # Setup for Development Mode
  
  1. Changes
    - Create a test hospital if it doesn't exist
    - Create test departments
    - Create a test user with admin rights
    
  2. Security
    - This is for development purposes only
*/

-- Create a test hospital if it doesn't exist
DO $$
DECLARE
  v_hospital_id uuid;
  v_department_ids uuid[];
  v_department_names text[] := ARRAY['General Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Gynecology', 'Surgery', 'Dental', 'Ophthalmology', 'Dermatology', 'Neurology'];
  i integer;
BEGIN
  -- Check if we already have a hospital
  SELECT id INTO v_hospital_id FROM hospitals LIMIT 1;
  
  IF v_hospital_id IS NULL THEN
    -- Create a test hospital
    INSERT INTO hospitals (
      name,
      subdomain,
      address,
      phone,
      email,
      domain_enabled,
      patient_id_format,
      patient_id_prefix,
      patient_id_digits
    )
    VALUES (
      'Development Hospital',
      'dev',
      '123 Dev Street, Dev City',
      '123-456-7890',
      'dev@hms.dev',
      true,
      'prefix_number',
      'DEV',
      6
    )
    RETURNING id INTO v_hospital_id;
    
    -- Create departments for the hospital
    FOR i IN 1..array_length(v_department_names, 1) LOOP
      INSERT INTO departments (
        name,
        hospital_id,
        description
      )
      VALUES (
        v_department_names[i],
        v_hospital_id,
        'Department of ' || v_department_names[i] || ' at Development Hospital'
      );
    END LOOP;
  END IF;
END $$;

-- Create a test user with admin rights
DO $$
DECLARE
  v_user_id uuid;
  v_hospital_id uuid;
  v_department_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'dev@hms.dev';
  
  IF v_user_id IS NULL THEN
    -- Get hospital ID
    SELECT id INTO v_hospital_id FROM hospitals LIMIT 1;
    
    -- Get a department ID
    SELECT id INTO v_department_id FROM departments 
    WHERE hospital_id = v_hospital_id 
    LIMIT 1;
    
    -- Create auth user
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      role,
      aud,
      instance_id
    )
    VALUES (
      gen_random_uuid(),
      'dev@hms.dev',
      crypt('dev123', gen_salt('bf')),
      now(),
      'authenticated',
      'authenticated',
      '00000000-0000-0000-0000-000000000000'
    )
    RETURNING id INTO v_user_id;
    
    -- Create profile
    INSERT INTO profiles (
      id,
      first_name,
      last_name,
      role,
      hospital_id,
      email,
      department_id
    )
    VALUES (
      v_user_id,
      'Developer',
      'User',
      'admin',
      v_hospital_id,
      'dev@hms.dev',
      v_department_id
    );
  END IF;
END $$;