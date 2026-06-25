"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import clsx from "clsx"
import {
  formatTimeSimple,
  useTimelineContext,
  type ElementJSON,
  type TrackJSON,
} from "@twick/timeline"

import { episodeDurationSeconds } from "@/components/ads-editor/timeline/episode-timeline-data"

const ELEMENT_COLORS: Record<string, string> = {
  episode: "bg-violet-300",
  auto: "bg-emerald-400",
  static: "bg-sky-400",
  ab: "bg-amber-400",
}

function getElementColor(element: ElementJSON) {
  const role = element.props?.role as string | undefined
  const adMode = element.props?.adMode as string | undefined
  return ELEMENT_COLORS[adMode ?? role ?? element.type] ?? "bg-slate-400"
}

function getElementLabel(element: ElementJSON) {
  if (element.props?.adMode === "static") return "S"
  if (element.props?.adMode === "ab") return "A/B"
  if (element.props?.adMode === "auto") return "A"
  return element.name ?? element.type
}

type TwickTimelineRendererProps = {
  durationSeconds?: number
  initialPlayheadSeconds?: number
}

export function TwickTimelineRenderer({
  durationSeconds = episodeDurationSeconds,
  initialPlayheadSeconds = 179,
}: TwickTimelineRendererProps) {
  const { present } = useTimelineContext()
  const trackRef = useRef<HTMLDivElement>(null)
  const [playhead, setPlayhead] = useState(initialPlayheadSeconds)
  const [zoom, setZoom] = useState(1)

  const tracks = present?.tracks ?? []
  const visibleDuration = durationSeconds / zoom

  const timeLabels = useMemo(() => {
    const interval = visibleDuration <= 120 ? 30 : 60
    const labels: number[] = []
    for (let t = 0; t <= visibleDuration; t += interval) {
      labels.push(t)
    }
    return labels
  }, [visibleDuration])

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
      setPlayhead(ratio * visibleDuration)
    },
    [visibleDuration]
  )

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
      <div
        ref={trackRef}
        className="relative cursor-pointer"
        onClick={(e) => seekFromClientX(e.clientX)}
        role="presentation"
      >
        <div className="space-y-1 p-2">
          {tracks.map((track) => (
            <TimelineTrackRow
              key={track.id}
              track={track}
              durationSeconds={visibleDuration}
            />
          ))}
        </div>

        <Playhead playhead={playhead} durationSeconds={visibleDuration} />
      </div>

      <div className="flex justify-between border-t border-slate-100 px-3 py-2 font-mono text-xs text-slate-400">
        {timeLabels.map((seconds) => (
          <span key={seconds}>{formatTimeSimple(seconds)}</span>
        ))}
      </div>

      <div className="px-3 pb-3">
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.25}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="range range-xs w-full"
          aria-label="Timeline zoom"
        />
      </div>

      <div className="border-t border-slate-100 px-3 py-2 text-center font-mono text-sm text-slate-700">
        {formatTimeSimple(playhead)}
      </div>
    </div>
  )
}

function TimelineTrackRow({
  track,
  durationSeconds,
}: {
  track: TrackJSON
  durationSeconds: number
}) {
  const isEpisode = track.elements.some((el) => el.props?.role === "episode")

  return (
    <div className="relative h-14 overflow-hidden rounded-lg bg-white/60">
     

      {track.elements.map((element) => {
        const left = (element.s / durationSeconds) * 100
        const width = ((element.e - element.s) / durationSeconds) * 100

        return (
          <div
            key={element.id}
            className={clsx(
              "absolute bottom-0 top-0 flex items-start justify-center rounded-t pt-1 text-xs font-bold text-white shadow-sm",
              getElementColor(element)
            )}
            style={{ left: `${left}%`, width: `${Math.max(width, 1)}%` }}
            title={`${element.name} (${formatTimeSimple(element.s)} – ${formatTimeSimple(element.e)})`}
          >
            {getElementLabel(element)}
          </div>
        )
      })}
    </div>
  )
}

function Playhead({
  playhead,
  durationSeconds,
}: {
  playhead: number
  durationSeconds: number
}) {
  const left = (playhead / durationSeconds) * 100

  return (
    <div
      className="pointer-events-none absolute bottom-0 top-0 z-10 w-0.5 bg-red-500"
      style={{ left: `${left}%` }}
    >
      <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-red-500" />
    </div>
  )
}
