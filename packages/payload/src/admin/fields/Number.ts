import type { NumberField } from '../../fields/config/types.js'
import type { FormFieldBase } from '../types.js'

export type NumberFieldProps = {
  hasMany?: boolean
  max?: number
  maxRows?: number
  min?: number
  name?: string
  onChange?: (e: number) => void
  path?: string
  placeholder?: NumberField['admin']['placeholder']
  step?: number
  width?: string
} & FormFieldBase
