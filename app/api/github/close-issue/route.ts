import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { repo, issue_number } = await req.json()

  if (!repo || !issue_number) {
    return NextResponse.json({ error: 'repo and issue_number are required' }, { status: 400 })
  }

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'GITHUB_TOKEN not configured' }, { status: 500 })
  }

  const response = await fetch(`https://api.github.com/repos/${repo}/issues/${issue_number}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ state: 'closed' }),
  })

  if (!response.ok) {
    const error = await response.text()
    return NextResponse.json({ error: `GitHub API error: ${error}` }, { status: response.status })
  }

  const issue = await response.json()
  return NextResponse.json({
    number: issue.number,
    state: issue.state,
    url: issue.html_url,
  })
}
