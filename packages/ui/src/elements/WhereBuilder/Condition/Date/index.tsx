'use client'
import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { DateFilterProps as Props } from './types.js'

import { useConfig } from '../../../../providers/Config/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { DatePickerField } from '../../../DatePicker/index.js'
import { getDateFilterValue } from '../../conditionValue.js'

const baseClass = 'condition-value-date'

export const DateFilter: React.FC<Props> = ({ disabled, field, onChange, operator, value }) => {
  const { admin, timezone } = field
  const { date } = admin || {}
  const {
    config: {
      admin: { dateFormat: dateFormatFromConfig, timezones },
    },
  } = useConfig()
  const { i18n, t } = useTranslation()

  const displayFormat = date?.displayFormat || dateFormatFromConfig
  const pickerAppearance = date?.pickerAppearance || 'default'
  const timezoneConfig = typeof timezone === 'object' ? timezone : timezone ? timezones : undefined
  const configuredTimezone = ['dayOnly', 'default'].includes(pickerAppearance)
    ? timezoneConfig?.defaultTimezone || 'UTC'
    : undefined

  return (
    <div className={baseClass}>
      <DatePickerField
        {...date}
        displayFormat={displayFormat}
        onChange={(date) =>
          onChange(
            date ? getDateFilterValue({ date, operator, timezone: configuredTimezone }) : date,
          )
        }
        placeholder={getTranslation(admin.placeholder, i18n) || t('general:enterAValue')}
        readOnly={disabled}
        value={value as Date}
      />
    </div>
  )
}
