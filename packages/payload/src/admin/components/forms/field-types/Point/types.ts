import type { NumberField } from '../../../../../fields/config/types.js'

export type Props = Omit<NumberField, 'type'> & {
  path?: string
}
