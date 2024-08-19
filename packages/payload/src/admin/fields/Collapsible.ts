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

type CollapsibleFieldClientWithoutType = MarkOptional<CollapsibleFieldClient, 'type'>

export type CollapsibleFieldProps = {
  readonly descriptionProps?: FieldDescriptionProps<CollapsibleFieldClientWithoutType>
  readonly errorProps?: ErrorProps<CollapsibleFieldClientWithoutType>
  readonly field: CollapsibleFieldClientWithoutType
  readonly labelProps?: LabelProps<CollapsibleFieldClientWithoutType>
} & FormFieldBase

export type CollapsibleFieldLabelComponent = LabelComponent<CollapsibleFieldClientWithoutType>

export type CollapsibleFieldDescriptionComponent =
  DescriptionComponent<CollapsibleFieldClientWithoutType>

export type CollapsibleFieldErrorComponent = ErrorComponent<CollapsibleFieldClientWithoutType>
