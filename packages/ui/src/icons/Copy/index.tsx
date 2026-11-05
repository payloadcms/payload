import React from 'react'

import './index.css'

const paths = {
  16: 'M3.5 2A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5v1.5A1.5 1.5 0 0 0 6.5 14h6a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 12.5 5H11V3.5A1.5 1.5 0 0 0 9.5 2zM11 6v3.5A1.5 1.5 0 0 1 9.5 11H6v1.5a.5.5 0 0 0 .5.5h6a.5.5 0 0 0 .5-.5v-6a.5.5 0 0 0-.5-.5zM3 3.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-.5.5h-6a.5.5 0 0 1-.5-.5z',
  24: 'M7.5 6A1.5 1.5 0 0 0 6 7.5v6A1.5 1.5 0 0 0 7.5 15h6a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 13.5 6zM7 7.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-.5.5h-6a.5.5 0 0 1-.5-.5zm2 9a.5.5 0 0 1 1 0 .5.5 0 0 0 .5.5h6a.5.5 0 0 0 .5-.5v-6a.5.5 0 0 0-.5-.5.5.5 0 0 1 0-1 1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 9 16.5',
}

export const CopyIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 24 }) => (
  <svg
    className={['icon', 'icon--copy', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
