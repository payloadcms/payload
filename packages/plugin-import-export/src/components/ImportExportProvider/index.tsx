'use client'
import React, { createContext, useCallback, useContext, useState } from 'react'

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
    <ImportExportContext.Provider
      value={{
        collection,
        setCollection,
      }}
    >
      {children}
    </ImportExportContext.Provider>
  )
}

export const useImportExport = (): ImportExportContext => useContext(ImportExportContext)
