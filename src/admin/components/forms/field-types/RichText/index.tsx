import React, { Suspense, lazy } from 'react';
import { ShimmerEffect } from '../../../elements/ShimmerEffect';
import { RichTextProvider } from './provider';
import { Props } from './types';

const RichText = lazy(() => import('./RichText'));

const RichTextField: React.FC<Props> = (props) => (
  <Suspense fallback={<ShimmerEffect height="35vh" />}>
    <RichTextProvider>
      <RichText {...props} />
    </RichTextProvider>
  </Suspense>
);

export default RichTextField;
