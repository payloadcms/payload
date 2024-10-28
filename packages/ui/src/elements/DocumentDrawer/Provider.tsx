import type { ClientCollectionConfig, Data, TypeWithID } from 'payload'

import { createContext, useContext } from 'react'

export type DocumentDrawerContextProps = {
  readonly drawerSlug: string
  readonly onCreate?: () => void
  readonly onDelete?: (args: {
    collectionConfig?: ClientCollectionConfig
    id: string
  }) => Promise<void> | void
  /* only available if `redirectAfterDuplicate` is `false` */
  readonly onDuplicate?: (args: {
    collectionConfig?: ClientCollectionConfig
    doc: TypeWithID
  }) => Promise<void> | void
  readonly onSave?: (args: {
    collectionConfig?: ClientCollectionConfig
    doc: TypeWithID
    operation: 'create' | 'update'
    result: Data
  }) => Promise<void> | void
}

export type DocumentDrawerContextType = DocumentDrawerContextProps

export const DocumentDrawerCallbacksContext = createContext({} as DocumentDrawerContextType)

export const DocumentDrawerContextProvider: React.FC<
  {
    children: React.ReactNode
  } & DocumentDrawerContextProps
> = ({ children, ...callbacks }) => {
  return (
    <DocumentDrawerCallbacksContext.Provider value={callbacks}>
      {children}
    </DocumentDrawerCallbacksContext.Provider>
  )
}

export const useDocumentDrawerContext = (): DocumentDrawerContextType => {
  const context = useContext(DocumentDrawerCallbacksContext)

  if (!context) {
    throw new Error('useDocumentDrawerContext must be used within a DocumentDrawerProvider')
  }

  return context
}
