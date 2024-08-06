import type { StaticLabel } from '../../config/types.js'
import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type GroupFieldClient = {
  readonly fields: ClientFieldConfig[]
  readonly label: StaticLabel
} & Extract<ClientFieldConfig, { type: 'group' }>

export type GroupFieldProps = {
  readonly field: GroupFieldClient
  readonly forceRender?: boolean
} & FormFieldBase

export type GroupFieldLabelComponent = LabelComponent<'group'>

export type GroupFieldDescriptionComponent = DescriptionComponent<'group'>

export type GroupFieldErrorComponent = ErrorComponent<'group'>
