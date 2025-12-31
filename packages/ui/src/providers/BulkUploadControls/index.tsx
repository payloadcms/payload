'use client'
import React, { createContext, use, useState } from 'react'

export type BulkUploadControlsContext = {
  bulkUploadControlFiles: File[]
  setBulkUploadControlFiles: (files: File[]) => void
}

const Context = createContext<BulkUploadControlsContext>(undefined)

export const BulkUploadControlsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [bulkUploadControlFiles, setBulkUploadControlFiles] = useState<File[]>([])

  return (
    <Context
      value={{
        bulkUploadControlFiles,
        setBulkUploadControlFiles,
      }}
    >
      {children}
    </Context>
  )
}

export const useBulkUploadControls = (): BulkUploadControlsContext => {
  const context = use(Context)
  if (!context) {
    throw new Error('useBulkUploadControls must be used within BulkUploadControlsProvider')
  }
  return context
}
