/*
  # Add Super Admin User

  1. New User
    - Creates a super admin user with the specified email
    - Grants all necessary permissions for system administration
  
  2. Security
    - Ensures the user has the 'super_admin' role
    - Provides access to all administrative functions
*/

-- Check if the user already exists in auth.users
DO $$
DECLARE
  user_id uuid;
  profile_exists boolean;
BEGIN
  -- First check if the user exists in auth.users
  SELECT id INTO user_id FROM auth.users WHERE email = 'searchable.today@gmail.com';
  
  -- If user doesn't exist in auth, we can't proceed
  -- In a real scenario, you would create the user first via auth.admin.create_user
  -- But for this migration, we'll just check if the user exists
  
  IF user_id IS NULL THEN
    RAISE NOTICE 'User with email searchable.today@gmail.com does not exist in auth.users. Please create the user first.';
  ELSE
    -- Check if profile already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = user_id) INTO profile_exists;
    
    -- If profile doesn't exist, create it
    IF NOT profile_exists THEN
      INSERT INTO public.profiles (
        id,
        first_name,
        last_name,
        role,
        email
      ) VALUES (
        user_id,
        'System',
        'Administrator',
        'super_admin',
        'searchable.today@gmail.com'
      );
      
      RAISE NOTICE 'Super admin profile created for user with email searchable.today@gmail.com';
    ELSE
      -- Update existing profile to ensure super_admin role
      UPDATE public.profiles
      SET role = 'super_admin'
      WHERE id = user_id;
      
      RAISE NOTICE 'Existing profile updated to super_admin role for user with email searchable.today@gmail.com';
    END IF;
  END IF;
END $$;