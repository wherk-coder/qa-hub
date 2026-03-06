"use client"

import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload } from "lucide-react"

interface Props {
  projectId: string
  open: boolean
  onClose: () => void
  onImported: () => void
}

const FIELDS = [
  { key: "section", label: "Section" },
  { key: "test_id", label: "Test ID" },
  { key: "test_name", label: "Test Name" },
  { key: "preconditions", label: "Preconditions" },
  { key: "steps", label: "Steps" },
  { key: "expected_result", label: "Expected Result" },
  { key: "result", label: "Result" },
  { key: "tester_details", label: "Tester Details" },
  { key: "suggestions", label: "Suggestions" },
  { key: "developer_notes", label: "Developer Notes" },
  { key: "skip", label: "— Skip —" },
]

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let current = ""
  let inQuotes = false
  let row: string[] = []

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      row.push(current.trim()); current = ""
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(current.trim()); current = ""
      if (row.some(c => c)) rows.push(row)
      row = []
    } else {
      current += ch
    }
  }
  if (current || row.length) { row.push(current.trim()); if (row.some(c => c)) rows.push(row) }
  return rows
}

export default function CSVImportDialog({ projectId, open, onClose, onImported }: Props) {
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState<"upload" | "map" | "preview">("upload")

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const parsed = parseCSV(text)
      if (parsed.length < 2) { setError("CSV must have at least a header row and one data row"); return }
      setHeaders(parsed[0])
      setRows(parsed.slice(1))
      // Auto-map by header name
      const autoMap: Record<number, string> = {}
      parsed[0].forEach((h, i) => {
        const normalized = h.toLowerCase().replace(/[^a-z0-9]/g, "_")
        const match = FIELDS.find(f => f.key !== "skip" && (
          f.key === normalized ||
          f.label.toLowerCase().replace(/[^a-z0-9]/g, "_") === normalized
        ))
        autoMap[i] = match?.key || "skip"
      })
      setMapping(autoMap)
      setStep("map")
      setError("")
    }
    reader.readAsText(file)
  }, [])

  async function handleImport() {
    setLoading(true)
    setError("")
    try {
      const records = rows.map(row => {
        const record: Record<string, string | boolean | null> = { project_id: projectId, result: "untested" }
        headers.forEach((_, i) => {
          const field = mapping[i]
          if (field && field !== "skip") {
            const val = row[i] || null
            if (field === "test_again") record[field] = val === "true" || val === "TRUE" || val === "yes" || val === "1"
            else if (field === "result") {
              const r = (val || "").toLowerCase()
              record[field] = ["pass", "fail", "blocked", "untested"].includes(r) ? r : "untested"
            } else {
              record[field] = val
            }
          }
        })
        return record
      })

      const res = await fetch("/api/test-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(records),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      onImported()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Import failed")
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setHeaders([]); setRows([]); setMapping({}); setStep("upload"); setError("")
  }

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); reset() }}>
      <DialogContent className="bg-[#111] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Import Test Cases from CSV</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4 mt-2">
            <p className="text-gray-400 text-sm">Export your Google Sheets test plan as CSV and upload here.</p>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-amber-600/50 transition-colors">
              <Upload className="w-8 h-8 text-gray-500 mb-2" />
              <span className="text-gray-400 text-sm">Click to upload CSV file</span>
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
            </label>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
        )}

        {step === "map" && (
          <div className="space-y-4 mt-2">
            <p className="text-gray-400 text-sm">
              Found <strong className="text-white">{rows.length}</strong> rows. Map your CSV columns to test plan fields:
            </p>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {headers.map((h, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm w-40 truncate">{h}</span>
                  <Select value={mapping[i] || "skip"} onValueChange={v => setMapping(prev => ({ ...prev, [i]: v }))}>
                    <SelectTrigger className="bg-[#1a1a1a] border-white/10 text-white h-8 text-sm flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                      {FIELDS.map(f => (
                        <SelectItem key={f.key} value={f.key} className="text-sm">{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => { reset() }} className="text-gray-400">
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={loading}
                className="bg-amber-600 hover:bg-amber-500 text-white"
              >
                {loading ? "Importing..." : `Import ${rows.length} rows`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
