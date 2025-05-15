/*
  # Add default pricing plans

  1. New Data
    - Adds default pricing plans (Basic, Standard, Premium)
    
  2. Changes
    - Inserts initial pricing plan data
    
  3. Security
    - No changes to security policies
*/

-- Insert default pricing plans if they don't exist
INSERT INTO pricing_plans (name, key, description, price, billing_cycle, features, max_users, max_storage_gb)
VALUES
  (
    'Basic Plan',
    'basic',
    'Essential features for small clinics',
    99,
    'month',
    ARRAY[
      '{"name": "Users", "value": "Up to 5 users"}',
      '{"name": "Storage", "value": "10GB storage"}',
      '{"name": "Support", "value": "Basic support"}',
      '{"name": "Modules", "value": "Core modules only"}'
    ]::jsonb[],
    5,
    10
  ),
  (
    'Standard Plan',
    'standard',
    'Comprehensive solution for mid-sized facilities',
    299,
    'month',
    ARRAY[
      '{"name": "Users", "value": "Up to 20 users"}',
      '{"name": "Storage", "value": "50GB storage"}',
      '{"name": "Support", "value": "Priority support"}',
      '{"name": "Modules", "value": "All core modules"}',
      '{"name": "Reporting", "value": "Basic reporting"}'
    ]::jsonb[],
    20,
    50
  ),
  (
    'Premium Plan',
    'premium',
    'Advanced features for large hospitals',
    599,
    'month',
    ARRAY[
      '{"name": "Users", "value": "Unlimited users"}',
      '{"name": "Storage", "value": "200GB storage"}',
      '{"name": "Support", "value": "24/7 support"}',
      '{"name": "Modules", "value": "All modules"}',
      '{"name": "Analytics", "value": "Advanced analytics"}'
    ]::jsonb[],
    999999,
    200
  )
ON CONFLICT (key) DO NOTHING;