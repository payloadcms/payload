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
  const hasTypedInput = React.useRef(false)
  const shouldFocusCalendar = React.useRef(false)
  const calendarFocusFrame = React.useRef<null | number>(null)
  const onEscape = React.useCallback((event: React.KeyboardEvent) => {
    event.stopPropagation()
    if (!event.defaultPrevented) {
      event.preventDefault()
      datePickerRef.current?.setOpen(false, true)
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

  const onBlur: NonNullable<DatePickerProps['onBlur']> = (event) => {
    hasTypedInput.current = false
    overrides?.onBlur?.(event)
  }
  const onChangeRaw: NonNullable<DatePickerProps['onChangeRaw']> = (event, selectionMeta) => {
    overrides?.onChangeRaw?.(event, selectionMeta)

    if (event && !event.defaultPrevented && event.target === datePickerRef.current?.input) {
      hasTypedInput.current = true
    }
  }
  const onCalendarClose = () => {
    hasTypedInput.current = false
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
      // Enter confirms typed input instead of opening the calendar over nearby controls.
      if (event.key === 'Enter' && hasTypedInput.current) {
        hasTypedInput.current = false
        datePickerRef.current.setOpen(false)
        return
      }
      shouldFocusCalendar.current = true
      datePickerRef.current?.setOpen(true)
    }
  }

  const onKeyDownCapture: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    // Cells handle Escape themselves, which can blur the input after we restore focus.
    // Intercept only the cell itself so nested controls can consume Escape.
    const isCalendarCell =
      event.target instanceof HTMLElement &&
      event.target.matches(
        '.react-datepicker__day, .react-datepicker__week-number, .react-datepicker__month-text, .react-datepicker__year-text',
      )

    if (
      event.key === 'Escape' &&
      (event.target === datePickerRef.current?.input || isCalendarCell) &&
      datePickerRef.current?.isCalendarOpen()
    ) {
      overrides?.onKeyDown?.(event)
      onEscape(event)
    }
  }

  return {
    calendarRef,
    datePickerRef,
    onBlur,
    onCalendarClose,
    onCalendarKeyDown,
    onCalendarOpen,
    onChangeRaw,
    onKeyDown,
    onKeyDownCapture,
  }
}
