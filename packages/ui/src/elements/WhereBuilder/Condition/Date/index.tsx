'use client'
import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { DateFilterProps as Props } from './types.js'

import { useTranslation } from '../../../../providers/Translation/index.js'
import { DatePickerField } from '../../../DatePicker/index.js'

const baseClass = 'condition-value-date'

export const DateFilter: React.FC<Props> = ({ disabled, field: { admin }, onChange, value }) => {
  const { date } = admin || {}
  const { i18n, t } = useTranslation()

  return (
    <div className={baseClass}>
      <DatePickerField
        {...date}
        onChange={onChange}
        placeholder={getTranslation(admin.placeholder, i18n) || t('general:enterAValue')}
        readOnly={disabled}
        value={value as Date}
      />
    </div>
  )
}
