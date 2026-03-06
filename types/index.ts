export interface Attachment {
  url: string
  name: string
  type: string
  path: string
  field: string
  uploadedAt: string
}

export interface QAProject {
  id: string
  name: string
  github_repo: string | null
  created_at: string
  // Computed stats (from API)
  test_count?: number
  pass_count?: number
  fail_count?: number
  open_bugs_count?: number
}

export interface QATestPlan {
  id: string
  project_id: string
  section: string | null
  test_id: string | null
  test_name: string | null
  preconditions: string | null
  steps: string | null
  expected_result: string | null
  result: 'pass' | 'fail' | 'blocked' | 'untested'
  tester_details: string | null
  suggestions: string | null
  developer_notes: string | null
  test_again: boolean
  retest_details: string | null
  github_issue_url: string | null
  github_issue_number: number | null
  github_issue_status: 'open' | 'closed' | null
  attachments: Attachment[]
  created_at: string
  updated_at: string
}

export type TestResult = 'pass' | 'fail' | 'blocked' | 'untested'
