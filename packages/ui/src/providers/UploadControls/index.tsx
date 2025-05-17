'use client'
import type { CollectionSlug, DocumentSlots } from 'payload'

import React, { createContext, use, useEffect, useState } from 'react'

import { useServerFunctions } from '../../providers/ServerFunctions/index.js'

export type UploadControlsContext = {
  documentSlots: DocumentSlots
  setUploadControlFile: (file: File) => void
  setUploadControlFileName: (name: string) => void
  setUploadControlFileUrl: (url: string) => void
  uploadControlFile: File | null
  uploadControlFileName: null | string
  uploadControlFileUrl: string
}

const Context = createContext<UploadControlsContext>(undefined)

export const UploadControlsProvider: React.FC<{
  children: React.ReactNode
  collectionSlug?: CollectionSlug
}> = ({ children, collectionSlug }) => {
  const { getDocumentSlots } = useServerFunctions()
  const [documentSlots, setDocumentSlots] = React.useState<DocumentSlots>({})
  const [uploadControlFileName, setUploadControlFileName] = useState<null | string>(null)
  const [uploadControlFileUrl, setUploadControlFileUrl] = useState<string>('')
  const [uploadControlFile, setUploadControlFile] = useState<File | null>(null)

  useEffect(() => {
    void (async () => {
      const slots = await getDocumentSlots({ collectionSlug })
      setDocumentSlots(slots)
    })()
  }, [getDocumentSlots, collectionSlug])

  return (
    <Context
      value={{
        documentSlots,
        setUploadControlFile,
        setUploadControlFileName,
        setUploadControlFileUrl,
        uploadControlFile,
        uploadControlFileName,
        uploadControlFileUrl,
      }}
    >
      {children}
    </Context>
  )
}

export const useUploadControls = (): UploadControlsContext => {
  const context = use(Context)
  if (!context) {
    throw new Error('useUploadControls must be used within an UploadControlsProvider')
  }
  return context
}
