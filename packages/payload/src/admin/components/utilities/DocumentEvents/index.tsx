import React, { createContext, useContext, useState } from 'react'

import type { UpdatedDocument } from './types'

import { type DocumentEventsContext } from './types'

const Context = createContext({
  updates: null,
} as DocumentEventsContext)

export const DocumentEventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [updates, reportUpdate] = useState<Array<UpdatedDocument>>([])

  return <Context.Provider value={{ reportUpdate, updates }}>{children}</Context.Provider>
}

export const useDocumentEvents = () => useContext(Context)
