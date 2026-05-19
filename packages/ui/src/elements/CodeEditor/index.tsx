'use client'
import React, { lazy, Suspense } from 'react'

import type { Props } from './types.js'

import { ShimmerEffect } from '../ShimmerEffect/index.js'

const LazyEditor = lazy(() => import('./CodeEditor.js'))

export type { Props }

export const CodeEditor: React.FC<Props> = (props) => {
  const minHeight = props.minHeight || 46
  return (
    <Suspense fallback={<ShimmerEffect height={minHeight} />}>
      <LazyEditor {...props} minHeight={minHeight} />
    </Suspense>
  )
}
