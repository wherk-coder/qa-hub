"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QAProject } from "@/types"

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (project: QAProject) => void
}

export default function NewProjectDialog({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("")
  const [repo, setRepo] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), github_repo: repo.trim() || null }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const project = await res.json()
      onCreated(project)
      setName("")
      setRepo("")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create project")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#111] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">New QA Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-gray-300">Project Name</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Screen Time Hero"
              className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-gray-600"
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="repo" className="text-gray-300">GitHub Repo <span className="text-gray-500">(optional)</span></Label>
            <Input
              id="repo"
              value={repo}
              onChange={e => setRepo(e.target.value)}
              placeholder="e.g. wherk-coder/sth-react"
              className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-gray-600"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} className="text-gray-400">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="bg-amber-600 hover:bg-amber-500 text-white"
            >
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
