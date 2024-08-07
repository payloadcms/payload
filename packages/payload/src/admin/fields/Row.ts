import type { DescriptionComponent, FormFieldBase, LabelComponent } from 'payload'

import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { ErrorComponent } from '../forms/Error.js'

export type RowFieldClient = {
  fields: ClientFieldConfig[]
} & Omit<Extract<ClientFieldConfig, { type: 'row' }>, 'fields'>

export type RowFieldProps = {
  field: RowFieldClient
  forceRender?: boolean
  indexPath: string
} & FormFieldBase

export type RowFieldLabelComponent = LabelComponent<'row'>

export type RowFieldDescriptionComponent = DescriptionComponent<'row'>

export type RowFieldErrorComponent = ErrorComponent<'row'>
