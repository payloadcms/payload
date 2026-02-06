import type { PaginatedDocs } from '../../database/types.js'

export type RelatedDocumentsGrouped = {
  [collectionSlug: string]: {
    data: PaginatedDocs
    label: string
  }
}
