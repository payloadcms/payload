import React from 'react'

import './index.css'

const paths = {
  // Logout icon - door with arrow pointing out
  16: 'M9 3h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9a.5.5 0 0 1 0-1h3V4H9a.5.5 0 0 1 0-1M5.854 5.146a.5.5 0 0 1 0 .708L4.207 7.5H9a.5.5 0 0 1 0 1H4.207l1.647 1.646a.5.5 0 0 1-.708.708l-2.5-2.5a.5.5 0 0 1 0-.708l2.5-2.5a.5.5 0 0 1 .708 0',
  24: 'M14 5h3a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-3a.5.5 0 0 1 0-1h3V6h-3a.5.5 0 0 1 0-1M8.854 8.146a.5.5 0 0 1 0 .708L6.707 11H14a.5.5 0 0 1 0 1H6.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 0 1 .708 0',
}

export const LogOutIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 24 }) => (
  <svg
    className={['icon', 'icon--logout', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
