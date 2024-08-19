import type { MarkOptional } from 'ts-essentials'

import type { GroupFieldClient } from '../../fields/config/types.js'
import type { ErrorComponent, ErrorProps } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FieldDescriptionProps,
  FormFieldBase,
  LabelComponent,
  LabelProps,
} from '../types.js'

export type GroupFieldProps = {
  readonly descriptionProps?: FieldDescriptionProps<GroupFieldProps>
  readonly errorProps?: ErrorProps<GroupFieldProps>
  readonly field: MarkOptional<GroupFieldClient, 'type'>
  readonly labelProps?: LabelProps<GroupFieldProps>
} & FormFieldBase

export type GroupFieldLabelComponent = LabelComponent<GroupFieldProps>

export type GroupFieldDescriptionComponent = DescriptionComponent<GroupFieldProps>

export type GroupFieldErrorComponent = ErrorComponent<GroupFieldProps>
