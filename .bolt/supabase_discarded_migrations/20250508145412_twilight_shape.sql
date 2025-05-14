/*
  # Update Developer Credentials
  
  1. Changes
    - Remove old admin account if it exists
    - Update existing developer account or create new one
    - Update profile for developer account
*/

-- Remove old admin account if it exists
DELETE FROM auth.users WHERE email = 'admin@hms.dev';

DO $$ 
DECLARE
  existing_user_id uuid;
BEGIN
  -- Get existing user id if exists
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = 'gosearch.link@gmail.com';

  IF existing_user_id IS NOT NULL THEN
    -- Update existing user
    UPDATE auth.users
    SET
      encrypted_password = crypt('#$able2050', gen_salt('bf')),
      email_confirmed_at = now(),
      raw_app_meta_data = jsonb_build_object(
        'provider', 'email',
        'providers', array['email']
      ),
      raw_user_meta_data = jsonb_build_object(
        'role', 'super_admin'
      ),
      updated_at = now(),
      role = 'authenticated',
      aud = 'authenticated'
    WHERE id = existing_user_id;

    -- Update existing profile
    UPDATE public.profiles
    SET
      first_name = 'Developer',
      last_name = 'Admin',
      role = 'super_admin',
      email = 'gosearch.link@gmail.com',
      updated_at = now()
    WHERE id = existing_user_id;
  ELSE
    -- Create new user if doesn't exist
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'gosearch.link@gmail.com',
      crypt('#$able2050', gen_salt('bf')),
      now(),
      jsonb_build_object(
        'provider', 'email',
        'providers', array['email']
      ),
      jsonb_build_object(
        'role', 'super_admin'
      ),
      now(),
      now(),
      'authenticated',
      'authenticated'
    ) RETURNING id INTO existing_user_id;

    -- Create new profile
    INSERT INTO public.profiles (
      id,
      first_name,
      last_name,
      role,
      email,
      created_at,
      updated_at
    ) VALUES (
      existing_user_id,
      'Developer',
      'Admin',
      'super_admin',
      'gosearch.link@gmail.com',
      now(),
      now()
    );
  END IF;
END $$;