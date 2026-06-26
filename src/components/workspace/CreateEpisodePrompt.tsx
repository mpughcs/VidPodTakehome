"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { useEpisodes } from "@/context/EpisodeContext"
import type { CreateEpisodeInput } from "@/lib/episodes-db"

const MODAL_ID = "create-episode-modal"

let openModalHandler: (() => void) | null = null

export function openCreateEpisodeModal() {
  openModalHandler?.()
  const dialog = document.getElementById(MODAL_ID) as HTMLDialogElement | null
  dialog?.showModal()
}

type CreateEpisodeModalProps = {
  onSubmit: (input: Omit<CreateEpisodeInput, "creatorId">) => Promise<unknown>
}

export function CreateEpisodeModal({ onSubmit }: CreateEpisodeModalProps) {
  const { isCreating } = useEpisodes()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    openModalHandler = () => {
      setTitle("")
      setDescription("")
      setError(null)
    }
    return () => {
      openModalHandler = null
    }
  }, [])

  async function handleCreate() {
    if (!title.trim()) {
      setError("Episode title is required.")
      return
    }

    setError(null)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
      })
      ;(document.getElementById(MODAL_ID) as HTMLDialogElement | null)?.close()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not create episode"
      )
    }
  }

  return (
    <dialog id={MODAL_ID} className="modal">
      <div className="modal-box">
        <h3 className="text-lg font-bold">Create an episode</h3>
        <p className="py-2 text-sm text-slate-500">
          Add a new episode to The Diary Of A CEO.
        </p>

        <div className="flex flex-col gap-4 py-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Title</span>
            <input
              className="input input-bordered w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Episode 504 — Interview with..."
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Description</span>
            <textarea
              className="textarea textarea-bordered w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this episode about?"
              rows={3}
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="modal-action">
          <form method="dialog">
            <button type="submit" className="btn">
              Cancel
            </button>
          </form>
          <button
            type="button"
            className="btn btn-primary"
            disabled={isCreating}
            onClick={handleCreate}
          >
            {isCreating ? "Creating…" : "Create episode"}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  )
}

export function CreateEpisodeModalHost() {
  const router = useRouter()
  const { createEpisode } = useEpisodes()

  return (
    <CreateEpisodeModal
      onSubmit={async (input) => {
        const episode = await createEpisode(input)
        router.push(`/episodes/${episode.id}`)
      }}
    />
  )
}
