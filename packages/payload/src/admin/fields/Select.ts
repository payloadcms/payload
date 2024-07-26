import type { Option } from '../../fields/config/types.js'
import type { FormFieldBase } from '../types.js'

export type SelectFieldProps = {
  hasMany?: boolean
  isClearable?: boolean
  isSortable?: boolean
  name?: string
  onChange?: (e: string | string[]) => void
  options?: Option[]
  path?: string
  type?: 'select'
  value?: string
  width?: string
} & FormFieldBase
