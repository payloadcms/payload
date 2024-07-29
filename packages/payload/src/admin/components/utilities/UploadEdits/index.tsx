import React from 'react'

import type { UploadEdits } from '../../../../uploads/types'

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

  return (
    <Context.Provider value={{ resetUploadEdits, updateUploadEdits, uploadEdits }}>
      {children}
    </Context.Provider>
  )
}

export const useUploadEdits = (): UploadEditsContext => React.useContext(Context)
