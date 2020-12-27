import React from 'react';
import { Props } from './types';
import DatePicker from '../../../DatePicker';

const baseClass = 'condition-value-date';

const DateField: React.FC<Props> = ({ onChange, value }) => (
  <div className={baseClass}>
    <DatePicker
      onChange={onChange}
      value={value}
    />
  </div>
);

export default DateField;
