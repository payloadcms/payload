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
  const uploadHandlersRef = useRef<Map<UploadCollectionSlug, UploadHandler>>(new Map())

  const getUploadHandler: UploadHandlersContext['getUploadHandler'] = useCallback(
    ({ collectionSlug }) => {
      return uploadHandlersRef.current.get(collectionSlug) ?? null
    },
    [],
  )

  const setUploadHandler: UploadHandlersContext['setUploadHandler'] = useCallback(
    ({ collectionSlug, handler }) => {
      uploadHandlersRef.current.set(collectionSlug, handler)
    },
    [],
  )

  const value = useMemo(
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
