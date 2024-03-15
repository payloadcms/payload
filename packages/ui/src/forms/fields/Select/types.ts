import type { FieldBase, Option } from 'payload/types.js'

import type { FormFieldBase } from '../shared.js'

export type SelectFieldProps = FormFieldBase & {
  hasMany?: boolean
  isClearable?: boolean
  isSortable?: boolean
  label?: FieldBase['label']
  name?: string
  onChange?: (e: string) => void
  options?: Option[]
  path?: string
  value?: string
  width?: string
}
