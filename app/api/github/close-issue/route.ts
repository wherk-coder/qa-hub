import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  let repo: unknown, issue_number: unknown
  try {
    const body = await req.json()
    repo = body.repo
    issue_number = body.issue_number
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!repo || !issue_number) {
    return NextResponse.json({ error: 'repo and issue_number are required' }, { status: 400 })
  }

  if (typeof repo !== 'string' || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    return NextResponse.json({ error: 'repo must be in owner/repo format' }, { status: 400 })
  }

  const issueNum = Number(issue_number)
  if (!Number.isInteger(issueNum) || issueNum <= 0) {
    return NextResponse.json({ error: 'issue_number must be a positive integer' }, { status: 400 })
  }

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'GITHUB_TOKEN not configured' }, { status: 500 })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  let response: Response
  try {
    response = await fetch(`https://api.github.com/repos/${repo}/issues/${issueNum}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ state: 'closed' }),
      signal: controller.signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return NextResponse.json({ error: 'GitHub API request timed out' }, { status: 504 })
    }
    return NextResponse.json({ error: 'Failed to reach GitHub API' }, { status: 502 })
  } finally {
    clearTimeout(timeout)
  }

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
