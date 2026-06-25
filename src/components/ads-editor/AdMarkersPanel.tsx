"use client"

import clsx from "clsx"
import { Trash2 } from "lucide-react"

import {
  AdMarkerFormModal,
  openAdMarkerForm,
} from "@/components/ads-editor/AdMarkerFormModal"
import { useAdsTimeline } from "@/context/AdsTimelineContext"
import {
  AD_MARKER_MODE_CLASSES,
  AD_MARKER_MODE_LABELS,
  formatMarkerTime,
} from "@/types/ad-marker"

export function AdMarkersPanel() {
  const {
    adMarkers,
    isLoadingMarkers,
    markersError,
    createMarker,
    updateMarker,
    removeMarker,
    autoPlaceMarkers,
  } = useAdsTimeline()

  async function handleSubmit(
    input: Parameters<typeof createMarker>[0],
    markerId?: string
  ) {
    if (markerId) {
      await updateMarker(markerId, input)
      return
    }
    await createMarker(input)
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Ad markers</h2>
          <span className="text-sm text-slate-400">
            {isLoadingMarkers ? "Loading…" : `${adMarkers.length} markers`}
          </span>
        </div>

        {markersError && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {markersError}
          </p>
        )}

        <ul className="flex flex-col gap-3">
          {adMarkers.map((marker, index) => (
            <li
              key={marker.id}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5"
            >
              <span className="w-4 text-sm font-medium text-slate-400">
                {index + 1}
              </span>
              <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">
                {formatMarkerTime(marker.startSeconds)}
              </span>
              <span
                className={clsx(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  AD_MARKER_MODE_CLASSES[marker.mode]
                )}
              >
                {AD_MARKER_MODE_LABELS[marker.mode]}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-xs ml-auto rounded-lg border border-slate-200 bg-white"
                onClick={() =>
                  openAdMarkerForm({ mode: "edit", marker })
                }
              >
                Edit
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-xs rounded-lg text-red-400 hover:bg-red-50"
                aria-label="Delete marker"
                onClick={() => removeMarker(marker.id)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}

          {!isLoadingMarkers && adMarkers.length === 0 && (
            <li className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-400">
              No ad markers yet. Create one or use automatic placement.
            </li>
          )}
        </ul>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            className="btn btn-neutral w-full rounded-xl"
            onClick={() => openAdMarkerForm({ mode: "create", marker: null })}
          >
            Create ad marker +
          </button>
          <button
            type="button"
            className="btn btn-outline w-full rounded-xl border-slate-200 bg-white"
            onClick={() => autoPlaceMarkers()}
          >
            Automatically place ✨
          </button>
        </div>
      </div>

      <AdMarkerFormModal onSubmit={handleSubmit} />
    </>
  )
}
