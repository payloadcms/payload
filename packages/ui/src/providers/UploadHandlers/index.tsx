'use client'
import type { UploadCollectionSlug } from 'payload'

import React, { useCallback, useMemo, useRef } from 'react'

type UploadHandler = (args: {
  docPrefix?: string
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
  const uploadHandlers = useRef<Map<UploadCollectionSlug, UploadHandler>>(new Map())

  const getUploadHandler = useCallback<UploadHandlersContext['getUploadHandler']>(
    ({ collectionSlug }) => {
      return uploadHandlers.current.get(collectionSlug)
    },
    [],
  )

  const setUploadHandler = useCallback<UploadHandlersContext['setUploadHandler']>(
    ({ collectionSlug, handler }) => {
      uploadHandlers.current.set(collectionSlug, handler)
    },
    [],
  )

  const value = useMemo<UploadHandlersContext>(
    () => ({ getUploadHandler, setUploadHandler }),
    [getUploadHandler, setUploadHandler],
  )

  return <Context value={value}>{children}</Context>
}

export const useUploadHandlers = (): UploadHandlersContext => {
  const context = React.use(Context)

  if (context === null) {
    throw new Error('useUploadHandlers must be used within UploadHandlersProvider')
  }

  return context
}
