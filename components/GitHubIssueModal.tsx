"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { QATestPlan } from "@/types"
import { ExternalLink } from "lucide-react"

interface Props {
  testPlan: QATestPlan
  repo: string | null
  open: boolean
  onClose: () => void
  onCreated: (issueUrl: string, issueNumber: number) => void
}

function buildIssueBody(t: QATestPlan): string {
  return `## QA Test Failure
**Test ID:** ${t.test_id || "—"}
**Section:** ${t.section || "—"}
**Test:** ${t.test_name || "—"}

### Preconditions
${t.preconditions || "N/A"}

### Steps to Reproduce
${t.steps || "N/A"}

### Expected Result
${t.expected_result || "N/A"}

### Actual Result / Tester Details
${t.tester_details || "N/A"}

### Suggestions
${t.suggestions || "N/A"}`
}

export default function GitHubIssueModal({ testPlan, repo, open, onClose, onCreated }: Props) {
  const defaultTitle = `[QA] ${testPlan.test_name || "Test"} — ${testPlan.section || "Unknown Section"}`
  const [title, setTitle] = useState(defaultTitle)
  const [body, setBody] = useState(buildIssueBody(testPlan))
  const [repoInput, setRepoInput] = useState(repo || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [created, setCreated] = useState<{ url: string; number: number } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!repoInput.trim()) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/github/create-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: repoInput.trim(), title, body, labels: ["bug", "qa"] }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const issue = await res.json()
      setCreated({ url: issue.url, number: issue.number })
      onCreated(issue.url, issue.number)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create issue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#111] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Create GitHub Issue</DialogTitle>
        </DialogHeader>

        {created ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <span className="text-green-400 text-2xl">✓</span>
            </div>
            <p className="text-gray-300">Issue <strong className="text-white">#{created.number}</strong> created successfully!</p>
            <a
              href={created.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 text-sm"
            >
              View on GitHub <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <div className="pt-2">
              <Button onClick={onClose} className="bg-amber-600 hover:bg-amber-500 text-white">
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-gray-300">Repository</Label>
              <Input
                value={repoInput}
                onChange={e => setRepoInput(e.target.value)}
                placeholder="owner/repo"
                className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-gray-600"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-300">Title</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="bg-[#1a1a1a] border-white/10 text-white"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-300">Body</Label>
              <Textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={16}
                className="bg-[#1a1a1a] border-white/10 text-white font-mono text-xs resize-y"
              />
            </div>
            <div className="flex gap-2 text-xs text-gray-500">
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">bug</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">qa</span>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose} className="text-gray-400">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-amber-600 hover:bg-amber-500 text-white"
              >
                {loading ? "Creating..." : "Create Issue"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
