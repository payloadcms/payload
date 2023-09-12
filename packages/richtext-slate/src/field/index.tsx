import { ShimmerEffect } from 'payload/components'
import React, { Suspense, lazy } from 'react'

import type { Props } from '../types'

// @ts-expect-error Just TypeScript being broken // TODO: Open TypeScript issue
const RichTextEditor = lazy(() => import('./RichText'))

const RichTextField: React.FC<Props> = (props) => (
  <Suspense fallback={<ShimmerEffect height="35vh" />}>
    <RichTextEditor {...props} />
  </Suspense>
)

export default RichTextField
