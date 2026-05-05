import React from 'react'

import './index.css'

const paths = {
  16: 'M4 11a1 1 0 1 1 0 2 1 1 0 0 1 0-2m8.6.51a.5.5 0 0 1 0 .98l-.1.01h-5a.5.5 0 0 1 0-1h5zM4 7a1 1 0 1 1 0 2 1 1 0 0 1 0-2m8.6.51a.5.5 0 0 1 0 .98l-.1.01h-5a.5.5 0 0 1 0-1h5zM4 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2m8.6.51a.5.5 0 0 1 0 .98l-.1.01h-5a.5.5 0 0 1 0-1h5z',
  24: 'M6 7a1 1 0 1 1 2 0 1 1 0 0 1-2 0m4.5-.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1zm0 10a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1zm0-5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1zM6 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0m1 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2',
}

export const ListViewIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 24 }) => (
  <svg
    className={['icon', 'icon--list-view', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
