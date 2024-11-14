'use client'
import type { ReactDatePickerProps } from 'react-datepicker'

import React from 'react'
import ReactDatePickerDefaultImport, { registerLocale } from 'react-datepicker'
const ReactDatePicker = (ReactDatePickerDefaultImport.default ||
  ReactDatePickerDefaultImport) as unknown as typeof ReactDatePickerDefaultImport.default

import type { Props } from './types.js'

import { CalendarIcon } from '../../icons/Calendar/index.js'
import { XIcon } from '../../icons/X/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { getFormattedLocale } from './getFormattedLocale.js'
import './library.scss'
import './index.scss'

const baseClass = 'date-time-picker'

const DatePicker: React.FC<Props> = (props) => {
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

  const datepickerLocale = getFormattedLocale(i18n.language)

  try {
    registerLocale(datepickerLocale, i18n.dateFNS)
  } catch (e) {
    console.warn(`Could not find DatePicker locale for ${i18n.language}`)
  }

  let dateFormat = customDisplayFormat

  if (!customDisplayFormat) {
    // when no displayFormat is provided, determine format based on the picker appearance
    if (pickerAppearance === 'default') {
      dateFormat = 'MM/dd/yyyy'
    } else if (pickerAppearance === 'dayAndTime') {
      dateFormat = 'MMM d, yyy h:mm a'
    } else if (pickerAppearance === 'timeOnly') {
      dateFormat = 'h:mm a'
    } else if (pickerAppearance === 'dayOnly') {
      dateFormat = 'MMM dd'
    } else if (pickerAppearance === 'monthOnly') {
      dateFormat = 'MMMM'
    }
  }

  const onChange = (incomingDate: Date) => {
    const newDate = incomingDate
    if (newDate instanceof Date && ['dayOnly', 'default', 'monthOnly'].includes(pickerAppearance)) {
      const tzOffset = incomingDate.getTimezoneOffset() / 60
      newDate.setHours(12 - tzOffset, 0)
    }
    if (typeof onChangeFromProps === 'function') {
      onChangeFromProps(newDate)
    }
  }

  const dateTimePickerProps: ReactDatePickerProps = {
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
    popperPlacement: 'bottom-start',
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
        <ReactDatePicker
          {...dateTimePickerProps}
          dropdownMode="select"
          locale={datepickerLocale}
          showMonthDropdown
          showYearDropdown
        />
      </div>
    </div>
  )
}

// eslint-disable-next-line no-restricted-exports
export default DatePicker
