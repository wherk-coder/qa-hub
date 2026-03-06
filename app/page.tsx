"use client"

import { useEffect, useState } from "react"
import { QAProject } from "@/types"
import { Button } from "@/components/ui/button"
import NewProjectDialog from "@/components/NewProjectDialog"
import { Plus, Github, FolderOpen, Trash2, BarChart3, Clock } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const [projects, setProjects] = useState<QAProject[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    setLoading(true)
    try {
      const res = await fetch("/api/projects")
      const data = await res.json()
      setProjects(Array.isArray(data) ? data : [])
    } catch {
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  async function deleteProject(id: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm("Delete this project and all its test cases?")) return
    await fetch(`/api/projects/${id}`, { method: "DELETE" })
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your QA test plans and track bugs</p>
        </div>
        <Button
          onClick={() => setShowNew(true)}
          className="bg-amber-600 hover:bg-amber-500 text-white gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-36 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-600/10 flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-1">No projects yet</h2>
          <p className="text-gray-500 text-sm mb-6">Create your first QA project to get started</p>
          <Button
            onClick={() => setShowNew(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <Link
              key={project.id}
              href={`/project/${project.id}`}
              className="group relative block rounded-xl border border-white/8 bg-[#0f0f0f] hover:border-amber-600/40 hover:bg-[#111] transition-all p-5"
            >
              <button
                onClick={(e) => deleteProject(project.id, e)}
                className="absolute top-3 right-3 p-1.5 rounded opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                title="Delete project"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-600/15 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate group-hover:text-amber-400 transition-colors">
                    {project.name}
                  </h3>
                  {project.github_repo && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Github className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-500 truncate">{project.github_repo}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-2">
                    <Clock className="w-3 h-3 text-gray-600" />
                    <span className="text-xs text-gray-600">
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-amber-600/70 font-medium group-hover:text-amber-500 transition-colors">
                  View test plan →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <NewProjectDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={(project) => {
          setProjects(prev => [project, ...prev])
          setShowNew(false)
        }}
      />
    </div>
  )
}
