"use client"

import { useState, useRef, useCallback } from "react"
import { QATestPlan, TestResult } from "@/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Bug, ExternalLink, RefreshCw, Trash2 } from "lucide-react"
import GitHubIssueModal from "./GitHubIssueModal"

interface Props {
  test: QATestPlan
  repo: string | null
  onUpdate: (id: string, updates: Partial<QATestPlan>) => void
  onDelete: (id: string) => void
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

export default function TestRow({ test, repo, onUpdate, onDelete }: Props) {
  const [showIssueModal, setShowIssueModal] = useState(false)

  const save = useCallback((field: keyof QATestPlan, value: unknown) => {
    onUpdate(test.id, { [field]: value } as Partial<QATestPlan>)
  }, [test.id, onUpdate])

  const result = (test.result || "untested") as TestResult

  return (
    <>
      <tr className={`border-b border-white/5 hover:brightness-110 transition-all ${ROW_BG[result]}`}>
        {/* Section */}
        <td className="px-3 py-2 text-xs text-gray-400 min-w-[120px] max-w-[160px]">
          <EditableCell value={test.section} onSave={v => save("section", v)} placeholder="Section" />
        </td>

        {/* Test ID */}
        <td className="px-3 py-2 text-xs font-mono min-w-[60px]">
          <EditableCell value={test.test_id} onSave={v => save("test_id", v)} placeholder="ID" />
        </td>

        {/* Test Name */}
        <td className="px-3 py-2 min-w-[160px] max-w-[220px]">
          <EditableCell value={test.test_name} onSave={v => save("test_name", v)} placeholder="Test name" />
        </td>

        {/* Preconditions */}
        <td className="px-3 py-2 min-w-[120px] max-w-[180px]">
          <EditableCell value={test.preconditions} onSave={v => save("preconditions", v)} placeholder="—" multiline />
        </td>

        {/* Steps */}
        <td className="px-3 py-2 min-w-[140px] max-w-[200px]">
          <EditableCell value={test.steps} onSave={v => save("steps", v)} placeholder="—" multiline />
        </td>

        {/* Expected Result */}
        <td className="px-3 py-2 min-w-[120px] max-w-[180px]">
          <EditableCell value={test.expected_result} onSave={v => save("expected_result", v)} placeholder="—" multiline />
        </td>

        {/* Result */}
        <td className="px-3 py-2 min-w-[120px]">
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

          {result === "fail" && (
            <div className="mt-1.5">
              {test.github_issue_url ? (
                <a
                  href={test.github_issue_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400"
                >
                  <ExternalLink className="w-3 h-3" />
                  #{test.github_issue_number}
                </a>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 gap-1"
                  onClick={() => setShowIssueModal(true)}
                >
                  <Bug className="w-3 h-3" />
                  Create Issue
                </Button>
              )}
            </div>
          )}
        </td>

        {/* Tester Details */}
        <td className="px-3 py-2 min-w-[120px] max-w-[180px]">
          <EditableCell value={test.tester_details} onSave={v => save("tester_details", v)} placeholder="—" multiline />
        </td>

        {/* Suggestions */}
        <td className="px-3 py-2 min-w-[120px] max-w-[180px]">
          <EditableCell value={test.suggestions} onSave={v => save("suggestions", v)} placeholder="—" multiline />
        </td>

        {/* Dev Notes */}
        <td className="px-3 py-2 min-w-[120px] max-w-[180px]">
          <EditableCell value={test.developer_notes} onSave={v => save("developer_notes", v)} placeholder="—" multiline />
        </td>

        {/* Test Again */}
        <td className="px-3 py-2 text-center min-w-[80px]">
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
        <td className="px-3 py-2 min-w-[120px] max-w-[180px]">
          <EditableCell value={test.retest_details} onSave={v => save("retest_details", v)} placeholder="—" multiline />
        </td>

        {/* Actions */}
        <td className="px-2 py-2 text-center">
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
            save("github_issue_url", url)
            save("github_issue_number", number)
            setShowIssueModal(false)
          }}
        />
      )}
    </>
  )
}
