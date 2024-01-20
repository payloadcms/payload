import type { NumberField } from 'payload/types'
import { FormFieldBase } from '../shared'

export type Props = FormFieldBase &
  Omit<NumberField, 'type'> & {
    path?: string
    value?: number
  }
