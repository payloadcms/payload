import type { DateField } from '../../fields/config/types.js'
import type { FormFieldBase } from '../types.js'

export type DateFieldProps = {
  date?: DateField['admin']['date']
  name?: string
  path?: string
  placeholder?: DateField['admin']['placeholder'] | string
  width?: string
} & FormFieldBase
