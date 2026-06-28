import {
  CiGrid42,
  CiImport,
  CiSettings,
  CiBadgeDollar,
} from "react-icons/ci"

export type EpisodeNavItemId = "dashboard" | "ads" | "import" | "settings"

export const episodeNavItems: {
  id: EpisodeNavItemId
  icon: typeof CiGrid42
  label: string
}[] = [
  { id: "dashboard", icon: CiGrid42, label: "Dashboard" },
  { id: "ads", icon: CiBadgeDollar, label: "Ads" },
  { id: "import", icon: CiImport, label: "Import" },
  { id: "settings", icon: CiSettings, label: "Settings" },
]

export type EpisodeNavItemState = {
  enabled: boolean
  active: boolean
}

export function getEpisodeNavItemState(
  itemId: EpisodeNavItemId,
  pathname: string,
  hasEpisodes: boolean
): EpisodeNavItemState {
  const isEpisodesHome = pathname === "/"
  const activeEpisodeId = pathname.startsWith("/episodes/")
    ? pathname.split("/episodes/")[1]?.split("/")[0]
    : null
  const isEpisodeEditor =
    activeEpisodeId != null &&
    pathname === `/episodes/${activeEpisodeId}`

  switch (itemId) {
    case "dashboard":
      return { enabled: !isEpisodesHome, active: isEpisodesHome }
    case "ads":
      return {
        enabled: isEpisodeEditor ? false : Boolean(activeEpisodeId),
        active: isEpisodeEditor,
      }
    case "import":
      return {
        enabled: isEpisodeEditor && hasEpisodes,
        active: false,
      }
    case "settings":
      return { enabled: false, active: false }
  }
}
