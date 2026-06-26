"use client"

import { openCreateEpisodeModal } from "@/components/workspace/CreateEpisodePrompt"
import { EpisodeDropdown } from "@/components/workspace/EpisodeDropdown"
import { useUser } from "@/context/UserContext"
import { useRouter } from "next/navigation"

export function WorkspaceSidebar() {
  const { isAuthenticated, loading } = useUser()
  const router = useRouter()

  return (
    <ul className="flex min-h-full w-80 flex-col gap-2 border-r-2 border-slate-100 bg-base-200 p-4">
      <li>
        {loading ? (
          <div className="btn btn-primary w-full pointer-events-none opacity-60">
            Loading…
          </div>
        ) : isAuthenticated ? (
          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={openCreateEpisodeModal}
          >
            Create an episode
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={() => router.push("/login")}
          >
            Sign in
          </button>
        )}
      </li>
      {isAuthenticated && <EpisodeDropdown />}
    </ul>
  )
}
