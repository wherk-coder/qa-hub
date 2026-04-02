import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function runSQL(sql: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  })
  return res
}

export async function POST() {
  const sqls = [
    `CREATE TABLE IF NOT EXISTS qa_projects (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      github_repo text,
      created_at timestamptz DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS qa_test_plans (
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
    )`,
  ]

  const results = []
  for (const sql of sqls) {
    const res = await runSQL(sql)
    results.push({ status: res.status, ok: res.ok })
  }

  return NextResponse.json({ results })
}
