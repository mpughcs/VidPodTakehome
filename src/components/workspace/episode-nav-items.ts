import type { ElementType } from "react"
import {
  CiSettings,

} from "react-icons/ci"
import { LuHouse } from "react-icons/lu";
import { FaRegChartBar } from "react-icons/fa";
import { LuImport } from "react-icons/lu";

import { CiDollar } from "react-icons/ci";
import { FiTv } from "react-icons/fi";


import { TbChartBar } from "react-icons/tb"

export type EpisodeNavItemId =
  | "dashboard"
  | "analytics"
  | "ads"
  | "channels"
  | "import"
  | "settings"

export const episodeNavItems: {
  id: EpisodeNavItemId
  icon: ElementType
  label: string
}[] = [
  { id: "dashboard", icon: LuHouse, label: "Dashboard" },
  { id: "analytics", icon: FaRegChartBar, label: "Analytics" },
  { id: "ads", icon: CiDollar, label: "Ads" },
  { id: "channels", icon: FiTv, label: "Channels" },
  { id: "import", icon: LuImport, label: "Import" },
  { id: "settings", icon: CiSettings, label: "Settings" },
]

export function getEpisodeNavItemActive(
  itemId: EpisodeNavItemId,
  pathname: string
): boolean {
  const isEpisodesHome = pathname === "/"
  const activeEpisodeId = pathname.startsWith("/episodes/")
    ? pathname.split("/episodes/")[1]?.split("/")[0]
    : null
  const isEpisodeEditor =
    activeEpisodeId != null &&
    pathname === `/episodes/${activeEpisodeId}`

  switch (itemId) {
    case "dashboard":
      return isEpisodesHome
    case "ads":
      return isEpisodeEditor
    default:
      return false
  }
}
