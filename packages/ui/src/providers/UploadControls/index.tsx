'use client'
import React, { createContext, use, useState } from 'react'

export type UploadControlsContext = {
  setUploadControlFile: (file: File) => void
  setUploadControlFileUrl: (url: string) => void
  uploadControlFile: File | null
  uploadControlFileUrl: string
}

const Context = createContext<UploadControlsContext>(undefined)

export const UploadControlsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uploadControlFileUrl, setUploadControlFileUrl] = useState<string>('')
  const [uploadControlFile, setUploadControlFile] = useState<File | null>(null)

  return (
    <Context
      value={{
        setUploadControlFile,
        setUploadControlFileUrl,
        uploadControlFile,
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
