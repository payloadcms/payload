import type { FieldBase, Option } from 'payload/types.js'

import type { FormFieldBase } from '../shared.js'

export type RadioFieldProps = FormFieldBase & {
  label?: FieldBase['label']
  layout?: 'horizontal' | 'vertical'
  name?: string
  onChange?: OnChange
  options?: Option[]
  path?: string
  value?: string
  width?: string
}

export type OnChange<T = string> = (value: T) => void
