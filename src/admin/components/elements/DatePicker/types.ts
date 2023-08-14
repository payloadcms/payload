type SharedProps = {
  displayFormat?: string
  pickerAppearance?: 'default' | 'dayAndTime' | 'timeOnly' | 'dayOnly' | 'monthOnly'
}

type TimePickerProps = {
  minTime?: Date
  maxTime?: Date
  timeIntervals?: number
  timeFormat?: string
}

type DayPickerProps = {
  monthsToShow?: 1 | 2
  minDate?: Date
  maxDate?: Date
}

type MonthPickerProps = {
  minDate?: Date
  maxDate?: Date
}

export type ConditionalDateProps =
  | SharedProps & {
    pickerAppearance?: 'default'
  }
  | SharedProps & DayPickerProps & TimePickerProps & {
    pickerAppearance?: 'dayAndTime'
  }
  | SharedProps & TimePickerProps & {
    pickerAppearance: 'timeOnly'
  }
  | SharedProps & DayPickerProps & {
    pickerAppearance: 'dayOnly'
  }
  | SharedProps & MonthPickerProps & {
    pickerAppearance: 'monthOnly'
  }

export type Props = SharedProps & DayPickerProps & TimePickerProps & {
  value?: Date
  onChange?: (val: Date) => void
  readOnly?: boolean
  placeholder?: string
}
