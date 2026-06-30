"use client"

import { useState, type ElementType } from "react"
import clsx from "clsx"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { IoIosArrowForward } from "react-icons/io"

import { openImportMp4Modal } from "@/components/ads-editor/ImportMp4Modal"
import {
  episodeNavItems,
  getEpisodeNavItemActive,
  type EpisodeNavItemId,
} from "@/components/workspace/episode-nav-items"
import { useEpisodes } from "@/context/EpisodeContext"

function navItemClassName(active: boolean) {
  return clsx(
    "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors focus-visible:outline-none",
    active
      ? "cursor-default font-bold text-slate-900"
      : "font-medium text-slate-500 hover:bg-slate-200/50"
  )
}

export function EpisodeDropdown() {
  const [open, setOpen] = useState(true)
  const pathname = usePathname()
  const { episodes } = useEpisodes()

  const activeEpisodeId = pathname.startsWith("/episodes/")
    ? pathname.split("/episodes/")[1]?.split("/")[0]
    : null
  const episodeId = activeEpisodeId ?? episodes[0]?.id ?? null

  function renderNavItem(id: EpisodeNavItemId, icon: ElementType, label: string) {
    const active = getEpisodeNavItemActive(id, pathname)
    const className = navItemClassName(active)

    if (id === "dashboard") {
      if (active) {
        return (
          <span aria-current="page" className={className}>
            <NavIcon icon={icon} active={active} />
            <span>{label}</span>
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
          <NavIcon icon={icon} active={active} />
          <span>{label}</span>
        </Link>
      )
    }

    if (id === "ads") {
      if (active || !episodeId) {
        return (
          <span aria-current={active ? "page" : undefined} className={className}>
            <NavIcon icon={icon} active={active} />
            <span>{label}</span>
          </span>
        )
      }

      return (
        <Link
          href={`/episodes/${episodeId}`}
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
          className={className}
        >
          <NavIcon icon={icon} active={active} />
          <span>{label}</span>
        </Link>
      )
    }

    if (id === "import") {
      return (
        <button
          type="button"
          tabIndex={open ? 0 : -1}
          onClick={() => {
            if (!episodeId) return
            setOpen(false)
            openImportMp4Modal(episodeId)
          }}
          className={clsx(className, "border-0 bg-transparent shadow-none")}
        >
          <NavIcon icon={icon} active={active} />
          <span>{label}</span>
        </button>
      )
    }

    return (
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        className={clsx(className, "border-0 bg-transparent shadow-none")}
      >
        <NavIcon icon={icon} active={active} />
        <span>{label}</span>
      </button>
    )
  }

  return (
    <div className="flex flex-col">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition-colors hover:bg-slate-50"
      >
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-slate-100">
          <img
            src="https://img.daisyui.com/images/profile/demo/batperson@192.webp"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
          The Diary Of A CEO
        </span>
        <IoIosArrowForward
          className={clsx(
            "shrink-0 text-slate-400 transition-transform duration-200",
            open && "rotate-90"
          )}
        />
      </button>

      <div
        className={clsx(
          "grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out",
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
            className="mt-2 flex list-none flex-col gap-0.5 pl-1"
          >
            {episodeNavItems.map(({ id, icon, label }) => (
              <li key={id}>{renderNavItem(id, icon, label)}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function NavIcon({ icon: Icon, active }: { icon: ElementType; active: boolean }) {
  return (
    <span
      className={clsx(
        "flex w-5 shrink-0 items-center justify-center",
        active ? "text-slate-900" : "text-slate-500"
      )}
    >
      <Icon className="text-xl" aria-hidden />
    </span>
  )
}
