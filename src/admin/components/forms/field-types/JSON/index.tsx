import React, { Suspense, lazy } from 'react';
import { Loading } from '../../../elements/Loading';
import { Props } from './types';

const JSON = lazy(() => import('./JSON'));

const JSONField: React.FC<Props> = (props) => (
  <Suspense fallback={<Loading />}>
    <JSON {...props} />
  </Suspense>
);

export default JSONField;
