'use client'

import { useMemo } from 'react'

import type { Props } from './types.js'

import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { ReactSelect } from '../ReactSelect/index.js'
import './index.scss'
import { timezones } from './timezones.js'

export const TimezonePicker = (props: Props) => {
  const { id, onChange: onChangeFromProps, selectedTimezone: selectedTimezoneFromProps } = props

  const { t } = useTranslation()

  const selectedTimezone = useMemo(() => {
    return timezones.find((t) => t.value === (selectedTimezoneFromProps || 'UTC'))
  }, [selectedTimezoneFromProps])

  return (
    <div className="timezone-picker-wrapper">
      <FieldLabel htmlFor={id} label={`${t('general:timezone')}`} unstyled />
      <ReactSelect
        className="timezone-picker"
        inputId={id}
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
