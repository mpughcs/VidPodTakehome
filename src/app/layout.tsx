import type { Metadata } from "next"
import { Inter, Lexend } from "next/font/google"
import clsx from "clsx"

import "@/styles/tailwind.css"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: {
    template: "%s - Clippings",
    default: "Clippings - All your press, one place",
  },
  description:
    "Most bookkeeping software is accurate, but hard to use. We make the opposite trade-off, and hope you don’t get audited.",
}

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const lexend = Lexend({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lexend",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      data-theme=""
      className={clsx(
        "h-full scroll-smooth bg-surface antialiased",
        inter.variable,
        lexend.variable
      )}
    >
      <body className="flex h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
