"use client"

import clsx from "clsx"
import { Trash2, Wand2 } from "lucide-react"

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
  auto: "bg-[#d4f5e4] text-[#1a7a4a]",
  static: "bg-[#dceeff] text-[#2563b8]",
  ab: "bg-[#ffe8d4] text-[#c45c1a]",
}

export function AdMarkersPanel() {
  const { selectedEpisodeHasSrc } = useEpisodes() || false
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
      <div className="flex h-full min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Ad markers</h2>
          <span className="text-sm text-slate-400">
            {isLoadingMarkers ? "Loading…" : `${adMarkers.length} markers`}
          </span>
        </div>

        {markersError && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {markersError}
          </p>
        )}

        <ul className="flex min-w-0 flex-col gap-2.5">
          {adMarkers.map((marker, index) => (
            <li
              key={marker.id}
              className="flex min-w-0 items-center gap-2"
            >
              <span className="w-4 shrink-0 text-center text-sm text-slate-400">
                {index + 1}
              </span>
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-2.5 py-2">
                <span className="shrink-0 font-mono text-sm font-medium tabular-nums text-slate-800">
                  {formatMarkerTime(marker.startSeconds)}
                </span>
                <span
                  className={clsx(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    MODE_CLASSES[marker.mode]
                  )}
                >
                  {MODE_LABELS[marker.mode]}
                </span>
                <div className="ml-auto flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    className="rounded-md border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    onClick={() => openAdMarkerForm({ mode: "edit", marker })}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#f79c9c] text-slate-900 transition-colors hover:bg-[#fcd4d4]"
                    aria-label="Delete marker"
                    onClick={() => removeMarker(marker.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}

          {!isLoadingMarkers && adMarkers.length === 0 && selectedEpisodeHasSrc && (
            <li className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-400">
              No ad markers yet. Create one or use automatic placement.
            </li>
          )}
          {!isLoadingMarkers && adMarkers.length === 0 && !selectedEpisodeHasSrc && (
            <li className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-400">
              No ad markers yet. Import an MP4 to create markers.
            </li>
          )}
        </ul>

        <div className="mt-auto ">
          <button
            type="button"
            
            className="w-full rounded-lg bg-neutral-900 p-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-40"
            onClick={() => openCreateAdModal()}
          >
            Create ad marker +
          </button>
          <button
            type="button"
            disabled={!selectedEpisodeHasSrc}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
            onClick={() => autoPlaceMarkers()}
          >
            <Wand2 className="h-4 w-4" />
            Automatically place
          </button>
        </div>
      </div>

      <CreateAdModal onSubmit={createMarker} />
      <AdMarkerFormModal onSubmit={handleSubmit} />
    </>
  )
}
