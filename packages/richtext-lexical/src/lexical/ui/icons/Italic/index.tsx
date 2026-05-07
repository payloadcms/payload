'use client'
import React from 'react'


const paths: Record<number, string> = {
  24: 'M10 6.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-2.083L11.6 17h1.9a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1h2.083L12.4 7h-1.9a.5.5 0 0 1-.5-.5',
}

export const ItalicIcon: React.FC<{
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
