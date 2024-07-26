import type { DescriptionComponent, FormFieldBase, LabelComponent } from 'payload'

import type { ErrorComponent } from '../forms/Error.js'
import type { FieldMap } from '../forms/FieldMap.js'

export type RowFieldProps = {
  fieldMap: FieldMap
  forceRender?: boolean
  indexPath: string
  path?: string
  width?: string
} & FormFieldBase

export type RowFieldLabelComponent = LabelComponent<'row'>

export type RowFieldDescriptionComponent = DescriptionComponent<'row'>

export type RowFieldErrorComponent = ErrorComponent<'row'>
