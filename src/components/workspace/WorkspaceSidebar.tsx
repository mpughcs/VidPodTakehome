"use client"

import { openCreateEpisodeModal } from "@/components/workspace/CreateEpisodePrompt"
import { EpisodeDropdown } from "@/components/workspace/EpisodeDropdown"
import { useUser } from "@/context/UserContext"
import { useRouter } from "next/navigation"
import {
  CiCircleQuestion,
  CiChat1,
  CiUser,
} from "react-icons/ci"

export function WorkspaceSidebar() {
  const { isAuthenticated, loading } = useUser()
  const router = useRouter()

  return (
    <aside className="flex w-[280px] shrink-0 flex-col border-r border-slate-200 bg-[#f7f7f7] px-4 py-5">
      <div className="flex flex-col gap-3">
        {loading ? (
          <button
            type="button"
            disabled
            className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white opacity-60"
          >
            Loading…
          </button>
        ) : isAuthenticated ? (
          <button
            type="button"
            className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
            onClick={openCreateEpisodeModal}
          >
            Create an episode
          </button>
        ) : (
          <button
            type="button"
            className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
            onClick={() => router.push("/login")}
          >
            Sign in
          </button>
        )}

        {isAuthenticated && <EpisodeDropdown />}
      </div>

      {isAuthenticated && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Weekly plays</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              738,849
            </span>
            <span className="text-sm font-semibold text-emerald-600">↑ 17%</span>
          </div>
          <div className="mt-3 h-12">
            <svg
              viewBox="0 0 120 40"
              className="h-full w-full text-emerald-500"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path
                d="M0 32 L20 28 L40 30 L60 18 L80 22 L100 8 L120 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="mt-2 flex justify-center gap-1">
            <span className="h-1.5 w-4 rounded-full bg-slate-900" />
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
          </div>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-1 pt-8">
        <label className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-sm text-slate-600">
          <span>Demo mode</span>
          <input type="checkbox" className="toggle toggle-sm" defaultChecked />
        </label>
        <button
          type="button"
          className="flex items-center gap-3 rounded-lg px-2 py-2 text-left text-sm text-slate-600 hover:bg-slate-200/50"
        >
          <CiUser className="text-xl" />
          Invite your team
        </button>
        <button
          type="button"
          className="flex items-center gap-3 rounded-lg px-2 py-2 text-left text-sm text-slate-600 hover:bg-slate-200/50"
        >
          <CiChat1 className="text-xl" />
          Give feedback
        </button>
        <button
          type="button"
          className="flex items-center gap-3 rounded-lg px-2 py-2 text-left text-sm text-slate-600 hover:bg-slate-200/50"
        >
          <CiCircleQuestion className="text-xl" />
          Help &amp; support
        </button>
      
      </div>
    </aside>
  )
}
