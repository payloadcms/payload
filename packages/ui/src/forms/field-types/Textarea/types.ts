import type { TextareaField } from 'payload/types'
import { FormFieldBase } from '../shared'

export type Props = FormFieldBase &
  Omit<TextareaField, 'type'> & {
    path?: string
    value: string
  }
