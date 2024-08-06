import type { DescriptionComponent, FormFieldBase, LabelComponent } from 'payload'

import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { ErrorComponent } from '../forms/Error.js'

export type RowFieldClient = {
  readonly fields: ClientFieldConfig[]
} & Extract<ClientFieldConfig, { type: 'row' }>

export type RowFieldProps = {
  readonly field: RowFieldClient
  readonly forceRender?: boolean
  readonly indexPath: string
} & FormFieldBase

export type RowFieldLabelComponent = LabelComponent<'row'>

export type RowFieldDescriptionComponent = DescriptionComponent<'row'>

export type RowFieldErrorComponent = ErrorComponent<'row'>
