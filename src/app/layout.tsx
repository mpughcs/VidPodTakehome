import type { Metadata } from "next"
import { Inter, Lexend } from "next/font/google"
import clsx from "clsx"

import "@/styles/tailwind.css"
import "@/styles/globals.css"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: {
    template: "%s - VidPod",
    default: "VidPod - In browser video ad editor",
  },
  description:
    "VidPod is a platform for creating and editing videos with ease.",
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
      data-theme="vidpod"
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
