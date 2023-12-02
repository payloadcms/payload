import type { EmailField } from 'payload/types'

export type Props = Omit<EmailField, 'type'> & {
  path?: string
}
