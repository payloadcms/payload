export type Props = {
  placeholder?: string,
  useDate?: boolean,
  minDate?: Date,
  maxDate?: Date,
  monthsShown?: number,
  inputDateTimeFormat?: string,
  useTime?: boolean,
  minTime?: Date,
  maxTime?: Date,
  timeIntervals?: number,
  timeFormat?: string,
  value?: Date | string,
  onChange?: () => void,
  admin?: {
    readOnly?: boolean,
  }
}
