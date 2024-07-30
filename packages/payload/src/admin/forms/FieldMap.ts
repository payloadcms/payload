import type { CellComponentProps, FieldComponentProps } from '../types.js'
import type { FieldTypes } from './FieldTypes.js'

export type MappedField = {
  CustomCell?: React.ReactNode
  CustomField?: React.ReactNode
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
  type: keyof FieldTypes
  unique?: boolean
}

export type FieldMap = MappedField[]
