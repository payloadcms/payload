import type { JSONField } from 'payload/types'

export type Props = Omit<JSONField, 'type'> & {
  path?: string
}
