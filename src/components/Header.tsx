"use client"

import Link from "next/link"
import {
  Popover,
  PopoverBackdrop,
  PopoverButton,
  PopoverPanel,
} from "@headlessui/react"
import clsx from "clsx"
import { CiBellOn, CiSettings } from "react-icons/ci"

import { Container } from "@/components/Container"
import { HeaderUserMenu } from "@/components/HeaderUserMenu"
import { Logo } from "@/components/Logo"
import { useUser } from "@/context/UserContext"

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
            <div className="flex items-center gap-6">
              <CiSettings className="text-2xl" />
              <CiBellOn className="text-2xl" />
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
