import { FieldPermissions } from 'payload/auth'
import {
  BlockField,
  FieldBase,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  TabsField,
  Option,
} from 'payload/types'
import { fieldTypes } from '../../forms/fields'

export type MappedTab = {
  name?: string
  label: TabsField['tabs'][0]['label']
  subfields?: FieldMap
}

export type ReducedBlock = {
  slug: string
  subfields: FieldMap
  labels: BlockField['labels']
  imageAltText?: string
  imageURL?: string
}

export type MappedField = {
  type: keyof typeof fieldTypes
  Field: React.ReactNode
  Cell: React.ReactNode
  Heading: React.ReactNode
  fieldIsPresentational: boolean
  fieldPermissions: FieldPermissions
  isFieldAffectingData: boolean
  name: string
  readOnly: boolean
  isSidebar: boolean
  label: FieldBase['label']
  fieldMap?: FieldMap
  localized: boolean
  /**
   * On `array`, `blocks`, `group`, `collapsible`, and `tabs` fields only
   */
  subfields?: FieldMap
  /**
   * On `tabs` fields only
   */
  tabs?: MappedTab[]
  /**
   * On `select` fields only
   */
  options?: Option[]
  hasMany?: boolean
}

export type FieldMap = MappedField[]

export type CollectionComponentMap = {
  BeforeList: React.ReactNode
  AfterList: React.ReactNode
  BeforeListTable: React.ReactNode
  AfterListTable: React.ReactNode
  fieldMap: FieldMap
}

export type GlobalComponentMap = {
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
