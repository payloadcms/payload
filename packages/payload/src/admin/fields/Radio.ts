import type { Option } from '../../fields/config/types.js'
import type { FormFieldBase } from '../types.js'

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
