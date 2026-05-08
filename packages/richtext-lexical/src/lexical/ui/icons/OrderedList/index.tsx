'use client'
import React from 'react'

const paths = {
  16: 'M5.6 9.01a.5.5 0 0 1 .4.49v1a.5.5 0 0 1-.276.447L4 11.81V12h1.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5v-1l.005-.07a.5.5 0 0 1 .271-.377L5 10.19V10H3.5a.5.5 0 0 1 0-1h2zM12.5 12a.5.5 0 0 1 0 1h-4a.5.5 0 0 1 0-1zm0-4.5a.5.5 0 0 1 0 1h-4a.5.5 0 0 1 0-1zM4.6 3.01a.5.5 0 0 1 .4.49v3a.5.5 0 0 1-1 0V4h-.5a.5.5 0 0 1 0-1h1zM12.5 3a.5.5 0 0 1 0 1h-4a.5.5 0 0 1 0-1z',
  24: 'M11 7a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6A.5.5 0 0 1 11 7M6 7a.5.5 0 0 1 .5-.5h1A.5.5 0 0 1 8 7v3.5a.5.5 0 1 1-1 0v-3h-.5A.5.5 0 0 1 6 7m0 6.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5V15a.5.5 0 0 1-.276.447L7 16.31v.191h1.5a.5.5 0 0 1 0 1h-2A.5.5 0 0 1 6 17v-1a.5.5 0 0 1 .276-.447L8 14.69V14H6.5a.5.5 0 0 1-.5-.5m5.5 3a.5.5 0 1 0 0 1h6a.5.5 0 0 0 0-1zm0-5a.5.5 0 1 0 0 1h6a.5.5 0 0 0 0-1z',
}

export const OrderedListIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 24 }) => (
  <svg
    aria-hidden="true"
    className={['icon', className].filter(Boolean).join(' ')}
    fill="none"
    focusable="false"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
