"use client"

import { EpisodesHome } from "@/components/workspace/EpisodesHome"
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell"

export function PrimaryFeatures() {
  return (
    <WorkspaceShell>
      <EpisodesHome />
    </WorkspaceShell>
  )
}
