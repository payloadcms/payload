import type { FormFieldBase } from '../shared.js'

export type EmailFieldProps = FormFieldBase & {
  autoComplete?: string
  name?: string
  path?: string
}
