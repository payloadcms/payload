import React, { Suspense, lazy } from 'react';
import { LoadingOverlayToggle } from '../../elements/Loading/index.js';
import { Props } from './types.js';

const VersionView = lazy(() => import('./Version.js'));

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
