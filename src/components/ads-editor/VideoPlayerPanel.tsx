"use client"

import {
  CornerDownLeft,
  CornerDownRight,
  Pause,
  Play,
  SkipForward,
} from "lucide-react"
import { TbRewindBackward10, TbRewindForward10 } from "react-icons/tb"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { formatTimeSimple } from "@twick/timeline"

import { openImportMp4Modal } from "@/components/ads-editor/ImportMp4Modal"
import { InterstitialPreview } from "@/components/ads-editor/InterstitialPreview"
import { useAdsTimeline } from "@/context/AdsTimelineContext"
import { getContentTimelineDuration } from "@/lib/interstitial-playback"
import type { Episode } from "@/types/episode"

type VideoPlayerPanelProps = {
  episode: Episode
}

export function VideoPlayerPanel({ episode }: VideoPlayerPanelProps) {
  const {
    currentTime,
    seekTo,
    episodeDurationSeconds,
    playbackMarkers,
    isAdPlaying,
    skipAd,
  } = useAdsTimeline()
  const [playing, setPlaying] = useState(false)
  const [scrubTime, setScrubTime] = useState(currentTime)
  const isScrubbingRef = useRef(false)

  const controlsDisabled = !episode.src
  const seekDisabled = controlsDisabled || isAdPlaying

  const contentDuration = useMemo(
    () => getContentTimelineDuration(playbackMarkers, episodeDurationSeconds),
    [playbackMarkers, episodeDurationSeconds]
  )

  useEffect(() => {
    if (!isScrubbingRef.current) {
      setScrubTime(currentTime)
    }
  }, [currentTime])

  const seekBy = useCallback(
    (delta: number) => {
      seekTo(currentTime + delta)
    },
    [currentTime, seekTo]
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space") return
      const target = event.target as HTMLElement | null
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return
      }
      event.preventDefault()
      setPlaying((prev) => !prev)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {!episode.src ? (
        <div className="mx-auto flex aspect-video w-full max-w-[480px] flex-col items-center justify-center gap-2 rounded-xl bg-slate-100 text-sm text-slate-500">
          <span>Import an MP4 to preview this episode.</span>
          <button
            type="button"
            onClick={() => openImportMp4Modal(episode.id)}
            className="btn btn-sm btn-neutral"
          >
            Import MP4
          </button>
        </div>
      ) : (
        <div
          className="relative mx-auto overflow-hidden rounded-xl bg-black"
          style={{ width: "100%", maxWidth: 480, aspectRatio: "16 / 9" }}
        >
          <InterstitialPreview
            episodeSrc={episode.src}
            playing={playing}
            onPlayingChange={setPlaying}
          />
          {isAdPlaying && (
            <button
              type="button"
              onClick={skipAd}
              className="absolute bottom-3 right-3 btn btn-sm gap-1.5 rounded-full border-none bg-black/70 text-white hover:bg-black/85"
            >
              <SkipForward className="h-4 w-4" />
              Skip ad
            </button>
          )}
        </div>
      )}

      {episode.src && (
        <div className="mx-auto mt-3 w-full max-w-[480px]">
          <input
            type="range"
            min={0}
            max={Math.max(contentDuration, 0.001)}
            step={0.05}
            value={Math.min(scrubTime, contentDuration)}
            disabled={seekDisabled}
            aria-label="Seek playback"
            className="range range-neutral range-sm w-full disabled:opacity-40"
            onPointerDown={() => {
              isScrubbingRef.current = true
            }}
            onPointerUp={() => {
              isScrubbingRef.current = false
            }}
            onPointerCancel={() => {
              isScrubbingRef.current = false
            }}
            onChange={(event) => {
              const next = Number(event.target.value)
              setScrubTime(next)
              seekTo(next)
            }}
          />
          <div className="mt-1 flex justify-between font-mono text-xs text-slate-500">
            <span>{formatTimeSimple(scrubTime)}</span>
            <span>{formatTimeSimple(contentDuration)}</span>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          disabled={seekDisabled}
          onClick={() => seekTo(0)}
          className="btn btn-ghost btn-sm gap-1 rounded-full"
        >
          <CornerDownLeft className="h-4 w-4" />
          Jump to start
        </button>
        <button
          type="button"
          disabled={seekDisabled}
          onClick={() => seekBy(-10)}
          className="btn btn-ghost btn-sm rounded-full"
        >
          <TbRewindBackward10 className="h-6 w-6" />
        </button>

        <button
          type="button"
          disabled={controlsDisabled}
          onClick={() => setPlaying((prev) => !prev)}
          className="btn btn-circle btn-neutral"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <Pause className="h-5 w-5 fill-current" />
          ) : (
            <Play className="h-5 w-5 fill-current" />
          )}
        </button>

        <button
          type="button"
          disabled={seekDisabled}
          onClick={() => seekBy(10)}
          className="btn btn-ghost btn-sm rounded-full"
        >
          <TbRewindForward10 className="h-6 w-6" />
        </button>
        <button
          type="button"
          disabled={seekDisabled}
          onClick={() => seekTo(episodeDurationSeconds)}
          className="btn btn-ghost btn-sm gap-1 rounded-full"
        >
          Jump to end
          <CornerDownRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
