import type { MarkOptional } from 'ts-essentials'

import type { NumberFieldClient } from '../../fields/config/types.js'
import type { NumberFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent, ErrorProps } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FieldDescriptionProps,
  FormFieldBase,
  LabelComponent,
  LabelProps,
} from '../types.js'

export type NumberFieldProps = {
  readonly descriptionProps?: FieldDescriptionProps<NumberFieldProps>
  readonly errorProps?: ErrorProps<NumberFieldProps>
  readonly field: MarkOptional<NumberFieldClient, 'type'>
  readonly labelProps?: LabelProps<NumberFieldProps>
  readonly onChange?: (e: number) => void
  readonly validate?: NumberFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type NumberFieldLabelComponent = LabelComponent<NumberFieldProps>

export type NumberFieldDescriptionComponent = DescriptionComponent<NumberFieldProps>

export type NumberFieldErrorComponent = ErrorComponent<NumberFieldProps>
