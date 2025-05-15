/*
  # Create Hospital Function

  1. Function Description
    - Creates a stored procedure to handle hospital creation and all related resources
    - Handles transaction management to ensure data consistency
    - Creates hospital, admin user, modules, license, and default departments

  2. Parameters
    - hospital_data: Hospital profile information
    - admin_data: Admin user setup information
    - modules_data: Selected modules for the hospital
    - plan_key: Pricing plan key
    - license_data: License details
*/

-- Create the function to handle hospital creation
CREATE OR REPLACE FUNCTION create_hospital(
  hospital_data JSONB,
  admin_data JSONB,
  modules_data JSONB,
  plan_key TEXT,
  license_data JSONB
) RETURNS JSONB AS $$
DECLARE
  hospital_id UUID;
  admin_id UUID;
  plan_record RECORD;
  license_id UUID;
  end_date DATE;
  module_record RECORD;
  dept_name TEXT;
BEGIN
  -- Start a transaction to ensure data consistency
  BEGIN
    -- Create the hospital
    INSERT INTO hospitals (
      name,
      subdomain,
      address,
      phone,
      email,
      domain_enabled
    ) VALUES (
      hospital_data->>'name',
      hospital_data->>'subdomain',
      hospital_data->>'address',
      hospital_data->>'phone',
      hospital_data->>'email',
      true
    )
    RETURNING id INTO hospital_id;

    -- Get the pricing plan
    SELECT * INTO plan_record
    FROM pricing_plans
    WHERE key = plan_key;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Pricing plan not found: %', plan_key;
    END IF;

    -- Calculate end date based on license type
    IF license_data->>'type' = 'monthly' THEN
      end_date := (license_data->>'startDate')::DATE + INTERVAL '1 month';
    ELSIF license_data->>'type' = 'yearly' THEN
      end_date := (license_data->>'startDate')::DATE + INTERVAL '1 year';
    ELSE
      end_date := NULL; -- Lifetime license has no end date
    END IF;

    -- Create license
    INSERT INTO licenses (
      hospital_id,
      plan_id,
      start_date,
      end_date,
      status,
      max_users,
      current_users,
      features,
      billing_info
    ) VALUES (
      hospital_id,
      plan_record.id,
      (license_data->>'startDate')::DATE,
      end_date,
      'active',
      plan_record.max_users,
      0, -- No users yet
      '{}',
      jsonb_build_object(
        'billing_cycle', license_data->>'type',
        'auto_renew', (license_data->>'autoRenew')::BOOLEAN,
        'payment_status', 'paid',
        'notes', license_data->>'notes'
      )
    )
    RETURNING id INTO license_id;

    -- Create default departments
    FOREACH dept_name IN ARRAY ARRAY['General Medicine', 'Pediatrics', 'Obstetrics & Gynecology', 'Surgery', 'Orthopedics']
    LOOP
      INSERT INTO departments (
        hospital_id,
        name,
        description
      ) VALUES (
        hospital_id,
        dept_name,
        dept_name || ' department'
      );
    END LOOP;

    -- Create hospital modules
    -- Outpatient modules
    FOR module_record IN SELECT jsonb_array_elements_text(modules_data->'outpatient') AS module_key
    LOOP
      INSERT INTO hospital_modules (
        hospital_id,
        module_key,
        category,
        is_active
      ) VALUES (
        hospital_id,
        module_record.module_key,
        'outpatient',
        true
      );
    END LOOP;

    -- Inpatient modules
    FOR module_record IN SELECT jsonb_array_elements_text(modules_data->'inpatient') AS module_key
    LOOP
      INSERT INTO hospital_modules (
        hospital_id,
        module_key,
        category,
        is_active
      ) VALUES (
        hospital_id,
        module_record.module_key,
        'inpatient',
        true
      );
    END LOOP;

    -- Shared modules
    FOR module_record IN SELECT jsonb_array_elements_text(modules_data->'shared') AS module_key
    LOOP
      INSERT INTO hospital_modules (
        hospital_id,
        module_key,
        category,
        is_active
      ) VALUES (
        hospital_id,
        module_record.module_key,
        'shared',
        true
      );
    END LOOP;

    -- Add-on modules
    FOR module_record IN SELECT jsonb_array_elements_text(modules_data->'addons') AS module_key
    LOOP
      INSERT INTO hospital_modules (
        hospital_id,
        module_key,
        category,
        is_active
      ) VALUES (
        hospital_id,
        module_record.module_key,
        'addon',
        true
      );
    END LOOP;

    -- Create default billing settings
    INSERT INTO billing_settings (
      hospital_id,
      payment_methods,
      tax_rates,
      invoice_settings,
      default_currency,
      auto_payment_reminders,
      reminder_days
    ) VALUES (
      hospital_id,
      ARRAY[
        '{"type": "cash", "config": {}, "enabled": true}'::jsonb,
        '{"type": "credit_card", "config": {}, "enabled": true}'::jsonb,
        '{"type": "debit_card", "config": {}, "enabled": true}'::jsonb,
        '{"type": "insurance", "config": {}, "enabled": true}'::jsonb,
        '{"type": "mobile_payment", "config": {}, "enabled": true}'::jsonb
      ],
      ARRAY[
        '{"name": "Standard VAT", "rate": 20, "type": "vat"}'::jsonb,
        '{"name": "Reduced Rate", "rate": 5, "type": "vat"}'::jsonb
      ],
      '{
        "prefix": "INV",
        "footer_text": "Thank you for your business",
        "terms_conditions": "Standard terms and conditions apply",
        "due_days": 30
      }'::jsonb,
      'USD',
      true,
      ARRAY[7, 3, 1]
    );

    -- Return success response
    RETURN jsonb_build_object(
      'success', true,
      'hospital_id', hospital_id,
      'license_id', license_id
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Roll back the transaction on error
      RAISE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check subdomain availability
CREATE OR REPLACE FUNCTION check_subdomain_availability(subdomain TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM hospitals WHERE hospitals.subdomain = subdomain
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get license metrics
CREATE OR REPLACE FUNCTION get_license_metrics()
RETURNS JSONB AS $$
DECLARE
  active_count INTEGER;
  total_users INTEGER;
  expiring_soon INTEGER;
BEGIN
  -- Count active licenses
  SELECT COUNT(*) INTO active_count
  FROM licenses
  WHERE status = 'active';
  
  -- Count total users across all licenses
  SELECT COALESCE(SUM(current_users), 0) INTO total_users
  FROM licenses;
  
  -- Count licenses expiring in the next 30 days
  SELECT COUNT(*) INTO expiring_soon
  FROM licenses
  WHERE 
    end_date IS NOT NULL AND 
    end_date > CURRENT_DATE AND 
    end_date <= (CURRENT_DATE + INTERVAL '30 days');
  
  RETURN jsonb_build_object(
    'total_active', active_count,
    'total_users', total_users,
    'expiring_soon', expiring_soon
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create a license
CREATE OR REPLACE FUNCTION create_license(
  hospital_id UUID,
  plan_id UUID
) RETURNS JSONB AS $$
DECLARE
  license_id UUID;
  plan_record RECORD;
BEGIN
  -- Get the plan details
  SELECT * INTO plan_record
  FROM pricing_plans
  WHERE id = plan_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pricing plan not found';
  END IF;
  
  -- Create the license
  INSERT INTO licenses (
    hospital_id,
    plan_id,
    start_date,
    status,
    max_users,
    current_users,
    features,
    billing_info
  ) VALUES (
    hospital_id,
    plan_id,
    CURRENT_DATE,
    'active',
    plan_record.max_users,
    0,
    '{}',
    '{
      "billing_cycle": "monthly",
      "auto_renew": true
    }'::jsonb
  )
  RETURNING id INTO license_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'license_id', license_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;