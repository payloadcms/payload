import type {
  BlockField,
  FieldBase,
  Labels,
  Option,
  RelationshipField,
  RichTextField,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  TabsField,
} from 'payload/types'

import type { fieldTypes } from '../../forms/fields/index.js'

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
   * On `block` fields only
   */
  blocks?: ReducedBlock[]
  disabled?: boolean
  /**
   * On `richText` fields only
   */
  editor?: RichTextField['editor']
  fieldIsPresentational: boolean
  fieldMap?: FieldMap
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
  /**
   * This is the `admin.readOnly` value from the field's config
   */
  readOnly: boolean
  /**
   * On `relationship` fields only
   */
  relationTo?: RelationshipField['relationTo']
  /**
   * On `array`, `group`, `collapsible`, and `tabs` fields only
   */
  subfields?: FieldMap
  /**
   * On `tabs` fields only
   */
  tabs?: MappedTab[]
  type: keyof typeof fieldTypes
}

export type FieldMap = MappedField[]

export type ActionMap = {
  Edit: {
    [view: string]: React.ReactNode[]
  }
  List: React.ReactNode[]
}

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
  actionsMap: ActionMap
  fieldMap: FieldMap
}

export type ComponentMap = {
  Icon: React.ReactNode
  LogoutButton: React.ReactNode
  actions: React.ReactNode[]
  collections: {
    [slug: SanitizedCollectionConfig['slug']]: CollectionComponentMap
  }
  globals: {
    [slug: SanitizedGlobalConfig['slug']]: GlobalComponentMap
  }
}
