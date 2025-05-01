'use client'
import React, { createContext, use, useCallback, useState } from 'react'

type ImportExportContext = {
  collection: string
  setCollection: (collection: string) => void
}

export const ImportExportContext = createContext({} as ImportExportContext)

export const ImportExportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collection, setCollectionState] = useState<string>('')

  const setCollection = useCallback((collection: string) => {
    setCollectionState(collection)
  }, [])

  return (
    <ImportExportContext
      value={{
        collection,
        setCollection,
      }}
    >
      {children}
    </ImportExportContext>
  )
}

export const useImportExport = (): ImportExportContext => use(ImportExportContext)
