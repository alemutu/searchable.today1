-- Create a function to set the Supabase URL and anon key in the system settings
CREATE OR REPLACE FUNCTION set_supabase_config()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update the Supabase URL
  INSERT INTO system_settings (key, value, description)
  VALUES (
    'supabase.url', 
    '"https://cyxlbkzxaoonahfcrfua.supabase.co"', 
    'Supabase project URL'
  )
  ON CONFLICT (key) 
  DO UPDATE SET value = '"https://cyxlbkzxaoonahfcrfua.supabase.co"';
  
  -- Insert or update the Supabase anon key
  INSERT INTO system_settings (key, value, description)
  VALUES (
    'supabase.anon_key', 
    '"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5eGxia3p4YW9vbmFoZmNyZnVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyOTc4NDMsImV4cCI6MjA2Mjg3Mzg0M30.t0TahBAb4ORolqqK_KBFfRg7SXKHlJ8c4H3S-TPw4_w"', 
    'Supabase anonymous key'
  )
  ON CONFLICT (key) 
  DO UPDATE SET value = '"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5eGxia3p4YW9vbmFoZmNyZnVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyOTc4NDMsImV4cCI6MjA2Mjg3Mzg0M30.t0TahBAb4ORolqqK_KBFfRg7SXKHlJ8c4H3S-TPw4_w"';
END;
$$;

-- Execute the function to set the Supabase configuration
SELECT set_supabase_config();

-- Drop the function after use
DROP FUNCTION set_supabase_config();