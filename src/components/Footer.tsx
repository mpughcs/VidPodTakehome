import Link from "next/link"

import { Container } from "@/components/Container"
import { Logo } from "@/components/Logo"

export function Footer() {
  return (
    <footer className=" bg-[#fafafa]  border-t border-slate-200 pb-8">
      <Container className="flex justify-between">
        <p className="text-sm text-slate-500 my-auto">
          Video first podcasts
        </p>

        <div className="flex flex-col items-center py-6 sm:flex-row-reverse sm:justify-between">
          <div className="flex gap-x-6">

            <Logo className="h-4 w-4" />
          </div>

        </div>
      </Container>
    </footer>
  )
}

