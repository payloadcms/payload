'use client'
import type { DocumentEvent } from 'payload'

import React, { createContext, useContext, useState } from 'react'

const Context = createContext({
  mostRecentUpdate: null,
  reportUpdate: (doc: DocumentEvent) => null,
})

export const DocumentEventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mostRecentUpdate, reportUpdate] = useState<DocumentEvent>(null)

  return <Context.Provider value={{ mostRecentUpdate, reportUpdate }}>{children}</Context.Provider>
}

export const useDocumentEvents = () => useContext(Context)
