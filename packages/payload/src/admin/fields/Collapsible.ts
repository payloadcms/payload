import type { MarkOptional } from 'ts-essentials'

import type { CollapsibleFieldClient } from '../../fields/config/types.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type CollapsibleFieldProps = {
  readonly field: MarkOptional<CollapsibleFieldClient, 'type'>
} & FormFieldBase

export type CollapsibleFieldLabelComponent = LabelComponent<'collapsible'>

export type CollapsibleFieldDescriptionComponent = DescriptionComponent<'collapsible'>

export type CollapsibleFieldErrorComponent = ErrorComponent<'collapsible'>
