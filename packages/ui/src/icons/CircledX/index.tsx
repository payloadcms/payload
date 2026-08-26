import React from 'react'

import './index.css'

const paths = {
  16: 'M8 2a6 6 0 1 1 0 12A6 6 0 0 1 8 2m0 1a5 5 0 1 0 0 10A5 5 0 0 0 8 3m2.354 2.146a.5.5 0 0 1 0 .708L8.707 8l1.647 1.646a.5.5 0 0 1-.708.708L8 8.707l-1.646 1.647a.5.5 0 0 1-.708-.708L7.293 8 5.646 6.354a.5.5 0 1 1 .708-.708L8 7.293l1.646-1.647a.5.5 0 0 1 .708 0',
  24: 'M12 5a7 7 0 1 1 0 14 7 7 0 0 1 0-14m0 1a6 6 0 1 0 0 12 6 6 0 0 0 0-12m2.225 3.082a.5.5 0 0 1 .693.693l-.064.079L12.707 12l2.147 2.146.064.079a.5.5 0 0 1-.693.693l-.078-.064L12 12.707l-2.146 2.146a.5.5 0 1 1-.707-.707L11.293 12 9.147 9.854l-.065-.079a.5.5 0 0 1 .694-.693l.078.064L12 11.293l2.147-2.147z',
}

export const CircledXIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 16 }) => (
  <svg
    className={['icon', 'icon--circled-x', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
