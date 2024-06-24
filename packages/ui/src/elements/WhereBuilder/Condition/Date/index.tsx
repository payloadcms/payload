'use client'
import React from 'react'

import type { Props } from './types.js'

import { DatePickerField } from '../../../DatePicker/index.js'

const baseClass = 'condition-value-date'

export const DateField: React.FC<Props> = ({ admin, disabled, onChange, value }) => {
  const { date } = admin || {}

  return (
    <div className={baseClass}>
      <DatePickerField {...date} onChange={onChange} readOnly={disabled} value={value} />
    </div>
  )
}
