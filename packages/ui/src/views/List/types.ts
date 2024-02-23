import type { SanitizedCollectionConfig } from 'payload/types'

export type DefaultListViewProps = {
  collectionSlug: SanitizedCollectionConfig['slug']
}

export type ListIndexProps = {
  collection: SanitizedCollectionConfig
}

export type ListPreferences = {
  columns: {
    accessor: string
    active: boolean
  }[]
  limit: number
  sort: number
}
