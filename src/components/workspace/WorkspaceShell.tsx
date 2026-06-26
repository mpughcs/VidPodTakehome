"use client"

import { useRouter } from "next/navigation"
import type { ReactNode } from "react"

import { CreateEpisodeModalHost } from "@/components/workspace/CreateEpisodePrompt"
import { SignInPrompt } from "@/components/workspace/SignInPrompt"
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout"
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar"
import { EpisodeProvider } from "@/context/EpisodeContext"
import { useUser } from "@/context/UserContext"

function WorkspaceGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useUser()

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center text-sm text-slate-400">
        Loading…
      </div>
    )
  }

  if (!isAuthenticated) {
    return <SignInPrompt />
  }

  return <>{children}</>
}

export function WorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <EpisodeProvider>
      <CreateEpisodeModalHost />
      <section
        id="features"
        aria-label="Podcast workspace"
        className="relative overflow-hidden"
      >
        <WorkspaceLayout sidebar={<WorkspaceSidebar />}>
          <WorkspaceGate>{children}</WorkspaceGate>
        </WorkspaceLayout>
      </section>
    </EpisodeProvider>
  )
}

export function useEpisodeEditorRedirect() {
  const router = useRouter()
  return (episodeId: string) => router.push(`/episodes/${episodeId}`)
}
