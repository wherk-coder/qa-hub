-- QA Hub Initial Migration
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/qykcgnrriabfpawoeyif/sql

-- Create qa_projects table
CREATE TABLE IF NOT EXISTS qa_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  github_repo text,
  created_at timestamptz DEFAULT now()
);

-- Create qa_test_plans table
CREATE TABLE IF NOT EXISTS qa_test_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES qa_projects(id) ON DELETE CASCADE,
  section text,
  test_id text,
  test_name text,
  preconditions text,
  steps text,
  expected_result text,
  result text DEFAULT 'untested',
  tester_details text,
  suggestions text,
  developer_notes text,
  test_again boolean DEFAULT false,
  retest_details text,
  github_issue_url text,
  github_issue_number integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE qa_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_test_plans ENABLE ROW LEVEL SECURITY;

-- Allow all operations (internal tool, no auth needed)
CREATE POLICY "Allow all on qa_projects"
  ON qa_projects FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all on qa_test_plans"
  ON qa_test_plans FOR ALL
  USING (true)
  WITH CHECK (true);
