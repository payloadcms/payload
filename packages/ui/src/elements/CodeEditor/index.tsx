'use client'
import React, { lazy, Suspense } from 'react'

import type { Props } from './types.js'

import { ShimmerEffect } from '../ShimmerEffect/index.js'

const LazyEditor = lazy(() => import('./CodeEditor.js'))

export type { Props }

export const CodeEditor: React.FC<Props> = (props) => {
  const { height = '35vh' } = props

  return (
    <Suspense fallback={<ShimmerEffect height={height} />}>
      <LazyEditor {...props} height={height} />
    </Suspense>
  )
}
