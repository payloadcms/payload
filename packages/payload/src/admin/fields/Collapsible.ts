import type { ErrorComponent } from '../forms/Error.js'
import type { FieldMap } from '../forms/FieldMap.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type CollapsibleFieldProps = {
  fieldMap: FieldMap
  initCollapsed?: boolean
  width?: string
} & FormFieldBase

export type CollapsibleFieldLabelComponent = LabelComponent<'collapsible'>

export type CollapsibleFieldDescriptionComponent = DescriptionComponent<'collapsible'>

export type CollapsibleFieldErrorComponent = ErrorComponent<'collapsible'>
