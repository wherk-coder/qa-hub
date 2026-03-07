"use client"

import React, { useState, useRef, useCallback } from "react"
import { QATestPlan, TestResult } from "@/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Bug, ExternalLink, RefreshCw, Trash2, XCircle } from "lucide-react"
import GitHubIssueModal from "./GitHubIssueModal"
import FileUpload from "./FileUpload"
import { Attachment } from "@/types"

interface Props {
  test: QATestPlan
  repo: string | null
  onUpdate: (id: string, updates: Partial<QATestPlan>) => void
  onDelete: (id: string) => void
  columnWidths?: Record<string, number>
}

const RESULT_COLORS: Record<TestResult, string> = {
  pass: "text-green-400 border-green-400/30 bg-green-400/10",
  fail: "text-red-400 border-red-400/30 bg-red-400/10",
  blocked: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  untested: "text-gray-400 border-gray-400/20 bg-gray-400/5",
}

const ROW_BG: Record<TestResult, string> = {
  pass: "row-pass",
  fail: "row-fail",
  blocked: "row-blocked",
  untested: "row-untested",
}

function EditableCell({
  value,
  onSave,
  className = "",
  placeholder = "",
  multiline = false,
}: {
  value: string | null
  onSave: (val: string) => void
  className?: string
  placeholder?: string
  multiline?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || "")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(val: string) {
    setDraft(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onSave(val), 800)
  }

  function handleBlur() {
    if (timerRef.current) clearTimeout(timerRef.current)
    onSave(draft)
    setEditing(false)
  }

  if (!editing) {
    return (
      <div
        className={`min-h-[1.5rem] cursor-text text-sm leading-relaxed whitespace-pre-wrap break-words ${className} ${
          !value ? "text-gray-600 italic" : ""
        }`}
        onClick={() => { setDraft(value || ""); setEditing(true) }}
        title="Click to edit"
      >
        {value || placeholder}
      </div>
    )
  }

  if (multiline) {
    return (
      <textarea
        autoFocus
        value={draft}
        onChange={e => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full min-h-[4rem] bg-black/40 border border-amber-600/40 rounded px-2 py-1 text-sm text-white resize-y focus:outline-none focus:border-amber-500 ${className}`}
        rows={3}
      />
    )
  }

  return (
    <input
      autoFocus
      value={draft}
      onChange={e => handleChange(e.target.value)}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={`w-full bg-black/40 border border-amber-600/40 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-amber-500 ${className}`}
    />
  )
}

function CloseIssueDialog({
  open,
  onClose,
  onConfirm,
  loading,
  issueNumber,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  loading: boolean
  issueNumber: number | null
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#111] border-white/10 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Close GitHub Issue</DialogTitle>
        </DialogHeader>
        <p className="text-gray-400 text-sm">
          Are you sure you want to close issue <strong className="text-white">#{issueNumber}</strong> on GitHub?
        </p>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-gray-400" disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-500 text-white"
          >
            {loading ? "Closing..." : "Close Issue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function TestRow({ test, repo, onUpdate, onDelete, columnWidths = {} }: Props) {
  function cw(key: string): React.CSSProperties {
    const w = columnWidths[key]
    return w ? { width: w, maxWidth: w, overflow: "hidden" } : {}
  }
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [closingIssue, setClosingIssue] = useState(false)

  const save = useCallback((field: keyof QATestPlan, value: unknown) => {
    onUpdate(test.id, { [field]: value } as Partial<QATestPlan>)
  }, [test.id, onUpdate])

  const result = (test.result || "untested") as TestResult

  async function handleCloseIssue() {
    if (!repo || !test.github_issue_number) return
    setClosingIssue(true)
    try {
      const res = await fetch("/api/github/close-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo, issue_number: test.github_issue_number }),
      })
      if (res.ok) {
        onUpdate(test.id, { github_issue_status: "closed" })
      }
    } finally {
      setClosingIssue(false)
      setShowCloseDialog(false)
    }
  }

  return (
    <>
      <tr className={`border-b border-white/5 hover:brightness-110 transition-all ${ROW_BG[result]}`}>
        {/* Section */}
        <td className="px-3 py-2 text-xs text-gray-400" style={cw("section")}>
          <EditableCell value={test.section} onSave={v => save("section", v)} placeholder="Section" />
        </td>

        {/* Test ID */}
        <td className="px-3 py-2 text-xs font-mono" style={cw("test_id")}>
          <EditableCell value={test.test_id} onSave={v => save("test_id", v)} placeholder="ID" />
        </td>

        {/* Test Name */}
        <td className="px-3 py-2" style={cw("test_name")}>
          <EditableCell value={test.test_name} onSave={v => save("test_name", v)} placeholder="Test name" />
        </td>

        {/* Preconditions */}
        <td className="px-3 py-2" style={cw("preconditions")}>
          <EditableCell value={test.preconditions} onSave={v => save("preconditions", v)} placeholder="—" multiline />
        </td>

        {/* Steps */}
        <td className="px-3 py-2" style={cw("steps")}>
          <EditableCell value={test.steps} onSave={v => save("steps", v)} placeholder="—" multiline />
        </td>

        {/* Expected Result */}
        <td className="px-3 py-2" style={cw("expected_result")}>
          <EditableCell value={test.expected_result} onSave={v => save("expected_result", v)} placeholder="—" multiline />
        </td>

        {/* Result */}
        <td className="px-3 py-2" style={cw("result")}>
          <Select
            value={result}
            onValueChange={v => save("result", v as TestResult)}
          >
            <SelectTrigger className={`h-7 text-xs border rounded px-2 bg-transparent ${RESULT_COLORS[result]}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
              <SelectItem value="untested" className="text-gray-400 text-xs">Untested</SelectItem>
              <SelectItem value="pass" className="text-green-400 text-xs">Pass</SelectItem>
              <SelectItem value="fail" className="text-red-400 text-xs">Fail</SelectItem>
              <SelectItem value="blocked" className="text-yellow-400 text-xs">Blocked</SelectItem>
            </SelectContent>
          </Select>

          {/* GitHub issue section */}
          {test.github_issue_url ? (
            <div className="mt-1.5 space-y-1">
              <a
                href={test.github_issue_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400"
              >
                <ExternalLink className="w-3 h-3" />
                #{test.github_issue_number}
                {test.github_issue_status === "open" && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-medium">
                    open
                  </span>
                )}
                {test.github_issue_status === "closed" && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-medium">
                    closed
                  </span>
                )}
              </a>
              {test.github_issue_status !== "closed" && (
                <div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 px-1.5 text-[10px] text-gray-500 hover:text-red-400 hover:bg-red-400/10 gap-0.5"
                    onClick={() => setShowCloseDialog(true)}
                  >
                    <XCircle className="w-2.5 h-2.5" />
                    Close issue
                  </Button>
                </div>
              )}
            </div>
          ) : result === "fail" ? (
            <div className="mt-1.5">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 gap-1"
                onClick={() => setShowIssueModal(true)}
              >
                <Bug className="w-3 h-3" />
                Create Issue
              </Button>
            </div>
          ) : null}
        </td>

        {/* Tester Details */}
        <td className="px-3 py-2" style={cw("tester_details")}>
          <EditableCell value={test.tester_details} onSave={v => save("tester_details", v)} placeholder="—" multiline />
          <FileUpload
            testPlanId={test.id}
            projectId={test.project_id}
            field="tester_details"
            attachments={test.attachments || []}
            onUpdate={(atts: Attachment[]) => save("attachments", atts)}
          />
        </td>

        {/* Suggestions */}
        <td className="px-3 py-2" style={cw("suggestions")}>
          <EditableCell value={test.suggestions} onSave={v => save("suggestions", v)} placeholder="—" multiline />
          <FileUpload
            testPlanId={test.id}
            projectId={test.project_id}
            field="suggestions"
            attachments={test.attachments || []}
            onUpdate={(atts: Attachment[]) => save("attachments", atts)}
          />
        </td>

        {/* Dev Notes */}
        <td className="px-3 py-2" style={cw("developer_notes")}>
          <EditableCell value={test.developer_notes} onSave={v => save("developer_notes", v)} placeholder="—" multiline />
        </td>

        {/* Test Again */}
        <td className="px-3 py-2 text-center" style={cw("test_again")}>
          <button
            onClick={() => save("test_again", !test.test_again)}
            className={`w-8 h-4 rounded-full transition-colors relative ${test.test_again ? "bg-amber-600" : "bg-gray-700"}`}
            title={test.test_again ? "Needs retest" : "No retest needed"}
          >
            <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${test.test_again ? "left-4.5 translate-x-0.5" : "left-0.5"}`} />
          </button>
          {test.test_again && (
            <RefreshCw className="w-3 h-3 text-amber-500 mx-auto mt-1" />
          )}
        </td>

        {/* Retest Details */}
        <td className="px-3 py-2" style={cw("retest_details")}>
          <EditableCell value={test.retest_details} onSave={v => save("retest_details", v)} placeholder="—" multiline />
        </td>

        {/* Actions */}
        <td className="px-2 py-2 text-center" style={cw("actions")}>
          <button
            onClick={() => onDelete(test.id)}
            className="text-gray-600 hover:text-red-400 transition-colors p-1 rounded"
            title="Delete test"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </td>
      </tr>

      {showIssueModal && (
        <GitHubIssueModal
          testPlan={test}
          repo={repo}
          open={showIssueModal}
          onClose={() => setShowIssueModal(false)}
          onCreated={(url, number) => {
            onUpdate(test.id, {
              github_issue_url: url,
              github_issue_number: number,
              github_issue_status: "open",
            })
            setShowIssueModal(false)
          }}
        />
      )}

      <CloseIssueDialog
        open={showCloseDialog}
        onClose={() => setShowCloseDialog(false)}
        onConfirm={handleCloseIssue}
        loading={closingIssue}
        issueNumber={test.github_issue_number}
      />
    </>
  )
}
