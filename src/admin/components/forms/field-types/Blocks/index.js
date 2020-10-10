import React, { Suspense, lazy } from 'react';
import Loading from '../../../elements/Loading';

const Blocks = lazy(() => import('./Blocks'));

export default (props) => (
  <Suspense fallback={<Loading />}>
    <Blocks {...props} />
  </Suspense>
);
