import React, { Suspense, lazy } from 'react';
import Loading from '../../../elements/Loading';
import { Props } from './types';

const Code = lazy(() => import('./Code'));

const CodeField: React.FC<Props> = (props) => (
  <Suspense fallback={<Loading />}>
    <Code {...props} />
  </Suspense>
);

export default CodeField;
