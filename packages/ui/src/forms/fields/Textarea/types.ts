import type { FormFieldBase } from '../shared.js'

export type TextareaFieldProps = FormFieldBase & {
  name?: string
  path?: string
  rows?: number
}
