import { Redo2, Undo2, ZoomIn, ZoomOut } from "lucide-react"

import { timelineLabels } from "@/components/ads-editor/mock-data"

export function TimelinePanel() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost btn-sm gap-1 rounded-lg">
            <Undo2 className="h-4 w-4" />
            Undo
          </button>
          <button type="button" className="btn btn-ghost btn-sm gap-1 rounded-lg">
            <Redo2 className="h-4 w-4" />
            Redo
          </button>
        </div>
        <span className="font-mono text-lg font-medium text-slate-800">
          00:02:59
        </span>
        <div className="flex items-center gap-2">
          <ZoomOut className="h-4 w-4 text-slate-400" />
          <input
            type="range"
            className="range range-xs w-28"
            defaultValue={40}
            readOnly
          />
          <ZoomIn className="h-4 w-4 text-slate-400" />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
        <div className="relative h-28 border-b border-slate-100">
          <div className="absolute inset-x-0 bottom-0 top-6 flex items-end gap-px px-2">
            {Array.from({ length: 120 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-violet-200"
                style={{ height: `${20 + ((i * 17) % 60)}%` }}
              />
            ))}
          </div>

          <div className="absolute bottom-0 left-[12%] top-0 w-10 rounded-t bg-emerald-400/80" />
          <div className="absolute bottom-0 left-[22%] top-0 flex w-12 items-start justify-center rounded-t bg-sky-400/80 pt-2 text-xs font-bold text-white">
            S
          </div>
          <div className="absolute bottom-0 left-[32%] top-0 flex w-14 items-start justify-center rounded-t bg-amber-400/80 pt-2 text-xs font-bold text-white">
            A/B
          </div>

          <div className="absolute bottom-0 left-[48%] top-0 z-10 w-0.5 bg-red-500">
            <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-red-500" />
          </div>
        </div>

        <div className="flex justify-between px-3 py-2 font-mono text-xs text-slate-400">
          {timelineLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="px-3 pb-3">
          <div className="h-1.5 w-full rounded-full bg-slate-200">
            <div className="h-full w-1/3 rounded-full bg-slate-400" />
          </div>
        </div>
      </div>
    </div>
  )
}
