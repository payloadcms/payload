'use client'
import type { DocumentEvent } from 'payload'

import React, { createContext, use, useState } from 'react'

const Context = createContext({
  mostRecentUpdate: null,
  reportUpdate: (doc: DocumentEvent) => null,
})

export const DocumentEventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mostRecentUpdate, reportUpdate] = useState<DocumentEvent>(null)

  return <Context value={{ mostRecentUpdate, reportUpdate }}>{children}</Context>
}

export const useDocumentEvents = () => use(Context)
