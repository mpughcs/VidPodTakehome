"use client"

import { useCallback, useMemo, useState } from "react"
import { formatTimeHms } from "@/lib/time-format"
import { RiZoomInFill } from "react-icons/ri";
import { RiZoomOutFill } from "react-icons/ri";
import {
  TIMELINE_ZOOM_MAX,
  TIMELINE_ZOOM_MIN,
  getTimelineDuration,
  zoomAroundPlayhead,
} from "@/lib/timeline-viewport"
import { useTimelineContext } from "@twick/timeline"

import { FaRedo } from "react-icons/fa"
import { FaUndo } from "react-icons/fa"

import { TwickTimelineRenderer } from "@/components/ads-editor/timeline/TwickTimelineRenderer"
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
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex gap-2 text-md font-normal">
        <button
          type="button"
          disabled={!canUndo}
          onClick={() => editor.undo()}
          className="btn btn-ghost btn-sm gap-1 rounded-lg border disabled:opacity-40"
        >
          <span className="rounded-full border p-2">
            <FaUndo className="h-4 w-4" />
          </span>
          Undo
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={() => editor.redo()}
          className="btn btn-ghost btn-sm gap-1 rounded-lg disabled:opacity-40"
        >
          <span className="rounded-full border p-2">
            <FaRedo className="h-4 w-4" />
          </span>
          Redo
        </button>
      </div>
      <TimelinePlayheadClock />
      <div className="flex min-w-[10rem] items-center gap-2 text-slate-500">
        <button
          type="button"
          aria-label="Zoom out timeline"
          disabled={zoom <= TIMELINE_ZOOM_MIN}
          onClick={() => onZoomChange(zoom / 1.12)}
          className="btn btn-ghost btn-sm btn-square shrink-0 rounded-lg disabled:opacity-40 text-black"
        >
          <RiZoomOutFill className="h-4 w-4" />
        </button>
        <input
          type="range"
          min={TIMELINE_ZOOM_MIN}
          max={TIMELINE_ZOOM_MAX}
          step="any"
          value={zoom}

          onChange={(event) => onZoomChange(Number(event.target.value))}
          className=" range range-xs min-w-0 flex-1 text-black"
          aria-label="Timeline zoom"
        />
        <button
          type="button"
          aria-label="Zoom in timeline"
          disabled={zoom >= TIMELINE_ZOOM_MAX}
          onClick={() => onZoomChange(zoom * 1.12)}
          className="btn btn-ghost btn-sm btn-square shrink-0 rounded-lg disabled:opacity-40 text-black"
        >
          <RiZoomInFill className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function TimelinePlayheadClock() {
  const { currentTime } = useAdsTimeline()

  return (
    <span className="w-[120px] rounded-md border p-2 text-center font-mono text-lg font-medium tabular-nums text-slate-800">
      {formatTimeHms(currentTime)}
    </span>
  )
}

export function TimelinePanel() {
  const { episodeDurationSeconds, currentTime } = useAdsTimeline()
  const { present } = useTimelineContext()
  const [zoom, setZoom] = useState(1)
  const [viewportStart, setViewportStart] = useState(0)

  const timelineDuration = useMemo(
    () => getTimelineDuration(present?.tracks ?? [], episodeDurationSeconds),
    [present?.tracks, episodeDurationSeconds]
  )

  const handleZoomChange = useCallback(
    (nextZoom: number) => {
      const { zoom: clampedZoom, viewportStart: nextStart } = zoomAroundPlayhead({
        currentZoom: zoom,
        nextZoom,
        timelineDuration,
        viewportStart,
        playhead: currentTime,
      })
      setZoom(clampedZoom)
      setViewportStart(nextStart)
    },
    [currentTime, timelineDuration, viewportStart, zoom]
  )

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <TimelineToolbar zoom={zoom} onZoomChange={handleZoomChange} />
      <TwickTimelineRenderer
        durationSeconds={episodeDurationSeconds}
        zoom={zoom}
        viewportStart={viewportStart}
        onViewportStartChange={setViewportStart}
      />
    </div>
  )
}
