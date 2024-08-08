import type { DescriptionComponent, FormFieldBase, LabelComponent } from 'payload'

import type { RowFieldClient } from '../../fields/config/types.js'
import type { ErrorComponent } from '../forms/Error.js'

export type RowFieldProps = {
  field: RowFieldClient
  forceRender?: boolean
  indexPath: string
} & FormFieldBase

export type RowFieldLabelComponent = LabelComponent<'row'>

export type RowFieldDescriptionComponent = DescriptionComponent<'row'>

export type RowFieldErrorComponent = ErrorComponent<'row'>
