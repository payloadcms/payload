import type { ClientCollectionConfig, Data, FormState, TypeWithID } from 'payload'

import { createContext, use } from 'react'

export type DocumentDrawerContextProps = {
  readonly clearDoc?: () => void
  readonly drawerSlug: string
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
  }) => Promise<FormState | void> | void
}

export type DocumentDrawerContextType = DocumentDrawerContextProps

export const DocumentDrawerCallbacksContext = createContext({} as DocumentDrawerContextType)

export const DocumentDrawerContextProvider: React.FC<
  {
    children: React.ReactNode
  } & DocumentDrawerContextProps
> = ({ children, ...rest }) => {
  return <DocumentDrawerCallbacksContext value={rest}>{children}</DocumentDrawerCallbacksContext>
}

export const useDocumentDrawerContext = (): DocumentDrawerContextType => {
  const context = use(DocumentDrawerCallbacksContext)

  if (!context) {
    throw new Error('useDocumentDrawerContext must be used within a DocumentDrawerProvider')
  }

  return context
}
