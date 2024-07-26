import type { TextareaField } from '../../fields/config/types.js'
import type { FormFieldBase } from '../types.js'

export type TextareaFieldProps = {
  maxLength?: number
  minLength?: number
  name?: string
  path?: string
  placeholder?: TextareaField['admin']['placeholder']
  rows?: number
  width?: string
} & FormFieldBase
