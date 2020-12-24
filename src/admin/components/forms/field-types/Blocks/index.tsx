import React, { Suspense, lazy } from 'react';
import Loading from '../../../elements/Loading';
import { Props } from './types';

const Blocks = lazy(() => import('./Blocks'));

const BlocksField: React.FC<Props> = (props) => (
  <Suspense fallback={<Loading />}>
    <Blocks {...props} />
  </Suspense>
);

export default BlocksField;
