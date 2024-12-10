'use client'
import React, { createContext, useContext, useState } from 'react'

export type UpdatedDocument = {
  entitySlug: string
  id?: number | string
  updatedAt: string
}

const Context = createContext({
  mostRecentUpdate: null,
  reportUpdate: (doc: UpdatedDocument) => null,
})

export const DocumentEventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mostRecentUpdate, reportUpdate] = useState<UpdatedDocument>(null)

  return <Context.Provider value={{ mostRecentUpdate, reportUpdate }}>{children}</Context.Provider>
}

export const useDocumentEvents = () => useContext(Context)
