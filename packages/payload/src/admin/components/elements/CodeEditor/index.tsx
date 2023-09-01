import React, { Suspense, lazy } from 'react'

import type { Props } from './types'

import { ShimmerEffect } from '../ShimmerEffect'

const LazyEditor = lazy(() => import('./CodeEditor'))

export const CodeEditor: React.FC<Props> = (props) => {
  const { height = '35vh' } = props

  return (
    <Suspense fallback={<ShimmerEffect height={height} />}>
      <LazyEditor {...props} height={height} />
    </Suspense>
  )
}
