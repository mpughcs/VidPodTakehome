"use client"

import Link from "next/link"
import {
  Popover,
  PopoverBackdrop,
  PopoverButton,
  PopoverPanel,
} from "@headlessui/react"
import clsx from "clsx"

import { Button } from "@/components/Button"
import { Container } from "@/components/Container"
import { Logo } from "@/components/Logo"
import { NavLink } from "@/components/NavLink"
import { CiSettings, CiBellOn } from "react-icons/ci";


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
        <MobileNavLink href="#features">Features</MobileNavLink>
        <MobileNavLink href="#testimonials">Testimonials</MobileNavLink>
        <MobileNavLink href="#pricing">Pricing</MobileNavLink>
        <hr className="m-2 border-border-strong/40" />
        <MobileNavLink href="/login">Sign in</MobileNavLink>
      </PopoverPanel>
    </Popover>
  )
}

export function Header() {
  return (
    <header className="pt-10 pb-4 border-b-2">
      <Container>
        <nav className="relative z-50 flex justify-between font-lexend">
          <div className="flex items-center md:gap-x-12">
            <Link href="#" aria-label="Home">
              <Logo className="h-10 w-auto" />
            </Link>

          </div>
          <div className="md:flex hidden items-center gap-x-5 md:gap-x-8">

            <div className="flex items-center gap-6">
              <CiSettings className="text-2xl" />
              <CiBellOn className="text-2xl" />
              <button className="btn bg-white text-black border-[#e5e5e5]">
                <svg aria-label="Email icon" width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" fill="none" stroke="black"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></g></svg>
                Login with Email
              </button>
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
