import React, { Suspense, lazy } from 'react'

import type { Props } from './types'

import { LoadingOverlayToggle } from '../../elements/Loading'

// @ts-expect-error Just TypeScript being broken // TODO: Open TypeScript issue
const VersionView = lazy(() => import('./Version'))

const Version: React.FC<Props> = (props) => (
  <Suspense fallback={<LoadingOverlayToggle name="version-suspense" show />}>
    <VersionView {...props} />
  </Suspense>
)

export default Version
