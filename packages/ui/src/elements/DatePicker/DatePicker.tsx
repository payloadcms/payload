'use client'
import type { DatePickerProps } from 'react-datepicker'

import React from 'react'
import ReactDatePickerDefaultImport, { registerLocale, setDefaultLocale } from 'react-datepicker'
import { createPortal, flushSync } from 'react-dom'
const ReactDatePicker =
  'default' in ReactDatePickerDefaultImport
    ? ReactDatePickerDefaultImport.default
    : ReactDatePickerDefaultImport

import type { Props } from './types.js'

import { CalendarIcon } from '../../icons/Calendar/index.js'
import { ChevronIcon } from '../../icons/Chevron/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { getFormattedLocale } from './getFormattedLocale.js'
import { hasAmbiguousYearInput } from './hasAmbiguousYearInput.js'
import { useDatePickerKeyboard } from './useDatePickerKeyboard.js'
import './index.css'

const baseClass = 'date-time-picker'

type AccessibleCalendarContainerProps = React.PropsWithChildren<{
  className?: string
  containerRef: React.RefObject<HTMLDivElement | null>
  dialogLabel: string
  monthLabel: string
  onKeyDown: React.KeyboardEventHandler<HTMLDivElement>
  yearLabel: string
}>

const AccessibleCalendarContainer: React.FC<AccessibleCalendarContainerProps> = ({
  children,
  className,
  containerRef,
  dialogLabel,
  monthLabel,
  onKeyDown,
  yearLabel,
}) => {
  React.useLayoutEffect(() => {
    containerRef.current
      ?.querySelector<HTMLSelectElement>('.react-datepicker__month-select')
      ?.setAttribute('aria-label', monthLabel)
    containerRef.current
      ?.querySelector<HTMLSelectElement>('.react-datepicker__year-select')
      ?.setAttribute('aria-label', yearLabel)
  })

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Handle Escape bubbling from the dialog's interactive children.
    <div
      aria-label={dialogLabel}
      className={className}
      onKeyDown={onKeyDown}
      ref={containerRef}
      role="dialog"
    >
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

  const {
    calendarRef,
    datePickerRef,
    onBlur,
    onCalendarClose,
    onCalendarKeyDown,
    onCalendarOpen,
    onChangeRaw,
    onKeyDown,
    onKeyDownCapture,
  } = useDatePickerKeyboard(props)
  const rejectedInputValueRef = React.useRef<string | undefined>(undefined)
  const [modalContainer, setModalContainer] = React.useState<Element | null>(null)
  const setContainerRef = React.useCallback((element: HTMLDivElement | null) => {
    setModalContainer(element?.closest('dialog, [role="dialog"]') ?? null)
  }, [])
  const popperContainer = React.useCallback<React.FC<React.PropsWithChildren>>(
    ({ children }) => (modalContainer ? createPortal(children, modalContainer) : children),
    [modalContainer],
  )

  // Use the user's AdminUI language preference for the locale
  const { i18n, t } = useTranslation()
  const monthLabel = getDateTimeFieldLabel({ field: 'month', locale: i18n.language })
  const yearLabel = getDateTimeFieldLabel({ field: 'year', locale: i18n.language })
  const CustomCalendarContainer = overrides?.calendarContainer
  const calendarContainer = React.useCallback(
    ({ children, className, ...containerProps }) =>
      CustomCalendarContainer ? (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- Handle Escape bubbling from the custom calendar's interactive children.
        <div onKeyDown={onCalendarKeyDown} ref={calendarRef} style={{ display: 'contents' }}>
          <CustomCalendarContainer {...containerProps} className={className}>
            {children}
          </CustomCalendarContainer>
        </div>
      ) : (
        <AccessibleCalendarContainer
          className={className}
          containerRef={calendarRef}
          dialogLabel={`${t('general:selectValue')}: ${monthLabel}, ${yearLabel}`}
          monthLabel={monthLabel}
          onKeyDown={onCalendarKeyDown}
          yearLabel={yearLabel}
        >
          {children}
        </AccessibleCalendarContainer>
      ),
    [CustomCalendarContainer, calendarRef, monthLabel, onCalendarKeyDown, t, yearLabel],
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
    { selectsMultiple?: false; selectsRange?: false }
  >['onChange'] = (incomingDate, event) => {
    const newDate = incomingDate

    const inputValue =
      event?.target instanceof HTMLInputElement
        ? event.target.value
        : !event
          ? rejectedInputValueRef.current
          : undefined

    if (
      hasAmbiguousYearInput({
        date: newDate,
        dateFormat: overrides?.dateFormat ?? dateFormat,
        inputValue,
        locale: overrides?.locale,
      })
    ) {
      const picker = datePickerRef.current

      rejectedInputValueRef.current = inputValue
      picker?.setPreSelection(picker.calcInitialState().preSelection)
      return
    }
    rejectedInputValueRef.current = undefined

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
    { selectsMultiple?: false; selectsRange?: false }
  > = {
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
    popperContainer: modalContainer ? popperContainer : undefined,
    popperPlacement: 'bottom-start',
    portalId: modalContainer ? undefined : 'date-time-picker-portal',
    preventOpenOnFocus: true,
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
      { selectsMultiple?: false; selectsRange?: false } // to satisfy TypeScript. Overrides can enable selectsMultiple or selectsRange but then it's up to the user to ensure they pass in the correct onChange
    >),
    calendarContainer,
    onBlur,
    onCalendarClose,
    onCalendarOpen,
    onChangeRaw,
    onKeyDown,
  }

  const onBlurCapture = (event: React.FocusEvent<HTMLDivElement>) => {
    const input = event.target

    if (input !== datePickerRef.current?.input || !(input instanceof HTMLInputElement)) {
      return
    }

    if (/[a-z0-9]/i.test(input.value) || !/[\p{L}\p{N}]/u.test(input.value)) {
      return
    }

    // react-datepicker 9.1 treats non-Latin input as an empty mask.
    // Reset raw text synchronously before its blur handler can clear the selected date.
    // eslint-disable-next-line @eslint-react/dom/no-flush-sync -- Programmatic blur also requires the reset before the upstream handler runs.
    flushSync(() => datePickerRef.current?.resetInputValue())
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
    <div
      className={classes}
      id={id}
      onBlurCapture={onBlurCapture}
      onKeyDownCapture={onKeyDownCapture}
      ref={setContainerRef}
    >
      <div className={`${baseClass}__input-wrapper`}>
        <ReactDatePicker
          ref={datePickerRef}
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
