import type { FieldBase } from 'payload/types.js'

import type { FormFieldBase } from '../shared.js'

export type PointFieldProps = FormFieldBase & {
  label?: FieldBase['label']
  name?: string
  path?: string
  placeholder?: string
  step?: number
  width?: string
}
