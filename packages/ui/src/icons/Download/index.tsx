import React from 'react'

import './index.css'

const paths: Record<16 | 24, string> = {
  16: 'M8 2.5a.5.5 0 0 0-1 0v5.793L5.354 6.646a.5.5 0 1 0-.707.708l2.5 2.5a.5.5 0 0 0 .707 0l2.5-2.5a.5.5 0 0 0-.707-.708L8 8.293zm-4 8a.5.5 0 0 0-1 0v1A1.5 1.5 0 0 0 4.5 13h6a1.5 1.5 0 0 0 1.5-1.5v-1a.5.5 0 0 0-1 0v1a.5.5 0 0 1-.5.5h-6a.5.5 0 0 1-.5-.5z',
  24: 'M17.5 15a.5.5 0 0 1 .5.5v1a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 16.5v-1a.5.5 0 0 1 1 0v1a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 1 .5-.5M12 5a.5.5 0 0 1 .5.5v7.793l2.646-2.646a.5.5 0 1 1 .707.707l-3.5 3.5a.5.5 0 0 1-.707 0l-3.5-3.5a.5.5 0 1 1 .708-.707l2.646 2.646V5.5A.5.5 0 0 1 12 5',
}

export const DownloadIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 24 }) => (
  <svg
    aria-hidden="true"
    className={['icon', 'icon--download', className].filter(Boolean).join(' ')}
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
