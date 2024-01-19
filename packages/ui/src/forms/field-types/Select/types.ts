import type { SelectField } from 'payload/types'
import { FormFieldBase } from '../shared'

export type Props = FormFieldBase &
  Omit<SelectField, 'type'> & {
    path?: string
    value?: string
  }
