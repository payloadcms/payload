'use client'
import React from 'react'

const paths: Record<number, string> = {
  24: 'M7.854 6.146a.5.5 0 1 0-.708.708L8.293 8H5.5a.5.5 0 0 0 0 1h2.793l-1.147 1.146a.5.5 0 0 0 .708.708l2-2a.5.5 0 0 0 0-.708zM11.5 8a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1zM5 12.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5m.5 3.5a.5.5 0 0 0 0 1h13a.5.5 0 0 0 0-1z',
}

export const IndentDecreaseIcon: React.FC<{
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
    <g transform={`scale(-1, 1) translate(-${size}, 0)`}>
      <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
    </g>
  </svg>
)
