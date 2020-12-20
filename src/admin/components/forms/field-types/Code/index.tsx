import React, { Suspense, lazy } from 'react';
import Loading from '../../../elements/Loading';

const Code = lazy(() => import('./Code'));

const CodeField: React.FC = (props) => (
  <Suspense fallback={<Loading />}>
    <Code {...props} />
  </Suspense>
);

export default CodeField;
