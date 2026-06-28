"use client"

import { useEffect, useRef, useState } from "react"

import { useEpisodes } from "@/context/EpisodeContext"

const MODAL_ID = "import-mp4-modal"

let openModalHandler: ((episodeId?: string) => void) | null = null

export function openImportMp4Modal(episodeId?: string) {
  openModalHandler?.(episodeId)
  const dialog = document.getElementById(MODAL_ID) as HTMLDialogElement | null
  dialog?.showModal()
}

export function ImportMp4Modal() {
  const {
    episodes,
    uploadMp4,
    isImporting,
    selectedEpisodeId,
    setSelectedEpisodeId,
  } = useEpisodes()
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    openModalHandler = (episodeId?: string) => {
      setSelectedEpisodeId(
        episodeId ?? episodes[0]?.id ?? null
      )
      setSelectedFile(null)
      setUploadError(null)
      if (inputRef.current) inputRef.current.value = ""
    }
    return () => {
      openModalHandler = null
    }
  }, [episodes, setSelectedEpisodeId])

  function handleFileChange(file: File | undefined) {
    if (!file) {
      setSelectedFile(null)
      return
    }

    if (file.type !== "video/mp4" && !file.name.toLowerCase().endsWith(".mp4")) {
      setSelectedFile(null)
      if (inputRef.current) inputRef.current.value = ""
      return
    }

    setSelectedFile(file)
  }

  function resetAndClose() {
    setSelectedFile(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <dialog id={MODAL_ID} className="modal" onClose={resetAndClose}>
      <div className="modal-box">
        <h3 className="text-lg font-bold">Import MP4</h3>
        <p className="py-4 text-sm text-slate-500">
          Upload an episode or ad clip. Only `.mp4` files are supported for now.
        </p>

        {episodes.length > 0 ? (
          <label className="form-control w-full mb-">
            <span className="label-text mb-1 text-sm font-medium">Episode</span>
            <select
              className="select select-[bordered] w-full bg-slate-100"
              value={selectedEpisodeId ?? ""}
              onChange={(e) => setSelectedEpisodeId(e.target.value || null)}
            >
              <option value="" disabled>
                Select an episode
              </option>
              {episodes.map((episode) => (
                <option key={episode.id} value={episode.id}>
                  {episode.title}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="text-sm text-slate-500">Create an episode first.</p>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,.mp4"
          className="file-input file-input-ghost w-full mt-5"
          onChange={(e) => handleFileChange(e.target.files?.[0])}
        />

        {selectedFile && (
          <p className="mt-3 text-sm text-slate-700">
            Selected: <span className="font-medium">{selectedFile.name}</span>
          </p>
        )}

        {uploadError && (
          <p className="mt-3 text-sm text-red-500">{uploadError}</p>
        )}

        <div className="modal-action">
          <form method="dialog">
            <button type="submit" className="btn">
              Cancel
            </button>
          </form>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!selectedFile || isImporting || !selectedEpisodeId}
            onClick={async () => {
              if (!selectedFile) return
              setUploadError(null)
              try {
                await uploadMp4(selectedEpisodeId!, selectedFile)
                resetAndClose()
                  ; (document.getElementById(MODAL_ID) as HTMLDialogElement | null)?.close()
              } catch (error) {
                setUploadError(
                  error instanceof Error ? error.message : "Upload failed"
                )
              }
            }}
          >
            {isImporting ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  )
}
