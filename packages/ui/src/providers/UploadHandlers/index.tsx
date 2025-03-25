'use client'
import type { UploadCollectionSlug } from 'payload'

import React, { useState } from 'react'

type UploadHandler = (args: {
  file: File
  updateFilename: (filename: string) => void
}) => Promise<unknown>

export type UploadHandlersContext = {
  getUploadHandler: (args: { collectionSlug: UploadCollectionSlug }) => null | UploadHandler
  setUploadHandler: (args: {
    collectionSlug: UploadCollectionSlug
    handler: UploadHandler
  }) => unknown
}

const Context = React.createContext<null | UploadHandlersContext>(null)

export const UploadHandlersProvider = ({ children }) => {
  const [uploadHandlers, setUploadHandlers] = useState<Map<UploadCollectionSlug, UploadHandler>>(
    () => new Map(),
  )

  const getUploadHandler: UploadHandlersContext['getUploadHandler'] = ({ collectionSlug }) => {
    return uploadHandlers.get(collectionSlug)
  }

  const setUploadHandler: UploadHandlersContext['setUploadHandler'] = ({
    collectionSlug,
    handler,
  }) => {
    setUploadHandlers((uploadHandlers) => {
      const clone = new Map(uploadHandlers)
      clone.set(collectionSlug, handler)
      return clone
    })
  }

  return <Context value={{ getUploadHandler, setUploadHandler }}>{children}</Context>
}

export const useUploadHandlers = (): UploadHandlersContext => {
  const context = React.use(Context)

  if (context === null) {
    throw new Error('useUploadHandlers must be used within UploadHandlersProvider')
  }

  return context
}
