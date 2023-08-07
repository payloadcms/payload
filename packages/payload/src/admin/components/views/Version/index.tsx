import React, { Suspense, lazy } from 'react';
import { LoadingOverlayToggle } from '../../elements/Loading';
import { Props } from './types';

const VersionView = lazy(() => import('./Version'));

const Version: React.FC<Props> = (props) => (
  <Suspense fallback={(
    <LoadingOverlayToggle
      show
      name="version-suspense"
    />
  )}
  >
    <VersionView {...props} />
  </Suspense>
);

export default Version;
