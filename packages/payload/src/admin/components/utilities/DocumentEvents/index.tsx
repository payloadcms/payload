import React, { createContext, useContext, useState } from 'react'

import type { UpdatedDocument } from './types'

const Context = createContext({
  mostRecentUpdate: null,
  reportUpdate: (doc: UpdatedDocument) => null, // eslint-disable-line @typescript-eslint/no-unused-vars
})

export const DocumentEventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mostRecentUpdate, reportUpdate] = useState<UpdatedDocument>(null)

  return <Context.Provider value={{ mostRecentUpdate, reportUpdate }}>{children}</Context.Provider>
}

export const useDocumentEvents = () => useContext(Context)
