import type { ProjectJSON } from "@twick/timeline"

const EPISODE_DURATION = 300 // 5 minutes

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

export const episodeTimelineData: ProjectJSON = buildEpisodeTimelineProject(
  "Episode 503"
)

export const episodeDurationSeconds = EPISODE_DURATION
