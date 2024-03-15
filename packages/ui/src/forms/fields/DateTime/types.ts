import type { DateField, FieldBase } from 'payload/types.js'

import type { FormFieldBase } from '../shared.js'

export type DateFieldProps = FormFieldBase & {
  date?: DateField['admin']['date']
  label?: FieldBase['label']
  name?: string
  path?: string
  placeholder?: DateField['admin']['placeholder'] | string
  width?: string
}
