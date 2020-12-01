import React, { Suspense, lazy } from 'react';
import Loading from '../Loading';

const DatePicker = lazy(() => import('./DatePicker'));

export default (props: unknown): React.ReactNode => (
  <Suspense fallback={<Loading />}>
    <DatePicker {...props} />
  </Suspense>
);
