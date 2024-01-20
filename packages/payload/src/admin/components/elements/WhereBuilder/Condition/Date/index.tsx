import React from 'react'

import type { Props } from './types'

import DatePicker from '../../../DatePicker'

const baseClass = 'condition-value-date'

const DateField: React.FC<Props> = ({ admin, disabled, onChange, value }) => {
  const { date } = admin || {}

  return (
    <div className={baseClass}>
      <DatePicker {...date} onChange={onChange} readOnly={disabled} value={value} />
    </div>
  )
}

export default DateField
