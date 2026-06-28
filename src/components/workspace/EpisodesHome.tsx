"use client"

import Link from "next/link"
import { useState } from "react"
import { CiTrash } from "react-icons/ci"
import { useRouter } from "next/navigation"
import { openCreateEpisodeModal } from "@/components/workspace/CreateEpisodePrompt"
import { useEpisodes } from "@/context/EpisodeContext"

const DELETE_MODAL_ID = "delete-episode-modal"

function formatUploadDate(uploadDate: string) {
  const parsed = new Date(uploadDate)
  if (Number.isNaN(parsed.getTime())) return uploadDate
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function EpisodesHome() {
  const { episodes, isLoading, error, deleteEpisode, setSelectedEpisodeId } = useEpisodes()
  const [canDelete, setCanDelete] = useState(false)
  const [deleteEpisodeId, setDeleteEpisodeId] = useState<string | null>(null)
  const router = useRouter()
  const episodeToDelete = episodes.find((e) => e.id === deleteEpisodeId)

  function openDeleteModal(episodeId: string) {
    setDeleteEpisodeId(episodeId)
    ;(
      document.getElementById(DELETE_MODAL_ID) as HTMLDialogElement | null
    )?.showModal()
  }

  function closeDeleteModal() {
    setDeleteEpisodeId(null)
    ;(
      document.getElementById(DELETE_MODAL_ID) as HTMLDialogElement | null
    )?.close()
  }

  async function confirmDelete() {
    if (!deleteEpisodeId) return
    await deleteEpisode(deleteEpisodeId)
    closeDeleteModal()
  }
  function handleEpisodeClick(episodeId: string) {
    console.log(episodeId)
    setSelectedEpisodeId(episodeId)
    router.push(`/episodes/${episodeId}`)
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <dialog id={DELETE_MODAL_ID} className="modal" onClose={() => setDeleteEpisodeId(null)}>
        <div className="modal-box">
          <h2 className="text-lg font-bold">Delete episode</h2>
          <p className="py-2 text-sm text-slate-500">
            Are you sure you want to delete{" "}
            <span className="font-medium text-slate-900">
              {episodeToDelete?.title ?? "this episode"}
            </span>
            ? This cannot be undone.
          </p>
          <div className="modal-action">
            <form method="dialog">
              <button type="submit" className="btn">
                Cancel
              </button>
            </form>
            <button
              type="button"
              className="btn btn-error"
              onClick={confirmDelete}
            >
              Delete
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="submit">close</button>
        </form>
      </dialog>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            The Diary Of A CEO
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 lg:text-3xl">
            Episode Ad Editor
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            All team members can create and open episodes for this channel.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-outline rounded-xl text-amber-500"
            onClick={() => setCanDelete((prev) => !prev)}
          >
            {canDelete ? "Done" : <CiTrash className="text-2xl" />}
          </button>
          <button
            type="button"
            className="btn btn-primary rounded-xl"
            onClick={openCreateEpisodeModal}
          >
            Create episode +
          </button>
        </div>
      </header>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-400">Loading episodes…</p>
      ) : episodes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <p className="text-slate-500">No episodes yet.</p>
          <button
            type="button"
            className="btn btn-primary btn-sm mt-4 rounded-xl"
            onClick={openCreateEpisodeModal}
          >
            Create the first episode
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {episodes.map((episode) => (
            <li key={episode.id} className="flex gap-4">
              <button
                type="button"
                onClick={() => handleEpisodeClick(episode.id)}
                className="flex flex-1 items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
              >
                <img
                  src={episode.thumbnail}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1 flex flex-col justify-start items-start">
                  <p className="truncate font-medium text-slate-900">
                    {episode.title}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500 ">
                    {formatUploadDate(episode.uploadDate)}
                  </p>
                </div>
                <span className="text-sm text-slate-400">Open →</span>
              </button>
              {canDelete && (
                <button
                  type="button"
                  className="btn btn-ghost my-auto rounded-xl text-red-400"
                  aria-label={`Delete ${episode.title}`}
                  onClick={() => openDeleteModal(episode.id)}
                >
                  <CiTrash className="text-2xl" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
