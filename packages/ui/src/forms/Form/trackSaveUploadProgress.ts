'use client'
import type { UploadTransferProgress } from 'payload'

import type { UploadProgress } from '../../providers/DocumentInfo/types.js'

import { getUploadPercent } from '../../providers/UploadSessions/browser.js'

/** Tracks the progress of the file sent by a save and reports it through `onChange`. */
export const trackSaveUploadProgress = ({
  onChange,
  totalBytes,
}: {
  onChange?: (progress: UploadProgress) => void
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
