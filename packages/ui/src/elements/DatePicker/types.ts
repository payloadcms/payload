import type { DayPickerProps, SharedProps, TimePickerProps } from 'payload'

export type Props = DayPickerProps &
  SharedProps &
  TimePickerProps & {
    id?: string
    onChange?: (val: Date) => void
    placeholder?: string
    readOnly?: boolean
    value?: Date | string
  }
