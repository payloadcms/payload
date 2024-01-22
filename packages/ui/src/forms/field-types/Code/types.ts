import type { CodeField } from 'payload/types'
import { FormFieldBase } from '../shared'

export type Props = FormFieldBase &
  Omit<CodeField, 'type'> & {
    path?: string
    value?: string
  }
