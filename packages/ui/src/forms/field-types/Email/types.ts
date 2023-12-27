import type { EmailField } from 'payload/types'

export type Props = Omit<EmailField, 'type'> & {
  path?: string
}

export type InputProps = Omit<EmailField, 'type' | 'admin'> & {
  autoComplete?: EmailField['admin']['autoComplete']
  readOnly?: EmailField['admin']['readOnly']
  path?: string
}
