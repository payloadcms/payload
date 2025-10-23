'use client'
import React from 'react'

import type { DateFilterProps as Props } from './types.js'

import { DatePickerField } from '../../../DatePicker/index.js'

const baseClass = 'condition-value-date'

export const DateFilter: React.FC<Props> = ({ disabled, field: { admin }, onChange, value }) => {
  const { date } = admin || {}

  return (
    <div className={baseClass}>
      <DatePickerField {...date} onChange={onChange} readOnly={disabled} value={value as Date} />
    </div>
  )
}
