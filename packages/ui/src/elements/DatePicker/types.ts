import type { DayPickerProps, SharedProps, TimePickerProps } from 'payload'

export type Props = SharedProps &
  DayPickerProps &
  TimePickerProps & {
    onChange?: (val: Date) => void
    placeholder?: string
    readOnly?: boolean
    value?: Date
  }
