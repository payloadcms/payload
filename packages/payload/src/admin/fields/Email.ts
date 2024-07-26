import type { EmailField } from '../../fields/config/types.js'
import type { FormFieldBase } from '../types.js'

export type EmailFieldProps = {
  autoComplete?: string
  name?: string
  path?: string
  placeholder?: EmailField['admin']['placeholder']
  type?: 'email'
  width?: string
} & FormFieldBase
