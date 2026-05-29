import type { SelectFieldClient } from 'payload'

export type Props = Pick<SelectFieldClient, 'options'> & {
  id: string
  onChange?: (val: string) => void
  readOnly?: boolean
  required?: boolean
  selectedTimezone?: string
}
