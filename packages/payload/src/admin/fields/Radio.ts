import type { Option } from '../../fields/config/types.js'
import type { RadioFieldValidation } from '../../fields/validations.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type RadioFieldProps = {
  layout?: 'horizontal' | 'vertical'
  name?: string
  onChange?: OnChange
  options?: Option[]
  path?: string
  validate?: RadioFieldValidation
  value?: string
  width?: string
} & Omit<FormFieldBase, 'validate'>

export type OnChange<T = string> = (value: T) => void

export type RadioFieldLabelComponent = LabelComponent<'radio'>

export type RadioFieldDescriptionComponent = DescriptionComponent<'radio'>

export type RadioFieldErrorComponent = ErrorComponent<'radio'>
