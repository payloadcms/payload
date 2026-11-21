'use client'
import type { TFunction } from '@payloadcms/translations'
import type { UploadTransferProgress } from 'payload'

import { toast } from 'sonner'

/**
 * The text of the upload progress toast. Draft presentation until the upload progress design is
 * final: replace this and `createProgressToast` to change how progress looks.
 *
 * Without progress, e.g. from a client upload handler that does not report it, only the file name
 * shows. Once every byte is sent the server is still processing and saving, so that is shown
 * instead of 100%.
 */
export const getUploadProgressMessage = ({
  fileName,
  progress,
  t,
}: {
  fileName: string
  progress?: UploadTransferProgress
  t: TFunction
}): string => {
  if (!progress) {
    return t('upload:uploadingFile', { filename: fileName })
  }

  if (progress.loadedBytes >= progress.totalBytes) {
    return t('upload:processingAndSavingFile', { filename: fileName })
  }

  return t('upload:uploadingFileProgress', {
    filename: fileName,
    percent: getUploadPercent({ progress }),
  })
}

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
export const createProgressToast = <ID extends number | string>({ id }: { id: ID }) => {
  let isHidden = false
  // Progress can be reported many times a second; the toast only redraws when its text changes.
  let shownMessage: string | undefined

  return {
    /**
     * The id for the toast that ends the upload: this toast, or a new one once the user closed it.
     * Sonner leaves an update to a dismissed toast on screen without a working close button.
     */
    getResultID: (): ID | string => (isHidden ? `${id}-result` : id),
    show: (message: string) => {
      if (!isHidden && message !== shownMessage) {
        shownMessage = message
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
