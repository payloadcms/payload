import type { DatePickerProps } from 'react-datepicker'

export type SharedProps = {
  displayFormat?: string
  overrides?: DatePickerProps
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
  | (DayPickerProps &
      SharedProps &
      TimePickerProps & {
        pickerAppearance?: 'dayAndTime'
      })
  | (DayPickerProps &
      SharedProps & {
        pickerAppearance: 'dayOnly'
      })
  | (MonthPickerProps &
      SharedProps & {
        pickerAppearance: 'monthOnly'
      })
  | (SharedProps &
      TimePickerProps & {
        pickerAppearance: 'timeOnly'
      })
  | (SharedProps & {
      pickerAppearance?: 'default'
    })
