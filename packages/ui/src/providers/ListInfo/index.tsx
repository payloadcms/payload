import type { CollectionSlug } from 'payload'

import { createContext, useContext } from 'react'

import type { useSelection } from '../../providers/Selection/index.js'

import { type Option } from '../../elements/ReactSelect/index.js'

export type ListInfoProps = {
  readonly createNewDrawerSlug?: string
  readonly drawerSlug: string
  readonly enabledCollections: CollectionSlug[]
  readonly onBulkSelect?: (selected: ReturnType<typeof useSelection>['selected']) => void
  readonly onSelect?: (args: { collectionSlug: CollectionSlug; docID: string }) => void
  readonly selectedOption: Option<string>
  readonly setSelectedOption: (option: Option<string>) => void
}

export type ListInfoType = ListInfoProps & {
  isInDrawer: boolean
}

export const ListInfo = createContext({} as ListInfoType)

export const ListInfoProvider: React.FC<
  {
    children: React.ReactNode
  } & ListInfoProps
> = ({ children, ...rest }) => {
  return (
    <ListInfo.Provider value={{ isInDrawer: Boolean(rest.drawerSlug), ...rest }}>
      {children}
    </ListInfo.Provider>
  )
}

export const useListInfo = (): ListInfoType => {
  const context = useContext(ListInfo)

  if (!context) {
    throw new Error('useListInfo must be used within a ListInfoProvider')
  }

  return context
}
