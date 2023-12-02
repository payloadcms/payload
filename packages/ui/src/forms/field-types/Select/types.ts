import type { SelectField } from 'payload/types'

export type Props = Omit<SelectField, 'type'> & {
  path?: string
}
