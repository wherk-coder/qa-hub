"use client"

import { useState, useEffect, useCallback, useRef } from "react"

const MIN_WIDTH = 80

export function useColumnResize(
  projectId: string,
  defaultWidths: Record<string, number>
) {
  const [widths, setWidths] = useState<Record<string, number>>(defaultWidths)
  const widthsRef = useRef(widths)
  const saveTimer = useRef<NodeJS.Timeout | null>(null)
  const storageKey = `qa-hub-col-widths-${projectId}`

  // Keep ref in sync with state
  useEffect(() => {
    widthsRef.current = widths
  }, [widths])

  // Load from localStorage on mount
  useEffect(() => {
    if (!projectId) return
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        setWidths(prev => ({ ...prev, ...parsed }))
      }
    } catch {
      // ignore
    }
  }, [storageKey, projectId])

  const startResize = useCallback(
    (colKey: string, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const startX = e.clientX
      const startWidth = widthsRef.current[colKey] ?? defaultWidths[colKey] ?? 100
      let currentWidth = startWidth

      function onMouseMove(ev: MouseEvent) {
        const delta = ev.clientX - startX
        currentWidth = Math.max(MIN_WIDTH, startWidth + delta)
        setWidths(prev => ({ ...prev, [colKey]: currentWidth }))
      }

      function onMouseUp() {
        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""

        // Debounced save to localStorage
        if (saveTimer.current) clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(() => {
          try {
            localStorage.setItem(storageKey, JSON.stringify(widthsRef.current))
          } catch {
            // ignore
          }
        }, 300)
      }

      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storageKey]
  )

  return { widths, startResize }
}
