import type { MarkOptional } from 'ts-essentials'

import type { ArrayFieldClient } from '../../fields/config/types.js'
import type { ArrayFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent, ErrorProps } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FieldDescriptionProps,
  FormFieldBase,
  LabelComponent,
  LabelProps,
  MappedComponent,
} from '../types.js'

export type ArrayFieldProps = {
  readonly CustomRowLabel?: MappedComponent
  readonly descriptionProps?: FieldDescriptionProps<ArrayFieldProps>
  readonly errorProps?: ErrorProps<ArrayFieldProps>
  readonly field: MarkOptional<ArrayFieldClient, 'type'>
  readonly labelProps?: LabelProps<ArrayFieldProps>
  readonly validate?: ArrayFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type ArrayFieldLabelComponent = LabelComponent<ArrayFieldProps>

export type ArrayFieldDescriptionComponent = DescriptionComponent<ArrayFieldProps>

export type ArrayFieldErrorComponent = ErrorComponent<ArrayFieldProps>
