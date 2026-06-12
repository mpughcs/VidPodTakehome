import { IoIosTrendingDown, IoIosTrendingUp } from "react-icons/io"

type Delta = {
  direction: "up" | "down"
  label: string
}

const demo = {
  artist: "Sunday Mourners",
  windowLabel: "Last 28 days",
  stats: [
    { label: "Mentions", value: "12", delta: { direction: "up", label: "+3" } satisfies Delta },
    { label: "Outlets", value: "8", delta: { direction: "up", label: "+1" } satisfies Delta },
    { label: "Avg. sentiment", value: "87%", delta: { direction: "down", label: "−2%" } satisfies Delta },
  ],
  topOutlet: { name: "Bandcamp Daily", scoreLabel: "Score", score: 92 },
  highlights: [
    { label: "Feature reviews", value: "4" },
    { label: "Interviews", value: "2" },
    { label: "Playlists / radio", value: "3" },
  ],
  recent: [
    { outlet: "The Quietus", title: "Album Review: 8.5/10" },
    { outlet: "Tinnitist", title: "Albums Of The Week" },
    { outlet: "Add To Wantlist", title: "A-Rhythm Absolute" },
  ],
}

function MiniBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-text-invert/10">
      <div
        className="h-1.5 rounded-full bg-success"
        style={{ width: `${Math.max(6, Math.min(100, value))}%` }}
      />
    </div>
  )
}

function DeltaPill({ delta }: { delta: Delta }) {
  const isUp = delta.direction === "up"
  return (
    <div
      className={[
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
        isUp ? "bg-success/15 text-success" : "bg-text-invert/10 text-text-invert/70",
      ].join(" ")}
    >
      {isUp ? <IoIosTrendingUp className="h-3 w-3" /> : <IoIosTrendingDown className="h-3 w-3" />}
      <span>{delta.label}</span>
    </div>
  )
}

export function SpotifyEmbedWidget() {
  return (
    <div className="w-full  overflow-hidden rounded-2xl border border-text-invert/10 bg-surface-invert text-text-invert shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-text-invert/10 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-medium tracking-wide text-text-invert/60">Press insights</p>
          <p className="truncate text-sm font-semibold leading-tight">{demo.artist}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-text-invert/10 px-2 py-1 text-[10px] text-text-invert/70">
            {demo.windowLabel}
          </span>
          <div className="grid h-7 w-7 place-items-center rounded-full bg-text-invert/10">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-text-invert/80" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19V5m4 14V9m4 10V7m4 12v-6m4 6V11" />
            </svg>
          </div>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-3 gap-3 px-4 py-3">
        {demo.stats.map((s) => (
          <div key={s.label} className="min-w-0">
            <p className="text-[10px] text-text-invert/60">{s.label}</p>
            <div className="mt-1 flex items-end justify-between gap-2">
              <p className="text-base font-semibold leading-none">{s.value}</p>
              <DeltaPill delta={s.delta} />
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-text-invert/10" />

      {/* Top outlet module */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-text-invert/90">Top outlet</p>
          <p className="text-[10px] text-text-invert/60">{demo.topOutlet.scoreLabel}</p>
        </div>

        <div className="mt-2 flex items-center gap-3 justify-center">
          <img src="/images/bandcamp_logo.png" alt="Sunday Mourners" className="w h-10 w-10 shrink-0 rounded-xl m-2" />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{demo.topOutlet.name}</p>
            <div className="mt-1 flex items-center gap-2">
              <MiniBar value={demo.topOutlet.score} />
              <p className="w-8 text-right text-[10px] text-text-invert/60">{demo.topOutlet.score}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-text-invert/10" />

      {/* Highlights module */}
      <div className="px-4 py-3">
        <p className="text-xs font-semibold text-text-invert/90">Highlights</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {demo.highlights.map((h) => (
            <div key={h.label} className="rounded-xl bg-text-invert/5 p-2">
              <p className="text-base font-semibold leading-none">{h.value}</p>
              <p className="mt-1 text-[10px] leading-snug text-text-invert/60">{h.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-text-invert/10" />

      {/* Recent module */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-text-invert/90">Recent mentions</p>
          <p className="text-[10px] text-text-invert/60">Updated daily</p>
        </div>
        <div className="mt-2 space-y-2">
          {demo.recent.map((r) => (
            <div key={`${r.outlet}-${r.title}`} className="rounded-xl bg-text-invert/5 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-medium text-text-invert/80">{r.outlet}</p>
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
              </div>
              <p className="mt-0.5 line-clamp-1 text-xs text-text-invert/70">{r.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-text-invert/10 px-4 py-2">
        <p className="text-[10px] text-text-invert/50">Embed preview</p>
        <p className="text-[10px] font-medium text-text-invert/70">Powered by Clippings</p>
      </div>
    </div>
  )
}

