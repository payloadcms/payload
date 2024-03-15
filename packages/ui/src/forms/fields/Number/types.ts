import type { FieldBase, NumberField } from 'payload/types.js'

import type { FormFieldBase } from '../shared.js'

export type NumberFieldProps = FormFieldBase & {
  hasMany?: boolean
  label?: FieldBase['label']
  max?: number
  maxRows?: number
  min?: number
  name?: string
  onChange?: (e: number) => void
  path?: string
  placeholder?: NumberField['admin']['placeholder']
  step?: number
  width?: string
}
