'use client'
import React, { createContext, useCallback, useContext, useState } from 'react'

type ImportExportContext = {
  collection: string
  columnsToExport: { label: string; value: string }[] | string[]
  setCollection: (collection: string) => void
  setColumnsToExport: (columns: { label: string; value: string }[]) => void
}

export const ImportExportContext = createContext({} as ImportExportContext)

export const ImportExportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collection, setCollectionState] = useState<string>('')
  const [columnsToExport, setColumnsToExport] = useState<{ label: string; value: string }[]>([])

  const setCollection = useCallback((collection: string) => {
    setCollectionState(collection)
  }, [])

  return (
    <ImportExportContext.Provider
      value={{
        collection,
        columnsToExport,
        setCollection,
        setColumnsToExport,
      }}
    >
      {children}
    </ImportExportContext.Provider>
  )
}

export const useImportExport = (): ImportExportContext => useContext(ImportExportContext)
