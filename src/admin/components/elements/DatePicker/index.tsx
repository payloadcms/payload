import React, { Suspense, lazy } from 'react';
import Loading from '../Loading';
import { Props } from './types';

const DatePicker = lazy(() => import('./DatePicker'));

const DatePickerField: React.FC<Props> = (props) => (
  <Suspense fallback={<Loading />}>
    <DatePicker {...props} />
  </Suspense>
);

export default DatePickerField;
