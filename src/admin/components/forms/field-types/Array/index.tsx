import React, { Suspense, lazy } from 'react';
import Loading from '../../../elements/Loading';
import { Props } from './types';

const ArrayField = lazy(() => import('./Array'));

const ArrayFieldType: React.FC<Props> = (props) => (
  <Suspense fallback={<Loading />}>
    <ArrayField {...props} />
  </Suspense>
);

export default ArrayFieldType;
