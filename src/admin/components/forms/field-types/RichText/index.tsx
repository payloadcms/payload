import React, { Suspense, lazy } from 'react';
import { Loading } from '../../../elements/Loading';
import { Props } from './types';

const RichText = lazy(() => import('./RichText'));

const RichTextField: React.FC<Props> = (props) => (
  <Suspense fallback={<Loading />}>
    <RichText {...props} />
  </Suspense>
);

export default RichTextField;
