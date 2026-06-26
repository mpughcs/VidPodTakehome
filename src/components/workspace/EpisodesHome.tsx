"use client"

import Link from "next/link"

import { openCreateEpisodeModal } from "@/components/workspace/CreateEpisodePrompt"
import { useEpisodes } from "@/context/EpisodeContext"

function formatUploadDate(uploadDate: string) {
  const parsed = new Date(uploadDate)
  if (Number.isNaN(parsed.getTime())) return uploadDate
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function EpisodesHome() {
  const { episodes, isLoading, error } = useEpisodes()

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            The Diary Of A CEO
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 lg:text-3xl">
            Episodes
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            All team members can create and open episodes for this channel.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary rounded-xl"
          onClick={openCreateEpisodeModal}
        >
          Create episode +
        </button>
      </header>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-400">Loading episodes…</p>
      ) : episodes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <p className="text-slate-500">No episodes yet.</p>
          <button
            type="button"
            className="btn btn-primary btn-sm mt-4 rounded-xl"
            onClick={openCreateEpisodeModal}
          >
            Create the first episode
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {episodes.map((episode) => (
            <li key={episode.id}>
              <Link
                href={`/episodes/${episode.id}`}
                className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
              >
                <img
                  src={episode.thumbnail}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">
                    {episode.title}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {formatUploadDate(episode.uploadDate)}
                    {episode.description ? ` · ${episode.description}` : ""}
                  </p>
                </div>
                <span className="text-sm text-slate-400">Open →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
