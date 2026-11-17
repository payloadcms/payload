'use client'
import type { TFunction } from '@payloadcms/translations'
import type { UploadTransferProgress } from 'payload'

import type { UploadProgress } from '../../providers/DocumentInfo/types.js'

import {
  createProgressToast,
  getUploadPercent,
  getUploadProgressMessage,
} from '../../providers/UploadSessions/browser.js'

/**
 * Shows the progress of the file sent by a save, in the save's toast and in `uploadProgress`.
 * The toast switches from "Submitting…" only once bytes are reported, so a save waiting on an
 * upload session, which shows its own toast, keeps the plain one.
 */
export const trackSaveUploadProgress = ({
  fileName,
  onChange,
  t,
  toastID,
  totalBytes,
}: {
  fileName: string
  onChange?: (progress: undefined | UploadProgress) => void
  t: TFunction
  toastID?: number | string
  totalBytes: number
}) => {
  const progressToast =
    toastID === undefined ? undefined : createProgressToast({ id: String(toastID) })
  let lastProgress: UploadTransferProgress = { loadedBytes: 0, totalBytes }
  let lastPercent: number | undefined
  let isSettled = false

  onChange?.({ ...lastProgress, status: 'uploading' })

  return {
    /** Re-renders only when the whole percent changes, not on every progress event. */
    report: (progress: UploadTransferProgress) => {
      const percent = getUploadPercent({ progress })

      if (isSettled || percent === lastPercent) {
        return
      }

      lastPercent = percent
      lastProgress = progress
      onChange?.({ ...progress, status: 'uploading' })
      progressToast?.show(getUploadProgressMessage({ fileName, progress, t }))
    },
    /** Ends the upload state. A failed save keeps the bytes sent so far. */
    settle: ({ isSuccessful }: { isSuccessful: boolean }) => {
      if (isSettled) {
        return
      }

      isSettled = true
      onChange?.({
        loadedBytes: isSuccessful ? lastProgress.totalBytes : lastProgress.loadedBytes,
        status: isSuccessful ? 'success' : 'failed',
        totalBytes: lastProgress.totalBytes,
      })
    },
  }
}
