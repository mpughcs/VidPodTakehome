"use client"

import clsx from "clsx"
import {
  Check,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  FlaskConical,
  Search,
  Target,
  Upload,
  X,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

import { useAdsTimeline } from "@/context/AdsTimelineContext"
import {
  buildAdFolderTree,
  filterAdsByFolder,
  filterAdsByQuery,
  getFolderDefaults,
  type AdFolderNode,
} from "@/lib/ad-library"
import {
  openUploadAdModal,
  UploadAdModal,
} from "@/components/ads-editor/UploadAdModal"
import {
  formatMarkerTime,
  parseMarkerTime,
  type AdMarkerMode,
  type CreateAdMarkerInput,
} from "@/types/ad-marker"
import { formatAdDuration, type Ad } from "@/types/ad"

const MODAL_ID = "create-ad-modal"

type Page = 1 | 2 | 3

const MODE_OPTIONS: Array<{
  mode: AdMarkerMode
  title: string
  description: string
  icon: typeof CircleDashed
}> = [
    {
      mode: "auto",
      title: "Auto",
      description: "Automatic ad insertions",
      icon: CircleDashed,
    },
    {
      mode: "static",
      title: "Static",
      description: "A marker for a specific ad that you select",
      icon: Target,
    },
    {
      mode: "ab",
      title: "A/B test",
      description: "Compare the performance of multiple ads",
      icon: FlaskConical,
    },
  ]

let openModalHandler: (() => void) | null = null

export function openCreateAdModal() {
  openModalHandler?.()
  const dialog = document.getElementById(MODAL_ID) as HTMLDialogElement | null
  dialog?.showModal()
}

type CreateAdModalProps = {
  onSubmit: (input: CreateAdMarkerInput) => Promise<void>
}

function RadioMark({ selected }: { selected: boolean }) {
  return (
    <span
      className={clsx(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        selected ? "border-slate-900 bg-slate-900" : "border-slate-300 bg-white"
      )}
    >
      {selected && <span className="h-2 w-2 rounded-full bg-white" />}
    </span>
  )
}

function FolderTree({
  nodes,
  activeFolderId,
  onSelect,
  depth = 0,
}: {
  nodes: AdFolderNode[]
  activeFolderId: string | null
  onSelect: (id: string | null) => void
  depth?: number
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  return (
    <ul className="flex flex-col gap-0.5">
      {nodes.map((node) => {
        const isActive = activeFolderId === node.id
        const hasChildren = Boolean(node.children?.length)
        const isExpanded = expanded[node.id] ?? hasChildren

        return (
          <li key={node.id}>
            <button
              type="button"
              className={clsx(
                "flex w-full items-center gap-1 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                isActive
                  ? "bg-white font-medium text-slate-900 shadow-sm"
                  : "text-slate-600 hover:bg-white/70"
              )}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              onClick={() => {
                onSelect(node.id)
                if (hasChildren) {
                  setExpanded((prev) => ({ ...prev, [node.id]: !isExpanded }))
                }
              }}
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                )
              ) : (
                <span className="w-3.5 shrink-0" />
              )}
              {node.name}
            </button>
            {hasChildren && isExpanded && (
              <FolderTree
                nodes={node.children!}
                activeFolderId={activeFolderId}
                onSelect={onSelect}
                depth={depth + 1}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}

function AdRow({
  ad,
  selected,
  onToggle,
  selectionType,
}: {
  ad: Ad
  selected: boolean
  onToggle: () => void
  selectionType: "single" | "multi"
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={clsx(
        "flex w-full items-center gap-4 rounded-xl border px-4 py-3 text-left transition-colors",
        selected
          ? "border-slate-900 bg-slate-50"
          : "border-slate-200 bg-white hover:border-slate-300"
      )}
    >
      <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-semibold text-white/80">
        {ad.company.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate-900">{ad.title}</p>
        <p className="mt-0.5 text-sm text-slate-500">
          {ad.uploadDate ?? "—"} · {formatAdDuration(ad.duration)}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {ad.company} → {ad.product}
        </p>
      </div>
      <span
        className={clsx(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
          selected
            ? "border-slate-900 bg-slate-900 text-white"
            : "border-slate-300 bg-white",
          selectionType === "single" && "rounded-full"
        )}
      >
        {selected && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
    </button>
  )
}

export function CreateAdModal({ onSubmit }: CreateAdModalProps) {
  const { currentTime, ads, isLoadingAds, adsError } = useAdsTimeline()
  const currentTimeRef = useRef(currentTime)
  currentTimeRef.current = currentTime
  const [page, setPage] = useState<Page>(1)
  const [mode, setMode] = useState<AdMarkerMode>("ab")
  const [selectedAdIds, setSelectedAdIds] = useState<string[]>([])
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
  const [libraryQuery, setLibraryQuery] = useState("")
  const [startTime, setStartTime] = useState("00:00:30")
  const [endTime, setEndTime] = useState("00:00:45")
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  function resetState() {
    setPage(1)
    setMode("ab")
    setSelectedAdIds([])
    setActiveFolderId(null)
    setLibraryQuery("")
    const contentTime = Math.max(0, Math.floor(currentTimeRef.current))
    setStartTime(formatMarkerTime(contentTime))
    setEndTime(formatMarkerTime(contentTime + 15))
    setError(null)
    setIsSaving(false)
  }

  useEffect(() => {
    openModalHandler = resetState
    return () => {
      openModalHandler = null
    }
  }, [])

  const folders = useMemo(() => buildAdFolderTree(ads), [ads])

  const filteredAds = useMemo(() => {
    const byFolder = filterAdsByFolder(ads, activeFolderId)
    return filterAdsByQuery(byFolder, libraryQuery)
  }, [ads, activeFolderId, libraryQuery])

  const selectedAds = ads.filter((ad) => selectedAdIds.includes(ad.id))

  const selectionType = mode === "static" ? "single" : "multi"
  const minAdsRequired = mode === "ab" ? 2 : mode === "static" ? 1 : 0

  // The slot length must match the ad's real media duration so the full ad
  // plays and the episode resumes exactly when the ad ends. For A/B we take the
  // longest variant so any rotated ad fits. Ceil to whole seconds. Returns null
  // when no selected ad has a known duration (e.g. auto mode) — slot stays manual.
  const selectedAdDuration = useMemo(() => {
    const durations = ads
      .filter((ad) => selectedAdIds.includes(ad.id))
      .map((ad) => ad.duration)
      .filter(
        (value): value is number =>
          typeof value === "number" && Number.isFinite(value) && value > 0
      )
    if (durations.length === 0) return null
    return Math.ceil(Math.max(...durations))
  }, [ads, selectedAdIds])

  useEffect(() => {
    if (page !== 3 || selectedAdDuration === null) return
    const startSeconds = parseMarkerTime(startTime)
    if (startSeconds === null) return
    setEndTime(formatMarkerTime(startSeconds + selectedAdDuration))
  }, [page, selectedAdDuration, startTime])

  function toggleAd(adId: string) {
    setSelectedAdIds((prev) => {
      if (mode === "static") {
        return prev.includes(adId) ? [] : [adId]
      }
      return prev.includes(adId)
        ? prev.filter((id) => id !== adId)
        : [...prev, adId]
    })
  }

  function selectUploadedAd(adId: string) {
    setSelectedAdIds((prev) => {
      if (mode === "static") return [adId]
      return prev.includes(adId) ? prev : [...prev, adId]
    })
  }

  function openUploadModal() {
    const defaults = getFolderDefaults(activeFolderId, folders)
    openUploadAdModal(
      { company: defaults.company, product: defaults.product },
      (ad) => selectUploadedAd(ad.id)
    )
  }

  function closeModal() {
    ; (document.getElementById(MODAL_ID) as HTMLDialogElement | null)?.close()
    resetState()
  }

  function goNextFromPage1() {
    setError(null)
    setSelectedAdIds([])
    if (mode === "auto") {
      setPage(3)
      return
    }
    setPage(2)
  }

  function goNextFromPage2() {
    setError(null)
    if (mode !== "auto" && selectedAdIds.length < minAdsRequired) {
      setError(
        mode === "ab"
          ? "Select at least 2 ads for an A/B test."
          : "Select an ad to continue."
      )
      return
    }
    setPage(3)
  }

  async function handleCreate() {
    const startSeconds = parseMarkerTime(startTime)
    const endSeconds = parseMarkerTime(endTime)

    if (startSeconds === null || endSeconds === null) {
      setError("Use MM:SS or HH:MM:SS for start and end times.")
      return
    }

    if (endSeconds <= startSeconds) {
      setError("End time must be after start time.")
      return
    }

    if (
      selectedAdDuration !== null &&
      endSeconds - startSeconds < selectedAdDuration
    ) {
      setError(
        `This ad is ${formatAdDuration(selectedAdDuration)} long; the slot must be at least that long.`
      )
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await onSubmit({
        startSeconds,
        endSeconds,
        mode,
        ...(mode === "static" && selectedAdIds[0]
          ? { adId: selectedAdIds[0] }
          : {}),
        ...(mode === "ab" && selectedAdIds.length
          ? { adIds: selectedAdIds }
          : {}),
      })
      closeModal()
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Could not create marker"
      )
    } finally {
      setIsSaving(false)
    }
  }

  const pageTitle =
    page === 1
      ? "Create ad marker"
      : page === 2
        ? mode === "ab"
          ? "A/B test"
          : "Select ad"
        : mode === "ab"
          ? "A/B test results"
          : "Place marker"

  const pageSubtitle =
    page === 1
      ? "Insert a new ad marker into this episode"
      : page === 2
        ? mode === "ab"
          ? "Select which ads you'd like to A/B test"
          : mode === "static"
            ? "Choose the ad to show at this marker"
            : "Choose an ad from your library"
        : mode === "ab"
          ? `${selectedAds.length} ads selected`
          : mode === "auto"
            ? "Confirm automatic placement on the timeline"
            : "Set when this ad should play"

  const isWide = page === 2

  return (
    <>
      <dialog
        id={MODAL_ID}
        className="modal"
        onClose={resetState}
      >
        <div
          className={clsx(
            "modal-box flex max-h-[90vh] flex-col p-0",
            isWide ? "max-w-4xl" : "max-w-xl"
          )}
        >
          <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <h3 className="text-xl font-bold text-slate-900">{pageTitle}</h3>
              <p className="mt-1 text-sm text-slate-500">{pageSubtitle}</p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-circle"
              aria-label="Close"
              onClick={closeModal}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {page === 1 && (
              <div className="flex flex-col gap-3">
                {MODE_OPTIONS.map((option) => {
                  const Icon = option.icon
                  const selected = mode === option.mode
                  return (
                    <button
                      key={option.mode}
                      type="button"
                      onClick={() => setMode(option.mode)}
                      className={clsx(
                        "flex items-center gap-4 rounded-xl border px-4 py-4 text-left transition-colors",
                        selected
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-slate-900">
                          {option.title}
                        </span>
                        <span className="mt-0.5 block text-sm text-slate-500">
                          {option.description}
                        </span>
                      </span>
                      <RadioMark selected={selected} />
                    </button>
                  )
                })}
              </div>
            )}

            {page === 2 && (
              <div className="flex min-h-[420px] gap-0 overflow-hidden rounded-xl border border-slate-200">
                <aside className="w-52 shrink-0 border-r border-slate-200 bg-slate-50 p-3">
                  <label className="relative mb-3 block">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      placeholder="Search library..."
                      className="input input-sm w-full rounded-lg border-slate-200 bg-white pl-8"
                      value={libraryQuery}
                      onChange={(e) => setLibraryQuery(e.target.value)}
                    />
                  </label>
                  <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Ad library
                  </p>
                  <button
                    type="button"
                    className={clsx(
                      "mb-1 w-full rounded-lg px-2 py-1.5 text-left text-sm",
                      activeFolderId === null
                        ? "bg-white font-medium text-slate-900 shadow-sm"
                        : "text-slate-600 hover:bg-white/70"
                    )}
                    onClick={() => setActiveFolderId(null)}
                  >
                    All folders
                  </button>
                  <FolderTree
                    nodes={folders}
                    activeFolderId={activeFolderId}
                    onSelect={setActiveFolderId}
                  />
                </aside>

                <div className="flex min-w-0 flex-1 flex-col bg-white">
                  <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3">
                    <select className="select select-sm select-bordered rounded-lg text-sm">
                      <option>Sort by Upload date</option>
                    </select>
                    <button
                      type="button"
                      className="btn btn-sm rounded-lg border-slate-200"
                      onClick={openUploadModal}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload MP4
                    </button>
                    <label className="relative ml-auto min-w-[180px] flex-1">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="search"
                        placeholder="Search ads..."
                        className="input input-sm w-full rounded-lg border-slate-200 pl-8"
                        value={libraryQuery}
                        onChange={(e) => setLibraryQuery(e.target.value)}
                      />
                    </label>
                  </div>

                  <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
                    {isLoadingAds && (
                      <p className="py-8 text-center text-sm text-slate-400">
                        Loading ad library…
                      </p>
                    )}
                    {!isLoadingAds && adsError && (
                      <p className="py-8 text-center text-sm text-red-500">
                        {adsError}
                      </p>
                    )}
                    {!isLoadingAds && !adsError && ads.length === 0 && (
                      <p className="py-8 text-center text-sm text-slate-400">
                        No ads in your library yet. Use{" "}
                        <span className="font-medium text-slate-600">Upload MP4</span>{" "}
                        to add one.
                      </p>
                    )}
                    {!isLoadingAds &&
                      filteredAds.map((ad) => (
                        <AdRow
                          key={ad.id}
                          ad={ad}
                          selected={selectedAdIds.includes(ad.id)}
                          onToggle={() => toggleAd(ad.id)}
                          selectionType={selectionType}
                        />
                      ))}
                    {!isLoadingAds && ads.length > 0 && filteredAds.length === 0 && (
                      <p className="py-8 text-center text-sm text-slate-400">
                        No ads match this search.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {page === 3 && (
              <div className="flex flex-col gap-4">
                {mode === "ab" && selectedAds.length > 0 && (
                  <ul className="flex flex-col gap-3">
                    {selectedAds.map((ad, index) => (
                      <li
                        key={ad.id}
                        className={clsx(
                          "rounded-xl border px-4 py-3",
                          index === 0
                            ? "border-emerald-300 bg-emerald-50/40"
                            : "border-slate-200 bg-white"
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-semibold text-white/80">
                            {ad.company.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900">{ad.title}</p>
                            <p className="mt-0.5 text-sm text-slate-500">
                              {ad.uploadDate ?? "—"} · {formatAdDuration(ad.duration)}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs text-slate-600">
                                {ad.company}
                              </span>
                              <ChevronRight className="h-3 w-3 text-slate-300" />
                              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs text-slate-600">
                                {ad.product}
                              </span>
                            </div>
                          </div>
                          <span
                            className={clsx(
                              "rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                              index === 0
                                ? "border-emerald-400 bg-emerald-100 text-emerald-800"
                                : "border-slate-200 bg-white text-slate-600"
                            )}
                          >
                            #{index + 1}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {mode === "static" && selectedAds[0] && (
                  <div className="rounded-xl border border-slate-200 px-4 py-3">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-semibold text-white/80">
                        {selectedAds[0].company.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {selectedAds[0].title}
                        </p>
                        <p className="mt-0.5 text-sm text-slate-500">
                          {selectedAds[0].uploadDate ?? "—"} ·{" "}
                          {formatAdDuration(selectedAds[0].duration)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {mode === "auto" && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                    <CircleDashed className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="mt-3 font-medium text-slate-800">
                      Automatic ad insertions
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      The system will rotate eligible ads at this marker.
                    </p>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-slate-700">Start time</span>
                    <input
                      className="input input-bordered w-full rounded-xl"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      placeholder="00:00:30"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-slate-700">End time</span>
                    <input
                      className="input input-bordered w-full rounded-xl disabled:opacity-60"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      placeholder="00:00:45"
                      disabled={selectedAdDuration !== null}
                    />
                    {selectedAdDuration !== null && (
                      <span className="text-xs text-slate-500">
                        Set from the ad length ({formatAdDuration(selectedAdDuration)}).
                      </span>
                    )}
                  </label>
                </div>
              </div>
            )}

            {error && (
              <p className="mt-4 text-sm text-red-500">{error}</p>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              className="btn rounded-xl border-slate-200 bg-white"
              onClick={() => {
                setError(null)
                if (page === 1) {
                  closeModal()
                  return
                }
                if (page === 3 && mode === "auto") {
                  setPage(1)
                  return
                }
                setPage((prev) => (prev === 3 ? 2 : 1) as Page)
              }}
            >
              {page === 1 ? "Cancel" : page === 3 && mode === "ab" ? "New test" : "Back"}
            </button>

            <div className="flex items-center gap-3">
              {page === 2 && mode === "ab" && (
                <span className="text-sm text-slate-500">
                  {selectedAdIds.length} ads selected
                </span>
              )}

              {page === 1 && (
                <button
                  type="button"
                  className="btn btn-neutral rounded-xl px-6"
                  onClick={goNextFromPage1}
                >
                  Select marker
                </button>
              )}

              {page === 2 && (
                <button
                  type="button"
                  className="btn btn-neutral rounded-xl px-6"
                  onClick={goNextFromPage2}
                >
                  {mode === "ab" ? "Create A/B test" : "Continue"}
                </button>
              )}

              {page === 3 && (
                <button
                  type="button"
                  className="btn btn-neutral rounded-xl px-6"
                  disabled={isSaving}
                  onClick={handleCreate}
                >
                  {isSaving ? "Creating…" : mode === "ab" ? "Done" : "Create marker"}
                </button>
              )}
            </div>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="submit">close</button>
        </form>
      </dialog>
      <UploadAdModal />
    </>
  )
}
