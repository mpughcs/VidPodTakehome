"use client"

import { useState } from "react"
import { Redo2, Undo2, ZoomIn, ZoomOut } from "lucide-react"
import { formatTimeSimple, useTimelineContext } from "@twick/timeline"

import {
  TwickTimelineRenderer,
  TIMELINE_ZOOM_MAX,
  TIMELINE_ZOOM_MIN,
  TIMELINE_ZOOM_STEP,
} from "@/components/ads-editor/timeline/TwickTimelineRenderer"
import { useAdsTimeline } from "@/context/AdsTimelineContext"

function TimelineToolbar({
  zoom,
  onZoomChange,
}: {
  zoom: number
  onZoomChange: (zoom: number) => void
}) {
  const { canUndo, canRedo, editor } = useTimelineContext()

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!canUndo}
          onClick={() => editor.undo()}
          className="btn btn-ghost btn-sm gap-1 rounded-lg disabled:opacity-40"
        >
          <Undo2 className="h-4 w-4" />
          Undo
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={() => editor.redo()}
          className="btn btn-ghost btn-sm gap-1 rounded-lg disabled:opacity-40"
        >
          <Redo2 className="h-4 w-4" />
          Redo
        </button>
      </div>
      <TimelinePlayheadClock />
      <div className="flex items-center gap-2 text-slate-500">
        <button
          type="button"
          aria-label="Zoom out timeline"
          disabled={zoom <= TIMELINE_ZOOM_MIN}
          onClick={() =>
            onZoomChange(
              Math.max(TIMELINE_ZOOM_MIN, zoom - TIMELINE_ZOOM_STEP)
            )
          }
          className="btn btn-ghost btn-sm btn-square rounded-lg disabled:opacity-40"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="min-w-[4.5rem] text-center text-xs tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          aria-label="Zoom in timeline"
          disabled={zoom >= TIMELINE_ZOOM_MAX}
          onClick={() =>
            onZoomChange(
              Math.min(TIMELINE_ZOOM_MAX, zoom + TIMELINE_ZOOM_STEP)
            )
          }
          className="btn btn-ghost btn-sm btn-square rounded-lg disabled:opacity-40"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function TimelinePlayheadClock() {
  const { currentTime } = useAdsTimeline()

  return (
    <span className="font-mono text-lg font-medium text-slate-800">
      {formatTimeSimple(currentTime)}
    </span>
  )
}

export function TimelinePanel() {
  const { episodeDurationSeconds } = useAdsTimeline()
  const [zoom, setZoom] = useState(1)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <TimelineToolbar zoom={zoom} onZoomChange={setZoom} />
      <TwickTimelineRenderer
        durationSeconds={episodeDurationSeconds}
        zoom={zoom}
        onZoomChange={setZoom}
      />
    </div>
  )
}
