"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams } from "next/navigation"
import { QAProject, QATestPlan, TestResult } from "@/types"
import { Button } from "@/components/ui/button"
import TestRow from "@/components/TestRow"
import CSVImportDialog from "@/components/CSVImportDialog"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft, Plus, Upload, Github, RefreshCw,
  CheckCircle2, XCircle, MinusCircle, Circle, Edit3, Check, X
} from "lucide-react"
import Link from "next/link"

export default function ProjectPage() {
  const params = useParams()
  // router not used
  const { toast } = useToast()
  const id = params.id as string

  const [project, setProject] = useState<QAProject | null>(null)
  const [tests, setTests] = useState<QATestPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showCSV, setShowCSV] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState("")
  const [editingRepo, setEditingRepo] = useState(false)
  const [draftRepo, setDraftRepo] = useState("")

  // Track pending updates to debounce
  const pendingUpdates = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchAll() }, [id])

  async function fetchAll() {
    setLoading(true)
    try {
      const [projRes, testsRes] = await Promise.all([
        fetch(`/api/projects/${id}`),
        fetch(`/api/test-plans?project_id=${id}`),
      ])
      const proj = await projRes.json()
      const testsData = await testsRes.json()
      setProject(proj)
      setTests(Array.isArray(testsData) ? testsData : [])
    } catch {
      toast({ title: "Error loading data", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = useCallback((testId: string, updates: Partial<QATestPlan>) => {
    // Optimistic update
    setTests(prev => prev.map(t => t.id === testId ? { ...t, ...updates } : t))

    // Debounce API call
    if (pendingUpdates.current.has(testId)) {
      clearTimeout(pendingUpdates.current.get(testId)!)
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/test-plans/${testId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        })
        if (!res.ok) throw new Error()
      } catch {
        toast({ title: "Failed to save", description: "Changes may not be persisted", variant: "destructive" })
      }
      pendingUpdates.current.delete(testId)
    }, 600)
    pendingUpdates.current.set(testId, timer)
  }, [toast])

  const handleDelete = useCallback(async (testId: string) => {
    if (!confirm("Delete this test case?")) return
    setTests(prev => prev.filter(t => t.id !== testId))
    await fetch(`/api/test-plans/${testId}`, { method: "DELETE" })
  }, [])

  async function addTestCase() {
    try {
      const res = await fetch("/api/test-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: id,
          section: "",
          test_id: "",
          test_name: "New test case",
          result: "untested",
        }),
      })
      const newTest = await res.json()
      setTests(prev => [...prev, newTest])
    } catch {
      toast({ title: "Failed to add test case", variant: "destructive" })
    }
  }

  async function saveProjectName() {
    if (!draftName.trim() || draftName === project?.name) { setEditingName(false); return }
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: draftName.trim() }),
    })
    const updated = await res.json()
    setProject(updated)
    setEditingName(false)
  }

  async function saveProjectRepo() {
    if (draftRepo === project?.github_repo) { setEditingRepo(false); return }
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ github_repo: draftRepo.trim() || null }),
    })
    const updated = await res.json()
    setProject(updated)
    setEditingRepo(false)
  }

  // Stats
  const total = tests.length
  const counts = tests.reduce((acc, t) => {
    acc[(t.result || "untested") as TestResult] = (acc[(t.result || "untested") as TestResult] || 0) + 1
    return acc
  }, {} as Record<TestResult, number>)

  const passRate = total > 0 ? Math.round(((counts.pass || 0) / total) * 100) : 0
  const failCount = counts.fail || 0
  const blockedCount = counts.blocked || 0
  const untestedCount = counts.untested || total


  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="h-4 w-96 bg-white/5 rounded animate-pulse" />
        <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-500">Project not found</p>
        <Link href="/" className="text-amber-500 text-sm mt-2 inline-block">← Back to projects</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Link href="/" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm w-fit transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          All Projects
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            {/* Editable project name */}
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={draftName}
                  onChange={e => setDraftName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveProjectName(); if (e.key === "Escape") setEditingName(false) }}
                  className="text-2xl font-bold bg-black/40 border border-amber-600/40 rounded px-2 py-0.5 text-white focus:outline-none"
                />
                <button onClick={saveProjectName} className="text-green-400 hover:text-green-300"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditingName(false)} className="text-gray-500 hover:text-gray-300"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => { setDraftName(project.name); setEditingName(true) }}>
                <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                <Edit3 className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}

            {/* Editable repo */}
            {editingRepo ? (
              <div className="flex items-center gap-2">
                <Github className="w-3.5 h-3.5 text-gray-500" />
                <input
                  autoFocus
                  value={draftRepo}
                  onChange={e => setDraftRepo(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveProjectRepo(); if (e.key === "Escape") setEditingRepo(false) }}
                  placeholder="owner/repo"
                  className="text-sm bg-black/40 border border-amber-600/40 rounded px-2 py-0.5 text-gray-300 focus:outline-none w-48"
                />
                <button onClick={saveProjectRepo} className="text-green-400 hover:text-green-300"><Check className="w-3.5 h-3.5" /></button>
                <button onClick={() => setEditingRepo(false)} className="text-gray-500 hover:text-gray-300"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <div
                className="flex items-center gap-1.5 group cursor-pointer"
                onClick={() => { setDraftRepo(project.github_repo || ""); setEditingRepo(true) }}
              >
                <Github className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
                  {project.github_repo || "Add GitHub repo"}
                </span>
                <Edit3 className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white border border-white/10 gap-1.5"
              onClick={() => setShowCSV(true)}
            >
              <Upload className="w-3.5 h-3.5" />
              Import CSV
            </Button>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-500 text-white gap-1.5"
              onClick={addTestCase}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Test
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      {total > 0 && (
        <div className="rounded-xl border border-white/8 bg-[#0f0f0f] p-4 space-y-3">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-gray-400">Pass</span>
              <span className="font-bold text-green-400">{counts.pass || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-gray-400">Fail</span>
              <span className="font-bold text-red-400">{failCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <MinusCircle className="w-4 h-4 text-yellow-400" />
              <span className="text-gray-400">Blocked</span>
              <span className="font-bold text-yellow-400">{blockedCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4 text-gray-500" />
              <span className="text-gray-400">Untested</span>
              <span className="font-bold text-gray-400">{untestedCount}</span>
            </div>
            <div className="ml-auto text-gray-400">
              <span className="text-white font-bold">{total}</span> total
              {" · "}
              <span className="text-green-400 font-bold">{passRate}%</span> pass rate
            </div>
          </div>

          {/* Multi-segment progress bar */}
          <div className="w-full h-2 rounded-full bg-white/5 flex overflow-hidden gap-0.5">
            {counts.pass ? (
              <div className="bg-green-500 h-full rounded-l transition-all" style={{ width: `${((counts.pass || 0) / total) * 100}%` }} />
            ) : null}
            {counts.fail ? (
              <div className="bg-red-500 h-full transition-all" style={{ width: `${((counts.fail || 0) / total) * 100}%` }} />
            ) : null}
            {counts.blocked ? (
              <div className="bg-yellow-500 h-full transition-all" style={{ width: `${((counts.blocked || 0) / total) * 100}%` }} />
            ) : null}
            {counts.untested ? (
              <div className="bg-gray-700 h-full rounded-r transition-all" style={{ width: `${((counts.untested || 0) / total) * 100}%` }} />
            ) : null}
          </div>
        </div>
      )}

      {/* Test Table */}
      {tests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-xl">
          <p className="text-gray-500 mb-4">No test cases yet</p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-white border border-white/10 gap-1.5"
              onClick={() => setShowCSV(true)}
            >
              <Upload className="w-3.5 h-3.5" />
              Import from CSV
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-500 text-white gap-1.5"
              onClick={addTestCase}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Test Case
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-white/8 bg-[#0f0f0f] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-[#0d0d0d] text-left">
                  {[
                    "Section", "ID", "Test", "Preconditions", "Steps",
                    "Expected Result", "Result", "Tester Details", "Suggestions",
                    "Dev Notes", "Retest?", "Retest Details", ""
                  ].map((col) => (
                    <th key={col} className="px-3 py-2.5 text-xs font-medium text-gray-500 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tests.map(test => (
                  <TestRow
                    key={test.id}
                    test={test}
                    repo={project.github_repo}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer actions */}
          <div className="border-t border-white/8 px-4 py-3 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-white gap-1.5 text-xs"
              onClick={addTestCase}
            >
              <Plus className="w-3.5 h-3.5" />
              Add row
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-white gap-1.5 text-xs"
              onClick={fetchAll}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          </div>
        </div>
      )}

      <CSVImportDialog
        projectId={id}
        open={showCSV}
        onClose={() => setShowCSV(false)}
        onImported={() => {
          setShowCSV(false)
          fetchAll()
          toast({ title: "Test cases imported successfully!" })
        }}
      />
    </div>
  )
}
