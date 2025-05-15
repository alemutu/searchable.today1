/*
  # Create documents table

  1. New Tables
    - `documents` - Patient medical documents
    
  2. Security
    - Enable RLS on the table
    - Add policies for hospital staff access
*/

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  document_type text NOT NULL,
  title text NOT NULL,
  file_url text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  description text,
  tags text[],
  uploaded_by uuid REFERENCES profiles(id),
  
  CONSTRAINT valid_document_type CHECK (document_type IN (
    'lab_result', 
    'radiology_image', 
    'referral_letter', 
    'discharge_summary', 
    'consent_form', 
    'prescription', 
    'medical_certificate', 
    'insurance_document', 
    'other'
  ))
);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies for documents
CREATE POLICY "Hospital staff can access documents"
  ON documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = documents.hospital_id
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS documents_patient_id_idx ON documents (patient_id);
CREATE INDEX IF NOT EXISTS documents_hospital_id_idx ON documents (hospital_id);
CREATE INDEX IF NOT EXISTS documents_document_type_idx ON documents (document_type);
CREATE INDEX IF NOT EXISTS documents_uploaded_at_idx ON documents (uploaded_at);