import type { JSONField } from '../../../../../fields/config/types'

export type Props = Omit<JSONField, 'type'> & {
  path?: string
}
