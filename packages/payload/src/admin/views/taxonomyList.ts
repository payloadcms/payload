import type { PaginatedDocs } from '../../database/types.js'

export type RelatedDocumentsGrouped = {
  [collectionSlug: string]: {
    data: PaginatedDocs
    fieldInfo: { fieldName: string; hasMany: boolean }
    label: string
  }
}
