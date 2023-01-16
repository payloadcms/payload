import React, { Suspense, lazy } from 'react';
import { Loading } from '../../elements/Loading';
import { Props } from './types';

const VersionView = lazy(() => import('./Version'));

const Version: React.FC<Props> = (props) => (
  <Suspense fallback={<Loading />}>
    <VersionView {...props} />
  </Suspense>
);

export default Version;
