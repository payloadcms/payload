'use client'

import { TimezonePicker } from '@payloadcms/ui'
import React, { useState } from 'react'

import { Section, Variant } from '../../shared.js'

const timezoneOptions = [
  { label: '(UTC-11:00) Midway Island, Samoa', value: 'Pacific/Midway' },
  { label: '(UTC-10:00) Hawaii', value: 'Pacific/Honolulu' },
  { label: '(UTC-08:00) Pacific Time (US & Canada)', value: 'America/Los_Angeles' },
  { label: '(UTC-07:00) Mountain Time (US & Canada)', value: 'America/Denver' },
  { label: '(UTC-06:00) Central Time (US & Canada)', value: 'America/Chicago' },
  { label: '(UTC-05:00) Eastern Time (US & Canada)', value: 'America/New_York' },
  { label: '(UTC+00:00) London (GMT)', value: 'Europe/London' },
  { label: '(UTC+01:00) Berlin, Paris', value: 'Europe/Berlin' },
  { label: '(UTC+09:00) Tokyo, Osaka, Sapporo', value: 'Asia/Tokyo' },
  { label: '(UTC+10:00) Sydney, Melbourne', value: 'Australia/Sydney' },
]

const TimezonePickerDemo: React.FC<{
  defaultValue?: string
  id: string
  readOnly?: boolean
  required?: boolean
}> = ({ id, defaultValue, readOnly, required }) => {
  const [value, setValue] = useState(defaultValue)

  return (
    <TimezonePicker
      id={id}
      onChange={setValue}
      options={timezoneOptions}
      readOnly={readOnly}
      required={required}
      selectedTimezone={value}
    />
  )
}

export const TimezonePickerFieldSection: React.FC = () => (
  <Section id="timezone-picker" selectedComponent="timezone-picker" title="Timezone Picker">
    <Variant label="Default">
      <TimezonePickerDemo id="timezone-default" />
    </Variant>
    <Variant label="With Value">
      <TimezonePickerDemo defaultValue="America/New_York" id="timezone-with-value" />
    </Variant>
    <Variant label="Required">
      <TimezonePickerDemo id="timezone-required" required />
    </Variant>
    <Variant label="Read Only">
      <TimezonePickerDemo defaultValue="Europe/London" id="timezone-readonly" readOnly />
    </Variant>
  </Section>
)
