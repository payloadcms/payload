import type { ServerProps } from '../../config/types.js'

export type ListSelectionItemsClientProps = {
  collectionSlug: string
}

export type ListSelectionItemsServerPropsOnly = {} & ServerProps

export type ListSelectionItemsServerProps = ListSelectionItemsClientProps &
  ListSelectionItemsServerPropsOnly
