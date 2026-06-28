"use client"

import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react"
import clsx from "clsx"
import {
  formatTimeSimple,
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
export const TIMELINE_ZOOM_MIN = 0.5
export const TIMELINE_ZOOM_MAX = 2
export const TIMELINE_ZOOM_STEP = 0.25
 
function getLaneMetrics(container: HTMLElement) {
  const rect = container.getBoundingClientRect()
  const styles = getComputedStyle(container)
  const padLeft = Number.parseFloat(styles.paddingLeft) || 0
  const padRight = Number.parseFloat(styles.paddingRight) || 0
  const laneLeft = rect.left + padLeft + TRACK_GUTTER_PX
  const laneWidth = rect.width - padLeft - padRight - TRACK_GUTTER_PX
  return { laneLeft, laneWidth: Math.max(laneWidth, 1) }
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
  onZoomChange?: (zoom: number) => void
}

type AdDragMode = "move" | "start" | "end"

export function TwickTimelineRenderer({
  durationSeconds = FALLBACK_DURATION_SECONDS,
  zoom = 1,
  onZoomChange,
}: TwickTimelineRendererProps) {
  const { present } = useTimelineContext()
  const { currentTime, seekTo, isAdPlaying, setTimelineDragging } = useAdsTimeline()
  const trackRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)

  const tracks = present?.tracks ?? []
  const timelineDuration = useMemo(() => {
    let maxEnd = 0
    for (const track of tracks) {
      for (const element of track.elements ?? []) {
        maxEnd = Math.max(maxEnd, element.e)
      }
    }
    return maxEnd || durationSeconds
  }, [tracks, durationSeconds])
  const visibleDuration = timelineDuration / zoom

  const timeLabels = useMemo(() => {
    const interval = visibleDuration <= 120 ? 30 : 60
    const labels: number[] = []
    for (let t = 0; t <= visibleDuration; t += interval) {
      labels.push(t)
    }
    return labels
  }, [visibleDuration])

  const seekFromClientX = useCallback(
    (clientX: number) => {
      if (isAdPlaying || draggingRef.current) return
      const el = trackRef.current
      if (!el) return
      const { laneLeft, laneWidth } = getLaneMetrics(el)
      const ratio = Math.min(
        1,
        Math.max(0, (clientX - laneLeft) / laneWidth)
      )
      seekTo(ratio * visibleDuration)
    },
    [isAdPlaying, seekTo, visibleDuration]
  )

  return (
    <div className="ads-custom-timeline">
      <div className="ads-timeline-scroll">
        <div className="ads-timeline-ruler">
          <div className="ads-timeline-ruler-gutter" aria-hidden />
          <div className="ads-timeline-ruler-track">
            <div className="ads-timeline-ruler-labels">
              {timeLabels.map((seconds) => (
                <span key={seconds}>{formatTimeSimple(seconds)}</span>
              ))}
            </div>
          </div>
        </div>

        <div
          ref={trackRef}
          className={clsx(
            "ads-timeline-tracks",
            isAdPlaying ? "cursor-not-allowed opacity-60" : "cursor-pointer"
          )}
          onClick={(e) => seekFromClientX(e.clientX)}
          role="presentation"
          title={isAdPlaying ? "Timeline locked during ad playback" : undefined}
        >
          <div className="space-y-0">
            {tracks.map((track) => (
              <TimelineTrackRow
                key={track.id}
                track={track}
                durationSeconds={visibleDuration}
                trackContainerRef={trackRef}
                disabled={isAdPlaying}
                onDragStateChange={(dragging) => {
                  draggingRef.current = dragging
                  setTimelineDragging(dragging)
                }}
              />
            ))}
          </div>

          <Playhead playhead={currentTime} durationSeconds={visibleDuration} />
        </div>

        <div className="ads-timeline-footer">
          <input
            type="range"
            min={TIMELINE_ZOOM_MIN}
            max={TIMELINE_ZOOM_MAX}
            step={TIMELINE_ZOOM_STEP}
            value={zoom}
            onChange={(e) => onZoomChange?.(Number(e.target.value))}
            className="range range-xs w-full"
            aria-label="Timeline zoom"
          />
          <div className="ads-timeline-clock">
            {formatTimeSimple(currentTime)}
          </div>
        </div>
      </div>
    </div>
  )
}

function TimelineTrackRow({
  track,
  durationSeconds,
  trackContainerRef,
  disabled,
  onDragStateChange,
}: {
  track: TrackJSON
  durationSeconds: number
  trackContainerRef: React.RefObject<HTMLDivElement | null>
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
        className={clsx(
          "ads-timeline-track",
          isAdTrack && "ads-timeline-track-ads",
          isEpisodeTrack && "ads-timeline-track-episode"
        )}
      >
        {track.elements.map((element) => {
        const left = (element.s / durationSeconds) * 100
        const width = ((element.e - element.s) / durationSeconds) * 100

        if (isAdMarkerElement(element)) {
          return (
            <DraggableAdClip
              key={element.id}
              element={element}
              durationSeconds={durationSeconds}
              trackContainerRef={trackContainerRef}
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
            title={`${element.name} (${formatTimeSimple(element.s)} – ${formatTimeSimple(element.e)})`}
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
      title={`${element.name} (${formatTimeSimple(element.s)} – ${formatTimeSimple(element.e)})`}
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
  durationSeconds: number,
  episodeDurationSeconds: number
) {
  const deltaSeconds = ((clientX - drag.startX) / laneWidth) * durationSeconds

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
  durationSeconds,
  trackContainerRef,
  disabled,
  onDragStateChange,
}: {
  element: ElementJSON
  durationSeconds: number
  trackContainerRef: React.RefObject<HTMLDivElement | null>
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
  const displayLeft = (clipStart / durationSeconds) * 100
  const displayWidth = ((clipEnd - clipStart) / durationSeconds) * 100

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
      const container = trackContainerRef.current
      if (!drag || !container) return

      event.stopPropagation()
      const { laneWidth } = getLaneMetrics(container)
      const { start, end } = computeAdClipDragRange(
        drag,
        event.clientX,
        laneWidth,
        durationSeconds,
        episodeDurationSeconds
      )
      setPreviewTimes({ start, end })
    },
    [durationSeconds, episodeDurationSeconds, trackContainerRef]
  )

  const endDrag = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const drag = dragRef.current
      const container = trackContainerRef.current
      if (!drag) return

      if (container) {
        const { laneWidth } = getLaneMetrics(container)
        const { start, end } = computeAdClipDragRange(
          drag,
          event.clientX,
          laneWidth,
          durationSeconds,
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
      durationSeconds,
      episodeDurationSeconds,
      onDragStateChange,
      trackContainerRef,
    ]
  )

  return (
    <div
      className={clsx(
        "absolute bottom-0 top-0 touch-none select-none",
        disabled ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"
      )}
      style={{ left: `${displayLeft}%`, width: `${Math.max(displayWidth, 1)}%` }}
      title={`${element.name} (${formatTimeSimple(clipStart)} – ${formatTimeSimple(clipEnd)})`}
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
  durationSeconds,
}: {
  playhead: number
  durationSeconds: number
}) {
  const left = (playhead / durationSeconds) * 100

  return (
    <div
      className="ads-timeline-playhead"
      style={{
        left: `calc(0.75rem + ${TRACK_GUTTER_PX}px + (100% - 1.5rem - ${TRACK_GUTTER_PX}px) * ${left / 100})`,
      }}
    >
      <div className="ads-timeline-playhead-handle" />
    </div>
  )
}
