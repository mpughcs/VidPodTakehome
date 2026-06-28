"use client"

import { useState, type ElementType } from "react"
import clsx from "clsx"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { IoIosArrowForward } from "react-icons/io"

import { openImportMp4Modal } from "@/components/ads-editor/ImportMp4Modal"
import {
  episodeNavItems,
  getEpisodeNavItemState,
  type EpisodeNavItemId,
} from "@/components/workspace/episode-nav-items"
import { useEpisodes } from "@/context/EpisodeContext"

function navItemClassName(enabled: boolean, active: boolean) {
  return clsx(
    "relative left-16 flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left font-bold transition-colors focus-visible:outline-none",
    active
      ? "cursor-default text-slate-900"
      : enabled
        ? "text-slate-500 hover:bg-slate-200/60"
        : "cursor-not-allowed text-slate-300"
  )
}

export function EpisodeDropdown() {
  const [open, setOpen] = useState(true)
  const pathname = usePathname()
  const { episodes } = useEpisodes()

  const activeEpisodeId = pathname.startsWith("/episodes/")
    ? pathname.split("/episodes/")[1]?.split("/")[0]
    : null

  function renderNavItem(id: EpisodeNavItemId, icon: ElementType, label: string) {
    const { enabled, active } = getEpisodeNavItemState(
      id,
      pathname,
      episodes.length > 0
    )
    const className = navItemClassName(enabled, active)

    if (id === "dashboard") {
      if (!enabled) {
        return (
          <span aria-current={active ? "page" : undefined} className={className}>
            <NavIcon icon={icon} />
            <span className="text-base leading-none">{label}</span>
          </span>
        )
      }

      return (
        <Link
          href="/"
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
          className={className}
        >
          <NavIcon icon={icon} />
          <span className="text-base leading-none">{label}</span>
        </Link>
      )
    }

    if (id === "ads") {
      if (!enabled || !activeEpisodeId) {
        return (
          <span aria-current={active ? "page" : undefined} className={className}>
            <NavIcon icon={icon} />
            <span className="text-base leading-none">{label}</span>
          </span>
        )
      }

      return (
        <Link
          href={`/episodes/${activeEpisodeId}`}
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
          className={className}
        >
          <NavIcon icon={icon} />
          <span className="text-base leading-none">{label}</span>
        </Link>
      )
    }

    if (id === "import") {
      return (
        <button
          type="button"
          tabIndex={open ? 0 : -1}
          disabled={!enabled}
          onClick={() => {
            if (!enabled || !activeEpisodeId) return
            setOpen(false)
            openImportMp4Modal(activeEpisodeId)
          }}
          className={clsx(className, "border-0 bg-transparent shadow-none")}
        >
          <NavIcon icon={icon} />
          <span className="text-base leading-none">{label}</span>
        </button>
      )
    }

    return (
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        disabled={!enabled}
        className={clsx(className, "border-0 bg-transparent shadow-none")}
      >
        <NavIcon icon={icon} />
        <span className="text-base leading-none">{label}</span>
      </button>
    )
  }

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
              {episodeNavItems.map(({ id, icon, label }) => (
                <li key={id}>{renderNavItem(id, icon, label)}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </li>
  )
}

function NavIcon({ icon: Icon }: { icon: ElementType }) {
  return (
    <span className="flex w-6 shrink-0 items-center justify-center">
      <Icon className="text-2xl" />
    </span>
  )
}
