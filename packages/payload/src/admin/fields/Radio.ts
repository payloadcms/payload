import type { MarkOptional } from 'ts-essentials'

import type { RadioFieldClient } from '../../fields/config/types.js'
import type { RadioFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent, ErrorProps } from '../forms/Error.js'
import type {
  DescriptionComponent,
  FieldDescriptionProps,
  FormFieldBase,
  LabelComponent,
  LabelProps,
} from '../types.js'

export type RadioFieldProps = {
  readonly descriptionProps?: FieldDescriptionProps<RadioFieldProps>
  readonly errorProps?: ErrorProps<RadioFieldProps>
  readonly field: MarkOptional<RadioFieldClient, 'type'>
  readonly labelProps?: LabelProps<RadioFieldProps>
  readonly onChange?: OnChange
  readonly validate?: RadioFieldValidation
  readonly value?: string
} & Omit<FormFieldBase, 'validate'>

export type OnChange<T = string> = (value: T) => void

export type RadioFieldLabelComponent = LabelComponent<RadioFieldProps>

export type RadioFieldDescriptionComponent = DescriptionComponent<RadioFieldProps>

export type RadioFieldErrorComponent = ErrorComponent<RadioFieldProps>
