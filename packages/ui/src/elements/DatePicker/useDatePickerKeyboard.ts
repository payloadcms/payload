'use client'

import type ReactDatePicker from 'react-datepicker'
import type { DatePickerProps } from 'react-datepicker'

import React from 'react'

import type { Props } from './types.js'

type DatePickerComponent = typeof ReactDatePicker extends { default: infer Component }
  ? Component
  : typeof ReactDatePicker

export const useDatePickerKeyboard = ({ overrides }: Props) => {
  const datePickerRef = React.useRef<React.ComponentRef<DatePickerComponent>>(null)
  const calendarRef = React.useRef<HTMLDivElement>(null)
  const shouldFocusCalendar = React.useRef(false)
  const calendarFocusFrame = React.useRef<null | number>(null)
  const onEscape = React.useCallback((event: React.KeyboardEvent) => {
    event.stopPropagation()
    if (!event.defaultPrevented) {
      event.preventDefault()
      datePickerRef.current?.setOpen(false)
      datePickerRef.current?.sendFocusBackToInput()
    }
  }, [])
  const onOverrideKeyDownRef = React.useRef(overrides?.onKeyDown)

  React.useLayoutEffect(() => {
    onOverrideKeyDownRef.current = overrides?.onKeyDown
  }, [overrides?.onKeyDown])

  const onCalendarKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        if (!event.defaultPrevented) {
          onOverrideKeyDownRef.current?.(event)
        }
        onEscape(event)
      }
    },
    [onEscape],
  )

  React.useEffect(
    () => () => {
      if (calendarFocusFrame.current !== null) {
        cancelAnimationFrame(calendarFocusFrame.current)
      }
    },
    [],
  )

  const onCalendarClose = () => {
    shouldFocusCalendar.current = false
    if (calendarFocusFrame.current !== null) {
      cancelAnimationFrame(calendarFocusFrame.current)
      calendarFocusFrame.current = null
    }
    overrides?.onCalendarClose?.()
  }
  const onCalendarOpen = () => {
    if (shouldFocusCalendar.current) {
      calendarFocusFrame.current = requestAnimationFrame(() => {
        calendarFocusFrame.current = null
        shouldFocusCalendar.current = false
        if (!datePickerRef.current?.isCalendarOpen()) {
          return
        }
        const calendar = calendarRef.current
        const focusTarget =
          calendar?.querySelector<HTMLElement>('[tabindex="0"]') ||
          calendar?.querySelector<HTMLElement>('button:not(:disabled), select:not(:disabled)')

        focusTarget?.focus()
      })
    }
    overrides?.onCalendarOpen?.()
  }
  const onKeyDown: NonNullable<DatePickerProps['onKeyDown']> = (event) => {
    overrides?.onKeyDown?.(event)

    if (event.key === 'Escape' && datePickerRef.current?.isCalendarOpen()) {
      onEscape(event)
    }

    if (
      !event.defaultPrevented &&
      event.target === datePickerRef.current?.input &&
      !datePickerRef.current.isCalendarOpen() &&
      ['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)
    ) {
      event.preventDefault()
      shouldFocusCalendar.current = true
      datePickerRef.current?.setOpen(true)
    }
  }

  const onKeyDownCapture: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    // Month/year cells prevent every non-Tab key before invoking onKeyDown.
    // Intercept only the cell itself so nested controls can consume Escape.
    const isMonthOrYearCell =
      event.target instanceof HTMLElement &&
      event.target.matches('.react-datepicker__month-text, .react-datepicker__year-text')

    if (
      event.key === 'Escape' &&
      (event.target === datePickerRef.current?.input || isMonthOrYearCell) &&
      datePickerRef.current?.isCalendarOpen()
    ) {
      overrides?.onKeyDown?.(event)
      onEscape(event)
    }
  }

  return {
    calendarRef,
    datePickerRef,
    onCalendarClose,
    onCalendarKeyDown,
    onCalendarOpen,
    onKeyDown,
    onKeyDownCapture,
  }
}
