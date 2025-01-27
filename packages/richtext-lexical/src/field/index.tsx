'use client'
import { ShimmerEffect } from 'payload/components'
import React, { Suspense, lazy } from 'react'

import type { FieldProps } from '../types'

// @ts-expect-error Just TypeScript being broken // TODO: Open TypeScript issue
const RichTextEditor = lazy(() => import('./Field'))

export const RichTextField: React.FC<FieldProps> = (props) => {
  return (
    <Suspense fallback={<ShimmerEffect height="35vh" />}>
      <RichTextEditor {...props} />
    </Suspense>
  )
}
