"use client"

import { openCreateEpisodeModal } from "@/components/workspace/CreateEpisodePrompt"
import { EpisodeDropdown } from "@/components/workspace/EpisodeDropdown"
import { useEpisodes } from "@/context/EpisodeContext"

export function WorkspaceSidebar() {
  const { activeEpisode } = useEpisodes()

  return (
    <ul className="flex min-h-full w-80 flex-col gap-2 border-r-2 border-slate-100 bg-base-200 p-4">
      <li>
        <button
          type="button"
          className="btn btn-primary w-full"
          onClick={openCreateEpisodeModal}
        >
          Create an episode
        </button>
      </li>
      {activeEpisode && <EpisodeDropdown />}
    </ul>
  )
}
