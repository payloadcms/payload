import React, { Suspense, lazy } from 'react';
import { ShimmerEffect } from '../ShimmerEffect';
import { Props } from './types';

const LazyEditor = lazy(() => import('./CodeEditor'));

export const CodeEditor: React.FC<Props> = (props) => {
  const { height = '35vh' } = props;

  return (
    <Suspense fallback={<ShimmerEffect height={height} />}>
      <LazyEditor
        {...props}
        height={height}
      />
    </Suspense>
  );
};
