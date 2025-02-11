import type { DayPickerProps, SharedProps, TimePickerProps } from 'payload'

export type Props = {
  onChange?: (val: Date) => void
  placeholder?: string
  readOnly?: boolean
  value?: Date | string
} & DayPickerProps &
  SharedProps &
  TimePickerProps
