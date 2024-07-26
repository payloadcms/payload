import type { FormFieldBase } from '../types.js'

export type PointFieldProps = {
  name?: string
  path?: string
  placeholder?: string
  step?: number
  type?: 'point'
  width?: string
} & FormFieldBase
