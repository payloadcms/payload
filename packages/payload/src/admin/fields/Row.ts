import type { DescriptionComponent, FormFieldBase, LabelComponent } from 'payload'

import type { GenericClientFieldConfig } from '../../fields/config/client.js'
import type { ErrorComponent } from '../forms/Error.js'

export type RowFieldProps = {
  readonly clientFieldConfig: GenericClientFieldConfig<'row'>
  readonly forceRender?: boolean
  readonly indexPath: string
} & FormFieldBase

export type RowFieldLabelComponent = LabelComponent<'row'>

export type RowFieldDescriptionComponent = DescriptionComponent<'row'>

export type RowFieldErrorComponent = ErrorComponent<'row'>
