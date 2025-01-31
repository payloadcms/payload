import type { SelectFieldClient } from 'payload'

export type Props = {
  id: string
  onChange?: (val: string) => void
  selectedTimezone?: string
} & Pick<SelectFieldClient, 'options'>
