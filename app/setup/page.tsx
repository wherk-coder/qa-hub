"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check, ExternalLink } from "lucide-react"
import Link from "next/link"

const SQL = `-- QA Hub Initial Migration
CREATE TABLE IF NOT EXISTS qa_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  github_repo text,
  created_at timestamptz DEFAULT now()
);

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

ALTER TABLE qa_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_test_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on qa_projects"
  ON qa_projects FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on qa_test_plans"
  ON qa_test_plans FOR ALL USING (true) WITH CHECK (true);`

export default function SetupPage() {
  const [copied, setCopied] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  function copySQL() {
    navigator.clipboard.writeText(SQL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function testConnection() {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch("/api/projects")
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setTestResult("success")
        } else {
          setTestResult("error: " + JSON.stringify(data))
        }
      } else {
        const err = await res.json()
        setTestResult("error: " + (err.error || "Unknown error"))
      }
    } catch {
      setTestResult("error: Network error")
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Database Setup</h1>
        <p className="text-gray-500">One-time setup: create the QA Hub tables in Supabase.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0f0f0f] p-6 space-y-4">
        <h2 className="font-semibold text-white">Step 1: Run SQL Migration</h2>
        <p className="text-gray-400 text-sm">
          Open the Supabase SQL Editor and run the SQL below to create the required tables.
        </p>
        <a
          href="https://supabase.com/dashboard/project/qykcgnrriabfpawoeyif/sql"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 text-sm"
        >
          Open SQL Editor <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <div className="relative">
          <pre className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto leading-relaxed">
            {SQL}
          </pre>
          <button
            onClick={copySQL}
            className="absolute top-3 right-3 p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0f0f0f] p-6 space-y-4">
        <h2 className="font-semibold text-white">Step 2: Test Connection</h2>
        <p className="text-gray-400 text-sm">
          After running the SQL, verify the connection works:
        </p>
        <Button
          onClick={testConnection}
          disabled={testing}
          className="bg-amber-600 hover:bg-amber-500 text-white"
        >
          {testing ? "Testing..." : "Test Database Connection"}
        </Button>
        {testResult === "success" && (
          <p className="text-green-400 text-sm flex items-center gap-2">
            <Check className="w-4 h-4" /> Connected successfully! Tables are ready.
          </p>
        )}
        {testResult && testResult !== "success" && (
          <p className="text-red-400 text-sm">{testResult}</p>
        )}
      </div>

      {testResult === "success" && (
        <div className="text-center">
          <Link href="/">
            <Button className="bg-amber-600 hover:bg-amber-500 text-white">
              Go to QA Hub →
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
