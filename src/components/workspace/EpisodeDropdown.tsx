"use client"

import { useState } from "react"
import clsx from "clsx"
import { IoIosArrowForward } from "react-icons/io"

import {
  ImportMp4Modal,
  openImportMp4Modal,
} from "@/components/ads-editor/ImportMp4Modal"
import { episodeNavItems } from "@/components/workspace/episode-nav-items"
import { useEpisodes } from "@/context/EpisodeContext"

export function EpisodeDropdown() {
  const [open, setOpen] = useState(false)
  const { activeEpisode, episodes, selectEpisode } = useEpisodes()

  if (!activeEpisode) return null

  return (
    <li className="relative w-full hover:bg-transparent">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="relative z-10 btn btn-outline w-full justify-around border-slate-100 bg-white"
      >
        <div className="h-8 w-8 overflow-hidden rounded-sm">
          <img src={activeEpisode.thumbnail} alt="" />
        </div>
        <span className="truncate">{activeEpisode.title}</span>
        <IoIosArrowForward
          className={clsx(
            "relative shrink-0 transition-transform duration-200",
            open && "rotate-90"
          )}
        />
      </button>

      {episodes.length > 1 && open && (
        <ul className="mt-2 flex flex-col gap-1 px-3">
          {episodes
            .filter((episode) => episode.id !== activeEpisode.id)
            .map((episode) => (
              <li key={episode.id}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm w-full justify-start gap-2 rounded-lg border border-slate-100 bg-white"
                  onClick={() => {
                    selectEpisode(episode.id)
                    setOpen(false)
                  }}
                >
                  <img
                    src={episode.thumbnail}
                    alt=""
                    className="h-6 w-6 rounded-sm object-cover"
                  />
                  <span className="truncate text-sm">{episode.title}</span>
                </button>
              </li>
            ))}
        </ul>
      )}

      <div
        className={clsx(
          "relative z-0 grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out",
          "mask-[linear-gradient(to_bottom,transparent,black_0.75rem)]",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div
          className={clsx(
            "min-h-0 overflow-hidden transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0"
          )}
        >
          <ul
            aria-hidden={!open}
            className="flex list-none flex-col gap-2 bg-transparent p-0 px-3 pt-2"
            style={{ scrollbarWidth: "none" }}
          >
            {episodeNavItems.map(({ icon: Icon, label, active }) => (
              <li key={label}>
                <button
                  type="button"
                  tabIndex={open ? 0 : -1}
                  onClick={() => {
                    if (label === "Import") openImportMp4Modal()
                  }}
                  className={clsx(
                    "relative left-16 flex w-full items-center gap-3 rounded-lg border-0 bg-transparent px-2 py-1.5 text-left shadow-none transition-colors hover:bg-slate-200/60 focus-visible:outline-none",
                    active
                      ? "font-bold text-slate-900"
                      : "font-bold text-slate-500"
                  )}
                >
                  <span className="flex w-6 shrink-0 items-center justify-center">
                    <Icon className="text-2xl" />
                  </span>
                  <span className="text-base leading-none">{label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <ImportMp4Modal />
    </li>
  )
}
