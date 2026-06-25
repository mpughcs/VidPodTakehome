import {
  CornerDownLeft,
  CornerDownRight,
  FastForward,
  Play,
  Rewind,
} from "lucide-react"

export function VideoPlayerPanel() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-slate-200">
        <div className="flex h-full items-center justify-center text-sm text-slate-500">
          Video player
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button type="button" className="btn btn-ghost btn-sm gap-1 rounded-full">
          <CornerDownLeft className="h-4 w-4" />
          Jump to start
        </button>
        <button type="button" className="btn btn-ghost btn-sm rounded-full">
          10s
        </button>
        <button type="button" className="btn btn-ghost btn-sm rounded-full">
          <Rewind className="h-4 w-4" />
        </button>
        <button type="button" className="btn btn-circle btn-neutral">
          <Play className="h-5 w-5 fill-current" />
        </button>
        <button type="button" className="btn btn-ghost btn-sm rounded-full">
          <FastForward className="h-4 w-4" />
        </button>
        <button type="button" className="btn btn-ghost btn-sm rounded-full">
          10s
        </button>
        <button type="button" className="btn btn-ghost btn-sm gap-1 rounded-full">
          Jump to end
          <CornerDownRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
