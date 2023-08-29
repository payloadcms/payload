import type { CodeField } from '../../../../../fields/config/types.js'

export type Props = Omit<CodeField, 'type'> & {
  path?: string
}
