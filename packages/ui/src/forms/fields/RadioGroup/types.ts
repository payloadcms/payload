import type { RadioField } from 'payload/types'
import { FormFieldBase } from '../shared'

export type Props = FormFieldBase & {
  name?: string
  path?: string
}

export type OnChange<T = string> = (value: T) => void
