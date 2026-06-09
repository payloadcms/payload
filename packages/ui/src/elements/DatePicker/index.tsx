'use client'
import React, { lazy, Suspense } from 'react'

import type { Props } from './types.js'

import { ShimmerEffect } from '../ShimmerEffect/index.js'

const DatePicker = lazy(() => import('./DatePicker.js'))

export const DatePickerField: React.FC<Props> = (props) => (
  <Suspense fallback={<ShimmerEffect height="var(--field-min-height)" />}>
    <DatePicker {...props} />
  </Suspense>
)
