import type { EmailField } from 'payload/types'
import { FormFieldBase } from '../Text/types'

export type Props = FormFieldBase &
  Omit<EmailField, 'type'> & {
    path?: string
  }

export type InputProps = Omit<EmailField, 'type' | 'admin'> & {
  autoComplete?: EmailField['admin']['autoComplete']
  readOnly?: EmailField['admin']['readOnly']
  path?: string
}
