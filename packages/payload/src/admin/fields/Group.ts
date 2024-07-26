import type { ErrorComponent } from '../forms/Error.js'
import type { FieldMap } from '../forms/FieldMap.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type GroupFieldProps = {
  fieldMap: FieldMap
  forceRender?: boolean
  hideGutter?: boolean
  name?: string
  width?: string
} & FormFieldBase

export type GroupFieldLabelComponent = LabelComponent<'group'>

export type GroupFieldDescriptionComponent = DescriptionComponent<'group'>

export type GroupFieldErrorComponent = ErrorComponent<'group'>
