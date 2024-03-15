import type { EmailField, FieldBase } from 'payload/types.js'

import type { FormFieldBase } from '../shared.js'

export type EmailFieldProps = FormFieldBase & {
  autoComplete?: string
  label?: FieldBase['label']
  name?: string
  path?: string
  placeholder?: EmailField['admin']['placeholder']
  width?: string
}
