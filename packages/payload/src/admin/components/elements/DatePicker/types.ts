import type { ReactDatePickerProps } from 'react-datepicker'

type SharedProps = {
  displayFormat?: string
  overrides?: ReactDatePickerProps
  pickerAppearance?: 'dayAndTime' | 'dayOnly' | 'default' | 'monthOnly' | 'timeOnly'
}

type TimePickerProps = {
  maxTime?: Date
  minTime?: Date
  timeFormat?: string
  timeIntervals?: number
}

type DayPickerProps = {
  maxDate?: Date
  minDate?: Date
  monthsToShow?: 1 | 2
}

type MonthPickerProps = {
  maxDate?: Date
  minDate?: Date
}

export type ConditionalDateProps =
  | (SharedProps &
      DayPickerProps &
      TimePickerProps & {
        pickerAppearance?: 'dayAndTime'
      })
  | (SharedProps &
      DayPickerProps & {
        pickerAppearance: 'dayOnly'
      })
  | (SharedProps &
      MonthPickerProps & {
        pickerAppearance: 'monthOnly'
      })
  | (SharedProps &
      TimePickerProps & {
        pickerAppearance: 'timeOnly'
      })
  | (SharedProps & {
      pickerAppearance?: 'default'
    })

export type Props = SharedProps &
  DayPickerProps &
  TimePickerProps & {
    onChange?: (val: Date) => void
    placeholder?: string
    readOnly?: boolean
    value?: Date
  }
