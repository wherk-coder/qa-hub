import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('qa_projects')
    .select('*, qa_test_plans(result, github_issue_status)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Compute stats per project
  const projects = (data || []).map((p: {
    qa_test_plans: Array<{ result: string; github_issue_status: string | null }>
    [key: string]: unknown
  }) => {
    const tests = p.qa_test_plans || []
    const total = tests.length
    const pass = tests.filter((t) => t.result === 'pass').length
    const fail = tests.filter((t) => t.result === 'fail').length
    const openBugs = tests.filter(
      (t) => t.github_issue_status === 'open'
    ).length
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { qa_test_plans: _tests, ...rest } = p
    return {
      ...rest,
      test_count: total,
      pass_count: pass,
      fail_count: fail,
      open_bugs_count: openBugs,
    }
  })

  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, github_repo } = body

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('qa_projects')
    .insert({ name, github_repo: github_repo || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
