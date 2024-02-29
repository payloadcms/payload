import type { FieldPermissions } from 'payload/auth'
import type {
  BlockField,
  FieldBase,
  Labels,
  Option,
  RichTextField,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  TabsField,
} from 'payload/types'

import type { fieldTypes } from '../../forms/fields'

export type MappedTab = {
  label: TabsField['tabs'][0]['label']
  name?: string
  subfields?: FieldMap
}

export type ReducedBlock = {
  imageAltText?: string
  imageURL?: string
  labels: BlockField['labels']
  slug: string
  subfields: FieldMap
}

export type MappedField = {
  Cell: React.ReactNode
  Field: React.ReactNode
  Heading: React.ReactNode
  /**
   * On `richText` fields only
   */
  editor?: RichTextField['editor']
  fieldIsPresentational: boolean
  fieldMap?: FieldMap
  fieldPermissions: FieldPermissions
  hasMany?: boolean
  isFieldAffectingData: boolean
  isSidebar: boolean
  label: FieldBase['label']
  labels: Labels
  localized: boolean
  name: string
  /**
   * On `select` fields only
   */
  options?: Option[]
  readOnly: boolean
  /**
   * On `array`, `blocks`, `group`, `collapsible`, and `tabs` fields only
   */
  subfields?: FieldMap
  /**
   * On `tabs` fields only
   */
  tabs?: MappedTab[]
  type: keyof typeof fieldTypes
}

export type FieldMap = MappedField[]

export type CollectionComponentMap = ConfigComponentMapBase & {
  AdminThumbnail: React.ReactNode
  AfterList: React.ReactNode
  AfterListTable: React.ReactNode
  BeforeList: React.ReactNode
  BeforeListTable: React.ReactNode
  List: React.ReactNode
}

export type GlobalComponentMap = ConfigComponentMapBase

export type ConfigComponentMapBase = {
  Edit: React.ReactNode
  fieldMap: FieldMap
}

export type ComponentMap = {
  collections: {
    [slug: SanitizedCollectionConfig['slug']]: CollectionComponentMap
  }
  globals: {
    [slug: SanitizedGlobalConfig['slug']]: GlobalComponentMap
  }
}
