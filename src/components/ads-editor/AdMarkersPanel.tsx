"use client"

import clsx from "clsx"
import { Trash2 } from "lucide-react"

import {
  AdMarkerFormModal,
  openAdMarkerForm,
} from "@/components/ads-editor/AdMarkerFormModal"
import {
  CreateAdModal,
  openCreateAdModal,
} from "@/components/ads-editor/CreateAdModal"
import { useAdsTimeline } from "@/context/AdsTimelineContext"
import { useEpisodes } from "@/context/EpisodeContext"
import {
  formatMarkerTime,
  type AdMarkerMode,
} from "@/types/ad-marker"

const MODE_LABELS: Record<AdMarkerMode, string> = {
  static: "Static",
  auto: "Auto",
  ab: "A/B",
}

const MODE_CLASSES: Record<AdMarkerMode, string> = {
  auto: "bg-emerald-100 text-emerald-700",
  static: "bg-sky-100 text-sky-700",
  ab: "bg-amber-100 text-amber-700",
}

export function AdMarkersPanel() {
  const { selectedEpisodeHasSrc } = useEpisodes() || false;
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
      <div className="ads-editor-markers rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
                  MODE_CLASSES[marker.mode]
                )}
              >
                {MODE_LABELS[marker.mode]}
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

          {!isLoadingMarkers && adMarkers.length === 0 && Boolean(selectedEpisodeHasSrc) && (
            <li className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-400">
              No ad markers yet. Create one or use automatic placement.
            </li>
          )}
          {!isLoadingMarkers && adMarkers.length === 0 && !Boolean(selectedEpisodeHasSrc) && (
            <li className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-400">
              No ad markers yet. Import an MP4 to create markers.
            </li>
          )}
        </ul>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            disabled={!selectedEpisodeHasSrc}
            className="btn btn-neutral w-full rounded-xl"
            onClick={() => openCreateAdModal()}
          >
            Create ad marker +
          </button>
          <button
            type="button"
            disabled={!selectedEpisodeHasSrc}
            className="btn btn-outline w-full rounded-xl border-slate-200 bg-white"
            onClick={() => autoPlaceMarkers()}
          >
            Automatically place ✨
          </button>
        </div>
      </div>

      <CreateAdModal onSubmit={createMarker} />
      <AdMarkerFormModal onSubmit={handleSubmit} />
    </>
  )
}
