import React, { Suspense, lazy } from 'react';
import { ShimmerEffect } from '../ShimmerEffect/index.js';
import { Props } from './types.js';

const LazyEditor = lazy(() => import('./CodeEditor.js'));

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
