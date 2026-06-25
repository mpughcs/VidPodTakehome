import {
  CiGrid42,
  CiImport,
  CiSettings,
  CiWavePulse1,
  CiBadgeDollar,
} from "react-icons/ci"

export const episodeNavItems: {
  icon: typeof CiGrid42
  label: string
  active?: boolean
}[] = [
  { icon: CiGrid42, label: "Dashboard" },
  { icon: CiWavePulse1, label: "Analytics", active: true },
  { icon: CiBadgeDollar, label: "Ads" },
  { icon: CiGrid42, label: "Channels" },
  { icon: CiImport, label: "Import" },
  { icon: CiSettings, label: "Settings" },
]
