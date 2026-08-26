'use client'
import React from 'react'

const paths = {
  16: 'M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2',
  24: 'M7.5 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m6 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m4.5 1.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3',
}

export const MeatballsIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 24 }) => (
  <svg
    className={className}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
