import type { PaginatedDocs, ValueWithRelation } from 'payload'

export type ValueAsDataWithRelation = {
  relationTo: string
  value: any
}

type PopulateDocsDeprecated = (
  ids: (number | string)[],
  items: never,
  collectionSlug?: string, // kept for compatibility, not used
) => Promise<null | PaginatedDocs>

type PopulateDocsNew = (
  items: ValueWithRelation[],
  ids: never,
  collectionSlug: never,
) => Promise<null | ValueAsDataWithRelation[]>

export type PopulateDocs = PopulateDocsDeprecated | PopulateDocsNew

export type ReloadDoc = (doc: number | string, collectionSlug: string) => Promise<void>
