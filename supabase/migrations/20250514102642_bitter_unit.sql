/*
  # Fix lab_results table

  1. New Tables
    - None (fixing existing table)
  
  2. Changes
    - Add is_emergency field to lab_results table
    - Add workflow_stage field to lab_results table
    - Add sample_info field to lab_results table
    - Add assigned_to field to lab_results table
  
  3. Security
    - No changes to security policies
*/

-- Add new columns to lab_results table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lab_results' AND column_name = 'is_emergency'
  ) THEN
    ALTER TABLE public.lab_results ADD COLUMN is_emergency boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lab_results' AND column_name = 'workflow_stage'
  ) THEN
    ALTER TABLE public.lab_results ADD COLUMN workflow_stage text DEFAULT 'pending'
      CHECK (workflow_stage IN ('pending', 'sample_collected', 'testing', 'review', 'completed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lab_results' AND column_name = 'sample_info'
  ) THEN
    ALTER TABLE public.lab_results ADD COLUMN sample_info jsonb DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lab_results' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE public.lab_results ADD COLUMN assigned_to uuid REFERENCES public.profiles(id);
  END IF;
END $$;