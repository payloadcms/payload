import React from 'react'

import './index.css'

const paths = {
  16: 'M3.5 4.5h3v6h5M9 4.5h3.5M10.5 8.5l2 2-2 2',
  24: 'M5.5 7.5h6v8h6.5M13.5 7.5h5M16.5 13.5l2 2-2 2',
}

export const BranchIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 16 }) => (
  <svg
    className={['icon', 'icon--branch', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d={paths[size]} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
