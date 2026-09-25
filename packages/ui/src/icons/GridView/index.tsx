import React from 'react'

import './index.css'

const paths = {
  16: 'M3 3h4v4H3zM2 3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1zm1 6h4v4H3zm-1 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1zm10-6H9v4h3zm-3-1a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zm0 7h3v4H9zm-1 0a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z',
  24: 'M7 7h3v3H7zM6 7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zm1 7h3v3H7zm-1 0a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zm11-7h-3v3h3zm-3-1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1zm0 8h3v3h-3zm-1 0a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1z',
}

export const GridViewIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 24 }) => (
  <svg
    className={['icon', 'icon--grid-view', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
