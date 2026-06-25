import { EpisodeDropdown } from "@/components/workspace/EpisodeDropdown"

export function WorkspaceSidebar() {
  return (
    <ul className="flex min-h-full w-80 flex-col gap-2 border-r-2 border-slate-100 bg-base-200 p-4">
      <li>
        <button type="button" className="btn btn-primary w-full">
          Create an episode
        </button>
      </li>
      <EpisodeDropdown />
    </ul>
  )
}
