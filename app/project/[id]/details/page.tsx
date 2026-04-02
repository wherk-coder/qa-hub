"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, FileText, Target, TestTube, Monitor } from "lucide-react"
import Link from "next/link"

interface ProjectDetails {
  id: string
  name: string
  github_repo: string | null
  description: string | null
  goals: string | null
  test_scope: string | null
  environment: string | null
  created_at: string
}

export default function ProjectDetailsPage() {
  const params = useParams()
  const id = params.id as string
  const [project, setProject] = useState<ProjectDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(r => r.json())
      .then(data => { setProject(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-500">Project not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <Link
          href={`/project/${id}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Test Plan
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
          {project.github_repo && (
            <a
              href={`https://github.com/${project.github_repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              github.com/{project.github_repo}
            </a>
          )}
        </div>

        {/* Description */}
        {project.description && (
          <Section icon={<FileText className="w-5 h-5" />} title="About This Project">
            <p className="text-gray-300 leading-relaxed">{project.description}</p>
          </Section>
        )}

        {/* Goals */}
        {project.goals && (
          <Section icon={<Target className="w-5 h-5" />} title="Testing Goals">
            <div className="space-y-2">
              {project.goals.split('\n').map((line, i) => (
                <p key={i} className="text-gray-300 leading-relaxed">{line}</p>
              ))}
            </div>
          </Section>
        )}

        {/* Test Scope */}
        {project.test_scope && (
          <Section icon={<TestTube className="w-5 h-5" />} title="What to Test">
            <div className="space-y-2">
              {project.test_scope.split('\n').map((line, i) => (
                <p key={i} className="text-gray-300 leading-relaxed">{line}</p>
              ))}
            </div>
          </Section>
        )}

        {/* Environment */}
        {project.environment && (
          <Section icon={<Monitor className="w-5 h-5" />} title="Test Environment">
            <div className="space-y-2">
              {project.environment.split('\n').map((line, i) => (
                <p key={i} className="text-gray-300 leading-relaxed">{line}</p>
              ))}
            </div>
          </Section>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-800 text-center">
          <Link
            href={`/project/${id}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors"
          >
            Go to Test Plan →
          </Link>
        </div>
      </div>
    </div>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-amber-500">{icon}</div>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  )
}
