"use client"

import { useState, useRef } from "react"
import { createSupabaseClient } from "@/lib/supabase-client"
import { Attachment } from "@/types"
import { FileText, Upload, X, Loader2 } from "lucide-react"

const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_COUNT = 5
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"]
const ACCEPTED_ATTR = "image/jpeg,image/png,image/gif,image/webp,application/pdf"

interface Props {
  testPlanId: string
  projectId: string
  field: string
  attachments: Attachment[]
  onUpdate: (attachments: Attachment[]) => void
}

export default function FileUpload({ testPlanId, projectId, field, attachments, onUpdate }: Props) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const fieldAttachments = attachments.filter(a => a.field === field)
  const canAdd = fieldAttachments.length < MAX_COUNT

  async function uploadFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Only images (JPG, PNG, GIF, WebP) or PDFs")
      return
    }
    if (file.size > MAX_SIZE) {
      setError("File must be under 10MB")
      return
    }
    if (fieldAttachments.length >= MAX_COUNT) {
      setError("Max 5 attachments")
      return
    }

    setError("")
    setUploading(true)

    try {
      const supabase = createSupabaseClient()
      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
      const path = `${projectId}/${testPlanId}/${safeName}`

      const { error: uploadError } = await supabase.storage
        .from("qa-attachments")
        .upload(path, file, { upsert: false })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from("qa-attachments")
        .getPublicUrl(path)

      const newAttachment: Attachment = {
        url: urlData.publicUrl,
        name: file.name,
        type: file.type,
        path,
        field,
        uploadedAt: new Date().toISOString(),
      }

      const res = await fetch("/api/attachments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test_plan_id: testPlanId, attachment: newAttachment }),
      })
      if (!res.ok) throw new Error("Failed to save attachment")
      const updated = await res.json()
      onUpdate(updated.attachments)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  async function deleteAttachment(att: Attachment) {
    setError("")
    try {
      const res = await fetch("/api/attachments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test_plan_id: testPlanId, path: att.path }),
      })
      if (!res.ok) throw new Error("Failed to delete")
      const updated = await res.json()
      onUpdate(updated.attachments)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed")
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    e.target.value = ""
  }

  return (
    <div className="mt-1 space-y-1">
      {fieldAttachments.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {fieldAttachments.map((att, i) => (
            <div key={i} className="relative group">
              {att.type.startsWith("image/") ? (
                <a href={att.url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={att.url}
                    alt={att.name}
                    className="h-10 w-auto rounded border border-white/10 object-cover hover:opacity-80 transition-opacity"
                  />
                </a>
              ) : (
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-1.5 py-1 rounded border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <FileText className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="text-[10px] text-gray-300 max-w-[80px] truncate">{att.name}</span>
                </a>
              )}
              <button
                onClick={() => deleteAttachment(att)}
                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                title="Remove attachment"
              >
                <X className="w-2 h-2" />
              </button>
            </div>
          ))}
        </div>
      )}

      {canAdd && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`flex items-center gap-1 px-2 py-0.5 rounded border border-dashed cursor-pointer transition-colors text-[10px] select-none ${
            dragging
              ? "border-amber-500 bg-amber-500/10 text-amber-400"
              : "border-white/10 hover:border-white/20 text-gray-600 hover:text-gray-500"
          } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {uploading ? (
            <><Loader2 className="w-2.5 h-2.5 animate-spin" /> Uploading…</>
          ) : (
            <><Upload className="w-2.5 h-2.5" /> Attach</>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_ATTR}
        className="hidden"
        onChange={handleFileSelect}
      />

      {error && <p className="text-[10px] text-red-400 leading-tight">{error}</p>}
    </div>
  )
}
