"use client"

import { useState } from "react"
import clsx from "clsx"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IoIosArrowForward } from "react-icons/io"
import { CiUser, CiLogout } from "react-icons/ci"

import { useUser } from "@/context/UserContext"

const DEFAULT_AVATAR =
  "https://img.daisyui.com/images/profile/demo/batperson@192.webp"

export function HeaderUserMenu() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { user, email, displayName, isAuthenticated, loading, logout } =
    useUser()

  const label = isAuthenticated
    ? displayName || email || "Account"
    : "Sign in"

  async function handleSignOut() {
    await logout()
    setOpen(false)
    router.push("/")
  }

  if (loading) {
    return (
      <button
        type="button"
        disabled
        className="btn btn-outline justify-around border-slate-100 bg-white opacity-60"
      >
        <span className="text-sm">Loading…</span>
      </button>
    )
  }

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="btn btn-outline justify-around gap-2 border-slate-100 bg-white"
      >
        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-sm bg-slate-100">
          <CiUser className="text-xl text-slate-500" />
        </div>
        <span className="max-w-40 truncate text-sm">Sign in</span>
      </Link>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="relative z-10 btn btn-outline justify-around gap-2 border-slate-100 bg-white"
      >
        <div className="h-8 w-8 overflow-hidden rounded-sm">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" />
          ) : (
            <img src={DEFAULT_AVATAR} alt="" />
          )}
        </div>
        <span className="max-w-40 truncate text-sm">{label}</span>
        <IoIosArrowForward
          className={clsx(
            "relative shrink-0 transition-transform duration-200",
            open && "rotate-90"
          )}
        />
      </button>

      <div
        className={clsx(
          "absolute right-0 top-full z-50 mt-2 grid w-56 overflow-hidden transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div
          className={clsx(
            "min-h-0 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0"
          )}
        >
          <ul
            aria-hidden={!open}
            className="flex list-none flex-col gap-1 p-2"
          >
            <li>
              <div
                tabIndex={open ? 0 : -1}
                className="flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-left"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Account info
                </span>
                {displayName && (
                  <span className="text-sm font-bold text-slate-900">
                    {displayName}
                  </span>
                )}
                {email && (
                  <span className="truncate text-sm text-slate-500">{email}</span>
                )}
              </div>
            </li>
            <li>
              <button
                type="button"
                tabIndex={open ? 0 : -1}
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg border-0 bg-transparent px-3 py-2 text-left font-bold text-slate-500 shadow-none transition-colors hover:bg-slate-200/60 focus-visible:outline-none"
              >
                <span className="flex w-6 shrink-0 items-center justify-center">
                  <CiLogout className="text-2xl" />
                </span>
                <span className="text-base leading-none">Sign out</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
