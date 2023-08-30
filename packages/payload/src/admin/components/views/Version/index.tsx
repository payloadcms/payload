import React, { Suspense, lazy } from 'react';

import type { Props } from './types.js';

import { LoadingOverlayToggle } from '../../elements/Loading/index.js';

const VersionView = lazy(() => import('./Version.js'));

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
