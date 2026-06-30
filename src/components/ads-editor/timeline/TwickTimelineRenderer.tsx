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
import { isAdMarkerElement, patchAdMarkerTimesInProject } from "@/lib/ad-markers-timeline"
import {
  contentTimeToEpisodeTime,
  getEpisodeSrcSegments,
} from "@/lib/interstitial-playback"

import "@/styles/ads-timeline.css"

const FALLBACK_DURATION_SECONDS = 300
const MIN_AD_CLIP_SECONDS = 1
const WAVEFORM_BAR_SPACING_PX = 6

export { TIMELINE_ZOOM_MAX, TIMELINE_ZOOM_MIN } from "@/lib/timeline-viewport"

function getTimeFromClientX(
  clientX: number,
  laneEl: HTMLElement,
  timelineDuration: number
) {
  const rect = laneEl.getBoundingClientRect()
  if (rect.width <= 0) return 0
  const ratio = (clientX - rect.left) / rect.width
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
  const { currentTime, seekTo, isAdPlaying, setTimelineDragging, playbackMarkers } =
    useAdsTimeline()
  const scrollRef = useRef<HTMLDivElement>(null)
  const laneRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const syncingScrollRef = useRef(false)

  const tracks: TrackJSON[] = present?.tracks ?? []
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

  const adElements = useMemo(
    () =>
      tracks.flatMap((track) =>
        track.elements.filter((element) => isAdMarkerElement(element))
      ),
    [tracks]
  )

  const srcSegments = useMemo(
    () => getEpisodeSrcSegments(timelineDuration, playbackMarkers),
    [playbackMarkers, timelineDuration]
  )

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

  const { majorTicks, minorTicks } = useMemo(() => {
    const major = timelineDuration <= 120 ? 30 : timelineDuration <= 600 ? 60 : 120
    const minor = major / 4
    const majors: number[] = []
    for (let t = 0; t <= timelineDuration + 0.001; t += major) majors.push(t)
    const minors: number[] = []
    for (let t = 0; t <= timelineDuration + 0.001; t += minor) {
      if (t % major !== 0) minors.push(t)
    }
    return { majorTicks: majors, minorTicks: minors }
  }, [timelineDuration])

  const seekFromClientX = useCallback(
    (clientX: number) => {
      if (isAdPlaying || draggingRef.current) return
      const laneEl = laneRef.current
      if (!laneEl) return
      seekTo(getTimeFromClientX(clientX, laneEl, timelineDuration))
    },
    [isAdPlaying, seekTo, timelineDuration]
  )

  const onDragStateChange = useCallback(
    (dragging: boolean) => {
      draggingRef.current = dragging
      setTimelineDragging(dragging)
    },
    [setTimelineDragging]
  )

  return (
    <div className="ads-custom-timeline">
      <div ref={scrollRef} className="ads-timeline-scroll" onScroll={handleScroll}>
        <div
          className="ads-timeline-inner"
          style={{ width: `${innerWidthPercent}%` }}
        >
          <div className="ads-timeline-frame">
            <div
              ref={laneRef}
              className={clsx(
                "ads-timeline-lane",
                isAdPlaying ? "cursor-not-allowed" : "cursor-pointer"
              )}
              onClick={(e) => seekFromClientX(e.clientX)}
              role="presentation"
            >
              {srcSegments.map((segment) => (
                <SrcSegmentClip
                  key={`${segment.timelineStart}-${segment.timelineEnd}`}
                  segment={segment}
                  timelineDuration={timelineDuration}
                  waveformSeed={Math.floor(
                    contentTimeToEpisodeTime(segment.timelineStart, playbackMarkers)
                  )}
                />
              ))}

              {adElements.map((element) => (
                <DraggableAdClip
                  key={element.id}
                  element={element}
                  timelineDuration={timelineDuration}
                  laneMeasureRef={laneRef}
                  disabled={isAdPlaying}
                  onDragStateChange={onDragStateChange}
                />
              ))}
            </div>

            <Playhead playhead={currentTime} timelineDuration={timelineDuration} />
          </div>

          <div className="ads-timeline-ruler" aria-hidden>
            {minorTicks.map((t) => (
              <i
                key={`minor-${t}`}
                className="ads-timeline-tick"
                style={{ left: `${(t / timelineDuration) * 100}%` }}
              />
            ))}
            {majorTicks.map((t, index) => {
              const pct = (t / timelineDuration) * 100
              const isFirst = index === 0
              const isLast = index === majorTicks.length - 1
              const translate = isFirst ? "0" : isLast ? "-100%" : "-50%"
              return (
                <span key={`major-${t}`}>
                  <i
                    className="ads-timeline-tick ads-timeline-tick-major"
                    style={{ left: `${pct}%` }}
                  />
                  <span
                    className="ads-timeline-ruler-label"
                    style={{ left: `${pct}%`, transform: `translateX(${translate})` }}
                  >
                    {formatTimeHms(t)}
                  </span>
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function pseudoRandom(index: number) {
  const x = Math.sin(index * 12.9898 + 1.2345) * 43758.5453
  return x - Math.floor(x)
}

function SrcSegmentClip({
  segment,
  timelineDuration,
  waveformSeed,
}: {
  segment: { timelineStart: number; timelineEnd: number }
  timelineDuration: number
  waveformSeed: number
}) {
  const left = (segment.timelineStart / timelineDuration) * 100
  const width = ((segment.timelineEnd - segment.timelineStart) / timelineDuration) * 100

  return (
    <div
      className="ads-timeline-src-segment"
      style={{ left: `${left}%`, width: `${Math.max(width, 0)}%` }}
      aria-hidden
    >
      <SrcWaveform seed={waveformSeed} />
    </div>
  )
}

function SrcWaveform({ seed = 0 }: { seed?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [count, setCount] = useState(120)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width
      setCount(Math.max(8, Math.floor(width / WAVEFORM_BAR_SPACING_PX)))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const heights = useMemo(
    () =>
      Array.from(
        { length: count },
        (_value, index) => 16 + pseudoRandom(index + seed * 17) * 74
      ),
    [count, seed]
  )

  return (
    <div ref={ref} className="ads-timeline-waveform" aria-hidden>
      {heights.map((height, index) => (
        <span key={index} style={{ height: `${height}%` }} />
      ))}
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
        className="ads-timeline-ad-card"
        data-mode={element.props?.adMode as string | undefined}
      >
        <span className="ads-timeline-ad-pill">{getElementLabel(element)}</span>
        <span className="ads-timeline-ad-grip" aria-hidden>
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </span>
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
    <div className="ads-timeline-playhead" style={{ left: `${left}%` }}>
      <div className="ads-timeline-playhead-handle">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}
