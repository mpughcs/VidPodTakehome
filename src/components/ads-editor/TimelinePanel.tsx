"use client"

import { Redo2, Undo2, ZoomIn, ZoomOut } from "lucide-react"
import { formatTimeSimple, useTimelineContext } from "@twick/timeline"

import { TwickTimelineRenderer } from "@/components/ads-editor/timeline/TwickTimelineRenderer"

function TimelineToolbar() {
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
      <div className="flex items-center gap-2 text-slate-400">
        <ZoomOut className="h-4 w-4" />
        <span className="text-xs">Zoom in renderer</span>
        <ZoomIn className="h-4 w-4" />
      </div>
    </div>
  )
}

function TimelinePlayheadClock() {
  return (
    <span className="font-mono text-lg font-medium text-slate-800">
      {formatTimeSimple(179)}
    </span>
  )
}

export function TimelinePanel() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <TimelineToolbar />
      <TwickTimelineRenderer />
    </div>
  )
}
