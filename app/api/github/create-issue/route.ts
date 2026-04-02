import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { repo, title, body, labels } = await req.json()

  if (!repo || !title) {
    return NextResponse.json({ error: 'repo and title are required' }, { status: 400 })
  }

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'GITHUB_TOKEN not configured' }, { status: 500 })
  }

  const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      body,
      labels: labels || ['bug', 'qa'],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    return NextResponse.json({ error: `GitHub API error: ${error}` }, { status: response.status })
  }

  const issue = await response.json()
  return NextResponse.json({
    url: issue.html_url,
    number: issue.number,
    id: issue.id,
  })
}
