/*
  # Create support settings table

  1. New Tables
    - `support_settings` - Global support configuration
    - `support_tickets` - Support ticket tracking
    
  2. Security
    - Enable RLS on all tables
    - Add policies for super admin access
    - Add policies for hospital staff access
*/

-- Create support_settings table
CREATE TABLE IF NOT EXISTS support_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  categories jsonb[] NOT NULL DEFAULT ARRAY[
    '{"id": "1", "name": "Technical Issue", "description": "Problems with system functionality", "priority": "high"}'::jsonb,
    '{"id": "2", "name": "Account Access", "description": "Login and permission issues", "priority": "high"}'::jsonb,
    '{"id": "3", "name": "Feature Request", "description": "Suggestions for new features", "priority": "medium"}'::jsonb,
    '{"id": "4", "name": "General Inquiry", "description": "General questions and information", "priority": "low"}'::jsonb
  ],
  sla_settings jsonb[] NOT NULL DEFAULT ARRAY[
    '{"priority": "critical", "response_time": 1, "resolution_time": 4}'::jsonb,
    '{"priority": "high", "response_time": 4, "resolution_time": 24}'::jsonb,
    '{"priority": "medium", "response_time": 8, "resolution_time": 48}'::jsonb,
    '{"priority": "low", "response_time": 24, "resolution_time": 72}'::jsonb
  ],
  notification_settings jsonb NOT NULL DEFAULT '{
    "email_notifications": true,
    "in_app_notifications": true,
    "notify_on": ["new_ticket", "ticket_update", "ticket_resolved"]
  }'::jsonb,
  auto_responses jsonb[] NOT NULL DEFAULT ARRAY[
    '{"id": "1", "category": "Technical Issue", "subject": "Technical Support Ticket Received", "message": "Thank you for reporting this technical issue. Our team will investigate and respond shortly.", "enabled": true}'::jsonb,
    '{"id": "2", "category": "Account Access", "subject": "Account Support Request Received", "message": "We have received your account access request. A support representative will assist you soon.", "enabled": true}'::jsonb
  ]
);

-- Create support_tickets table if it doesn't exist already
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  category text NOT NULL,
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  created_by uuid NOT NULL REFERENCES profiles(id),
  assigned_to uuid REFERENCES profiles(id),
  messages jsonb[] DEFAULT ARRAY[]::jsonb[],
  attachments jsonb[] DEFAULT ARRAY[]::jsonb[]
);

-- Enable Row Level Security
ALTER TABLE support_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for support_settings
CREATE POLICY "Super admins can manage support settings"
  ON support_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Create policies for support_tickets
CREATE POLICY "Super admins can manage all support tickets"
  ON support_tickets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Hospital staff can view their tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = support_tickets.hospital_id
    )
  );

CREATE POLICY "Hospital staff can create tickets"
  ON support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = support_tickets.hospital_id
    )
  );

CREATE POLICY "Hospital staff can update their tickets"
  ON support_tickets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = support_tickets.hospital_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = support_tickets.hospital_id
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_support_settings_updated_at
  BEFORE UPDATE ON support_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default support settings
INSERT INTO support_settings DEFAULT VALUES
ON CONFLICT DO NOTHING;