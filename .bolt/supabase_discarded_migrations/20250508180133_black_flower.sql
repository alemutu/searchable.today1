/*
  # Add default system settings
  
  1. Changes
    - Add default system settings for:
      - System name
      - Default language
      - Date format
      - Time format
      - Currency
      - Maintenance mode
    
  2. Security
    - Only super admins can modify these settings
*/

INSERT INTO system_settings (key, value, description)
VALUES
  (
    'system.name',
    '"Hospital Management System"',
    'Name of the system'
  ),
  (
    'system.language',
    '"en"',
    'Default system language'
  ),
  (
    'system.date_format',
    '"YYYY-MM-DD"',
    'Default date format'
  ),
  (
    'system.time_format',
    '"HH:mm:ss"',
    'Default time format'
  ),
  (
    'system.currency',
    '"USD"',
    'Default currency'
  ),
  (
    'system.maintenance_mode',
    'false',
    'System maintenance mode'
  ),
  (
    'system.timezone',
    '"UTC"',
    'Default timezone'
  ),
  (
    'email.smtp_host',
    '""',
    'SMTP server host'
  ),
  (
    'email.smtp_port',
    '587',
    'SMTP server port'
  ),
  (
    'email.from_address',
    '""',
    'Default from email address'
  ),
  (
    'security.session_timeout',
    '3600',
    'Session timeout in seconds'
  ),
  (
    'security.password_policy',
    '{"min_length": 8, "require_numbers": true, "require_special": true}',
    'Password policy settings'
  )
ON CONFLICT (key) DO NOTHING;