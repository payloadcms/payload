import React from 'react'

import type { Props } from './types.js'

import DatePicker from '../../../DatePicker/index.js'

const baseClass = 'condition-value-date'

const DateField: React.FC<Props> = ({ onChange, value }) => (
  <div className={baseClass}>
    <DatePicker onChange={onChange} value={value} />
  </div>
)

export default DateField
