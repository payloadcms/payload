'use client'

import { useMemo } from 'react'
import { components as SelectComponents } from 'react-select'

import type { Props } from './types.js'

import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { ReactSelect } from '../ReactSelect/index.js'
import { timezones } from './timezones.js'
import './index.scss'

export const TimezonePicker = (props: Props) => {
  const {
    enabled,
    onChange: onChangeFromProps,
    selectedTimezone: selectedTimezoneFromProps,
  } = props

  const selectedTimezone = useMemo(() => {
    if (enabled) {
      return (
        timezones.find((t) => t.value === (selectedTimezoneFromProps || 'UTC')) ?? {
          label: 'UTC',
          value: 'UTC',
        }
      )
    }

    return { label: 'UTC', value: 'UTC' }
  }, [enabled, selectedTimezoneFromProps])

  return (
    <div className="timezone-picker-wrapper" suppressHydrationWarning>
      <FieldLabel htmlFor="timezone-picker" label={'Timezone:'} unstyled />
      <ReactSelect
        className="timezone-picker"
        inputId="timezone-picker"
        isClearable={false}
        // menuIsOpen={true}
        onChange={(val: (typeof timezones)[number]) => {
          if (onChangeFromProps) {
            onChangeFromProps(val.value)
          }
        }}
        options={timezones}
        value={selectedTimezone}
      />
    </div>
  )
}
