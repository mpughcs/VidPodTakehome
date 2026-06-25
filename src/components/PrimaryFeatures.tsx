"use client"

import { AdsEditor } from "@/components/ads-editor/AdsEditor"
import {
  CreateEpisodeModal,
  CreateEpisodePrompt,
} from "@/components/workspace/CreateEpisodePrompt"
import { SignInPrompt } from "@/components/workspace/SignInPrompt"
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout"
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar"
import { AdsTimelineProvider } from "@/context/AdsTimelineContext"
import { EpisodeProvider, useEpisodes } from "@/context/EpisodeContext"
import { useUser } from "@/context/UserContext"

function WorkspaceContent() {
  const { isAuthenticated, loading: authLoading } = useUser()
  const { activeEpisode, isLoading } = useEpisodes()

  if (authLoading || (isAuthenticated && isLoading)) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center text-sm text-slate-400">
        Loading workspace…
      </div>
    )
  }

  if (!isAuthenticated) {
    return <SignInPrompt />
  }

  if (!activeEpisode) {
    return <CreateEpisodePrompt />
  }

  return <AdsEditor episode={activeEpisode} />
}

function WorkspaceShell() {
  const { isAuthenticated, loading: authLoading } = useUser()
  const { activeEpisode, isLoading } = useEpisodes()

  if (authLoading || (isAuthenticated && isLoading)) {
    return (
      <section
        id="features"
        aria-label="Podcast workspace"
        className="relative overflow-hidden"
      >
        <WorkspaceLayout sidebar={<WorkspaceSidebar />}>
          <WorkspaceContent />
        </WorkspaceLayout>
      </section>
    )
  }

  if (!isAuthenticated || !activeEpisode) {
    return (
      <section
        id="features"
        aria-label="Podcast workspace"
        className="relative overflow-hidden"
      >
        <WorkspaceLayout sidebar={<WorkspaceSidebar />}>
          <WorkspaceContent />
        </WorkspaceLayout>
      </section>
    )
  }

  return (
    <AdsTimelineProvider
      key={activeEpisode.id}
      episodeId={activeEpisode.id}
      episodeTitle={activeEpisode.title}
      episodeDurationSeconds={activeEpisode.duration}
    >
      <section
        id="features"
        aria-label="Podcast workspace"
        className="relative overflow-hidden"
      >
        <WorkspaceLayout sidebar={<WorkspaceSidebar />}>
          <WorkspaceContent />
        </WorkspaceLayout>
      </section>
    </AdsTimelineProvider>
  )
}

function CreateEpisodeModalWrapper() {
  const { createEpisode } = useEpisodes()
  return <CreateEpisodeModal onSubmit={createEpisode} />
}

export function PrimaryFeatures() {
  return (
    <EpisodeProvider>
      <CreateEpisodeModalWrapper />
      <WorkspaceShell />
    </EpisodeProvider>
  )
}
