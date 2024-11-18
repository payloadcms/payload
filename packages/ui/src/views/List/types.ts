import type { I18n } from '@payloadcms/translations'
import type {
  ClientCollectionConfig,
  Column,
  ColumnPreferences,
  Field,
  Locale,
  Payload,
  SanitizedCollectionConfig,
  User,
  Where,
} from 'payload'

import type { ListQueryProps } from '../../providers/ListQuery/index.js'
import type { GetTableStateClient } from '../../providers/ServerFunctions/types.js'

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
  clientCollectionConfig: ClientCollectionConfig
  collectionConfig: SanitizedCollectionConfig
  customCellProps?: Record<string, any>
  defaultLimit: number
  defaultSort: string
  drawerSlug?: string
  fields: Field[]
  i18n: I18n
  limit: number
  listPreferences?: ListPreferences
  locale?: Locale
  modifySearchParams: boolean
  page?: number
  payload: Payload
  sort?: string
  user: User
  whereQuery?: Where
}

export type ListViewSlots = {
  AfterList?: React.ReactNode
  AfterListTable?: React.ReactNode
  BeforeList?: React.ReactNode
  BeforeListTable?: React.ReactNode
  Description?: React.ReactNode
  Table: React.ReactNode
}

export type ListViewClientProps = {
  beforeActions?: React.ReactNode[]
  collectionSlug: string
  columnState: Column[]
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  enableRowSelections?: boolean
  getTableState?: GetTableStateClient
  hasCreatePermission: boolean
  listPreferences?: ListPreferences
  newDocumentURL: string
  preferenceKey?: string
  renderedFilters?: Map<string, React.ReactNode>
} & ListViewSlots

export type DefaultListViewProps = ListViewClientProps
