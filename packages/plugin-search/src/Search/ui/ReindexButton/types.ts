import type { CustomComponent, PayloadServerReactComponent } from 'payload'

import type { CollectionLabels, ResolvedCollectionLabels } from '../../../types.js'

export type ReindexButtonProps = {
  collectionLabels: ResolvedCollectionLabels
  searchCollections: string[]
  searchSlug: string
}

export type ReindexButtonServerProps = {
  collectionLabels: CollectionLabels
} & Omit<ReindexButtonProps, 'collectionLabels'>

export type SearchReindexButtonClientComponent = ReindexButtonProps

export type SearchReindexButtonServerComponent = PayloadServerReactComponent<
  CustomComponent<ReindexButtonServerProps>
>
