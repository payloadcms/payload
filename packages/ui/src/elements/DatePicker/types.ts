import type { DayPickerProps, SharedProps, TimePickerProps } from 'payload/bundle'

export type Props = SharedProps &
  DayPickerProps &
  TimePickerProps & {
    onChange?: (val: Date) => void
    placeholder?: string
    readOnly?: boolean
    value?: Date
  }
