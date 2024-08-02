import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type CollapsibleFieldProps = {
  readonly fields: ClientFieldConfig[]
  readonly initCollapsed?: boolean
  readonly width?: string
} & FormFieldBase

export type CollapsibleFieldLabelComponent = LabelComponent<'collapsible'>

export type CollapsibleFieldDescriptionComponent = DescriptionComponent<'collapsible'>

export type CollapsibleFieldErrorComponent = ErrorComponent<'collapsible'>
