import React from 'react'

import './index.css'

const paths = {
  16: 'M4 7.5H12V8.5H4Z',
  24: 'M6 11.5H18V12.5H6Z',
}

export const LineIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 24 }) => (
  <svg
    className={['icon', 'icon--line', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
