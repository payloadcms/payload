import React, { Suspense, lazy } from 'react';
import Loading from '../../../elements/Loading';

const CodeField = lazy(() => import('./Code'));

export default (props) => (
  <Suspense fallback={<Loading />}>
    <CodeField {...props} />
  </Suspense>
);
