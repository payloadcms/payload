import type { FieldMap } from '../forms/FieldMap.js'
import type { FormFieldBase } from '../types.js'

export type CollapsibleFieldProps = {
  fieldMap: FieldMap
  initCollapsed?: boolean
  width?: string
} & FormFieldBase
