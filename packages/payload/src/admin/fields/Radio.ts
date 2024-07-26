import type { Option } from '../../fields/config/types.js'
import type { ErrorComponent } from '../forms/Error.js'
import type { DescriptionComponent, FormFieldBase, LabelComponent } from '../types.js'

export type RadioFieldProps = {
  layout?: 'horizontal' | 'vertical'
  name?: string
  onChange?: OnChange
  options?: Option[]
  path?: string
  value?: string
  width?: string
} & FormFieldBase

export type OnChange<T = string> = (value: T) => void

export type RadioFieldLabelComponent = LabelComponent<'radio'>

export type RadioFieldDescriptionComponent = DescriptionComponent<'radio'>

export type RadioFieldErrorComponent = ErrorComponent<'radio'>
