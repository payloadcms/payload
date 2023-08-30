import type { DateField } from '../../../../../fields/config/types.js'

export type Props = Omit<DateField, 'type'> & {
  path: string
}
