'use client'
import type { UploadEdits } from 'payload'

import React from 'react'

export type UploadEditsContext = {
  resetUploadEdits: () => void
  updateUploadEdits: (edits: UploadEdits) => void
  uploadEdits: UploadEdits
}

const Context = React.createContext<UploadEditsContext>({
  resetUploadEdits: undefined,
  updateUploadEdits: undefined,
  uploadEdits: undefined,
})

export const UploadEditsProvider = ({ children }) => {
  const [uploadEdits, setUploadEdits] = React.useState<UploadEdits>(undefined)

  const resetUploadEdits = () => {
    setUploadEdits({})
  }

  const updateUploadEdits = (edits: UploadEdits) => {
    setUploadEdits((prevEdits) => ({
      ...(prevEdits || {}),
      ...(edits || {}),
    }))
  }

  return <Context value={{ resetUploadEdits, updateUploadEdits, uploadEdits }}>{children}</Context>
}

export const useUploadEdits = (): UploadEditsContext => React.use(Context)
