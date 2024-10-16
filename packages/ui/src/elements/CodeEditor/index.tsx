'use client'
import React, { lazy, Suspense } from 'react'

import type { Props } from './types.js'

import { ShimmerEffect } from '../ShimmerEffect/index.js'

const LazyEditor = lazy(() => import('./CodeEditor.js'))

export type { Props }

export const CodeEditor: React.FC<Props> = (props) => {
  return (
    <Suspense fallback={<ShimmerEffect />}>
      <LazyEditor {...props} />
    </Suspense>
  )
}
