import React, { Suspense, lazy } from 'react';
import { ShimmerEffect } from '../../../elements/ShimmerEffect.js';
import { Props } from './types.js';

const RichText = lazy(() => import('./RichText'));

const RichTextField: React.FC<Props> = (props) => (
  <Suspense fallback={<ShimmerEffect height="35vh" />}>
    <RichText {...props} />
  </Suspense>
);

export default RichTextField;
