"use client"


import { TbRewindBackward10, TbRewindForward10 } from "react-icons/tb"
import { useCallback, useEffect, useState } from "react"

import { openImportMp4Modal } from "@/components/ads-editor/ImportMp4Modal"
import { InterstitialPreview } from "@/components/ads-editor/InterstitialPreview"
import { useAdsTimeline } from "@/context/AdsTimelineContext"
import type { Episode } from "@/types/episode"
import { PiArrowLineLeftFill } from "react-icons/pi";
import { PiArrowLineRightFill } from "react-icons/pi";
import { FaClockRotateLeft } from "react-icons/fa6";
import { FaPause } from "react-icons/fa";
import { FaPlay } from "react-icons/fa";



import { FaBackward } from "react-icons/fa";
import { FaForward } from "react-icons/fa";
type VideoPlayerPanelProps = {
  episode: Episode
}

export function VideoPlayerPanel({ episode }: VideoPlayerPanelProps) {
  const {
    currentTime,
    seekTo,
    episodeDurationSeconds,
    isAdPlaying,
    skipAd,
  } = useAdsTimeline()
  const [playing, setPlaying] = useState(false)

  const controlsDisabled = !episode.src
  const seekDisabled = controlsDisabled || isAdPlaying

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
    <div className="flex flex-col gap-4">
      {!episode.src ? (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 text-sm text-slate-500">
          <span>Import an MP4 to preview this episode.</span>
          <button
            type="button"
            onClick={() => openImportMp4Modal(episode.id)}
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Import MP4
          </button>
        </div>
      ) : (
        <div className=" bg-white rounded-xl border border-slate-200  p-4 shadow-sm">
          <div className="relative overflow-hidden rounded-xl ">
            <div className="aspect-video w-full">
              <InterstitialPreview
                episodeSrc={episode.src}
                playing={playing}
                onPlayingChange={setPlaying}
              />
            </div>
            {isAdPlaying && (
              <button
                type="button"
                onClick={skipAd}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-sm text-white hover:bg-black/85"
              >
                <FaForward className="h-4 w-4" />
                Skip ad
              </button>
            )}

            <div className="flex items-center justify-between  rounded-xl border border-slate-200 bg-white px-4 py-1 shadow-sm mt-4">
              <button
                type="button"
                disabled={seekDisabled}
                onClick={() => seekTo(0)}
                className="flex items-center justify-start rounded-lg text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30 flex-1 max-w-[120px] mr-auto m-1"
                aria-label="Jump to start"
              >
                <div className="rounded-full border border-slate-200 p-2">
                  <PiArrowLineLeftFill className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-slate-500 ml-2">Jump to start</span>
              </button>

              <button
                type="button"
                disabled={seekDisabled}
                onClick={() => seekBy(-10)}
                className="flex h-9 items-center justify-center rounded-lg px-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30 gap-1 mr-2"
                aria-label="Back 10 seconds"
              >
                <FaClockRotateLeft className="h-3 w-3" />
                <span>10s </span>
              </button>
              <button
                type="button"
                disabled={seekDisabled}
                onClick={() => seekBy(-5)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-black transition-colors hover:bg-slate-100 disabled:opacity-30"
                aria-label="Rewind"
              >
                <FaBackward className="h-4 w-4" />
              </button>

              <button
                type="button"
                disabled={controlsDisabled}
                onClick={() => setPlaying((prev) => !prev)}
                className="flex h-9 w-9 items-center justify-center text-black transition-colors hover:bg-slate-100 rounded-full disabled:opacity-30"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? (
                  <FaPause className="h-6 w-6 fill-current" />
                ) : (
                  <FaPlay className="h-6 w-6 fill-current" />
                )}
              </button>

              <button
                type="button"
                disabled={seekDisabled}
                onClick={() => seekBy(5)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-black transition-colors hover:bg-slate-100 disabled:opacity-30"
                aria-label="Fast forward"
              >
                <FaForward className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={seekDisabled}
                onClick={() => seekBy(10)}
                className="flex h-9 items-center justify-center rounded-lg px-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30 gap-1 ml-2"
                aria-label="Forward 10 seconds"
              >
                <span>10s </span>
                <FaClockRotateLeft className="h-3 w-3 rotate-y-180" />
              </button>
              <button
                type="button"
                disabled={seekDisabled}
                onClick={() => seekTo(episodeDurationSeconds)}
                className="flex items-center justify-end rounded-lg text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30  max-w-[120px] ml-auto  m-1"
                aria-label="Jump to end"
              >
                <span className="text-xs font-semibold text-slate-500 mr-2">Jump to end</span>
                <div className="rounded-full border border-slate-200 p-2">
                  <PiArrowLineRightFill className="h-4 w-4" />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
