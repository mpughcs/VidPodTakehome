"use client"

import Link from "next/link"

import { AdMarkersPanel } from "@/components/ads-editor/AdMarkersPanel"
import { TimelinePanel } from "@/components/ads-editor/TimelinePanel"
import { VideoPlayerPanel } from "@/components/ads-editor/VideoPlayerPanel"
import type { Episode } from "@/types/episode"

type AdsEditorProps = {
  episode: Episode
}

function formatUploadDate(uploadDate: string) {
  const parsed = new Date(uploadDate)
  if (Number.isNaN(parsed.getTime())) return uploadDate
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function AdsEditor({ episode }: AdsEditorProps) {
  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <header>
        <Link
          href="/"
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          ← Ads
        </Link>
        <h1 className="mt-3 max-w-4xl text-2xl font-bold leading-tight tracking-tight text-slate-900 lg:text-[1.75rem] w-[500px]">
          {episode.title}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {episode.epNumber ? `Episode ${episode.epNumber}` : "Episode"}
          {" · "}
          {formatUploadDate(episode.uploadDate)}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(280px,1fr)_minmax(0,2.5fr)]">
        <AdMarkersPanel />
        <VideoPlayerPanel episode={episode} />
      </div>

      <TimelinePanel />
    </div>
  )
}
