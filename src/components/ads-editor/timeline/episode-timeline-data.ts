import type { ProjectJSON } from "@twick/timeline"

const EPISODE_DURATION = 300 

export function buildEpisodeTimelineProject(
  title: string,
  durationSeconds = EPISODE_DURATION
): ProjectJSON {
  return {
    version: 1,
    metadata: { title },
    tracks: [
      {
        id: "track-episode",
        name: "Episode",
        type: "video",
        elements: [
          {
            id: "el-episode",
            type: "video",
            name: title,
            s: 0,
            e: durationSeconds,
            props: { role: "episode" },
          },
        ],
      },
      {
        id: "track-ads",
        name: "Ad markers",
        type: "video",
        elements: [],
      },
    ],
  }
}

export function patchEpisodeDuration(
  project: ProjectJSON,
  durationSeconds: number
): ProjectJSON {
  return {
    ...project,
    tracks: project.tracks.map((track) => {
      const isEpisodeTrack =
        track.id === "track-episode" ||
        track.name === "Episode" ||
        track.elements.some((el) => el.props?.role === "episode")

      if (!isEpisodeTrack) return track

      return {
        ...track,
        elements: track.elements.map((element) =>
          element.props?.role === "episode"
            ? { ...element, e: durationSeconds }
            : element
        ),
      }
    }),
  }
}

export const episodeTimelineData: ProjectJSON = buildEpisodeTimelineProject(
  "Episode 503"
)

export const episodeDurationSeconds = EPISODE_DURATION
