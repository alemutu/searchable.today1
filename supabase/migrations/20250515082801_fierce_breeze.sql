/*
  # Create search_patients function

  1. New Functions
    - `search_patients` - Function to search patients by various criteria
    
  2. Security
    - Add security definer to function
    - Ensure proper access control
*/

-- Create search_patients function
CREATE OR REPLACE FUNCTION search_patients(search_term text)
RETURNS SETOF patients
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Get the hospital_id of the current user
  DECLARE
    user_hospital_id uuid;
  BEGIN
    SELECT hospital_id INTO user_hospital_id
    FROM profiles
    WHERE id = auth.uid();
    
    -- Return patients that match the search term and belong to the user's hospital
    RETURN QUERY
    SELECT p.*
    FROM patients p
    WHERE p.hospital_id = user_hospital_id
    AND (
      p.first_name ILIKE '%' || search_term || '%' OR
      p.last_name ILIKE '%' || search_term || '%' OR
      (p.first_name || ' ' || p.last_name) ILIKE '%' || search_term || '%' OR
      p.contact_number ILIKE '%' || search_term || '%' OR
      p.email ILIKE '%' || search_term || '%' OR
      p.id::text = search_term
    )
    ORDER BY 
      CASE 
        WHEN p.first_name ILIKE search_term || '%' OR p.last_name ILIKE search_term || '%' THEN 1
        WHEN p.first_name ILIKE '%' || search_term || '%' OR p.last_name ILIKE '%' || search_term || '%' THEN 2
        ELSE 3
      END,
      p.first_name,
      p.last_name;
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_patients(text) TO authenticated;