import type { DateField } from 'payload/types.js'

import type { FormFieldBase } from '../shared.js'

export type DateFieldProps = FormFieldBase & {
  date?: DateField['admin']['date']
  name?: string
  path: string
}
