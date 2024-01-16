import type { EmailField } from 'payload/types'
import type { FormFieldBase } from '../shared'

export type Props = FormFieldBase &
  Omit<EmailField, 'type'> & {
    path?: string
    value?: string
  }

export type InputProps = Omit<EmailField, 'type' | 'admin'> & {
  autoComplete?: EmailField['admin']['autoComplete']
  readOnly?: EmailField['admin']['readOnly']
  path?: string
}
