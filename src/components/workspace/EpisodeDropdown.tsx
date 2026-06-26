"use client"

import { useState } from "react"
import clsx from "clsx"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { IoIosArrowForward } from "react-icons/io"

import {
  openImportMp4Modal,
} from "@/components/ads-editor/ImportMp4Modal"
import { episodeNavItems } from "@/components/workspace/episode-nav-items"
import { useEpisodes } from "@/context/EpisodeContext"

export function EpisodeDropdown() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { episodes } = useEpisodes()

  const activeEpisodeId = pathname.startsWith("/episodes/")
    ? pathname.split("/episodes/")[1]?.split("/")[0]
    : null

  return (
    <li className="relative w-full hover:bg-transparent">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="relative z-10 btn btn-outline w-full justify-around border-slate-100 bg-white"
      >
        <div className="h-8 w-8 overflow-hidden rounded-sm">
          <img
            src="https://img.daisyui.com/images/profile/demo/batperson@192.webp"
            alt=""
          />
        </div>
        <span className="truncate">The Diary Of A CEO</span>
        <IoIosArrowForward
          className={clsx(
            "relative shrink-0 transition-transform duration-200",
            open && "rotate-90"
          )}
        />
      </button>

      <div
        className={clsx(
          "relative z-0 grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div
          className={clsx(
            "min-h-0 overflow-hidden transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="px-3 pt-3">
            

            <ul
              aria-hidden={!open}
              className="flex list-none flex-col gap-2"
              style={{ scrollbarWidth: "none" }}
            >
              {episodeNavItems.map(({ icon: Icon, label }) => (
                <li key={label}>
                  {label === "Dashboard" ? (
                    <Link
                      href="/"
                      tabIndex={open ? 0 : -1}
                      onClick={() => setOpen(false)}
                      className="relative left-16 flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left font-bold text-slate-500 transition-colors hover:bg-slate-200/60 focus-visible:outline-none"
                    >
                      <span className="flex w-6 shrink-0 items-center justify-center">
                        <Icon className="text-2xl" />
                      </span>
                      <span className="text-base leading-none">{label}</span>
                    </Link>
                  ) : label === "Ads" && activeEpisodeId ? (
                    <Link
                      href={`/episodes/${activeEpisodeId}`}
                      tabIndex={open ? 0 : -1}
                      onClick={() => setOpen(false)}
                      className="relative left-16 flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left font-bold text-slate-900 transition-colors hover:bg-slate-200/60 focus-visible:outline-none"
                    >
                      <span className="flex w-6 shrink-0 items-center justify-center">
                        <Icon className="text-2xl" />
                      </span>
                      <span className="text-base leading-none">{label}</span>
                    </Link>
                  ) : label === "Import" ? (
                    <button
                      type="button"
                      tabIndex={open ? 0 : -1}
                      disabled={episodes.length === 0}
                      onClick={() => {
                        setOpen(false)
                        openImportMp4Modal(activeEpisodeId ?? undefined)
                      }}
                      className={clsx(
                        "relative left-16 flex w-full items-center gap-3 rounded-lg border-0 bg-transparent px-2 py-1.5 text-left font-bold shadow-none transition-colors focus-visible:outline-none",
                        episodes.length > 0
                          ? "text-slate-500 hover:bg-slate-200/60"
                          : "cursor-not-allowed text-slate-300"
                      )}
                    >
                      <span className="flex w-6 shrink-0 items-center justify-center">
                        <Icon className="text-2xl" />
                      </span>
                      <span className="text-base leading-none">{label}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      tabIndex={open ? 0 : -1}
                      className="relative left-16 flex w-full items-center gap-3 rounded-lg border-0 bg-transparent px-2 py-1.5 text-left font-bold text-slate-500 shadow-none transition-colors hover:bg-slate-200/60 focus-visible:outline-none"
                    >
                      <span className="flex w-6 shrink-0 items-center justify-center">
                        <Icon className="text-2xl" />
                      </span>
                      <span className="text-base leading-none">{label}</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </li>
  )
}
