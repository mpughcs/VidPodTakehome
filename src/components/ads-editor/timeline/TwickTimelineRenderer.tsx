"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react"
import clsx from "clsx"
import { formatTimeHms } from "@/lib/time-format"
import {
  clampViewportStart,
  getTimelineDuration,
  getVisibleDuration,
} from "@/lib/timeline-viewport"
import {
  useTimelineContext,
  type ElementJSON,
  type TrackJSON,
} from "@twick/timeline"

import { useAdsTimeline } from "@/context/AdsTimelineContext"
import { EpisodeVideoStrip } from "@/components/ads-editor/timeline/EpisodeVideoStrip"
import { isAdMarkerElement, AD_MARKERS_TRACK_ID, AD_MARKERS_TRACK_NAME, patchAdMarkerTimesInProject } from "@/lib/ad-markers-timeline"

import "@/styles/ads-timeline.css"

const FALLBACK_DURATION_SECONDS = 300
const MIN_AD_CLIP_SECONDS = 1
const TRACK_GUTTER_PX = 40

export { TIMELINE_ZOOM_MAX, TIMELINE_ZOOM_MIN } from "@/lib/timeline-viewport"

function getLaneStartInInner(tracksEl: HTMLElement): number {
  const tracksPadLeft =
    Number.parseFloat(getComputedStyle(tracksEl).paddingLeft) || 0
  return tracksPadLeft + TRACK_GUTTER_PX
}

function getTimeFromClientX(
  clientX: number,
  scrollEl: HTMLElement,
  tracksEl: HTMLElement,
  laneEl: HTMLElement,
  timelineDuration: number
) {
  const scrollRect = scrollEl.getBoundingClientRect()
  const laneStart = getLaneStartInInner(tracksEl)
  const xInInner = clientX - scrollRect.left + scrollEl.scrollLeft
  const xInLane = xInInner - laneStart
  const laneWidth = laneEl.offsetWidth
  if (laneWidth <= 0) return 0
  const ratio = xInLane / laneWidth
  return Math.min(timelineDuration, Math.max(0, ratio * timelineDuration))
}

function scrollLeftToViewportStart(
  scrollLeft: number,
  scrollEl: HTMLElement,
  timelineDuration: number,
  visibleDuration: number
) {
  const maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth
  const maxStart = Math.max(0, timelineDuration - visibleDuration)
  if (maxScroll <= 0 || maxStart <= 0) return 0
  return (scrollLeft / maxScroll) * maxStart
}

function viewportStartToScrollLeft(
  viewportStart: number,
  scrollEl: HTMLElement,
  timelineDuration: number,
  visibleDuration: number
) {
  const maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth
  const maxStart = Math.max(0, timelineDuration - visibleDuration)
  if (maxScroll <= 0 || maxStart <= 0) return 0
  return (viewportStart / maxStart) * maxScroll
}

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
  zoom?: number
  viewportStart?: number
  onViewportStartChange?: (start: number) => void
}

type AdDragMode = "move" | "start" | "end"

export function TwickTimelineRenderer({
  durationSeconds = FALLBACK_DURATION_SECONDS,
  zoom = 1,
  viewportStart = 0,
  onViewportStartChange,
}: TwickTimelineRendererProps) {
  const { present } = useTimelineContext()
  const { currentTime, seekTo, isAdPlaying, setTimelineDragging } = useAdsTimeline()
  const scrollRef = useRef<HTMLDivElement>(null)
  const tracksRef = useRef<HTMLDivElement>(null)
  const laneRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const syncingScrollRef = useRef(false)

  const tracks = present?.tracks ?? []
  const timelineDuration = useMemo(
    () => getTimelineDuration(tracks, durationSeconds),
    [tracks, durationSeconds]
  )
  const visibleDuration = getVisibleDuration(timelineDuration, zoom)
  const clampedViewportStart = clampViewportStart(
    viewportStart,
    timelineDuration,
    visibleDuration
  )
  const innerWidthPercent = Math.max(100, zoom * 100)

  useEffect(() => {
    if (clampedViewportStart !== viewportStart) {
      onViewportStartChange?.(clampedViewportStart)
    }
  }, [clampedViewportStart, onViewportStartChange, viewportStart])

  useEffect(() => {
    const scrollEl = scrollRef.current
    const laneEl = laneRef.current
    if (!scrollEl || !laneEl) return

    const targetScroll = viewportStartToScrollLeft(
      clampedViewportStart,
      scrollEl,
      timelineDuration,
      visibleDuration
    )
    if (Math.abs(scrollEl.scrollLeft - targetScroll) > 0.5) {
      syncingScrollRef.current = true
      scrollEl.scrollLeft = targetScroll
      requestAnimationFrame(() => {
        syncingScrollRef.current = false
      })
    }
  }, [clampedViewportStart, timelineDuration, visibleDuration, innerWidthPercent])

  const handleScroll = useCallback(() => {
    if (syncingScrollRef.current) return
    const scrollEl = scrollRef.current
    if (!scrollEl) return
    const nextStart = scrollLeftToViewportStart(
      scrollEl.scrollLeft,
      scrollEl,
      timelineDuration,
      visibleDuration
    )
    onViewportStartChange?.(nextStart)
  }, [onViewportStartChange, timelineDuration, visibleDuration])

  const timeLabels = useMemo(() => {
    const interval =
      timelineDuration <= 120 ? 30 : timelineDuration <= 600 ? 60 : 120
    const labels: number[] = []
    for (let t = 0; t <= timelineDuration; t += interval) {
      labels.push(t)
    }
    return labels
  }, [timelineDuration])

  const seekFromClientX = useCallback(
    (clientX: number) => {
      if (isAdPlaying || draggingRef.current) return
      const scrollEl = scrollRef.current
      const tracksEl = tracksRef.current
      const laneEl = laneRef.current
      if (!scrollEl || !tracksEl || !laneEl) return
      seekTo(
        getTimeFromClientX(
          clientX,
          scrollEl,
          tracksEl,
          laneEl,
          timelineDuration
        )
      )
    },
    [isAdPlaying, seekTo, timelineDuration]
  )

  return (
    <div className="ads-custom-timeline">
      <div
        ref={scrollRef}
        className="ads-timeline-scroll"
        onScroll={handleScroll}
      >
        <div
          className="ads-timeline-inner"
          style={{ width: `${innerWidthPercent}%` }}
        >
          <div className="ads-timeline-ruler">
            <div className="ads-timeline-ruler-gutter" aria-hidden />
            <div className="ads-timeline-ruler-track">
              <div className="ads-timeline-ruler-labels">
                {timeLabels.map((seconds) => (
                  <span key={seconds}>{formatTimeHms(seconds)}</span>
                ))}
              </div>
            </div>
          </div>

          <div
            ref={tracksRef}
            className={clsx(
              "ads-timeline-tracks",
              isAdPlaying ? "cursor-not-allowed opacity-60" : "cursor-pointer"
            )}
            onClick={(e) => seekFromClientX(e.clientX)}
            role="presentation"
            title={isAdPlaying ? "Timeline locked during ad playback" : undefined}
          >
            <div className="space-y-0">
              {tracks.map((track, index) => (
                <TimelineTrackRow
                  key={track.id}
                  track={track}
                  timelineDuration={timelineDuration}
                  attachLaneRef={index === 0}
                  laneMeasureRef={laneRef}
                  disabled={isAdPlaying}
                  onDragStateChange={(dragging) => {
                    draggingRef.current = dragging
                    setTimelineDragging(dragging)
                  }}
                />
              ))}
            </div>

            <div className="ads-timeline-playhead-layer" aria-hidden>
              <Playhead
                playhead={currentTime}
                timelineDuration={timelineDuration}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TimelineTrackRow({
  track,
  timelineDuration,
  attachLaneRef,
  laneMeasureRef,
  disabled,
  onDragStateChange,
}: {
  track: TrackJSON
  timelineDuration: number
  attachLaneRef: boolean
  laneMeasureRef: React.RefObject<HTMLDivElement | null>
  disabled: boolean
  onDragStateChange: (dragging: boolean) => void
}) {
  const isAdTrack =
    track.id === AD_MARKERS_TRACK_ID || track.name === AD_MARKERS_TRACK_NAME
  const isEpisodeTrack = track.elements.some(
    (element) => element.props?.role === "episode"
  )

  return (
    <div className="ads-timeline-track-row">
      <div className="ads-timeline-track-gutter" aria-hidden />
      <div
        ref={attachLaneRef ? laneMeasureRef : undefined}
        className={clsx(
          "ads-timeline-track",
          isAdTrack && "ads-timeline-track-ads",
          isEpisodeTrack && "ads-timeline-track-episode"
        )}
      >
        {track.elements.map((element) => {
        const left = (element.s / timelineDuration) * 100
        const width = ((element.e - element.s) / timelineDuration) * 100

        if (isAdMarkerElement(element)) {
          return (
            <DraggableAdClip
              key={element.id}
              element={element}
              timelineDuration={timelineDuration}
              laneMeasureRef={laneMeasureRef}
              disabled={disabled}
              onDragStateChange={onDragStateChange}
            />
          )
        }

        if (element.props?.role === "episode") {
          return (
            <EpisodeTimelineClip
              key={element.id}
              element={element}
              left={left}
              width={width}
            />
          )
        }

        return (
          <div
            key={element.id}
            className={clsx(
              "ads-timeline-ad-clip absolute bottom-0 top-0 flex items-start justify-center rounded-t pt-1 text-xs font-bold text-white shadow-sm",
              getElementColor(element)
            )}
            style={{ left: `${left}%`, width: `${Math.max(width, 1)}%` }}
            title={`${element.name} (${formatTimeHms(element.s)} – ${formatTimeHms(element.e)})`}
          >
            {getElementLabel(element)}
          </div>
        )
        })}
      </div>
    </div>
  )
}

function EpisodeTimelineClip({
  element,
  left,
  width,
}: {
  element: ElementJSON
  left: number
  width: number
}) {
  const { episodeSrc, episodeDurationSeconds } = useAdsTimeline()
  const clipDuration = Math.max(0.001, element.e - element.s)
  const mediaOffset =
    typeof element.props?.time === "number" ? element.props.time : 0

  return (
    <div
      className="ads-timeline-episode-clip"
      style={{ left: `${left}%`, width: `${Math.max(width, 1)}%` }}
      title={`${element.name} (${formatTimeHms(element.s)} – ${formatTimeHms(element.e)})`}
    >
      {episodeSrc ? (
        <EpisodeVideoStrip
          src={episodeSrc}
          durationSec={clipDuration}
          mediaOffsetSec={mediaOffset}
          mediaDurationSec={episodeDurationSeconds}
        />
      ) : (
        <div className="ads-timeline-episode-strip-fallback" aria-hidden />
      )}
      <span className="ads-timeline-episode-label">
        {getElementLabel(element)}
      </span>
    </div>
  )
}

function computeAdClipDragRange(
  drag: {
    mode: AdDragMode
    startX: number
    origStart: number
    origEnd: number
  },
  clientX: number,
  laneWidth: number,
  timelineDuration: number,
  episodeDurationSeconds: number
) {
  const deltaSeconds = ((clientX - drag.startX) / laneWidth) * timelineDuration

  if (drag.mode === "move") {
    let nextStart = drag.origStart + deltaSeconds
    let nextEnd = drag.origEnd + deltaSeconds
    if (nextStart < 0) {
      nextEnd -= nextStart
      nextStart = 0
    }
    if (nextEnd > episodeDurationSeconds) {
      nextStart -= nextEnd - episodeDurationSeconds
      nextEnd = episodeDurationSeconds
    }
    return { start: Math.max(0, nextStart), end: nextEnd }
  }

  if (drag.mode === "start") {
    return {
      start: Math.min(
        drag.origEnd - MIN_AD_CLIP_SECONDS,
        Math.max(0, drag.origStart + deltaSeconds)
      ),
      end: drag.origEnd,
    }
  }

  return {
    start: drag.origStart,
    end: Math.max(
      drag.origStart + MIN_AD_CLIP_SECONDS,
      Math.min(episodeDurationSeconds, drag.origEnd + deltaSeconds)
    ),
  }
}

function DraggableAdClip({
  element,
  timelineDuration,
  laneMeasureRef,
  disabled,
  onDragStateChange,
}: {
  element: ElementJSON
  timelineDuration: number
  laneMeasureRef: React.RefObject<HTMLDivElement | null>
  disabled: boolean
  onDragStateChange: (dragging: boolean) => void
}) {
  const { editor } = useTimelineContext()
  const { episodeDurationSeconds } = useAdsTimeline()
  const [previewTimes, setPreviewTimes] = useState<{ start: number; end: number } | null>(
    null
  )
  const dragRef = useRef<{
    mode: AdDragMode
    startX: number
    origStart: number
    origEnd: number
  } | null>(null)

  const clipStart = previewTimes?.start ?? element.s
  const clipEnd = previewTimes?.end ?? element.e
  const displayLeft = (clipStart / timelineDuration) * 100
  const displayWidth = ((clipEnd - clipStart) / timelineDuration) * 100

  const commitUpdate = useCallback(
    (start: number, end: number) => {
      if (start === element.s && end === element.e) return

      const project = editor.getProject()
      const next = patchAdMarkerTimesInProject(project, element.id, start, end)
      editor.loadProjectSnapshot({
        tracks: next.tracks,
        version: next.version,
        backgroundColor: next.backgroundColor,
        metadata: next.metadata,
      })
    },
    [editor, element.e, element.id, element.s]
  )

  const beginDrag = useCallback(
    (event: PointerEvent<HTMLElement>, mode: AdDragMode) => {
      if (disabled) return
      event.stopPropagation()
      event.preventDefault()
      dragRef.current = {
        mode,
        startX: event.clientX,
        origStart: element.s,
        origEnd: element.e,
      }
      setPreviewTimes(null)
      onDragStateChange(true)
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [disabled, element.e, element.s, onDragStateChange]
  )

  const moveDrag = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const drag = dragRef.current
      const laneEl = laneMeasureRef.current
      if (!drag || !laneEl) return

      event.stopPropagation()
      const { start, end } = computeAdClipDragRange(
        drag,
        event.clientX,
        laneEl.offsetWidth,
        timelineDuration,
        episodeDurationSeconds
      )
      setPreviewTimes({ start, end })
    },
    [episodeDurationSeconds, laneMeasureRef, timelineDuration]
  )

  const endDrag = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const drag = dragRef.current
      const laneEl = laneMeasureRef.current
      if (!drag) return

      if (laneEl) {
        const { start, end } = computeAdClipDragRange(
          drag,
          event.clientX,
          laneEl.offsetWidth,
          timelineDuration,
          episodeDurationSeconds
        )
        commitUpdate(start, end)
      }

      dragRef.current = null
      setPreviewTimes(null)
      onDragStateChange(false)
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
    },
    [
      commitUpdate,
      episodeDurationSeconds,
      laneMeasureRef,
      onDragStateChange,
      timelineDuration,
    ]
  )

  return (
    <div
      className={clsx(
        "absolute bottom-0 top-0 touch-none select-none",
        disabled ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"
      )}
      style={{ left: `${displayLeft}%`, width: `${Math.max(displayWidth, 1)}%` }}
      title={`${element.name} (${formatTimeHms(clipStart)} – ${formatTimeHms(clipEnd)})`}
      onPointerDown={(event) => beginDrag(event, "move")}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        className={clsx(
          "pointer-events-none absolute inset-0 flex items-start justify-center rounded-t pt-1 text-xs font-bold text-white shadow-sm",
          getElementColor(element)
        )}
      >
        {getElementLabel(element)}
      </div>
      {!disabled && (
        <>
          <div
            className="absolute bottom-0 left-0 top-0 z-10 w-2 cursor-ew-resize"
            onPointerDown={(event) => beginDrag(event, "start")}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClick={(event) => event.stopPropagation()}
          />
          <div
            className="absolute bottom-0 right-0 top-0 z-10 w-2 cursor-ew-resize"
            onPointerDown={(event) => beginDrag(event, "end")}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClick={(event) => event.stopPropagation()}
          />
        </>
      )}
    </div>
  )
}

function Playhead({
  playhead,
  timelineDuration,
}: {
  playhead: number
  timelineDuration: number
}) {
  const left = (playhead / timelineDuration) * 100

  return (
    <div
      className="ads-timeline-playhead"
      style={{ left: `${left}%` }}
    >
      <div className="ads-timeline-playhead-handle" />
    </div>
  )
}
