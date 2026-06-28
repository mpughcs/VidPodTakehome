"use client"

import Link from "next/link"
import {
  Popover,
  PopoverBackdrop,
  PopoverButton,
  PopoverPanel,
} from "@headlessui/react"
import clsx from "clsx"
import type { ElementType, ReactNode } from "react"
import { CiBellOn, CiSettings } from "react-icons/ci"

import { Container } from "@/components/Container"
import { HeaderUserMenu } from "@/components/HeaderUserMenu"
import { Logo } from "@/components/Logo"
import { useUser } from "@/context/UserContext"

function HeaderIconDropdown({
  icon: Icon,
  label,
  children,
}: {
  icon: ElementType
  label: string
  children: ReactNode
}) {
  return (
    <div className="dropdown dropdown-end">
      <button
        type="button"
        tabIndex={0}
        aria-label={label}
        className="btn btn-ghost btn-sm btn-square rounded-lg text-slate-600 hover:bg-slate-100"
      >
        <Icon className="text-2xl" />
      </button>
      <div
        tabIndex={0}
        className="dropdown-content z-50 mt-2 w-72 rounded-xl border border-slate-100 bg-white p-0 shadow-lg"
      >
        {children}
      </div>
    </div>
  )
}

function NotificationsDropdown() {
  return (
    <HeaderIconDropdown icon={CiBellOn} label="Notifications">
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="font-semibold text-slate-900">Notifications</p>
        <p className="mt-0.5 text-xs text-slate-500">Recent activity</p>
      </div>
      <ul className="menu p-2">
        <li>
          <button type="button" className="flex flex-col items-start gap-0.5 py-2">
            <span className="text-sm font-medium text-slate-900">
              Episode export ready
            </span>
            <span className="text-xs text-slate-500">2 hours ago</span>
          </button>
        </li>
        <li>
          <button type="button" className="flex flex-col items-start gap-0.5 py-2">
            <span className="text-sm font-medium text-slate-900">
              New ad marker saved
            </span>
            <span className="text-xs text-slate-500">Yesterday</span>
          </button>
        </li>
        <li className="border-t border-slate-100 pt-1">
          <button type="button" className="text-sm text-slate-500">
            View all notifications
          </button>
        </li>
      </ul>
    </HeaderIconDropdown>
  )
}

function SettingsDropdown() {
  return (
    <HeaderIconDropdown icon={CiSettings} label="Settings">
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="font-semibold text-slate-900">Settings</p>
        <p className="mt-0.5 text-xs text-slate-500">Workspace & account</p>
      </div>
      <ul className="menu p-2">
        <li>
          <button type="button">Workspace preferences</button>
        </li>
        <li>
          <button type="button">Notification settings</button>
        </li>
        <li>
          <button type="button">Billing & plan</button>
        </li>
        <li className="border-t border-slate-100 pt-1">
          <button type="button">Help & support</button>
        </li>
      </ul>
    </HeaderIconDropdown>
  )
}

function MobileNavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <PopoverButton as={Link} href={href} className="block w-full p-2">
      {children}
    </PopoverButton>
  )
}

function MobileNavIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5 overflow-visible stroke-text-secondary"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path
        d="M0 1H14M0 7H14M0 13H14"
        className={clsx("origin-center transition", open && "scale-90 opacity-0")}
      />
      <path
        d="M2 2L12 12M12 2L2 12"
        className={clsx(
          "origin-center transition",
          !open && "scale-90 opacity-0"
        )}
      />
    </svg>
  )
}

function MobileNavigation() {
  const { isAuthenticated, email, displayName, logout } = useUser()

  return (
    <Popover>
      <PopoverButton
        className="relative z-10 flex h-8 w-8 items-center justify-center focus:not-data-focus:outline-hidden"
        aria-label="Toggle Navigation"
      >
        {({ open }) => <MobileNavIcon open={open} />}
      </PopoverButton>
      <PopoverBackdrop
        transition
        className="fixed inset-0 bg-border-strong/50 duration-150 data-closed:opacity-0 data-enter:ease-out data-leave:ease-in"
      />
      <PopoverPanel
        transition
        className="absolute inset-x-0 top-full mt-4 flex origin-top flex-col rounded-2xl bg-surface p-4 text-lg tracking-tight text-text-primary ring-1 shadow-xl ring-surface-invert/5 data-closed:scale-95 data-closed:opacity-0 data-enter:duration-150 data-enter:ease-out data-leave:duration-100 data-leave:ease-in"
      >
        {isAuthenticated ? (
          <>
            <div className="mb-2 px-2 py-1 text-sm text-slate-500">
              <p className="font-semibold text-slate-900">
                {displayName || "Account"}
              </p>
              {email && <p className="truncate">{email}</p>}
            </div>
            <button
              type="button"
              className="block w-full p-2 text-left"
              onClick={() => logout()}
            >
              Sign out
            </button>
          </>
        ) : (
          <MobileNavLink href="/login">Sign in</MobileNavLink>
        )}
      </PopoverPanel>
    </Popover>
  )
}

export function Header() {
  return (
    <header className="border-b-2 pb-4 pt-10">
      <Container>
        <nav className="relative flex justify-between font-lexend">
          <div className="flex items-center md:gap-x-12">
            <Link href="/" aria-label="Home">
              <Logo className="h-10 w-auto" />
            </Link>
          </div>
          <div className="hidden items-center gap-x-5 md:flex md:gap-x-8">
            <div className="flex items-center gap-2">
              <SettingsDropdown />
              <NotificationsDropdown />
              <HeaderUserMenu />
            </div>
          </div>
          <div className="-mr-1 md:hidden">
            <MobileNavigation />
          </div>
        </nav>
      </Container>
    </header>
  )
}
