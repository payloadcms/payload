'use client'
import React, { Suspense, lazy } from 'react'

import type { Props } from './types.js'

import { ShimmerEffect } from '../ShimmerEffect/index.js'

const DatePicker = lazy(() => import('./DatePicker.js'))

export const DatePickerField: React.FC<Props> = (props) => (
  <Suspense fallback={<ShimmerEffect height={50} />}>
    <DatePicker {...props} />
  </Suspense>
)
