import { FieldPermissions } from 'payload/auth'
import {
  BlockField,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  TabsField,
} from 'payload/types'
import { fieldTypes } from '../../fields'

export type ReducedTab = {
  name?: string
  label: TabsField['tabs'][0]['label']
  subfields?: ReducedField[]
}

export type ReducedBlock = {
  slug: string
  subfields: ReducedField[]
  labels: BlockField['labels']
  imageAltText?: string
  imageURL?: string
}

export type ReducedField = {
  type: keyof typeof fieldTypes
  Field: React.ReactNode
  fieldIsPresentational: boolean
  fieldPermissions: FieldPermissions
  isFieldAffectingData: boolean
  name: string
  readOnly: boolean
  isSidebar: boolean
  /**
   * On `array`, `blocks`, `group`, `collapsible`, and `tabs` fields only
   */
  subfields?: ReducedField[]
  /**
   * On `tabs` fields only
   */
  tabs?: ReducedTab[]
  fieldMap?: FieldMap
}

export type FieldMap = ReducedField[]

export type ComponentMap = {
  [key: SanitizedCollectionConfig['slug'] | SanitizedGlobalConfig['slug']]: {
    BeforeList: React.ReactNode
    AfterList: React.ReactNode
    BeforeListTable: React.ReactNode
    AfterListTable: React.ReactNode
    BeforeFields: React.ReactNode
    AfterFields: React.ReactNode
    fields: FieldMap
  }
}
