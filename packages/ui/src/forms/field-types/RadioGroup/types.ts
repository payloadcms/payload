import type { RadioField } from 'payload/types'
import { FormFieldBase } from '../shared'

export type Props = FormFieldBase &
  Omit<RadioField, 'type'> & {
    path?: string
    value?: string
  }

export type OnChange<T = string> = (value: T) => void
