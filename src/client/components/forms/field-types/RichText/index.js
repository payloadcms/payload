import React, { Suspense, lazy } from 'react';
import Loading from '../../../elements/Loading';

const RichText = lazy(() => import('./RichText'));

export default (props) => (
  <Suspense fallback={<Loading />}>
    <RichText {...props} />
  </Suspense>
);
