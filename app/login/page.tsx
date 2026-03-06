"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase-client"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const supabase = createSupabaseClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      router.push("/")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center mb-3">
            <span className="text-white font-bold text-xl">Q</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">QA Hub</h1>
          <p className="text-amber-600/80 text-sm font-medium mt-0.5">by Wherk AI</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6">
          <h2 className="text-base font-semibold text-white mb-1">Sign in</h2>
          <p className="text-gray-500 text-sm mb-5">Enter your credentials to access QA Hub</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm text-gray-400 font-medium" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full h-10 px-3 rounded-lg bg-[#1a1a1a] border border-white/10 text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-amber-600/60 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-gray-400 font-medium" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full h-10 px-3 rounded-lg bg-[#1a1a1a] border border-white/10 text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-amber-600/60 transition-colors"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          QA Hub · testing.wherk.com
        </p>
      </div>
    </div>
  )
}
