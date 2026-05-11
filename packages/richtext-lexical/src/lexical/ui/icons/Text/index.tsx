'use client'
import React from 'react'

const paths = {
  16: 'M3 3.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5V5a.5.5 0 0 1-1 0V4H8.5v8h1a.5.5 0 0 1 0 1h-3a.5.5 0 0 1 0-1h1V4H4v1a.5.5 0 0 1-1 0z',
  24: 'M6 6.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5V9a.5.5 0 0 1-1 0V7h-4.5v10h2a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1h2V7H7v2a.5.5 0 0 1-1 0z',
}

export const TextIcon: React.FC<{
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
