'use client'
import React from 'react'


const paths: Record<number, string> = {
  24: 'M9 7.5a.5.5 0 0 0-1 0V12a4 4 0 0 0 8 0V7.5a.5.5 0 0 0-1 0V12a3 3 0 1 1-6 0zM16.5 19a.5.5 0 0 0 0-1h-9a.5.5 0 0 0 0 1z',
}

export const UnderlineIcon: React.FC<{
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
