import type { ReactDatePickerProps } from 'react-datepicker'

export type SharedProps = {
  displayFormat?: string
  overrides?: ReactDatePickerProps
  pickerAppearance?: 'dayAndTime' | 'dayOnly' | 'default' | 'monthOnly' | 'timeOnly'
}

export type TimePickerProps = {
  maxTime?: Date
  minTime?: Date
  timeFormat?: string
  timeIntervals?: number
}

export type DayPickerProps = {
  maxDate?: Date
  minDate?: Date
  monthsToShow?: 1 | 2
}

export type MonthPickerProps = {
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
