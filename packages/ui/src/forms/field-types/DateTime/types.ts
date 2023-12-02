import type { DateField } from 'payload/types'

export type Props = Omit<DateField, 'type'> & {
  path: string
}
