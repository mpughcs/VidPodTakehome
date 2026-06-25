import clsx from "clsx"
import { Trash2 } from "lucide-react"

import { adMarkers } from "@/components/ads-editor/mock-data"

export function AdMarkersPanel() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Ad markers</h2>
        <span className="text-sm text-slate-400">{adMarkers.length} markers</span>
      </div>

      <ul className="flex flex-col gap-3">
        {adMarkers.map((marker) => (
          <li
            key={marker.id}
            className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5"
          >
            <span className="w-4 text-sm font-medium text-slate-400">
              {marker.id}
            </span>
            <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">
              {marker.time}
            </span>
            <span
              className={clsx(
                "rounded-full px-3 py-1 text-xs font-semibold",
                marker.modeClass
              )}
            >
              {marker.mode}
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-xs ml-auto rounded-lg border border-slate-200 bg-white"
            >
              Edit
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-xs rounded-lg text-red-400 hover:bg-red-50"
              aria-label="Delete marker"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-col gap-2">
        <button type="button" className="btn btn-neutral w-full rounded-xl">
          Create ad marker +
        </button>
        <button
          type="button"
          className="btn btn-outline w-full rounded-xl border-slate-200 bg-white"
        >
          Automatically place ✨
        </button>
      </div>
    </div>
  )
}
