'use client'
import type { UploadEdits } from 'payload'

import React from 'react'

export type UploadEditsProviderProps = {
  children: React.ReactNode
  initialUploadEdits?: UploadEdits
}
export type UploadEditsContext = {
  getUploadEdits: () => UploadEdits
  resetUploadEdits: () => void
  updateUploadEdits: (edits: UploadEdits) => void
  uploadEdits: UploadEdits
}

const Context = React.createContext<UploadEditsContext>({
  getUploadEdits: () => undefined,
  resetUploadEdits: undefined,
  updateUploadEdits: undefined,
  uploadEdits: undefined,
})

export const UploadEditsProvider = ({ children, initialUploadEdits }: UploadEditsProviderProps) => {
  const [uploadEdits, setUploadEdits] = React.useState<UploadEdits>(initialUploadEdits || {})

  const resetUploadEdits = () => {
    setUploadEdits({})
  }

  const updateUploadEdits = (edits: UploadEdits) => {
    setUploadEdits((prevEdits) => ({
      ...(prevEdits || {}),
      ...(edits || {}),
    }))
  }

  const getUploadEdits = () => uploadEdits

  return (
    <Context value={{ getUploadEdits, resetUploadEdits, updateUploadEdits, uploadEdits }}>
      {children}
    </Context>
  )
}

export const useUploadEdits = (): UploadEditsContext => React.use(Context)
