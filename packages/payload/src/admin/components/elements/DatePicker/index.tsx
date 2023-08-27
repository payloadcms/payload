import React, { Suspense, lazy } from 'react';
import { ShimmerEffect } from '../ShimmerEffect/index.js';
import { Props } from './types.js';

const DatePicker = lazy(() => import('./DatePicker.js'));

const DatePickerField: React.FC<Props> = (props) => (
  <Suspense fallback={<ShimmerEffect height={50} />}>
    <DatePicker {...props} />
  </Suspense>
);

export default DatePickerField;
