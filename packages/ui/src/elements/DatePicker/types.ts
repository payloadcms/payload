import { SharedProps, DayPickerProps, TimePickerProps } from 'payload/types'

export type Props = SharedProps &
  DayPickerProps &
  TimePickerProps & {
    onChange?: (val: Date) => void
    placeholder?: string
    readOnly?: boolean
    value?: Date
  }
