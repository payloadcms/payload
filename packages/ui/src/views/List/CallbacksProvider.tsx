import type { CollectionSlug } from 'payload'

import { createContext, useContext } from 'react'

import type { useSelection } from '../../providers/Selection/index.js'

export type ListViewCallbacks = {
  readonly onBulkSelect?: (selected: ReturnType<typeof useSelection>['selected']) => void
  readonly onSelect?: (args: { collectionSlug: CollectionSlug; docID: string }) => void
}

export type ListViewCallbacksContextType = ListViewCallbacks

export const ListViewCallbacksContext = createContext({} as ListViewCallbacksContextType)

export const ListViewCallbacksProvider: React.FC<
  {
    children: React.ReactNode
  } & ListViewCallbacks
> = ({ children, ...callbacks }) => {
  return (
    <ListViewCallbacksContext.Provider value={callbacks}>
      {children}
    </ListViewCallbacksContext.Provider>
  )
}

export const useListViewCallbacks = (): ListViewCallbacksContextType => {
  const context = useContext(ListViewCallbacksContext)

  if (!context) {
    throw new Error('useListViewCallbacks must be used within a ListViewCallbacksProvider')
  }

  return context
}
