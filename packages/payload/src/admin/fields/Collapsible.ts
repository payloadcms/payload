import type { StaticLabel } from '../../config/types.js'
import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type CollapsibleFieldClient = {
  readonly fields: ClientFieldConfig[]
  readonly label: StaticLabel
} & Extract<ClientFieldConfig, { type: 'collapsible' }>

export type CollapsibleFieldProps = {
  readonly field: CollapsibleFieldClient
} & FormFieldBase

export type CollapsibleFieldLabelComponent = LabelComponent<'collapsible'>

export type CollapsibleFieldDescriptionComponent = DescriptionComponent<'collapsible'>

export type CollapsibleFieldErrorComponent = ErrorComponent<'collapsible'>
