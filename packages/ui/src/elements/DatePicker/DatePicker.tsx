'use client'
import type { DatePickerProps } from 'react-datepicker'

import React from 'react'
import ReactDatePickerDefaultImport, { registerLocale, setDefaultLocale } from 'react-datepicker'
const ReactDatePicker =
  'default' in ReactDatePickerDefaultImport
    ? ReactDatePickerDefaultImport.default
    : ReactDatePickerDefaultImport

import type { Props } from './types.js'

import { CalendarIcon } from '../../icons/Calendar/index.js'
import { ChevronIcon } from '../../icons/Chevron/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { getFormattedLocale } from './getFormattedLocale.js'
import './index.css'

const baseClass = 'date-time-picker'

type AccessibleCalendarContainerProps = React.PropsWithChildren<{
  className?: string
  dialogLabel: string
  monthLabel: string
  yearLabel: string
}>

const AccessibleCalendarContainer: React.FC<AccessibleCalendarContainerProps> = ({
  children,
  className,
  dialogLabel,
  monthLabel,
  yearLabel,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useLayoutEffect(() => {
    containerRef.current
      ?.querySelector<HTMLSelectElement>('.react-datepicker__month-select')
      ?.setAttribute('aria-label', monthLabel)
    containerRef.current
      ?.querySelector<HTMLSelectElement>('.react-datepicker__year-select')
      ?.setAttribute('aria-label', yearLabel)
  })

  return (
    <div aria-label={dialogLabel} className={className} ref={containerRef} role="dialog">
      {children}
    </div>
  )
}

const getDateTimeFieldLabel = ({ field, locale }: { field: 'month' | 'year'; locale: string }) => {
  try {
    return new Intl.DisplayNames(locale, { type: 'dateTimeField' }).of(field) || field
  } catch (_error) {
    return field
  }
}

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
  const { i18n, t } = useTranslation()
  const monthLabel = getDateTimeFieldLabel({ field: 'month', locale: i18n.language })
  const yearLabel = getDateTimeFieldLabel({ field: 'year', locale: i18n.language })
  const calendarContainer = React.useCallback(
    ({ children, className }) => (
      <AccessibleCalendarContainer
        className={className}
        dialogLabel={`${t('general:selectValue')}: ${monthLabel}, ${yearLabel}`}
        monthLabel={monthLabel}
        yearLabel={yearLabel}
      >
        {children}
      </AccessibleCalendarContainer>
    ),
    [monthLabel, t, yearLabel],
  )

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

    if (newDate instanceof Date && !dateFormat.includes('SSS')) {
      // Unless the dateFormat includes milliseconds, set milliseconds to 0
      // This is to ensure that the timestamp is consistent with the displayFormat
      newDate.setMilliseconds(0)
    }

    if (typeof onChangeFromProps === 'function') {
      onChangeFromProps(newDate)
    }
  }

  const dateTimePickerProps: Extract<
    DatePickerProps,
    { selectsMultiple?: never; selectsRange?: never }
  > = {
    calendarContainer,
    customInputRef: 'ref',
    dateFormat,
    disabled: readOnly,
    maxDate,
    maxTime,
    minDate,
    minTime,
    monthsShown: Math.min(2, monthsToShow),
    nextMonthButtonLabel: <ChevronIcon direction="right" />,
    nextYearButtonLabel: '›',
    onChange,
    placeholderText,
    popperPlacement: 'bottom-start',
    portalId: 'date-time-picker-portal',
    previousMonthButtonLabel: <ChevronIcon direction="left" />,
    previousYearButtonLabel: '‹',
    selected: value && new Date(value),
    shouldCloseOnSelect: false,
    showMonthYearPicker: pickerAppearance === 'monthOnly',
    showPopperArrow: false,
    showTimeSelect: pickerAppearance === 'dayAndTime' || pickerAppearance === 'timeOnly',
    showTimeSelectOnly: pickerAppearance === 'timeOnly',
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
      } catch (_error) {
        // eslint-disable-next-line no-console
        console.warn(`Could not find DatePicker locale for ${i18n.language}`)
      }
    }
  }, [i18n.language, i18n.dateFNS])

  return (
    <div className={classes} id={id}>
      <div className={`${baseClass}__input-wrapper`}>
        <ReactDatePicker
          {...dateTimePickerProps}
          dropdownMode="select"
          showMonthDropdown={pickerAppearance !== 'monthOnly'}
          showYearDropdown={pickerAppearance !== 'monthOnly'}
        />
        <CalendarIcon />
      </div>
    </div>
  )
}

// eslint-disable-next-line no-restricted-exports
export default DatePicker
