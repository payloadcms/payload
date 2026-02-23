import type { PaginatedDocs } from '../../database/types.js'

export type RelatedDocumentsGrouped = {
  [collectionSlug: string]: {
    hasMany: boolean
    label: string
    result: PaginatedDocs
  }
}
