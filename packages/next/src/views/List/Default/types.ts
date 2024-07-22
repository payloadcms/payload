import type { ColumnPreferences } from '@payloadcms/ui'
import type { SanitizedCollectionConfig } from 'payload'

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
