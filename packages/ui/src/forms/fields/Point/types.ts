import type { FormFieldBase } from '../shared.js'

export type PointFieldProps = FormFieldBase & {
  name?: string
  path?: string
  step?: number
}
