import { AdsEditor } from "@/components/ads-editor/AdsEditor"
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout"
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar"

export function PrimaryFeatures() {
  return (
    <section
      id="features"
      aria-label="Podcast workspace"
      className="relative overflow-hidden"
    >
      <WorkspaceLayout sidebar={<WorkspaceSidebar />}>
        <AdsEditor />
      </WorkspaceLayout>
    </section>
  )
}
