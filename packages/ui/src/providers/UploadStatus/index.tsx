'use client'

import type { ReactNode } from 'react'

import React, { createContext, useCallback, useContext, useState } from 'react'

export type UploadStatus = 'failed' | 'idle' | 'uploading'

export type UploadStatusContextType = {
  setUploadStatus: (status: UploadStatus) => void
  uploadStatus: UploadStatus
}

const UploadStatusContext = createContext<undefined | UploadStatusContextType>(undefined)

export const UploadStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')

  const handleSetUploadStatus = useCallback((status: UploadStatus) => {
    setUploadStatus(status)
  }, [])

  return (
    <UploadStatusContext.Provider
      value={{
        setUploadStatus: handleSetUploadStatus,
        uploadStatus,
      }}
    >
      {children}
    </UploadStatusContext.Provider>
  )
}

export const useUploadStatus = (): UploadStatusContextType => useContext(UploadStatusContext)
