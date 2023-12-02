import React, { Suspense, lazy } from 'react'

import type { Props } from './types'

import { ShimmerEffect } from '../ShimmerEffect'

// @ts-expect-error Just TypeScript being broken // TODO: Open TypeScript issue
const DatePicker = lazy(() => import('./DatePicker'))

const DatePickerField: React.FC<Props> = (props) => (
  <Suspense fallback={<ShimmerEffect height={50} />}>
    <DatePicker {...props} />
  </Suspense>
)

export default DatePickerField
