import type { RadioFieldClient } from '../../fields/config/types.js'
import type { RadioFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type RadioFieldProps = {
  readonly field: RadioFieldClient
  readonly onChange?: OnChange
  readonly validate?: RadioFieldValidation
  readonly value?: string
} & Omit<FormFieldBase, 'validate'>

export type OnChange<T = string> = (value: T) => void

export type RadioFieldLabelComponent = LabelComponent<'radio'>

export type RadioFieldDescriptionComponent = DescriptionComponent<'radio'>

export type RadioFieldErrorComponent = ErrorComponent<'radio'>
