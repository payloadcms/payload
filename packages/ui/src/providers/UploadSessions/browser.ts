'use client'
import { toast } from 'sonner'

/**
 * An auto-updating progress toast the user can hide (WCAG 2.2.2). Once closed it stays hidden
 * while the upload carries on; completion and errors still show their own toasts.
 */
export const createProgressToast = ({ id }: { id: string }) => {
  let isHidden = false

  return {
    show: (message: string) => {
      if (!isHidden) {
        toast.loading(message, {
          id,
          closeButton: true,
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
