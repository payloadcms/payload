'use client'
import type { UploadEdits } from 'payload'

import React from 'react'

export type UploadEditsState = {
  byIndex: Record<number, UploadEdits>
  global?: UploadEdits
}

export type UploadEditsContext = {
  getUploadEdits: (index?: number) => UploadEdits
  resetUploadEdits: (index?: number) => void
  updateUploadEdits: (edits: UploadEdits, index?: number) => void
}

const Context = React.createContext<UploadEditsContext>({
  getUploadEdits: () => ({}),
  resetUploadEdits: () => {},
  updateUploadEdits: () => {},
})

export const UploadEditsProvider = ({ children }) => {
  const [edits, setEdits] = React.useState<UploadEditsState>({
    byIndex: {},
    global: {},
  })

  const resetUploadEdits = (index?: number) => {
    setEdits((prev) => {
      if (typeof index === 'number') {
        const { [index]: _, ...rest } = prev.byIndex
        return {
          ...prev,
          byIndex: rest,
        }
      }
      return {
        ...prev,
        global: {},
      }
    })
  }

  const getUploadEdits = (index?: number): UploadEdits => {
    return typeof index === 'number' ? edits.byIndex[index] || {} : edits.global || {}
  }

  const updateUploadEdits = (newEdits: UploadEdits, index?: number) => {
    setEdits((prev) => {
      if (typeof index === 'number') {
        return {
          ...prev,
          byIndex: {
            ...prev.byIndex,
            [index]: {
              ...(prev.byIndex[index] || {}),
              ...newEdits,
            },
          },
        }
      }
      return {
        ...prev,
        global: {
          ...(prev.global || {}),
          ...newEdits,
        },
      }
    })
  }

  return (
    <Context value={{ getUploadEdits, resetUploadEdits, updateUploadEdits }}>{children}</Context>
  )
}

export const useUploadEdits = (): UploadEditsContext => React.use(Context)
