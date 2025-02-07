'use client'
import React, { createContext, useCallback, useContext, useState } from 'react'

type ImportExportContext = {
  collection: string
  selected: Map<number | string, boolean>
  setCollection: (collection: string) => void
  setSelected: (selected: Map<number | string, boolean>) => void
}

export const ImportExportContext = createContext({} as ImportExportContext)

export const ImportExportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collection, setCollectionState] = useState<string>('')
  const [selected, setSelectedState] = useState<Map<number | string, boolean>>(new Map())

  const setCollection = useCallback((collection: string) => {
    setCollectionState(collection)
  }, [])

  const setSelected = useCallback((selectedArg: Map<number | string, boolean>) => {
    setSelectedState(selectedArg)
  }, [])

  return (
    <ImportExportContext.Provider value={{ collection, selected, setCollection, setSelected }}>
      {children}
    </ImportExportContext.Provider>
  )
}

export const useImportExport = (): ImportExportContext => useContext(ImportExportContext)
