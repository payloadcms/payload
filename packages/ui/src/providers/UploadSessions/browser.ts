'use client'
import type { UploadTransferProgress } from 'payload'

import { toast } from 'sonner'

/** Whole percent sent, below 100 until every byte is sent. */
export const getUploadPercent = ({ progress }: { progress: UploadTransferProgress }): number =>
  progress.totalBytes > 0
    ? Math.min(100, Math.floor((progress.loadedBytes / progress.totalBytes) * 100))
    : 100

/**
 * An auto-updating progress toast the user can hide (WCAG 2.2.2). Once closed it stays hidden
 * while the upload carries on; completion and errors still show their own toasts.
 *
 * Sonner merges an update into the toast with the same id, so the actions and description of a
 * recovery offer it replaces are cleared explicitly.
 */
export const createProgressToast = ({ id }: { id: string }) => {
  let isHidden = false

  return {
    show: (message: string) => {
      if (!isHidden) {
        toast.loading(message, {
          id,
          action: undefined,
          cancel: undefined,
          closeButton: true,
          description: undefined,
          onDismiss: () => {
            isHidden = true
          },
        })
      }
    },
  }
}

export const pickFile = ({ accept, onPick }: { accept?: string; onPick: (file: File) => void }) => {
  const input = document.createElement('input')

  input.type = 'file'
  input.accept = accept ?? ''
  input.hidden = true
  input.onchange = () => {
    const file = input.files?.[0]

    input.remove()

    if (file) {
      onPick(file)
    }
  }
  input.oncancel = () => input.remove()
  // Attached so every browser treats it as a regular file chooser.
  document.body.append(input)
  input.click()
}
