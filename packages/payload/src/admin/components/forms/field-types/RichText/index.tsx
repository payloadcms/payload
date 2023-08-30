import React, { Suspense, lazy } from 'react';

import type { Props } from './types.js';

import { ShimmerEffect } from '../../../elements/ShimmerEffect/index.js';

const RichText = lazy(() => import('./RichText.js'));

const RichTextField: React.FC<Props> = (props) => (
  <Suspense fallback={<ShimmerEffect height="35vh" />}>
    <RichText {...props} />
  </Suspense>
);

export default RichTextField;
