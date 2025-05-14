-- Reports table to store report definitions
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  type text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  parameters jsonb DEFAULT '[]'::jsonb,
  is_system boolean DEFAULT false,
  is_public boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id)
);

-- Report executions to track report runs
CREATE TABLE IF NOT EXISTS report_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  executed_by uuid REFERENCES profiles(id),
  parameters jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  results jsonb,
  error_message text,
  execution_time integer, -- in milliseconds
  file_url text
);

-- Report schedules for automated reports
CREATE TABLE IF NOT EXISTS report_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  frequency text NOT NULL, -- daily, weekly, monthly, quarterly, annually
  day_of_week integer, -- 0-6 for weekly reports (0 = Sunday)
  day_of_month integer, -- 1-31 for monthly reports
  time_of_day time NOT NULL, -- When to run the report
  parameters jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  last_run timestamptz,
  next_run timestamptz,
  created_by uuid REFERENCES profiles(id)
);

-- Report subscriptions for users
CREATE TABLE IF NOT EXISTS report_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  delivery_method text NOT NULL DEFAULT 'email', -- email, in_app, etc.
  format text NOT NULL DEFAULT 'pdf', -- pdf, excel, csv, etc.
  is_active boolean DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for reports table
CREATE POLICY "Hospital admins can manage their hospital's reports"
  ON reports
  FOR ALL
  TO authenticated
  USING (
    (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())) AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Super admins can manage all reports"
  ON reports
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

CREATE POLICY "Users can view public reports from their hospital"
  ON reports
  FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()) AND
    (is_public = true)
  );

-- Policies for report_executions table
CREATE POLICY "Hospital admins can manage their hospital's report executions"
  ON report_executions
  FOR ALL
  TO authenticated
  USING (
    (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())) AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Super admins can manage all report executions"
  ON report_executions
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

CREATE POLICY "Users can view their own report executions"
  ON report_executions
  FOR SELECT
  TO authenticated
  USING (
    executed_by = auth.uid() OR
    hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  );

-- Policies for report_schedules table
CREATE POLICY "Hospital admins can manage their hospital's report schedules"
  ON report_schedules
  FOR ALL
  TO authenticated
  USING (
    (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())) AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Super admins can manage all report schedules"
  ON report_schedules
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- Policies for report_subscriptions table
CREATE POLICY "Users can manage their own subscriptions"
  ON report_subscriptions
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
  );

CREATE POLICY "Hospital admins can view all subscriptions for their hospital"
  ON report_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())) AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Super admins can manage all subscriptions"
  ON report_subscriptions
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON reports
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_schedules_updated_at
BEFORE UPDATE ON report_schedules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert default system reports
INSERT INTO reports (
  hospital_id,
  name,
  description,
  category,
  type,
  config,
  parameters,
  is_system,
  is_public
)
SELECT 
  id as hospital_id,
  'Patient Registration Trend',
  'Shows patient registration trends over time',
  'operational',
  'line_chart',
  '{"query": "SELECT date_trunc(''day'', created_at) as date, count(*) as count FROM patients WHERE hospital_id = :hospital_id GROUP BY date ORDER BY date", "x_axis": "date", "y_axis": "count", "title": "Patient Registrations"}',
  '[{"name": "date_range", "type": "daterange", "label": "Date Range", "required": true}]',
  true,
  true
FROM hospitals;

INSERT INTO reports (
  hospital_id,
  name,
  description,
  category,
  type,
  config,
  parameters,
  is_system,
  is_public
)
SELECT 
  id as hospital_id,
  'Department Distribution',
  'Shows patient distribution across departments',
  'operational',
  'pie_chart',
  '{"query": "SELECT d.name as department, count(*) as count FROM appointments a JOIN departments d ON a.department_id = d.id WHERE a.hospital_id = :hospital_id GROUP BY d.name", "label": "department", "value": "count", "title": "Patient Distribution by Department"}',
  '[{"name": "date_range", "type": "daterange", "label": "Date Range", "required": false}]',
  true,
  true
FROM hospitals;

INSERT INTO reports (
  hospital_id,
  name,
  description,
  category,
  type,
  config,
  parameters,
  is_system,
  is_public
)
SELECT 
  id as hospital_id,
  'Revenue Summary',
  'Shows revenue breakdown by service type',
  'financial',
  'bar_chart',
  '{"query": "SELECT jsonb_array_elements(services)->''name'' as service_name, SUM((jsonb_array_elements(services)->''amount'')::numeric * (jsonb_array_elements(services)->''quantity'')::numeric) as revenue FROM billing WHERE hospital_id = :hospital_id GROUP BY service_name ORDER BY revenue DESC", "x_axis": "service_name", "y_axis": "revenue", "title": "Revenue by Service Type"}',
  '[{"name": "date_range", "type": "daterange", "label": "Date Range", "required": true}, {"name": "payment_status", "type": "select", "label": "Payment Status", "options": ["all", "paid", "pending", "partial"], "required": false}]',
  true,
  false
FROM hospitals;