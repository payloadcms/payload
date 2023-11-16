import React from 'react'

import type { Props } from './types'

import DatePicker from '../../../DatePicker'

const baseClass = 'condition-value-date'

const DateField: React.FC<Props> = ({ disabled, onChange, value }) => (
  <div className={baseClass}>
    <DatePicker onChange={onChange} readOnly={disabled} value={value} />
  </div>
)

export default DateField
