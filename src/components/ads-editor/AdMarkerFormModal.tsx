"use client"

import { useEffect, useState } from "react"

import {
  formatMarkerTime,
  parseMarkerTime,
  type AdMarker,
  type AdMarkerMode,
  type CreateAdMarkerInput,
} from "@/types/ad-marker"

const MODAL_ID = "ad-marker-form-modal"

const MODE_LABELS: Record<AdMarkerMode, string> = {
  static: "Static",
  auto: "Auto",
  ab: "A/B",
}

type FormMode = "create" | "edit"

type FormState = {
  mode: FormMode
  marker: AdMarker | null
}

let openFormHandler: ((state: FormState) => void) | null = null

export function openAdMarkerForm(state: FormState) {
  openFormHandler?.(state)
  const dialog = document.getElementById(MODAL_ID) as HTMLDialogElement | null
  dialog?.showModal()
}

type AdMarkerFormModalProps = {
  onSubmit: (input: CreateAdMarkerInput, markerId?: string) => Promise<void>
}

export function AdMarkerFormModal({ onSubmit }: AdMarkerFormModalProps) {
  const [formMode, setFormMode] = useState<FormMode>("create")
  const [editingMarker, setEditingMarker] = useState<AdMarker | null>(null)
  const [startTime, setStartTime] = useState("00:00:30")
  const [endTime, setEndTime] = useState("00:00:45")
  const [mode, setMode] = useState<AdMarkerMode>("auto")
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    openFormHandler = ({ mode: nextMode, marker }) => {
      setFormMode(nextMode)
      setEditingMarker(marker)
      setError(null)

      if (marker) {
        setStartTime(formatMarkerTime(marker.startSeconds))
        setEndTime(formatMarkerTime(marker.endSeconds))
        setMode(marker.mode)
        return
      }

      setStartTime("00:00:30")
      setEndTime(formatMarkerTime(45))
      setMode("auto")
    }

    return () => {
      openFormHandler = null
    }
  }, [])

  async function handleSave() {
    const startSeconds = parseMarkerTime(startTime)
    const endSeconds = parseMarkerTime(endTime)

    if (startSeconds === null || endSeconds === null) {
      setError("Use MM:SS or HH:MM:SS for start and end times.")
      return
    }

    if (endSeconds <= startSeconds) {
      setError("End time must be after start time.")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await onSubmit(
        { startSeconds, endSeconds, mode },
        editingMarker?.id
      )
      ;(document.getElementById(MODAL_ID) as HTMLDialogElement | null)?.close()
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Could not save marker"
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <dialog id={MODAL_ID} className="modal">
      <div className="modal-box">
        <h3 className="text-lg font-bold">
          {formMode === "create" ? "Create ad marker" : "Edit ad marker"}
        </h3>
        <p className="py-2 text-sm text-slate-500">
          Choose when the ad should play and which placement mode to use.
        </p>

        <div className="flex flex-col gap-4 py-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Start time</span>
            <input
              className="input input-bordered w-full" 
              type="time"
              step="1"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="00:00:30"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">End time</span>
            <input
              className="input input-bordered w-full"
              type="time"
              step="1"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="00:00:45"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Mode</span>
            <select
              className="select select-bordered w-full"
              value={mode}
              onChange={(e) => setMode(e.target.value as AdMarkerMode)}
            >
              {(Object.keys(MODE_LABELS) as AdMarkerMode[]).map(
                (option) => (
                  <option key={option} value={option}>
                    {MODE_LABELS[option]}
                  </option>
                )
              )}
            </select>
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
            disabled={isSaving}
            onClick={handleSave}
          >
            {isSaving ? "Saving…" : "Save marker"}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  )
}
