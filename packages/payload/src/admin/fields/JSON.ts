import type { MarkOptional } from 'ts-essentials'

import type { JSONFieldClient } from '../../fields/config/types.js'
import type { JSONFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent, ErrorProps } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FieldDescriptionProps,
  FormFieldBase,
  LabelComponent,
  LabelProps,
} from '../types.js'

export type JSONFieldProps = {
  readonly descriptionProps?: FieldDescriptionProps<JSONFieldProps>
  readonly errorProps?: ErrorProps<JSONFieldProps>
  readonly field: MarkOptional<JSONFieldClient, 'type'>
  readonly labelProps?: LabelProps<JSONFieldProps>
  readonly validate?: JSONFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type JSONFieldLabelComponent = LabelComponent<JSONFieldProps>

export type JSONFieldDescriptionComponent = DescriptionComponent<JSONFieldProps>

export type JSONFieldErrorComponent = ErrorComponent<JSONFieldProps>
