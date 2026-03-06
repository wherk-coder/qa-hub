-- QA Hub Full Schema Migration
-- Run this in: https://supabase.com/dashboard/project/qykcgnrriabfpawoeyif/sql/new

-- 1. qa_users
CREATE TABLE IF NOT EXISTS qa_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  role text DEFAULT 'tester' CHECK (role IN ('admin', 'tester')),
  created_at timestamptz DEFAULT now()
);

-- 2. qa_projects
CREATE TABLE IF NOT EXISTS qa_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  github_repo text,
  created_at timestamptz DEFAULT now()
);

-- 3. qa_project_members
CREATE TABLE IF NOT EXISTS qa_project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES qa_projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES qa_users(id) ON DELETE CASCADE,
  role text DEFAULT 'tester',
  created_at timestamptz DEFAULT now()
);

-- 4. qa_test_plans
CREATE TABLE IF NOT EXISTS qa_test_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES qa_projects(id) ON DELETE CASCADE,
  section text,
  test_id text,
  test_name text,
  preconditions text,
  steps text,
  expected_result text,
  result text DEFAULT 'untested' CHECK (result IN ('pass', 'fail', 'blocked', 'untested')),
  tester_details text,
  suggestions text,
  developer_notes text,
  test_again boolean DEFAULT false,
  retest_details text,
  github_issue_url text,
  github_issue_number integer,
  github_issue_status text CHECK (github_issue_status IN ('open', 'closed') OR github_issue_status IS NULL),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE qa_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_test_plans ENABLE ROW LEVEL SECURITY;

-- Allow all (internal tool with Supabase Auth gate)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'qa_users' AND policyname = 'Allow all on qa_users') THEN
    CREATE POLICY "Allow all on qa_users" ON qa_users FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'qa_projects' AND policyname = 'Allow all on qa_projects') THEN
    CREATE POLICY "Allow all on qa_projects" ON qa_projects FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'qa_project_members' AND policyname = 'Allow all on qa_project_members') THEN
    CREATE POLICY "Allow all on qa_project_members" ON qa_project_members FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'qa_test_plans' AND policyname = 'Allow all on qa_test_plans') THEN
    CREATE POLICY "Allow all on qa_test_plans" ON qa_test_plans FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
