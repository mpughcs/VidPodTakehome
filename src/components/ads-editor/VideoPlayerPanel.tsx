"use client"

import { LivePlayer } from "@twick/live-player"
import {
  CornerDownLeft,
  CornerDownRight,
  FastForward,
  Pause,
  Play,
  Rewind,
} from "lucide-react"
import { TbRewindBackward10,TbRewindForward10 } from "react-icons/tb";

import { useCallback, useMemo, useState } from "react"
import { useAdsTimeline } from "@/context/AdsTimelineContext"
import {
  contentTimeToOutput,
  getLivePlayerProjectForEpisode,
  outputTimeToContent,
  withAdMarkersOnLivePlayerProject,
} from "@/lib/live-player-project"
import type { Episode } from "@/types/episode"

type VideoPlayerPanelProps = {
  episode: Episode
}

export function VideoPlayerPanel({ episode }: VideoPlayerPanelProps) {
  const {
    adMarkers,
    currentTime,
    seekTo,
    seekTime,
    setCurrentTime,
    episodeDurationSeconds,
  } = useAdsTimeline()
  const [playing, setPlaying] = useState(false)

  const projectData = useMemo(() => {
    const base = getLivePlayerProjectForEpisode(episode)
    if (!base) return null
    return withAdMarkersOnLivePlayerProject(base, adMarkers)
  }, [episode, adMarkers])

  const playerSeekTime = useMemo(
    () => contentTimeToOutput(seekTime, adMarkers),
    [seekTime, adMarkers]
  )

  const handleTimeUpdate = useCallback(
    (outputTime: number) => {
      setCurrentTime(outputTimeToContent(outputTime, adMarkers))
    },
    [adMarkers, setCurrentTime]
  )

  const videoSize = useMemo(() => {
    if (projectData?.input.properties) {
      return projectData.input.properties
    }
    return { width: 1280, height: 720 }
  }, [projectData])

  const aspectRatio = `${videoSize.width} / ${videoSize.height}`
  const controlsDisabled = !projectData

  const seekBy = useCallback(
    (delta: number) => {
      seekTo(currentTime + delta)
    },
    [currentTime, seekTo]
  )

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {!projectData ? (
        <div className="mx-auto flex aspect-video w-full max-w-[480px] items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500">
          Import an MP4 to preview this episode.
        </div>
      ) : (
        <div
          className="mx-auto overflow-hidden rounded-xl bg-black"
          style={{ width: "100%", maxWidth: 480, aspectRatio }}
        >
          <LivePlayer
            key={`${episode.id}-${episode.src ?? "no-src"}`}
            projectData={projectData}
            videoSize={videoSize}
            playing={playing}
            seekTime={playerSeekTime}
            onTimeUpdate={handleTimeUpdate}
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          disabled={controlsDisabled}
          onClick={() => seekTo(0)}
          className="btn btn-ghost btn-sm gap-1 rounded-full"
        >
          <CornerDownLeft className="h-4 w-4" />
          Jump to start
        </button>
        <button
          type="button"
          disabled={controlsDisabled}
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
          disabled={controlsDisabled}
          onClick={() => seekBy(10)}
          className="btn btn-ghost btn-sm rounded-full"
        >
          <TbRewindForward10 className="h-6 w-6" />
        </button>
        <button
          type="button"
          disabled={controlsDisabled}
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
