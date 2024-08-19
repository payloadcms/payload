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

type NumberFieldClientWithoutType = MarkOptional<NumberFieldClient, 'type'>

export type NumberFieldProps = {
  readonly descriptionProps?: FieldDescriptionProps<NumberFieldClientWithoutType>
  readonly errorProps?: ErrorProps<NumberFieldClientWithoutType>
  readonly field: NumberFieldClientWithoutType
  readonly labelProps?: LabelProps<NumberFieldClientWithoutType>
  readonly onChange?: (e: number) => void
  readonly validate?: NumberFieldValidation
} & Omit<FormFieldBase, 'validate'>

export type NumberFieldLabelComponent = LabelComponent<NumberFieldClientWithoutType>

export type NumberFieldDescriptionComponent = DescriptionComponent<NumberFieldClientWithoutType>

export type NumberFieldErrorComponent = ErrorComponent<NumberFieldClientWithoutType>
