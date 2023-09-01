import type { EmailField } from '../../../../../fields/config/types'

export type Props = Omit<EmailField, 'type'> & {
  path?: string
}
