import type { NumberField } from 'payload/types'

export type Props = Omit<NumberField, 'type'> & {
  path?: string
}
