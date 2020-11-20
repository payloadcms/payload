import React, { Suspense, lazy } from 'react';
import Loading from '../../../elements/Loading';

const ArrayField = lazy(() => import('./Array'));

export default (props) => (
  <Suspense fallback={<Loading />}>
    <ArrayField {...props} />
  </Suspense>
);
