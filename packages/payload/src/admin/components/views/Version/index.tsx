import React, { Suspense, lazy } from 'react';

import type { Props } from './types';

import { LoadingOverlayToggle } from '../../elements/Loading';

const VersionView = lazy(() => import('./Version'));

const Version: React.FC<Props> = (props) => (
  <Suspense fallback={(
    <LoadingOverlayToggle
      name="version-suspense"
      show
    />
  )}
  >
    <VersionView {...props} />
  </Suspense>
);

export default Version;
