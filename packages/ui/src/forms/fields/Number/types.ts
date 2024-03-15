import type { FormFieldBase } from '../shared.js'

export type NumberFieldProps = FormFieldBase & {
  hasMany?: boolean
  max?: number
  maxRows?: number
  min?: number
  name?: string
  onChange?: (e: number) => void
  path?: string
  step?: number
}
