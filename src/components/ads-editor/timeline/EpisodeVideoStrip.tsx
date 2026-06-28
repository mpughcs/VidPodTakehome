"use client"

import { getThumbnailCached } from "@twick/media-utils"
import { useEffect, useMemo, useRef, useState } from "react"

const MAX_THUMBNAILS_PER_CLIP = 24
const MIN_THUMBNAIL_WIDTH = 40
const MAX_THUMBNAIL_WIDTH = 96
const THUMB_CONCURRENCY = 3

function getThumbnailCount(widthPx: number, heightPx: number) {
  const targetThumbWidth = Math.max(
    MIN_THUMBNAIL_WIDTH,
    Math.min(MAX_THUMBNAIL_WIDTH, Math.round(heightPx * 1.5))
  )
  return Math.max(
    1,
    Math.min(MAX_THUMBNAILS_PER_CLIP, Math.ceil(widthPx / targetThumbWidth))
  )
}

async function runWithConcurrencyLimit(
  tasks: Array<() => Promise<void>>,
  concurrency: number
) {
  const active = new Set<Promise<void>>()
  for (const task of tasks) {
    const promise = task()
    active.add(promise)
    promise.finally(() => active.delete(promise))
    if (active.size >= concurrency) {
      await Promise.race(active)
    }
  }
  await Promise.all(active)
}

type EpisodeVideoStripProps = {
  src: string
  durationSec: number
  mediaOffsetSec?: number
  mediaDurationSec?: number
}

export function EpisodeVideoStrip({
  src,
  durationSec,
  mediaOffsetSec = 0,
  mediaDurationSec,
}: EpisodeVideoStripProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ widthPx: 0, heightPx: 0 })
  const [thumbs, setThumbs] = useState<Record<number, string>>({})

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ widthPx: width, heightPx: height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const count = useMemo(
    () => getThumbnailCount(size.widthPx, size.heightPx),
    [size.widthPx, size.heightPx]
  )

  const slots = useMemo(() => {
    const timelineDuration = Math.max(0.001, durationSec)
    return Array.from({ length: count }, (_value, index) => {
      const progress = count === 1 ? 0 : index / (count - 1)
      const timelineTime = progress * timelineDuration
      let mediaTime = Math.max(0, mediaOffsetSec + timelineTime)
      if (typeof mediaDurationSec === "number" && mediaDurationSec > 0) {
        mediaTime = Math.min(mediaTime, Math.max(0, mediaDurationSec - 0.05))
      }
      return mediaTime
    })
  }, [count, durationSec, mediaOffsetSec, mediaDurationSec])

  useEffect(() => {
    if (!src || count === 0 || size.widthPx <= 0) {
      setThumbs({})
      return
    }

    let cancelled = false

    async function loadThumbs() {
      const nextThumbs: Record<number, string> = {}
      const tasks = slots.map((seekTime, index) => async () => {
        try {
          const thumb = await getThumbnailCached(src, seekTime)
          nextThumbs[index] = thumb
        } catch {
          // Keep gradient fallback for failed frames.
        }
      })

      await runWithConcurrencyLimit(tasks, THUMB_CONCURRENCY)
      if (!cancelled) {
        setThumbs(nextThumbs)
      }
    }

    void loadThumbs()

    return () => {
      cancelled = true
    }
  }, [src, slots, count, size.widthPx])

  return (
    <div
      ref={containerRef}
      className="ads-timeline-media-strip ads-timeline-media-strip-video"
      aria-hidden
    >
      {slots.map((_seekTime, index) => (
        <img
          key={`${src}-${index}-${slots[index]?.toFixed(2) ?? index}`}
          src={thumbs[index]}
          className="ads-timeline-media-strip-thumb"
          alt=""
          draggable={false}
        />
      ))}
    </div>
  )
}
