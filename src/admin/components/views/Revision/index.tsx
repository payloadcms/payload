import React, { Suspense, lazy } from 'react';
import Loading from '../../elements/Loading';
import { Props } from './types';

const RevisionView = lazy(() => import('./Revision'));

const Revision: React.FC<Props> = (props) => (
  <Suspense fallback={<Loading />}>
    <RevisionView {...props} />
  </Suspense>
);

export default Revision;
