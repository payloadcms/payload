import React, { Suspense, lazy } from 'react'

import type { Props } from './types'

import { ShimmerEffect } from '../../../elements/ShimmerEffect'

// @ts-expect-error Just TypeScript being broken // TODO: Open TypeScript issue
const RichText = lazy(() => import('./RichText'))

const RichTextField: React.FC<Props> = (props) => (
  <Suspense fallback={<ShimmerEffect height="35vh" />}>
    <RichText {...props} />
  </Suspense>
)

export default RichTextField
