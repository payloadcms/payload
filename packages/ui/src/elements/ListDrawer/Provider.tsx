import type { CollectionSlug } from 'payload'

import { createContext, useContext } from 'react'

import type { useSelection } from '../../providers/Selection/index.js'

export type ListDrawerContextProps = {
  readonly drawerSlug: string
  readonly onBulkSelect?: (selected: ReturnType<typeof useSelection>['selected']) => void
  readonly onSelect?: (args: { collectionSlug: CollectionSlug; docID: string }) => void
}

export type ListDrawerContextType = ListDrawerContextProps

export const ListDrawerCallbacksContext = createContext({} as ListDrawerContextType)

export const ListDrawerContextProvider: React.FC<
  {
    children: React.ReactNode
  } & ListDrawerContextProps
> = ({ children, ...callbacks }) => {
  return (
    <ListDrawerCallbacksContext.Provider value={callbacks}>
      {children}
    </ListDrawerCallbacksContext.Provider>
  )
}

export const useListDrawerContext = (): ListDrawerContextType => {
  const context = useContext(ListDrawerCallbacksContext)

  if (!context) {
    throw new Error('useListDrawerContext must be used within a ListDrawerProvider')
  }

  return context
}
