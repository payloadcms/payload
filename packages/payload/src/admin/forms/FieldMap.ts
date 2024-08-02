import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { BlockField, FieldTypes, TabsField } from '../../fields/config/types.js'
import type { CellComponentProps, FieldComponentProps, MappedComponent } from '../types.js'

export type MappedTab = {
  fields?: ClientFieldConfig[]
  label: TabsField['tabs'][0]['label']
  name?: string
}

export type ReducedBlock = {
  LabelComponent: MappedComponent
  custom?: Record<any, string>
  fields: ClientFieldConfig[]
  imageAltText?: string
  imageURL?: string
  labels: BlockField['labels']
  slug: string
}

export type MappedField = {
  Cell?: MappedComponent
  Field?: MappedComponent
  cellComponentProps: CellComponentProps
  custom?: Record<any, string>
  disableBulkEdit?: boolean
  disableListColumn?: boolean
  disableListFilter?: boolean
  disabled?: boolean
  fieldComponentProps: FieldComponentProps
  fieldIsPresentational: boolean
  isFieldAffectingData: boolean
  isHidden?: boolean
  isSidebar?: boolean
  localized: boolean
  name?: string
  type: FieldTypes
  unique?: boolean
}

export type FieldMap = MappedField[]
