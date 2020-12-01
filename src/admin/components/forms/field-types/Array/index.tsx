import React, { Suspense, lazy } from 'react';
import Loading from '../../../elements/Loading';

const ArrayField = lazy(() => import('./Array'));

export default (props: unknown): React.ReactNode => (
  <Suspense fallback={<Loading />}>
    <ArrayField {...props} />
  </Suspense>
);
