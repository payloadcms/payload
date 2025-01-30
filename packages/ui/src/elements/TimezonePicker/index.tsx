'use client'

import { useMemo } from 'react'

import type { Props } from './types.js'

import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { ReactSelect } from '../ReactSelect/index.js'
import './index.scss'
import { timezones } from './timezones.js'

export const TimezonePicker = (props: Props) => {
  const {
    enabled,
    onChange: onChangeFromProps,
    selectedTimezone: selectedTimezoneFromProps,
  } = props

  const { t } = useTranslation()

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
      <FieldLabel htmlFor="timezone-picker" label={`${t('general:timezone')}`} unstyled />
      <ReactSelect
        className="timezone-picker"
        inputId="timezone-picker"
        isClearable={false}
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
