/*
  # Developer Policy and Rights Management
  
  1. New Tables
    - `developer_roles`: Define developer access levels
    - `developer_permissions`: Define granular permissions
    - `code_changes`: Track code modifications
    - `code_reviews`: Manage code review process
    
  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
*/

-- Create developer_roles table
CREATE TABLE IF NOT EXISTS developer_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  description text,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  can_modify_code boolean DEFAULT false,
  can_review_code boolean DEFAULT false,
  can_deploy boolean DEFAULT false,
  can_manage_developers boolean DEFAULT false
);

-- Create developer_permissions table
CREATE TABLE IF NOT EXISTS developer_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role_id uuid REFERENCES developer_roles(id),
  custom_permissions jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  
  UNIQUE(profile_id)
);

-- Create code_changes table
CREATE TABLE IF NOT EXISTS code_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  developer_id uuid REFERENCES profiles(id),
  title text NOT NULL,
  description text,
  files_changed jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  deployed_at timestamptz,
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'deployed'))
);

-- Create code_reviews table
CREATE TABLE IF NOT EXISTS code_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  change_id uuid REFERENCES code_changes(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES profiles(id),
  status text NOT NULL,
  comments text,
  
  CONSTRAINT valid_review_status CHECK (status IN ('approved', 'rejected', 'needs_changes'))
);

-- Enable RLS
ALTER TABLE developer_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for super admin access
CREATE POLICY "Super admins can manage developer roles"
  ON developer_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage developer permissions"
  ON developer_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Create policies for code changes
CREATE POLICY "Developers can view all code changes"
  ON code_changes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM developer_permissions
      WHERE developer_permissions.profile_id = auth.uid()
      AND developer_permissions.is_active = true
    )
  );

CREATE POLICY "Developers can create code changes"
  ON code_changes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM developer_permissions dp
      JOIN developer_roles dr ON dr.id = dp.role_id
      WHERE dp.profile_id = auth.uid()
      AND dp.is_active = true
      AND dr.can_modify_code = true
    )
  );

-- Create policies for code reviews
CREATE POLICY "Developers can view all code reviews"
  ON code_reviews
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM developer_permissions
      WHERE developer_permissions.profile_id = auth.uid()
      AND developer_permissions.is_active = true
    )
  );

CREATE POLICY "Developers can create code reviews"
  ON code_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM developer_permissions dp
      JOIN developer_roles dr ON dr.id = dp.role_id
      WHERE dp.profile_id = auth.uid()
      AND dp.is_active = true
      AND dr.can_review_code = true
    )
  );

-- Insert default developer roles
INSERT INTO developer_roles (name, description, permissions, can_modify_code, can_review_code, can_deploy, can_manage_developers)
VALUES
  (
    'Lead Developer',
    'Full access to code and developer management',
    '{
      "can_create_branches": true,
      "can_merge_branches": true,
      "can_deploy_production": true,
      "can_manage_permissions": true
    }'::jsonb,
    true,
    true,
    true,
    true
  ),
  (
    'Senior Developer',
    'Can modify code and review others work',
    '{
      "can_create_branches": true,
      "can_merge_branches": true,
      "can_deploy_staging": true
    }'::jsonb,
    true,
    true,
    true,
    false
  ),
  (
    'Developer',
    'Can modify code with review',
    '{
      "can_create_branches": true,
      "can_merge_branches": false,
      "can_deploy_staging": false
    }'::jsonb,
    true,
    false,
    false,
    false
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS developer_permissions_profile_id_idx ON developer_permissions (profile_id);
CREATE INDEX IF NOT EXISTS code_changes_developer_id_idx ON code_changes (developer_id);
CREATE INDEX IF NOT EXISTS code_changes_status_idx ON code_changes (status);
CREATE INDEX IF NOT EXISTS code_reviews_change_id_idx ON code_reviews (change_id);
CREATE INDEX IF NOT EXISTS code_reviews_reviewer_id_idx ON code_reviews (reviewer_id);