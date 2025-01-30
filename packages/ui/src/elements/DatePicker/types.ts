import type { DayPickerProps, SharedProps, TimePickerProps } from 'payload'

export type Props = {
  onChange?: (val: Date) => void
  onChangeTimezone?: (val: string) => void
  placeholder?: string
  readOnly?: boolean
  timezone?: true
  timezoneValue?: string
  value?: Date | string
} & DayPickerProps &
  SharedProps &
  TimePickerProps
