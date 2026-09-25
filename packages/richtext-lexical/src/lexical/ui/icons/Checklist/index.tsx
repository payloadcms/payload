'use client'
import React from 'react'

const paths = {
  16: 'M5.584 8.223a.5.5 0 0 1 .832.554l-2 3a.502.502 0 0 1-.77.076l-1-1a.5.5 0 1 1 .708-.707l.568.569zM13 10a.5.5 0 0 1 0 1H8a.5.5 0 0 1 0-1zM5.583 3.223a.5.5 0 0 1 .832.554l-2 3a.502.502 0 0 1-.77.076l-1-1a.5.5 0 0 1 .708-.707l.568.569zM13 5a.5.5 0 1 1 0 1H8a.5.5 0 0 1 0-1z',
  24: 'M9.084 15.223a.5.5 0 1 1 .832.554l-2 3a.5.5 0 0 1-.77.076l-1-1a.5.5 0 1 1 .708-.707l.568.569zM17.5 17a.5.5 0 0 1 0 1h-6a.5.5 0 0 1 0-1zm-8.416-6.777a.5.5 0 0 1 .832.554l-2 3a.5.5 0 0 1-.77.077l-1-1a.5.5 0 1 1 .708-.707l.568.568zM17.5 12a.5.5 0 0 1 0 1h-6a.5.5 0 0 1 0-1zM9.084 5.223a.5.5 0 0 1 .832.554l-2 3a.502.502 0 0 1-.77.077l-1-1a.5.5 0 1 1 .708-.708l.568.569zM17.5 7a.5.5 0 0 1 0 1h-6a.5.5 0 0 1 0-1z',
}

export const ChecklistIcon: React.FC<{
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
    <path d={paths[size]} fill="currentColor" />
  </svg>
)
