import type { JSONField } from 'payload/types'
import { FormFieldBase } from '../shared'

export type Props = FormFieldBase &
  Omit<JSONField, 'type'> & {
    path?: string
    value?: string
  }
