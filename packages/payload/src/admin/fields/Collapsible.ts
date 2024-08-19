import type { MarkOptional } from 'ts-essentials'

import type { CollapsibleFieldClient } from '../../fields/config/types.js'
import type { ErrorComponent, ErrorProps } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FieldDescriptionProps,
  FormFieldBase,
  LabelComponent,
  LabelProps,
} from '../types.js'

export type CollapsibleFieldProps = {
  readonly descriptionProps?: FieldDescriptionProps<CollapsibleFieldProps>
  readonly errorProps?: ErrorProps<CollapsibleFieldProps>
  readonly field: MarkOptional<CollapsibleFieldClient, 'type'>
  readonly labelProps?: LabelProps<CollapsibleFieldProps>
} & FormFieldBase

export type CollapsibleFieldLabelComponent = LabelComponent<CollapsibleFieldProps>

export type CollapsibleFieldDescriptionComponent = DescriptionComponent<CollapsibleFieldProps>

export type CollapsibleFieldErrorComponent = ErrorComponent<CollapsibleFieldProps>
