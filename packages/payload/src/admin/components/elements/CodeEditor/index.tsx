import React, { Suspense, lazy } from 'react'

import type { Props } from './types'

import { ShimmerEffect } from '../ShimmerEffect'

// @ts-expect-error Just TypeScript being broken // TODO: Open TypeScript issue
const LazyEditor = lazy(() => import('./CodeEditor'))

export const CodeEditor: React.FC<Props> = (props) => {
  const { height = '35vh' } = props

  return (
    <Suspense fallback={<ShimmerEffect height={height} />}>
      <LazyEditor {...props} height={height} />
    </Suspense>
  )
}
