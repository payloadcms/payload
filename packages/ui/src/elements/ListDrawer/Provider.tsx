import type { CollectionSlug, Data, ListQuery } from 'payload'

import { createContext, use } from 'react'

import type { useSelection } from '../../providers/Selection/index.js'
import type { UseDocumentDrawer } from '../DocumentDrawer/types.js'
import type { Option } from '../ReactSelect/index.js'

export type ListDrawerContextProps = {
  readonly allowCreate?: boolean
  readonly createNewDrawerSlug?: string
  readonly DocumentDrawerToggler?: ReturnType<UseDocumentDrawer>[1]
  readonly drawerSlug?: string
  readonly enabledCollections?: CollectionSlug[]
  readonly onBulkSelect?: (selected: ReturnType<typeof useSelection>['selected']) => void
  readonly onQueryChange?: (query: ListQuery) => void
  readonly onSelect?: (args: {
    collectionSlug: CollectionSlug
    doc: Data
    /**
     * @deprecated
     * The `docID` property is deprecated and will be removed in the next major version of Payload.
     * Use `doc.id` instead.
     */
    docID: string
  }) => void
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
    <ListDrawerContext value={{ isInDrawer: Boolean(rest.drawerSlug), ...rest }}>
      {children}
    </ListDrawerContext>
  )
}

export const useListDrawerContext = (): ListDrawerContextType => {
  const context = use(ListDrawerContext)

  if (!context) {
    throw new Error('useListDrawerContext must be used within a ListDrawerContextProvider')
  }

  return context
}
