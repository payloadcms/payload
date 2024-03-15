import type { Option } from 'payload/types.js'

import type { FormFieldBase } from '../shared.js'

export type RadioFieldProps = FormFieldBase & {
  layout?: 'horizontal' | 'vertical'
  name?: string
  onChange?: OnChange
  options?: Option[]
  path?: string
  value?: string
}

export type OnChange<T = string> = (value: T) => void
