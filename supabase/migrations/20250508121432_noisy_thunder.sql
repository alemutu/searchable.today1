/*
  # Create Developer Account

  1. Creates a new developer user account with admin privileges
  2. Creates corresponding profile entry
  3. Sets up necessary role and permissions
*/

DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Create the developer user account
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
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    aud,
    role
  ) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'dev@searchable.gmail.com',
    crypt('dev@tools', gen_salt('bf')),
    now(),
    jsonb_build_object(
      'provider', 'email',
      'providers', array['email'],
      'role', 'admin'
    ),
    jsonb_build_object(
      'role', 'admin'
    ),
    now(),
    now(),
    '',
    '',
    '',
    '',
    'authenticated',
    'authenticated'
  )
  RETURNING id INTO new_user_id;

  -- Create the developer profile
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    role,
    email,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    'Developer',
    'Admin',
    'admin',
    'dev@searchable.gmail.com',
    now(),
    now()
  );
END $$;