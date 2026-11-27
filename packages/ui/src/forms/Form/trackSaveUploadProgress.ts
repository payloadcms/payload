'use client'
import type { TFunction } from '@payloadcms/translations'
import type { UploadTransferProgress } from 'payload'

import type { UploadProgress } from '../../providers/DocumentInfo/types.js'
import type { createProgressToast } from '../../providers/UploadSessions/browser.js'

import {
  getUploadPercent,
  getUploadProgressMessage,
} from '../../providers/UploadSessions/browser.js'

/**
 * Shows the progress of the file sent by a save, in the save's toast and in `uploadProgress`.
 * The toast switches from "Submitting…" only once bytes are reported, so a save waiting on an
 * upload session, which shows its own toast, keeps the plain one. So does a save whose client
 * upload handler never calls `onProgress`.
 */
export const trackSaveUploadProgress = ({
  fileName,
  formatMessage = (message) => message,
  onChange,
  progressToast,
  t,
  totalBytes,
}: {
  fileName: string
  /** Adds context to the toast text, e.g. the file's position in a bulk upload. */
  formatMessage?: (message: string) => string
  onChange?: (progress: UploadProgress) => void
  /** The toast that shows progress. Without it, only `onChange` is called. */
  progressToast?: ReturnType<typeof createProgressToast>
  t: TFunction
  totalBytes: number
}) => {
  let lastProgress: UploadTransferProgress = { loadedBytes: 0, totalBytes }
  let lastPercent: number | undefined
  let isSettled = false
  let lastReported: undefined | UploadProgress
  const emit = (progress: UploadProgress) => {
    lastReported = progress
    onChange?.(progress)
  }

  emit({ ...lastProgress, status: 'uploading' })

  return {
    /** Re-renders only when the whole percent changes, not on every progress event. */
    report: (progress: UploadTransferProgress) => {
      const percent = getUploadPercent({ progress })

      if (isSettled || percent === lastPercent) {
        return
      }

      lastPercent = percent
      lastProgress = progress
      emit({ ...progress, status: 'uploading' })
      progressToast?.show(formatMessage(getUploadProgressMessage({ fileName, progress, t })))
    },
    /** Ends the upload state. A failed save keeps the bytes sent so far. */
    settle: ({ isSuccessful }: { isSuccessful: boolean }) => {
      if (isSettled) {
        return
      }

      isSettled = true
      emit({
        loadedBytes: isSuccessful ? lastProgress.totalBytes : lastProgress.loadedBytes,
        status: isSuccessful ? 'success' : 'failed',
        totalBytes: lastProgress.totalBytes,
      })
    },
    /**
     * Stops a save that ended without a result, e.g. one replaced by a newer save. Later reports
     * are ignored.
     *
     * @returns The last reported state if the save was still running, so the caller can clear it
     * unless a newer save has reported since.
     */
    stop: (): undefined | UploadProgress => {
      if (isSettled) {
        return undefined
      }

      isSettled = true

      return lastReported
    },
  }
}

/**
 * Stops the tracker of a save that ended without a result, or was invalidated by a form reset
 * while its file was still uploading, and clears its progress so `uploadStatus` does not stay at
 * `uploading`. Progress a newer save has reported since is left alone.
 */
export const abandonSaveUploadProgress = ({
  setUploadProgress,
  upload,
}: {
  setUploadProgress?: (
    update: (current: undefined | UploadProgress) => undefined | UploadProgress,
  ) => void
  upload?: ReturnType<typeof trackSaveUploadProgress>
}): void => {
  const abandonedProgress = upload?.stop()

  if (abandonedProgress) {
    setUploadProgress?.((current) => (current === abandonedProgress ? undefined : current))
  }
}
