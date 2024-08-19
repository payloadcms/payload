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

type RadioFieldClientWithoutType = MarkOptional<RadioFieldClient, 'type'>

export type RadioFieldProps = {
  readonly descriptionProps?: FieldDescriptionProps<RadioFieldClientWithoutType>
  readonly errorProps?: ErrorProps<RadioFieldClientWithoutType>
  readonly field: RadioFieldClientWithoutType
  readonly labelProps?: LabelProps<RadioFieldClientWithoutType>
  readonly onChange?: OnChange
  readonly validate?: RadioFieldValidation
  readonly value?: string
} & Omit<FormFieldBase, 'validate'>

export type OnChange<T = string> = (value: T) => void

export type RadioFieldLabelComponent = LabelComponent<RadioFieldClientWithoutType>

export type RadioFieldDescriptionComponent = DescriptionComponent<RadioFieldClientWithoutType>

export type RadioFieldErrorComponent = ErrorComponent<RadioFieldProps>
