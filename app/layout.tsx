import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import HeaderAuth from "@/components/HeaderAuth"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "QA Hub — by Wherk AI",
  description: "Manual QA testing tool with GitHub issue integration",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased min-h-screen bg-[#0a0a0a]`}>
        <header className="border-b border-white/10 bg-[#0d0d0d] sticky top-0 z-50">
          <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center gap-3">
            <a href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-amber-600 flex items-center justify-center text-white font-bold text-sm">
                Q
              </div>
              <div>
                <span className="font-bold text-white tracking-tight">QA Hub</span>
                <span className="ml-1.5 text-xs text-amber-600/80 font-medium">by Wherk AI</span>
              </div>
            </a>
            <HeaderAuth />
          </div>
        </header>
        <main className="max-w-[1600px] mx-auto px-4 py-6">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  )
}
