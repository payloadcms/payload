'use client'

import type { OptionObject } from 'payload'
import type React from 'react'

import { useMemo } from 'react'

import type { Props } from './types.js'

import { FieldLabel } from '../../fields/FieldLabel/index.js'
import './index.scss'
import { useTranslation } from '../../providers/Translation/index.js'
import { ReactSelect } from '../ReactSelect/index.js'
import { formatOptions } from '../WhereBuilder/Condition/Select/formatOptions.js'

export const TimezonePicker: React.FC<Props> = (props) => {
  const {
    id,
    onChange: onChangeFromProps,
    options: optionsFromProps,
    required,
    selectedTimezone: selectedTimezoneFromProps,
  } = props

  const { t } = useTranslation()

  const options = formatOptions(optionsFromProps)

  const selectedTimezone = useMemo(() => {
    return options.find((t) => {
      const value = typeof t === 'string' ? t : t.value
      return value === (selectedTimezoneFromProps || 'UTC')
    })
  }, [options, selectedTimezoneFromProps])

  return (
    <div className="timezone-picker-wrapper">
      <FieldLabel
        htmlFor={id}
        label={`${t('general:timezone')} ${required ? '*' : ''}`}
        required={required}
        unstyled
      />
      <ReactSelect
        className="timezone-picker"
        inputId={id}
        isClearable={true}
        isCreatable={false}
        onChange={(val: OptionObject) => {
          if (onChangeFromProps) {
            onChangeFromProps(val?.value || '')
          }
        }}
        options={options}
        value={selectedTimezone}
      />
    </div>
  )
}
