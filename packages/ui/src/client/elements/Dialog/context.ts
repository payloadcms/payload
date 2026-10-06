import { createContext, use } from 'react'

export type DialogContextValue = {
  isConfirming: boolean
  setConfirming: (val: boolean) => void
  slug: string
}

export const DialogContext = createContext<DialogContextValue | null>(null)

export const useDialogContext = () => {
  const ctx = use(DialogContext)
  if (!ctx) {
    throw new Error('Dialog sub-components must be rendered inside <DialogModal>')
  }
  return ctx
}
