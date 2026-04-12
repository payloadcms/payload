'use client'
import type { DocumentEvent } from 'payload'

import React, { createContext, use, useState } from 'react'

const Context = createContext<{
  mostRecentUpdate: DocumentEvent | null
  reportUpdate: (event: DocumentEvent) => void
}>({
  mostRecentUpdate: null,
  reportUpdate: () => null,
})

export const DocumentEventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mostRecentUpdate, reportUpdate] = useState<DocumentEvent>(null)

  return <Context value={{ mostRecentUpdate, reportUpdate }}>{children}</Context>
}

/**
 * The useDocumentEvents hook provides a way of subscribing to cross-document events,
 * such as updates made to nested documents within a drawer.
 * This hook will report document events that are outside the scope of the document currently being edited.
 *
 * @link https://payloadcms.com/docs/admin/react-hooks#usedocumentevents
 */
export const useDocumentEvents = () => use(Context)
