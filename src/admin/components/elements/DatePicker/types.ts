type SharedProps = {
  displayFormat?: string | undefined
  pickerAppearance?: 'dayAndTime' | 'timeOnly' | 'dayOnly'
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

export type ConditionalDateProps =
  | SharedProps & DayPickerProps & TimePickerProps & {
    pickerAppearance?: 'dayAndTime'
  }
  | SharedProps & TimePickerProps & {
    pickerAppearance: 'timeOnly'
  }
  | SharedProps & DayPickerProps & {
    pickerAppearance: 'dayOnly'
  }

export type Props = SharedProps & DayPickerProps & TimePickerProps & {
  value?: Date
  onChange?: (val: Date) => void
  readOnly?: boolean
  placeholder?: string
}
