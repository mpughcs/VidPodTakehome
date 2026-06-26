import {
  loadLivePlayerProject,
  saveLivePlayerProject,
} from "@/lib/ads-editor-storage"
import type { AdMarker } from "@/types/ad-marker"
import type { Episode } from "@/types/episode"
import type {
  LivePlayerProjectData,
  LivePlayerTextElement,
  LivePlayerTrack,
  LivePlayerVideoElement,
} from "@/types/live-player-project"

type BuildMp4ProjectInput = {
  src: string
  title: string
  durationSeconds: number
  width: number
  height: number
}

function createElementId() {
  return `e-${Math.random().toString(36).slice(2, 14)}`
}

function videoFrame(width: number, height: number) {
  return { size: [width, height] as [number, number], layout: false, clip: "true" }
}

function buildVideoSegment({
  src,
  width,
  height,
  timelineStart,
  timelineEnd,
  sourceStart,
}: {
  src: string
  width: number
  height: number
  timelineStart: number
  timelineEnd: number
  sourceStart: number
}): LivePlayerVideoElement {
  return {
    id: createElementId(),
    type: "video",
    s: timelineStart,
    e: timelineEnd,
    objectFit: "contain",
    frame: videoFrame(width, height),
    props: {
      time: sourceStart,
      src,
      play: true,
      decoder: "slow",
      volume: 1,
      playbackRate: 1,
    },
  }
}

function buildVideoElement({
  src,
  durationSeconds,
  width,
  height,
}: {
  src: string
  durationSeconds: number
  width: number
  height: number
}): LivePlayerVideoElement {
  return buildVideoSegment({
    src,
    width,
    height,
    timelineStart: 0,
    timelineEnd: Math.max(durationSeconds, 1),
    sourceStart: 0,
  })
}

function normalizeLivePlayerProject(
  project: LivePlayerProjectData
): LivePlayerProjectData {
  const { width, height } = project.input.properties

  return {
    ...project,
    input: {
      ...project.input,
      tracks: project.input.tracks.map((track) => ({
        ...track,
        elements: track.elements.map((element) => {
          if (element.type !== "video" || !element.props?.src) return element

          return {
            ...element,
            objectFit: element.objectFit ?? "contain",
            frame: element.frame ?? videoFrame(width, height),
            props: {
              time: 0,
              play: true,
              decoder: "slow",
              volume: 1,
              playbackRate: 1,
              ...element.props,
              src: element.props.src,
            },
          }
        }),
      })),
    },
  }
}

export function buildLivePlayerProjectFromMp4({
  src,
  title,
  durationSeconds,
  width,
  height,
}: BuildMp4ProjectInput): LivePlayerProjectData {
  return {
    version: 1,
    input: {
      properties: { width, height },
      tracks: [
        {
          id: "track-episode-video",
          type: "video",
          name: title,
          elements: [
            buildVideoElement({ src, durationSeconds, width, height }),
          ],
        },
      ],
    },
  }
}

export function getLivePlayerProjectForEpisode(
  episode: Episode
): LivePlayerProjectData | null {
  const stored = loadLivePlayerProject(episode.id)
  if (stored) return normalizeLivePlayerProject(stored)

  if (!episode.src) return null

  return buildLivePlayerProjectFromMp4({
    src: episode.src,
    title: episode.title,
    durationSeconds: episode.duration,
    width: 1280,
    height: 720,
  })
}

const MARKER_LABELS: Record<AdMarker["mode"], string> = {
  static: "Static ad",
  auto: "Auto ad",
  ab: "A/B ad",
}

export function contentTimeToOutput(
  contentSeconds: number,
  markers: AdMarker[]
): number {
  const sorted = [...markers].sort((a, b) => a.startSeconds - b.startSeconds)
  let inserted = 0
  for (const marker of sorted) {
    if (contentSeconds > marker.startSeconds) {
      inserted += marker.endSeconds - marker.startSeconds
    }
  }
  return contentSeconds + inserted
}

export function outputTimeToContent(
  outputSeconds: number,
  markers: AdMarker[]
): number {
  const sorted = [...markers].sort((a, b) => a.startSeconds - b.startSeconds)
  let outputPos = 0
  let contentPos = 0

  for (const marker of sorted) {
    const breakAt = marker.startSeconds
    const adLen = marker.endSeconds - marker.startSeconds
    const breakOutput = contentTimeToOutput(breakAt, sorted)

    if (outputSeconds < breakOutput) {
      return contentPos + (outputSeconds - outputPos)
    }
    if (outputSeconds < breakOutput + adLen) {
      return breakAt
    }

    outputPos = breakOutput + adLen
    contentPos = breakAt
  }

  return contentPos + (outputSeconds - outputPos)
}

export function withAdMarkersOnLivePlayerProject(
  project: LivePlayerProjectData,
  markers: AdMarker[]
): LivePlayerProjectData {
  if (markers.length === 0) return project

  const videoTrack = project.input.tracks.find((track) => track.type === "video")
  const sourceVideo = videoTrack?.elements.find(
    (element): element is LivePlayerVideoElement =>
      element.type === "video" && Boolean(element.props?.src)
  )
  if (!sourceVideo) return project

  const { width, height } = project.input.properties
  const src = sourceVideo.props.src
  const episodeEnd = sourceVideo.e
  const sorted = [...markers].sort((a, b) => a.startSeconds - b.startSeconds)

  const videoElements: LivePlayerVideoElement[] = []
  const adElements: LivePlayerTextElement[] = []
  let contentPos = 0
  let outputPos = 0

  for (const marker of sorted) {
    const breakAt = Math.min(marker.startSeconds, episodeEnd)
    if (breakAt > contentPos) {
      const segmentLength = breakAt - contentPos
      videoElements.push(
        buildVideoSegment({
          src,
          width,
          height,
          timelineStart: outputPos,
          timelineEnd: outputPos + segmentLength,
          sourceStart: contentPos,
        })
      )
      outputPos += segmentLength
      contentPos = breakAt
    }

    const adLength = Math.max(0, marker.endSeconds - marker.startSeconds)
    if (adLength > 0) {
      adElements.push({
        id: `marker-${marker.id}`,
        type: "text",
        s: outputPos,
        e: outputPos + adLength,
        props: {
          text: MARKER_LABELS[marker.mode],
          fontSize: Math.round(width * 0.05),
          fill: "#FFFFFF",
          textAlign: "center",
        },
      })
      outputPos += adLength
    }
  }

  if (contentPos < episodeEnd) {
    const segmentLength = episodeEnd - contentPos
    videoElements.push(
      buildVideoSegment({
        src,
        width,
        height,
        timelineStart: outputPos,
        timelineEnd: outputPos + segmentLength,
        sourceStart: contentPos,
      })
    )
  }

  const tracks: LivePlayerTrack[] = [
    {
      id: videoTrack?.id ?? "track-episode-video",
      type: "video",
      name: videoTrack?.name ?? "Episode",
      elements: videoElements,
    },
  ]

  if (adElements.length > 0) {
    tracks.push({
      id: "track-ad-markers",
      type: "element",
      name: "Ad markers",
      elements: adElements,
    })
  }

  return {
    ...project,
    input: {
      ...project.input,
      tracks,
    },
  }
}

export function persistLivePlayerProjectForMp4(
  episodeId: string,
  input: BuildMp4ProjectInput
) {
  const project = buildLivePlayerProjectFromMp4(input)
  saveLivePlayerProject(episodeId, project)
  return project
}
