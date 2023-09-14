import type { CodeField } from '../../../../../fields/config/types'

export type Props = Omit<CodeField, 'type'> & {
  path?: string
}
