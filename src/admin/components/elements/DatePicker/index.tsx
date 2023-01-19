import React, { Suspense, lazy } from 'react';
import { ShimmerEffect } from '../ShimmerEffect';
import { Props } from './types';

const DatePicker = lazy(() => import('./DatePicker'));

const DatePickerField: React.FC<Props> = (props) => (
  <Suspense fallback={<ShimmerEffect height={50} />}>
    <DatePicker {...props} />
  </Suspense>
);

export default DatePickerField;
