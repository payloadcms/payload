import type { CollectionSlug, ListQuery } from 'payload'

import { createContext, useContext } from 'react'

import type { useSelection } from '../../providers/Selection/index.js'
import type { UseDocumentDrawer } from '../DocumentDrawer/types.js'
import type { Option } from '../ReactSelect/index.js'

export type ListDrawerContextProps = {
  readonly createNewDrawerSlug?: string
  readonly DocumentDrawerToggler?: ReturnType<UseDocumentDrawer>[1]
  readonly drawerSlug?: string
  readonly enabledCollections?: CollectionSlug[]
  readonly onBulkSelect?: (selected: ReturnType<typeof useSelection>['selected']) => void
  readonly onQueryChange?: (query: ListQuery) => void
  readonly onSelect?: (args: { collectionSlug: CollectionSlug; docID: string }) => void
  readonly selectedOption?: Option<string>
  readonly setSelectedOption?: (option: Option<string>) => void
}

export type ListDrawerContextType = {
  isInDrawer: boolean
} & ListDrawerContextProps

export const ListDrawerContext = createContext({} as ListDrawerContextType)

export const ListDrawerContextProvider: React.FC<
  {
    children: React.ReactNode
  } & ListDrawerContextProps
> = ({ children, ...rest }) => {
  return (
    <ListDrawerContext.Provider value={{ isInDrawer: Boolean(rest.drawerSlug), ...rest }}>
      {children}
    </ListDrawerContext.Provider>
  )
}

export const useListDrawerContext = (): ListDrawerContextType => {
  const context = useContext(ListDrawerContext)

  if (!context) {
    throw new Error('useListDrawerContext must be used within a ListDrawerContextProvider')
  }

  return context
}
