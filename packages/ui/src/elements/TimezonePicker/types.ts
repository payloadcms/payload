import type { SelectFieldClient } from 'payload'

export type Props = {
  id: string
  onChange?: (val: string) => void
  required?: boolean
  selectedTimezone?: string
} & Pick<SelectFieldClient, 'options'>
