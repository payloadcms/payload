'use client'
import type { DatePickerProps } from 'react-datepicker'

import React from 'react'
import ReactDatePickerDefaultImport, { registerLocale, setDefaultLocale } from 'react-datepicker'
const ReactDatePicker = (ReactDatePickerDefaultImport.default ||
  ReactDatePickerDefaultImport) as unknown as typeof ReactDatePickerDefaultImport.default

import type { Props } from './types.js'

import { CalendarIcon } from '../../icons/Calendar/index.js'
import { XIcon } from '../../icons/X/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './library.scss'
import './index.scss'
import { getFormattedLocale } from './getFormattedLocale.js'

const baseClass = 'date-time-picker'

const DatePicker: React.FC<Props> = (props) => {
  const {
    id,
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

  const onChange: Extract<
    DatePickerProps,
    { selectsMultiple?: never; selectsRange?: never }
  >['onChange'] = (incomingDate) => {
    const newDate = incomingDate
    if (newDate instanceof Date && ['dayOnly', 'default', 'monthOnly'].includes(pickerAppearance)) {
      const tzOffset = incomingDate.getTimezoneOffset() / 60
      newDate.setHours(12 - tzOffset, 0)
    }
    if (typeof onChangeFromProps === 'function') {
      onChangeFromProps(newDate)
    }
  }

  const dateTimePickerProps: Extract<
    DatePickerProps,
    { selectsMultiple?: never; selectsRange?: never }
  > = {
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
    ...(overrides as Extract<
      DatePickerProps,
      { selectsMultiple?: never; selectsRange?: never } // to satisfy TypeScript. Overrides can enable selectsMultiple or selectsRange but then it's up to the user to ensure they pass in the correct onChange
    >),
  }

  const classes = [baseClass, `${baseClass}__appearance--${pickerAppearance}`]
    .filter(Boolean)
    .join(' ')

  React.useEffect(() => {
    if (i18n.dateFNS) {
      try {
        const datepickerLocale = getFormattedLocale(i18n.language)
        registerLocale(datepickerLocale, i18n.dateFNS)
        setDefaultLocale(datepickerLocale)
      } catch (e) {
        console.warn(`Could not find DatePicker locale for ${i18n.language}`)
      }
    }
  }, [i18n.language, i18n.dateFNS])

  return (
    <div className={classes} id={id}>
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
          showMonthDropdown
          showYearDropdown
        />
      </div>
    </div>
  )
}

// eslint-disable-next-line no-restricted-exports
export default DatePicker
