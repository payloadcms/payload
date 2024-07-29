import * as Locales from 'date-fns/locale'
import React from 'react'
import DatePicker, { registerLocale } from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import { getSupportedDateLocale } from '../../../utilities/formatDate/getSupportedDateLocale'
import CalendarIcon from '../../icons/Calendar'
import XIcon from '../../icons/X'
import './index.scss'

const baseClass = 'date-time-picker'

const DateTime: React.FC<Props> = (props) => {
  const {
    displayFormat: customDisplayFormat,
    maxDate,
    maxTime,
    minDate,
    minTime,
    monthsToShow = 1,
    onChange: onChangeFromProps,
    overrides,
    pickerAppearance = 'default',
    placeholder: placeholderText,
    readOnly,
    timeFormat = 'h:mm aa',
    timeIntervals = 30,
    value,
  } = props

  // Use the user's AdminUI language preference for the locale
  const { i18n } = useTranslation()
  const locale = getSupportedDateLocale(i18n.language)

  try {
    registerLocale(locale, Locales[locale])
  } catch (e) {
    console.warn(`Could not find DatePicker locale for ${locale}`)
  }

  let dateFormat = customDisplayFormat

  if (!customDisplayFormat) {
    // when no displayFormat is provided, determine format based on the picker appearance
    if (pickerAppearance === 'default') dateFormat = 'MM/dd/yyyy'
    else if (pickerAppearance === 'dayAndTime') dateFormat = 'MMM d, yyy h:mm a'
    else if (pickerAppearance === 'timeOnly') dateFormat = 'h:mm a'
    else if (pickerAppearance === 'dayOnly') dateFormat = 'MMM dd'
    else if (pickerAppearance === 'monthOnly') dateFormat = 'MMMM'
  }

  const onChange = (incomingDate: Date) => {
    const newDate = incomingDate
    if (newDate instanceof Date) {
      newDate.setMilliseconds(0)
      if (['dayOnly', 'default', 'monthOnly'].includes(pickerAppearance)) {
        const tzOffset = incomingDate.getTimezoneOffset() / 60
        newDate.setHours(12 - tzOffset, 0)
      }
    }
    if (typeof onChangeFromProps === 'function') onChangeFromProps(newDate)
  }

  const dateTimePickerProps = {
    customInputRef: 'ref',
    dateFormat,
    disabled: readOnly,
    maxDate,
    maxTime,
    minDate,
    minTime,
    monthsShown: Math.min(2, monthsToShow),
    onChange,
    placeholderText,
    selected: value && new Date(value),
    showMonthYearPicker: pickerAppearance === 'monthOnly',
    showPopperArrow: false,
    showTimeSelect: pickerAppearance === 'dayAndTime' || pickerAppearance === 'timeOnly',
    timeFormat,
    timeIntervals,
    ...overrides,
  }

  const classes = [baseClass, `${baseClass}__appearance--${pickerAppearance}`]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      <div className={`${baseClass}__icon-wrap`}>
        {dateTimePickerProps.selected && (
          <button
            className={`${baseClass}__clear-button`}
            onClick={() => onChange(null)}
            type="button"
          >
            <XIcon />
          </button>
        )}
        <CalendarIcon />
      </div>
      <div className={`${baseClass}__input-wrapper`}>
        <DatePicker
          {...dateTimePickerProps}
          dropdownMode="select"
          locale={locale}
          popperModifiers={[
            {
              name: 'preventOverflow',
              enabled: true,
            },
          ]}
          showMonthDropdown
          showYearDropdown
        />
      </div>
    </div>
  )
}

export default DateTime
