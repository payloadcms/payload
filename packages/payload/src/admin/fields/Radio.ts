import type { MarkOptional } from 'ts-essentials'

import type { RadioFieldClient } from '../../fields/config/types.js'
import type { RadioFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

type RadioFieldClientWithoutType = MarkOptional<RadioFieldClient, 'type'>

export type RadioFieldProps = {
  readonly onChange?: OnChange
  readonly validate?: RadioFieldValidation
  readonly value?: string
} & Omit<FormFieldBase<RadioFieldClientWithoutType>, 'validate'>

export type OnChange<T = string> = (value: T) => void

export type RadioFieldLabelComponent = LabelComponent<RadioFieldClientWithoutType>

export type RadioFieldDescriptionComponent = DescriptionComponent<RadioFieldClientWithoutType>

export type RadioFieldErrorComponent = ErrorComponent<RadioFieldProps>
