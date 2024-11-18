import type { I18n } from '@payloadcms/translations'
import type {
  AdminViewProps,
  Locale,
  Payload,
  SanitizedCollectionConfig,
  SanitizedPermissions,
  User,
} from 'payload'

import type { ColumnPreferences } from '../../providers/ListQuery/index.js'

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

export type ListComponentClientProps = {
  collectionSlug: SanitizedCollectionConfig['slug']
  hasCreatePermission: boolean
  newDocumentURL: string
}

export type ListComponentServerProps = {
  collectionConfig: SanitizedCollectionConfig
  i18n: I18n
  limit: number
  locale: Locale
  params: AdminViewProps['params']
  payload: Payload
  permissions: SanitizedPermissions
  searchParams: AdminViewProps['searchParams']
  user: User
}
