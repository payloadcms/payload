import type { CustomComponent, PayloadServerReactComponent, StaticLabel } from 'payload'

import type { CollectionLabels } from '../../../types.js'

export type ReindexButtonProps = {
  collectionLabels: Record<string, StaticLabel>
  searchCollections: string[]
  searchSlug: string
}

type ReindexButtonServerProps = {
  collectionLabels: CollectionLabels
} & ReindexButtonProps

export type SearchReindexButtonClientComponent = ReindexButtonProps
export type SearchReindexButtonServerComponent = PayloadServerReactComponent<
  CustomComponent<ReindexButtonServerProps>
>
