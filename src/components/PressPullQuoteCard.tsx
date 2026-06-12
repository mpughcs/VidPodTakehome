import { type ReactNode } from "react"

export type PressPullQuoteCardProps = {
  quote: ReactNode
  source?: ReactNode
  className?: string
}

/**
 * Reusable "glass" pull-quote card (trailers/poster-style).
 * Not currently used by default in `SlimLayout`, but kept for reuse elsewhere.
 */
export function PressPullQuoteCard({ quote, source, className }: PressPullQuoteCardProps) {
  return (
    <figure
      className={[
        "rounded-xl bg-black/35 px-4 py-3",
        "backdrop-blur-sm ring-1 ring-white/15 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.7)]",
        className ?? "",
      ].join(" ")}
    >
      <blockquote className="text-pretty text-sm font-semibold leading-snug text-white drop-shadow">
        “{quote}”
      </blockquote>
      {source ? (
        <figcaption className="mt-2 text-xs font-medium tracking-wide text-white/80">
          — {source}
        </figcaption>
      ) : null}
    </figure>
  )
}

