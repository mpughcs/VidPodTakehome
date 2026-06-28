"use client"

import { Upload, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { uploadAdWithMp4 } from "@/lib/ads-db"
import { waitForFirebaseAuthUser } from "@/lib/firebase-auth"
import { isValidMp4File, titleFromMp4Filename } from "@/lib/mp4-upload"
import type { Ad } from "@/types/ad"

const MODAL_ID = "upload-ad-modal"

export type UploadAdModalOptions = {
  company?: string
  product?: string
}

let pendingOptions: UploadAdModalOptions = {}
let onUploadedHandler: ((ad: Ad) => void) | null = null
let openModalHandler: (() => void) | null = null

export function openUploadAdModal(
  options: UploadAdModalOptions = {},
  onUploaded?: (ad: Ad) => void
) {
  pendingOptions = options
  onUploadedHandler = onUploaded ?? null
  openModalHandler?.()
  const dialog = document.getElementById(MODAL_ID) as HTMLDialogElement | null
  dialog?.showModal()
}

export function UploadAdModal() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState("")
  const [company, setCompany] = useState("")
  const [product, setProduct] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  function resetForm() {
    setTitle("")
    setCompany("")
    setProduct("")
    setFile(null)
    setError(null)
    setIsUploading(false)
    if (inputRef.current) inputRef.current.value = ""
  }

  useEffect(() => {
    openModalHandler = () => {
      resetForm()
      setCompany(pendingOptions.company ?? "")
      setProduct(pendingOptions.product ?? "")
    }
    return () => {
      openModalHandler = null
    }
  }, [])

  function handleFileChange(selected: File | undefined) {
    if (!selected) {
      setFile(null)
      return
    }

    if (!isValidMp4File(selected)) {
      setFile(null)
      setError("Only `.mp4` files are supported.")
      if (inputRef.current) inputRef.current.value = ""
      return
    }

    setError(null)
    setFile(selected)
    if (!title.trim()) {
      setTitle(titleFromMp4Filename(selected.name))
    }
  }

  function closeModal() {
    ;(document.getElementById(MODAL_ID) as HTMLDialogElement | null)?.close()
    resetForm()
  }

  async function handleUpload() {
    if (!file) {
      setError("Choose an MP4 file to upload.")
      return
    }
    if (!title.trim()) {
      setError("Enter a title for this ad.")
      return
    }
    if (!company.trim()) {
      setError("Enter a company name.")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const user = await waitForFirebaseAuthUser()
      if (!user) {
        throw new Error("Sign in to upload ads.")
      }

      const ad = await uploadAdWithMp4(
        {
          title: title.trim(),
          company: company.trim(),
          product: product.trim(),
          creatorId: user.uid,
        },
        file
      )

      onUploadedHandler?.(ad)
      onUploadedHandler = null
      closeModal()
    } catch (uploadErr) {
      console.error("[UploadAdModal] upload failed:", uploadErr)
      setError(uploadErr instanceof Error ? uploadErr.message : "Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <dialog id={MODAL_ID} className="modal" onClose={resetForm}>
      <div className="modal-box max-w-lg p-0">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Upload ad</h3>
            <p className="mt-1 text-sm text-slate-500">
              Add a new MP4 clip to your ad library
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Close"
            onClick={closeModal}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-slate-700">Title</span>
              <input
                className="input input-bordered rounded-lg"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Eight Sleep Q4 Pod 3 - v1"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Company</span>
              <input
                className="input input-bordered rounded-lg"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Eight Sleep"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Product</span>
              <input
                className="input input-bordered rounded-lg"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="Pod 3"
              />
            </label>
          </div>

          <div className="mt-4">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              MP4 file
            </span>
            <input
              ref={inputRef}
              type="file"
              accept="video/mp4,.mp4"
              className="file-input file-input-bordered w-full"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
            />
            {file && (
              <p className="mt-2 text-sm text-slate-600">{file.name}</p>
            )}
          </div>

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            className="btn rounded-xl border-slate-200 bg-white"
            onClick={closeModal}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-neutral rounded-xl px-6"
            disabled={
              isUploading || !file || !title.trim() || !company.trim()
            }
            onClick={handleUpload}
          >
            <Upload className="h-4 w-4" />
            {isUploading ? "Uploading…" : "Add to library"}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  )
}
