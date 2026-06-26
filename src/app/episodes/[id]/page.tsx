"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import { AdsEditor } from "@/components/ads-editor/AdsEditor"
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell"
import { AdsTimelineProvider } from "@/context/AdsTimelineContext"
import { useEpisodes } from "@/context/EpisodeContext"

function EpisodeEditorContent() {
  const params = useParams()
  const episodeId = params.id as string
  const { getEpisodeById, isLoading, error } = useEpisodes()

  const episode = getEpisodeById(episodeId)

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center text-sm text-slate-400">
        Loading episode…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <Link href="/" className="btn btn-sm btn-outline">
          Back to episodes
        </Link>
      </div>
    )
  }

  if (!episode) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-slate-600">Episode not found.</p>
        <Link href="/" className="btn btn-sm btn-outline">
          Back to episodes
        </Link>
      </div>
    )
  }

  return (
    <AdsTimelineProvider
      key={episode.id}
      episodeId={episode.id}
      episodeTitle={episode.title}
      episodeDurationSeconds={episode.duration}
    >
      <AdsEditor episode={episode} />
    </AdsTimelineProvider>
  )
}

export default function EpisodePage() {
  return (
    <WorkspaceShell>
      <EpisodeEditorContent />
    </WorkspaceShell>
  )
}
