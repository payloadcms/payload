import type { ColumnPreferences } from '@payloadcms/ui/providers/ListInfo'
import type { SanitizedCollectionConfig } from 'payload/types'

export type DefaultListViewProps = {
  collectionSlug: SanitizedCollectionConfig['slug']
  listSearchableFields: SanitizedCollectionConfig['admin']['listSearchableFields']
}

export type ListIndexProps = {
  collection: SanitizedCollectionConfig
}

export type ListPreferences = {
  columns: ColumnPreferences
  limit: number
  sort: string
}
