import type { FieldBase, TextareaField } from 'payload/types.js'

import type { FormFieldBase } from '../shared.js'

export type TextareaFieldProps = FormFieldBase & {
  label?: FieldBase['label']
  maxLength?: number
  minLength?: number
  name?: string
  path?: string
  placeholder?: TextareaField['admin']['placeholder']
  rows?: number
  width?: string
}
