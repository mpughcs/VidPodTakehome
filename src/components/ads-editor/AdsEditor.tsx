import type { Episode } from "@/types/episode"

import { AdMarkersPanel } from "@/components/ads-editor/AdMarkersPanel"
import { TimelinePanel } from "@/components/ads-editor/TimelinePanel"
import { VideoPlayerPanel } from "@/components/ads-editor/VideoPlayerPanel"

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
        <button
          type="button"
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Ads
        </button>
        <h1 className="mt-2 max-w-4xl text-2xl font-semibold leading-tight text-slate-900 lg:text-3xl">
          {episode.title}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {episode.author} • {formatUploadDate(episode.uploadDate)}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <AdMarkersPanel />
        <VideoPlayerPanel />
      </div>

      <TimelinePanel />
    </div>
  )
}
